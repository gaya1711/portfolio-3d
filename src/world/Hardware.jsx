import { useRef, useMemo, useLayoutEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import * as THREE from 'three'
import { B, Cyl, S, T, Bob, Edges, COL, glow, dummy, rng, ease } from './common'
import { scroll } from '../scroll'

const TEAL = '#3dffc8'

/* ---------- motherboard traces (the "foundation layer") ---------- */
const DX = [1, 1, 0, -1, -1, -1, 0, 1], DZ = [0, 1, 1, 1, 0, -1, -1, -1]
const clear = (x, z) => [[0, 0, 12], [24, -1, 10], [-7, 8, 6], [7, 8, 6], [0, 10, 6]].some(([cx, cz, r]) => Math.hypot(cx - x, cz - z) < r)
function makeTraces() {
  const r = rng(3), out = []
  let guard = 0
  while (out.length < 110 && guard++ < 4000) {
    let x = Math.round((r() * 2 - 1) * 60), z = Math.round((r() * 2 - 1) * 40), d = Math.floor(r() * 8)
    const pts = [[x, z]]
    const n = 2 + Math.floor(r() * 4)
    for (let s = 0; s < n; s++) { const len = 3 + Math.floor(r() * 10); x += DX[d] * len; z += DZ[d] * len; pts.push([x, z]); d = (d + (r() < 0.5 ? 1 : 7)) % 8 }
    let ok = true
    for (let i = 0; i < pts.length - 1 && ok; i++) for (let k = 0; k <= 8; k++) {
      const f = k / 8, px = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f, pz = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f
      if (Math.abs(px) > 64 || Math.abs(pz) > 44 || clear(px, pz)) { ok = false; break }
    }
    if (!ok) continue
    const cum = [0]
    for (let i = 0; i < pts.length - 1; i++) cum.push(cum[i] + Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]))
    out.push({ pts, w: 0.12 + r() * 0.1, cum, total: cum[cum.length - 1] })
  }
  return out
}
const TR = makeTraces()

function Board() {
  const geo = useMemo(() => {
    const pos = []
    for (const { pts, w } of TR) for (let i = 0; i < pts.length - 1; i++) {
      let [x0, z0] = pts[i], [x1, z1] = pts[i + 1]
      const dx = x1 - x0, dz = z1 - z0, L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L
      x0 -= (ux * w) / 2; z0 -= (uz * w) / 2; x1 += (ux * w) / 2; z1 += (uz * w) / 2
      const nx = (-uz * w) / 2, nz = (ux * w) / 2
      const a = [x0 + nx, z0 + nz], b = [x0 - nx, z0 - nz], c = [x1 - nx, z1 - nz], d = [x1 + nx, z1 + nz]
      for (const p of [a, b, c, a, c, d]) pos.push(p[0], 0.03, p[1])
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    return g
  }, [])
  const tex = useMemo(() => {
    const c = document.createElement('canvas'); c.width = c.height = 256
    const g = c.getContext('2d')
    g.fillStyle = '#04201c'; g.fillRect(0, 0, 256, 256)
    g.strokeStyle = 'rgba(61,255,200,0.08)'
    for (let i = 0; i <= 256; i += 32) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 256); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(256, i); g.stroke() }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(20, 14); t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [])
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[160, 112]} /><meshStandardMaterial map={tex} roughness={0.9} metalness={0.2} /></mesh>
      <mesh geometry={geo}><meshBasicMaterial color={glow(TEAL, 0.9)} toneMapped={false} side={THREE.DoubleSide} /></mesh>
    </group>
  )
}

function Pulses({ n = 120 }) {
  const ref = useRef()
  const st = useMemo(() => Array.from({ length: n }, () => ({ tr: Math.floor(Math.random() * TR.length), d: Math.random() * 20, v: 4 + Math.random() * 9 })), [n])
  useLayoutEffect(() => { st.forEach((_, i) => ref.current.setColorAt(i, glow([TEAL, COL.sky, COL.amber][i % 3], 2.6))); ref.current.instanceColor.needsUpdate = true }, [st])
  useFrame((_, dt) => {
    st.forEach((p, i) => {
      p.d += p.v * Math.min(dt, 0.05)
      let T0 = TR[p.tr]
      if (p.d > T0.total) { p.d = 0; p.tr = Math.floor(Math.random() * TR.length); T0 = TR[p.tr] }
      let k = 0
      while (k < T0.cum.length - 2 && p.d > T0.cum[k + 1]) k++
      const f = (p.d - T0.cum[k]) / (T0.cum[k + 1] - T0.cum[k])
      const a = T0.pts[k], b = T0.pts[k + 1]
      dummy.position.set(a[0] + (b[0] - a[0]) * f, 0.14, a[1] + (b[1] - a[1]) * f)
      dummy.scale.setScalar(1); dummy.updateMatrix()
      ref.current.setMatrixAt(i, dummy.matrix)
    })
    ref.current.instanceMatrix.needsUpdate = true
  })
  return <instancedMesh ref={ref} args={[null, null, n]} frustumCulled={false}><sphereGeometry args={[0.17, 8, 8]} /><meshBasicMaterial toneMapped={false} /></instancedMesh>
}

