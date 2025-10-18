'use client'

import FileUpload from '@/components/FileUpload'

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          GEO FLOW
        </h1>
        <p className="text-xl text-gray-600">
          Upload Peta, PDF, atau Screenshot
        </p>
      </div>

      {/* File Upload Component */}
      <FileUpload />
    </div>
  )
}