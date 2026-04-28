import "./style.css"
import * as THREE from "three"
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"

const canvas = document.querySelector("#scene")
const stage = canvas.parentElement
const focusButtons = Array.from(document.querySelectorAll(".platform-button"))
const focusTitle = document.querySelector("#focus-title")
const focusMeta = document.querySelector("#focus-meta")
const focusDescription = document.querySelector("#focus-description")

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
})
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 0.78

const scene = new THREE.Scene()
scene.background = new THREE.Color("#ffc7e5")
scene.fog = new THREE.Fog("#ffd2eb", 15, 31)

const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100)
const gltfLoader = new GLTFLoader()

const palette = {
  shell: "#f1f5ff",
  pearl: "#e6efff",
  pink: "#ff8dc6",
  blush: "#ffd8ef",
  coral: "#ff7b82",
  orange: "#ff9f3c",
  sun: "#ffd94b",
  lime: "#7be57d",
  mint: "#68f1d8",
  aqua: "#44dfff",
  blue: "#2ba5ff",
  violet: "#b884ff",
  cloud: "#fff9ff",
  stage: "#ffd7e7",
  stageGlow: "#9de7ff",
  glass: "#d9f9ff",
  gold: "#ffd365",
  ink: "#3a2a44",
  sky: "#7ec9ff",
}

const focusCopy = {
  entry: {
    title: "문형 입구",
    meta: "Rainbow Arrival",
    description:
      "출력 슬롯에서 나온 종이 문이 놀이공원 티켓 게이트처럼 열리며, 바깥 현실과 안쪽 월드를 연결하는 첫 진입로가 됩니다.",
    azimuth: 0.0,
    distance: 6.2,
    height: 1.95,
    lookAt: new THREE.Vector3(0, 0.26, 3.2),
  },
  plaza: {
    title: "레인보우 광장",
    meta: "Fantasy Hub",
    description:
      "무지개 아치 아래의 중앙 광장이 캔디 조명과 구름 장식 속에서 각 존으로 이어지는 축제형 허브로 작동합니다.",
    azimuth: -0.08,
    distance: 6.6,
    height: 2.25,
    lookAt: new THREE.Vector3(0.18, 0.82, -0.64),
  },
  community: {
    title: "커뮤니티 캔버스",
    meta: "Paper Canyon",
    description:
      "메모 절벽 전체가 알록달록한 월드 월처럼 보이고, 작은 시민들이 사다리를 타며 풍선 축제 한복판에서 그림을 이어갑니다.",
    azimuth: -1.14,
    distance: 4.45,
    height: 1.34,
    lookAt: new THREE.Vector3(-1.48, 0.42, -0.2),
  },
  relay: {
    title: "릴레이 드로잉 공장",
    meta: "Ride Factory",
    description:
      "공중 레일과 반투명 드로잉 룸이 놀이기구처럼 이어지고, 조각들은 중앙 프레스에 모여 유쾌한 캐릭터 메모로 합성됩니다.",
    azimuth: 1.14,
    distance: 4.45,
    height: 1.34,
    lookAt: new THREE.Vector3(1.48, 0.42, -0.2),
  },
  fortune: {
    title: "포춘 메모 신전",
    meta: "Lucky Pavilion",
    description:
      "핑크와 골드 톤의 가챠 신전에서 키워드 구슬이 축제용 풍선처럼 회전하고, 운세 메모가 반짝이며 바로 튀어나옵니다.",
    azimuth: 0.1,
    distance: 5.6,
    height: 2.0,
    lookAt: new THREE.Vector3(0.0, 1.02, -2.08),
  },
}

const cameraState = {
  currentAzimuth: focusCopy.plaza.azimuth,
  targetAzimuth: focusCopy.plaza.azimuth,
  currentDistance: focusCopy.plaza.distance,
  targetDistance: focusCopy.plaza.distance,
  currentHeight: focusCopy.plaza.height,
  targetHeight: focusCopy.plaza.height,
  currentLookAt: focusCopy.plaza.lookAt.clone(),
  targetLookAt: focusCopy.plaza.lookAt.clone(),
}

const animated = {
  floatingNotes: [],
  cliffNotes: [],
  conveyorPieces: [],
  avatars: [],
  gachaBalls: [],
  sparkles: [],
  particleGroups: [],
  entranceSheets: [],
  movingDoors: [],
  fallingNotes: [],
  orbitGroups: [],
  poppedMemos: [],
  hinges: [],
  lidConfetti: [],
  balloons: [],
  clouds: [],
}

const worldRoot = new THREE.Group()
scene.add(worldRoot)

const themeparkAssetRoot = new THREE.Group()
themeparkAssetRoot.position.set(0, -1.34, -2.02)
worldRoot.add(themeparkAssetRoot)

const zonepackAssetRoot = new THREE.Group()
zonepackAssetRoot.position.set(0, -1.2, -0.46)
worldRoot.add(zonepackAssetRoot)

const initialFocusKey = new URLSearchParams(window.location.search).get("focus")

let currentFocus = "plaza"
let isDragging = false
let lastPointerX = 0
let lastInteractionAt = performance.now()

function markInteraction() {
  lastInteractionAt = performance.now()
}

function normalizeAngle(angle) {
  return Math.atan2(Math.sin(angle), Math.cos(angle))
}

function setActiveButton(focusKey) {
  focusButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.focus === focusKey)
  })
}

function updateFocusReadout(focusKey) {
  const focus = focusCopy[focusKey]
  focusTitle.textContent = focus.title
  focusMeta.textContent = focus.meta
  focusDescription.textContent = focus.description
}

function focusZone(focusKey) {
  const focus = focusCopy[focusKey]
  const shortestDelta = normalizeAngle(focus.azimuth - cameraState.currentAzimuth)

  currentFocus = focusKey
  cameraState.targetAzimuth = cameraState.currentAzimuth + shortestDelta
  cameraState.targetDistance = focus.distance
  cameraState.targetHeight = focus.height
  cameraState.targetLookAt.copy(focus.lookAt)

  setActiveButton(focusKey)
  updateFocusReadout(focusKey)
  markInteraction()
}

function standardMaterial(color, overrides = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.88,
    metalness: 0.03,
    ...overrides,
  })
}

