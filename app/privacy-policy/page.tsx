import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy - Archalley",
  description: "Privacy policy for Archalley website and services",
}

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="prose prose-lg max-w-none">
        <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">Privacy Policy</h1>
        
        <div className="text-gray-700 dark:text-gray-300 space-y-6">
          <p className="text-lg leading-relaxed">
            At Archalley (<a href="https://archalley.com" className="text-orange-500 hover:text-orange-600">https://archalley.com</a>), we respect your privacy and are committed to protecting your personal data. This Privacy Policy outlines how we collect, use, and protect your information when you visit our website. Please take a moment to read this policy carefully.
          </p>

          <section className="mt-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">1. Information We Collect</h2>
            <p className="leading-relaxed mb-4">
              We may collect and process the following types of personal data when you interact with our website:
            </p>
            
            <h3 className="text-xl font-semibold mb-3 mt-6 text-gray-900 dark:text-white">1.1. Personal Information</h3>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
              <li><strong>Contact Information:</strong> Name, email address, and any information you provide through contact forms, subscriptions, or newsletter sign-ups.</li>
              <li><strong>Account Details (if applicable):</strong> Username, password, and other related details for creating an account on our website.</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6 text-gray-900 dark:text-white">1.2. Usage Data</h3>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
              <li><strong>Log Data:</strong> Information such as your IP address, browser type, operating system, referral URL, pages viewed, and the date/time of your visit.</li>
              <li><strong>Cookies:</strong> Small files stored on your device that help us understand how users engage with our site. You can control cookies through your browser settings (see Section 7).</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6 text-gray-900 dark:text-white">1.3. Communication Data</h3>
            <p className="leading-relaxed">
              If you contact us directly, we may receive additional information such as the contents of your message, attachments, and any other personal data you choose to provide.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">2. How We Use Your Information</h2>
            <p className="leading-relaxed mb-4">
              We use your information to provide, improve, and protect our services, including:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Personalization:</strong> Delivering relevant content based on your preferences and previous interactions.</li>
              <li><strong>Communication:</strong> Sending newsletters, updates, or promotional content (you can opt out at any time).</li>
              <li><strong>Analytics:</strong> Monitoring user behavior on the site to improve user experience and site performance.</li>
              <li><strong>Security:</strong> Detecting, preventing, and responding to fraud, security breaches, or legal obligations.</li>
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">3. Legal Basis for Processing</h2>
            <p className="leading-relaxed mb-4">
              We process your personal data under the following legal bases:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Consent:</strong> When you sign up for newsletters or other optional services.</li>
              <li><strong>Legitimate Interests:</strong> To improve our services and understand user behavior.</li>
              <li><strong>Contractual Obligations:</strong> If you register for an account or service, we process your data to fulfill that contract.</li>
              <li><strong>Compliance with Legal Obligations:</strong> In cases where we are legally required to process data (e.g., tax reporting, law enforcement requests).</li>
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">4. Sharing Your Information</h2>
            <p className="leading-relaxed mb-4">
              We may share your personal information in the following circumstances:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Service Providers:</strong> Third-party providers who help us operate our website (e.g., hosting, analytics, email marketing services). They only access your data to perform their duties and are required to protect it.</li>
              <li><strong>Legal Compliance:</strong> We may disclose your personal data to comply with legal obligations or court orders.</li>
              <li><strong>Business Transfers:</strong> In the event of a merger, sale, or acquisition, your personal data may be transferred to the new owner.</li>
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">5. Data Retention</h2>
            <p className="leading-relaxed">
              We retain your personal data only as long as necessary for the purposes outlined in this Privacy Policy. If you have an account with us, we will retain your information for the duration of your account and as long as required by law (e.g., for tax purposes).
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">6. Your Rights</h2>
            <p className="leading-relaxed mb-4">
              You have the following rights regarding your personal data:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Access:</strong> You can request a copy of the personal data we hold about you.</li>
              <li><strong>Correction:</strong> You can request corrections to any inaccurate or incomplete data.</li>
              <li><strong>Deletion:</strong> You can request that we delete your personal data, subject to certain legal exceptions.</li>
              <li><strong>Restriction:</strong> You can request that we limit the processing of your personal data.</li>
              <li><strong>Data Portability:</strong> You can request a copy of your data in a structured, machine-readable format.</li>
              <li><strong>Objection:</strong> You can object to the processing of your data for specific purposes, such as marketing.</li>
            </ul>
            <p className="leading-relaxed mt-4">
              To exercise these rights, please contact us at <a href="mailto:projects@archalley.com" className="text-orange-500 hover:text-orange-600">projects@archalley.com</a>.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">7. Cookies and Tracking Technologies</h2>
            <p className="leading-relaxed mb-4">
              We use cookies and similar tracking technologies to collect information about your interactions with our website. Cookies help us enhance user experience by:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Analyzing Site Traffic:</strong> To understand how users interact with our site and improve performance.</li>
              <li><strong>Personalizing Content:</strong> To provide tailored content and recommendations based on your usage patterns.</li>
            </ul>
            <p className="leading-relaxed mt-4">
              You can control cookies through your browser settings. However, disabling cookies may impact your ability to use some features of the website.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">8. Third-Party Links</h2>
            <p className="leading-relaxed">
              Our website may contain links to external sites that are not operated by us. We are not responsible for the privacy practices or content of third-party websites. We encourage you to review their privacy policies before engaging with them.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">9. Data Security</h2>
            <p className="leading-relaxed">
              We implement appropriate technical and organizational measures to protect your personal data from unauthorized access, loss, or alteration. However, no method of transmission over the internet is completely secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">10. Children's Privacy</h2>
            <p className="leading-relaxed">
              Archalley is not directed at children under the age of 13, and we do not knowingly collect personal data from children. If we become aware that a child under 13 has provided us with personal information, we will take steps to delete it.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">11. Changes to This Privacy Policy</h2>
            <p className="leading-relaxed">
              We reserve the right to update or modify this Privacy Policy at any time. Any changes will be posted on this page with the updated date. We encourage you to review this policy periodically for any updates.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">12. Contact Us</h2>
            <p className="leading-relaxed">
              If you have any questions about this Privacy Policy or how we handle your personal data, please contact us at:
            </p>
            <p className="leading-relaxed mt-2">
              <strong>Email:</strong> <a href="mailto:projects@archalley.com" className="text-orange-500 hover:text-orange-600">projects@archalley.com</a>
            </p>
          </section>

          <div className="mt-12 pt-8 border-t border-gray-300 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

