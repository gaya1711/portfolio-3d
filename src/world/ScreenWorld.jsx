import { useMemo, useRef, useLayoutEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { B, Cyl, S, T, Rod, COL, glow, dummy, rng } from './common'
import { roadCurve, roadFrame, PL, F } from '../layout'
import { Wanderer } from './Avatar'
import Acies from './Acies'
import Doutya from './Doutya'
import Iit from './Iit'
import Folder from './Folder'

function stripGeo(pts, off, width, y) {
  const pos = [], idx = []
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)]
    const tx = b.x - a.x, tz = b.z - a.z, l = Math.hypot(tx, tz) || 1
    const nx = -tz / l, nz = tx / l
    const cx = pts[i].x + nx * off, cz = pts[i].z + nz * off
    pos.push(cx + (nx * width) / 2, y, cz + (nz * width) / 2, cx - (nx * width) / 2, y, cz - (nz * width) / 2)
    if (i < pts.length - 1) { const k = i * 2; idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3) }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

function Road() {
  const pts = useMemo(() => roadCurve.getSpacedPoints(320), [])
  const geos = useMemo(() => ({
    road: stripGeo(pts, 0, 6.4, 0.03),
    l: stripGeo(pts, 3.05, 0.22, 0.05),
    r: stripGeo(pts, -3.05, 0.22, 0.05),
    plaza: null,
  }), [pts])
  const dashes = useRef()
  const N = 70
  useLayoutEffect(() => {
    for (let k = 0; k < N; k++) {
      const u = (k + 0.5) / N
      const { p, t } = roadFrame(u)
      dummy.position.set(p.x, 0.06, p.z)
      dummy.rotation.set(0, Math.atan2(t.x, t.z), 0)
      dummy.updateMatrix()
      dashes.current.setMatrixAt(k, dummy.matrix)
    }
    dashes.current.instanceMatrix.needsUpdate = true
  }, [])
  return (
    <group>
      <mesh geometry={geos.road}><meshStandardMaterial color="#17123a" roughness={0.85} metalness={0.2} /></mesh>
      <mesh geometry={geos.l}><meshBasicMaterial color={glow(COL.violet, 2.2)} toneMapped={false} /></mesh>
      <mesh geometry={geos.r}><meshBasicMaterial color={glow(COL.coral, 2.2)} toneMapped={false} /></mesh>
      <instancedMesh ref={dashes} args={[null, null, N]}>
        <boxGeometry args={[0.24, 0.02, 1.7]} />
        <meshBasicMaterial color={glow(COL.amber, 1.8)} toneMapped={false} />
      </instancedMesh>
    </group>
  )
}

function Ground() {
  const tex = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 256
    const g = c.getContext('2d')
    g.fillStyle = '#0b0820'; g.fillRect(0, 0, 256, 256)
    g.strokeStyle = 'rgba(139,92,246,0.55)'; g.lineWidth = 2
    g.strokeRect(0, 0, 256, 256)
    const t = new THREE.CanvasTexture(c)
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(70, 70)
    t.anisotropy = 8
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [])
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, -120]}>
      <planeGeometry args={[560, 560]} />
      <meshStandardMaterial map={tex} roughness={0.9} metalness={0.1} />
    </mesh>
  )
}

function Mountains() {
  const items = useMemo(() => {
    const r = rng(77)
    const out = []
    for (let i = 0; i < 26; i++) {
      const side = i % 2 ? 1 : -1
      out.push({ x: side * (80 + r() * 90), z: 10 - r() * 290, rad: 10 + r() * 16, h: 10 + r() * 26 })
    }
    return out
  }, [])
  return items.map((m, i) => (
    <group key={i} position={[m.x, m.h / 2 - 0.2, m.z]}>
      <mesh>
        <coneGeometry args={[m.rad, m.h, 5]} />
        <meshStandardMaterial color="#1a1040" flatShading roughness={1} />
      </mesh>
      <lineSegments>
        <edgesGeometry args={[new THREE.ConeGeometry(m.rad, m.h, 5)]} />
        <lineBasicMaterial color={glow(COL.violet, 0.9)} toneMapped={false} />
      </lineSegments>
    </group>
  ))
}

