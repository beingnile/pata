import { JetBrains_Mono } from 'next/font/google'
import './globals.css'
import Providers from './Providers'

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
})

export const metadata = {
  title: 'Pata - Tax Intelligence for Kenyans',
  description:
    'Decode your Kenyan payslip, figure out your real take-home, and find legal ways to pay less tax.',
  keywords: ['Kenya tax', 'PAYE calculator', 'KRA', 'payslip decoder', 'tax optimization'],
  icons: {
    icon: '/favicon.svg',
    apple: '/apple-icon.svg',
  },
  openGraph: {
    title: 'Pata - Tax Intelligence for Kenyans',
    description: 'Know where your salary goes. Keep more of it.',
    type: 'website',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${jetbrainsMono.variable} font-mono antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
