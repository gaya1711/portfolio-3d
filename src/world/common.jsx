import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import monoFont from '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-700-normal.woff?url'

export const COL = {
  violet: '#8b5cf6', coral: '#ff6b8a', mint: '#5ef2c0', sky: '#5cc8ff',
  amber: '#ffb86b', yellow: '#ffe066', ink: '#0d0b1f', paper: '#f4efe6', plum: '#2a1d4d',
}
export const glow = (c, k = 2.2) => new THREE.Color(c).multiplyScalar(k)
export const dummy = new THREE.Object3D()
export const ease = (x) => x * x * (3 - 2 * x)
export const clamp01 = (x) => Math.min(1, Math.max(0, x))

export function rng(seed) {
  let a = seed
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/* glowing mono text. ASCII only (the bundled font has no symbols). */
export function T({ children, size = 0.3, color = '#fff', anchor = 'center', k = 1, ...p }) {
  const col = useMemo(() => (k === 1 ? color : glow(color, k)), [color, k])
  return (
    <Text font={monoFont} fontSize={size} color={col} anchorX={anchor} anchorY="middle" material-toneMapped={false} {...p}>
      {children}
    </Text>
  )
}

/* tiny mesh helpers so scenes stay readable */
export function B({ s = [1, 1, 1], c = '#888', ei = 0, ec, r = 0.7, m = 0.1, flat = true, children, ...p }) {
  return (
    <mesh {...p}>
      <boxGeometry args={s} />
      <meshStandardMaterial color={c} roughness={r} metalness={m} flatShading={flat} emissive={ec || c} emissiveIntensity={ei} />
      {children}
    </mesh>
  )
}
export function Cyl({ r = 0.5, h = 1, c = '#888', seg = 20, ei = 0, ec, rb, children, ...p }) {
  return (
    <mesh {...p}>
      <cylinderGeometry args={[r, rb ?? r, h, seg]} />
      <meshStandardMaterial color={c} roughness={0.6} metalness={0.15} flatShading emissive={ec || c} emissiveIntensity={ei} />
      {children}
    </mesh>
  )
}
export function S({ r = 0.5, c = '#888', seg = 20, ei = 0, ec, children, ...p }) {
  return (
    <mesh {...p}>
      <sphereGeometry args={[r, seg, seg]} />
      <meshStandardMaterial color={c} roughness={0.6} metalness={0.1} emissive={ec || c} emissiveIntensity={ei} />
      {children}
    </mesh>
  )
}
/* always-bright (bloom) material */
export function G({ geo, c = COL.mint, k = 2, ...p }) {
  const col = useMemo(() => glow(c, k), [c, k])
  return (
    <mesh {...p}>
      {geo}
      <meshBasicMaterial color={col} toneMapped={false} />
    </mesh>
  )
}

export function Bob({ children, amp = 0.12, speed = 1.2, phase = 0, spin = 0, ...p }) {
  const g = useRef()
  useFrame(({ clock }, dt) => {
    g.current.position.y = Math.sin(clock.elapsedTime * speed + phase) * amp
    if (spin) g.current.rotation.y += spin * dt
  })
  return (
    <group {...p}>
      <group ref={g}>{children}</group>
    </group>
  )
}

/* thin glowing rod between two points */
export function Rod({ a, b, r = 0.04, color = COL.mint, k = 1.6 }) {
  const { pos, quat, len } = useMemo(() => {
    const A = new THREE.Vector3(...a), Bv = new THREE.Vector3(...b)
    const d = Bv.clone().sub(A)
    const len = d.length()
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize())
    return { pos: A.clone().add(Bv).multiplyScalar(0.5), quat: q, len }
  }, [a[0], a[1], a[2], b[0], b[1], b[2]]) // eslint-disable-line
  const col = useMemo(() => glow(color, k), [color, k])
  return (
    <mesh position={pos} quaternion={quat}>
      <cylinderGeometry args={[r, r, len, 6]} />
      <meshBasicMaterial color={col} toneMapped={false} />
    </mesh>
  )
}

export function Edges({ s, c = COL.mint, k = 1.6, ...p }) {
  const geo = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(...s)), [s[0], s[1], s[2]]) // eslint-disable-line
  const col = useMemo(() => glow(c, k), [c, k])
  return (
    <lineSegments geometry={geo} {...p}>
      <lineBasicMaterial color={col} toneMapped={false} />
    </lineSegments>
  )
}