/* a glowing binary tree. because of course it is */
function BinaryTree({ position, scale = 1, color = COL.mint, seed = 1 }) {
  const { nodes, edges } = useMemo(() => {
    const r = rng(seed)
    const nodes = [], edges = []
    const grow = (x, y, d, spread, parent) => {
      const idx = nodes.length
      nodes.push([x, y, 0])
      if (parent !== null) edges.push([nodes[parent], [x, y, 0]])
      if (d < 3) {
        grow(x - spread * (0.8 + r() * 0.4), y + 1.5, d + 1, spread * 0.5, idx)
        grow(x + spread * (0.8 + r() * 0.4), y + 1.5, d + 1, spread * 0.5, idx)
      }
    }
    grow(0, 1.2, 0, 1.6, null)
    edges.unshift([[0, 0, 0], [0, 1.2, 0]])
    return { nodes, edges }
  }, [seed])
  return (
    <group position={position} scale={scale}>
      {edges.map((e, i) => <Rod key={i} a={e[0]} b={e[1]} r={0.05} color={color} k={1.2} />)}
      {nodes.map((n, i) => (
        <mesh key={i} position={n}>
          <sphereGeometry args={[i === 0 ? 0.28 : 0.2, 10, 10]} />
          <meshBasicMaterial color={glow(i % 3 === 0 ? COL.sky : color, 1.8)} toneMapped={false} />
        </mesh>
      ))}
    </group>
  )
}

function Lamps() {
  const items = useMemo(() => {
    const out = []
    for (let k = 0; k < 18; k++) {
      const u = 0.03 + k * 0.054
      const { p, n } = roadFrame(Math.min(u, 0.99))
      const side = k % 2 ? 1 : -1
      out.push(p.clone().addScaledVector(n, side * 4.4))
    }
    return out
  }, [])
  return items.map((p, i) => (
    <group key={i} position={[p.x, 0, p.z]}>
      <Cyl r={0.07} h={3.2} c="#2d2a52" position={[0, 1.6, 0]} seg={6} />
      <S r={0.26} c="#ffb86b" ei={2.5} position={[0, 3.3, 0]} seg={10} />
      <mesh position={[0, 3.3, 0]}><sphereGeometry args={[0.55, 10, 10]} /><meshBasicMaterial color="#ffb86b" transparent opacity={0.1} depthWrite={false} /></mesh>
    </group>
  ))
}

function Sign({ u, side = 1, off = 5.5, lines, color = COL.mint, rotOffset = 0 }) {
  const { p, n, t } = roadFrame(u)
  const pos = p.clone().addScaledVector(n, side * off)
  const rotY = Math.atan2(-t.x, -t.z) // face back toward the camera
  return (
    <group position={[pos.x, 0, pos.z]} rotation={[0, rotY + rotOffset, 0]}>
      <Cyl r={0.08} h={3.4} c="#2d2a52" position={[-1.1, 1.7, 0]} seg={6} />
      <Cyl r={0.08} h={3.4} c="#2d2a52" position={[1.1, 1.7, 0]} seg={6} />
      <B s={[3.2, 1.3, 0.12]} c="#0d0b26" position={[0, 3.2, 0]} ei={0} />
      <lineSegments position={[0, 3.2, 0.07]}>
        <edgesGeometry args={[new THREE.BoxGeometry(3.2, 1.3, 0.02)]} />
        <lineBasicMaterial color={glow(color, 1.8)} toneMapped={false} />
      </lineSegments>
      <T size={0.34} color={color} k={1.6} position={[0, 3.42, 0.1]}>{lines[0]}</T>
      <T size={0.22} color="#c9c2ff" position={[0, 2.95, 0.1]}>{lines[1]}</T>
    </group>
  )
}