function createRoundedPanel(width, height, depth, color, radius = 0.05, overrides = {}) {
  const mesh = new THREE.Mesh(
    new RoundedBoxGeometry(width, height, depth, 6, radius),
    standardMaterial(color, overrides),
  )
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

function createPaperStack(width, depth, layers, colors) {
  const group = new THREE.Group()

  for (let index = 0; index < layers; index += 1) {
    const layer = createRoundedPanel(
      width - index * 0.12,
      0.05,
      depth - index * 0.12,
      colors[index % colors.length],
      0.025,
    )
    layer.position.y = index * 0.045
    layer.position.x = (index % 2) * 0.02
    layer.position.z = (index % 3) * -0.02
    group.add(layer)
  }

  return group
}

function createTrack(points, color, radius = 0.04, tubularSegments = 72) {
  const curve = new THREE.CatmullRomCurve3(points)
  const mesh = new THREE.Mesh(
    new THREE.TubeGeometry(curve, tubularSegments, radius, 12, false),
    standardMaterial(color, {
      emissive: color,
      emissiveIntensity: 0.3,
      roughness: 0.28,
    }),
  )
  mesh.castShadow = false
  mesh.receiveShadow = false
  return { curve, mesh }
}

function createGlowOrb(color, radius, opacity) {
  return new THREE.Mesh(
    new THREE.SphereGeometry(radius, 28, 28),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthWrite: false,
    }),
  )
}

function createPointCloud(count, spread, color, size) {
  const geometry = new THREE.BufferGeometry()
  const positions = new Float32Array(count * 3)

  for (let index = 0; index < count; index += 1) {
    positions[index * 3] = (Math.random() - 0.5) * spread.x
    positions[index * 3 + 1] = Math.random() * spread.y
    positions[index * 3 + 2] = (Math.random() - 0.5) * spread.z
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))

  return new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      color,
      size,
      transparent: true,
      opacity: 0.74,
      depthWrite: false,
    }),
  )
}

function createAvatar(bodyColor, accentColor) {
  const group = new THREE.Group()

  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.05, 0.16, 6, 10),
    standardMaterial(bodyColor, {
      roughness: 0.78,
    }),
  )
  body.castShadow = true

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 18, 18),
    standardMaterial("#fff6fb", {
      roughness: 0.75,
    }),
  )
  head.position.y = 0.18
  head.castShadow = true

  const pen = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 0.22, 12),
    standardMaterial(accentColor, {
      roughness: 0.42,
    }),
  )
  pen.rotation.z = Math.PI / 4
  pen.position.set(0.09, 0.02, 0.03)
  pen.castShadow = true

  const tip = new THREE.Mesh(
    new THREE.ConeGeometry(0.018, 0.05, 12),
    standardMaterial("#ffd0a1", {
      roughness: 0.58,
    }),
  )
  tip.position.set(0.165, -0.05, 0.03)
  tip.rotation.z = -Math.PI / 4

  group.add(body, head, pen, tip)
  return group
}

function createCloudCluster(scale = 1, color = palette.cloud) {
  const group = new THREE.Group()
  const puffPositions = [
    [-0.44, 0.03, 0.02, 0.42],
    [-0.15, 0.16, 0.02, 0.54],
    [0.18, 0.2, 0.0, 0.5],
    [0.5, 0.06, 0.01, 0.38],
    [0.1, -0.05, 0.04, 0.48],
  ]

  puffPositions.forEach(([x, y, z, radius]) => {
    const puff = new THREE.Mesh(
      new THREE.SphereGeometry(radius * scale, 24, 24),
      standardMaterial(color, {
        roughness: 0.82,
      }),
    )
    puff.position.set(x * scale, y * scale, z * scale)
    puff.castShadow = true
    puff.receiveShadow = true
    group.add(puff)
  })

  return group
}

function createBalloon(color) {
  const group = new THREE.Group()

  const balloon = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 24, 24),
    standardMaterial(color, {
      roughness: 0.35,
    }),
  )
  balloon.scale.set(0.92, 1.2, 0.92)
  balloon.castShadow = true
  group.add(balloon)

  const knot = new THREE.Mesh(
    new THREE.ConeGeometry(0.025, 0.05, 10),
    standardMaterial(color, {
      roughness: 0.35,
    }),
  )
  knot.position.y = -0.28
  knot.rotation.x = Math.PI
  group.add(knot)

  const string = new THREE.Mesh(
    new THREE.CylinderGeometry(0.005, 0.005, 0.72, 10),
    standardMaterial("#fff6fd", {
      roughness: 1,
    }),
  )
  string.position.y = -0.68
  group.add(string)

  return group
}

function loadThemeparkAsset() {
  gltfLoader.load("/models/nemonic_themepark_asset.glb", (gltf) => {
    const asset = gltf.scene
    const box = new THREE.Box3().setFromObject(asset)
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(center)

    asset.position.sub(center)
    asset.position.y += size.y / 2

    const scale = 5.75 / size.x
    asset.scale.setScalar(scale)

    const hiddenNamePrefixes = ["Floor", "CloudBank", "FrontRail"]

    asset.traverse((child) => {
      if (hiddenNamePrefixes.some((prefix) => child.name.startsWith(prefix))) {
        child.visible = false
      }
      if (!child.isMesh) return
      child.castShadow = true
      child.receiveShadow = true
      if (child.material) {
        child.material.roughness = Math.min(0.9, child.material.roughness ?? 0.6)
        child.material.metalness = 0.02
      }
    })

    themeparkAssetRoot.add(asset)
  })
}

function loadZonepackAsset() {
  gltfLoader.load("/models/nemonic_zonepack_asset.glb", (gltf) => {
    const asset = gltf.scene
    const box = new THREE.Box3().setFromObject(asset)
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(center)

    asset.position.sub(center)
    asset.position.y += size.y / 2

    const scale = 6.15 / size.x
    asset.scale.setScalar(scale)

    asset.traverse((child) => {
      if (child.name.startsWith("ZonePackFloor")) {
        child.visible = false
      }
      if (!child.isMesh) return
      child.castShadow = true
      child.receiveShadow = true
      if (child.material) {
        child.material.roughness = Math.min(0.92, child.material.roughness ?? 0.62)
        child.material.metalness = 0.02
      }
    })

    const balloonRoots = []
    const cloudRoots = []

    asset.traverse((child) => {
      if (!child.name) return
      if (child.name.includes("Balloon_")) {
        balloonRoots.push(child)
      }
      if (child.name.includes("CloudFloat")) {
        cloudRoots.push(child)
      }
    })

    balloonRoots.forEach((balloon, index) => {
      animated.balloons.push({
        mesh: balloon,
        baseY: balloon.position.y,
        phase: index * 0.9 + 0.25,
        amplitude: 0.04 + index * 0.004,
      })
    })

    cloudRoots.forEach((cloud, index) => {
      animated.clouds.push({
        mesh: cloud,
        baseY: cloud.position.y,
        baseX: cloud.position.x,
        phase: index * 0.7 + 0.4,
        amplitude: 0.028 + index * 0.004,
        drift: index % 2 === 0 ? 0.015 : -0.015,
      })
    })

    zonepackAssetRoot.add(asset)
  })
}

