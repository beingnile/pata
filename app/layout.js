import { JetBrains_Mono } from 'next/font/google'
import './globals.css'
import Providers from './Providers'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
})

export const metadata = {
  title: 'Pata - Tax Intelligence for Kenyans',
  description:
    'Decode your Kenyan payslip, organize business receipts, compare freelancer tax regimes, and find legal ways to pay less tax.',
  keywords: [
    'Kenya tax',
    'PAYE calculator',
    'KRA',
    'payslip decoder',
    'tax optimization',
    'receipt scanner',
    'freelancer tax',
    'Turnover Tax',
    'withholding tax',
    'KRA filing',
    'NSSF',
    'SHIF',
    'Housing Levy',
  ],
  icons: {
    icon: '/favicon.svg',
    apple: '/apple-icon.svg',
  },
  openGraph: {
    title: 'Pata - Tax Intelligence for Kenyans',
    description: 'Know where your money goes. Keep more of it.',
    type: 'website',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${jetbrainsMono.variable} font-mono antialiased`}>
        <Providers>
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
