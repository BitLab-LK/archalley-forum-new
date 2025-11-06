import { Metadata } from 'next'
import SubmitProjectForm from './submit-form'

export const metadata: Metadata = {
  title: 'Submit Academic Project | Archalley',
  description: 'Submit your research, thesis, or innovative academic projects to be featured in our academic collection.',
  keywords: 'submit project, academic submission, research submission, thesis submission, academic work, project submission',
}

export default function SubmitProjectPage() {
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left Side - Title and Description */}
          <div className="lg:sticky lg:top-8">
            <h1 className="text-4xl font-bold tracking-tight mb-6">
              Submit Your Academic Work
            </h1>
            <div className="text-lg text-muted-foreground space-y-4">
              <p>
                We invite students to submit academic works such as design projects and abstracts of their research articles for publication on our website. By sharing your work, you enhance your visibility in the field, connect with a broader audience, and contribute to the collective knowledge in architecture and design. Publishing your work not only showcases your capability but also provides valuable networking opportunities and establishes your expertise.
              </p>
              <p>
                Please check out our submission guidelines to ensure your submission aligns with our standards.
              </p>
              <p className="font-medium">
                We can't wait to see your contributions!
              </p>
            </div>
          </div>

          {/* Right Side - Submission Form */}
          <div>
            <SubmitProjectForm />
          </div>
        </div>
      </div>
    </div>
  )
}
