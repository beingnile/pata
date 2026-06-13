import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-black text-white border-t-2 border-white">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="font-mono text-2xl font-bold mb-4">PATA</h3>
            <p className="font-mono text-sm text-gray-400">
              Tax intelligence for Kenyans. Understand your payslip, organize receipts, and stay on
              the right side of KRA.
            </p>
          </div>

          <div>
            <h4 className="font-mono text-sm font-bold mb-4 uppercase">Tools</h4>
            <ul className="space-y-2 font-mono text-sm text-gray-400">
              <li>
                <Link href="/tools/payslip" className="hover:text-red-600 transition-colors">
                  Tax Calculator
                </Link>
              </li>
              <li>
                <Link href="/tools/payslip/optimize" className="hover:text-red-600 transition-colors">
                  Tax Optimizer
                </Link>
              </li>
              <li>
                <Link href="/tools/receipts" className="hover:text-red-600 transition-colors">
                  Receipt Vault
                </Link>
              </li>
              <li>
                <Link href="/tools/freelancer" className="hover:text-red-600 transition-colors">
                  Freelancer Tax Guide
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-mono text-sm font-bold mb-4 uppercase">Account</h4>
            <ul className="space-y-2 font-mono text-sm text-gray-400">
              <li>
                <Link href="/account" className="hover:text-red-600 transition-colors">
                  My account
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-red-600 transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6">
          <p className="font-mono text-xs text-gray-500">
            Rates and thresholds are based on current KRA guidance and may change with each Finance
            Act. Always verify on{' '}
            <a
              href="https://www.kra.go.ke"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-red-600"
            >
              kra.go.ke
            </a>{' '}
            before filing.
          </p>
        </div>
      </div>
    </footer>
  )
}
