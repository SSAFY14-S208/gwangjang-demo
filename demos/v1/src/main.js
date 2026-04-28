import "./style.css"
import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"

const canvas = document.querySelector("#scene")
const stage = canvas.parentElement
const platformButtons = Array.from(document.querySelectorAll(".platform-button"))
const viewerCopy = document.querySelector(".viewer-copy")
const viewerEyebrow = document.querySelector(".eyebrow")
const viewerTitle = document.querySelector(".viewer-copy h1")
const viewerDescription = document.querySelector(".description")

const contentViews = {
  fortune: {
    platform: "purple",
    angle: 1.679,
    zoom: 15.6,
    eyebrow: "하루에 한 번, 네모닉 운세",
    title: "오늘의 운세",
    description: "생년월일시를 넣고 네모닉이 건네는 오늘의 운세 카드를 받아보는 작은 부스입니다.",
  },
  community: {
    platform: "green",
    angle: -2.794,
    zoom: 15.9,
    eyebrow: "메모가 쌓이는 공용 벽",
    title: "커뮤니티 캔버스",
    description: "출력된 메모와 결과물을 함께 붙이고 감상하는 모두의 갤러리형 캔버스입니다.",
  },
  relay: {
    platform: "coral",
    angle: 0.51,
    zoom: 15.8,
    eyebrow: "내 그림과 남의 그림이 만나는 협동 놀이",
    title: "우당탕 릴레이 드로잉",
    description: "얼굴, 몸통, 다리를 차례로 이어 그려 예상 못 한 캐릭터를 완성하는 릴레이 드로잉입니다.",
  },
  infinite: {
    platform: "blue",
    angle: -0.904,
    zoom: 15.9,
    eyebrow: "함께 펼치는 실시간 창작 공간",
    title: "무한 캔버스",
    description: "같은 캔버스 위에서 커서와 드로잉을 실시간으로 공유하고 원하는 영역을 출력합니다.",
  },
  flipbook: {
    platform: "yellow",
    angle: -1.645,
    zoom: 15.9,
    eyebrow: "프레임을 이어 만드는 짧은 애니메이션",
    title: "플립북",
    description: "앞 프레임을 가이드로 이어 그리고, 완성된 움직임을 GIF와 출력물로 남기는 콘텐츠입니다.",
  },
}
const initialContentKey = "fortune"

const assetMaterialStyles = {
  BodyGray: { color: "#e7d6cf", emissive: "#f5ebe6", emissiveIntensity: 0.08 },
  RingSideCream: { color: "#f1ddca", emissive: "#fff5e6", emissiveIntensity: 0.08 },
  CenterDiskGray: { color: "#d9afb8", emissive: "#ffe5eb", emissiveIntensity: 0.12 },
  CubeLeft: { color: "#f4ebe1", emissive: "#fff7ef", emissiveIntensity: 0.1 },
  CubeRight: { color: "#fff4df", emissive: "#fff9ed", emissiveIntensity: 0.1 },
  CubeTopPink: { color: "#fff0e7", emissive: "#fff8f1", emissiveIntensity: 0.1 },
}

const assetMeshStyles = {
  BackLavender_1: { color: "#f5eadc", emissive: "#fff8ee", emissiveIntensity: 0.1 },
  LeftCyan_1: { color: "#f5eadc", emissive: "#fff8ee", emissiveIntensity: 0.1 },
  FrontYellow_1: { color: "#f5eadc", emissive: "#fff8ee", emissiveIntensity: 0.1 },
  RightGreen_1: { color: "#f5eadc", emissive: "#fff8ee", emissiveIntensity: 0.1 },
}

const outerBoardMeshes = new Set([
  "LowerBody",
  "BackLavender_1",
  "BackLavender_2",
  "LeftCyan_1",
  "LeftCyan_2",
  "FrontYellow_1",
  "FrontYellow_2",
  "RightGreen_1",
  "RightGreen_2",
])

const witchPlatformPosition = new THREE.Vector3(-6.05, 0.68, -0.64)
const witchPlatformRotation = -Math.PI / 2
const witchPlatformHeight = 3.25
const witchGlowMeshNames = new Set()
const mnemonicGlassMeshName = "MNEMONIC_outer_translucent_rounded_cube"
const mnemonicHiddenMeshNames = new Set([
  "MNEMONIC_inner_warm_glow_core",
  "MNEMONIC_front_cyan_square",
  "MNEMONIC_front_pink_diamond",
  "MNEMONIC_top_lime_square",
  "MNEMONIC_top_pink_diamond",
  "MNEMONIC_right_face_blue_square",
  "MNEMONIC_left_face_lavender_square",
  "MNEMONIC_soft_vertical_edge_-1_front",
  "MNEMONIC_soft_vertical_edge_+1_front",
  "MNEMONIC_soft_front_horizontal_edge_-1",
  "MNEMONIC_soft_front_horizontal_edge_+1",
  "MNEMONIC_starburst_glow_center",
])
const witchTouchArmMeshNames = new Set([
  "CHAR_left_raised_sleeve_shaft",
  "CHAR_left_raised_sleeve_cap_A",
  "CHAR_left_raised_sleeve_cap_B",
  "CHAR_right_forward_sleeve_shaft",
  "CHAR_right_forward_sleeve_cap_A",
  "CHAR_right_forward_sleeve_cap_B",
])
const witchHandMeshNames = new Set([
  "CHAR_left_open_hand",
  "CHAR_right_table_hand",
])
const witchSkinMaterialName = "MAT_peach_skin_clay"
const witchSkinMeshNames = new Set([
  "CHAR_head_round_peach",
  "CHAR_left_open_hand",
  "CHAR_neck_peach",
  "CHAR_nose_tiny_peach",
  "CHAR_right_table_hand",
])
const witchBangCoverageAdjustments = {
  CHAR_bang_center_soft: {
    position: [0, 0.085, 0.025],
    scale: [1.46, 1.44, 1.14],
    rotation: [0.02, -0.04, -0.02],
  },
  CHAR_bang_left_soft: {
    position: [-0.035, 0.078, 0.02],
    scale: [1.36, 1.38, 1.12],
    rotation: [0.01, -0.02, -0.16],
  },
  CHAR_bang_right_soft: {
    position: [0.035, 0.09, 0.02],
    scale: [1.42, 1.42, 1.12],
    rotation: [0.01, 0.02, 0.12],
  },
}
const witchHairlineFillPieces = [
  {
    name: "CHAR_added_soft_hairline_cap",
    position: [0.02, 2.98, 0.31],
    rotation: [-0.08, 0, 0.02],
    scale: [0.58, 0.15, 0.13],
  },
  {
    name: "CHAR_added_left_forehead_lock",
    position: [-0.3, 2.925, 0.4],
    rotation: [0.02, -0.06, -0.46],
    scale: [0.28, 0.18, 0.09],
  },
  {
    name: "CHAR_added_right_forehead_lock",
    position: [0.31, 2.925, 0.4],
    rotation: [0.02, 0.06, 0.42],
    scale: [0.28, 0.18, 0.09],
  },
  {
    name: "CHAR_added_center_lower_curl",
    position: [0.03, 2.82, 0.49],
    rotation: [0.04, 0.02, 0.03],
    scale: [0.2, 0.105, 0.07],
  },
  {
    name: "CHAR_added_left_side_fill",
    position: [-0.43, 2.82, 0.28],
    rotation: [0.04, -0.08, 0.1],
    scale: [0.16, 0.28, 0.105],
  },
  {
    name: "CHAR_added_right_side_fill",
    position: [0.43, 2.82, 0.28],
    rotation: [0.04, 0.08, -0.1],
    scale: [0.16, 0.28, 0.105],
  },
]

