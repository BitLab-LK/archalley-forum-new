import { Metadata } from 'next'
import SubmitProjectForm from './submit-form'

export const metadata: Metadata = {
  title: 'Submit Project | Archalley',
  description: 'Submit your projects, drawings, and stories to be featured on Archalley.',
  keywords: 'submit project, project submission, architecture project, design project, project showcase',
}

export default function SubmitProjectPage() {
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left Side - Title and Description */}
          <div className="lg:sticky lg:top-8">
            <h1 className="text-4xl font-bold tracking-tight mb-6">
              Submit Your Project
            </h1>
            <div className="text-lg text-muted-foreground space-y-4">
              <p>
                We're eager to showcase the best of your work and share it with our readers to inspire new ideas. If you've recently completed a project, have an exciting story to tell, or want to share your latest drawings, we'd love to hear from you!
              </p>
              <p>
                Please reach out to us using the form on this page. Whether you're submitting a project, offering suggestions, or reporting an error, your input helps us continue to bring the highest quality content to our audience.
              </p>
              <p className="font-medium">
                Let's inspire the world together!
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

