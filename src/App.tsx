import React, { useState } from 'react'
import RaceAnalyzer from './components/RaceAnalyzer'
import HelpModal from './components/HelpModal'
import { HelpCircle } from 'lucide-react'

function App() {
  const [showHelp, setShowHelp] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-2">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">RaceAna</h1>
              <span className="ml-2 text-sm text-gray-500">賽車分析工具</span>
            </div>
            <button
              onClick={() => setShowHelp(true)}
              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
              title="使用說明"
            >
              <HelpCircle size={18} />
            </button>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <RaceAnalyzer />
      </main>

      {/* Help 彈窗 */}
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  )
}

export default App 