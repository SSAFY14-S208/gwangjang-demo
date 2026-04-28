import "./style.css"
import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"

const canvas = document.querySelector("#scene")
const stage = canvas.parentElement
const platformButtons = Array.from(document.querySelectorAll(".platform-button"))

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

const witchPlatformPosition = new THREE.Vector3(-5.75, 0.68, -0.15)
const witchPlatformRotation = -Math.PI / 2
const witchPlatformHeight = 3.25
const witchGlowMeshNames = new Set([
  "MNEMONIC_inner_warm_glow_core",
  "MNEMONIC_starburst_glow_center",
  "MNEMONIC_outer_translucent_rounded_cube",
])

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

const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100)
let targetZoom = 17.4
let currentZoom = targetZoom
camera.position.set(0, cameraHeight, currentZoom)

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
pedestal.position.set(0, -3.2, 0)
scene.add(pedestal)

const modelRoot = new THREE.Group()
scene.add(modelRoot)

let asset = null
let targetRotation = 0.51
let currentRotation = targetRotation
let isDragging = false
let lastPointerX = 0
let lastInteractionAt = 0
let witchAnimation = null

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

function setActiveButton(platform) {
  platformButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.platform === platform)
  })
}

function markInteraction() {
  lastInteractionAt = performance.now()
}

function onPointerDown(event) {
  isDragging = true
  lastPointerX = event.clientX
  markInteraction()
  canvas.classList.add("is-dragging")
}

function onPointerMove(event) {
  if (!isDragging) return

  const deltaX = event.clientX - lastPointerX
  lastPointerX = event.clientX
  targetRotation += deltaX * 0.008
  markInteraction()
}

function endDrag() {
  isDragging = false
  canvas.classList.remove("is-dragging")
}

function onWheel(event) {
  event.preventDefault()
  targetZoom = THREE.MathUtils.clamp(targetZoom + event.deltaY * 0.008, minZoom, maxZoom)
  markInteraction()
}

function onPlatformButtonClick(event) {
  const button = event.currentTarget
  const nextAngle = Number(button.dataset.angle)
  const shortestDelta = normalizeAngle(nextAngle - currentRotation)

  // Rotate smoothly from the current pose to the requested platform view.
  targetRotation = currentRotation + shortestDelta
  markInteraction()
  setActiveButton(button.dataset.platform)
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

function prepareWitchAnimationParts(model) {
  const parts = {
    hatPieces: [],
    stars: [],
    glowMeshes: [],
  }

  model.traverse((child) => {
    if (!child.isMesh) return

    child.castShadow = false
    child.receiveShadow = false
    child.renderOrder = 30
    child.userData.baseRotation = child.rotation.clone()
    child.userData.baseScale = child.scale.clone()

    if (child.material) {
      child.material = Array.isArray(child.material)
        ? child.material.map((material) => material.clone())
        : child.material.clone()
    }

    if (child.name.startsWith("CHAR_hat_")) {
      parts.hatPieces.push(child)
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

    const animationParts = prepareWitchAnimationParts(model)

    const wrapper = new THREE.Group()
    const shadow = createWitchShadow()
    wrapper.name = "PurpleWitchAssetAnchor"
    wrapper.position.copy(witchPlatformPosition)
    wrapper.rotation.y = witchPlatformRotation
    wrapper.add(shadow)
    wrapper.add(model)
    parent.add(wrapper)

    witchAnimation = {
      wrapper,
      model,
      shadow,
      baseWrapperRotationY: witchPlatformRotation,
      ...animationParts,
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
    hatPieces,
    stars,
    glowMeshes,
  } = witchAnimation
  const modelBasePosition = model.userData.basePosition
  const modelBaseRotation = model.userData.baseRotation

  model.position.y = modelBasePosition.y + Math.sin(elapsed * 1.7) * 0.075
  model.rotation.x = modelBaseRotation.x + Math.sin(elapsed * 1.35 + 0.8) * 0.012
  model.rotation.z = modelBaseRotation.z + Math.sin(elapsed * 1.12) * 0.018
  wrapper.rotation.y = baseWrapperRotationY + Math.sin(elapsed * 0.9) * 0.026

  shadow.scale.set(
    1.35 + Math.sin(elapsed * 1.7) * 0.035,
    0.78 + Math.sin(elapsed * 1.7) * 0.018,
    1,
  )

  hatPieces.forEach((piece, index) => {
    const baseRotation = piece.userData.baseRotation
    piece.rotation.x = baseRotation.x + Math.sin(elapsed * 1.9 + index * 0.32) * 0.018
    piece.rotation.z = baseRotation.z + Math.sin(elapsed * 1.55 + index * 0.4) * 0.014
  })

  stars.forEach((star, index) => {
    const phase = elapsed * 2.7 + index * 0.9
    const twinkle = 1 + Math.sin(phase) * 0.12
    star.scale.copy(star.userData.baseScale).multiplyScalar(twinkle)
    star.rotation.z = star.userData.baseRotation.z + Math.sin(phase * 0.8) * 0.2

    getMeshMaterials(star).forEach((material) => {
      material.opacity = THREE.MathUtils.clamp(0.65 + Math.sin(phase) * 0.2, 0.4, 0.9)
      material.emissiveIntensity = (material.userData.baseEmissiveIntensity ?? 0.3)
        + Math.max(Math.sin(phase), 0) * 0.22
    })
  })

  glowMeshes.forEach((mesh, index) => {
    const pulse = Math.max(Math.sin(elapsed * 2.2 + index * 0.7), 0)
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
window.addEventListener("pointermove", onPointerMove)
window.addEventListener("pointerup", endDrag)
window.addEventListener("pointerleave", endDrag)
window.addEventListener("resize", resize)

platformButtons.forEach((button) => {
  button.addEventListener("click", onPlatformButtonClick)
})

resize()

const clock = new THREE.Clock()

function tick() {
  const elapsed = clock.getElapsedTime()
  const timeSinceInteraction = performance.now() - lastInteractionAt

  if (!isDragging && timeSinceInteraction > 1800) {
    targetRotation += 0.00115
  }

  currentRotation += (targetRotation - currentRotation) * 0.14
  currentZoom += (targetZoom - currentZoom) * 0.18

  modelRoot.rotation.y = currentRotation
  modelRoot.rotation.x = 0
  modelRoot.rotation.z = 0
  modelRoot.position.y = 0
  animateWitch(elapsed)

  camera.position.y = cameraHeight
  camera.position.z = currentZoom
  camera.lookAt(0, 0.05, 0)

  renderer.render(scene, camera)
  window.requestAnimationFrame(tick)
}

tick()
