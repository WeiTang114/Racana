import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import VideoPlayer, { VideoPlayerHandle } from './VideoPlayer'
import { VideoSource, Marker } from '../types'
import { Pause, Play, SkipBack, SkipForward, Upload, Zap } from 'lucide-react'

// File System Access API 類型定義
declare global {
  interface Window {
    showOpenFilePicker(options?: {
      types?: Array<{
        description: string
        accept: Record<string, string[]>
      }>
      multiple?: boolean
    }): Promise<FileSystemFileHandle[]>
  }
}

interface FileSystemFileHandle {
  getFile(): Promise<File>
}

const buildLabelsParam = (markers: Marker[], side: 'left' | 'right') => {
  return markers
    .filter(m => (side === 'left' ? m.leftTime !== undefined : m.rightTime !== undefined))
    .map(m => `${m.label}-${side === 'left' ? m.leftTime : m.rightTime}`)
    .join(',')
}

interface RaceAnalyzerProps {
  leftVideo: VideoSource | null
  rightVideo: VideoSource | null
  markers: Marker[]
  syncMode: boolean
  setLeftVideo: (video: VideoSource | null) => void
  setRightVideo: (video: VideoSource | null) => void
  setMarkers: (markers: Marker[] | ((prev: Marker[]) => Marker[])) => void
  setSyncMode: (sync: boolean) => void
  onLeftTimeUpdate: (time: number) => void
  onRightTimeUpdate: (time: number) => void
  leftInitialTime?: number
  rightInitialTime?: number
}

