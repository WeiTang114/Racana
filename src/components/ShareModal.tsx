import React, { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Share2, Clipboard, ClipboardCheck } from 'lucide-react'
import { VideoSource, Marker } from '../types'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  leftVideo: VideoSource | null
  rightVideo: VideoSource | null
  markers: Marker[]
  leftTime: number
  rightTime: number
}

const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  leftVideo,
  rightVideo,
  markers,
  leftTime,
  rightTime,
}) => {
  const { t } = useTranslation()
  const [includeMarkers, setIncludeMarkers] = useState(true)
  const [includeTime, setIncludeTime] = useState(true)
  const [copied, setCopied] = useState(false)

  const parseLabelsParam = (markers: Marker[], side: 'left' | 'right') => {
    return markers
      .map(m => {
        const time = side === 'left' ? m.leftTime : m.rightTime
        if (time === undefined) return null
        return `${m.label}-${time.toFixed(2)}`
      })
      .filter(Boolean)
      .join(',')
  }

  const generatedUrl = useMemo(() => {
    const baseUrl = window.location.origin + window.location.pathname
    const params = new URLSearchParams()

    const leftId = leftVideo?.type === 'youtube' ? (leftVideo.url.match(/[?&]v=([^&]+)/)?.[1] || '') : ''
    const rightId = rightVideo?.type === 'youtube' ? (rightVideo.url.match(/[?&]v=([^&]+)/)?.[1] || '') : ''

    if (leftId) params.set('left', leftId)
    if (rightId) params.set('right', rightId)

    if (includeMarkers && markers.length > 0) {
      const leftLabels = parseLabelsParam(markers, 'left')
      const rightLabels = parseLabelsParam(markers, 'right')
      if (leftLabels) params.set('leftLabels', leftLabels)
      if (rightLabels) params.set('rightLabels', rightLabels)
    }

    if (includeTime) {
      if (leftVideo && leftTime > 0) params.set('leftStartTime', leftTime.toFixed(2))
      if (rightVideo && rightTime > 0) params.set('rightStartTime', rightTime.toFixed(2))
    }

    return `${baseUrl}?${params.toString()}`
  }, [leftVideo, rightVideo, markers, leftTime, rightTime, includeMarkers, includeTime])

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-cyber-light/95 backdrop-blur-md rounded-lg border border-cyber-blue/20 max-w-lg w-full mx-4">
        <div className="flex items-center justify-between p-4 border-b border-cyber-blue/20">
          <div className="flex items-center space-x-2">
            <Share2 size={20} className="text-cyber-blue" />
            <h2 className="text-lg font-semibold text-cyber-blue">{t('share.title')}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-cyber-blue/10 rounded-full transition-all duration-300"
          >
            <X size={20} className="text-cyber-blue" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <h3 className="text-md font-semibold text-cyber-purple mb-2">{t('share.options')}</h3>
            <div className="space-y-2">
              <label className="flex items-center space-x-3 p-2 bg-cyber-dark/50 rounded-lg border border-cyber-blue/20">
                <input
                  type="checkbox"
                  checked={includeMarkers}
                  onChange={(e) => setIncludeMarkers(e.target.checked)}
                  className="form-checkbox h-5 w-5 text-cyber-blue bg-cyber-dark border-cyber-blue/50 rounded focus:ring-cyber-blue"
                />
                <span className="text-sm text-cyber-blue/80">{t('share.includeMarkers')}</span>
              </label>
              <label className="flex items-center space-x-3 p-2 bg-cyber-dark/50 rounded-lg border border-cyber-blue/20">
                <input
                  type="checkbox"
                  checked={includeTime}
                  onChange={(e) => setIncludeTime(e.target.checked)}
                  className="form-checkbox h-5 w-5 text-cyber-blue bg-cyber-dark border-cyber-blue/50 rounded focus:ring-cyber-blue"
                />
                <span className="text-sm text-cyber-blue/80">{t('share.includeCurrentTime')}</span>
              </label>
            </div>
          </div>

          <div>
            <h3 className="text-md font-semibold text-cyber-green mb-2">{t('share.generatedLink')}</h3>
            <div className="flex space-x-2">
              <input
                type="text"
                value={generatedUrl}
                readOnly
                className="flex-1 px-3 py-2 bg-cyber-dark/50 border border-cyber-blue/30 rounded text-xs text-cyber-blue/70 placeholder-cyber-blue/50 focus:outline-none"
              />
              <button
                onClick={handleCopy}
                className={`px-4 py-2 rounded-lg text-white text-sm font-medium transition-all duration-300 flex items-center space-x-2 ${
                  copied ? 'bg-cyber-green' : 'bg-cyber-blue hover:bg-cyber-purple'
                }`}
              >
                {copied ? <ClipboardCheck size={16} /> : <Clipboard size={16} />}
                <span>{copied ? t('share.copied') : t('share.copy')}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end p-4 border-t border-cyber-blue/20">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-cyber-dark/50 text-cyber-blue rounded-lg hover:bg-cyber-blue/20 border border-cyber-blue/30 transition-all duration-300"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ShareModal
