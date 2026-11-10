import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { STATIONS } from '../layout'
import { scroll, pointer, debug } from '../scroll'
import { ease } from './common'

const V = (a) => new THREE.Vector3(...a)

// push the subject to the side opposite the text panel (or up, on phones)
function adjust(cam, look, side, portrait, mult = 1) {
  const c = V(cam), l = V(look)
  const d = c.distanceTo(l)
  if (portrait) {
    l.y -= d * 0.2
  } else {
    const f = l.clone().sub(c); f.y = 0; f.normalize()
    const right = new THREE.Vector3(-f.z, 0, f.x)
    const k = d * 0.27 * mult * (side === 'left' ? -1 : 1)
    c.addScaledVector(right, k); l.addScaledVector(right, k)
  }
  return { cam: c, look: l }
}

function build(size) {
  const portrait = size.width / size.height < 0.9
  const st = STATIONS.map((s) => {
    const base = adjust(s.cam, s.look, s.side, portrait, s.shift ?? 1)
    return {
      shot: s.shot,
      ...base,
      exit: s.exit && adjust(s.exit.cam, s.exit.look, s.side, portrait, s.shift ?? 1),
      entry: s.entry && adjust(s.entry.cam, s.entry.look, s.side, portrait, s.shift ?? 1),
      label: s.label,
    }
  })
  // consecutive stations of the same shot share one smooth curve
  const groups = []
  st.forEach((s, i) => {
    const last = groups[groups.length - 1]
    if (last && last.shot === s.shot && !s.entry) last.idx.push(i)
    else groups.push({ shot: s.shot, idx: [i] })
  })
  groups.forEach((g) => {
    const cams = g.idx.map((i) => st[i].cam)
    const looks = g.idx.map((i) => st[i].look)
    g.n = cams.length
    if (g.n > 1) {
      g.pc = new THREE.CatmullRomCurve3(cams, false, 'catmullrom', 0.5)
      g.lc = new THREE.CatmullRomCurve3(looks, false, 'catmullrom', 0.5)
    }
  })
  return { st, groups }
}

export default function Rig() {
  const { camera, size } = useThree()
  const sm = useRef(0)
  const intro = useRef(0)
  const { st, groups } = useMemo(() => build(size), [size.width, size.height]) // eslint-disable-line
  const p = useMemo(() => new THREE.Vector3(), [])
  const l = useMemo(() => new THREE.Vector3(), [])
  const q = useMemo(() => new THREE.Vector3(), [])

  useFrame((_, dt) => {
    const target = debug.t !== null ? debug.t : scroll.t
    sm.current = debug.t !== null ? target : THREE.MathUtils.damp(sm.current, target, 3.2, dt)
    const t = THREE.MathUtils.clamp(sm.current, 0, st.length - 1)
    scroll.sm = t
    const i = Math.min(Math.floor(t), st.length - 2)
    const f = t - i
    const A = st[i], Bn = st[i + 1]
    let flash = 0, label = ''
    let shot = A.shot

    if (t >= st.length - 1) {
      p.copy(st[st.length - 1].cam); l.copy(st[st.length - 1].look); shot = st[st.length - 1].shot
    } else if (Bn.entry) {
      // a "cut": fly toward the exit point, flash, then arrive from the entry point
      const ex = A.exit
      if (f < 0.5) {
        const k = ease(f / 0.5)
        p.copy(A.cam).lerp(ex.cam, k * k)
        l.copy(A.look).lerp(ex.look, k * k)
      } else {
        const k = ease((f - 0.5) / 0.5)
        shot = Bn.shot
        p.copy(Bn.entry.cam).lerp(Bn.cam, k)
        l.copy(Bn.entry.look).lerp(Bn.look, k)
      }
      flash = Math.pow(Math.max(0, 1 - Math.abs(f * 2 - 1) * 1.6), 1.2)
      label = A.label || ''
    } else {
      const g = groups.find((gr) => gr.idx.includes(i))
      const li = g.idx.indexOf(i)
      if (g.n > 1) {
        const u = THREE.MathUtils.clamp((li + f) / (g.n - 1), 0, 1)
        g.pc.getPoint(u, p)
        g.lc.getPoint(u, l)
      } else {
        p.copy(A.cam); l.copy(A.look)
      }
    }
    scroll.flash = flash
    scroll.label = label
    scroll.shot = shot

    // soft parallax + opening fly-in
    intro.current = Math.min(1, intro.current + dt / 3)
    const e = 1 - Math.pow(1 - intro.current, 3)
    p.x += pointer.x * 0.45
    p.y += pointer.y * 0.25 + (1 - e) * 5 * (t < 0.5 ? 1 : 0)
    p.z += (1 - e) * 7 * (t < 0.5 ? 1 : 0)
    camera.position.copy(p)
    q.copy(l)
    camera.lookAt(q)
  })
  return null
}
