import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { LoadingManager, TextureLoader, Vector3, CanvasTexture, RepeatWrapping, LinearFilter, Color } from 'three'
import type { Group, Mesh, Texture, MeshBasicMaterial } from 'three'
import { useLandingStore } from '@/features/landing/landingStore'
import type { DrawnLine } from '@/features/landing/landingStore'

// DefaultLoadingManager 격리 — useProgress 간섭 방지
const isolatedManager = new LoadingManager()

// 프린터 본체 치수 (PrinterMesh와 동일)
const BW = 1.1
const BH = 0.7
const BD = 1.1
const WT = 0.025

const PAPER_POS = new Vector3(0, BH + 0.06, 0.3)
const ATTACH_POS = new Vector3(0, BH / 2 + 0.14, BD / 2 + 0.012)
const FLOAT_SCALE = 0.78
const WALL_SCALE = 1.0
const WALL_COLOR = '#ddd6cb'

interface DoorBounds {
  cx: number
  cy: number
  w: number
  h: number
  left: number
  right: number
  localCx: number
  localCy: number
  localW: number
  localH: number
}

interface ProcessedDoorTextures {
  doorTexture: Texture | null
  outlineTexture: Texture | null
  doorLeafMaskTexture: Texture | null
  portalMaskTexture: Texture | null
  wallCoverTexture: Texture | null
  bounds: DoorBounds
}

function processDoorLines(
  lines: DrawnLine[],
  sourceWidth = 320,
  sourceHeight = 320,
): ProcessedDoorTextures | null {
  if (!lines.length) return null
  const primary = lines[0]
  if (primary.points.length < 6) return null

  let minX = sourceWidth
  let minY = sourceHeight
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

  if (minX >= maxX || minY >= maxY) return null

  const pad = 22
  const cropX = Math.max(0, Math.floor(minX - pad))
  const cropY = Math.max(0, Math.floor(minY - pad))
  const cropW = Math.min(sourceWidth - cropX, Math.ceil(maxX - minX + pad * 2))
  const cropH = Math.min(sourceHeight - cropY, Math.ceil(maxY - minY + pad * 2))
  if (cropW <= 0 || cropH <= 0) return null

  const shiftX = -cropX
  const shiftY = -cropY

  const drawPath = (ctx: CanvasRenderingContext2D, close = false) => {
    ctx.beginPath()
    ctx.moveTo(primary.points[0] + shiftX, primary.points[1] + shiftY)
    for (let i = 2; i < primary.points.length; i += 2) {
      ctx.lineTo(primary.points[i] + shiftX, primary.points[i + 1] + shiftY)
    }
    if (close) {
      ctx.closePath()
    }
  }

  const doorCanvas = document.createElement('canvas')
  doorCanvas.width = cropW
  doorCanvas.height = cropH
  const dctx = doorCanvas.getContext('2d')
  if (!dctx) return null
  dctx.fillStyle = '#efe4cc'
  dctx.fillRect(0, 0, cropW, cropH)
  dctx.lineCap = 'round'
  dctx.lineJoin = 'round'
  lines.forEach((line) => {
    if (line.points.length < 2) return
    dctx.beginPath()
    dctx.moveTo(line.points[0] + shiftX, line.points[1] + shiftY)
    for (let i = 2; i < line.points.length; i += 2) {
      dctx.lineTo(line.points[i] + shiftX, line.points[i + 1] + shiftY)
    }
    dctx.strokeStyle = line.color
    dctx.lineWidth = line.width
    dctx.stroke()
  })

  const outlineCanvas = document.createElement('canvas')
  outlineCanvas.width = cropW
  outlineCanvas.height = cropH
  const octx = outlineCanvas.getContext('2d')
  if (!octx) return null
  octx.lineCap = 'round'
  octx.lineJoin = 'round'
  lines.forEach((line) => {
    if (line.points.length < 2) return
    octx.beginPath()
    octx.moveTo(line.points[0] + shiftX, line.points[1] + shiftY)
    for (let i = 2; i < line.points.length; i += 2) {
      octx.lineTo(line.points[i] + shiftX, line.points[i + 1] + shiftY)
    }
    octx.strokeStyle = '#111111'
    octx.lineWidth = line.width + 0.5
    octx.stroke()
  })

  const leafMaskCanvas = document.createElement('canvas')
  leafMaskCanvas.width = cropW
  leafMaskCanvas.height = cropH
  const lmctx = leafMaskCanvas.getContext('2d')
  if (!lmctx) return null
  lmctx.fillStyle = '#000'
  lmctx.fillRect(0, 0, cropW, cropH)
  lmctx.fillStyle = '#fff'
  drawPath(lmctx, true)
  lmctx.fill()
  lmctx.lineCap = 'round'
  lmctx.lineJoin = 'round'
  lmctx.strokeStyle = '#fff'
  lmctx.lineWidth = primary.width + 2
  drawPath(lmctx, false)
  lmctx.stroke()

  const portalMaskCanvas = document.createElement('canvas')
  portalMaskCanvas.width = cropW
  portalMaskCanvas.height = cropH
  const pmctx = portalMaskCanvas.getContext('2d')
  if (!pmctx) return null
  pmctx.fillStyle = '#000'
  pmctx.fillRect(0, 0, cropW, cropH)
  pmctx.fillStyle = '#fff'
  drawPath(pmctx, true)
  pmctx.fill()

  const wallCoverCanvas = document.createElement('canvas')
  wallCoverCanvas.width = cropW
  wallCoverCanvas.height = cropH
  const wcctx = wallCoverCanvas.getContext('2d')
  if (!wcctx) return null
  wcctx.fillStyle = '#fff'
  wcctx.fillRect(0, 0, cropW, cropH)
  wcctx.globalCompositeOperation = 'destination-out'
  drawPath(wcctx, true)
  wcctx.fill()

  const bounds: DoorBounds = {
    cx: (minX + maxX) / 2 / sourceWidth,
    cy: (minY + maxY) / 2 / sourceHeight,
    w: Math.max((maxX - minX) / sourceWidth, 0.05),
    h: Math.max((maxY - minY) / sourceHeight, 0.05),
    left: minX / sourceWidth,
    right: maxX / sourceWidth,
    localCx: ((minX + maxX) / 2 - cropX) / cropW,
    localCy: ((minY + maxY) / 2 - cropY) / cropH,
    localW: Math.max((maxX - minX) / cropW, 0.05),
    localH: Math.max((maxY - minY) / cropH, 0.05),
  }

  return {
    doorTexture: createTextureFromCanvas(doorCanvas),
    outlineTexture: createTextureFromCanvas(outlineCanvas),
    doorLeafMaskTexture: createTextureFromCanvas(leafMaskCanvas),
    portalMaskTexture: createTextureFromCanvas(portalMaskCanvas),
    wallCoverTexture: createTextureFromCanvas(wallCoverCanvas),
    bounds,
  }
}

