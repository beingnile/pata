import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy - Pata',
  description: 'How Pata collects, uses, and protects your personal information.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link
          href="/"
          className="font-mono underline decoration-red-600 mb-8 inline-block hover:bg-red-600 hover:text-white transition-colors"
        >
          &larr; Back home
        </Link>

        <h1 className="font-mono text-4xl md:text-5xl font-bold mb-8">Privacy Policy</h1>

        <div className="space-y-8 font-mono text-sm text-gray-700">
          <section>
            <h2 className="font-mono text-lg font-bold text-black mb-2">1. Introduction</h2>
            <p>
              PATA (“we”, “us”, or “our”) is committed to protecting your privacy. This Privacy
              Policy explains how we collect, use, store, and protect your personal information when
              you use our website and services.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-lg font-bold text-black mb-2">2. Information We Collect</h2>
            <h3 className="font-mono font-bold text-black mt-3 mb-1">Account information</h3>
            <p>
              When you create an account, we collect your email address and a hashed password. If
              you sign in with Google, we receive your email address and profile information from
              Google.
            </p>

            <h3 className="font-mono font-bold text-black mt-3 mb-1">Usage information</h3>
            <p>
              We collect information about how you interact with the Service, such as the tools you
              use, scan counts, and subscription status. This helps us enforce free-tier limits and
              manage subscriptions.
            </p>

            <h3 className="font-mono font-bold text-black mt-3 mb-1">Payment information</h3>
            <p>
              We do not store your M-Pesa PIN or bank details. Payments are processed through
              Safaricom’s M-Pesa Daraja API. We may store transaction references, amounts, phone
              numbers, and payment status to confirm your subscription.
            </p>

            <h3 className="font-mono font-bold text-black mt-3 mb-1">Receipts and documents</h3>
            <p>
              Receipt images and PDFs are processed locally in your browser using Tesseract.js. We
              do not upload, store, or view your receipt images on our servers unless you explicitly
              choose a future cloud-backup feature.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-lg font-bold text-black mb-2">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>To provide and maintain the Service.</li>
              <li>To authenticate you and protect your account.</li>
              <li>To track subscription status and free-tier usage.</li>
              <li>To process payments and confirm subscriptions.</li>
              <li>To improve the Service and fix issues.</li>
              <li>To communicate with you about your account, subscriptions, or updates.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-mono text-lg font-bold text-black mb-2">4. Cookies and Local Storage</h2>
            <p>
              We use cookies and browser local storage to keep you signed in and to remember your
              session. NextAuth sets authentication cookies that are necessary for the Service to
              function.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-lg font-bold text-black mb-2">5. Third-Party Services</h2>
            <p>We use the following third-party services:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <strong>NextAuth / Auth.js:</strong> For authentication. Subject to their privacy
                practices.
              </li>
              <li>
                <strong>Google OAuth:</strong> If you choose to sign in with Google. Subject to
                Google’s Privacy Policy.
              </li>
              <li>
                <strong>Safaricom M-Pesa Daraja:</strong> For processing payments. Subject to
                Safaricom’s terms.
              </li>
              <li>
                <strong>Upstash Redis:</strong> For storing account, subscription, and payment
                records. Subject to Upstash’s privacy policy.
              </li>
              <li>
                <strong>Vercel:</strong> For hosting the Service. Subject to Vercel’s privacy
                policy.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-mono text-lg font-bold text-black mb-2">6. Data Security</h2>
            <p>
              We use industry-standard measures to protect your data, including password hashing
              (bcryptjs), HTTPS encryption, and secure session management. However, no online
              service is completely secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-lg font-bold text-black mb-2">7. Data Retention</h2>
            <p>
              We retain your account information and subscription records for as long as your
              account is active or as needed to provide the Service. Payment records are retained
              for tax and compliance purposes. If you delete your account, we will delete or
              anonymize your personal information within a reasonable period, except where we are
              required to keep it by law.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-lg font-bold text-black mb-2">8. Your Rights</h2>
            <p>Depending on applicable law, you may have the right to:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Access the personal information we hold about you.</li>
              <li>Correct inaccurate information.</li>
              <li>Request deletion of your account and personal data.</li>
              <li>Object to or restrict certain processing.</li>
            </ul>
            <p className="mt-2">
              To exercise these rights, contact us using the details provided on our website.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-lg font-bold text-black mb-2">9. Children’s Privacy</h2>
            <p>
              The Service is not intended for children under 18. We do not knowingly collect
              personal information from children.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-lg font-bold text-black mb-2">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will post the updated policy
              on this page with a revised effective date. Continued use of the Service after changes
              means you accept the updated policy.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-lg font-bold text-black mb-2">11. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy or how we handle your data,
              please contact us through the details provided on our website.
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
