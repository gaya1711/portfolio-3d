import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import Scene from './Scene'
import Overlay from './Overlay'

export default function App() {
  return (
    <>
      <div className="stage">
        <Canvas
          dpr={[1, 2]}
          camera={{ fov: 45, near: 0.1, far: 700, position: [0, 4, 12] }}
          gl={{ antialias: false, powerPreference: 'high-performance' }}
        >
          <Suspense fallback={null}>
            <Scene />
          </Suspense>
        </Canvas>
      </div>
      <Overlay />
    </>
  )
}
