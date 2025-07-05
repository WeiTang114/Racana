import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Play, Pause, SkipBack, SkipForward, Trash2, Link, Unlink, Edit3 } from 'lucide-react'
import { VideoSource, Marker } from '../types'

interface ControlPanelProps {
  leftVideo: VideoSource | null
  rightVideo: VideoSource | null
  onLeftVideoChange: (video: VideoSource | null) => void
  onRightVideoChange: (video: VideoSource | null) => void
  isPlaying: boolean
  onPlayPause: (playing: boolean) => void
  leftCurrentTime: number
  rightCurrentTime: number
  leftDuration: number
  rightDuration: number
  markers: Marker[]
  onJumpToMarker: (marker: Marker, side: 'left' | 'right') => void
  onDeleteMarker: (markerId: number) => void
  onEditMarkerTime: (markerId: number, side: 'left' | 'right', time: number) => void
  syncMode: boolean
  onSyncModeChange: (sync: boolean) => void
  selectedMarker: string
  onSelectedMarkerChange: (marker: string) => void
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  leftVideo,
  rightVideo,
  onLeftVideoChange,
  onRightVideoChange,
  isPlaying,
  onPlayPause,
  leftCurrentTime,
  rightCurrentTime,
  leftDuration,
  rightDuration,
  markers,
  onJumpToMarker,
  onDeleteMarker,
  onEditMarkerTime,
  syncMode,
  onSyncModeChange,
  selectedMarker,
  onSelectedMarkerChange
}) => {
  const { t } = useTranslation()
  const [leftVideoUrl, setLeftVideoUrl] = useState('')
  const [rightVideoUrl, setRightVideoUrl] = useState('')
  const [editingMarker, setEditingMarker] = useState<{id: number, side: 'left' | 'right', time: string} | null>(null)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const parseTimeInput = (timeStr: string): number => {
    const parts = timeStr.split(':').map(Number)
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1]
    }
    return 0
  }

  const handleVideoSubmit = (side: 'left' | 'right') => {
    const url = side === 'left' ? leftVideoUrl : rightVideoUrl
    if (!url.trim()) return

    const videoSource: VideoSource = {
      type: url.includes('youtube.com') || url.includes('youtu.be') ? 'youtube' : 'local',
      url: url.trim(),
      title: `${t('video.video')} ${side === 'left' ? t('video.left') : t('video.right')}`
    }

    if (side === 'left') {
      onLeftVideoChange(videoSource)
      setLeftVideoUrl('')
    } else {
      onRightVideoChange(videoSource)
      setRightVideoUrl('')
    }
  }

  const handleEditMarker = (marker: Marker, side: 'left' | 'right') => {
    const time = side === 'left' ? marker.leftTime : marker.rightTime
    setEditingMarker({
      id: marker.id,
      side,
      time: time ? formatTime(time) : ''
    })
  }

  const handleSaveMarkerEdit = () => {
    if (editingMarker) {
      const timeInSeconds = parseTimeInput(editingMarker.time)
      onEditMarkerTime(editingMarker.id, editingMarker.side, timeInSeconds)
      setEditingMarker(null)
    }
  }

  const handleCancelMarkerEdit = () => {
    setEditingMarker(null)
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 space-y-4">
      {/* 影片來源設定 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-base font-semibold mb-2 text-gray-800">{t('video.myRecordingSource')}</h3>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder={t('video.enterLocalPathOrYouTube')}
              value={leftVideoUrl}
              onChange={(e) => setLeftVideoUrl(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            />
            <button
              onClick={() => handleVideoSubmit('left')}
              className="px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            >
              {t('video.load')}
            </button>
          </div>
          {leftVideo && (
            <div className="mt-1 text-xs text-gray-600">
              {t('video.loaded')}: {leftVideo.title}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-base font-semibold mb-2 text-gray-800">{t('video.expertRecordingSource')}</h3>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder={t('video.enterLocalPathOrYouTube')}
              value={rightVideoUrl}
              onChange={(e) => setRightVideoUrl(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            />
            <button
              onClick={() => handleVideoSubmit('right')}
              className="px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            >
              {t('video.load')}
            </button>
          </div>
          {rightVideo && (
            <div className="mt-1 text-xs text-gray-600">
              {t('video.loaded')}: {rightVideo.title}
            </div>
          )}
        </div>
      </div>

      {/* 播放控制 */}
      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-gray-800">{t('controls.playbackControl')}</h3>
          <button
            onClick={() => onSyncModeChange(!syncMode)}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm ${
              syncMode 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {syncMode ? <Link size={14} /> : <Unlink size={14} />}
            <span>{syncMode ? t('controls.syncMode') : t('controls.independentMode')}</span>
          </button>
        </div>

        <div className="flex items-center justify-center space-x-3">
          <button
            onClick={() => onPlayPause(!isPlaying)}
            className="p-2.5 bg-primary-600 text-white rounded-full hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
          
          <button
            onClick={() => onPlayPause(false)}
            className="p-1.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            <SkipBack size={16} />
          </button>
          
          <button
            onClick={() => onPlayPause(false)}
            className="p-1.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            <SkipForward size={16} />
          </button>
        </div>

        {/* 時間軸 */}
        <div className="mt-3 space-y-3">
          <div>
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>{t('video.leftVideo')}: {formatTime(leftCurrentTime)} / {formatTime(leftDuration)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={leftDuration}
              value={leftCurrentTime}
              onChange={(_e) => onPlayPause(false)}
              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          
          <div>
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>{t('video.rightVideo')}: {formatTime(rightCurrentTime)} / {formatTime(rightDuration)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={rightDuration}
              value={rightCurrentTime}
              onChange={(_e) => onPlayPause(false)}
              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 標籤管理 */}
      <div className="border-t pt-4">
        <h3 className="text-base font-semibold mb-3 text-gray-800">{t('markers.markerManagement')}</h3>
        
        {/* 標籤列表 - 改為網格佈局 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {markers.map((marker) => (
            <div
              key={marker.id}
              className={`p-2 rounded-lg border transition-colors ${
                selectedMarker === marker.label 
                  ? 'border-red-500 bg-red-50' 
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center space-x-1">
                  <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
                    selectedMarker === marker.label 
                      ? 'bg-red-500 text-white' 
                      : 'bg-blue-500 text-white'
                  }`}>
                    {marker.label}
                  </span>
                  <button
                    onClick={() => onSelectedMarkerChange(marker.label)}
                    className="text-xs text-gray-600 hover:text-gray-800"
                  >
                    {selectedMarker === marker.label ? t('markers.selected') : t('markers.select')}
                  </button>
                </div>
                <button
                  onClick={() => onDeleteMarker(marker.id)}
                  className="p-0.5 text-red-600 hover:text-red-800"
                >
                  <Trash2 size={12} />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                {/* 左側時間 */}
                <div>
                  <div className="text-xs font-medium text-gray-700 mb-1">{t('video.left')} {t('markers.time')}</div>
                  {editingMarker?.id === marker.id && editingMarker.side === 'left' ? (
                    <div className="flex space-x-1">
                      <input
                        type="text"
                        value={editingMarker.time}
                        onChange={(e) => setEditingMarker({...editingMarker, time: e.target.value})}
                        placeholder={t('markers.timeFormat')}
                        className="flex-1 px-1 py-0.5 border border-gray-300 rounded text-xs"
                      />
                      <button
                        onClick={handleSaveMarkerEdit}
                        className="px-1 py-0.5 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                      >
                        {t('common.save')}
                      </button>
                      <button
                        onClick={handleCancelMarkerEdit}
                        className="px-1 py-0.5 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
                      >
                        {t('common.cancel')}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-gray-600">
                        {marker.leftTime !== undefined ? formatTime(marker.leftTime) : t('markers.notSet')}
                      </span>
                      <button
                        onClick={() => handleEditMarker(marker, 'left')}
                        className="p-0.5 text-blue-600 hover:text-blue-800"
                      >
                        <Edit3 size={10} />
                      </button>
                    </div>
                  )}
                </div>
                
                {/* 右側時間 */}
                <div>
                  <div className="text-xs font-medium text-gray-700 mb-1">{t('video.right')} {t('markers.time')}</div>
                  {editingMarker?.id === marker.id && editingMarker.side === 'right' ? (
                    <div className="flex space-x-1">
                      <input
                        type="text"
                        value={editingMarker.time}
                        onChange={(e) => setEditingMarker({...editingMarker, time: e.target.value})}
                        placeholder={t('markers.timeFormat')}
                        className="flex-1 px-1 py-0.5 border border-gray-300 rounded text-xs"
                      />
                      <button
                        onClick={handleSaveMarkerEdit}
                        className="px-1 py-0.5 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                      >
                        {t('common.save')}
                      </button>
                      <button
                        onClick={handleCancelMarkerEdit}
                        className="px-1 py-0.5 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
                      >
                        {t('common.cancel')}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-gray-600">
                        {marker.rightTime !== undefined ? formatTime(marker.rightTime) : t('markers.notSet')}
                      </span>
                      <button
                        onClick={() => handleEditMarker(marker, 'right')}
                        className="p-0.5 text-blue-600 hover:text-blue-800"
                      >
                        <Edit3 size={10} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* 跳轉按鈕 */}
              <div className="flex space-x-1 mt-1">
                <button
                  onClick={() => onJumpToMarker(marker, 'left')}
                  disabled={marker.leftTime === undefined}
                  className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('markers.jump')} {t('video.left')}
                </button>
                <button
                  onClick={() => onJumpToMarker(marker, 'right')}
                  disabled={marker.rightTime === undefined}
                  className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('markers.jump')} {t('video.right')}
                </button>
              </div>
            </div>
          ))}
          
          {markers.length === 0 && (
            <div className="col-span-full text-center text-gray-500 py-3 text-sm">
              {t('markers.noMarkersAdded')}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ControlPanel 