function createRainbowArch(radius, tube, colors) {
  const group = new THREE.Group()

  colors.forEach((color, index) => {
    const arch = new THREE.Mesh(
      new THREE.TorusGeometry(radius - index * 0.28, tube, 22, 84, Math.PI),
      standardMaterial(color, {
        roughness: 0.36,
        emissive: color,
        emissiveIntensity: 0.14,
      }),
    )
    arch.position.z = index * -0.01
    arch.position.y = index * 0.03
    arch.castShadow = true
    arch.receiveShadow = true
    group.add(arch)
  })

  return group
}

function buildDesk() {
  const group = new THREE.Group()

  const desk = createRoundedPanel(18, 0.9, 13, palette.stage, 0.14, {
    roughness: 0.82,
  })
  desk.position.y = -2.6
  group.add(desk)

  const underGlow = new THREE.Mesh(
    new THREE.CircleGeometry(4.9, 64),
    new THREE.MeshBasicMaterial({
      color: "#fff1fb",
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    }),
  )
  underGlow.rotation.x = -Math.PI / 2
  underGlow.position.set(0, -2.13, 0.8)
  group.add(underGlow)

  const frontGlow = new THREE.Mesh(
    new THREE.CircleGeometry(2.1, 32),
    new THREE.MeshBasicMaterial({
      color: palette.stageGlow,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
    }),
  )
  frontGlow.rotation.x = -Math.PI / 2
  frontGlow.position.set(0, -2.12, 3.8)
  group.add(frontGlow)

  const scatterColors = [palette.blue, palette.pink, palette.sun, palette.orange, palette.violet, palette.aqua]
  const scatterPositions = [
    [-5.2, -2.0, 4.7],
    [-4.8, -2.02, 4.25],
    [-4.4, -2.0, 4.65],
    [4.9, -2.0, 4.72],
    [5.3, -2.02, 4.22],
    [4.35, -2.0, 4.5],
  ]

  scatterPositions.forEach(([x, y, z], index) => {
    const candy = new THREE.Mesh(
      new THREE.SphereGeometry(0.16 + (index % 3) * 0.05, 18, 18),
      standardMaterial(scatterColors[index % scatterColors.length], {
        roughness: 0.34,
      }),
    )
    candy.position.set(x, y, z)
    candy.castShadow = true
    group.add(candy)
  })

  return group
}

function buildDeviceShell() {
  const group = new THREE.Group()
  const shellMaterial = {
    color: palette.shell,
    roughness: 0.84,
    metalness: 0.02,
  }

  const floor = createRoundedPanel(7.35, 0.34, 7.35, palette.pearl, 0.09, shellMaterial)
  floor.position.y = -1.45
  group.add(floor)

  const innerStack = createPaperStack(6.4, 6.4, 3, ["#fdf6ff", "#f3fbff", "#fffdf5"])
  innerStack.position.y = -1.26
  group.add(innerStack)

  const leftWall = createRoundedPanel(0.28, 2.48, 7.12, palette.shell, 0.08, shellMaterial)
  leftWall.position.set(-3.56, -0.18, 0)

  const rightWall = leftWall.clone()
  rightWall.position.x = 3.56

  const backWall = createRoundedPanel(7.12, 2.48, 0.28, palette.shell, 0.08, shellMaterial)
  backWall.position.set(0, -0.18, -3.56)

  const frontWall = createRoundedPanel(7.12, 1.48, 0.28, "#fef7ff", 0.08, shellMaterial)
  frontWall.position.set(0, -0.68, 3.56)

  group.add(leftWall, rightWall, backWall, frontWall)

  const slot = createRoundedPanel(1.22, 0.1, 0.12, "#f7bed9", 0.03, {
    roughness: 0.58,
    metalness: 0.02,
  })
  slot.position.set(0, -0.58, 3.67)
  group.add(slot)

  const voidShell = new THREE.Mesh(
    new THREE.SphereGeometry(8.5, 48, 48),
    new THREE.MeshBasicMaterial({
      color: "#8edcff",
      transparent: true,
      opacity: 0.22,
      side: THREE.BackSide,
      depthWrite: false,
    }),
  )
  voidShell.position.set(0, 0.8, -0.2)
  group.add(voidShell)

  const lidPivot = new THREE.Group()
  lidPivot.position.set(0, 1.08, -3.6)
  lidPivot.rotation.x = -1.88

  const lid = createRoundedPanel(7.36, 0.22, 7.36, palette.shell, 0.08, shellMaterial)
  lid.position.z = 3.6
  lidPivot.add(lid)

  const canopy = createRoundedPanel(5.8, 0.05, 5.8, palette.sky, 0.05, {
    roughness: 0.2,
    emissive: "#93d7ff",
    emissiveIntensity: 0.28,
  })
  canopy.position.set(0, -0.14, 3.6)
  lidPivot.add(canopy)

  for (let index = 0; index < 34; index += 1) {
    const confetti = new THREE.Mesh(
      new THREE.SphereGeometry(0.025 + Math.random() * 0.02, 10, 10),
      new THREE.MeshBasicMaterial({
        color: [palette.sun, palette.cloud, palette.blush, palette.aqua][index % 4],
      }),
    )
    confetti.position.set((Math.random() - 0.5) * 5.2, -0.06, 3.6 + (Math.random() - 0.5) * 5.2)
    lidPivot.add(confetti)
    animated.lidConfetti.push({
      mesh: confetti,
      baseY: confetti.position.y,
      phase: Math.random() * Math.PI * 2,
      amplitude: 0.016 + Math.random() * 0.018,
    })
  }

  const marqueeColors = [palette.sun, palette.aqua, palette.pink, palette.orange, palette.mint]
  for (let index = 0; index < 9; index += 1) {
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 14, 14),
      standardMaterial(marqueeColors[index % marqueeColors.length], {
        emissive: marqueeColors[index % marqueeColors.length],
        emissiveIntensity: 0.3,
        roughness: 0.28,
      }),
    )
    bulb.position.set(-2.7 + index * 0.68, 0.14, 3.64)
    group.add(bulb)
  }

  group.add(lidPivot)
  animated.hinges.push({ mesh: lidPivot, axis: "x", baseRotation: lidPivot.rotation.x, speed: 0.28, amplitude: 0.018 })

  const mintGlow = new THREE.PointLight("#8fffe3", 6.9, 15, 2)
  mintGlow.position.set(-1.55, 1.4, 0.2)
  const sunGlow = new THREE.PointLight("#ffe97c", 6.5, 14, 2)
  sunGlow.position.set(0.2, 1.05, -1.7)
  const pinkGlow = new THREE.PointLight("#ffa7d8", 6.5, 14, 2)
  pinkGlow.position.set(1.55, 1.0, 0.2)
  group.add(mintGlow, sunGlow, pinkGlow)

  const glowOrbA = createGlowOrb("#aefceb", 1.4, 0.14)
  glowOrbA.position.copy(mintGlow.position)
  const glowOrbB = createGlowOrb("#fff2ac", 1.45, 0.12)
  glowOrbB.position.copy(sunGlow.position)
  const glowOrbC = createGlowOrb("#ffcae8", 1.35, 0.12)
  glowOrbC.position.copy(pinkGlow.position)
  group.add(glowOrbA, glowOrbB, glowOrbC)

  return group
}