function Pins({ w, d, n = 10, color = '#d8d2c4' }) {
  const ref = useRef()
  useLayoutEffect(() => {
    let i = 0
    for (let k = 0; k < n; k++) {
      const t = (k + 0.5) / n, x = -w / 2 + t * w, z = -d / 2 + t * d
      ;[[x, -d / 2, 0.22, 0.7], [x, d / 2, 0.22, 0.7], [-w / 2, z, 0.7, 0.22], [w / 2, z, 0.7, 0.22]].forEach(([px, pz, sx, sz]) => {
        dummy.position.set(px, 0.16, pz); dummy.scale.set(sx, 0.1, sz); dummy.rotation.set(0, 0, 0); dummy.updateMatrix(); ref.current.setMatrixAt(i++, dummy.matrix)
      })
    }
    ref.current.instanceMatrix.needsUpdate = true
  }, [w, d, n])
  return <instancedMesh ref={ref} args={[null, null, n * 4]}><boxGeometry /><meshStandardMaterial color={color} metalness={1} roughness={0.25} /></instancedMesh>
}

/* ---------- the CPU: USC ---------- */
function Fan() {
  const g = useRef()
  useFrame((_, dt) => { g.current.rotation.z -= dt * 9 })
  return (
    <group>
      <mesh><torusGeometry args={[1.25, 0.12, 8, 28]} /><meshStandardMaterial color="#1b1a30" metalness={0.6} /></mesh>
      <group ref={g}>
        {Array.from({ length: 7 }, (_, i) => (
          <mesh key={i} rotation={[0, 0, (i / 7) * Math.PI * 2]} position={[0, 0, 0]}>
            <boxGeometry args={[0.35, 1.1, 0.04]} />
            <meshStandardMaterial color={i % 2 ? COL.violet : COL.coral} emissive={i % 2 ? COL.violet : COL.coral} emissiveIntensity={0.5} />
          </mesh>
        )).map((m, i) => <group key={i} rotation={[0, 0, (i / 7) * Math.PI * 2]}><mesh position={[0, 0.65, 0]} rotation={[0.5, 0, 0]}><boxGeometry args={[0.45, 1.05, 0.04]} /><meshStandardMaterial color={i % 2 ? COL.violet : COL.coral} emissive={i % 2 ? COL.violet : COL.coral} emissiveIntensity={0.6} /></mesh></group>)}
        <S r={0.28} c="#1b1a30" seg={12} />
      </group>
    </group>
  )
}

function Heatsink() {
  return (
    <group position={[9.5, 0, -1]}>
      <B s={[3.6, 0.3, 4.4]} c="#2a2a44" position={[0, 0.15, 0]} m={0.8} />
      {Array.from({ length: 14 }, (_, i) => <B key={i} s={[0.1, 2.2, 4]} c="#8f95b8" m={0.9} r={0.3} position={[-1.65 + i * 0.255, 1.4, 0]} />)}
      <group position={[0, 1.5, 2.1]}><Fan /></group>
    </group>
  )
}

