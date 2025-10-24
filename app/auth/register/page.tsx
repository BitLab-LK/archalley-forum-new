import { Suspense } from "react"
import SimplifiedEnhancedRegisterPage from "./enhanced-page-simplified"

function RegisterPageContent() {
  return <SimplifiedEnhancedRegisterPage />
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <RegisterPageContent />
    </Suspense>
  )
}