import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { B, T, Bob, COL, glow, ease, clamp01 } from './common'
import { scroll } from '../scroll'
import { WIN } from '../layout'
import { Win, RobotTwin, Reconcile, Lda } from './Projects'

const CONTENT = [
  { title: 'robot_twin.ts  - live', accent: COL.mint, C: RobotTwin },
  { title: 'reconcile.py', accent: COL.violet, C: Reconcile },
  { title: 'lda.ipynb', accent: COL.coral, C: Lda },
]

export default function Folder() {
  const flap = useRef()
  const open = useRef(0)
  const wins = useRef([])
  useFrame((_, dt) => {
    open.current = THREE.MathUtils.damp(open.current, scroll.sm > 3.55 ? 1 : 0, 2.2, dt)
    const o = open.current
    flap.current.rotation.y = ease(o) * Math.PI * 0.86
    wins.current.forEach((g, i) => {
      if (!g) return
      const k = ease(clamp01(o * 1.8 - i * 0.3))
      const W = WIN[i]
      g.position.set(W.pos[0] * k, 2.6 + (W.pos[1] - 2.6) * k, -0.4 + (W.pos[2] + 0.4) * k)
      g.rotation.y = W.rot * k
      g.scale.setScalar(0.12 + 0.88 * k)
      g.visible = k > 0.01
    })
  })
  return (
    <group>
      <pointLight position={[0, 8, 14]} color="#ffe2a8" intensity={80} distance={40} decay={2} />
      <pointLight position={[0, 6, 22]} color="#8b5cf6" intensity={50} distance={40} decay={2} />
      {/* plaza the folder stands on */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 10]}>
        <circleGeometry args={[19, 48]} />
        <meshStandardMaterial color="#17123a" roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 10]}>
        <ringGeometry args={[18.6, 19, 64]} />
        <meshBasicMaterial color={glow(COL.amber, 1.6)} toneMapped={false} />
      </mesh>

      {/* the folder */}
      <B s={[10, 6.2, 0.3]} c="#e0b45e" ei={0.18} position={[0, 3.1, -1.2]} m={0.1} />
      <B s={[3.6, 0.7, 0.3]} c="#e0b45e" ei={0.18} position={[-3.2, 6.45, -1.2]} />
      <B s={[9.2, 5.4, 0.05]} c="#f7e3ae" ei={0.25} position={[0, 2.9, -1.02]} />
      <T size={0.38} color="#5a3d12" position={[-3.2, 6.45, -1.0]}>projects</T>
      <group ref={flap} position={[-5, 0.2, 0.2]}>
        <B s={[10, 5.6, 0.3]} c="#f0c46c" ei={0.2} position={[5, 2.8, 0]} m={0.1} />
        <T size={0.9} color="#5a3d12" position={[5, 3.2, 0.2]}>~/projects</T>
        <T size={0.36} color="#8a6420" position={[5, 2.2, 0.2]}>3 files inside</T>
      </group>

      {/* windows rise out of the folder */}
      {CONTENT.map(({ title, accent, C }, i) => (
        <group key={i} ref={(el) => (wins.current[i] = el)}>
          <Bob amp={0.18} phase={i * 2} speed={1}>
            <Win title={title} accent={accent}><C /></Win>
          </Bob>
        </group>
      ))}
    </group>
  )
}