function buildRainbowBackdrop() {
  const group = new THREE.Group()
  group.position.set(0, -0.55, -1.85)

  const arch = createRainbowArch(3.25, 0.18, [
    palette.blue,
    palette.aqua,
    palette.mint,
    palette.lime,
    palette.sun,
    palette.orange,
    palette.coral,
    palette.pink,
  ])
  arch.position.y = 0.22
  group.add(arch)

  const cloudSpecs = [
    { position: [-2.62, 0.55, 0.32], scale: 0.9 },
    { position: [2.66, 0.52, 0.34], scale: 0.86 },
    { position: [0.05, 1.82, 0.18], scale: 0.74 },
    { position: [-1.48, 1.38, 0.22], scale: 0.46 },
    { position: [1.62, 1.28, 0.16], scale: 0.38 },
  ]

  cloudSpecs.forEach((spec, index) => {
    const cloud = createCloudCluster(spec.scale)
    cloud.position.set(...spec.position)
    group.add(cloud)
    animated.clouds.push({
      mesh: cloud,
      baseY: cloud.position.y,
      baseX: cloud.position.x,
      phase: index * 0.7,
      amplitude: 0.05 + index * 0.01,
      drift: index % 2 === 0 ? 0.03 : -0.03,
    })
  })

  const balloonSpecs = [
    { position: [-3.05, 2.15, 0.45], color: palette.sun },
    { position: [3.0, 2.05, 0.32], color: palette.cloud },
    { position: [-2.2, 1.68, 0.75], color: palette.pink },
    { position: [2.2, 1.62, 0.68], color: palette.aqua },
  ]

  balloonSpecs.forEach((spec, index) => {
    const balloon = createBalloon(spec.color)
    balloon.position.set(...spec.position)
    group.add(balloon)
    animated.balloons.push({
      mesh: balloon,
      baseY: balloon.position.y,
      phase: index * 0.9,
      amplitude: 0.08 + index * 0.01,
    })
  })

  const lowerCloud = createCloudCluster(1.05)
  lowerCloud.position.set(0, -0.1, 0.2)
  group.add(lowerCloud)
  animated.clouds.push({
    mesh: lowerCloud,
    baseY: lowerCloud.position.y,
    baseX: lowerCloud.position.x,
    phase: 4.2,
    amplitude: 0.04,
    drift: 0.02,
  })

  return group
}

function buildCentralPlaza() {
  const group = new THREE.Group()
  group.position.set(0, -0.82, 0.05)

  const plazaBase = createPaperStack(3.05, 3.05, 3, ["#fff4fb", "#f0fbff", "#fffce9"])
  group.add(plazaBase)

  const glassPlaza = new THREE.Mesh(
    new THREE.CylinderGeometry(1.38, 1.54, 0.14, 48),
    new THREE.MeshPhysicalMaterial({
      color: palette.glass,
      transmission: 0.8,
      thickness: 0.45,
      roughness: 0.12,
      transparent: true,
      opacity: 0.74,
      emissive: "#cefbff",
      emissiveIntensity: 0.18,
    }),
  )
  glassPlaza.position.y = 0.18
  glassPlaza.castShadow = true
  group.add(glassPlaza)

  const innerDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.92, 1.02, 0.1, 40),
    standardMaterial("#fff9ff", {
      emissive: "#f2fdff",
      emissiveIntensity: 0.36,
      roughness: 0.22,
    }),
  )
  innerDisc.position.y = 0.28
  group.add(innerDisc)

  const carouselRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.92, 0.06, 16, 48),
    standardMaterial("#fff3b2", {
      emissive: "#fff3b2",
      emissiveIntensity: 0.26,
      roughness: 0.28,
    }),
  )
  carouselRing.rotation.x = Math.PI / 2
  carouselRing.position.y = 0.33
  group.add(carouselRing)

  const noteCluster = new THREE.Group()
  noteCluster.position.y = 0.66
  group.add(noteCluster)
  animated.orbitGroups.push({ mesh: noteCluster, speed: 0.18 })

  const noteColors = ["#fff0a8", "#a4fff0", "#ffb8df", "#9fd5ff", "#ffc894"]
  for (let index = 0; index < 8; index += 1) {
    const note = createRoundedPanel(0.48, 0.06, 0.32, noteColors[index % noteColors.length], 0.03)
    const radius = 0.62 + Math.random() * 0.16
    const angle = (Math.PI * 2 * index) / 8
    note.position.set(Math.cos(angle) * radius, Math.random() * 0.16, Math.sin(angle) * radius)
    note.rotation.y = -angle + Math.PI / 2
    note.rotation.z = (Math.random() - 0.5) * 0.24

    const thumbnail = createRoundedPanel(0.2, 0.018, 0.12, "#ffffff", 0.01, {
      emissive: "#ffffff",
      emissiveIntensity: 0.2,
      roughness: 0.52,
    })
    thumbnail.position.set(0.05, 0.045, 0)
    note.add(thumbnail)

    animated.floatingNotes.push({
      mesh: note,
      baseY: note.position.y,
      phase: Math.random() * Math.PI * 2,
      speed: 0.4 + Math.random() * 0.2,
    })

    noteCluster.add(note)
  }

  const trackSets = [
    [new THREE.Vector3(0.7, 0.26, 0.35), new THREE.Vector3(1.55, 0.22, 0.45), new THREE.Vector3(2.45, 0.18, 0.62)],
    [new THREE.Vector3(-0.78, 0.26, 0.4), new THREE.Vector3(-1.7, 0.22, 0.5), new THREE.Vector3(-2.45, 0.18, 0.55)],
    [new THREE.Vector3(0.02, 0.26, -0.6), new THREE.Vector3(0.02, 0.23, -1.35), new THREE.Vector3(0.04, 0.18, -2.35)],
    [new THREE.Vector3(0.0, 0.25, 0.88), new THREE.Vector3(0.0, 0.22, 1.9), new THREE.Vector3(0.0, 0.18, 3.05)],
  ]

  trackSets.forEach((points, index) => {
    const color = [palette.aqua, palette.pink, palette.sun, palette.orange][index]
    const { mesh } = createTrack(points, color, 0.045)
    group.add(mesh)
  })

  return group
}