function createTextureFromCanvas(canvas: HTMLCanvasElement) {
  const texture = new CanvasTexture(canvas)
  texture.minFilter = LinearFilter
  texture.magFilter = LinearFilter
  texture.needsUpdate = true
  return texture
}

interface DrawingDoorMeshProps {
  isActive: boolean
  shouldAttach: boolean
  shouldOpen: boolean
}

export default function DrawingDoorMesh({ isActive, shouldAttach, shouldOpen }: DrawingDoorMeshProps) {
  const onboardingStep = useLandingStore((s) => s.onboardingStep)
  const drawnImageUrl = useLandingStore((s) => s.drawnImageUrl)
  const drawnLines = useLandingStore((s) => s.drawnLines)

  const groupRef = useRef<Group>(null)
  const fullPaperRef = useRef<Mesh>(null)
  const fullOutlineRef = useRef<Mesh>(null)
  const doorPivotRef = useRef<Group>(null)
  const paperMaterialRef = useRef<MeshBasicMaterial>(null)
  const outlineMaterialRef = useRef<MeshBasicMaterial>(null)
  const [texture, setTexture] = useState<Texture | null>(null)
  const targetScale = useRef(0)
  const doorAngle = useRef(0)
  const attachProgress = useRef(0)
  const peelProgress = useRef(0)
  const peelStarted = useRef(false)
  const attachStarted = useRef(false)
  const attachFrom = useRef(PAPER_POS.clone())
  const portalTextureRef = useRef<CanvasTexture | null>(null)
  const portalResources = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const texture = new CanvasTexture(canvas)
    texture.wrapS = RepeatWrapping
    texture.wrapT = RepeatWrapping
    return { canvas, texture }
  }, [])

  useEffect(() => {
    portalTextureRef.current = portalResources.texture
  }, [portalResources])

  const processed = useMemo(
    () => (drawnLines.length ? processDoorLines(drawnLines) : null),
    [drawnLines],
  )

  useEffect(() => {
    if (!drawnImageUrl) return

    new TextureLoader(isolatedManager).load(drawnImageUrl, (t) => {
      t.needsUpdate = true
      setTexture(t)
    })
  }, [drawnImageUrl, drawnLines.length])

  useEffect(() => {
    if (isActive) {
      targetScale.current = FLOAT_SCALE
      peelStarted.current = true
      peelProgress.current = 0
      attachStarted.current = false
      attachProgress.current = 0
      doorAngle.current = 0
    }
    if (!isActive && onboardingStep !== 'entering') {
      targetScale.current = 0
    }
  }, [isActive, onboardingStep])

  useEffect(() => {
    if (shouldAttach) {
      targetScale.current = WALL_SCALE
      attachStarted.current = true
      attachProgress.current = 0
      if (groupRef.current) {
        attachFrom.current.copy(groupRef.current.position)
      } else {
        attachFrom.current.copy(PAPER_POS)
      }
    }
  }, [shouldAttach])

  useFrame(({ clock }, delta) => {
    if (!groupRef.current) return

    if (peelStarted.current && peelProgress.current < 1) {
      peelProgress.current = Math.min(peelProgress.current + delta * 4.8, 1)
    }

    const s = fullPaperRef.current?.scale.x ?? 0
    const diff = targetScale.current - s
    if (Math.abs(diff) > 0.001) {
      const nextScale = s + diff * Math.min(delta * 6, 1)
      fullPaperRef.current?.scale.setScalar(nextScale)
      fullOutlineRef.current?.scale.setScalar(nextScale)
    }

    if (shouldOpen && doorPivotRef.current) {
      doorAngle.current += (Math.PI * 2 / 3 - doorAngle.current) * Math.min(delta * 3.2, 1)
      doorPivotRef.current.rotation.y = doorAngle.current
    }

    const paperMat = paperMaterialRef.current
    const outlineMat = outlineMaterialRef.current
    if (paperMat) {
      const attachTint = Math.min(shouldAttach ? attachProgress.current * 0.55 : 0, 0.55)
      const tint = new Color('#efe4cc').lerp(new Color(WALL_COLOR), attachTint)
      paperMat.color.copy(tint)
      paperMat.opacity = 0.98
    }
    if (outlineMat) {
      outlineMat.opacity = shouldAttach ? Math.min(0.88 + attachProgress.current * 0.12, 1) : 0.88
    }

    if (!shouldAttach) {
      groupRef.current.position.lerp(PAPER_POS, Math.min(delta * 6, 1))
      const peelKick = 1 - peelProgress.current
      groupRef.current.rotation.x += (0.05 + peelKick * 0.3 - groupRef.current.rotation.x) * Math.min(delta * 8, 1)
      groupRef.current.rotation.z += ((Math.sin(clock.elapsedTime * 10) * 0.12) - groupRef.current.rotation.z) * Math.min(delta * 7, 1)
      groupRef.current.rotation.y += ((Math.sin(clock.elapsedTime * 7) * 0.08) - groupRef.current.rotation.y) * Math.min(delta * 7, 1)
      groupRef.current.position.y += Math.sin(clock.elapsedTime * 5) * 0.004 + peelKick * 0.012
    } else {
      if (attachStarted.current && attachProgress.current < 1) {
        attachProgress.current = Math.min(attachProgress.current + delta * 1.35, 1)
      }

      const t = attachProgress.current
      const eased = 1 - Math.pow(1 - t, 3)
      const lift = Math.sin(t * Math.PI) * 0.22
      const forwardFloat = Math.sin(t * Math.PI) * 0.035
      const settle = t > 0.82 ? (t - 0.82) / 0.18 : 0
      const flightY = lift + (1 - t) * 0.045 - settle * 0.02
      const flightZ = forwardFloat - settle * 0.01

      groupRef.current.position.set(
        attachFrom.current.x + (ATTACH_POS.x - attachFrom.current.x) * eased,
        attachFrom.current.y + (ATTACH_POS.y - attachFrom.current.y) * eased + flightY,
        attachFrom.current.z + (ATTACH_POS.z - attachFrom.current.z) * eased + flightZ
      )

      const flutter = Math.max((1 - t) * 0.28, 0.015)
      const flapX = 0.98 - t * 0.98 + Math.sin(clock.elapsedTime * 18) * flutter * 0.52
      const flapY = Math.cos(clock.elapsedTime * 11) * flutter * 0.12
      const flapZ = Math.sin(clock.elapsedTime * 15) * flutter * 0.82
      groupRef.current.rotation.x += (flapX - groupRef.current.rotation.x) * Math.min(delta * 10, 1)
      groupRef.current.rotation.y += (flapY - groupRef.current.rotation.y) * Math.min(delta * 9, 1)
      groupRef.current.rotation.z += (flapZ - groupRef.current.rotation.z) * Math.min(delta * 11, 1)

      if (fullPaperRef.current && fullOutlineRef.current) {
        const flutterScale = 1 + Math.sin(clock.elapsedTime * 20) * flutter * 0.08
        const settleScale = 1 - settle * 0.05
        fullPaperRef.current.scale.setScalar(targetScale.current * flutterScale * settleScale)
        fullOutlineRef.current.scale.setScalar(targetScale.current * flutterScale * settleScale)
      }
    }

    if (shouldOpen) {
      const ctx = portalResources.canvas.getContext('2d')
      if (!ctx) return
      const { width, height } = portalResources.canvas
      const cx = width / 2
      const cy = height / 2
      const radius = width * 0.46
      const time = clock.elapsedTime

      ctx.clearRect(0, 0, width, height)

      const portalCx = processed ? processed.bounds.localCx * width : cx
      const portalCy = processed ? processed.bounds.localCy * height : cy
      const portalRadius = processed
        ? Math.min(Math.max(processed.bounds.localW * width, processed.bounds.localH * height) * 1.15, width * 0.92)
        : radius

      const bg = ctx.createRadialGradient(portalCx, portalCy, portalRadius * 0.04, portalCx, portalCy, portalRadius)
      bg.addColorStop(0, '#03020f')
      bg.addColorStop(0.16, '#120d3a')
      bg.addColorStop(0.38, '#2a176d')
      bg.addColorStop(0.62, '#5631b2')
      bg.addColorStop(0.82, '#7b5ee6')
      bg.addColorStop(0.96, '#63a5ff')
      bg.addColorStop(1, 'rgba(96,186,255,0.18)')
      ctx.fillStyle = bg
      ctx.beginPath()
      ctx.arc(portalCx, portalCy, portalRadius, 0, Math.PI * 2)
      ctx.fill()

      for (let arm = 0; arm < 12; arm++) {
        const offset = (arm / 12) * Math.PI * 2 + time * 1.1
        ctx.beginPath()
        for (let t = 0; t <= 1; t += 0.003) {
          const angle = offset + t * Math.PI * 6.2
          const r = 1 + Math.pow(t, 0.78) * portalRadius
          const x = portalCx + Math.cos(angle) * r
          const y = portalCy + Math.sin(angle) * r
          if (t === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.strokeStyle = arm % 2 === 0
          ? 'rgba(240,221,255,0.92)'
          : 'rgba(123,176,255,0.58)'
        ctx.lineWidth = Math.max(portalRadius * 0.12, 18)
        ctx.lineCap = 'round'
        ctx.stroke()
      }

      const core = ctx.createRadialGradient(portalCx, portalCy, 0, portalCx, portalCy, portalRadius * 0.38)
      core.addColorStop(0, '#01010a')
      core.addColorStop(0.45, 'rgba(9,7,28,0.98)')
      core.addColorStop(1, 'rgba(15,10,42,0)')
      ctx.fillStyle = core
      ctx.beginPath()
      ctx.arc(portalCx, portalCy, portalRadius * 0.38, 0, Math.PI * 2)
      ctx.fill()

      const rim = ctx.createRadialGradient(portalCx, portalCy, portalRadius * 0.72, portalCx, portalCy, portalRadius)
      rim.addColorStop(0, 'rgba(0,0,0,0)')
      rim.addColorStop(0.55, 'rgba(77,138,255,0.12)')
      rim.addColorStop(0.82, 'rgba(139,226,255,0.34)')
      rim.addColorStop(1, 'rgba(188,244,255,0.88)')
      ctx.strokeStyle = rim
      ctx.lineWidth = Math.max(portalRadius * 0.08, 10)
      ctx.beginPath()
      ctx.arc(portalCx, portalCy, portalRadius * 0.93, 0, Math.PI * 2)
      ctx.stroke()

      if (portalTextureRef.current) {
        portalTextureRef.current.needsUpdate = true
      }
    }
  })

  if (!isActive && onboardingStep !== 'entering') return null

  const planeW = (processed?.bounds.w ?? 0.5) * (BW - 0.04)
  const planeH = (processed?.bounds.h ?? 0.5) * (BH - 0.04)
  const centerX = ((processed?.bounds.cx ?? 0.5) - 0.5) * (BW - 0.04)
  const centerY = -(((processed?.bounds.cy ?? 0.5) - 0.5) * (BH - 0.04))
  const hingeX = centerX + planeW / 2
  const showDoorGeometry = shouldOpen && !!processed
  const showFloatingPaper = !shouldOpen || !processed

  return (
    <group ref={groupRef}>
      {showFloatingPaper && (
        <>
          <mesh ref={fullPaperRef} position={[centerX, centerY, 0]} scale={0}>
            <planeGeometry args={[planeW, planeH]} />
            <meshBasicMaterial
              ref={paperMaterialRef}
              map={processed?.doorTexture ?? texture ?? undefined}
              color="#efe4cc"
              transparent={false}
              toneMapped={false}
              polygonOffset
              polygonOffsetFactor={-2}
              polygonOffsetUnits={-2}
            />
          </mesh>
          <mesh ref={fullOutlineRef} position={[centerX, centerY, 0.003]} scale={0}>
            <planeGeometry args={[planeW, planeH]} />
            <meshBasicMaterial
              ref={outlineMaterialRef}
              map={processed?.outlineTexture ?? undefined}
              transparent
              alphaTest={0.5}
              toneMapped={false}
              polygonOffset
              polygonOffsetFactor={-3}
              polygonOffsetUnits={-3}
            />
          </mesh>
        </>
      )}

      {showDoorGeometry && (
        <group>
          <mesh position={[centerX, centerY, 0.003]}>
            <planeGeometry args={[planeW, planeH]} />
            <meshBasicMaterial
              color={WALL_COLOR}
              alphaMap={processed?.wallCoverTexture ?? undefined}
              transparent
              alphaTest={0.5}
              side={2}
              toneMapped={false}
            />
          </mesh>

          <mesh position={[centerX, centerY, -WT * 0.82]}>
            <planeGeometry args={[planeW, planeH]} />
            <meshBasicMaterial
              map={portalResources.texture}
              alphaMap={processed?.portalMaskTexture ?? undefined}
              transparent
              alphaTest={0.5}
              depthWrite={false}
              toneMapped={false}
              side={2}
            />
          </mesh>

          <group
            ref={doorPivotRef}
            position={[hingeX, centerY, 0.014]}
          >
            <group position={[-planeW / 2, 0, 0]}>
              <mesh position={[0, 0, -0.003]}>
                <planeGeometry args={[planeW, planeH]} />
                <meshBasicMaterial
                  color={WALL_COLOR}
                  alphaMap={processed?.doorLeafMaskTexture ?? undefined}
                  transparent
                  alphaTest={0.5}
                  side={2}
                  toneMapped={false}
                />
              </mesh>

              <mesh position={[0, 0, 0.002]}>
                <planeGeometry args={[planeW, planeH]} />
                <meshBasicMaterial
                  map={processed?.outlineTexture ?? undefined}
                  transparent
                  alphaTest={0.5}
                  toneMapped={false}
                  side={2}
                />
              </mesh>
            </group>

            {[0.36, 0, -0.36].map((ratio, index) => (
              <mesh key={index} position={[0.004, planeH * ratio, 0.012]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.012, 0.012, 0.05, 12]} />
                <meshStandardMaterial color="#8f8f95" roughness={0.35} metalness={0.82} />
              </mesh>
            ))}
          </group>
        </group>
      )}
    </group>
  )
}
