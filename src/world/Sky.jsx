import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { scroll } from '../scroll'
import { rng, glow } from './common'

const PAL = {
  desk: { top: '#0a0820', mid: '#1c1340', bot: '#0a0820', fog: '#0f0b2a', stars: 0.0, near: 16, far: 80, moon: 0 },
  screen: { top: '#05041a', mid: '#4b1a6e', bot: '#0a0620', fog: '#2b1050', stars: 1, near: 40, far: 200, moon: 1 },
  hw: { top: '#02100f', mid: '#07443c', bot: '#02100f', fog: '#06302a', stars: 0, near: 30, far: 120, moon: 0 },
}

const vert = `varying vec3 vP; void main(){ vP=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`
const frag = `uniform vec3 top; uniform vec3 mid; uniform vec3 bot; varying vec3 vP;
void main(){ float h=vP.y; vec3 c = h>0.0 ? mix(mid, top, pow(clamp(h,0.0,1.0),0.5)) : mix(mid, bot, pow(clamp(-h,0.0,1.0),0.4)); gl_FragColor=vec4(c,1.0); }`

export default function Sky() {
  const root = useRef()
  const starMat = useRef()
  const moon = useRef()
  const halo = useRef()
  const { camera, scene } = useThree()
  const cur = useMemo(() => ({
    top: new THREE.Color(PAL.desk.top), mid: new THREE.Color(PAL.desk.mid), bot: new THREE.Color(PAL.desk.bot),
    fog: new THREE.Color(PAL.desk.fog), stars: 0, near: 16, far: 80, moon: 0,
  }), [])
  const uniforms = useMemo(() => ({ top: { value: cur.top }, mid: { value: cur.mid }, bot: { value: cur.bot } }), [cur])
  const tmp = useMemo(() => new THREE.Color(), [])
  const starGeo = useMemo(() => {
    const r = rng(5)
    const pos = []
    for (let i = 0; i < 1500; i++) {
      const th = r() * Math.PI * 2, ph = Math.acos(r() * 0.95 + 0.04)
      pos.push(Math.sin(ph) * Math.cos(th) * 380, Math.cos(ph) * 380, Math.sin(ph) * Math.sin(th) * 380)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    return g
  }, [])

  useFrame((_, dt) => {
    const P = PAL[scroll.shot] || PAL.desk
    const k = 1 - Math.exp(-dt * 3)
    cur.top.lerp(tmp.set(P.top), k); cur.mid.lerp(tmp.set(P.mid), k); cur.bot.lerp(tmp.set(P.bot), k)
    cur.fog.lerp(tmp.set(P.fog), k)
    cur.stars += (P.stars - cur.stars) * k
    cur.moon += (P.moon - cur.moon) * k
    cur.near += (P.near - cur.near) * k
    cur.far += (P.far - cur.far) * k
    if (scene.fog) { scene.fog.color.copy(cur.fog); scene.fog.near = cur.near; scene.fog.far = cur.far }
    root.current.position.copy(camera.position)
    starMat.current.opacity = cur.stars
    moon.current.material.opacity = cur.moon
    halo.current.material.opacity = cur.moon * 0.12
  })

  return (
    <group ref={root}>
      <mesh renderOrder={-10} frustumCulled={false}>
        <sphereGeometry args={[400, 32, 16]} />
        <shaderMaterial side={THREE.BackSide} depthWrite={false} fog={false} uniforms={uniforms} vertexShader={vert} fragmentShader={frag} />
      </mesh>
      <points geometry={starGeo} renderOrder={-9} frustumCulled={false}>
        <pointsMaterial ref={starMat} size={2.4} sizeAttenuation={false} color="#ffffff" transparent depthWrite={false} fog={false} toneMapped={false} />
      </points>
      <mesh ref={moon} position={[-110, 130, -330]} renderOrder={-8}>
        <sphereGeometry args={[13, 32, 32]} />
        <meshBasicMaterial color={glow('#ffe9c4', 1.15)} transparent fog={false} toneMapped={false} depthWrite={false} />
      </mesh>
      <mesh ref={halo} position={[-110, 130, -330]} renderOrder={-8}>
        <sphereGeometry args={[30, 24, 24]} />
        <meshBasicMaterial color="#ffd9a0" transparent fog={false} toneMapped={false} depthWrite={false} />
      </mesh>
    </group>
  )
}
