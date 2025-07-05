import React, { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from 'react'
import { useTranslation } from 'react-i18next'
import ReactPlayer from 'react-player'
import { VideoSource, VideoSide, Marker } from '../types'
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react'

export interface VideoPlayerHandle {
  seekTo: (time: number, relative?: boolean) => void
  stepForward: () => void
  stepBackward: () => void
}

interface VideoPlayerProps {
  videoSource: VideoSource | null
  isPlaying: boolean
  onPlayPause: (playing: boolean) => void
  onDurationChange: (duration: number) => void
  onTimeUpdate: (time: number) => void
  syncMode: boolean
  side: VideoSide
  markers: Marker[]
  onJumpToMarker: (marker: Marker) => void
  onSetMarkerAtCurrentTime: (label: string, time: number) => void
  selectedMarker: string
  jumpToTime?: number
  initialTime?: number
  isMobile: boolean // 新增 isMobile prop
}

const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(({
  videoSource,
  isPlaying,
  onPlayPause,
  onDurationChange,
  onTimeUpdate,
  side,
  markers,
  onJumpToMarker,
  onSetMarkerAtCurrentTime,
  selectedMarker,
  jumpToTime,
  initialTime,
  isMobile // 接收 isMobile prop
}, ref) => {
  const { t } = useTranslation()
  const playerRef = useRef<ReactPlayer>(null)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)

  // 內部播放控制
  const handleInternalPlayPause = () => {
    onPlayPause(!isPlaying)
  }

  // 暴露 seekTo 方法給父層
  useImperativeHandle(ref, () => ({
    seekTo: (time: number, relative?: boolean) => {
      if (playerRef.current) {
        const targetTime = relative ? (playerRef.current.getCurrentTime() || 0) + time : time
        const clampedTime = Math.max(0, Math.min(targetTime, duration))
        playerRef.current.seekTo(clampedTime, 'seconds')
        setCurrentTime(clampedTime)
        onTimeUpdate(clampedTime)
      }
    },
    stepForward: () => {
      if (playerRef.current) {
        const newTime = Math.min((playerRef.current.getCurrentTime() || 0) + 1/30, duration) // 假設 30fps
        playerRef.current.seekTo(newTime, 'seconds')
        setCurrentTime(newTime)
        onTimeUpdate(newTime)
      }
    },
    stepBackward: () => {
      if (playerRef.current) {
        const newTime = Math.max((playerRef.current.getCurrentTime() || 0) - 1/30, 0) // 假設 30fps
        playerRef.current.seekTo(newTime, 'seconds')
        setCurrentTime(newTime)
        onTimeUpdate(newTime)
      }
    }
  }))

  // 外部要求跳轉時
  useEffect(() => {
    if (jumpToTime !== undefined && playerRef.current) {
      playerRef.current.seekTo(jumpToTime, 'seconds')
      setCurrentTime(jumpToTime)
      onTimeUpdate(jumpToTime)
    }
  }, [jumpToTime, onTimeUpdate])

  // onProgress 只更新內部時間狀態
  const handleProgress = useCallback(({ playedSeconds }: { playedSeconds: number }) => {
    setCurrentTime(playedSeconds)
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value)
    setCurrentTime(newTime)
    onTimeUpdate(newTime)
    if (playerRef.current) playerRef.current.seekTo(newTime, 'seconds')
  }

  const handleDurationChange = (newDuration: number) => {
    setDuration(newDuration)
    onDurationChange(newDuration)
  }

  const getMarkerTime = (marker: Marker) => {
    return side === 'left' ? marker.leftTime : marker.rightTime
  }

  // 逐幀控制
  const handleStepForward = () => {
    if (playerRef.current) {
      const newTime = Math.min((playerRef.current.getCurrentTime() || 0) + 1/30, duration)
      playerRef.current.seekTo(newTime, 'seconds')
      setCurrentTime(newTime)
      onTimeUpdate(newTime)
    }
  }

  const handleStepBackward = () => {
    if (playerRef.current) {
      const newTime = Math.max((playerRef.current.getCurrentTime() || 0) - 1/30, 0)
      playerRef.current.seekTo(newTime, 'seconds')
      setCurrentTime(newTime)
      onTimeUpdate(newTime)
    }
  }

  return (
    <div className={`space-y-2 ${isMobile ? 'space-y-1' : ''}`}>
      <div className="relative bg-black rounded-lg overflow-hidden border border-cyber-blue/20" style={{ aspectRatio: '16/9' }}>
        {videoSource ? (
          <ReactPlayer
            ref={playerRef}
            url={videoSource.url}
            playing={isPlaying}
            controls={false} // 關閉預設控制，使用自訂控制
            width="100%"
            height="100%"
            onProgress={handleProgress}
            onDuration={handleDurationChange}
            onPlay={() => {
              if (!isPlaying) {
                onPlayPause(true)
              }
            }}
            onPause={() => {
              if (isPlaying) {
                onPlayPause(false)
                // 暫停時更新父組件的時間
                const newTime = playerRef.current?.getCurrentTime() || 0
                setCurrentTime(newTime)
                onTimeUpdate(newTime)
              }
            }}
            progressInterval={100}
            onReady={() => {
              if (initialTime && playerRef.current) {
                playerRef.current.seekTo(initialTime, 'seconds')
                setCurrentTime(initialTime)
                onTimeUpdate(initialTime)
              }
            }}
            muted={isMobile && side === 'right'} // 在手機版上，右側影片預設靜音
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-cyber-blue/70">
            {t('video.noVideoLoaded')}
          </div>
        )}
      </div>
      
      {/* 獨立的標籤選單 */}
      <div className={`bg-cyber-dark/70 rounded-lg border border-cyber-blue/20 ${isMobile ? 'p-1' : 'p-2'}`}>
        <div className="flex items-center justify-between">
          {/* 左側：影片控制器 */}
          <div className="flex items-center space-x-1">
            <button
              onClick={handleStepBackward}
              className={`bg-cyber-dark/70 text-cyber-blue rounded hover:bg-cyber-blue/20 border border-cyber-blue/30 transition-all duration-300 ${isMobile ? 'p-0.5' : 'p-1'}`}
              title={t('controls.frameBackward')}
            >
              <SkipBack size={isMobile ? 10 : 12} />
            </button>
            
            <button
              onClick={handleInternalPlayPause}
              className={`bg-cyber-blue/80 text-white rounded-full hover:bg-cyber-blue transition-all duration-300 ${isMobile ? 'p-1' : 'p-1.5'}`}
            >
              {isPlaying ? <Pause size={isMobile ? 12 : 14} /> : <Play size={isMobile ? 12 : 14} />}
            </button>
            
            <button
              onClick={handleStepForward}
              className={`bg-cyber-dark/70 text-cyber-blue rounded hover:bg-cyber-blue/20 border border-cyber-blue/30 transition-all duration-300 ${isMobile ? 'p-0.5' : 'p-1'}`}
              title={t('controls.frameForward')}
            >
              <SkipForward size={isMobile ? 10 : 12} />
            </button>
          </div>
          
          {/* 右側：標籤設置 */}
          <div className="flex items-center space-x-1">
            <div className={`font-medium text-cyber-purple ${isMobile ? 'text-xs' : 'text-xs'}`}>{isMobile ? t('markers.mobile.setMarker') : t('markers.setMarker')}：</div>
            <div className="flex space-x-1">
              {['1', '2', '3', '4', '5'].map((label) => (
                <button
                  key={label}
                  onClick={() => onSetMarkerAtCurrentTime(label, currentTime)}
                  className={`rounded-full font-medium transition-all duration-300 ${
                    selectedMarker === label 
                      ? 'bg-cyber-pink/90 text-white' 
                      : 'bg-cyber-dark/70 text-cyber-blue border border-cyber-blue/30 hover:bg-cyber-blue/20'
                  } ${isMobile ? 'w-5 h-5 text-xs' : 'w-6 h-6 text-xs'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* 視覺化時間軸 */}
      <div className={`space-y-1 ${isMobile ? 'space-y-0.5' : ''}`}>
        <div className="flex justify-between text-cyber-blue/70">
          <span className={isMobile ? 'text-[10px]' : 'text-xs'}>{formatTime(currentTime)}</span>
          <span className={isMobile ? 'text-[10px]' : 'text-xs'}>{formatTime(duration)}</span>
        </div>
        
        <div className="relative">
          <input
            type="range"
            min={0}
            max={duration}
            value={currentTime}
            onChange={handleSeek}
            className={`w-full bg-cyber-dark/70 rounded-lg appearance-none cursor-pointer slider border border-cyber-blue/30 ${isMobile ? 'h-0.5' : 'h-1'}`}
            style={{
              background: `linear-gradient(to right, #00d4ff 0%, #00d4ff ${(currentTime / duration) * 100}%, #16213e ${(currentTime / duration) * 100}%, #16213e 100%)`
            }}
          />
          
          {/* 標籤標記 */}
          {markers.map((marker) => {
            const markerTime = getMarkerTime(marker)
            if (markerTime === undefined) return null
            
            const markerPosition = (markerTime / duration) * 100
            return (
              <div
                key={`${marker.id}-${side}`}
                className="absolute top-0 transform -translate-x-1/2 cursor-pointer"
                style={{ left: `${markerPosition}%` }}
                onClick={() => onJumpToMarker(marker)}
                title={`${t('markers.marker')} ${marker.label}: ${formatTime(markerTime)}`}
              >
                <div className={`rounded-full border border-cyber-blue hover:scale-110 transition-all duration-300 ${
                  selectedMarker === marker.label ? 'bg-cyber-pink/90' : 'bg-cyber-blue'
                } ${isMobile ? 'w-1.5 h-1.5' : 'w-2 h-2'}`}></div>
                <div className={`absolute left-1/2 transform -translate-x-1/2 rounded whitespace-nowrap ${
                  selectedMarker === marker.label 
                    ? 'bg-cyber-pink/90 text-white' 
                    : 'bg-sky-500 text-white'
                } ${isMobile ? 'top-1.5 text-xs px-0.5 py-0' : 'top-2 text-xs px-1 py-0.5'}`}>
                  {marker.label}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
})

export default VideoPlayer 