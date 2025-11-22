import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms and Conditions - Archalley",
  description: "Terms and conditions for using Archalley website and services",
}

export default function TermsAndConditionsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="prose prose-lg max-w-none">
        <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">Terms and Conditions</h1>
        
        <div className="text-gray-700 dark:text-gray-300 space-y-6">
          <p className="text-lg leading-relaxed">
            Welcome to Archalley (<a href="https://archalley.com" className="text-orange-500 hover:text-orange-600">https://archalley.com</a>). By accessing or using our website, you agree to comply with and be bound by the following terms and conditions. Please review them carefully before using the website. If you do not agree to these terms, you may not access or use the website.
          </p>

          <section className="mt-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">1. Acceptance of Terms</h2>
            <p className="leading-relaxed">
              By accessing or using this website, you agree to be bound by these terms and conditions, as well as our Privacy Policy. These terms apply to all visitors, users, and others who access or use our website.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">2. Changes to Terms</h2>
            <p className="leading-relaxed">
              We reserve the right to modify or update these terms and conditions at any time without prior notice. Any changes will be effective immediately upon posting on the website. Your continued use of the site constitutes your acceptance of any revised terms.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">3. Use of Content</h2>
            <p className="leading-relaxed">
              All content on ArchAlley, including articles, images, graphics, and other materials, is for informational purposes only. You may not copy, reproduce, republish, distribute, or exploit any content without our explicit written permission, except for personal, non-commercial use. Proper credit must be given when referencing or sharing content from the website.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">4. Intellectual Property Rights</h2>
            <p className="leading-relaxed">
              All intellectual property rights, including but not limited to copyrights, trademarks, logos, and service marks displayed on this site, are the property of Archalley or its licensors. Unauthorized use of these materials is prohibited and may violate copyright, trademark, and other laws.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">5. User Contributions</h2>
            <p className="leading-relaxed">
              You may have the opportunity to post comments, feedback, or other content on our website. By doing so, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, and display the content. You represent that your contributions are original, lawful, and do not infringe on any third-party rights.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">6. Prohibited Uses</h2>
            <p className="leading-relaxed mb-4">
              You agree not to use the website for any unlawful or prohibited purposes, including but not limited to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Hacking or disrupting the website's operation.</li>
              <li>Posting offensive, defamatory, or inappropriate content.</li>
              <li>Violating any applicable laws or regulations.</li>
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">7. Third-Party Links</h2>
            <p className="leading-relaxed">
              Our website may contain links to third-party websites for your convenience. Archalley is not responsible for the content, privacy policies, or practices of these external sites. We recommend reviewing their terms and conditions before engaging with third-party services.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">8. Disclaimers</h2>
            <p className="leading-relaxed">
              The content provided on Archalley is for general informational purposes only. While we strive to provide accurate and up-to-date information, we make no warranties or representations regarding the accuracy, completeness, or reliability of any content on the website. Use the website at your own risk.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">9. Limitation of Liability</h2>
            <p className="leading-relaxed">
              To the fullest extent permitted by law, Archalley and its affiliates shall not be liable for any direct, indirect, incidental, consequential, or punitive damages arising out of your use of, or inability to use, the website.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">10. Indemnification</h2>
            <p className="leading-relaxed">
              You agree to indemnify and hold Archalley and its employees, affiliates, and licensors harmless from any claims, damages, losses, or expenses (including legal fees) arising out of your use of the website, violation of these terms, or infringement of any rights of third parties.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">11. Governing Law</h2>
            <p className="leading-relaxed">
              These terms and conditions are governed by and construed in accordance with applicable laws. Any disputes arising from or related to these terms shall be subject to the exclusive jurisdiction of the competent courts.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">12. Termination</h2>
            <p className="leading-relaxed">
              We reserve the right to terminate or suspend your access to the website at our sole discretion, without prior notice, for conduct that we believe violates these terms or is otherwise harmful to our website or users.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">13. Contact Us</h2>
            <p className="leading-relaxed">
              If you have any questions or concerns regarding these terms, please contact us at:
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

