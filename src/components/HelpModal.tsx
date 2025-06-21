import React from 'react'
import { X, HelpCircle } from 'lucide-react'

interface HelpModalProps {
  isOpen: boolean
  onClose: () => void
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* 標題欄 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <HelpCircle size={20} className="text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-800">使用說明</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* 內容區域 */}
        <div className="p-6 space-y-6">
          {/* 快速鍵說明 */}
          <div>
            <h3 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
              <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded text-xs mr-2">⌨️</span>
              快速鍵說明
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 全域控制 */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">全域控制</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">播放/暫停</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">空白鍵</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">逐幀前進</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">→</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">逐幀後退</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">←</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">快進 5 秒</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">長按 →</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">快退 5 秒</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">長按 ←</kbd>
                  </div>
                </div>
              </div>

              {/* 左側影片控制 */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">左側影片控制</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">播放/暫停</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">A</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">逐幀前進</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">S</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">逐幀後退</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Z</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">快進 5 秒</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">長按 S</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">快退 5 秒</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">長按 Z</kbd>
                  </div>
                </div>
              </div>

              {/* 右側影片控制 */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">右側影片控制</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">播放/暫停</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">K</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">逐幀前進</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">L</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">逐幀後退</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">J</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">快進 5 秒</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">長按 L</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">快退 5 秒</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">長按 J</kbd>
                  </div>
                </div>
              </div>

              {/* 標籤控制 */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">標籤控制</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">設置標籤 1-5</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">1-5</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">跳轉到標籤</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">點擊標籤</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">同步跳轉</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">點擊同步按鈕</kbd>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 功能說明 */}
          <div>
            <h3 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
              <span className="bg-green-100 text-green-600 px-2 py-1 rounded text-xs mr-2">🎯</span>
              主要功能
            </h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-start space-x-2">
                <span className="text-blue-500">•</span>
                <span>支援本地影片檔案和 YouTube 影片載入</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-blue-500">•</span>
                <span>左右影片可同步或獨立播放控制</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-blue-500">•</span>
                <span>精確的逐幀控制，方便分析細節動作</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-blue-500">•</span>
                <span>標籤系統，可標記重要時間點並快速跳轉</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-blue-500">•</span>
                <span>視覺化時間軸，直觀顯示播放進度和標籤位置</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-blue-500">•</span>
                <span>支援長按快速跳轉，階梯式快進功能</span>
              </div>
            </div>
          </div>

          {/* 作者資訊 */}
          <div>
            <h3 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
              <span className="bg-purple-100 text-purple-600 px-2 py-1 rounded text-xs mr-2">👨‍💻</span>
              作者資訊
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="text-sm">
                <span className="font-medium text-gray-700">專案名稱：</span>
                <span className="text-gray-600">RaceAna 賽車分析工具</span>
              </div>
              <div className="text-sm">
                <span className="font-medium text-gray-700">版本：</span>
                <span className="text-gray-600">1.0.0</span>
              </div>
              <div className="text-sm">
                <span className="font-medium text-gray-700">技術棧：</span>
                <span className="text-gray-600">React + TypeScript + Tailwind CSS</span>
              </div>
              <div className="text-sm">
                <span className="font-medium text-gray-700">GitHub：</span>
                <a 
                  href="https://github.com/WeiTang114/RaceAna" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  WeiTang114/RaceAna
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* 底部按鈕 */}
        <div className="flex justify-end p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  )
}

export default HelpModal 