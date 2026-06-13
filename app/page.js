import Link from 'next/link'

export default function Home() {
  return (
    <div className="bg-black text-white">
      {/* Hero */}
      <section className="min-h-[70vh] flex items-center justify-center px-6 py-20 border-b-2 border-white">
        <div className="max-w-3xl text-center">
          <h1 className="font-mono text-7xl md:text-8xl font-bold mb-6">PATA</h1>
          <p className="font-mono text-2xl md:text-3xl mb-6">Tax intelligence for Kenyans</p>
          <p className="font-mono text-lg text-gray-400 mb-12 max-w-xl mx-auto">
            Understand your payslip, organize receipts, and know what you owe KRA — without the
            accounting jargon.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/tools"
              className="bg-red-600 text-white font-mono text-lg px-10 py-4 border-2 border-white hover:bg-white hover:text-black transition-colors uppercase"
            >
              Explore tools
            </Link>
            <Link
              href="/blog"
              className="bg-black text-white font-mono text-lg px-10 py-4 border-2 border-white hover:bg-white hover:text-black transition-colors uppercase"
            >
              Read the blog
            </Link>
          </div>
        </div>
      </section>

      {/* For Employees */}
      <section className="px-6 py-16 border-b-2 border-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <span className="font-mono text-red-600 text-sm border border-red-600 px-2 py-1">01</span>
            <h2 className="font-mono text-2xl md:text-3xl font-bold">For Employees</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FeatureCard
              href="/tools/payslip"
              title="Tax Calculator"
              description="Punch in your gross salary. See exactly how much goes to PAYE, NSSF, SHIF, and Housing Levy line by line."
              cta="Calculate my tax"
            />
            <FeatureCard
              href="/tools/payslip/optimize"
              title="Tax Optimizer"
              description="Simulate pension, insurance, mortgage interest, and HOSP to see how much tax you can legally keep."
              cta="Optimize"
              price="KSH 50"
            />
          </div>
        </div>
      </section>

      {/* For Business Owners */}
      <section className="px-6 py-16 border-b-2 border-white bg-white text-black">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <span className="font-mono text-red-600 text-sm border border-red-600 px-2 py-1">02</span>
            <h2 className="font-mono text-2xl md:text-3xl font-bold">For Business Owners</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FeatureCard
              href="/tools/receipts"
              title="Receipt Vault"
              description="Snap or upload receipts and PDFs. OCR extracts merchant, totals, dates, and KRA details. Download a ZIP archive with JSON and CSV."
              cta="Scan receipts"
              price="3 free, then KSH 500/mo"
              dark
            />
          </div>
        </div>
      </section>

      {/* For Freelancers */}
      <section className="px-6 py-16 border-b-2 border-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <span className="font-mono text-red-600 text-sm border border-red-600 px-2 py-1">03</span>
            <h2 className="font-mono text-2xl md:text-3xl font-bold">For Freelancers</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FeatureCard
              href="/tools/freelancer"
              title="Freelancer Tax Guide"
              description="Compare Turnover Tax vs Standard Income Tax, estimate withholding tax, check VAT thresholds, and see your filing checklist."
              cta="Check my taxes"
            />
          </div>
        </div>
      </section>

      {/* Why PATA */}
      <section className="px-6 py-16 border-b-2 border-white bg-red-600 text-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-mono text-2xl md:text-3xl font-bold mb-8 text-center">Why PATA?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ValueCard
              title="Built for Kenya"
              description="PAYE, NSSF, SHIF, Housing Levy, TOT, WHT — all using current KRA guidance."
            />
            <ValueCard
              title="Private by default"
              description="Receipt OCR happens in your browser. Your documents never leave your device."
            />
            <ValueCard
              title="Pay for what you use"
              description="Most tools are free. Premium features cost less than one hour with an accountant."
            />
          </div>
        </div>
      </section>
    </div>
  )
}

function FeatureCard({ href, title, description, cta, price, dark = false }) {
  return (
    <div
      className={`border-2 border-black p-6 flex flex-col ${
        dark ? 'bg-black text-white border-white' : 'bg-white text-black'
      }`}
    >
      <h3 className="font-mono text-xl font-bold mb-2">{title}</h3>
      <p className="font-mono text-sm text-gray-600 mb-6 flex-1">{description}</p>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Link
          href={href}
          className={`inline-block font-mono text-sm px-6 py-3 border-2 transition-colors uppercase text-center ${
            dark
              ? 'bg-red-600 text-white border-red-600 hover:bg-white hover:text-black hover:border-white'
              : 'bg-black text-white border-black hover:bg-red-600 hover:border-red-600'
          }`}
        >
          {cta}
        </Link>
        {price && (
          <span className={`font-mono text-xs ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
            {price}
          </span>
        )}
      </div>
    </div>
  )
}

function ValueCard({ title, description }) {
  return (
    <div className="border-2 border-white p-6">
      <h3 className="font-mono text-lg font-bold mb-2">{title}</h3>
      <p className="font-mono text-sm opacity-90">{description}</p>
    </div>
  )
}
