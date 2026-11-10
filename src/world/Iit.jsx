import { useRef, useMemo, useLayoutEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { B, Cyl, S, T, Bob, Edges, COL, glow, dummy, ease, clamp01 } from './common'
import { Avatar } from './Avatar'

/* drought map: vegetation index ripples green <-> brown */
function HeatMap() {
  const ref = useRef()
  const C = 12, R = 9
  useLayoutEffect(() => {
    for (let r = 0; r < R; r++)
      for (let c = 0; c < C; c++) {
        dummy.position.set((c - (C - 1) / 2) * 0.26, 0, (r - (R - 1) / 2) * 0.26)
        dummy.updateMatrix()
        ref.current.setMatrixAt(r * C + c, dummy.matrix)
        ref.current.setColorAt(r * C + c, new THREE.Color('#2a8'))
      }
    ref.current.instanceMatrix.needsUpdate = true
  }, [])
  const col = useMemo(() => new THREE.Color(), [])
  const green = useMemo(() => new THREE.Color('#37e08a'), [])
  const brown = useMemo(() => new THREE.Color('#9a5a2a'), [])
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    for (let r = 0; r < R; r++)
      for (let c = 0; c < C; c++) {
        const v = 0.5 + 0.5 * Math.sin(c * 0.55 + r * 0.4 - t * 0.7)
        col.copy(brown).lerp(green, v).multiplyScalar(0.9 + v * 0.5)
        ref.current.setColorAt(r * C + c, col)
      }
    ref.current.instanceColor.needsUpdate = true
  })
  return (
    <group>
      <instancedMesh ref={ref} args={[null, null, C * R]}>
        <boxGeometry args={[0.23, 0.06, 0.23]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      <T size={0.2} color={COL.mint} k={1.4} position={[0, 0.12, 1.65]} rotation={[-Math.PI / 2, 0, 0]}>NDVI / Karnataka 1981-2021</T>
    </group>
  )
}

function Satellite() {
  const g = useRef(), beam = useRef()
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    g.current.position.x = Math.sin(t * 0.55) * 1.5
    g.current.position.z = Math.cos(t * 0.4) * 0.5
    g.current.rotation.y = t * 0.4
    beam.current.material.opacity = 0.1 + 0.08 * Math.sin(t * 6)
  })
  return (
    <group ref={g} position={[0, 4.2, 0]}>
      <B s={[0.6, 0.6, 0.6]} c="#d6d9ff" m={0.8} r={0.3} />
      <B s={[1.8, 0.04, 0.7]} c="#2c47ff" m={0.6} ei={0.4} position={[-1.3, 0, 0]} />
      <B s={[1.8, 0.04, 0.7]} c="#2c47ff" m={0.6} ei={0.4} position={[1.3, 0, 0]} />
      <S r={0.2} c="#ffd23f" position={[0, 0.45, 0]} ei={1} seg={8} />
      <mesh ref={beam} position={[0, -2.1, 0]}><coneGeometry args={[1.3, 4.2, 16, 1, true]} /><meshBasicMaterial color={glow(COL.mint, 1.4)} transparent opacity={0.15} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} blending={THREE.AdditiveBlending} /></mesh>
    </group>
  )
}

function Car({ small, color, children, ...p }) {
  const s = small ? 1 : 1.7
  return (
    <group {...p}>
      <B s={[1.0 * s, 0.32 * s, 0.55 * s]} c={color} position={[0, 0.3 * s, 0]} ei={0.25} />
      <B s={[0.5 * s, 0.26 * s, 0.5 * s]} c={small ? '#fff3b0' : '#2a2a4a'} position={[small ? -0.1 : -0.35 * s, 0.58 * s, 0]} />
      {!small && <B s={[0.95 * s, 0.7 * s, 0.6 * s]} c="#3a3566" position={[-0.55 * s, 0.6 * s, 0]} />}
      {[[-0.32, 0.27], [0.32, 0.27], [-0.32, -0.27], [0.32, -0.27]].map(([x, z], i) => (
        <Cyl key={i} r={0.14 * s} h={0.1 * s} c="#111" position={[x * s, 0.14 * s, z * s]} rotation={[Math.PI / 2, 0, 0]} seg={10} />
      ))}
      {children}
    </group>
  )
}

