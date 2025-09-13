import DriveSelector from './components/DriveSelector'

export default function Home() {
  return (
    <main className="max-w-4xl mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Creative Intelligence App
        </h1>
        <p className="text-xl text-gray-600">
          AI-powered analysis and insights for your creative assets
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4">Upload Creative Assets</h2>
        <DriveSelector />
      </div>
      
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-2">📁 Google Drive</h3>
          <p className="text-gray-600">
            Seamlessly import assets from your Google Drive
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-2">🔍 AI Analysis</h3>
          <p className="text-gray-600">
            Extract insights using advanced computer vision and NLP
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-2">📊 Insights</h3>
          <p className="text-gray-600">
            Get actionable insights and creative recommendations
          </p>
        </div>
      </div>
    </main>
  )
}