function Algo() {
  const g = useRef()
  const base = useMemo(() => [0.6, 1.2, 0.3, 1.0, 0.8, 0.45], [])
  useFrame(({ clock }) => {
    const ph = ease(Math.min(1, ((clock.elapsedTime % 7) - 0.5) / 4)) * (clock.elapsedTime % 7 < 6.2 ? 1 : 0)
    const sorted = [...base].sort((a, b) => a - b)
    g.current.children.forEach((c, i) => {
      const h = THREE.MathUtils.lerp(base[i], sorted[i], Math.max(0, ph))
      c.scale.y = h; c.position.y = h / 2
    })
  })
  return (
    <group ref={g}>
      {base.map((h, i) => <mesh key={i} position={[(i - 2.5) * 0.36, h / 2, 0]} scale={[1, h, 1]}><boxGeometry args={[0.25, 1, 0.2]} /><meshBasicMaterial color={glow([COL.mint, COL.sky, COL.violet][i % 3], 1.5)} toneMapped={false} /></mesh>)}
    </group>
  )
}
function Db() {
  const g = useRef()
  useFrame(({ clock }) => g.current.children.forEach((c, i) => { c.position.y = 0.2 + i * 0.5 + Math.max(0, Math.sin(clock.elapsedTime * 2 - i * 0.8)) * 0.18 }))
  return (
    <group ref={g}>
      {[0, 1, 2].map((i) => <mesh key={i} position={[0, 0.2 + i * 0.5, 0]}><cylinderGeometry args={[0.55, 0.55, 0.34, 20]} /><meshBasicMaterial color={glow([COL.amber, COL.coral, COL.violet][i], 1.4)} toneMapped={false} /></mesh>)}
    </group>
  )
}
function Nlp() {
  const g = useRef()
  const toks = ['the', 'cat', 'sat', 'on']
  useFrame(({ clock }) => g.current.children.forEach((c, i) => { const on = Math.floor((clock.elapsedTime * 1.6) % 4) === i; c.position.y = 0.3 + (on ? 0.3 : 0); c.children[0].material.color.copy(glow(on ? COL.mint : COL.sky, on ? 2 : 1)) }))
  return (
    <group ref={g}>
      {toks.map((t, i) => (
        <group key={t} position={[(i - 1.5) * 0.8, 0.3, 0]}>
          <mesh><boxGeometry args={[0.7, 0.4, 0.1]} /><meshBasicMaterial toneMapped={false} /></mesh>
          <T size={0.17} color="#0a0a1e" position={[0, 0, 0.07]}>{t}</T>
        </group>
      ))}
    </group>
  )
}
function MiniChip({ x, z, label, accent, children }) {
  return (
    <group position={[x, 0, z]}>
      <B s={[3.8, 0.45, 2.8]} c="#0b1015" m={0.65} r={0.35} position={[0, 0.22, 0]} />
      <Edges s={[3.8, 0.45, 2.8]} c={accent} k={1.7} position={[0, 0.22, 0]} />
      <Pins w={3.8} d={2.8} n={5} />
      <T size={0.34} color={accent} k={1.8} position={[0, 0.47, 0.9]} rotation={[-Math.PI / 2, 0, 0]}>{label}</T>
      <group position={[0, 0.9, -0.2]}>{children}</group>
    </group>
  )
}

function Cpu() {
  const led = useRef()
  useFrame(({ clock }) => led.current.color.copy(glow(COL.mint, 1 + Math.abs(Math.sin(clock.elapsedTime * 3)) * 2)))
  return (
    <group>
      <B s={[11.5, 0.3, 11.5]} c="#0a0e12" m={0.6} position={[0, 0.15, 0]} />
      <Pins w={11.5} d={11.5} n={14} />
      <B s={[9, 0.8, 9]} c="#6b6f96" m={0.95} r={0.25} position={[0, 0.7, 0]} />
      <B s={[8.2, 0.05, 8.2]} c="#16143a" m={0.8} position={[0, 1.13, 0]} />
      <Edges s={[9, 0.8, 9]} c={COL.amber} k={1.8} position={[0, 0.7, 0]} />
      <T size={2.3} color={COL.amber} k={1.9} position={[0, 1.2, -0.7]} rotation={[-Math.PI / 2, 0, 0]}>USC</T>
      <T size={0.58} color="#e6e0ff" position={[0, 1.2, 1.2]} rotation={[-Math.PI / 2, 0, 0]}>M.S. COMPUTER SCIENCE</T>
      <T size={0.42} color={COL.mint} k={1.6} position={[0, 1.2, 2.1]} rotation={[-Math.PI / 2, 0, 0]}>2026 - 2028  /  RUNNING</T>
      <mesh position={[-3.8, 1.2, -3.8]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.25, 16]} /><meshBasicMaterial ref={led} color={glow(COL.mint, 2)} toneMapped={false} /></mesh>
    </group>
  )
}

