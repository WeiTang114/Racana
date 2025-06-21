import React, { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from 'react'
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
  syncMode: boolean
  side: VideoSide
  markers: Marker[]
  onJumpToMarker: (marker: Marker) => void
  onSetMarkerAtCurrentTime: (label: string, time: number) => void
  selectedMarker: string
  jumpToTime?: number // 新增：外部要求跳轉時用
}

const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(({
  videoSource,
  isPlaying,
  onPlayPause,
  onDurationChange,
  syncMode,
  side,
  markers,
  onJumpToMarker,
  onSetMarkerAtCurrentTime,
  selectedMarker,
  jumpToTime
}, ref) => {
  const playerRef = useRef<ReactPlayer>(null)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const lastUpdateRef = useRef(0)
  const updateTimeoutRef = useRef<number | null>(null)

  // 內部播放控制
  const handleInternalPlayPause = () => {
    onPlayPause(!isPlaying)
  }

  // 暴露 seekTo 方法給父層
  useImperativeHandle(ref, () => ({
    seekTo: (time: number, relative?: boolean) => {
      if (playerRef.current) {
        const targetTime = relative ? currentTime + time : time
        const clampedTime = Math.max(0, Math.min(targetTime, duration))
        playerRef.current.seekTo(clampedTime, 'seconds')
        setCurrentTime(clampedTime)
      }
    },
    stepForward: () => {
      if (playerRef.current) {
        const newTime = Math.min(currentTime + 1/30, duration) // 假設 30fps
        playerRef.current.seekTo(newTime, 'seconds')
        setCurrentTime(newTime)
      }
    },
    stepBackward: () => {
      if (playerRef.current) {
        const newTime = Math.max(currentTime - 1/30, 0) // 假設 30fps
        playerRef.current.seekTo(newTime, 'seconds')
        setCurrentTime(newTime)
      }
    }
  }))

  // 外部要求跳轉時
  useEffect(() => {
    if (jumpToTime !== undefined && playerRef.current) {
      playerRef.current.seekTo(jumpToTime, 'seconds')
      setCurrentTime(jumpToTime)
    }
  }, [jumpToTime])

  useEffect(() => {
    if (playerRef.current && syncMode) {
      playerRef.current.seekTo(currentTime, 'seconds')
    }
  }, [syncMode])

  // onProgress 只更新自己
  const debouncedTimeUpdate = useCallback((newTime: number) => {
    if (Math.abs(newTime - lastUpdateRef.current) < 0.1) return
    if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current)
    updateTimeoutRef.current = setTimeout(() => {
      lastUpdateRef.current = newTime
      setCurrentTime(newTime)
    }, 50)
  }, [])

  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current)
    }
  }, [])

  const handleProgress = useCallback(({ playedSeconds }: { playedSeconds: number }) => {
    if (!syncMode) {
      debouncedTimeUpdate(playedSeconds)
    }
  }, [syncMode, debouncedTimeUpdate])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value)
    setCurrentTime(newTime)
    if (playerRef.current) playerRef.current.seekTo(newTime, 'seconds')
  }

  const handleDurationChange = (newDuration: number) => {
    setDuration(newDuration)
    onDurationChange(newDuration)
  }

  const getMarkerTime = (marker: Marker) => {
    return side === 'left' ? marker.leftTime : marker.rightTime
  }

  // 同步模式下用 requestAnimationFrame 推進 currentTime
  useEffect(() => {
    if (!syncMode || !isPlaying) return
    let rafId: number | null = null
    let lastTime = performance.now()
    function step(now: number) {
      if (!isPlaying || !syncMode) return
      const delta = (now - lastTime) / 1000
      lastTime = now
      setCurrentTime(prev => prev + delta)
      rafId = requestAnimationFrame(step)
    }
    rafId = requestAnimationFrame(step)
    return () => {
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [syncMode, isPlaying])

  // 逐幀控制
  const handleStepForward = () => {
    if (playerRef.current) {
      const newTime = Math.min(currentTime + 1/30, duration)
      playerRef.current.seekTo(newTime, 'seconds')
      setCurrentTime(newTime)
    }
  }

  const handleStepBackward = () => {
    if (playerRef.current) {
      const newTime = Math.max(currentTime - 1/30, 0)
      playerRef.current.seekTo(newTime, 'seconds')
      setCurrentTime(newTime)
    }
  }

  if (!videoSource) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">📹</div>
          <p className="text-gray-500">請選擇影片來源</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
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
            }
          }}
          progressInterval={100}
          config={{
            youtube: {
              playerVars: {
                modestbranding: 1,
                controls: 0,
              }
            }
          }}
        />
      </div>
      
      {/* 獨立的標籤選單 */}
      <div className="bg-gray-50 rounded-lg p-2">
        <div className="flex items-center justify-between">
          {/* 左側：影片控制器 */}
          <div className="flex items-center space-x-1">
            <button
              onClick={handleStepBackward}
              className="p-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              title="逐幀後退"
            >
              <SkipBack size={12} />
            </button>
            
            <button
              onClick={handleInternalPlayPause}
              className="p-1.5 bg-primary-600 text-white rounded-full hover:bg-primary-700"
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            </button>
            
            <button
              onClick={handleStepForward}
              className="p-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              title="逐幀前進"
            >
              <SkipForward size={12} />
            </button>
          </div>
          
          {/* 右側：標籤設置 */}
          <div className="flex items-center space-x-1">
            <div className="text-xs font-medium text-gray-700">設置標籤：</div>
            <div className="flex space-x-1">
              {['1', '2', '3', '4', '5'].map((label) => (
                <button
                  key={label}
                  onClick={() => onSetMarkerAtCurrentTime(label, currentTime)}
                  className={`w-6 h-6 rounded-full text-xs font-medium transition-colors ${
                    selectedMarker === label 
                      ? 'bg-red-500 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* 視覺化時間軸 */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-gray-600">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        
        <div className="relative">
          <input
            type="range"
            min={0}
            max={duration}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentTime / duration) * 100}%, #e5e7eb ${(currentTime / duration) * 100}%, #e5e7eb 100%)`
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
                title={`標籤 ${marker.label}: ${formatTime(markerTime)}`}
              >
                <div className={`w-2 h-2 rounded-full border border-white shadow-sm hover:scale-110 transition-transform ${
                  selectedMarker === marker.label ? 'bg-red-500' : 'bg-blue-500'
                }`}></div>
                <div className={`absolute top-2 left-1/2 transform -translate-x-1/2 text-xs px-1 py-0.5 rounded whitespace-nowrap ${
                  selectedMarker === marker.label 
                    ? 'bg-red-500 text-white' 
                    : 'bg-blue-500 text-white'
                }`}>
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