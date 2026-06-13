import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { validateCredentials, ensureOAuthUser } from './auth'

export const authConfig = {
  providers: [
    CredentialsProvider({
      name: 'Email and password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const result = await validateCredentials(
          credentials?.email || '',
          credentials?.password || ''
        )
        if (result.success && result.user) {
          return { id: result.user.email, email: result.user.email }
        }
        return null
      },
    }),
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID || '',
      clientSecret: process.env.AUTH_GOOGLE_SECRET || '',
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    newUser: '/account',
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google' && user.email) {
        await ensureOAuthUser(user.email)
      }
      return true
    },
    async jwt({ token, user }) {
      if (user?.email) {
        token.email = user.email
      }
      return token
    },
    async session({ session, token }) {
      if (token.email) {
        session.user.email = token.email
      }
      return session
    },
  },
  secret: process.env.AUTH_SECRET,
  trustHost: process.env.AUTH_TRUST_HOST === 'true',
}