const organicBoardOutline = [
  [-8.2, -4.8],
  [-5.9, -7.7],
  [-1.2, -8.3],
  [4.4, -7.6],
  [8.8, -4.8],
  [8.9, -0.6],
  [7.9, 1.7],
  [9.4, 3.9],
  [7.2, 6.3],
  [3.0, 7.4],
  [0.2, 8.3],
  [-3.5, 7.7],
  [-6.7, 6.0],
  [-8.7, 3.8],
  [-9.4, 0.2],
  [-8.6, -2.7],
]

const organicPlateShapes = [
  {
    name: "PaintBackGreen",
    color: "#96d27f",
    points: [
      [-6.4, -2.5],
      [-5.0, -7.1],
      [-0.8, -8.2],
      [4.9, -7.4],
      [8.7, -4.5],
      [8.1, -0.5],
      [3.4, 0.3],
      [-2.1, 0.1],
    ],
  },
  {
    name: "PaintLeftPurple",
    color: "#a281d0",
    points: [
      [-7.4, -4.0],
      [-5.5, -5.4],
      [-2.6, -4.3],
      [-2.6, -1.1],
      [-2.0, 2.6],
      [-4.7, 5.4],
      [-7.9, 3.8],
      [-9.2, 0.3],
      [-8.5, -2.8],
    ],
  },
  {
    name: "PaintFrontCoral",
    color: "#f58c97",
    points: [
      [-6.8, 3.2],
      [-2.6, 1.0],
      [1.0, 1.6],
      [3.3, 4.5],
      [2.2, 7.2],
      [-0.6, 8.2],
      [-3.9, 7.7],
      [-7.1, 5.8],
      [-8.5, 3.8],
    ],
  },
  {
    name: "PaintRightBlue",
    color: "#aacfe8",
    points: [
      [1.6, 0.8],
      [5.1, 0.5],
      [8.2, 1.9],
      [9.3, 4.1],
      [7.1, 6.2],
      [3.3, 7.2],
      [1.4, 5.5],
      [0.8, 2.8],
    ],
  },
  {
    name: "PaintBoothYellow",
    color: "#ffd56f",
    points: [
      [1.7, -2.0],
      [5.9, -3.7],
      [8.6, -1.5],
      [8.1, 1.8],
      [5.0, 2.7],
      [2.1, 1.1],
      [1.3, -0.5],
    ],
  },
]

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
})
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.outputColorSpace = THREE.SRGBColorSpace

const scene = new THREE.Scene()
scene.background = new THREE.Color("#f9f4fb")
scene.fog = new THREE.Fog("#f9f4fb", 16, 30)

const minZoom = 11.5
const maxZoom = 21
const cameraHeight = 2.65
const modelRootVerticalOffset = -0.35

const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100)
let targetZoom = contentViews[initialContentKey].zoom
let currentZoom = targetZoom
camera.position.set(0, cameraHeight, currentZoom)

const pointer = new THREE.Vector2()
const raycaster = new THREE.Raycaster()

const hemisphere = new THREE.HemisphereLight("#fffef8", "#d7d3cd", 1.7)
scene.add(hemisphere)

const keyLight = new THREE.DirectionalLight("#ffffff", 2.2)
keyLight.position.set(6, 8, 8)
scene.add(keyLight)

const fillLight = new THREE.DirectionalLight("#f2f7ff", 1.2)
fillLight.position.set(-8, 3, -4)
scene.add(fillLight)

const glowSphere = new THREE.Mesh(
  new THREE.SphereGeometry(10, 48, 48),
  new THREE.MeshBasicMaterial({
    color: "#ffffff",
    transparent: true,
    opacity: 0.18,
  }),
)
glowSphere.position.set(0, 1.2, -8)
scene.add(glowSphere)

const pedestal = new THREE.Mesh(
  new THREE.CylinderGeometry(4.5, 5.5, 0.25, 96),
  new THREE.MeshStandardMaterial({
    color: "#ece8de",
    roughness: 0.95,
    metalness: 0.0,
  }),
)
pedestal.position.set(0, -2.58, 0)
scene.add(pedestal)

const modelRoot = new THREE.Group()
scene.add(modelRoot)

let asset = null
let targetRotation = contentViews[initialContentKey].angle
let currentRotation = targetRotation
let isDragging = false
let lastPointerX = 0
let lastInteractionAt = 0
let selectedContentKey = initialContentKey
let contentCopySwapTimer = null
let witchAnimation = null
let isWitchHovered = false
let pointerInCanvas = false

const loader = new GLTFLoader()
loader.load("/models/pastel_platform.glb", (gltf) => {
  asset = gltf.scene

  const box = new THREE.Box3().setFromObject(asset)
  const size = new THREE.Vector3()
  const center = new THREE.Vector3()
  box.getSize(size)
  box.getCenter(center)

  asset.position.sub(center)
  asset.position.y = -0.8

  const maxDimension = Math.max(size.x, size.y, size.z)
  const scale = 8.9 / maxDimension
  asset.scale.setScalar(scale)

  asset.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = false
      child.receiveShadow = false
      if (outerBoardMeshes.has(child.name)) {
        child.visible = false
        return
      }
      if (child.name === "CenterDisk") {
        child.visible = false
        return
      }
      applyModelPalette(child)
    }
  })

  asset.add(createOrganicBoardGroup())
  asset.add(createRaisedCenterDisk())
  addWitchToPurplePlatform(asset)
  modelRoot.add(asset)
})

