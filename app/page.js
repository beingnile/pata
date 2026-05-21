import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="max-w-2xl text-center">
        <h1 className="font-mono text-7xl font-bold mb-4">PATA</h1>
        <p className="font-mono text-2xl mb-6">Tax intelligence for Kenyans</p>
        <p className="font-mono text-lg text-gray-400 mb-12">
          Understand your payslip, find money you are leaving on the table, and keep more of what you earn.
        </p>

        <div className="space-y-4">
          <Link
            href="/tools/payslip"
            className="block bg-red-600 text-white font-mono text-lg px-12 py-4 border-2 border-white hover:bg-white hover:text-black transition-colors uppercase"
          >
            Decode My Payslip
          </Link>

          <Link
            href="/blog"
            className="block bg-black text-white font-mono text-lg px-12 py-4 border-2 border-white hover:bg-white hover:text-black transition-colors uppercase"
          >
            Read the Blog
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          <Feature
            number="01"
            title="Payslip Decoder"
            description="Punch in your gross salary. See exactly how much goes to PAYE, NSSF, SHIF, and Housing Levy — line by line."
          />
          <Feature
            number="02"
            title="Tax Optimizer"
            description="Simulate what happens if you bump your pension, get insurance, or start saving for a house. Real numbers, no fluff."
          />
          <Feature
            number="03"
            title="Built for Kenya"
            description="KRA rates. Real deductions. No generic calculators that do not know what SHIF is."
          />
        </div>
      </div>
    </div>
  )
}

function Feature({ number, title, description }) {
  return (
    <div className="border border-gray-700 p-4">
      <span className="font-mono text-red-600 text-sm">{number}</span>
      <h3 className="font-mono font-bold text-lg mt-2 mb-1">{title}</h3>
      <p className="font-mono text-sm text-gray-400">{description}</p>
    </div>
  )
}