function createLadder(height) {
  const group = new THREE.Group()

  for (const x of [-0.05, 0.05]) {
    const rail = new THREE.Mesh(
      new THREE.CylinderGeometry(0.01, 0.01, height, 8),
      standardMaterial("#fff6b8", {
        roughness: 0.78,
      }),
    )
    rail.position.x = x
    rail.position.y = height / 2
    rail.castShadow = true
    group.add(rail)
  }

  const rungCount = Math.max(4, Math.floor(height / 0.18))
  for (let index = 0; index < rungCount; index += 1) {
    const rung = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.015, 0.015),
      standardMaterial(index % 2 === 0 ? "#ffe291" : "#aef9ff", {
        roughness: 0.74,
      }),
    )
    rung.position.y = 0.14 + index * 0.18
    rung.castShadow = true
    group.add(rung)
  }

  return group
}

function buildCommunityCliff() {
  const group = new THREE.Group()
  group.position.set(-2.46, -0.73, 0.5)

  const base = createPaperStack(2.2, 2.45, 4, ["#fff3fb", "#eefcff", "#fffce5"])
  group.add(base)

  const cliff = new THREE.Group()
  cliff.position.set(-0.05, 0.18, 0)
  group.add(cliff)

  const noteGeometry = new RoundedBoxGeometry(0.05, 0.22, 0.3, 4, 0.012)
  const noteColors = ["#ffb1dd", "#ffe17b", "#8effd8", "#8dc9ff", "#ffb06e", "#bf97ff"]

  for (let row = 0; row < 11; row += 1) {
    for (let column = 0; column < 7; column += 1) {
      const note = new THREE.Mesh(
        noteGeometry,
        standardMaterial(noteColors[(row + column) % noteColors.length], {
          roughness: 0.76,
        }),
      )
      note.position.set(
        Math.random() * 0.18,
        0.15 + row * 0.2,
        (column - 3) * 0.27 + (row % 2 === 0 ? 0.08 : -0.02),
      )
      note.rotation.y = 0.16 + (Math.random() - 0.5) * 0.18
      note.rotation.z = (Math.random() - 0.5) * 0.22
      note.castShadow = true
      cliff.add(note)

      if ((row + column) % 3 === 0) {
        animated.cliffNotes.push({
          mesh: note,
          baseX: note.position.x,
          phase: Math.random() * Math.PI * 2,
          amplitude: 0.012 + Math.random() * 0.015,
        })
      }
    }
  }

  const fallingNote = createRoundedPanel(0.06, 0.24, 0.32, "#ffe96d", 0.012)
  fallingNote.position.set(0.32, 2.7, 0.02)
  fallingNote.rotation.set(0.25, 0.28, -0.1)
  group.add(fallingNote)
  animated.fallingNotes.push({
    mesh: fallingNote,
    topY: 2.75,
    bottomY: 1.4,
    phase: 0.21,
    speed: 0.18,
  })

  const ladderA = createLadder(1.22)
  ladderA.position.set(0.32, 0.42, -0.62)
  ladderA.rotation.z = 0.08
  group.add(ladderA)

  const ladderB = createLadder(1.1)
  ladderB.position.set(0.3, 0.92, 0.56)
  ladderB.rotation.z = -0.06
  group.add(ladderB)

  const avatarA = createAvatar("#fff57e", palette.pink)
  avatarA.position.set(0.28, 0.95, -0.6)
  avatarA.rotation.y = -0.5
  group.add(avatarA)

  const avatarB = createAvatar("#98ffe5", palette.blue)
  avatarB.position.set(0.33, 1.55, 0.55)
  avatarB.rotation.y = -0.3
  group.add(avatarB)

  animated.avatars.push(
    { mesh: avatarA, baseY: avatarA.position.y, phase: 0.6, speed: 2.2, amplitude: 0.04 },
    { mesh: avatarB, baseY: avatarB.position.y, phase: 1.4, speed: 2.6, amplitude: 0.05 },
  )

  return group
}

