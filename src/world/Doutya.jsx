import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { B, Cyl, S, T, Bob, Rod, Edges, COL, glow, rng } from './common'
import { Avatar } from './Avatar'

function Phone({ flip = 1, ...p }) {
  const bars = useRef()
  useFrame(({ clock }) => {
    bars.current.children.forEach((c, i) => { c.scale.x = 0.5 + 0.5 * Math.abs(Math.sin(clock.elapsedTime * 1.3 + i * 1.1 * flip)) })
  })
  return (
    <Bob amp={0.15} phase={flip * 2} {...p}>
      <B s={[1.0, 1.9, 0.12]} c="#0f0e24" m={0.5} r={0.3} />
      <mesh position={[0, 0, 0.07]}><planeGeometry args={[0.88, 1.74]} /><meshBasicMaterial color="#1d1a4d" /></mesh>
      <group ref={bars} position={[0, 0.3, 0.08]}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[0, 0.45 - i * 0.28, 0]}><boxGeometry args={[0.7, 0.14, 0.01]} /><meshBasicMaterial color={glow([COL.coral, COL.mint, COL.sky, COL.amber][i], 1.3)} toneMapped={false} /></mesh>
        ))}
      </group>
      <mesh position={[0, -0.65, 0.08]}><circleGeometry args={[0.18, 16]} /><meshBasicMaterial color={glow(COL.violet, 1.6)} toneMapped={false} /></mesh>
    </Bob>
  )
}

/* firebase flame + sync pulses bouncing between two phones */
function Sync() {
  const flame = useRef()
  const pulses = useRef()
  const A = [-2.4, 0, 0], F = [0, -0.2, 0], Bp = [2.4, 0, 0]
  const path = [A, F, Bp, F]
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    flame.current.scale.set(1 + Math.sin(t * 9) * 0.06, 1 + Math.sin(t * 7 + 1) * 0.12, 1)
    pulses.current.children.forEach((m, i) => {
      const s = ((t * 0.55 + i * 0.25) % 1) * 4
      const k = Math.floor(s) % 4, f = s - Math.floor(s)
      const a = path[k], b = path[(k + 1) % 4]
      m.position.set(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f + Math.sin(f * Math.PI) * 0.35, 0.2)
    })
  })
  return (
    <group>
      <Phone position={[-2.4, 0, 0]} rotation={[0, 0.35, 0]} flip={1} />
      <Phone position={[2.4, 0, 0]} rotation={[0, -0.35, 0]} flip={-1} />
      <group ref={flame} position={[0, -0.5, 0]}>
        <mesh><coneGeometry args={[0.4, 1.0, 10]} /><meshBasicMaterial color={glow('#ff8a1f', 1.8)} toneMapped={false} /></mesh>
        <mesh position={[0, -0.12, 0.05]}><coneGeometry args={[0.24, 0.62, 10]} /><meshBasicMaterial color={glow('#ffd23f', 2)} toneMapped={false} /></mesh>
      </group>
      <T size={0.2} color={COL.amber} k={1.5} position={[0, -1.35, 0]}>firebase.realtime</T>
      <group ref={pulses}>
        {[0, 1, 2, 3].map((i) => <mesh key={i}><sphereGeometry args={[0.09, 8, 8]} /><meshBasicMaterial color={glow(COL.mint, 2.6)} toneMapped={false} /></mesh>)}
      </group>
    </group>
  )
}

function ReactAtom(props) {
  const g = useRef()
  useFrame((_, dt) => { g.current.rotation.y += dt * 0.6; g.current.rotation.x += dt * 0.15 })
  return (
    <group {...props}>
      <group ref={g}>
        <mesh><sphereGeometry args={[0.2, 16, 16]} /><meshBasicMaterial color={glow(COL.sky, 2.4)} toneMapped={false} /></mesh>
        {[0, 1, 2].map((i) => (
          <group key={i} rotation={[0, 0, (i * Math.PI) / 3]}>
            <mesh rotation={[Math.PI / 2 * 0.0, 0, 0]} scale={[1, 0.42, 1]}><torusGeometry args={[1.0, 0.025, 8, 48]} /><meshBasicMaterial color={glow(COL.sky, 1.8)} toneMapped={false} /></mesh>
          </group>
        ))}
      </group>
    </group>
  )
}

