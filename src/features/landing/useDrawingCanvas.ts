'use client'

import { useRef, useState } from 'react'
import type { KonvaEventObject } from 'konva/lib/Node'
import type Konva from 'konva'
import type { DrawnLine } from './landingStore'

export function useDrawingCanvas() {
  const stageRef = useRef<Konva.Stage>(null)
  const [lines, setLines] = useState<DrawnLine[]>([])
  const [currentColor] = useState('#1a1a1a')
  const [currentWidth] = useState(3)
  const isDrawing = useRef(false)

  const handleMouseDown = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    isDrawing.current = true
    const stage = e.target.getStage()
    const pos = stage?.getPointerPosition()
    if (!pos) return
    setLines((prev) => [...prev, { points: [pos.x, pos.y], color: currentColor, width: currentWidth }])
  }

  const handleMouseMove = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (!isDrawing.current) return
    const stage = e.target.getStage()
    const pos = stage?.getPointerPosition()
    if (!pos) return
    setLines((prev) => {
      const updated = [...prev]
      const last = updated[updated.length - 1]
      if (!last) return prev
      updated[updated.length - 1] = { ...last, points: [...last.points, pos.x, pos.y] }
      return updated
    })
  }

  const handleMouseUp = () => {
    isDrawing.current = false
  }

  const clearCanvas = () => setLines([])

  const exportImage = (): string | null => {
    if (!stageRef.current) return null
    const width = stageRef.current.width()
    const height = stageRef.current.height()
    if (!width || !height || lines.length === 0) return null

    let minX = width
    let minY = height
    let maxX = 0
    let maxY = 0

    lines.forEach((line) => {
      const half = line.width / 2
      for (let i = 0; i < line.points.length; i += 2) {
        const x = line.points[i]
        const y = line.points[i + 1]
        minX = Math.min(minX, x - half)
        minY = Math.min(minY, y - half)
        maxX = Math.max(maxX, x + half)
        maxY = Math.max(maxY, y + half)
      }
    })

    if (minX >= maxX || minY >= maxY) {
      return stageRef.current.toDataURL({ pixelRatio: 2 })
    }

    const boundsW = maxX - minX
    const boundsH = maxY - minY
    const targetW = width * 0.52
    const targetH = height * 0.68
    const scale = Math.min(targetW / boundsW, targetH / boundsH)
    const offsetX = width / 2 - (minX + boundsW / 2) * scale
    const offsetY = height / 2 - (minY + boundsH / 2) * scale - height * 0.03

    const canvas = document.createElement('canvas')
    canvas.width = width * 2
    canvas.height = height * 2
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    ctx.scale(2, 2)
    ctx.fillStyle = '#efe4cc'
    ctx.fillRect(0, 0, width, height)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    lines.forEach((line) => {
      if (line.points.length < 2) return
      ctx.beginPath()
      ctx.strokeStyle = line.color
      ctx.lineWidth = line.width * scale
      ctx.moveTo(line.points[0] * scale + offsetX, line.points[1] * scale + offsetY)
      for (let i = 2; i < line.points.length; i += 2) {
        ctx.lineTo(line.points[i] * scale + offsetX, line.points[i + 1] * scale + offsetY)
      }
      ctx.stroke()
    })

    return canvas.toDataURL('image/png')
  }

  const exportLines = (): DrawnLine[] => lines.map((line) => ({
    points: [...line.points],
    color: line.color,
    width: line.width,
  }))

  return {
    stageRef,
    lines,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    clearCanvas,
    exportImage,
    exportLines,
  }
}
