export interface VideoSource {
  type: 'local' | 'youtube'
  url: string
  title?: string
}

export interface Marker {
  id: number
  label: string
  leftTime?: number
  rightTime?: number
  videoSide: 'left' | 'right' | 'both'
}

export type VideoSide = 'left' | 'right' 