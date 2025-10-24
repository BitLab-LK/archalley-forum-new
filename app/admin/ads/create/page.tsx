import React, { Suspense } from 'react'
import CreateEditAdClient from '@/components/create-edit-ad-client'

export default function CreateEditAdPage() {
  return (
    <Suspense fallback={<div className="container mx-auto p-6">Loading editor...</div>}>
      <CreateEditAdClient />
    </Suspense>
  )
}