/* ---------- the vintage chip: IIT Dharwad (+ the light bulb that turns on) ---------- */
function Bulb() {
  const glass = useRef(), fil = useRef(), light = useRef(), halo = useRef()
  const lit = useRef(0.05)
  useFrame((_, dt) => {
    lit.current = THREE.MathUtils.damp(lit.current, scroll.sm > 8.6 ? 1 : 0.06, 2.4, dt)
    const k = lit.current
    fil.current.material.color.copy(glow(COL.amber, 0.4 + k * 3.4))
    glass.current.material.opacity = 0.12 + k * 0.28
    light.current.intensity = k * 140
    halo.current.material.opacity = k * 0.35
    halo.current.scale.setScalar(0.9 + k * 0.5)
  })
  return (
    <group>
      <Cyl r={0.03} h={6} c="#222" position={[0, 3.6, 0]} seg={6} />
      <Cyl r={0.5} h={0.8} c="#8f95b8" position={[0, 0.4, 0]} />
      <mesh ref={glass} position={[0, -1.0, 0]}><sphereGeometry args={[1.35, 24, 24]} /><meshStandardMaterial color="#fff4dc" transparent opacity={0.3} roughness={0.1} depthWrite={false} /></mesh>
      <mesh ref={fil} position={[0, -0.9, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.32, 0.045, 8, 20]} /><meshBasicMaterial color={glow(COL.amber, 1)} toneMapped={false} /></mesh>
      <mesh ref={halo} position={[0, -1.0, 0]}><sphereGeometry args={[2.2, 20, 20]} /><meshBasicMaterial color="#ffb86b" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} /></mesh>
      <pointLight ref={light} position={[0, -1.0, 0]} color="#ffb86b" intensity={0} distance={24} decay={2} />
    </group>
  )
}

function IitChip() {
  return (
    <group>
      <B s={[8.4, 0.35, 6]} c="#0b0e12" m={0.6} position={[0, 0.17, 0]} />
      <B s={[7.2, 0.8, 5.2]} c="#d9c9a3" m={0.3} r={0.5} position={[0, 0.7, 0]} />
      <B s={[2.2, 0.06, 1.6]} c="#101436" m={0.9} r={0.2} position={[2.3, 1.12, -1.2]} />
      <Edges s={[7.2, 0.8, 5.2]} c={COL.yellow} k={1.4} position={[0, 0.7, 0]} />
      <Pins w={8.4} d={6} n={7} color="#e8c75a" />
      <T size={1.0} color="#5a3d12" position={[-0.7, 1.15, -0.3]} rotation={[-Math.PI / 2, 0, 0]}>IIT DH</T>
      <T size={0.46} color="#5a3d12" position={[-0.4, 1.15, 1.0]} rotation={[-Math.PI / 2, 0, 0]}>B.TECH  ELECTRICAL ENG.</T>
      <T size={0.4} color="#7a5a20" position={[-0.4, 1.15, 1.8]} rotation={[-Math.PI / 2, 0, 0]}>2020 - 2024  /  CGPA 7.69</T>
    </group>
  )
}

export default function Hardware() {
  return (
    <group>
      <hemisphereLight args={['#7fffe0', '#031a16', 0.9]} />
      <directionalLight position={[10, 30, 20]} intensity={0.8} color="#bfffe9" />
      <pointLight position={[0, 14, 6]} color="#3dffc8" intensity={60} distance={40} decay={2} />
      <Board />
      <Pulses />
      <Cpu />
      <Heatsink />
      <MiniChip x={-7.5} z={9} label="ALGO" accent={COL.mint}><Algo /></MiniChip>
      <MiniChip x={0} z={11} label="DB" accent={COL.amber}><Db /></MiniChip>
      <MiniChip x={7.5} z={9} label="NLP" accent={COL.sky}><Nlp /></MiniChip>
      {/* buses */}
      <Line points={[[0, 0.1, 5.8], [0, 0.1, 9.4]]} color={glow(COL.amber, 1.5)} lineWidth={2} toneMapped={false} />
      <Line points={[[-3, 0.1, 5.6], [-3, 0.1, 7.8], [-7.5, 0.1, 7.8]]} color={glow(COL.mint, 1.5)} lineWidth={2} toneMapped={false} />
      <Line points={[[3, 0.1, 5.6], [3, 0.1, 7.8], [7.5, 0.1, 7.8]]} color={glow(COL.sky, 1.5)} lineWidth={2} toneMapped={false} />
      <Line points={[[11.4, 0.1, 0], [14, 0.1, 0], [14, 0.1, -1], [19.5, 0.1, -1]]} color={glow(COL.yellow, 1.5)} lineWidth={3} toneMapped={false} />
      <group position={[24, 0, -1]}><IitChip /></group>
      <group position={[24, 9.2, -1]}><Bulb /></group>
    </group>
  )
}
