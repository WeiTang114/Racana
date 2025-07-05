import React from 'react'
import { useTranslation } from 'react-i18next'
import { X, HelpCircle } from 'lucide-react'

interface HelpModalProps {
  isOpen: boolean
  onClose: () => void
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation()
  
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-cyber-light/95 backdrop-blur-md rounded-lg border border-cyber-blue/20 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* 標題欄 */}
        <div className="flex items-center justify-between p-4 border-b border-cyber-blue/20">
          <div className="flex items-center space-x-2">
            <HelpCircle size={20} className="text-cyber-blue" />
            <h2 className="text-lg font-semibold text-cyber-blue">{t('help.title')}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-cyber-blue/10 rounded-full transition-all duration-300"
          >
            <X size={20} className="text-cyber-blue" />
          </button>
        </div>

        {/* 內容區域 */}
        <div className="p-6 space-y-6">
          {/* 快速鍵說明 */}
          <div>
            <h3 className="text-md font-semibold text-cyber-blue mb-3 flex items-center">
              <span className="bg-cyber-blue text-white px-2 py-1 rounded text-xs mr-2">⌨️</span>
              {t('help.shortcuts')}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 全域控制 */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-cyber-purple">{t('help.globalControls')}</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-cyber-blue/80">{t('shortcuts.playPause')}</span>
                    <kbd className="px-2 py-1 bg-cyber-dark/50 text-cyber-blue rounded text-xs border border-cyber-blue/30">空白鍵</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cyber-blue/80">{t('shortcuts.stepForward')}</span>
                    <kbd className="px-2 py-1 bg-cyber-dark/50 text-cyber-blue rounded text-xs border border-cyber-blue/30">→</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cyber-blue/80">{t('shortcuts.stepBackward')}</span>
                    <kbd className="px-2 py-1 bg-cyber-dark/50 text-cyber-blue rounded text-xs border border-cyber-blue/30">←</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cyber-blue/80">{t('shortcuts.fastForward')}</span>
                    <kbd className="px-2 py-1 bg-cyber-dark/50 text-cyber-blue rounded text-xs border border-cyber-blue/30">長按 →</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cyber-blue/80">{t('shortcuts.rewind')}</span>
                    <kbd className="px-2 py-1 bg-cyber-dark/50 text-cyber-blue rounded text-xs border border-cyber-blue/30">長按 ←</kbd>
                  </div>
                </div>
              </div>

              {/* 左側影片控制 */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-cyber-purple">{t('help.leftVideoControls')}</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-cyber-blue/80">{t('shortcuts.playPause')}</span>
                    <kbd className="px-2 py-1 bg-cyber-dark/50 text-cyber-blue rounded text-xs border border-cyber-blue/30">A</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cyber-blue/80">{t('shortcuts.stepForward')}</span>
                    <kbd className="px-2 py-1 bg-cyber-dark/50 text-cyber-blue rounded text-xs border border-cyber-blue/30">S</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cyber-blue/80">{t('shortcuts.stepBackward')}</span>
                    <kbd className="px-2 py-1 bg-cyber-dark/50 text-cyber-blue rounded text-xs border border-cyber-blue/30">Z</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cyber-blue/80">{t('shortcuts.fastForward')}</span>
                    <kbd className="px-2 py-1 bg-cyber-dark/50 text-cyber-blue rounded text-xs border border-cyber-blue/30">長按 S</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cyber-blue/80">{t('shortcuts.rewind')}</span>
                    <kbd className="px-2 py-1 bg-cyber-dark/50 text-cyber-blue rounded text-xs border border-cyber-blue/30">長按 Z</kbd>
                  </div>
                </div>
              </div>

              {/* 右側影片控制 */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-cyber-orange">{t('help.rightVideoControls')}</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-cyber-orange/80">{t('shortcuts.playPause')}</span>
                    <kbd className="px-2 py-1 bg-cyber-dark/50 text-cyber-orange rounded text-xs border border-cyber-orange/30">K</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cyber-orange/80">{t('shortcuts.stepForward')}</span>
                    <kbd className="px-2 py-1 bg-cyber-dark/50 text-cyber-orange rounded text-xs border border-cyber-orange/30">L</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cyber-orange/80">{t('shortcuts.stepBackward')}</span>
                    <kbd className="px-2 py-1 bg-cyber-dark/50 text-cyber-orange rounded text-xs border border-cyber-orange/30">J</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cyber-orange/80">{t('shortcuts.fastForward')}</span>
                    <kbd className="px-2 py-1 bg-cyber-dark/50 text-cyber-orange rounded text-xs border border-cyber-orange/30">長按 L</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cyber-orange/80">{t('shortcuts.rewind')}</span>
                    <kbd className="px-2 py-1 bg-cyber-dark/50 text-cyber-orange rounded text-xs border border-cyber-orange/30">長按 J</kbd>
                  </div>
                </div>
              </div>

              {/* 標籤控制 */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-cyber-pink">{t('help.markerControls')}</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-cyber-pink/80">{t('shortcuts.setMarkers')}</span>
                    <kbd className="px-2 py-1 bg-cyber-dark/50 text-cyber-pink rounded text-xs border border-cyber-pink/30">1-5</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cyber-pink/80">{t('shortcuts.jumpToMarker')}</span>
                    <kbd className="px-2 py-1 bg-cyber-dark/50 text-cyber-pink rounded text-xs border border-cyber-pink/30">點擊標籤</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cyber-pink/80">{t('shortcuts.syncJump')}</span>
                    <kbd className="px-2 py-1 bg-cyber-dark/50 text-cyber-pink rounded text-xs border border-cyber-pink/30">點擊同步按鈕</kbd>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 功能說明 */}
          <div>
            <h3 className="text-md font-semibold text-cyber-green mb-3 flex items-center">
              <span className="bg-cyber-green text-white px-2 py-1 rounded text-xs mr-2">🎯</span>
              {t('help.features')}
            </h3>
            <div className="space-y-2 text-sm text-cyber-blue/80">
              <div className="flex items-start space-x-2">
                <span className="text-cyber-blue">•</span>
                <span>{t('features.localAndYouTube')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-cyber-blue">•</span>
                <span>{t('features.syncOrIndependent')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-cyber-blue">•</span>
                <span>{t('features.frameControl')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-cyber-blue">•</span>
                <span>{t('features.markerSystem')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-cyber-blue">•</span>
                <span>{t('features.visualTimeline')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-cyber-blue">•</span>
                <span>{t('features.longPressJump')}</span>
              </div>
            </div>
          </div>

          {/* 作者資訊 */}
          <div>
            <h3 className="text-md font-semibold text-cyber-purple mb-3 flex items-center">
              <span className="bg-cyber-purple text-white px-2 py-1 rounded text-xs mr-2">👨‍💻</span>
              {t('help.authorInfo')}
            </h3>
            <div className="bg-cyber-dark/50 rounded-lg p-4 space-y-2 border border-cyber-purple/20">
              <div className="text-sm">
                <span className="font-medium text-cyber-purple">{t('author.projectName')}：</span>
                <span className="text-cyber-blue/80">Racana 賽車分析工具</span>
              </div>
              <div className="text-sm">
                <span className="font-medium text-cyber-purple">{t('author.version')}：</span>
                <span className="text-cyber-blue/80">1.0.2</span>
              </div>
              <div className="text-sm">
                <span className="font-medium text-cyber-purple">{t('author.techStack')}：</span>
                <span className="text-cyber-blue/80">React + TypeScript + Tailwind CSS</span>
              </div>
              <div className="text-sm">
                <span className="font-medium text-cyber-purple">{t('author.github')}：</span>
                <a 
                  href="https://github.com/WeiTang114/Racana" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-cyber-blue hover:text-cyber-neon underline transition-colors duration-300"
                >
                  WeiTang114/Racana
                </a>
              </div>
            </div>
          </div>

          {/* 問題回報 */}
          <div>
            <h3 className="text-md font-semibold text-cyber-orange mb-3 flex items-center">
              <span className="bg-cyber-orange text-white px-2 py-1 rounded text-xs mr-2">🐛</span>
              {t('help.bugReport')}
            </h3>
            <div className="bg-cyber-dark/50 rounded-lg p-4 border border-cyber-orange/20">
              <p className="text-sm text-cyber-blue/80 mb-3">
                {t('help.reportDescription')}
              </p>
              <a 
                href="https://github.com/WeiTang114/Racana/issues/new" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-cyber-orange text-white rounded-lg hover:bg-cyber-orange/80 transition-all duration-300 text-sm font-medium"
              >
                <span className="mr-2">📝</span>
                {t('help.reportButton')}
              </a>
            </div>
          </div>
        </div>

        {/* 底部按鈕 */}
        <div className="flex justify-end p-4 border-t border-cyber-blue/20">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-cyber-blue text-white rounded-lg hover:bg-cyber-blue/80 transition-all duration-300"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default HelpModal 