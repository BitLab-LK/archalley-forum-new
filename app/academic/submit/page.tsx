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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Submit Your Academic Work
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Share your research, thesis, or innovative projects with the global architecture academic community. 
            Your work will be reviewed and featured in our academic collection.
          </p>
        </div>

        {/* Submission Form */}
        <SubmitProjectForm />
      </div>
    </div>
  )
}
