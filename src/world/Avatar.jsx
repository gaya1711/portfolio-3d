import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { S, B, ease } from './common'
import { scroll } from '../scroll'
import { roadFrame, AV } from '../layout'

/* a tiny person. modes: idle | type | point | wave (+walk blend via walkRef) */
export function Avatar({
  hoodie = '#8b5cf6', hair = '#1a1020', skin = '#e3ab8b', pants = '#2b2a4a',
  glasses = true, bun = true, mode = 'idle', walkRef, scale = 0.8, ...p
}) {
  const L1 = useRef(), L2 = useRef(), A1 = useRef(), A2 = useRef(), body = useRef(), head = useRef()
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const w = walkRef ? walkRef.current : 0
    const sw = Math.sin(t * 9) * 0.8 * w
    L1.current.rotation.x = sw
    L2.current.rotation.x = -sw
    let a1 = -sw * 0.8, a2 = sw * 0.8, a1z = 0
    if (mode === 'type') {
      a1 = -1.15 + Math.sin(t * 14) * 0.1
      a2 = -1.15 + Math.sin(t * 14 + 1.7) * 0.1
    } else if (mode === 'point') {
      a1 = -1.45
    } else if (mode === 'wave') {
      a1 = THREE.MathUtils.lerp(-2.7, -sw * 0.8, w)
      a1z = (1 - w) * Math.sin(t * 7) * 0.55
    }
    A1.current.rotation.x = a1
    A1.current.rotation.z = a1z
    A2.current.rotation.x = a2
    body.current.position.y = Math.abs(Math.sin(t * 9)) * 0.06 * w + Math.sin(t * 2) * 0.012
    head.current.rotation.y = Math.sin(t * 0.7) * 0.25 * (1 - w)
    head.current.rotation.x = mode === 'type' ? 0.15 + Math.sin(t * 3) * 0.04 : 0
  })
  return (
    <group scale={scale} {...p}>
      <group ref={body}>
        {/* legs */}
        <group ref={L1} position={[-0.14, 0.85, 0]}>
          <mesh position={[0, -0.4, 0]}><capsuleGeometry args={[0.12, 0.5, 4, 8]} /><meshStandardMaterial color={pants} flatShading /></mesh>
          <B s={[0.2, 0.1, 0.32]} c="#f4efe6" position={[0, -0.82, 0.05]} />
        </group>
        <group ref={L2} position={[0.14, 0.85, 0]}>
          <mesh position={[0, -0.4, 0]}><capsuleGeometry args={[0.12, 0.5, 4, 8]} /><meshStandardMaterial color={pants} flatShading /></mesh>
          <B s={[0.2, 0.1, 0.32]} c="#f4efe6" position={[0, -0.82, 0.05]} />
        </group>
        {/* torso */}
        <mesh position={[0, 1.3, 0]}><capsuleGeometry args={[0.3, 0.25, 4, 10]} /><meshStandardMaterial color={hoodie} flatShading roughness={0.8} /></mesh>
        {/* arms */}
        <group ref={A1} position={[-0.4, 1.6, 0]}>
          <mesh position={[0, -0.28, 0]}><capsuleGeometry args={[0.085, 0.42, 4, 8]} /><meshStandardMaterial color={hoodie} flatShading /></mesh>
          <S r={0.085} c={skin} position={[0, -0.62, 0]} seg={8} />
        </group>
        <group ref={A2} position={[0.4, 1.6, 0]}>
          <mesh position={[0, -0.28, 0]}><capsuleGeometry args={[0.085, 0.42, 4, 8]} /><meshStandardMaterial color={hoodie} flatShading /></mesh>
          <S r={0.085} c={skin} position={[0, -0.62, 0]} seg={8} />
        </group>
        {/* head */}
        <group ref={head} position={[0, 1.98, 0]}>
          <S r={0.28} c={skin} seg={14} />
          <S r={0.3} c={hair} position={[0, 0.05, -0.05]} scale={[1, 0.85, 1]} seg={14} />
          {bun && <S r={0.13} c={hair} position={[0, 0.34, -0.12]} seg={10} />}
          <S r={0.032} c="#111" position={[-0.1, -0.01, 0.26]} seg={8} />
          <S r={0.032} c="#111" position={[0.1, -0.01, 0.26]} seg={8} />
          {glasses && (
            <>
              <mesh position={[-0.1, -0.01, 0.27]}><torusGeometry args={[0.075, 0.012, 6, 16]} /><meshBasicMaterial color="#ffb86b" /></mesh>
              <mesh position={[0.1, -0.01, 0.27]}><torusGeometry args={[0.075, 0.012, 6, 16]} /><meshBasicMaterial color="#ffb86b" /></mesh>
            </>
          )}
        </group>
      </group>
    </group>
  )
}

/* "me": walks the road ahead of the camera, waves at every stop */
export function Wanderer() {
  const g = useRef()
  const walk = useRef(0)
  const prev = useRef(new THREE.Vector3())
  const yaw = useRef(Math.PI)
  const { camera } = useThree()

  const posOf = (a) => {
    if (a.road) {
      const { p, t, n } = roadFrame(a.u)
      return p.clone().addScaledVector(n, a.lat).addScaledVector(t, a.extra)
    }
    return new THREE.Vector3(a.x, 0, a.z)
  }

  useFrame((_, dt) => {
    const t = scroll.sm
    const vis = t > 0.6 && t < 7.6
    g.current.visible = vis
    if (!vis) return
    const i = THREE.MathUtils.clamp(Math.floor(t), 1, 7)
    const f = t < 1 ? 0 : t - i
    const A = AV[i], Bv = AV[Math.min(7, i + 1)]
    const e = ease(f)
    let p
    if (A.road && Bv.road) {
      const u = THREE.MathUtils.lerp(A.u, Bv.u, e)
      const lat = THREE.MathUtils.lerp(A.lat, Bv.lat, e)
      const extra = THREE.MathUtils.lerp(A.extra, Bv.extra, e)
      const { p: rp, t: tg, n } = roadFrame(u)
      p = rp.clone().addScaledVector(n, lat).addScaledVector(tg, extra)
    } else {
      p = posOf(A).lerp(posOf(Bv), e)
    }
    const d = p.clone().sub(prev.current)
    const speed = d.length() / Math.max(dt, 1e-3)
    if (speed > 0.6 && prev.current.lengthSq() > 0) {
      walk.current = THREE.MathUtils.damp(walk.current, 1, 8, dt)
      yaw.current = Math.atan2(d.x, d.z)
    } else {
      walk.current = THREE.MathUtils.damp(walk.current, 0, 8, dt)
      // stopped: face the camera at the road stops, face the windows at the folder
      const world = g.current.parent.localToWorld(p.clone())
      const toCam = Math.atan2(camera.position.x - world.x, camera.position.z - world.z)
      const want = i <= 3 ? toCam : Math.PI
      let diff = want - yaw.current
      diff = Math.atan2(Math.sin(diff), Math.cos(diff))
      yaw.current += diff * Math.min(1, dt * 5)
    }
    prev.current.copy(p)
    g.current.position.copy(p)
    g.current.rotation.y = yaw.current
  })
  return (
    <group ref={g}>
      <Avatar mode="wave" walkRef={walk} scale={0.85} />
    </group>
  )
}