function buildRelayFactory() {
  const group = new THREE.Group()
  group.position.set(2.35, -0.72, 0.48)

  const base = createPaperStack(2.5, 2.5, 4, ["#fff2fb", "#eefbff", "#fff8dc"])
  group.add(base)

  const curve = new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(0.16, 1.1, 1.12),
      new THREE.Vector3(0.95, 1.32, 0.42),
      new THREE.Vector3(1.38, 1.02, -0.55),
      new THREE.Vector3(0.42, 0.7, -1.14),
      new THREE.Vector3(-0.58, 0.88, -0.18),
      new THREE.Vector3(-0.24, 1.18, 0.94),
    ],
    true,
  )

  const rail = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 160, 0.07, 12, true),
    standardMaterial("#fff2a8", {
      emissive: "#fff2a8",
      emissiveIntensity: 0.24,
      roughness: 0.32,
    }),
  )
  group.add(rail)

  const roomMaterial = new THREE.MeshPhysicalMaterial({
    color: "#d9f7ff",
    transparent: true,
    opacity: 0.54,
    transmission: 0.78,
    roughness: 0.1,
    thickness: 0.4,
  })

  ;[0.1, 0.4, 0.72].forEach((t, index) => {
    const room = new THREE.Mesh(new RoundedBoxGeometry(0.74, 0.56, 0.74, 6, 0.06), roomMaterial)
    room.position.copy(curve.getPointAt(t))
    room.castShadow = true
    group.add(room)

    for (let stripIndex = 0; stripIndex < 3; stripIndex += 1) {
      const stripColors = [palette.pink, palette.sun, palette.aqua]
      const canvasStrip = createRoundedPanel(0.38, 0.03, 0.12, stripColors[stripIndex], 0.01)
      canvasStrip.position.set(0, 0.16 - stripIndex * 0.16, 0)
      room.add(canvasStrip)
    }

    const avatar = createAvatar(index % 2 === 0 ? "#d8fdff" : "#fff28f", index % 2 === 0 ? palette.pink : palette.blue)
    avatar.position.set(index === 1 ? 0.08 : -0.05, -0.1, 0.15)
    avatar.scale.setScalar(0.7)
    room.add(avatar)
  })

  const pathAxis = new THREE.Vector3(1, 0, 0)
  const pieceColors = [palette.pink, palette.sun, palette.aqua, palette.orange]

  for (let index = 0; index < 12; index += 1) {
    const piece = createRoundedPanel(0.18, 0.03, 0.09, pieceColors[index % pieceColors.length], 0.02)
    group.add(piece)
    animated.conveyorPieces.push({
      mesh: piece,
      curve,
      axis: pathAxis,
      offset: index / 12,
    })
  }

  const funnelBase = createRoundedPanel(0.72, 0.18, 0.72, "#fff0d5", 0.04)
  funnelBase.position.set(-0.62, 0.24, 0.02)
  group.add(funnelBase)

  const funnel = new THREE.Mesh(
    new THREE.ConeGeometry(0.46, 0.82, 28),
    standardMaterial("#ffe67a", {
      roughness: 0.64,
    }),
  )
  funnel.position.set(-0.62, 0.72, 0.02)
  funnel.castShadow = true
  group.add(funnel)

  const press = createRoundedPanel(0.44, 0.12, 0.44, palette.orange, 0.04, {
    emissive: palette.orange,
    emissiveIntensity: 0.12,
  })
  press.position.set(-0.62, 1.2, 0.02)
  group.add(press)

  const popMemo = new THREE.Group()
  popMemo.position.set(-0.62, 1.38, 0.02)

  const memoSheet = createRoundedPanel(0.7, 0.05, 0.52, "#fff06b", 0.04)
  popMemo.add(memoSheet)

  const eyeMaterial = standardMaterial(palette.ink, { roughness: 0.4 })
  const faceA = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 16), eyeMaterial)
  faceA.position.set(-0.12, 0.04, 0.09)
  const faceB = faceA.clone()
  faceB.position.x = 0.1
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.012, 8, 24, Math.PI), eyeMaterial)
  mouth.rotation.x = Math.PI / 2
  mouth.rotation.z = Math.PI
  mouth.position.set(0, -0.02, 0.08)

  popMemo.add(faceA, faceB, mouth)
  group.add(popMemo)
  animated.poppedMemos.push({ mesh: popMemo, baseY: popMemo.position.y, phase: 0.3 })

  return group
}

function buildFortuneShrine() {
  const group = new THREE.Group()
  group.position.set(0.02, -0.72, -2.3)

  const base = createPaperStack(2.7, 2.2, 4, ["#fff1fb", "#eefaff", "#fff6d9"])
  group.add(base)

  for (const x of [-0.92, 0.92]) {
    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.13, 1.4, 18),
      standardMaterial("#fff4ff", {
        roughness: 0.82,
      }),
    )
    pillar.position.set(x, 0.9, -0.08)
    pillar.castShadow = true
    group.add(pillar)
  }

  const lintel = createRoundedPanel(2.12, 0.18, 0.32, "#fff3df", 0.04)
  lintel.position.set(0, 1.62, -0.08)
  group.add(lintel)

  const machineBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.82, 0.9, 0.58, 36),
    standardMaterial("#ffe6f4", {
      roughness: 0.72,
    }),
  )
  machineBase.position.set(0, 0.42, 0)
  machineBase.castShadow = true
  group.add(machineBase)

  const machineRim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.9, 0.9, 0.08, 36),
    standardMaterial("#ffe48e", {
      roughness: 0.46,
    }),
  )
  machineRim.position.set(0, 0.72, 0)
  group.add(machineRim)

  const globe = new THREE.Mesh(
    new THREE.SphereGeometry(0.72, 36, 36),
    new THREE.MeshPhysicalMaterial({
      color: "#f7fcff",
      transparent: true,
      opacity: 0.5,
      transmission: 0.9,
      thickness: 0.6,
      roughness: 0.02,
    }),
  )
  globe.position.set(0, 1.15, 0)
  globe.castShadow = true
  group.add(globe)

  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.34, 0.42, 0.24, 24),
    standardMaterial("#ffd877", {
      roughness: 0.42,
      metalness: 0.06,
    }),
  )
  cap.position.set(0, 1.88, 0)
  group.add(cap)

  const leverPivot = new THREE.Group()
  leverPivot.position.set(0.95, 0.55, 0.08)
  leverPivot.rotation.z = -0.54

  const leverRod = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 0.72, 16),
    standardMaterial("#ffd161", {
      roughness: 0.32,
    }),
  )
  leverRod.position.y = 0.28
  leverRod.castShadow = true
  leverPivot.add(leverRod)

  const leverHandle = new THREE.Mesh(
    new THREE.SphereGeometry(0.11, 18, 18),
    standardMaterial(palette.pink, {
      roughness: 0.34,
    }),
  )
  leverHandle.position.y = 0.62
  leverHandle.castShadow = true
  leverPivot.add(leverHandle)
  group.add(leverPivot)
  animated.hinges.push({ mesh: leverPivot, axis: "z", baseRotation: leverPivot.rotation.z, speed: 1.6, amplitude: 0.12 })

  const fortuneMemo = createRoundedPanel(0.82, 0.06, 0.44, palette.gold, 0.04, {
    roughness: 0.48,
    emissive: palette.gold,
    emissiveIntensity: 0.08,
  })
  fortuneMemo.position.set(0, 0.18, 0.86)
  group.add(fortuneMemo)

  const fortuneFrame = createRoundedPanel(0.6, 0.018, 0.3, "#fff7e0", 0.01, {
    emissive: "#fff7e0",
    emissiveIntensity: 0.18,
    roughness: 0.45,
  })
  fortuneFrame.position.set(0, 0.05, 0)
  fortuneMemo.add(fortuneFrame)

  const orbColors = [palette.pink, palette.mint, palette.sun, palette.aqua, palette.orange, palette.violet]
  for (let index = 0; index < 16; index += 1) {
    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 14, 14),
      standardMaterial(orbColors[index % orbColors.length], {
        roughness: 0.46,
      }),
    )
    group.add(orb)
    animated.gachaBalls.push({
      mesh: orb,
      radius: 0.18 + Math.random() * 0.32,
      height: 0.95 + Math.random() * 0.42,
      angle: (Math.PI * 2 * index) / 16,
      speed: 0.55 + Math.random() * 0.4,
      wobble: 0.1 + Math.random() * 0.08,
    })
  }

  for (let index = 0; index < 10; index += 1) {
    const sparkle = new THREE.Mesh(
      new THREE.SphereGeometry(0.03 + Math.random() * 0.02, 10, 10),
      new THREE.MeshBasicMaterial({
        color: index % 2 === 0 ? "#fff7c8" : "#ffd780",
      }),
    )
    sparkle.position.set((Math.random() - 0.5) * 0.9, 0.32 + Math.random() * 0.6, 0.95 + (Math.random() - 0.5) * 0.3)
    group.add(sparkle)
    animated.sparkles.push({
      mesh: sparkle,
      baseY: sparkle.position.y,
      phase: Math.random() * Math.PI * 2,
      amplitude: 0.06 + Math.random() * 0.04,
    })
  }

  return group
}

