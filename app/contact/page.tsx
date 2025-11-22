import type { Metadata } from "next"
import ContactForm from "./contact-form"

export const metadata: Metadata = {
  title: "Contact Us - Archalley",
  description: "Get in touch with Archalley. We'd love to hear from you! Whether you have feedback, suggestions, or simply want to get in touch, your input helps us continue to deliver high-quality, inspiring content.",
}

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Contact Us</h1>
          <div className="prose prose-lg max-w-none text-gray-700 dark:text-gray-300 space-y-4">
            <p className="text-lg leading-relaxed">
              We'd love to hear from you! Whether you have feedback, suggestions, or simply want to get in touch, your input helps us continue to deliver high-quality, inspiring content to our readers.
            </p>
            <p className="text-lg leading-relaxed">
              Please reach out to us using the form on this page — we value every message and look forward to connecting with you.
            </p>
            <p className="text-lg leading-relaxed font-medium">
              Let's keep inspiring the world together!
            </p>
          </div>
        </div>

        {/* Contact Form */}
        <ContactForm />
      </div>
    </div>
  )
}