const RaceAnalyzer: React.FC<RaceAnalyzerProps> = ({
  leftVideo,
  rightVideo,
  markers,
  syncMode,
  setLeftVideo,
  setRightVideo,
  setMarkers,
  setSyncMode,
  onLeftTimeUpdate,
  onRightTimeUpdate,
  leftInitialTime,
  rightInitialTime,
}) => {
  const { t } = useTranslation()
  const [isPlaying, setIsPlaying] = useState(false)
  const [leftIsPlaying, setLeftIsPlaying] = useState(false)
  const [rightIsPlaying, setRightIsPlaying] = useState(false)
  const [selectedMarker, setSelectedMarker] = useState<string>('')
  const [leftVideoUrl, setLeftVideoUrl] = useState('')
  const [rightVideoUrl, setRightVideoUrl] = useState('')
  const [showLeftInput, setShowLeftInput] = useState(false)
  const [showRightInput, setShowRightInput] = useState(false)
  const [isMobile, setIsMobile] = useState(false) // 新增 isMobile 狀態
  const [playbackRate, setPlaybackRate] = useState(1) // 播放速度狀態
  
  // 保存原始檔案資訊，用於重新載入
  const [leftOriginalFile, setLeftOriginalFile] = useState<File | null>(null)
  const [rightOriginalFile, setRightOriginalFile] = useState<File | null>(null)
  
  // File System Access API 支援
  const [leftFileHandle, setLeftFileHandle] = useState<FileSystemFileHandle | null>(null)
  const [rightFileHandle, setRightFileHandle] = useState<FileSystemFileHandle | null>(null)
  
  // 檢測 blob URL 是否失效
  const [leftBlobInvalid, setLeftBlobInvalid] = useState(false)
  const [rightBlobInvalid, setRightBlobInvalid] = useState(false)
  
  const leftPlayerRef = useRef<VideoPlayerHandle>(null)
  const rightPlayerRef = useRef<VideoPlayerHandle>(null)
  
  // 檔案選擇器 refs
  const leftFileInputRef = useRef<HTMLInputElement>(null)
  const rightFileInputRef = useRef<HTMLInputElement>(null)
  
  // 初始檔案選擇區域的 refs
  const initialLeftFileInputRef = useRef<HTMLInputElement>(null)
  const initialRightFileInputRef = useRef<HTMLInputElement>(null)
  
  // 長按檢測狀態
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set())
  const longPressTimeoutsRef = useRef<Map<string, number>>(new Map())
  const pressedKeysRef = useRef<Set<string>>(new Set())

  const location = window.location
  const navigate = (url: string) => { window.history.replaceState(null, '', url) }

  // 判斷是否為行動裝置
  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    if (/android|ipad|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
      setIsMobile(true);
    }
  }, []);

  // 定期檢測 blob URL 有效性
  useEffect(() => {
    const interval = setInterval(() => {
      if (leftVideo?.type === 'local' && leftVideo.url.startsWith('blob:')) {
        checkBlobValidity('left')
      }
      if (rightVideo?.type === 'local' && rightVideo.url.startsWith('blob:')) {
        checkBlobValidity('right')
      }
    }, 5000) // 每5秒檢測一次

    return () => clearInterval(interval)
  }, [leftVideo, rightVideo])

  // 清理本地檔案 URL
  useEffect(() => {
    return () => {
      // 組件卸載時清理所有本地檔案 URL
      if (leftVideo?.type === 'local' && leftVideo.url.startsWith('blob:')) {
        URL.revokeObjectURL(leftVideo.url)
      }
      if (rightVideo?.type === 'local' && rightVideo.url.startsWith('blob:')) {
        URL.revokeObjectURL(rightVideo.url)
      }
    }
  }, [])

  // 當影片變更時清理舊的 URL
  useEffect(() => {
    return () => {
      if (leftVideo?.type === 'local' && leftVideo.url.startsWith('blob:')) {
        URL.revokeObjectURL(leftVideo.url)
      }
    }
  }, [leftVideo])

  useEffect(() => {
    return () => {
      if (rightVideo?.type === 'local' && rightVideo.url.startsWith('blob:')) {
        URL.revokeObjectURL(rightVideo.url)
      }
    }
  }, [rightVideo])

  // 長按處理函數
  const handleLongPress = (key: string, _action: () => void) => {
    console.log(`開始長按檢測: ${key}`)
    
    // 階段式長按邏輯
    const stages = [
      { time: 500, jump: 1, description: '0.5秒→快進1秒' },
      { time: 1000, jump: 1, description: '1秒→再快進1秒' },
      { time: 1500, jump: 2, description: '1.5秒→快進2秒' },
      { time: 2000, jump: 5, description: '2秒→快進5秒' }
    ]
    
    const executeAction = (jumpSeconds: number) => {
      console.log(`執行跳轉: ${jumpSeconds}秒`)
      // 根據跳轉秒數執行不同的動作
      if (jumpSeconds === 1) {
        // 0.5秒和1秒時使用逐幀動作
        switch (key) {
          case 'a':
            if (leftPlayerRef.current) leftPlayerRef.current.stepBackward()
            break
          case 'd':
            if (leftPlayerRef.current) leftPlayerRef.current.stepForward()
            break
          case 'j':
            if (rightPlayerRef.current) rightPlayerRef.current.stepBackward()
            break
          case 'l':
            if (rightPlayerRef.current) rightPlayerRef.current.stepForward()
            break
          case 'arrowleft':
            if (leftPlayerRef.current) leftPlayerRef.current.stepBackward()
            if (rightPlayerRef.current) rightPlayerRef.current.stepBackward()
            break
          case 'arrowright':
            if (leftPlayerRef.current) leftPlayerRef.current.stepForward()
            if (rightPlayerRef.current) rightPlayerRef.current.stepForward()
            break
        }
      } else {
        // 根據按鍵執行對應的跳轉動作
        switch (key) {
          case 'a':
            if (leftPlayerRef.current) leftPlayerRef.current.seekTo(-jumpSeconds, true)
            break
          case 'd':
            if (leftPlayerRef.current) leftPlayerRef.current.seekTo(jumpSeconds, true)
            break
          case 'j':
            if (rightPlayerRef.current) rightPlayerRef.current.seekTo(-jumpSeconds, true)
            break
          case 'l':
            if (rightPlayerRef.current) rightPlayerRef.current.seekTo(jumpSeconds, true)
            break
          case 'arrowleft':
            if (leftPlayerRef.current) leftPlayerRef.current.seekTo(-jumpSeconds, true)
            if (rightPlayerRef.current) rightPlayerRef.current.seekTo(-jumpSeconds, true)
            break
          case 'arrowright':
            if (leftPlayerRef.current) leftPlayerRef.current.seekTo(jumpSeconds, true)
            if (rightPlayerRef.current) rightPlayerRef.current.seekTo(jumpSeconds, true)
            break
        }
      }
    }
    
    // 設置階段式觸發
    stages.forEach((stage, index) => {
      const timeoutId = window.setTimeout(() => {
        if (pressedKeysRef.current.has(key)) {
          console.log(`階段 ${index + 1}: ${stage.description}`)
          executeAction(stage.jump)
          
          // 如果是第4個階段（2秒），立即開始持續跳轉
          if (index === 3) {
            console.log(`開始持續跳轉: 每秒5秒`)
            const repeatTimeoutId = window.setInterval(() => {
              if (pressedKeysRef.current.has(key)) {
                console.log(`持續跳轉: 5秒`)
                executeAction(5)
              } else {
                console.log(`停止持續跳轉`)
                clearInterval(repeatTimeoutId)
                longPressTimeoutsRef.current.delete(`${key}_continuous`)
              }
            }, 1000) // 每秒執行一次
            
            longPressTimeoutsRef.current.set(`${key}_continuous`, repeatTimeoutId)
          }
        }
      }, stage.time)
      
      longPressTimeoutsRef.current.set(`${key}_stage_${index}`, timeoutId)
    })
  }

  // 清理長按計時器
  const clearLongPress = (key: string) => {
    console.log(`清理長按: ${key}`)
    
    // 清理所有階段的計時器
    for (let i = 0; i < 4; i++) {
      const timeoutId = longPressTimeoutsRef.current.get(`${key}_stage_${i}`)
      if (timeoutId) {
        clearTimeout(timeoutId)
        longPressTimeoutsRef.current.delete(`${key}_stage_${i}`)
      }
    }
    
    // 清理持續跳轉的計時器
    const continuousId = longPressTimeoutsRef.current.get(`${key}_continuous`)
    if (continuousId) {
      clearInterval(continuousId)
      longPressTimeoutsRef.current.delete(`${key}_continuous`)
    }
  }

  // 格式化時間函數
  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // 當影片載入時自動產生預設標籤
  useEffect(() => {
    if (leftVideo && markers.length === 0) {
      const defaultMarkers: Marker[] = [
        { id: 1, label: '1', leftTime: 0, rightTime: 0, videoSide: 'both' },
        { id: 2, label: '2', leftTime: 0, rightTime: 0, videoSide: 'both' },
        { id: 3, label: '3', leftTime: 0, rightTime: 0, videoSide: 'both' },
        { id: 4, label: '4', leftTime: 0, rightTime: 0, videoSide: 'both' },
        { id: 5, label: '5', leftTime: 0, rightTime: 0, videoSide: 'both' },
      ]
      setMarkers(defaultMarkers)
    }
  }, [leftVideo, markers.length, setMarkers])

  // 同步播放邏輯（效能優化）
  useEffect(() => {
    let rafId: number | null = null

    function step(_now: number) {
      if (!isPlaying || !syncMode) return
      rafId = requestAnimationFrame(step)
    }

    if (isPlaying && syncMode) {
      rafId = requestAnimationFrame(step)
    }
    return () => {
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [isPlaying, syncMode])

  const handleAddMarker = (time: number, label: string, side: 'left' | 'right') => {
    setMarkers((prev: Marker[]) => {
      const existingMarker = prev.find((m: Marker) => m.label === label)
      if (existingMarker) {
        return prev.map((m: Marker) => 
          m.label === label 
            ? { ...m, [`${side}Time`]: time }
            : m
        )
      } else {
        const newMarker: Marker = {
          id: Date.now(),
          label,
          leftTime: side === 'left' ? time : undefined,
          rightTime: side === 'right' ? time : undefined,
          videoSide: 'both'
        }
        return [...prev, newMarker]
      }
    })
  }

  const handleJumpToMarker = (marker: Marker, side: 'left' | 'right') => {
    const time = side === 'left' ? marker.leftTime : marker.rightTime
    if (time !== undefined) {
      if (side === 'left' && leftPlayerRef.current) {
        leftPlayerRef.current.seekTo(time)
      } else if (side === 'right' && rightPlayerRef.current) {
        rightPlayerRef.current.seekTo(time)
      }
      setIsPlaying(false)
    }
  }

  const handleDeleteMarker = (markerId: number) => {
    setMarkers(markers.filter(m => m.id !== markerId))
  }

  const handleSetMarkerAtCurrentTime = (label: string, time: number, side: 'left' | 'right') => {
    handleAddMarker(time, label, side)
  }

  // 檔案選擇處理函數
  const handleFileSelect = (side: 'left' | 'right') => {
    // 優先使用主要內容區域的檔案輸入元素
    let fileInput: HTMLInputElement | null = null
    
    if (side === 'left') {
      // 優先使用主要內容區域的 ref
      fileInput = leftFileInputRef.current
      // 如果主要內容區域的 ref 不存在，則使用初始區域的 ref
      if (!fileInput) {
        fileInput = initialLeftFileInputRef.current
      }
    } else {
      // 優先使用主要內容區域的 ref
      fileInput = rightFileInputRef.current
      // 如果主要內容區域的 ref 不存在，則使用初始區域的 ref
      if (!fileInput) {
        fileInput = initialRightFileInputRef.current
      }
    }
    
    if (fileInput) {
      fileInput.click()
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, side: 'left' | 'right') => {
    const file = event.target.files?.[0]
    if (file) {
      // 檢查是否為影片檔案
      const videoTypes = [
        'video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/wmv',
        'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv',
        'video/x-matroska', 'video/3gpp', 'video/3gpp2'
      ]
      
      // 檢查檔案副檔名
      const fileExtension = file.name.toLowerCase().split('.').pop()
      const supportedExtensions = ['mp4', 'webm', 'ogg', 'avi', 'mov', 'wmv', 'mkv', '3gp', '3g2']
      
      console.log('檔案資訊:', {
        name: file.name,
        type: file.type,
        size: file.size,
        extension: fileExtension
      })
      
      if (!videoTypes.includes(file.type) && !supportedExtensions.includes(fileExtension || '')) {
        alert(`請選擇有效的影片檔案格式 (MP4, WebM, OGG, AVI, MOV, WMV, MKV, 3GP)\n\n檔案類型: ${file.type}\n檔案副檔名: ${fileExtension}`)
        return
      }

      // 創建本地檔案 URL
      const videoUrl = URL.createObjectURL(file)
      const videoSource: VideoSource = {
        type: 'local',
        url: videoUrl,
        title: file.name
      }

      if (side === 'left') {
        setLeftVideo(videoSource)
        setLeftOriginalFile(file) // 保存原始檔案
        setLeftBlobInvalid(false) // 重置失效狀態
        setLeftVideoUrl('')
        setShowLeftInput(false)
      } else {
        setRightVideo(videoSource)
        setRightOriginalFile(file) // 保存原始檔案
        setRightBlobInvalid(false) // 重置失效狀態
        setRightVideoUrl('')
        setShowRightInput(false)
      }

      // 清理檔案選擇器
      event.target.value = ''
    }
  }

  // 重新載入檔案功能
  const handleReloadFile = async (side: 'left' | 'right') => {
    const originalFile = side === 'left' ? leftOriginalFile : rightOriginalFile
    const fileHandle = side === 'left' ? leftFileHandle : rightFileHandle
    
    // 優先使用 File System Access API 的檔案句柄
    if (fileHandle) {
      try {
        const file = await fileHandle.getFile()
        const videoUrl = URL.createObjectURL(file)
        const videoSource: VideoSource = {
          type: 'local',
          url: videoUrl,
          title: file.name
        }

        if (side === 'left') {
          setLeftVideo(videoSource)
          setLeftOriginalFile(file)
          setLeftBlobInvalid(false)
        } else {
          setRightVideo(videoSource)
          setRightOriginalFile(file)
          setRightBlobInvalid(false)
        }
        return
      } catch (error) {
        console.error('使用檔案句柄重新載入失敗:', error)
        // 如果檔案句柄失效，清除它
        if (side === 'left') {
          setLeftFileHandle(null)
        } else {
          setRightFileHandle(null)
        }
      }
    }
    
    // 檢查 originalFile 是否為有效的 File 物件
    if (originalFile && originalFile instanceof File) {
      // 重新創建 blob URL
      const videoUrl = URL.createObjectURL(originalFile)
      const videoSource: VideoSource = {
        type: 'local',
        url: videoUrl,
        title: originalFile.name
      }

      if (side === 'left') {
        setLeftVideo(videoSource)
        setLeftBlobInvalid(false) // 重置失效狀態
      } else {
        setRightVideo(videoSource)
        setRightBlobInvalid(false) // 重置失效狀態
      }
    } else {
      // 無法重新載入時，自動觸發檔案選擇器
      console.log(`無法重新載入 ${side} 側檔案，觸發檔案選擇器`)
      if (side === 'left') {
        setLeftOriginalFile(null)
        setLeftBlobInvalid(false)
        // 觸發檔案選擇器
        if (leftFileInputRef.current) {
          leftFileInputRef.current.click()
        } else if (initialLeftFileInputRef.current) {
          initialLeftFileInputRef.current.click()
        }
      } else {
        setRightOriginalFile(null)
        setRightBlobInvalid(false)
        // 觸發檔案選擇器
        if (rightFileInputRef.current) {
          rightFileInputRef.current.click()
        } else if (initialRightFileInputRef.current) {
          initialRightFileInputRef.current.click()
        }
      }
    }
  }

  // 檢測 blob URL 是否失效
  const checkBlobValidity = (side: 'left' | 'right') => {
    const video = side === 'left' ? leftVideo : rightVideo
    const originalFile = side === 'left' ? leftOriginalFile : rightOriginalFile
    
    if (video?.type === 'local' && video.url.startsWith('blob:') && originalFile) {
      // 嘗試訪問 blob URL，如果失敗則標記為失效
      fetch(video.url, { method: 'HEAD' })
        .then(response => {
          if (!response.ok) {
            if (side === 'left') {
              setLeftBlobInvalid(true)
            } else {
              setRightBlobInvalid(true)
            }
          }
        })
        .catch(() => {
          // 如果無法訪問，標記為失效
          if (side === 'left') {
            setLeftBlobInvalid(true)
          } else {
            setRightBlobInvalid(true)
          }
        })
    }
  }

  const handleVideoSubmit = (side: 'left' | 'right') => {
    const url = side === 'left' ? leftVideoUrl : rightVideoUrl
    if (url.trim()) {
      let videoSource: VideoSource
      
      // 判斷是否為本地檔案
      if (url.startsWith('file://') || url.startsWith('/') || url.includes('\\')) {
        // 本地檔案
        videoSource = {
          type: 'local',
          url: url.trim(),
          title: url.split('/').pop() || url.split('\\').pop() || '本地檔案' // 提取檔案名
        }
      } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
        // YouTube 影片
        videoSource = {
          type: 'youtube',
          url: url.trim()
        }
      } else {
        // 其他網路影片
        videoSource = {
          type: 'local', // 預設為 local 類型
          url: url.trim()
        }
      }
      
      if (side === 'left') {
        setLeftVideo(videoSource)
        setLeftVideoUrl('')
        setShowLeftInput(false)
      } else {
        setRightVideo(videoSource)
        setRightVideoUrl('')
        setShowRightInput(false)
      }
    }
  }

  const handleChangeVideo = (side: 'left' | 'right') => {
    if (side === 'left') {
      setShowLeftInput(true)
      setLeftVideoUrl('')
    } else {
      setShowRightInput(true)
      setRightVideoUrl('')
    }
  }

  // 同步跳轉到標籤
  const handleSyncJumpToMarker = (marker: Marker) => {
    if (marker.leftTime !== undefined && leftPlayerRef.current) {
      leftPlayerRef.current.seekTo(marker.leftTime)
    }
    if (marker.rightTime !== undefined && rightPlayerRef.current) {
      rightPlayerRef.current.seekTo(marker.rightTime)
    }
    setIsPlaying(false)
  }

  // 逐幀控制
  const handleStepForward = () => {
    if (leftPlayerRef.current) leftPlayerRef.current.stepForward()
    if (rightPlayerRef.current) rightPlayerRef.current.stepForward()
    setIsPlaying(false)
  }

  const handleStepBackward = () => {
    if (leftPlayerRef.current) leftPlayerRef.current.stepBackward()
    if (rightPlayerRef.current) rightPlayerRef.current.stepBackward()
    setIsPlaying(false)
  }

  // 五秒跳轉控制
  const handleJumpForward = () => {
    if (leftPlayerRef.current) leftPlayerRef.current.seekTo(5, true)
    if (rightPlayerRef.current) rightPlayerRef.current.seekTo(5, true)
    setIsPlaying(false)
  }

  const handleJumpBackward = () => {
    if (leftPlayerRef.current) leftPlayerRef.current.seekTo(-5, true)
    if (rightPlayerRef.current) rightPlayerRef.current.seekTo(-5, true)
    setIsPlaying(false)
  }

  // 左影片控制
  const handleLeftStepForward = () => {
    if (leftPlayerRef.current) leftPlayerRef.current.stepForward()
    setLeftIsPlaying(false)
  }

  const handleLeftStepBackward = () => {
    if (leftPlayerRef.current) leftPlayerRef.current.stepBackward()
    setLeftIsPlaying(false)
  }

  const handleLeftJumpForward = () => {
    if (leftPlayerRef.current) leftPlayerRef.current.seekTo(5, true)
    setLeftIsPlaying(false)
  }

  const handleLeftJumpBackward = () => {
    if (leftPlayerRef.current) leftPlayerRef.current.seekTo(-5, true)
    setLeftIsPlaying(false)
  }

  const handleLeftPlayPause = () => {
    const newLeftPlaying = !leftIsPlaying
    setLeftIsPlaying(newLeftPlaying)
    // 在同步模式下，左影片的播放狀態不影響全域播放狀態
    // 只有全域播放控制才會影響兩邊
  }

  // 右影片控制
  const handleRightStepForward = () => {
    if (rightPlayerRef.current) rightPlayerRef.current.stepForward()
    setRightIsPlaying(false)
  }

  const handleRightStepBackward = () => {
    if (rightPlayerRef.current) rightPlayerRef.current.stepBackward()
    setRightIsPlaying(false)
  }

  const handleRightJumpForward = () => {
    if (rightPlayerRef.current) rightPlayerRef.current.seekTo(5, true)
    setRightIsPlaying(false)
  }

  const handleRightJumpBackward = () => {
    if (rightPlayerRef.current) rightPlayerRef.current.seekTo(-5, true)
    setRightIsPlaying(false)
  }

  // 右影片控制
  const handleRightPlayPause = () => {
    const newRightPlaying = !rightIsPlaying
    setRightIsPlaying(newRightPlaying)
    // 在同步模式下，右影片的播放狀態不影響全域播放狀態
    // 只有全域播放控制才會影響兩邊
  }

  // 全域播放控制（用於同步模式）
  const handleGlobalPlayPause = () => {
    const newPlayingState = !isPlaying
    setIsPlaying(newPlayingState)
    // 在同步模式下，全域播放控制會同時影響兩邊
    if (syncMode) {
      setLeftIsPlaying(newPlayingState)
      setRightIsPlaying(newPlayingState)
    }
  }

  // 播放速度控制
  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate)
    // 同時設置兩個播放器的速度
    if (leftPlayerRef.current) {
      leftPlayerRef.current.setPlaybackRate(rate)
    }
    if (rightPlayerRef.current) {
      rightPlayerRef.current.setPlaybackRate(rate)
    }
  }



  // 鍵盤快速鍵
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 如果正在輸入框中，不觸發快速鍵
      if (event.target instanceof HTMLInputElement) {
        const input = event.target as HTMLInputElement
        // 如果是時間軸（range input），允許快捷鍵
        if (input.type === 'range') {
          // 允許快捷鍵，不返回
        } else {
          // 其他輸入框（text, textarea等）不觸發快捷鍵
          return
        }
      } else if (event.target instanceof HTMLTextAreaElement) {
        return
      }

      const key = event.key.toLowerCase()
      
      // 檢查是否已經按下
      if (pressedKeys.has(key)) {
        return
      }

      // 添加到按下的鍵集合
      setPressedKeys(prev => new Set(prev).add(key))
      pressedKeysRef.current.add(key)

      switch (key) {
        case 'a': // 左影片逐幀後退
          event.preventDefault()
          handleLeftStepBackward()
          // 設置長按檢測
          handleLongPress(key, handleLeftJumpBackward)
          break
        case 'd': // 左影片逐幀前進
          event.preventDefault()
          handleLeftStepForward()
          // 設置長按檢測
          handleLongPress(key, handleLeftJumpForward)
          break
        case 's': // 左影片播放/暫停
          event.preventDefault()
          console.log('S 按鍵被按下，當前 leftIsPlaying:', leftIsPlaying, 'syncMode:', syncMode)
          handleLeftPlayPause()
          break
        case 'j': // 右影片逐幀後退
          event.preventDefault()
          handleRightStepBackward()
          // 設置長按檢測
          handleLongPress(key, handleRightJumpBackward)
          break
        case 'l': // 右影片逐幀前進
          event.preventDefault()
          handleRightStepForward()
          // 設置長按檢測
          handleLongPress(key, handleRightJumpForward)
          break
        case 'k': // 右影片播放/暫停
          event.preventDefault()
          console.log('K 按鍵被按下，當前 rightIsPlaying:', rightIsPlaying, 'syncMode:', syncMode)
          handleRightPlayPause()
          break
        case ' ': // 空白鍵：兩邊一起播放/暫停
          event.preventDefault()
          handleGlobalPlayPause()
          break
        case 'arrowleft': // 左箭頭：兩邊一起逐幀後退
          event.preventDefault()
          handleStepBackward()
          // 設置長按檢測
          handleLongPress(key, handleJumpBackward)
          break
        case 'arrowright': // 右箭頭：兩邊一起逐幀前進
          event.preventDefault()
          handleStepForward()
          // 設置長按檢測
          handleLongPress(key, handleJumpForward)
          break
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      
      // 從按下的鍵集合中移除
      setPressedKeys(prev => {
        const newSet = new Set(prev)
        newSet.delete(key)
        return newSet
      })
      pressedKeysRef.current.delete(key)
      
      // 清理長按計時器
      clearLongPress(key)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [isPlaying, leftIsPlaying, rightIsPlaying, syncMode, pressedKeys])

  // 清除 session 資料
  const clearSessionData = () => {
    try {
      sessionStorage.removeItem('leftVideo')
      sessionStorage.removeItem('rightVideo')
      sessionStorage.removeItem('markers')
      sessionStorage.removeItem('syncMode')
      
      // 清除狀態
      setLeftVideo(null)
      setRightVideo(null)
      setMarkers([])
      setSyncMode(true)
      setSelectedMarker('')
      
      console.log('已清除所有 session 資料')
      // 清除網址參數
      window.history.replaceState(null, '', window.location.pathname)
    } catch (error) {
      console.warn('清除 session 資料時發生錯誤:', error)
    }
  }

  // 使用 File System Access API 選擇檔案
  const handleFileSelectWithAPI = async (side: 'left' | 'right') => {
    try {
      // 檢查瀏覽器是否支援 File System Access API
      if (!('showOpenFilePicker' in window)) {
        console.log('瀏覽器不支援 File System Access API，使用傳統檔案選擇器')
        handleFileSelect(side)
        return
      }

      const options = {
        types: [
          {
            description: '影片檔案',
            accept: {
              'video/*': ['.mp4', '.webm', '.ogg', '.avi', '.mov', '.wmv']
            }
          }
        ],
        multiple: false
      }

      const [fileHandle] = await window.showOpenFilePicker(options)
      const file = await fileHandle.getFile()

      // 檢查是否為影片檔案
      const videoTypes = [
        'video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/wmv',
        'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv',
        'video/x-matroska', 'video/3gpp', 'video/3gpp2'
      ]
      
      // 檢查檔案副檔名
      const fileExtension = file.name.toLowerCase().split('.').pop()
      const supportedExtensions = ['mp4', 'webm', 'ogg', 'avi', 'mov', 'wmv', 'mkv', '3gp', '3g2']
      
      console.log('檔案資訊 (API):', {
        name: file.name,
        type: file.type,
        size: file.size,
        extension: fileExtension
      })
      
      if (!videoTypes.includes(file.type) && !supportedExtensions.includes(fileExtension || '')) {
        alert(`請選擇有效的影片檔案格式 (MP4, WebM, OGG, AVI, MOV, WMV, MKV, 3GP)\n\n檔案類型: ${file.type}\n檔案副檔名: ${fileExtension}`)
        return
      }

      // 創建本地檔案 URL
      const videoUrl = URL.createObjectURL(file)
      const videoSource: VideoSource = {
        type: 'local',
        url: videoUrl,
        title: file.name
      }

      if (side === 'left') {
        setLeftVideo(videoSource)
        setLeftOriginalFile(file)
        setLeftFileHandle(fileHandle) // 保存檔案句柄
        setLeftBlobInvalid(false)
        setLeftVideoUrl('')
        setShowLeftInput(false)
      } else {
        setRightVideo(videoSource)
        setRightOriginalFile(file)
        setRightFileHandle(fileHandle) // 保存檔案句柄
        setRightBlobInvalid(false)
        setRightVideoUrl('')
        setShowRightInput(false)
      }
    } catch (error) {
      console.error('檔案選擇失敗:', error)
      // 如果 File System Access API 失敗，回退到傳統檔案選擇器
      handleFileSelect(side)
    }
  }

  // 狀態變動時自動更新網址參數
  useEffect(() => {
    // 只針對 YouTube 影片同步網址
    const leftId = leftVideo && leftVideo.type === 'youtube' ? (leftVideo.url.match(/[?&]v=([^&]+)/)?.[1] || '') : ''
    const rightId = rightVideo && rightVideo.type === 'youtube' ? (rightVideo.url.match(/[?&]v=([^&]+)/)?.[1] || '') : ''
    const leftLabels = buildLabelsParam(markers, 'left')
    const rightLabels = buildLabelsParam(markers, 'right')
    const params = new URLSearchParams(location.search)
    if (leftId) params.set('left', leftId)
    if (rightId) params.set('right', rightId)
    if (leftLabels) params.set('leftLabels', leftLabels)
    if (rightLabels) params.set('rightLabels', rightLabels)
    const newUrl = location.pathname + (params.toString() ? `?${params.toString()}` : '')
    console.log('RaceAnalyzer updating URL:', { leftId, rightId, newUrl }) // 添加除錯日誌
    navigate(newUrl)
  }, [leftVideo, rightVideo, markers, location.search, location.pathname, navigate])

  return (
    <div className="space-y-2">
      {/* 初始介面 */}
      {!leftVideo && !rightVideo && (
        <div className="bg-cyber-light/80 backdrop-blur-sm rounded-lg border border-cyber-blue/20 shadow-neon p-4">
          <h2 className="text-lg font-semibold mb-3 text-cyber-blue">{t('app.welcome')}</h2>
          <p className="text-sm text-cyber-blue/80 mb-4">
            {t('app.welcomeDescription')}
          </p>
          
          <div className="p-2 bg-cyber-dark/50 rounded-lg border border-cyber-blue/20">
            <p className="text-xs text-cyber-blue/70">
              {t('app.supportedFormats')}<br/>
              {t('app.youCanAlsoEnter')}
            </p>
          </div>
        </div>
      )}

      {/* 主要內容區域 - 並排佈局 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        {/* 左側影片 */}
        <div className="bg-cyber-light/80 backdrop-blur-sm rounded-lg border border-cyber-blue/20 shadow-neon p-2">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2">
              <h3 className={`font-semibold text-cyber-purple ${isMobile ? 'text-xs' : 'text-sm'}`}>{t('video.myRecording')}</h3>
              {leftVideo?.title && (
                <span className={`text-cyber-blue/70 truncate ${isMobile ? 'text-xs max-w-20' : 'text-xs max-w-32'}`} title={leftVideo.title}>
                  - {leftVideo.title}
                </span>
              )}
            </div>
            <div className="flex space-x-1">
              {leftVideo ? (
                <button
                  onClick={() => handleChangeVideo('left')}
                  className={`bg-cyber-dark/50 text-cyber-blue rounded hover:bg-cyber-blue/20 border border-cyber-blue/30 transition-all duration-300 ${isMobile ? 'px-1 py-0.5 text-xs' : 'px-2 py-1 text-xs'}`}
                  title={t('video.changeVideo')}
                >
                  {isMobile ? t('video.mobile.changeVideo') : t('video.changeVideo')}
                </button>
              ) : null}
              {leftBlobInvalid && leftVideo && leftVideo.type === 'local' && (
                <button
                  onClick={() => handleReloadFile('left')}
                  className={`rounded hover:bg-cyber-red/20 bg-cyber-red/10 text-cyber-red border border-cyber-red/30 transition-all duration-300 ${isMobile ? 'px-1 py-0.5 text-xs' : 'px-2 py-1 text-xs'}`}
                  title="檔案載入失敗，點擊重新選擇檔案"
                >
                  {isMobile ? t('video.mobile.reloadFile') : '重新選擇'}
                </button>
              )}
            </div>
          </div>
          
          {showLeftInput || !leftVideo ? (
            <div className="mb-2">
              <div className="flex space-x-1">
                <input
                  type="text"
                  placeholder={t('video.videoPathOrYouTube')}
                  value={leftVideoUrl}
                  onChange={(e) => setLeftVideoUrl(e.target.value)}
                  className="flex-1 px-2 py-1 bg-cyber-dark/50 border border-cyber-blue/30 rounded text-xs text-cyber-blue placeholder-cyber-blue/50 focus:outline-none focus:ring-1 focus:ring-cyber-blue focus:border-cyber-blue"
                />
                <button
                  onClick={() => handleVideoSubmit('left')}
                  className="px-2 py-1 bg-cyber-blue text-white rounded text-xs hover:bg-cyber-purple transition-all duration-300 font-medium"
                >
                  {t('video.load')}
                </button>
                <button
                  onClick={() => handleFileSelectWithAPI('left')}
                  className="px-2 py-1 bg-cyber-green text-white rounded text-xs hover:bg-cyber-blue transition-all duration-300 flex items-center relative z-10 font-medium"
                  title="選擇本地影片檔案"
                  style={{ pointerEvents: 'auto' }}
                >
                  <Upload size={12} />
                </button>
                {showLeftInput && (
                  <button
                    onClick={() => setShowLeftInput(false)}
                    className="px-2 py-1 bg-cyber-dark/50 text-cyber-blue rounded text-xs hover:bg-cyber-blue/20 border border-cyber-blue/30 transition-all duration-300"
                  >
                    {t('common.cancel')}
                  </button>
                )}
              </div>
            </div>
          ) : null}
          
          {/* 隱藏的檔案輸入元素 - 移到條件渲染外部 */}
          <input
            ref={leftFileInputRef}
            type="file"
            accept="video/*"
            onChange={(e) => handleFileChange(e, 'left')}
            className="hidden"
          />
          
          <VideoPlayer
            ref={leftPlayerRef}
            videoSource={leftVideo}
            isPlaying={leftIsPlaying}
            onPlayPause={setLeftIsPlaying}
            onTimeUpdate={onLeftTimeUpdate}
            onDurationChange={() => {}}
            syncMode={syncMode}
            side="left"
            markers={markers}
            onJumpToMarker={(marker) => handleJumpToMarker(marker, 'left')}
            onSetMarkerAtCurrentTime={(label, time) => handleSetMarkerAtCurrentTime(label, time, 'left')}
            selectedMarker={selectedMarker}
            jumpToTime={undefined}
            initialTime={leftInitialTime}
            isMobile={isMobile}
          />
        </div>

        {/* 右側影片 */}
        <div className="bg-cyber-light/80 backdrop-blur-sm rounded-lg border border-cyber-orange/20 shadow-neon-orange p-2">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2">
              <h3 className={`font-semibold text-cyber-orange ${isMobile ? 'text-xs' : 'text-sm'}`}>
                {t('video.expertRecording')}
                {isMobile && <span className="text-xs text-cyber-orange/70 ml-1">({t('video.mobile.muted')})</span>}
              </h3>
              {rightVideo?.title && (
                <span className={`text-cyber-orange/70 truncate ${isMobile ? 'text-xs max-w-20' : 'text-xs max-w-32'}`} title={rightVideo.title}>
                  - {rightVideo.title}
                </span>
              )}
            </div>
            <div className="flex space-x-1">
              {rightVideo ? (
                <button
                  onClick={() => handleChangeVideo('right')}
                  className={`bg-cyber-dark/50 text-cyber-orange rounded hover:bg-cyber-orange/20 border border-cyber-orange/30 transition-all duration-300 ${isMobile ? 'px-1 py-0.5 text-xs' : 'px-2 py-1 text-xs'}`}
                  title={t('video.changeVideo')}
                >
                  {isMobile ? t('video.mobile.changeVideo') : t('video.changeVideo')}
                </button>
              ) : null}
              {rightBlobInvalid && rightVideo && rightVideo.type === 'local' && (
                <button
                  onClick={() => handleReloadFile('right')}
                  className={`rounded hover:bg-cyber-red/20 bg-cyber-red/10 text-cyber-red border border-cyber-red/30 transition-all duration-300 ${isMobile ? 'px-1 py-0.5 text-xs' : 'px-2 py-1 text-xs'}`}
                  title="檔案載入失敗，點擊重新選擇檔案"
                >
                  {isMobile ? t('video.mobile.reloadFile') : '重新選擇'}
                </button>
              )}
            </div>
          </div>
          
          {showRightInput || !rightVideo ? (
            <div className="mb-2">
              <div className="flex space-x-1">
                <input
                  type="text"
                  placeholder={t('video.videoPathOrYouTube')}
                  value={rightVideoUrl}
                  onChange={(e) => setRightVideoUrl(e.target.value)}
                  className="flex-1 px-2 py-1 bg-cyber-dark/50 border border-cyber-orange/30 rounded text-xs text-cyber-orange placeholder-cyber-orange/50 focus:outline-none focus:ring-1 focus:ring-cyber-orange focus:border-cyber-orange"
                />
                <button
                  onClick={() => handleVideoSubmit('right')}
                  className="px-2 py-1 bg-cyber-orange text-white rounded text-xs hover:bg-cyber-orange/80 transition-all duration-300 font-medium"
                >
                  {t('video.load')}
                </button>
                <button
                  onClick={() => handleFileSelectWithAPI('right')}
                  className="px-2 py-1 bg-cyber-green text-white rounded text-xs hover:bg-cyber-orange transition-all duration-300 flex items-center relative z-10 font-medium"
                  title="選擇本地影片檔案"
                  style={{ pointerEvents: 'auto' }}
                >
                  <Upload size={12} />
                </button>
                {showRightInput && (
                  <button
                    onClick={() => setShowRightInput(false)}
                    className="px-2 py-1 bg-cyber-dark/50 text-cyber-orange rounded text-xs hover:bg-cyber-orange/20 border border-cyber-orange/30 transition-all duration-300"
                  >
                    {t('common.cancel')}
                  </button>
                )}
              </div>
            </div>
          ) : null}
          
          {/* 隱藏的檔案輸入元素 */}
          <input
            ref={rightFileInputRef}
            type="file"
            accept="video/*"
            onChange={(e) => handleFileChange(e, 'right')}
            className="hidden"
          />
          
          <VideoPlayer
            ref={rightPlayerRef}
            videoSource={rightVideo}
            isPlaying={rightIsPlaying}
            onPlayPause={setRightIsPlaying}
            onTimeUpdate={onRightTimeUpdate}
            onDurationChange={() => {}}
            syncMode={syncMode}
            side="right"
            markers={markers}
            onJumpToMarker={(marker) => handleJumpToMarker(marker, 'right')}
            onSetMarkerAtCurrentTime={(label, time) => handleSetMarkerAtCurrentTime(label, time, 'right')}
            selectedMarker={selectedMarker}
            jumpToTime={undefined}
            initialTime={rightInitialTime}
            isMobile={isMobile}
          />
        </div>
      </div>

      {/* 播放控制 - 移到下方 */}
      <div className="bg-cyber-light/80 backdrop-blur-sm rounded-lg border border-cyber-blue/20 p-3">
        <div className={`flex items-center justify-between ${isMobile ? 'flex-col space-y-2' : ''}`}>
          <div className="flex items-center space-x-2">
            <h3 className={`font-semibold text-cyber-blue ${isMobile ? 'text-xs' : 'text-sm'}`}>{t('controls.playbackControl')}</h3>
          </div>
          
          {/* 播放控制按鈕 - 置中 */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleGlobalPlayPause}
              className={`bg-cyber-blue/80 text-white rounded-full hover:bg-cyber-blue transition-all duration-300 ${isMobile ? 'p-1.5' : 'p-2'}`}
            >
              {isPlaying ? <Pause size={isMobile ? 14 : 16} /> : <Play size={isMobile ? 14 : 16} />}
            </button>
            
            <button
              onClick={handleStepBackward}
              className={`bg-cyber-dark/70 text-cyber-blue rounded hover:bg-cyber-blue/20 border border-cyber-blue/30 transition-all duration-300 ${isMobile ? 'p-1' : 'p-1.5'}`}
              title={t('controls.frameBackward')}
            >
              <SkipBack size={isMobile ? 12 : 14} />
            </button>
            
            <button
              onClick={handleStepForward}
              className={`bg-cyber-dark/70 text-cyber-blue rounded hover:bg-cyber-blue/20 border border-cyber-blue/30 transition-all duration-300 ${isMobile ? 'p-1' : 'p-1.5'}`}
              title={t('controls.frameForward')}
            >
              <SkipForward size={isMobile ? 12 : 14} />
            </button>
          </div>
          
          {/* 右側控制區域 */}
          <div className="flex items-center space-x-2">
            {/* 播放速度控制 */}
            <div className="flex items-center space-x-2">
              <span className={`text-cyber-blue/70 ${isMobile ? 'text-xs' : 'text-xs'}`}>{t('controls.playbackSpeed')}:</span>
              <select
                value={playbackRate}
                onChange={(e) => handlePlaybackRateChange(parseFloat(e.target.value))}
                className={`bg-cyber-dark/50 text-cyber-blue border border-cyber-blue/30 rounded focus:outline-none focus:ring-1 focus:ring-cyber-blue focus:border-cyber-blue transition-all duration-300 ${isMobile ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-xs'}`}
              >
                <option value={0.25}>0.25x</option>
                <option value={0.5}>0.5x</option>
                <option value={0.75}>0.75x</option>
                <option value={1}>1x</option>
                <option value={1.25}>1.25x</option>
                <option value={1.5}>1.5x</option>
                <option value={2}>2x</option>
              </select>
            </div>
            
            {/* 清除資料按鈕 - 最右邊 */}
            <button
              onClick={clearSessionData}
              className={`bg-cyber-dark/50 text-cyber-red/70 rounded font-medium hover:bg-cyber-red/20 border border-cyber-red/20 transition-all duration-300 ${isMobile ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-xs'}`}
              title={t('controls.clearAllSavedData')}
            >
              {isMobile ? t('controls.mobile.clearData') : t('controls.clearData')}
            </button>
          </div>
        </div>
      </div>

      {/* 標籤管理 - 簡化版 */}
      <div className="bg-cyber-light/80 backdrop-blur-sm rounded-lg border border-cyber-purple/20 p-2">
        <h3 className={`font-semibold mb-1 text-cyber-purple ${isMobile ? 'text-xs' : 'text-sm'}`}>{t('markers.markerManagement')}</h3>
        
        <div className={`grid gap-1.5 ${isMobile ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'}`}>
          {markers.map((marker) => (
            <div
              key={marker.id}
              className={`rounded border backdrop-blur-sm transition-all duration-300 ${
                selectedMarker === marker.label 
                  ? 'border-cyber-pink bg-cyber-pink/20' 
                  : 'border-cyber-purple/30 bg-cyber-dark/50 hover:bg-cyber-purple/20'
              } ${isMobile ? 'p-1 text-xs' : 'p-1.5 text-xs'}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`px-1 py-0.5 rounded font-medium ${
                  selectedMarker === marker.label 
                    ? 'bg-cyber-pink/90 text-white' 
                    : 'bg-cyber-purple/90 text-white'
                } ${isMobile ? 'text-xs' : 'text-xs'}`}>
                  {marker.label}
                </span>
                <div className="flex space-x-1">
                  <button
                    onClick={() => setSelectedMarker(marker.label)}
                    className={`text-cyber-blue hover:text-cyber-neon transition-colors duration-300 ${isMobile ? 'text-xs' : 'text-xs'}`}
                  >
                    {selectedMarker === marker.label ? '✓' : (isMobile ? t('markers.mobile.select') : t('markers.select'))}
                  </button>
                  <button
                    onClick={() => handleDeleteMarker(marker.id)}
                    className="text-cyber-red hover:text-cyber-pink transition-colors duration-300"
                  >
                    ×
                  </button>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className={`flex items-center justify-between ${isMobile ? 'flex-col space-y-1' : ''}`}>
                  <div className="flex items-center space-x-1">
                    <span className={`text-cyber-blue/70 ${isMobile ? 'text-xs' : 'text-xs'}`}>{isMobile ? t('video.mobile.left') : t('video.left')}:</span>
                    <span className={`text-cyber-blue ${isMobile ? 'text-xs' : 'text-xs'}`}>
                      {marker.leftTime !== undefined ? formatTime(marker.leftTime) : '-'}
                    </span>
                    <button
                      onClick={() => handleJumpToMarker(marker, 'left')}
                      disabled={marker.leftTime === undefined}
                      className={`bg-cyber-blue/30 text-cyber-blue rounded hover:bg-cyber-blue/40 disabled:opacity-50 transition-all duration-300 ${isMobile ? 'px-0.5 py-0.5 text-xs' : 'px-1 py-0.5 text-xs'}`}
                    >
                      {isMobile ? t('markers.mobile.jump') : t('markers.jump')}
                    </button>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <span className={`text-cyber-orange/70 ${isMobile ? 'text-xs' : 'text-xs'}`}>{isMobile ? '右' : t('video.right')}:</span>
                    <span className={`text-cyber-orange ${isMobile ? 'text-xs' : 'text-xs'}`}>
                      {marker.rightTime !== undefined ? formatTime(marker.rightTime) : '-'}
                    </span>
                    <button
                      onClick={() => handleJumpToMarker(marker, 'right')}
                      disabled={marker.rightTime === undefined}
                      className={`bg-cyber-orange/30 text-cyber-orange rounded hover:bg-cyber-orange/40 disabled:opacity-50 transition-all duration-300 ${isMobile ? 'px-0.5 py-0.5 text-xs' : 'px-1 py-0.5 text-xs'}`}
                    >
                      {isMobile ? t('markers.mobile.jump') : t('markers.jump')}
                    </button>
                  </div>
                </div>
                
                {/* 同步跳轉按鈕 */}
                <div className="flex justify-center pt-0.5">
                  <button
                    onClick={() => handleSyncJumpToMarker(marker)}
                    disabled={marker.leftTime === undefined || marker.rightTime === undefined}
                    className={`bg-cyber-green/90 text-white rounded hover:bg-cyber-green transition-all duration-300 ${isMobile ? 'px-1 py-0.5 text-xs' : 'px-1.5 py-0.5 text-xs'}`}
                    title={t('markers.syncJumpToMarker')}
                  >
                    {isMobile ? t('markers.mobile.syncJump') : t('markers.syncJump')}
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {markers.length === 0 && (
            <div className="col-span-full text-center text-cyber-blue/50 py-1 text-xs">
              {isMobile ? t('markers.mobile.noMarkers') : t('markers.noMarkersAdded')}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default RaceAnalyzer 