/* the 0s and 1s drifting up like fireflies */
function Bits({ n = 320 }) {
  const ref = useRef()
  const data = useMemo(() => {
    const r = rng(9)
    const arr = new Float32Array(n * 3)
    const spd = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      const { p, n: nn } = roadFrame(r())
      const off = (r() * 2 - 1) * 30
      arr[i * 3] = p.x + nn.x * off
      arr[i * 3 + 1] = r() * 18
      arr[i * 3 + 2] = p.z + nn.z * off
      spd[i] = 0.5 + r() * 1.3
    }
    return { arr, spd }
  }, [n])
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(data.arr, 3))
    return g
  }, [data])
  useFrame((_, dt) => {
    const a = geo.attributes.position
    for (let i = 0; i < n; i++) {
      let y = a.getY(i) + data.spd[i] * dt
      if (y > 18) y = 0
      a.setY(i, y)
    }
    a.needsUpdate = true
  })
  return (
    <points ref={ref} geometry={geo} frustumCulled={false}>
      <pointsMaterial size={3} sizeAttenuation={false} color={glow(COL.mint, 1.5)} transparent opacity={0.7} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
    </points>
  )
}

/* the glowing frame you pass through when you enter the screen */
function Gate() {
  return (
    <group position={[0, 0, 9]}>
      <B s={[14, 0.6, 0.6]} c="#8b5cf6" ei={2} ec="#8b5cf6" position={[0, 9, 0]} />
      <B s={[0.6, 9, 0.6]} c="#8b5cf6" ei={2} ec="#8b5cf6" position={[-7, 4.5, 0]} />
      <B s={[0.6, 9, 0.6]} c="#8b5cf6" ei={2} ec="#8b5cf6" position={[7, 4.5, 0]} />
      <T size={0.7} color={COL.mint} k={1.6} position={[0, 10.2, 0]}>screen://experience</T>
    </group>
  )
}

export default function ScreenWorld() {
  const uA = PL.acies.u, uD = PL.doutya.u, uI = PL.iit.u
  return (
    <group>
      <directionalLight position={[-30, 50, 20]} intensity={0.55} color="#9fb4ff" />
      <hemisphereLight args={['#6c5ce7', '#120a2e', 0.55]} />
      <Ground />
      <Mountains />
      <Road />
      <Lamps />
      <Gate />
      <Bits />

      {/* trees avoiding the buildings */}
      {[
        [0.07, 8.5], [0.13, -9], [0.2, 9], [0.35, 9], [0.4, -8.5], [0.56, -9.5], [0.6, 9], [0.93, -9],
      ].map(([u, off], i) => {
        const { p, n } = roadFrame(u)
        const q = p.clone().addScaledVector(n, off)
        return <BinaryTree key={i} position={[q.x, 0, q.z]} scale={1.3 + (i % 3) * 0.25} seed={i + 3} color={i % 2 ? COL.mint : COL.sky} />
      })}

      {/* git-log road signs: we are driving backwards through time */}
      <Sign u={0.08} side={1} lines={['HEAD', 'jan 2026']} color={COL.mint} />
      <Sign u={(uA + uD) / 2} side={-1} lines={['HEAD~1', 'jul 2024']} color={COL.amber} />
      <Sign u={(uD + uI) / 2} side={1} lines={['HEAD~2', 'aug 2023']} color={COL.sky} />
      <Sign u={0.96} side={-1} lines={['cd projects/', '3 files']} color={COL.coral} />

      <group position={PL.acies.pos} rotation={[0, PL.acies.rotY, 0]}><Acies /></group>
      <group position={PL.doutya.pos} rotation={[0, PL.doutya.rotY, 0]}><Doutya /></group>
      <group position={PL.iit.pos} rotation={[0, PL.iit.rotY, 0]}><Iit /></group>
      <group position={F}><Folder /></group>

      <Wanderer />
    </group>
  )
}
