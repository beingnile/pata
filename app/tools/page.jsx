import Link from 'next/link'

export default function ToolsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="font-mono text-4xl md:text-5xl font-bold mb-2">Tools</h1>
        <p className="font-mono text-lg text-gray-600 mb-12">
          Everything you need to understand and organize your Kenyan taxes.
        </p>

        <div className="space-y-16">
          <ToolSection
            number="01"
            title="For Employees"
            tools={[
              {
                href: '/tools/payslip',
                title: 'Tax Calculator',
                description:
                  'Punch in your gross salary and see PAYE, NSSF, SHIF, Housing Levy, and net pay.',
                price: 'Free',
              },
              {
                href: '/tools/payslip/optimize',
                title: 'Tax Optimizer',
                description:
                  'Simulate pension, insurance, mortgage interest, and HOSP to find your best savings.',
                price: 'KSH 50',
              },
            ]}
          />

          <ToolSection
            number="02"
            title="For Business Owners"
            tools={[
              {
                href: '/tools/receipts',
                title: 'Receipt Vault',
                description:
                  'Scan receipts and PDFs with OCR. Extract totals, dates, and KRA details. Export ZIP, JSON, and CSV.',
                price: '3 free, then KSH 500/mo',
              },
              {
                href: '/tools/wht-manager',
                title: 'WHT Manager',
                description:
                  'Track withholding tax on payments to suppliers, freelancers, and landlords. Calculate rates, record transactions, and export monthly summaries.',
                price: 'Included in KSH 500/mo',
              },
            ]}
            dark
          />

          <ToolSection
            number="03"
            title="For Freelancers"
            tools={[
              {
                href: '/tools/freelancer',
                title: 'Freelancer Tax Guide',
                description:
                  'Compare Turnover Tax vs Standard Income Tax, estimate withholding tax, and check VAT thresholds.',
                price: 'Free',
              },
            ]}
          />
        </div>
      </div>
    </div>
  )
}

function ToolSection({ number, title, tools, dark = false }) {
  return (
    <section className={`${dark ? 'bg-black text-white' : ''} border-2 border-black p-6 md:p-8`}>
      <div className="flex items-center gap-4 mb-6">
        <span
          className={`font-mono text-sm border px-2 py-1 ${
            dark ? 'border-red-600 text-red-600' : 'border-red-600 text-red-600'
          }`}
        >
          {number}
        </span>
        <h2 className="font-mono text-2xl font-bold">{title}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tools.map((tool) => (
          <div
            key={tool.href}
            className={`border-2 p-6 flex flex-col ${
              dark ? 'border-white bg-black' : 'border-black bg-white'
            }`}
          >
            <div className="flex items-start justify-between gap-4 mb-2">
              <h3 className="font-mono text-xl font-bold">{tool.title}</h3>
              <span
                className={`font-mono text-xs whitespace-nowrap px-2 py-1 border ${
                  dark ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-600'
                }`}
              >
                {tool.price}
              </span>
            </div>
            <p
              className={`font-mono text-sm mb-6 flex-1 ${
                dark ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              {tool.description}
            </p>
            <Link
              href={tool.href}
              className={`inline-block font-mono text-sm px-6 py-3 border-2 transition-colors uppercase text-center ${
                dark
                  ? 'bg-red-600 text-white border-red-600 hover:bg-white hover:text-black hover:border-white'
                  : 'bg-black text-white border-black hover:bg-red-600 hover:border-red-600'
              }`}
            >
              Open tool
            </Link>
          </div>
        ))}
      </div>
    </section>
  )
}
