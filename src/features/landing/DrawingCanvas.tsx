'use client'

import { Stage, Layer, Line, Rect } from 'react-konva'
import { useDrawingCanvas } from './useDrawingCanvas'
import type { DrawnLine } from './landingStore'

interface DrawingCanvasProps {
  width: number
  height: number
  onExport: (dataUrl: string, lines: DrawnLine[]) => void
  onClear: () => void
}

export default function DrawingCanvas({ width, height, onExport, onClear }: DrawingCanvasProps) {
  const { stageRef, lines, handleMouseDown, handleMouseMove, handleMouseUp, clearCanvas, exportImage, exportLines } =
    useDrawingCanvas()

  const handleClear = () => {
    clearCanvas()
    onClear()
  }

  const handleComplete = () => {
    const url = exportImage()
    if (url) onExport(url, exportLines())
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* 캔버스 영역 */}
      <div
        className="rounded-2xl overflow-hidden shadow-2xl border-2 border-white/30"
        style={{ background: '#fff', cursor: 'crosshair' }}
      >
        <Stage
          ref={stageRef}
          width={width}
          height={height}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
        >
          <Layer>
            {/* 흰 배경 — toDataURL() 시 투명 → 검은색 방지 */}
            <Rect x={0} y={0} width={width} height={height} fill="white" />
            {lines.map((line, i) => (
              <Line
                key={i}
                points={line.points}
                stroke={line.color}
                strokeWidth={line.width}
                tension={0.5}
                lineCap="round"
                lineJoin="round"
                globalCompositeOperation="source-over"
              />
            ))}
          </Layer>
        </Stage>
      </div>

      {/* 버튼 영역 */}
      <div className="flex gap-3">
        <button
          onClick={handleClear}
          className="px-5 py-2 rounded-full bg-white/20 text-white text-sm font-medium
            border border-white/30 hover:bg-white/30 active:scale-95 transition-all"
        >
          지우기
        </button>
        <button
          onClick={handleComplete}
          disabled={lines.length === 0}
          className="px-6 py-2 rounded-full bg-white text-black text-sm font-semibold
            hover:bg-white/90 active:scale-95 transition-all
            disabled:opacity-40 disabled:cursor-not-allowed"
        >
          완료
        </button>
      </div>
    </div>
  )
}
