import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { OFF } from './layout'
import { scroll } from './scroll'
import Rig from './world/Rig'
import Sky from './world/Sky'
import Desk from './world/Desk'
import ScreenWorld from './world/ScreenWorld'
import Hardware from './world/Hardware'

// only the shot you're currently in is visible
function Shot({ id, children }) {
  const g = useRef()
  useFrame(() => { g.current.visible = scroll.shot === id })
  return <group ref={g} position={OFF[id]}>{children}</group>
}

export default function Scene() {
  return (
    <>
      <fog attach="fog" args={['#0f0b2a', 16, 80]} />
      <ambientLight intensity={0.35} />
      <Rig />
      <Sky />
      <Shot id="desk"><Desk /></Shot>
      <Shot id="screen"><ScreenWorld /></Shot>
      <Shot id="hw"><Hardware /></Shot>
      <EffectComposer multisampling={4}>
        <Bloom intensity={1.0} luminanceThreshold={0.62} luminanceSmoothing={0.3} mipmapBlur />
        <Vignette offset={0.3} darkness={0.7} />
      </EffectComposer>
    </>
  )
}
