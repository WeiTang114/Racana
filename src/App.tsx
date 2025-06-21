import React from 'react'
import RaceAnalyzer from './components/RaceAnalyzer'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">RaceAna</h1>
              <span className="ml-2 text-sm text-gray-500">賽車分析工具</span>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <RaceAnalyzer />
      </main>
    </div>
  )
}

export default App 