function AR() {
  const cube = useRef(), ring = useRef()
  useFrame(({ clock }, dt) => {
    cube.current.rotation.y += dt * 0.7
    const ph = (clock.elapsedTime * 0.6) % 1
    ring.current.scale.setScalar(0.5 + ph * 1.5)
    ring.current.material.opacity = (1 - ph) * 0.8
  })
  return (
    <group>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}><ringGeometry args={[0.9, 1, 40]} /><meshBasicMaterial color={glow(COL.coral, 1.8)} transparent toneMapped={false} /></mesh>
      <group ref={cube} position={[0, 1.2, 0]}>
        <Edges s={[1.4, 1.4, 1.4]} c={COL.sky} k={2} />
        <Edges s={[0.7, 0.7, 0.7]} c={COL.violet} k={2} />
      </group>
      <Bob position={[0, 2.9, 0]} amp={0.15}>
        <mesh rotation={[Math.PI, 0, 0]} position={[0, -0.25, 0]}><coneGeometry args={[0.22, 0.5, 12]} /><meshBasicMaterial color={glow(COL.coral, 2)} toneMapped={false} /></mesh>
        <mesh position={[0, 0.12, 0]}><sphereGeometry args={[0.22, 14, 14]} /><meshBasicMaterial color={glow(COL.coral, 2)} toneMapped={false} /></mesh>
      </Bob>
      <T size={0.2} color={COL.sky} k={1.5} position={[0, 0.35, 1.3]}>AR / unity</T>
    </group>
  )
}

function FairyLights() {
  const g = useRef()
  const N = 18
  useFrame(({ clock }) => {
    g.current.children.forEach((c, i) => { c.material.color.copy(glow([COL.amber, COL.coral, COL.mint, COL.sky][i % 4], 1.2 + 1.2 * Math.abs(Math.sin(clock.elapsedTime * 1.5 + i)))) })
  })
  return (
    <group ref={g}>
      {Array.from({ length: N }, (_, i) => {
        const x = -5 + (i / (N - 1)) * 10
        return <mesh key={i} position={[x, 4.6 - Math.sin((i / (N - 1)) * Math.PI) * 0.5, 3.8]}><sphereGeometry args={[0.1, 8, 8]} /><meshBasicMaterial toneMapped={false} /></mesh>
      })}
    </group>
  )
}

export default function Doutya() {
  const notes = useMemo(() => {
    const r = rng(4)
    const pal = ['#ffe066', '#ff9ec0', '#8ff0d0', '#9ad0ff', '#ffb86b']
    return Array.from({ length: 24 }, (_, i) => ({ x: -3.6 + (i % 8) * 1.03, y: 1.2 + Math.floor(i / 8) * 1.05, r: (r() - 0.5) * 0.18, c: pal[Math.floor(r() * 5)] }))
  }, [])
  return (
    <group>
      <pointLight position={[0, 4, 1]} color="#ffb08a" intensity={50} distance={20} decay={2} />
      <pointLight position={[0, 6, 9]} color="#5cc8ff" intensity={25} distance={26} decay={2} />
      <B s={[10.5, 0.3, 9]} c="#33265a" position={[0, -0.15, 0]} m={0.2} />
      {/* back wall with sticky-note sprint board */}
      <B s={[10.5, 4.6, 0.2]} c="#241848" position={[0, 2.3, -4.4]} />
      {notes.map((n, i) => (
        <B key={i} s={[0.8, 0.8, 0.02]} c={n.c} ei={0.4} position={[n.x, n.y, -4.25]} rotation={[0, 0, n.r]} />
      ))}
      <B s={[0.22, 5, 0.22]} c="#33265a" position={[-5.2, 2.5, 3.8]} />
      <B s={[0.22, 5, 0.22]} c="#33265a" position={[5.2, 2.5, 3.8]} />
      <B s={[10.6, 0.22, 0.3]} c="#33265a" position={[0, 5, 3.8]} />
      <B s={[10.6, 0.22, 0.3]} c="#33265a" position={[0, 5, -4.4]} />
      <FairyLights />
      <B s={[5.4, 1.2, 0.2]} c="#0d0b26" position={[0, 6.1, -4.3]} />
      <Edges s={[5.4, 1.2, 0.2]} c={COL.sky} k={1.8} position={[0, 6.1, -4.3]} />
      <T size={0.85} color={COL.sky} k={1.9} position={[0, 6.1, -4.15]}>DOUTYA</T>

      {/* beanbag intern setup */}
      <S r={1.1} c="#ff6b8a" position={[-3.2, 0.55, -1.8]} scale={[1.4, 0.7, 1.3]} />
      <Avatar hoodie="#ffb86b" hair="#2a1a14" glasses mode="type" position={[-3.2, 0.7, -1.7]} rotation={[0, 0.5, 0]} scale={0.62} skin="#c98d68" bun={false} />
      <B s={[0.9, 0.06, 0.6]} c="#1b1a30" position={[-2.7, 1.3, -0.9]} rotation={[0.1, 0.5, 0]} />

      <group position={[0.3, 2.6, 0.8]}><Sync /></group>
      <ReactAtom position={[0, 7.4, -0.5]} />
      <T size={0.3} color={COL.sky} k={1.4} position={[0, 8.8, -0.5]}>react / next / node</T>
      <group position={[3.6, 0, -0.6]}><AR /></group>
    </group>
  )
}