function resize() {
  const width = stage.clientWidth
  const height = stage.clientHeight
  renderer.setSize(width, height, false)
  camera.aspect = width / height
  camera.updateProjectionMatrix()
}

function normalizeAngle(angle) {
  return Math.atan2(Math.sin(angle), Math.cos(angle))
}

function setActiveButton(contentKey) {
  platformButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.content === contentKey)
  })
}

function updateContentCopy(view, immediate = false) {
  if (!viewerEyebrow || !viewerTitle || !viewerDescription) return

  window.clearTimeout(contentCopySwapTimer)

  const applyCopy = () => {
    viewerEyebrow.textContent = view.eyebrow
    viewerTitle.textContent = view.title
    viewerDescription.textContent = view.description
  }

  if (immediate) {
    applyCopy()
    viewerCopy?.classList.remove("is-swapping")
    return
  }

  viewerCopy?.classList.add("is-swapping")
  applyCopy()
  contentCopySwapTimer = window.setTimeout(() => {
    viewerCopy?.classList.remove("is-swapping")
  }, 180)
}

function selectContent(contentKey, immediate = false) {
  const view = contentViews[contentKey]
  if (!view) return

  selectedContentKey = contentKey
  setActiveButton(contentKey)
  updateContentCopy(view, immediate)
  targetZoom = THREE.MathUtils.clamp(view.zoom, minZoom, maxZoom)
}

function markInteraction() {
  lastInteractionAt = performance.now()
}

function setWitchHovered(nextIsHovered) {
  isWitchHovered = nextIsHovered
}

function updatePointerPosition(event) {
  const bounds = canvas.getBoundingClientRect()
  pointerInCanvas = (
    event.clientX >= bounds.left
    && event.clientX <= bounds.right
    && event.clientY >= bounds.top
    && event.clientY <= bounds.bottom
  )

  if (!pointerInCanvas) {
    setWitchHovered(false)
    return
  }

  pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1
  pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1
}

function updateWitchHoverFromPointer() {
  if (!witchAnimation || !pointerInCanvas || isDragging) {
    setWitchHovered(false)
    return
  }

  camera.updateMatrixWorld()
  modelRoot.updateMatrixWorld(true)
  raycaster.setFromCamera(pointer, camera)
  setWitchHovered(raycaster.intersectObjects(witchAnimation.hoverTargets, true).length > 0)
}

function updateWitchHover(event) {
  updatePointerPosition(event)
  updateWitchHoverFromPointer()
}

function clearWitchHover() {
  pointerInCanvas = false
  setWitchHovered(false)
}

function onPointerDown(event) {
  isDragging = true
  lastPointerX = event.clientX
  markInteraction()
  setWitchHovered(false)
  canvas.classList.add("is-dragging")
}

function onPointerMove(event) {
  if (!isDragging) {
    updateWitchHover(event)
    return
  }

  const deltaX = event.clientX - lastPointerX
  lastPointerX = event.clientX
  targetRotation += deltaX * 0.008
  markInteraction()
  setWitchHovered(false)
}

function endDrag(event) {
  isDragging = false
  canvas.classList.remove("is-dragging")
  if (event) {
    updateWitchHover(event)
  }
}

function onWheel(event) {
  event.preventDefault()
  targetZoom = THREE.MathUtils.clamp(targetZoom + event.deltaY * 0.008, minZoom, maxZoom)
  markInteraction()
}

function onPlatformButtonClick(event) {
  const button = event.currentTarget
  const contentKey = button.dataset.content
  const view = contentViews[contentKey]
  const nextAngle = view?.angle ?? Number(button.dataset.angle)
  const shortestDelta = normalizeAngle(nextAngle - currentRotation)

  // Rotate smoothly from the current pose to the requested platform view.
  targetRotation = currentRotation + shortestDelta
  markInteraction()
  selectContent(contentKey)
}

function createSmoothShape(points, tension = 0.48, divisions = 18) {
  const curve = new THREE.CatmullRomCurve3(
    points.map(([x, z]) => new THREE.Vector3(x, z, 0)),
    true,
    "catmullrom",
    tension,
  )

  return new THREE.Shape(
    curve.getPoints(points.length * divisions).map((point) => new THREE.Vector2(point.x, point.y)),
  )
}

function createPatchMaterials(color) {
  const sideColor = new THREE.Color(color).multiplyScalar(0.76)

  return [
    new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.12,
      roughness: 0.95,
      metalness: 0,
      side: THREE.DoubleSide,
    }),
    new THREE.MeshStandardMaterial({
      color: sideColor,
      emissive: sideColor,
      emissiveIntensity: 0.08,
      roughness: 0.97,
      metalness: 0,
    }),
  ]
}

function createRaisedCenterDisk() {
  const capMaterial = new THREE.MeshStandardMaterial({
    color: "#efb5c1",
    emissive: "#f7cbd3",
    emissiveIntensity: 0.05,
    roughness: 0.9,
    metalness: 0,
  })
  const sideMaterial = new THREE.MeshStandardMaterial({
    color: "#d99baa",
    emissive: "#f3c6d0",
    emissiveIntensity: 0.08,
    roughness: 0.94,
    metalness: 0,
  })

  const disk = new THREE.Mesh(
    new THREE.CylinderGeometry(2.96, 3.06, 0.28, 160, 1, false),
    [sideMaterial, capMaterial, capMaterial],
  )

  disk.name = "RaisedCenterDisk"
  disk.position.y = 0.67
  disk.renderOrder = 20

  return disk
}

function createOrganicBoardGroup() {
  const group = new THREE.Group()
  group.name = "OrganicBoard"

  const baseInset = 0.92
  const baseShape = createSmoothShape(
    organicBoardOutline.map(([x, z]) => [x * baseInset, z * baseInset]),
    0.42,
    20,
  )
  const base = new THREE.Mesh(
    new THREE.ExtrudeGeometry(baseShape, {
      depth: 0.5,
      bevelEnabled: true,
      bevelSize: 0.12,
      bevelThickness: 0.08,
      bevelSegments: 8,
      curveSegments: 16,
    }),
    [
      new THREE.MeshStandardMaterial({
        color: "#fff4df",
        emissive: "#fff7ec",
        emissiveIntensity: 0.08,
        roughness: 0.94,
        metalness: 0,
        transparent: true,
        opacity: 0.54,
      }),
      new THREE.MeshStandardMaterial({
        color: "#d2bca2",
        emissive: "#f1dfc8",
        emissiveIntensity: 0.05,
        roughness: 0.96,
        metalness: 0,
      }),
    ],
  )

  base.name = "OrganicBoardBase"
  base.rotation.x = Math.PI / 2
  base.position.y = 0.43
  base.renderOrder = 0
  group.add(base)

  organicPlateShapes.forEach(({ name, color, points }, index) => {
    const shape = createSmoothShape(points, 0.48, 18)
    const mesh = new THREE.Mesh(
      new THREE.ExtrudeGeometry(shape, {
        depth: 0.16,
        bevelEnabled: true,
        bevelSize: 0.035,
        bevelThickness: 0.03,
        bevelSegments: 5,
        curveSegments: 12,
      }),
      createPatchMaterials(color),
    )

    mesh.name = name
    mesh.rotation.x = Math.PI / 2
    mesh.position.y = 0.545 + index * 0.003
    mesh.renderOrder = index + 1
    group.add(mesh)
  })

  return group
}