/* the finding, as a race: linear regression vs the deep-learning truck */
function Race() {
  const L = 5.6
  const car = useRef(), truck = useRef(), conf = useRef()
  const [tick, setTick] = useState({ a: 0, b: 0, win: false })
  const acc = useRef(0)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime % 16
    // simulated minutes: 300 min fits into 12 s
    const sim = Math.min(300, t * 25)
    const carMin = Math.min(2, sim)
    const carP = ease(clamp01(sim / 2))
    car.current.position.x = -L / 2 + carP * L
    truck.current.position.x = -L / 2 + (sim / 300) * L
    conf.current.visible = t > 0.6 && t < 4
    conf.current.children.forEach((c, i) => {
      const k = clamp01((t - 0.6) / 2.6)
      c.position.set(Math.sin(i * 2.4) * 1.0 * k, 0.4 + k * 2.2 - k * k * 1.5 + (i % 3) * 0.2, Math.cos(i * 1.7) * 0.6)
    })
    acc.current += 1 / 60
    if (acc.current > 0.15) {
      acc.current = 0
      setTick({ a: carMin, b: sim, win: sim >= 2 })
    }
  })
  const pad = (n) => (n >= 100 ? Math.round(n) : n.toFixed(n < 10 ? 1 : 0)).toString()
  return (
    <group>
      <B s={[L + 1.8, 0.06, 3.1]} c="#1a1f44" position={[0, 0.03, 0]} />
      <B s={[0.3, 0.07, 3.1]} c="#f4efe6" position={[L / 2 + 0.5, 0.05, 0]} />
      <group position={[0, 0, 0.95]}>
        <group ref={car}>
          <Car small color="#ffd93d">
            <T size={0.2} color={COL.yellow} k={1.6} position={[0, 1.35, 0]}>LINEAR REG.</T>
            <T size={0.19} color="#fff" k={1.2} position={[0, 1.05, 0]}>{`${pad(tick.a)} min`}</T>
          </Car>
        </group>
        {tick.win && <T size={0.3} color={COL.mint} k={1.9} position={[L / 2 - 0.2, 0.9, 0]}>R2 0.92</T>}
      </group>
      <group position={[0, 0, -0.95]}>
        <group ref={truck}>
          <Car color="#ff6b8a">
            <T size={0.2} color={COL.coral} k={1.6} position={[0, 2.45, 0]}>CONVLSTM+CONV3D</T>
            <T size={0.19} color="#fff" k={1.2} position={[0, 2.15, 0]}>{`${pad(tick.b)} min`}</T>
          </Car>
        </group>
        <T size={0.2} color={COL.coral} k={1.4} position={[L / 2 - 0.2, 0.7, 0]}>R2 0.22-0.83</T>
      </group>
      <group ref={conf} position={[L / 2 - 0.6, 0.4, 0.8]}>
        {Array.from({ length: 16 }, (_, i) => (
          <mesh key={i}><boxGeometry args={[0.1, 0.1, 0.02]} /><meshBasicMaterial color={glow([COL.coral, COL.mint, COL.yellow, COL.sky][i % 4], 2)} toneMapped={false} /></mesh>
        ))}
      </group>
    </group>
  )
}

export default function Iit() {
  return (
    <group>
      <pointLight position={[0, 6, 3]} color="#8fd0ff" intensity={45} distance={22} decay={2} />
      <pointLight position={[0, 7, 10]} color="#ff6b8a" intensity={22} distance={26} decay={2} />
      {/* lab platform */}
      <B s={[13, 0.4, 9.5]} c="#222a58" m={0.4} r={0.5} position={[0, -0.2, 0]} />
      <Edges s={[13, 0.4, 9.5]} c={COL.sky} k={1.5} position={[0, -0.2, 0]} />
      <B s={[13, 0.12, 0.12]} c="#8fd0ff" ei={2} position={[0, 0.04, 4.8]} />
      {/* neon sign on posts */}
      <B s={[0.2, 5.5, 0.2]} c="#2d2a52" position={[-5.8, 2.75, -4]} />
      <B s={[0.2, 5.5, 0.2]} c="#2d2a52" position={[5.8, 2.75, -4]} />
      <B s={[7.4, 1.2, 0.2]} c="#0d0b26" position={[0, 5.9, -4]} />
      <Edges s={[7.4, 1.2, 0.2]} c={COL.mint} k={1.8} position={[0, 5.9, -4]} />
      <T size={0.78} color={COL.mint} k={1.9} position={[0, 5.9, -3.85]}>IIT DHARWAD</T>
      <T size={0.26} color="#c9c2ff" position={[0, 5.35, -3.85]}>R&amp;D lab / drought forecasting</T>

      {/* map table + satellite */}
      <group position={[-4.1, 0, -1.6]}>
        <B s={[3.4, 0.14, 2.8]} c="#2a2368" position={[0, 1.1, 0]} />
        <B s={[0.14, 1.1, 0.14]} c="#2a2368" position={[-1.5, 0.55, -1.2]} />
        <B s={[0.14, 1.1, 0.14]} c="#2a2368" position={[1.5, 0.55, -1.2]} />
        <B s={[0.14, 1.1, 0.14]} c="#2a2368" position={[-1.5, 0.55, 1.2]} />
        <B s={[0.14, 1.1, 0.14]} c="#2a2368" position={[1.5, 0.55, 1.2]} />
        <group position={[0, 1.22, 0]}><HeatMap /></group>
        <Satellite />
      </group>

      {/* race track */}
      <group position={[1.3, 0.02, 0.9]}><Race /></group>
      <Avatar hoodie="#ffffff" pants="#2b2a4a" hair="#2a1a14" glasses mode="point" position={[-3.0, 0, 2.6]} rotation={[0, 0.3, 0]} scale={0.7} skin="#c98d68" bun />
    </group>
  )
}