function buildEntryPortal() {
  const group = new THREE.Group()
  group.position.set(0, -0.75, 3.66)

  const sheet = createRoundedPanel(0.88, 1.08, 0.05, "#fff6ff", 0.03, {
    roughness: 0.84,
  })
  sheet.position.set(0, 0.18, 0.28)
  sheet.rotation.x = 0.06
  group.add(sheet)

  const printedFrame = createRoundedPanel(0.52, 0.82, 0.01, "#ffd86a", 0.014, {
    emissive: "#ffe08a",
    emissiveIntensity: 0.15,
  })
  printedFrame.position.set(0, 0.02, 0.04)
  sheet.add(printedFrame)

  const doorPivot = new THREE.Group()
  doorPivot.position.set(-0.17, 0.02, 0.05)
  sheet.add(doorPivot)

  const door = createRoundedPanel(0.34, 0.6, 0.03, "#fffdf8", 0.02, {
    roughness: 0.76,
  })
  door.position.set(0.17, 0, 0)
  doorPivot.add(door)
  animated.movingDoors.push({ mesh: doorPivot, baseRotation: 0.78, speed: 1.3, amplitude: 0.16 })

  for (let index = 0; index < 5; index += 1) {
    const stripColors = ["#fff7d4", "#ffd1ec", "#c8fff2", "#fff8ef", "#d5f1ff"]
    const ramp = createRoundedPanel(0.78 - index * 0.08, 0.03, 0.42, stripColors[index], 0.02)
    ramp.position.set(0, -0.33 + index * 0.06, -0.15 - index * 0.48)
    ramp.rotation.x = -0.18 + index * 0.04
    group.add(ramp)
    animated.entranceSheets.push({
      mesh: ramp,
      baseY: ramp.position.y,
      phase: index * 0.6,
      amplitude: 0.03 + index * 0.004,
    })
  }

  const sideBalloonLeft = createBalloon(palette.sun)
  sideBalloonLeft.scale.setScalar(0.5)
  sideBalloonLeft.position.set(-0.58, 0.8, 0.2)
  group.add(sideBalloonLeft)
  animated.balloons.push({
    mesh: sideBalloonLeft,
    baseY: sideBalloonLeft.position.y,
    phase: 0.5,
    amplitude: 0.05,
  })

  const sideBalloonRight = createBalloon(palette.aqua)
  sideBalloonRight.scale.setScalar(0.48)
  sideBalloonRight.position.set(0.56, 0.74, 0.18)
  group.add(sideBalloonRight)
  animated.balloons.push({
    mesh: sideBalloonRight,
    baseY: sideBalloonRight.position.y,
    phase: 1.2,
    amplitude: 0.05,
  })

  return group
}

function setupLights() {
  const hemisphere = new THREE.HemisphereLight("#fff7ff", "#8bdafc", 1.46)
  scene.add(hemisphere)

  const key = new THREE.DirectionalLight("#fff2f8", 1.52)
  key.position.set(8.5, 12, 8.5)
  key.castShadow = true
  key.shadow.mapSize.set(2048, 2048)
  key.shadow.camera.near = 1
  key.shadow.camera.far = 30
  key.shadow.camera.left = -12
  key.shadow.camera.right = 12
  key.shadow.camera.top = 12
  key.shadow.camera.bottom = -12
  key.shadow.bias = -0.00008
  scene.add(key)

  const fill = new THREE.DirectionalLight("#b9f3ff", 0.98)
  fill.position.set(-8, 5, -6)
  scene.add(fill)

  const rim = new THREE.PointLight("#ffb1dd", 1.34, 20, 2)
  rim.position.set(0, 6, -3)
  scene.add(rim)

  const floorBounce = new THREE.PointLight("#ffe08f", 0.96, 24, 2)
  floorBounce.position.set(0, -0.4, 5)
  scene.add(floorBounce)
}

function buildWorld() {
  worldRoot.add(buildDesk())
  worldRoot.add(buildDeviceShell())
  worldRoot.add(buildCentralPlaza())
  worldRoot.add(buildEntryPortal())
  loadThemeparkAsset()
  loadZonepackAsset()

  const dustWarm = createPointCloud(180, new THREE.Vector3(10, 4.8, 10), "#fff7cf", 0.045)
  dustWarm.position.set(0, -0.4, 0.8)
  worldRoot.add(dustWarm)
  animated.particleGroups.push({ mesh: dustWarm, speed: 0.06 })

  const dustPink = createPointCloud(170, new THREE.Vector3(9, 4.4, 9), "#ffcde6", 0.042)
  dustPink.position.set(0.2, -0.15, 0.2)
  worldRoot.add(dustPink)
  animated.particleGroups.push({ mesh: dustPink, speed: -0.04 })

  const dustBlue = createPointCloud(150, new THREE.Vector3(8, 4.0, 8), "#bdf6ff", 0.038)
  dustBlue.position.set(-0.2, 0.1, -0.2)
  worldRoot.add(dustBlue)
  animated.particleGroups.push({ mesh: dustBlue, speed: 0.03 })
}

setupLights()
buildWorld()

function resize() {
  const width = stage.clientWidth
  const height = stage.clientHeight
  renderer.setSize(width, height, false)
  camera.aspect = width / height
  camera.updateProjectionMatrix()
}

function onPointerDown(event) {
  isDragging = true
  lastPointerX = event.clientX
  canvas.classList.add("is-dragging")
  markInteraction()
}