function createWitchShadow() {
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(1, 64),
    new THREE.MeshBasicMaterial({
      color: "#6f4f89",
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
    }),
  )

  shadow.name = "PurpleWitchContactShadow"
  shadow.rotation.x = -Math.PI / 2
  shadow.position.y = 0.012
  shadow.scale.set(1.35, 0.78, 1)
  shadow.renderOrder = 19

  return shadow
}

function getMeshMaterials(mesh) {
  if (!mesh.material) return []
  return Array.isArray(mesh.material) ? mesh.material : [mesh.material]
}

function applyWitchSkinTone(mesh) {
  const shouldBrightenSkin = witchSkinMeshNames.has(mesh.name)

  getMeshMaterials(mesh).forEach((material) => {
    if (!shouldBrightenSkin && material.name !== witchSkinMaterialName) return

    material.color?.set("#ffc5a4")
    material.roughness = 0.9
    material.metalness = 0

    if (material.emissive) {
      material.emissive.set("#ffe0cc")
      material.emissiveIntensity = 0.06
    }
  })
}

function createWitchHairMaterial(model) {
  let sourceMaterial = null

  model.traverse((child) => {
    if (sourceMaterial || !child.isMesh || !child.name.startsWith("CHAR_hair")) return
    sourceMaterial = getMeshMaterials(child)[0] ?? null
  })

  const material = sourceMaterial?.clone() ?? new THREE.MeshStandardMaterial()
  material.name = "MAT_added_taupe_hair_cover"
  material.color.set("#b89a8f")
  material.roughness = 0.95
  material.metalness = 0

  if (material.emissive) {
    material.emissive.set("#d3bbb1")
    material.emissiveIntensity = 0.05
  }

  return material
}

function addWitchHairCoverage(model) {
  const hairMaterial = createWitchHairMaterial(model)
  const hairGroup = new THREE.Group()
  const fillGeometry = new THREE.SphereGeometry(1, 28, 18)

  hairGroup.name = "CHAR_added_fuller_hairline_group"

  model.traverse((child) => {
    if (!child.isMesh) return

    const adjustment = witchBangCoverageAdjustments[child.name]
    if (!adjustment) return

    child.position.add(new THREE.Vector3(...adjustment.position))
    child.scale.multiply(new THREE.Vector3(...adjustment.scale))
    child.rotation.x += adjustment.rotation[0]
    child.rotation.y += adjustment.rotation[1]
    child.rotation.z += adjustment.rotation[2]
    child.renderOrder = 32
  })

  witchHairlineFillPieces.forEach(({ name, position, rotation, scale }) => {
    const piece = new THREE.Mesh(fillGeometry, hairMaterial.clone())
    piece.name = name
    piece.position.set(...position)
    piece.rotation.set(...rotation)
    piece.scale.set(...scale)
    piece.renderOrder = 31
    hairGroup.add(piece)
  })

  model.add(hairGroup)
}

function createWitchMouthGroup() {
  const mouthGroup = new THREE.Group()
  mouthGroup.name = "CHAR_added_chocolate_smile_group"

  const mouthMaterial = new THREE.MeshStandardMaterial({
    name: "MAT_added_chocolate_smile",
    color: "#76503a",
    emissive: "#5a352a",
    emissiveIntensity: 0.015,
    roughness: 0.82,
    metalness: 0,
  })
  const mouthCurve = new THREE.CubicBezierCurve3(
    new THREE.Vector3(-0.085, 2.408, 0.552),
    new THREE.Vector3(-0.04, 2.366, 0.57),
    new THREE.Vector3(0.04, 2.366, 0.57),
    new THREE.Vector3(0.09, 2.41, 0.552),
  )
  const mouth = new THREE.Mesh(
    new THREE.TubeGeometry(mouthCurve, 28, 0.0075, 8, false),
    mouthMaterial,
  )
  const capGeometry = new THREE.SphereGeometry(0.008, 10, 8)
  const mouthEndpoints = [mouthCurve.v0, mouthCurve.v3]

  mouth.name = "CHAR_added_chocolate_smile_curve"
  mouth.material.depthWrite = false
  mouth.renderOrder = 36
  mouthGroup.add(mouth)

  mouthEndpoints.forEach((point, index) => {
    const cap = new THREE.Mesh(capGeometry, mouthMaterial.clone())
    cap.name = `CHAR_added_chocolate_smile_cap_${index + 1}`
    cap.position.copy(point)
    cap.material.depthWrite = false
    cap.renderOrder = 36
    mouthGroup.add(cap)
  })

  return mouthGroup
}

function addWitchFaceDetails(model) {
  model.add(createWitchMouthGroup())
}

function createAuroraRibbonMaterial(offset) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uOffset: { value: offset },
      uPulse: { value: 0 },
      uColorA: { value: new THREE.Color("#9be7ff") },
      uColorB: { value: new THREE.Color("#f6a7ff") },
      uColorC: { value: new THREE.Color("#fff2a8") },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vPosition;

      void main() {
        vUv = uv;
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uOffset;
      uniform float uPulse;
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      uniform vec3 uColorC;
      varying vec2 vUv;
      varying vec3 vPosition;

      void main() {
        vec2 p = vUv - 0.5;
        float softMask = smoothstep(0.58, 0.08, length(p * vec2(0.9, 1.85)));
        float flow = p.y + sin(p.x * 7.0 + uTime * 0.82 + uOffset) * 0.12;
        float ribbon = smoothstep(0.24, 0.0, abs(flow));
        float mist = smoothstep(0.48, 0.02, length(p * vec2(1.4, 0.9))) * 0.28;
        float blendA = sin(p.x * 5.0 + uTime * 0.7 + uOffset) * 0.5 + 0.5;
        float blendB = sin(p.y * 6.0 - uTime * 0.58 + uOffset * 1.4) * 0.5 + 0.5;
        vec3 color = mix(uColorA, uColorB, blendA);
        color = mix(color, uColorC, blendB * 0.46);
        color += vec3(0.18, 0.12, 0.24) * uPulse;
        float alpha = (ribbon * (0.42 + uPulse * 0.22) + mist) * softMask;
        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  })
}

function createPaintedGlassMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uPulse: { value: 0 },
      uColorA: { value: new THREE.Color("#9bdfff") },
      uColorB: { value: new THREE.Color("#f4a7ee") },
      uColorC: { value: new THREE.Color("#fff0a6") },
      uMilk: { value: new THREE.Color("#f6fbff") },
    },
    vertexShader: `
      varying vec3 vPosition;
      varying vec3 vNormal;

      void main() {
        vPosition = position;
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uPulse;
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      uniform vec3 uColorC;
      uniform vec3 uMilk;
      varying vec3 vPosition;
      varying vec3 vNormal;

      void main() {
        vec3 p = vPosition * 1.85;
        float waveA = sin(p.x * 5.7 + p.y * 3.1 + uTime * 0.52);
        float waveB = sin(p.z * 6.2 - p.y * 2.8 + uTime * 0.43 + 1.7);
        float waveC = sin((p.x + p.z) * 4.4 - uTime * 0.38 + sin(p.y * 3.0));
        float softCloud = (waveA + waveB + waveC) / 3.0 * 0.5 + 0.5;
        float paintVein = smoothstep(0.46, 0.92, softCloud);
        float blendA = waveA * 0.5 + 0.5;
        float blendB = waveB * 0.5 + 0.5;
        float blendC = waveC * 0.5 + 0.5;
        vec3 aurora = mix(uColorA, uColorB, blendA);
        aurora = mix(aurora, uColorC, blendB * 0.42);
        vec3 color = mix(uMilk, aurora, 0.26 + paintVein * 0.28 + blendC * 0.08 + uPulse * 0.1);
        float fresnel = pow(1.0 - abs(vNormal.z), 1.35);
        color += vec3(0.08, 0.07, 0.1) * fresnel;
        color += vec3(0.18, 0.1, 0.22) * uPulse;
        float alpha = 0.72 + fresnel * 0.12 + paintVein * 0.1 + uPulse * 0.07;
        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
    depthWrite: true,
    side: THREE.DoubleSide,
  })
}

function createHeartbeatGlowTexture() {
  const textureCanvas = document.createElement("canvas")
  textureCanvas.width = 256
  textureCanvas.height = 256
  const context = textureCanvas.getContext("2d")
  const center = textureCanvas.width / 2
  const glow = context.createRadialGradient(center, center, 0, center, center, center)

  glow.addColorStop(0, "rgba(255, 255, 255, 0.98)")
  glow.addColorStop(0.18, "rgba(255, 220, 255, 0.78)")
  glow.addColorStop(0.42, "rgba(164, 226, 255, 0.36)")
  glow.addColorStop(0.72, "rgba(255, 246, 180, 0.15)")
  glow.addColorStop(1, "rgba(255, 255, 255, 0)")

  context.clearRect(0, 0, textureCanvas.width, textureCanvas.height)
  context.fillStyle = glow
  context.fillRect(0, 0, textureCanvas.width, textureCanvas.height)

  const texture = new THREE.CanvasTexture(textureCanvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true

  return texture
}

function createMnemonicHeartbeatGlow() {
  const group = new THREE.Group()
  const texture = createHeartbeatGlowTexture()
  const heartbeatGlows = []
  const glowConfigs = [
    { name: "MnemonicHeartbeatWideBloom", color: "#f7d4ff", scale: 0.9, opacity: 0.34 },
    { name: "MnemonicHeartbeatCoreBloom", color: "#d8f5ff", scale: 0.52, opacity: 0.58 },
  ]

  group.name = "MnemonicHeartbeatGlowGroup"

  glowConfigs.forEach(({ name, color, scale, opacity }, index) => {
    const material = new THREE.SpriteMaterial({
      map: texture,
      color,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
    })
    const glow = new THREE.Sprite(material)

    glow.name = name
    glow.position.set(0, 0, 0.02 + index * 0.015)
    glow.scale.setScalar(scale)
    glow.renderOrder = 38 + index
    glow.userData.baseScale = scale
    glow.userData.baseOpacity = opacity
    group.add(glow)
    heartbeatGlows.push(glow)
  })

  return { group, heartbeatGlows }
}

function createAuroraLightCore() {
  const group = new THREE.Group()
  const auroraMeshes = []
  const auroraLights = []

  const ribbonGeometry = new THREE.PlaneGeometry(0.74, 0.56, 24, 14)
  const ribbons = [
    { offset: 0.0, rotation: [0.12, -0.35, 0.18], scale: [0.92, 0.72, 1] },
    { offset: 1.6, rotation: [-0.34, 0.48, -0.24], scale: [0.82, 0.66, 1] },
    { offset: 3.1, rotation: [0.5, 0.12, 0.72], scale: [0.74, 0.58, 1] },
    { offset: 4.4, rotation: [-0.12, -0.62, 1.22], scale: [0.64, 0.48, 1] },
  ]

  ribbons.forEach(({ offset, rotation, scale }, index) => {
    const ribbon = new THREE.Mesh(ribbonGeometry, createAuroraRibbonMaterial(offset))
    ribbon.name = `MnemonicAuroraRibbon${index + 1}`
    ribbon.rotation.set(...rotation)
    ribbon.scale.set(...scale)
    ribbon.renderOrder = 32
    group.add(ribbon)
    auroraMeshes.push(ribbon)
  })

  const light = new THREE.PointLight("#f5ccff", 0.45, 1.2)
  light.name = "MnemonicAuroraPointLight"
  light.position.set(0, 0, 0)
  group.add(light)
  auroraLights.push(light)

  auroraMeshes.forEach((mesh) => {
    mesh.userData.baseRotation = mesh.rotation.clone()
    mesh.userData.baseScale = mesh.scale.clone()
  })

  return { group, auroraMeshes, auroraLights }
}

function applyMnemonicGlassMaterial(mesh) {
  mesh.material = createPaintedGlassMaterial()
  mesh.renderOrder = 34
}

function createWitchHoverHitArea() {
  const hitArea = new THREE.Mesh(
    new THREE.BoxGeometry(3.5, 3.55, 2.6),
    new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
    }),
  )

  hitArea.name = "WitchHoverHitArea"
  hitArea.position.set(0, 1.62, -0.08)

  return hitArea
}

function createShootingStarTailTexture() {
  const textureCanvas = document.createElement("canvas")
  textureCanvas.width = 64
  textureCanvas.height = 256
  const context = textureCanvas.getContext("2d")
  const centerX = textureCanvas.width / 2
  const gradient = context.createLinearGradient(0, textureCanvas.height, 0, 0)
  gradient.addColorStop(0, "rgba(255, 255, 255, 0.95)")
  gradient.addColorStop(0.18, "rgba(255, 220, 255, 0.58)")
  gradient.addColorStop(0.58, "rgba(160, 218, 255, 0.2)")
  gradient.addColorStop(1, "rgba(160, 218, 255, 0)")

  context.clearRect(0, 0, textureCanvas.width, textureCanvas.height)
  context.lineCap = "round"
  context.filter = "blur(5px)"
  context.strokeStyle = gradient
  context.lineWidth = 18
  context.beginPath()
  context.moveTo(centerX, textureCanvas.height - 8)
  context.lineTo(centerX, 12)
  context.stroke()

  context.filter = "blur(1.5px)"
  context.lineWidth = 5
  context.beginPath()
  context.moveTo(centerX, textureCanvas.height - 12)
  context.lineTo(centerX, 70)
  context.stroke()

  const texture = new THREE.CanvasTexture(textureCanvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true

  return texture
}

function createShootingStarHeadTexture() {
  const textureCanvas = document.createElement("canvas")
  textureCanvas.width = 96
  textureCanvas.height = 96
  const context = textureCanvas.getContext("2d")
  const center = textureCanvas.width / 2
  const glow = context.createRadialGradient(center, center, 0, center, center, center)

  glow.addColorStop(0, "rgba(255, 255, 255, 1)")
  glow.addColorStop(0.24, "rgba(255, 238, 186, 0.88)")
  glow.addColorStop(0.55, "rgba(235, 178, 255, 0.32)")
  glow.addColorStop(1, "rgba(155, 220, 255, 0)")

  context.fillStyle = glow
  context.fillRect(0, 0, textureCanvas.width, textureCanvas.height)
  context.strokeStyle = "rgba(255, 255, 255, 0.85)"
  context.lineCap = "round"
  context.lineWidth = 3
  context.beginPath()
  context.moveTo(center - 26, center)
  context.lineTo(center + 26, center)
  context.moveTo(center, center - 26)
  context.lineTo(center, center + 26)
  context.stroke()

  const texture = new THREE.CanvasTexture(textureCanvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true

  return texture
}

function createShootingStarField() {
  const group = new THREE.Group()
  group.name = "ShootingStarField"

  const tailTexture = createShootingStarTailTexture()
  const headTexture = createShootingStarHeadTexture()
  const shootingStars = []
  const meteorConfigs = [
    { start: [-2.15, 3.06, -0.92], end: [-1.06, 1.84, -0.86], phase: 0.04, speed: 0.17, size: 0.82 },
    { start: [2.06, 2.92, -0.96], end: [1.08, 1.58, -0.9], phase: 0.34, speed: 0.135, size: 0.68 },
    { start: [-1.24, 3.48, -1.08], end: [1.28, 2.54, -1.02], phase: 0.68, speed: 0.115, size: 0.58 },
    { start: [2.22, 2.52, -0.88], end: [1.36, 1.18, -0.84], phase: 0.18, speed: 0.19, size: 0.5 },
    { start: [-2.26, 2.42, -0.9], end: [-1.44, 1.2, -0.84], phase: 0.56, speed: 0.12, size: 0.46 },
  ]

  meteorConfigs.forEach((config, index) => {
    const start = new THREE.Vector3(...config.start)
    const end = new THREE.Vector3(...config.end)
    const travel = new THREE.Vector3().subVectors(end, start)
    const tailAngle = Math.atan2(travel.x, -travel.y)
    const meteor = new THREE.Group()
    const tailMaterial = new THREE.SpriteMaterial({
      map: tailTexture,
      color: "#fff4ff",
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      rotation: tailAngle,
    })
    const headMaterial = new THREE.SpriteMaterial({
      map: headTexture,
      color: "#fff8d6",
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const tail = new THREE.Sprite(tailMaterial)
    const head = new THREE.Sprite(headMaterial)

    tail.name = `ShootingStarTail${index + 1}`
    tail.center.set(0.5, 0.08)
    tail.scale.set(0.24 * config.size, 1.05 * config.size, 1)
    head.name = `ShootingStarHead${index + 1}`
    head.scale.setScalar(0.26 * config.size)
    meteor.name = `ShootingStar${index + 1}`
    meteor.visible = false
    meteor.add(tail)
    meteor.add(head)
    group.add(meteor)

    shootingStars.push({
      group: meteor,
      tail,
      head,
      tailMaterial,
      headMaterial,
      start,
      end,
      phase: config.phase,
      speed: config.speed,
      size: config.size,
      tailAngle,
    })
  })

  return { group, shootingStars }
}

function animateShootingStars(shootingStars, elapsed, hoverProgress) {
  shootingStars.forEach((meteor, index) => {
    const rawProgress = (elapsed * meteor.speed + meteor.phase) % 1
    const visibleProgress = rawProgress / 0.74

    if (visibleProgress >= 1) {
      meteor.group.visible = false
      meteor.tailMaterial.opacity = 0
      meteor.headMaterial.opacity = 0
      return
    }

    const easedProgress = 1 - (1 - visibleProgress) ** 2
    const fadeIn = THREE.MathUtils.smoothstep(visibleProgress, 0.02, 0.16)
    const fadeOut = 1 - THREE.MathUtils.smoothstep(visibleProgress, 0.64, 1)
    const flicker = 0.86 + Math.sin(elapsed * 9.2 + index * 1.7) * 0.08
    const opacity = fadeIn * fadeOut * flicker * (0.72 + hoverProgress * 0.18)
    const stretch = 0.95 + Math.sin(elapsed * 2.8 + index) * 0.08

    meteor.group.visible = opacity > 0.02
    meteor.group.position.lerpVectors(meteor.start, meteor.end, easedProgress)
    meteor.tailMaterial.opacity = opacity * 0.78
    meteor.headMaterial.opacity = opacity
    meteor.tailMaterial.rotation = meteor.tailAngle
    meteor.tail.scale.set(0.24 * meteor.size, 1.05 * meteor.size * stretch, 1)
    meteor.head.scale.setScalar((0.22 + opacity * 0.05) * meteor.size)
  })
}

function prepareWitchAnimationParts(model) {
  const parts = {
    auroraMeshes: [],
    auroraLights: [],
    glassCube: null,
    hatPieces: [],
    stars: [],
    shootingStars: [],
    glowMeshes: [],
    touchArmPieces: [],
    touchHands: [],
    deskPieces: [],
    heartbeatGlows: [],
  }

  model.traverse((child) => {
    if (!child.isMesh) return

    child.castShadow = false
    child.receiveShadow = false
    child.renderOrder = 30
    child.userData.basePosition = child.position.clone()
    child.userData.baseRotation = child.rotation.clone()
    child.userData.baseScale = child.scale.clone()

    if (mnemonicHiddenMeshNames.has(child.name)) {
      child.visible = false
      return
    }

    if (child.material) {
      child.material = Array.isArray(child.material)
        ? child.material.map((material) => material.clone())
        : child.material.clone()
    }

    applyWitchSkinTone(child)

    if (child.name === mnemonicGlassMeshName) {
      applyMnemonicGlassMaterial(child)
      parts.glassCube = child
    }

    if (child.name.startsWith("DESK_")) {
      parts.deskPieces.push(child)
    }

    if (child.name.startsWith("CHAR_hat_")) {
      parts.hatPieces.push(child)
    }

    if (witchTouchArmMeshNames.has(child.name)) {
      parts.touchArmPieces.push(child)
    }

    if (witchHandMeshNames.has(child.name)) {
      parts.touchHands.push(child)
    }

    if (child.name.startsWith("STAR_")) {
      parts.stars.push(child)
      getMeshMaterials(child).forEach((material) => {
        material.transparent = true
        material.opacity = 0.72
        material.depthWrite = false
        material.emissive?.set("#fff9ec")
        material.emissiveIntensity = 0.3
        material.userData.baseOpacity = material.opacity
        material.userData.baseEmissiveIntensity = material.emissiveIntensity
      })
    }

    if (witchGlowMeshNames.has(child.name)) {
      parts.glowMeshes.push(child)
      getMeshMaterials(child).forEach((material) => {
        material.transparent = child.name.includes("outer_translucent")
        material.opacity = child.name.includes("outer_translucent") ? 0.78 : material.opacity
        material.emissive?.set("#fff1a8")
        material.emissiveIntensity = 0.34
        material.userData.baseEmissiveIntensity = material.emissiveIntensity
      })
    }
  })

  if (parts.glassCube) {
    const aurora = createAuroraLightCore()
    const heartbeatGlow = createMnemonicHeartbeatGlow()
    parts.glassCube.add(aurora.group)
    parts.glassCube.add(heartbeatGlow.group)
    parts.auroraMeshes.push(...aurora.auroraMeshes)
    parts.auroraLights.push(...aurora.auroraLights)
    parts.heartbeatGlows.push(...heartbeatGlow.heartbeatGlows)
  }

  return parts
}

function addWitchToPurplePlatform(parent) {
  loader.load("/models/mnemonic_witch_asset.glb", (gltf) => {
    const model = gltf.scene
    model.name = "MnemonicWitchAsset"
    model.updateMatrixWorld(true)

    const box = new THREE.Box3().setFromObject(model)
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(center)

    const scale = witchPlatformHeight / Math.max(size.x, size.y, size.z)
    model.scale.setScalar(scale)
    model.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale)
    model.userData.basePosition = model.position.clone()
    model.userData.baseRotation = model.rotation.clone()

    addWitchHairCoverage(model)
    addWitchFaceDetails(model)
    const animationParts = prepareWitchAnimationParts(model)

    const wrapper = new THREE.Group()
    const shadow = createWitchShadow()
    const hoverHitArea = createWitchHoverHitArea()
    const shootingStarField = createShootingStarField()
    wrapper.name = "PurpleWitchAssetAnchor"
    wrapper.position.copy(witchPlatformPosition)
    wrapper.rotation.y = witchPlatformRotation
    wrapper.add(shadow)
    wrapper.add(shootingStarField.group)
    wrapper.add(hoverHitArea)
    wrapper.add(model)
    parent.add(wrapper)

    witchAnimation = {
      wrapper,
      model,
      shadow,
      hoverTargets: [hoverHitArea],
      hoverProgress: 0,
      baseWrapperRotationY: witchPlatformRotation,
      ...animationParts,
      shootingStars: shootingStarField.shootingStars,
    }
  })
}

function animateWitch(elapsed) {
  if (!witchAnimation) return

  const {
    wrapper,
    model,
    shadow,
    baseWrapperRotationY,
    auroraMeshes,
    auroraLights,
    glassCube,
    stars,
    shootingStars,
    glowMeshes,
    touchArmPieces,
    touchHands,
    deskPieces,
    heartbeatGlows,
  } = witchAnimation
  const modelBasePosition = model.userData.basePosition
  const modelBaseRotation = model.userData.baseRotation

  witchAnimation.hoverProgress = THREE.MathUtils.lerp(
    witchAnimation.hoverProgress,
    isWitchHovered ? 1 : 0,
    0.16,
  )
  const hoverProgress = witchAnimation.hoverProgress

  model.position.copy(modelBasePosition)
  model.rotation.copy(modelBaseRotation)
  wrapper.rotation.y = baseWrapperRotationY
  shadow.scale.set(1.35, 0.78, 1)

  const squeeze = ((1 - Math.cos(elapsed * 3.8)) * 0.5) * hoverProgress
  const beatCycle = (elapsed * 1.18) % 1
  const beatOne = Math.exp(-(((beatCycle - 0.1) / 0.055) ** 2))
  const beatTwo = Math.exp(-(((beatCycle - 0.28) / 0.075) ** 2)) * 0.62
  const heartbeatPulse = THREE.MathUtils.clamp((beatOne + beatTwo) * hoverProgress, 0, 1)
  const tableRattle = hoverProgress * (
    Math.sin(elapsed * 17.5) * 0.012
    + Math.sin(elapsed * 29.0) * 0.004
  )
  const tableRock = hoverProgress * Math.sin(elapsed * 15.5) * 0.005

  touchArmPieces.forEach((piece, index) => {
    const basePosition = piece.userData.basePosition
    const baseRotation = piece.userData.baseRotation
    const phase = elapsed * 7.4 + index * 0.58
    const side = piece.name.includes("_left_") ? -1 : 1
    const inward = side === -1 ? 1 : -1
    const lift = Math.sin(phase * 0.72)

    piece.position.x = basePosition.x + inward * (0.045 + squeeze * 0.026)
    piece.position.y = basePosition.y + (
      0.01 + lift * 0.018
    ) * hoverProgress
    piece.position.z = basePosition.z + Math.sin(phase * 0.92) * 0.006 * hoverProgress
    piece.rotation.copy(baseRotation)
  })

  touchHands.forEach((hand, index) => {
    const basePosition = hand.userData.basePosition
    const baseRotation = hand.userData.baseRotation
    const phase = elapsed * 9.8 + index * 1.35
    const side = hand.name.includes("_left_") ? -1 : 1
    const inward = side === -1 ? 1 : -1
    const lift = Math.sin(phase * 0.68)

    hand.position.x = basePosition.x + inward * (0.085 + squeeze * 0.045)
    hand.position.y = basePosition.y + (
      0.012 + lift * 0.026
    ) * hoverProgress
    hand.position.z = basePosition.z + Math.sin(phase * 0.82) * 0.01 * hoverProgress
    hand.rotation.copy(baseRotation)
  })

  deskPieces.forEach((piece, index) => {
    const basePosition = piece.userData.basePosition
    const baseRotation = piece.userData.baseRotation
    const pieceOffset = Math.sin(elapsed * 21 + index * 0.17) * 0.0015 * hoverProgress

    piece.position.copy(basePosition)
    piece.rotation.copy(baseRotation)
    piece.position.x += tableRattle + pieceOffset
    piece.position.z += Math.sin(elapsed * 12.5 + index * 0.11) * 0.002 * hoverProgress
    piece.rotation.z += tableRock
  })

  auroraMeshes.forEach((mesh, index) => {
    const phase = elapsed * 0.78 + index * 1.15
    mesh.material.uniforms.uTime.value = elapsed
    mesh.material.uniforms.uPulse.value = heartbeatPulse
    mesh.rotation.x = mesh.userData.baseRotation.x + Math.sin(phase) * 0.22
    mesh.rotation.y = mesh.userData.baseRotation.y + Math.cos(phase * 0.84) * 0.26
    mesh.rotation.z = mesh.userData.baseRotation.z + Math.sin(phase * 0.62) * 0.18
    mesh.scale.copy(mesh.userData.baseScale).multiplyScalar(
      0.94 + Math.sin(phase * 1.3) * 0.08 + heartbeatPulse * 0.2,
    )
  })

  if (glassCube?.material?.uniforms?.uTime) {
    glassCube.material.uniforms.uTime.value = elapsed
    glassCube.material.uniforms.uPulse.value = heartbeatPulse
  }

  auroraLights.forEach((light, index) => {
    const glow = (Math.sin(elapsed * 1.25 + index * 0.82) + 1) * 0.5
    light.intensity = 0.36 + glow * 0.24 + heartbeatPulse * 0.72
    light.color.setHSL(0.74 + Math.sin(elapsed * 0.42 + index) * 0.07, 0.72, 0.74)
  })

  heartbeatGlows.forEach((glow, index) => {
    const baseOpacity = glow.userData.baseOpacity ?? 0.4
    const baseScale = glow.userData.baseScale ?? 0.7
    const softIdle = hoverProgress * 0.16
    const pulseOpacity = heartbeatPulse * (index === 0 ? 0.58 : 0.76)

    glow.material.opacity = (softIdle + pulseOpacity) * baseOpacity
    glow.scale.setScalar(baseScale * (1 + heartbeatPulse * (index === 0 ? 0.32 : 0.18)))
  })

  animateShootingStars(shootingStars, elapsed, hoverProgress)

  stars.forEach((star, index) => {
    const phase = elapsed * 2.6 + index * 0.82
    const twinkle = (Math.sin(phase) + 1) * 0.5
    const scale = 0.92 + twinkle * 0.16

    star.scale.copy(star.userData.baseScale).multiplyScalar(scale)
    star.rotation.copy(star.userData.baseRotation)

    getMeshMaterials(star).forEach((material) => {
      material.opacity = THREE.MathUtils.lerp(
        material.userData.baseOpacity ?? 0.72,
        0.96,
        twinkle,
      )
      material.emissiveIntensity = (material.userData.baseEmissiveIntensity ?? 0.3)
        + twinkle * 0.35
    })
  })

  glowMeshes.forEach((mesh, index) => {
    const pulse = Math.max(Math.sin(elapsed * 6.4 + index * 0.7), 0) * hoverProgress
    getMeshMaterials(mesh).forEach((material) => {
      material.emissiveIntensity = (material.userData.baseEmissiveIntensity ?? 0.34) + pulse * 0.28
      if (material.transparent) {
        material.opacity = THREE.MathUtils.clamp(0.72 + pulse * 0.16, 0.72, 0.9)
      }
    })
  })
}

function applyModelPalette(mesh) {
  const material = mesh.material?.clone()
  if (!material) return

  const style = assetMeshStyles[mesh.name] ?? assetMaterialStyles[material.name]

  if (style) {
    material.color.set(style.color)
    if (material.emissive) {
      material.emissive.set(style.emissive ?? style.color)
      material.emissiveIntensity = style.emissiveIntensity ?? 0.12
    }
  }

  material.roughness = 0.92
  material.metalness = 0.0
  mesh.material = material
}

canvas.addEventListener("pointerdown", onPointerDown)
canvas.addEventListener("wheel", onWheel, { passive: false })
canvas.addEventListener("pointerleave", clearWitchHover)
window.addEventListener("pointermove", onPointerMove)
window.addEventListener("pointerup", endDrag)
window.addEventListener("pointerleave", endDrag)
window.addEventListener("resize", resize)

platformButtons.forEach((button) => {
  button.addEventListener("click", onPlatformButtonClick)
})

selectContent(initialContentKey, true)
resize()

const clock = new THREE.Clock()

function tick() {
  const elapsed = clock.getElapsedTime()
  const now = performance.now()
  const isWitchRotationPaused = isWitchHovered || (witchAnimation?.hoverProgress ?? 0) > 0.02
  const timeSinceInteraction = now - lastInteractionAt

  if (isWitchRotationPaused) {
    targetRotation = currentRotation
    lastInteractionAt = now
  } else if (!isDragging && timeSinceInteraction > 1800) {
    targetRotation += 0.00115
  }

  currentRotation += (targetRotation - currentRotation) * 0.14
  currentZoom += (targetZoom - currentZoom) * 0.18

  modelRoot.rotation.y = currentRotation
  modelRoot.rotation.x = 0
  modelRoot.rotation.z = 0
  modelRoot.position.y = modelRootVerticalOffset

  camera.position.y = cameraHeight
  camera.position.z = currentZoom
  camera.lookAt(0, 0.05, 0)

  if (pointerInCanvas && !isDragging) {
    updateWitchHoverFromPointer()
  }
  animateWitch(elapsed)

  renderer.render(scene, camera)
  window.requestAnimationFrame(tick)
}

tick()
