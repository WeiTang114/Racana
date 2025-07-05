import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import RaceAnalyzer from './components/RaceAnalyzer'
import HelpModal from './components/HelpModal'
import LanguageSwitcher from './components/LanguageSwitcher'
import ShareModal from './components/ShareModal'
import { HelpCircle, Share2 } from 'lucide-react'
import { VideoSource, Marker } from './types'

const parseLabelsParam = (param: string | null) => {
  if (!param) return []
  return param.split(',').map(pair => {
    const [label, time] = pair.split('-')
    return { label, time: parseFloat(time) }
  })
}

function App() {
  const { t } = useTranslation()
  const [showHelp, setShowHelp] = useState(false)
  const [showShare, setShowShare] = useState(false)

  // 提升的狀態
  const [leftVideo, setLeftVideo] = useState<VideoSource | null>(null)
  const [rightVideo, setRightVideo] = useState<VideoSource | null>(null)
  const [markers, setMarkers] = useState<Marker[]>([])
  const [syncMode, setSyncMode] = useState(true)
  const [leftTime, setLeftTime] = useState(0)
  const [rightTime, setRightTime] = useState(0)
  const [leftInitialTime, setLeftInitialTime] = useState<number | undefined>(undefined)
  const [rightInitialTime, setRightInitialTime] = useState<number | undefined>(undefined)

  // 從 Session Storage 或 URL 參數載入初始狀態
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const leftId = params.get('left')
    const rightId = params.get('right')
    const leftLabels = parseLabelsParam(params.get('leftLabels'))
    const rightLabels = parseLabelsParam(params.get('rightLabels'))
    const leftStartTime = params.get('leftStartTime')
    const rightStartTime = params.get('rightStartTime')

    // 優先從 URL 參數載入
    if (leftId) {
      setLeftVideo({ type: 'youtube', url: `https://www.youtube.com/watch?v=${leftId}` })
    } else {
      const savedLeftVideo = loadFromSession('leftVideo')
      if (savedLeftVideo) setLeftVideo(savedLeftVideo)
    }

    if (rightId) {
      setRightVideo({ type: 'youtube', url: `https://www.youtube.com/watch?v=${rightId}` })
    } else {
      const savedRightVideo = loadFromSession('rightVideo')
      if (savedRightVideo) setRightVideo(savedRightVideo)
    }

    if (leftLabels.length > 0 || rightLabels.length > 0) {
      const merged: Marker[] = []
      leftLabels.forEach(({ label, time }) => {
        merged.push({ id: Date.now() + Math.random(), label, leftTime: time, rightTime: undefined, videoSide: 'left' })
      })
      rightLabels.forEach(({ label, time }) => {
        const exist = merged.find(m => m.label === label)
        if (exist) {
          exist.rightTime = time
          exist.videoSide = 'both'
        } else {
          merged.push({ id: Date.now() + Math.random(), label, leftTime: undefined, rightTime: time, videoSide: 'right' })
        }
      })
      setMarkers(merged)
    } else {
      const savedMarkers = loadFromSession('markers')
      if (savedMarkers) setMarkers(savedMarkers)
    }

    if (leftStartTime) {
      setLeftInitialTime(parseFloat(leftStartTime))
    }
    if (rightStartTime) {
      setRightInitialTime(parseFloat(rightStartTime))
    }

    const savedSyncMode = loadFromSession('syncMode')
    if (savedSyncMode !== null) {
      setSyncMode(savedSyncMode)
    }
  }, [])

  // 將狀態保存到 Session Storage
  useEffect(() => {
    if (leftVideo) saveToSession('leftVideo', leftVideo)
  }, [leftVideo])

  useEffect(() => {
    if (rightVideo) saveToSession('rightVideo', rightVideo)
  }, [rightVideo])

  useEffect(() => {
    if (markers.length > 0) saveToSession('markers', markers)
  }, [markers])

  useEffect(() => {
    saveToSession('syncMode', syncMode)
  }, [syncMode])

  const saveToSession = (key: string, data: any) => {
    try {
      sessionStorage.setItem(key, JSON.stringify(data))
    } catch (error) {
      console.warn('無法保存到 sessionStorage:', error)
    }
  }

  const loadFromSession = (key: string) => {
    try {
      const data = sessionStorage.getItem(key)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.warn('無法從 sessionStorage 載入:', error)
      return null
    }
  }

  return (
    <div className="min-h-screen bg-cyber-gradient">
      <header className="bg-cyber-dark/80 backdrop-blur-sm border-b border-cyber-blue/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-2">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-cyber-blue m-0 !mb-0 !mt-0">Racana</h1>
              <span className="ml-2 text-sm text-cyber-blue/70 -mb-1">{t('app.title')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowShare(true)}
                className="p-1.5 text-cyber-blue hover:text-cyber-neon hover:bg-cyber-blue/10 rounded-full transition-all duration-300"
                title={t('share.title')}
              >
                <Share2 size={18} />
              </button>
              <LanguageSwitcher />
              <button
                onClick={() => setShowHelp(true)}
                className="p-1.5 text-cyber-blue hover:text-cyber-neon hover:bg-cyber-blue/10 rounded-full transition-all duration-300"
                title={t('help.title')}
              >
                <HelpCircle size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <RaceAnalyzer
          leftVideo={leftVideo}
          rightVideo={rightVideo}
          markers={markers}
          syncMode={syncMode}
          setLeftVideo={setLeftVideo}
          setRightVideo={setRightVideo}
          setMarkers={setMarkers}
          setSyncMode={setSyncMode}
          onLeftTimeUpdate={setLeftTime}
          onRightTimeUpdate={setRightTime}
          leftInitialTime={leftInitialTime}
          rightInitialTime={rightInitialTime}
        />
      </main>

      {/* Help 彈窗 */}
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
      
      {/* Share 彈窗 */}
      <ShareModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        leftVideo={leftVideo}
        rightVideo={rightVideo}
        markers={markers}
        leftTime={leftTime}
        rightTime={rightTime}
      />
    </div>
  )
}

export default App 