function onPointerMove(event) {
  if (!isDragging) return

  const deltaX = event.clientX - lastPointerX
  lastPointerX = event.clientX
  cameraState.targetAzimuth -= deltaX * 0.006
  markInteraction()
}

function endDrag() {
  isDragging = false
  canvas.classList.remove("is-dragging")
}

function onWheel(event) {
  event.preventDefault()
  cameraState.targetDistance = THREE.MathUtils.clamp(cameraState.targetDistance + event.deltaY * 0.008, 4.8, 14.5)
  markInteraction()
}

function onFocusButtonClick(event) {
  focusZone(event.currentTarget.dataset.focus)
}

canvas.addEventListener("pointerdown", onPointerDown)
canvas.addEventListener("wheel", onWheel, { passive: false })
window.addEventListener("pointermove", onPointerMove)
window.addEventListener("pointerup", endDrag)
window.addEventListener("pointerleave", endDrag)
window.addEventListener("pointercancel", endDrag)
window.addEventListener("resize", resize)

focusButtons.forEach((button) => {
  button.addEventListener("click", onFocusButtonClick)
})

setActiveButton(currentFocus)
updateFocusReadout(currentFocus)
if (initialFocusKey && focusCopy[initialFocusKey]) {
  focusZone(initialFocusKey)
}
resize()

const clock = new THREE.Clock()

function updateCamera(elapsed) {
  const timeSinceInteraction = performance.now() - lastInteractionAt

  if (!isDragging && timeSinceInteraction > 2200) {
    cameraState.targetAzimuth += currentFocus === "entry" ? 0.0003 : 0.0007
  }

  cameraState.currentAzimuth += (cameraState.targetAzimuth - cameraState.currentAzimuth) * 0.08
  cameraState.currentDistance += (cameraState.targetDistance - cameraState.currentDistance) * 0.1
  cameraState.currentHeight += (cameraState.targetHeight - cameraState.currentHeight) * 0.08
  cameraState.currentLookAt.lerp(cameraState.targetLookAt, 0.08)

  camera.position.set(
    cameraState.currentLookAt.x + Math.sin(cameraState.currentAzimuth) * cameraState.currentDistance,
    cameraState.currentLookAt.y + cameraState.currentHeight,
    cameraState.currentLookAt.z + Math.cos(cameraState.currentAzimuth) * cameraState.currentDistance,
  )
  camera.lookAt(cameraState.currentLookAt)

  worldRoot.position.y = Math.sin(elapsed * 0.75) * 0.05
}

function updateAnimations(elapsed) {
  animated.orbitGroups.forEach((entry) => {
    entry.mesh.rotation.y = elapsed * entry.speed
  })

  animated.floatingNotes.forEach((entry) => {
    entry.mesh.position.y = entry.baseY + Math.sin(elapsed * entry.speed + entry.phase) * 0.08
    entry.mesh.rotation.x = Math.sin(elapsed * 0.7 + entry.phase) * 0.08
  })

  animated.cliffNotes.forEach((entry) => {
    entry.mesh.position.x = entry.baseX + Math.sin(elapsed * 1.5 + entry.phase) * entry.amplitude
  })

  animated.avatars.forEach((entry) => {
    entry.mesh.position.y = entry.baseY + Math.sin(elapsed * entry.speed + entry.phase) * entry.amplitude
  })

  animated.fallingNotes.forEach((entry) => {
    const loop = (elapsed * entry.speed + entry.phase) % 1
    entry.mesh.position.y = THREE.MathUtils.lerp(entry.topY, entry.bottomY, loop)
    entry.mesh.rotation.z = -0.2 + loop * 0.8
  })

  animated.conveyorPieces.forEach((entry, index) => {
    const t = (elapsed * 0.06 + entry.offset) % 1
    const point = entry.curve.getPointAt(t)
    const tangent = entry.curve.getTangentAt(t).normalize()
    entry.mesh.position.copy(point)
    entry.mesh.quaternion.setFromUnitVectors(entry.axis, tangent)
    entry.mesh.rotation.z += Math.sin(elapsed * 0.9 + index) * 0.002
  })

  animated.poppedMemos.forEach((entry) => {
    entry.mesh.position.y = entry.baseY + Math.abs(Math.sin(elapsed * 2.15 + entry.phase)) * 0.46
    entry.mesh.rotation.z = Math.sin(elapsed * 1.3 + entry.phase) * 0.12
  })

  animated.gachaBalls.forEach((entry) => {
    const angle = elapsed * entry.speed + entry.angle
    entry.mesh.position.set(
      Math.cos(angle) * entry.radius,
      entry.height + Math.sin(angle * 1.7) * entry.wobble,
      Math.sin(angle) * entry.radius * 0.85,
    )
  })

  animated.sparkles.forEach((entry) => {
    entry.mesh.position.y = entry.baseY + Math.sin(elapsed * 2 + entry.phase) * entry.amplitude
  })

  animated.entranceSheets.forEach((entry) => {
    entry.mesh.position.y = entry.baseY + Math.sin(elapsed * 1.2 + entry.phase) * entry.amplitude
  })

  animated.movingDoors.forEach((entry) => {
    entry.mesh.rotation.y = entry.baseRotation + Math.sin(elapsed * entry.speed) * entry.amplitude
  })

  animated.hinges.forEach((entry) => {
    entry.mesh.rotation[entry.axis] = entry.baseRotation + Math.sin(elapsed * entry.speed) * entry.amplitude
  })

  animated.lidConfetti.forEach((entry) => {
    entry.mesh.position.y = entry.baseY + Math.sin(elapsed * 1.6 + entry.phase) * entry.amplitude
  })

  animated.balloons.forEach((entry) => {
    entry.mesh.position.y = entry.baseY + Math.sin(elapsed * 1.5 + entry.phase) * entry.amplitude
    entry.mesh.rotation.z = Math.sin(elapsed * 0.7 + entry.phase) * 0.06
  })

  animated.clouds.forEach((entry) => {
    entry.mesh.position.y = entry.baseY + Math.sin(elapsed * 0.7 + entry.phase) * entry.amplitude
    entry.mesh.position.x = entry.baseX + Math.sin(elapsed * 0.32 + entry.phase) * entry.drift
  })

  animated.particleGroups.forEach((entry) => {
    entry.mesh.rotation.y += entry.speed * 0.01
  })
}

function tick() {
  const elapsed = clock.getElapsedTime()
  updateCamera(elapsed)
  updateAnimations(elapsed)
  renderer.render(scene, camera)
  window.requestAnimationFrame(tick)
}

tick()
