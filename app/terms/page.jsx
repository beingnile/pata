import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service - Pata',
  description: 'Terms and conditions for using Pata tax intelligence tools.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link
          href="/"
          className="font-mono underline decoration-red-600 mb-8 inline-block hover:bg-red-600 hover:text-white transition-colors"
        >
          &larr; Back home
        </Link>

        <h1 className="font-mono text-4xl md:text-5xl font-bold mb-8">Terms of Service</h1>

        <div className="space-y-8 font-mono text-sm text-gray-700">
          <section>
            <h2 className="font-mono text-lg font-bold text-black mb-2">1. Introduction</h2>
            <p>
              Welcome to PATA (“we”, “us”, or “our”). These Terms of Service govern your access to
              and use of our website, tools, and services (collectively, the “Service”). By using
              PATA, you agree to these Terms. If you do not agree, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-lg font-bold text-black mb-2">2. What PATA Provides</h2>
            <p>
              PATA provides tax intelligence tools for Kenyan residents, including but not limited
              to a PAYE calculator, tax optimizer, receipt scanner, and freelancer tax guide. Our
              tools are designed to help you understand and organize your tax obligations. They do
              not replace professional tax, legal, or financial advice.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-lg font-bold text-black mb-2">3. Eligibility</h2>
            <p>
              You must be at least 18 years old and legally able to enter into contracts to use our
              paid services. By creating an account, you represent that the information you provide
              is accurate and complete.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-lg font-bold text-black mb-2">4. Accounts and Security</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials and
              for all activities that occur under your account. You agree to notify us immediately
              if you suspect unauthorized access. We are not liable for any loss or damage arising
              from your failure to protect your account.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-lg font-bold text-black mb-2">5. Payments and Subscriptions</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>
                Certain features, such as the Tax Optimizer and Receipt Vault subscription, require
                payment via M-Pesa.
              </li>
              <li>
                Subscription fees are charged in Kenyan Shillings (KSH) and are non-refundable
                unless required by law.
              </li>
              <li>
                Subscriptions are billed manually through M-Pesa. You must renew your subscription
                each month to maintain unlimited access.
              </li>
              <li>
                We may change our fees at any time. Any fee changes will be posted on the Service
                before they take effect.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-mono text-lg font-bold text-black mb-2">6. Free Tier</h2>
            <p>
              Receipt Vault offers a limited number of free scans. Once the free limit is reached,
              you must purchase a subscription to continue scanning. We may change the free tier
              limits at any time.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-lg font-bold text-black mb-2">7. User Content</h2>
            <p>
              You retain ownership of any receipts, documents, or other content you upload. Receipt
              OCR is processed in your browser; we do not store your receipt images on our servers
              unless you choose to download or export them locally.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-lg font-bold text-black mb-2">8. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Use the Service for any unlawful purpose.</li>
              <li>Attempt to gain unauthorized access to our systems.</li>
              <li>Interfere with or disrupt the Service or its servers.</li>
              <li>Use automated tools to scrape, copy, or abuse the Service.</li>
              <li>Upload malicious files or content that violates third-party rights.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-mono text-lg font-bold text-black mb-2">9. Accuracy and Disclaimers</h2>
            <p>
              We do our best to keep tax rates, thresholds, and calculations accurate and up to
              date. However, tax laws change frequently, and OCR technology is not perfect. All
              outputs are estimates and should be verified against official KRA guidance before
              filing.
            </p>
            <p className="mt-2">
              The Service is provided “as is” and “as available” without warranties of any kind,
              either express or implied. We do not guarantee that the Service will be uninterrupted,
              error-free, or secure.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-lg font-bold text-black mb-2">10. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, PATA and its team will not be liable for any
              indirect, incidental, special, consequential, or punitive damages, including loss of
              profits, data, or goodwill, arising out of or related to your use of the Service.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-lg font-bold text-black mb-2">11. Third-Party Services</h2>
            <p>
              We use third-party services, including M-Pesa Daraja for payments and Upstash Redis
              for data storage. Your use of these services is subject to their respective terms and
              policies.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-lg font-bold text-black mb-2">12. Termination</h2>
            <p>
              We may suspend or terminate your access to the Service at any time, with or without
              notice, for conduct that violates these Terms or is otherwise harmful to the Service
              or other users. You may stop using the Service at any time.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-lg font-bold text-black mb-2">13. Changes to These Terms</h2>
            <p>
              We may update these Terms from time to time. We will post the updated Terms on this
              page with a revised effective date. Continued use of the Service after changes means
              you accept the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-lg font-bold text-black mb-2">14. Governing Law</h2>
            <p>
              These Terms are governed by the laws of the Republic of Kenya. Any disputes will be
              resolved in the courts of Kenya.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-lg font-bold text-black mb-2">15. Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us through the details
              provided on our website.
            </p>
          </section>

          <p className="text-xs text-gray-500 pt-4 border-t border-gray-200">
            Last updated: {new Date().toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>
    </div>
  )
}
