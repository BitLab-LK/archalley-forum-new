import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Refund Policy - Archalley",
  description: "Refund policy for Archalley payments and services",
}

export default function RefundPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="prose prose-lg max-w-none">
        <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">Refund Policy</h1>
        
        <div className="text-gray-700 dark:text-gray-300 space-y-6">
          <p className="text-lg leading-relaxed">
            Thank you for choosing Archalley. We are committed to ensuring your satisfaction and providing the best experience possible. If, for any reason, you are not completely satisfied with your payment or service, we are here to assist.
          </p>

          <section className="mt-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Refunds</h2>
            <p className="leading-relaxed mb-4">
              Refunds will only be provided under specific conditions, such as:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>The cancellation of an event or service due to unforeseen circumstances or reasons beyond our control.</li>
              <li>An error made by Archalley in processing your payment or delivering the service.</li>
            </ul>
            <p className="leading-relaxed mt-4">
              In these cases, Archalley will issue a full refund to the original payment method.
            </p>
            <p className="leading-relaxed mt-4">
              Please note that no refunds will be provided for changes of mind or non-compliance with our terms and conditions.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Non-Refundable Payments</h2>
            <p className="leading-relaxed mb-4">
              Certain payments are non-refundable. These include but are not limited to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Digital products or downloadable content.</li>
              <li>Fees for services that have already been delivered.</li>
              <li>Subscriptions or membership fees, unless explicitly stated otherwise.</li>
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Damaged or Defective Services</h2>
            <p className="leading-relaxed">
              If there is an issue with a service provided by Archalley due to system errors or technical faults on our side, please contact us immediately. We will take appropriate action, which may include rescheduling the service or issuing a refund, based on the specific circumstances.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Processing Time</h2>
            <p className="leading-relaxed">
              Refunds will be processed within 28 business days after we confirm the cancellation or error. Please allow additional time for the refund to appear in your account, depending on your payment provider.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Amendments and Cancellations</h2>
            <p className="leading-relaxed">
              Archalley reserves the right to amend or cancel any service or event, including competitions, due to circumstances beyond our control. In such cases, we will refund the payment or entry fees. Archalley will not be liable for any losses or damages incurred by the customer other than the refund of the amount paid.
            </p>
            <p className="leading-relaxed mt-4">
              Archalley also reserves the right to refuse any refund request or deny service to individuals found in breach of our terms and conditions.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Contact Us</h2>
            <p className="leading-relaxed">
              If you have any questions or concerns regarding this refund policy, please contact our customer support team at:
            </p>
            <p className="leading-relaxed mt-2">
              <strong>Email:</strong> <a href="mailto:projects@archalley.com" className="text-orange-500 hover:text-orange-600">projects@archalley.com</a>
            </p>
            <p className="leading-relaxed mt-4">
              We are here to assist you.
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

