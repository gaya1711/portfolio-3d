import { useRef, useMemo, useLayoutEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { B, Cyl, S, T, Bob, Edges, COL, glow, dummy, rng, ease, clamp01 } from './common'

/* ================= window chrome ================= */
export function Win({ title, accent = COL.mint, children, w = 7.4, h = 4.5 }) {
  return (
    <group>
      <B s={[w, h, 0.14]} c="#0f0d28" m={0.3} r={0.5} />
      <B s={[w, 0.5, 0.16]} c="#1f1b4a" position={[0, h / 2 - 0.25, 0.01]} />
      {[COL.coral, COL.yellow, COL.mint].map((c, i) => (
        <mesh key={i} position={[-w / 2 + 0.32 + i * 0.28, h / 2 - 0.25, 0.1]}><circleGeometry args={[0.09, 14]} /><meshBasicMaterial color={glow(c, 1.2)} toneMapped={false} /></mesh>
      ))}
      <T size={0.22} color="#b9b3ee" anchor="left" position={[-w / 2 + 1.35, h / 2 - 0.25, 0.1]}>{title}</T>
      <Edges s={[w, h, 0.14]} c={accent} k={1.8} />
      <group position={[0, -0.25, 0.1]}>{children}</group>
    </group>
  )
}

/* ================= 1. robot digital twin: a rover mowing a lawn with real BFS detours ================= */
const COLS = 18, ROWS = 9, CELL = 0.34
const OBST = new Set(['4,2', '4,3', '9,5', '9,6', '10,6', '13,1', '14,1', '14,2'])
const cp = (c, r) => [(c - (COLS - 1) / 2) * CELL, (r - (ROWS - 1) / 2) * CELL]

function buildPath() {
  const free = (c, r) => c >= 0 && r >= 0 && c < COLS && r < ROWS && !OBST.has(`${c},${r}`)
  const key = (p) => p[0] + p[1] * COLS
  const bfs = (from, to) => {
    const prev = new Map([[key(from), null]])
    const q = [from]
    while (q.length) {
      const cur = q.shift()
      if (cur[0] === to[0] && cur[1] === to[1]) break
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const n = [cur[0] + dx, cur[1] + dz]
        if (free(n[0], n[1]) && !prev.has(key(n))) { prev.set(key(n), cur); q.push(n) }
      }
    }
    const out = []
    for (let c = to; c; c = prev.get(key(c))) out.unshift(c)
    return out
  }
  const targets = []
  let dir = 1
  for (let r = 0; r < ROWS; r += 2) {
    const cs = [...Array(COLS).keys()]
    if (dir < 0) cs.reverse()
    dir *= -1
    cs.forEach((c) => free(c, r) && targets.push([c, r]))
  }
  const path = [targets[0]]
  for (let i = 1; i < targets.length; i++) path.push(...bfs(targets[i - 1], targets[i]).slice(1))
  return path
}

export function RobotTwin() {
  const path = useMemo(buildPath, [])
  const grass = useRef(), rover = useRef(), blade = useRef(), beacon = useRef()
  const prog = useRef(0), marked = useRef(-1), pause = useRef(0), heading = useRef(0), acc = useRef(0)
  const cut = useRef(new Set())
  const base = useMemo(() => {
    const r = rng(8)
    return Array.from({ length: COLS * ROWS }, () => ({ j: [(r() - 0.5) * 0.08, (r() - 0.5) * 0.08], s: 0.8 + r() * 0.5, g: r() }))
  }, [])
  const [tele, setTele] = useState({ bat: 100, cov: 0 })
  const free = COLS * ROWS - OBST.size

  const setCell = (c, r, isCut) => {
    const i = r * COLS + c
    const [x, z] = cp(c, r)
    const d = base[i]
    dummy.position.set(x + d.j[0], isCut ? 0.06 : 0.14, z + d.j[1])
    dummy.scale.set(1, isCut ? 0.35 : d.s, 1)
    dummy.updateMatrix()
    grass.current.setMatrixAt(i, dummy.matrix)
    const col = new THREE.Color(isCut ? '#b8ffd8' : d.g > 0.5 ? '#2fc476' : '#22a45f')
    if (isCut) col.multiplyScalar(1.1)
    grass.current.setColorAt(i, col)
  }
  const reset = () => {
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (!OBST.has(`${c},${r}`)) setCell(c, r, false)
    cut.current = new Set()
    prog.current = 0; marked.current = -1
    grass.current.instanceMatrix.needsUpdate = true
    grass.current.instanceColor.needsUpdate = true
  }
  useLayoutEffect(() => {
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      if (OBST.has(`${c},${r}`)) { dummy.position.set(0, -9, 0); dummy.scale.setScalar(0.001); dummy.updateMatrix(); grass.current.setMatrixAt(r * COLS + c, dummy.matrix); grass.current.setColorAt(r * COLS + c, new THREE.Color('#000')) }
    }
    reset()
  }, []) // eslint-disable-line

  useFrame((s, dt) => {
    blade.current.rotation.y += dt * 25
    beacon.current.color.copy(glow(COL.coral, 1 + (Math.sin(s.clock.elapsedTime * 8) > 0 ? 1.8 : 0)))
    if (pause.current > 0) { pause.current -= dt; if (pause.current <= 0) reset(); return }
    prog.current += Math.min(dt, 0.05) * 7
    if (prog.current >= path.length - 1) { pause.current = 2.2; return }
    const i = Math.floor(prog.current), f = prog.current - i
    const [c0, r0] = path[i], [c1, r1] = path[i + 1]
    const [x0, z0] = cp(c0, r0), [x1, z1] = cp(c1, r1)
    rover.current.position.set(x0 + (x1 - x0) * f, 0.22, z0 + (z1 - z0) * f)
    let diff = Math.atan2(x1 - x0, z1 - z0) - heading.current
    diff = Math.atan2(Math.sin(diff), Math.cos(diff))
    heading.current += diff * Math.min(1, dt * 14)
    rover.current.rotation.y = heading.current
    let dirty = false
    while (marked.current < i) {
      marked.current++
      const [c, r] = path[marked.current]
      for (const rr of [r, r + 1]) {
        if (rr < ROWS && !OBST.has(`${c},${rr}`) && !cut.current.has(`${c},${rr}`)) { cut.current.add(`${c},${rr}`); setCell(c, rr, true); dirty = true }
      }
    }
    if (dirty) { grass.current.instanceMatrix.needsUpdate = true; grass.current.instanceColor.needsUpdate = true }
    acc.current += dt
    if (acc.current > 0.25) {
      acc.current = 0
      setTele({ bat: Math.round(100 - (prog.current / path.length) * 34), cov: Math.round((cut.current.size / free) * 100) })
    }
  })

  return (
    <group position={[0, 0.1, 0]}>
     <group position={[0, 0.1, 0]} rotation={[1.02, 0, 0]}>
      <B s={[COLS * CELL + 0.3, 0.1, ROWS * CELL + 0.3]} c="#0b2a1c" position={[0, 0, 0]} />
      <instancedMesh ref={grass} args={[null, null, COLS * ROWS]} position={[0, 0, 0]}>
        <coneGeometry args={[0.13, 0.42, 4]} />
        <meshStandardMaterial flatShading roughness={0.9} />
      </instancedMesh>
      {[...OBST].map((k) => {
        const [c, r] = k.split(',').map(Number)
        const [x, z] = cp(c, r)
        return <S key={k} r={0.17} c="#8d8aa8" position={[x, 0.18, z]} scale={[1.2, 0.8, 1]} seg={6} />
      })}
      {/* the rover has a face */}
      <group ref={rover} scale={0.72}>
        <B s={[0.9, 0.42, 1.1]} c="#f4efe6" m={0.2} position={[0, 0.35, 0]} />
        <B s={[0.7, 0.16, 0.6]} c="#8b5cf6" position={[0, 0.62, -0.1]} />
        <S r={0.1} c="#fff" position={[-0.2, 0.4, 0.56]} seg={8} />
        <S r={0.1} c="#fff" position={[0.2, 0.4, 0.56]} seg={8} />
        <S r={0.05} c="#111" position={[-0.2, 0.4, 0.65]} seg={8} />
        <S r={0.05} c="#111" position={[0.2, 0.4, 0.65]} seg={8} />
        <B s={[0.05, 0.5, 0.05]} c="#aaa" position={[0.3, 0.9, -0.3]} />
        <mesh position={[0.3, 1.18, -0.3]}><sphereGeometry args={[0.1, 8, 8]} /><meshBasicMaterial ref={beacon} color={glow(COL.coral, 2)} toneMapped={false} /></mesh>
        {[[-0.5, 0.35], [0.5, 0.35], [-0.5, -0.35], [0.5, -0.35]].map(([x, z], i) => (
          <Cyl key={i} r={0.2} h={0.16} c="#222" position={[x, 0.2, z]} rotation={[0, 0, Math.PI / 2]} seg={10} />
        ))}
        <mesh ref={blade} position={[0, 0.06, 0]}><cylinderGeometry args={[0.55, 0.55, 0.03, 3]} /><meshBasicMaterial color={glow(COL.amber, 2)} toneMapped={false} /></mesh>
      </group>
     </group>
      <T size={0.19} color={COL.mint} k={1.4} position={[0, -1.78, 0.05]}>
        {`BAT ${String(tele.bat).padStart(3, '0')}%  COVERAGE ${String(tele.cov).padStart(3, '0')}%  ws://live`}
      </T>
    </group>
  )
}

/* ================= 2. reconciliation copilot: a bot matching two messy tables ================= */
const FLAG = [2, 4]
function Cell({ x, y, r, c, st, accent }) {
  const m = useRef()
  useFrame(() => {
    const s = st.current
    let col = r === 0 ? accent : (c + r) % 2 ? '#2a2668' : '#231f58'
    let k = r === 0 ? 1.3 : 1
    if (s.row === r) { col = FLAG.includes(r) ? COL.coral : COL.mint; k = 2 }
    else if (s.row > r || s.done) { col = FLAG.includes(r) && !s.done ? COL.coral : COL.mint; k = 0.55 }
    m.current.color.set(col).multiplyScalar(k)
  })
  return (
    <mesh position={[x, y, 0]}>
      <planeGeometry args={[0.5, 0.25]} />
      <meshBasicMaterial ref={m} toneMapped={false} />
    </mesh>
  )
}
function MiniTable({ x, st, accent, title, flip }) {
  return (
    <group position={[x, 0, 0]}>
      <T size={0.18} color={accent} k={1.4} position={[0, 1.2, 0]}>{title}</T>
      {Array.from({ length: 5 }, (_, r) =>
        Array.from({ length: 4 }, (_, c) => <Cell key={r + '-' + c} x={(c - 1.5) * 0.54} y={0.85 - r * 0.29} r={r} c={flip ? 3 - c : c} st={st} accent={accent} />)
      )}
    </group>
  )
}
export function Reconcile() {
  const st = useRef({ row: -1, done: false })
  const bot = useRef(), beamL = useRef(), beamR = useRef(), merged = useRef()
  const [msg, setMsg] = useState('hi! matching columns...')
  const last = useRef('')
  useFrame(({ clock }) => {
    const t = clock.elapsedTime % 11
    const s = st.current
    s.done = t >= 7
    s.row = t < 1 ? -1 : t < 7 ? Math.min(4, Math.floor((t - 1) / 1.2)) : -1
    const row = s.row < 0 ? 2 : s.row
    const y = 0.85 - row * 0.29
    bot.current.position.y += (y - bot.current.position.y) * 0.18
    const on = s.row >= 0
    const flagged = on && FLAG.includes(s.row)
    ;[beamL, beamR].forEach((b) => {
      b.current.visible = on
      b.current.position.y = bot.current.position.y
      b.current.material.color.copy(glow(flagged ? COL.coral : COL.mint, 2))
    })
    merged.current.scale.setScalar(ease(clamp01((t - 7) / 0.6)) * (t < 10.6 ? 1 : 0.001) + 0.001)
    const m = t < 1 ? 'hi! matching columns...' : s.done ? 'merged! report ready' : flagged ? 'CONFLICT - asking LLM' : s.row === 0 ? 'cust_nm ~ customer 0.93' : 'match'
    if (m !== last.current) { last.current = m; setMsg(m) }
  })
  return (
    <group position={[0, 0.2, 0]}>
      <MiniTable x={-2.5} st={st} accent={COL.sky} title="sales_q3.csv" />
      <MiniTable x={2.5} st={st} accent={COL.violet} title="crm_export.xlsx" flip />
      <mesh ref={beamL} position={[-1.15, 0, 0.02]}><boxGeometry args={[1.9, 0.05, 0.02]} /><meshBasicMaterial toneMapped={false} /></mesh>
      <mesh ref={beamR} position={[1.15, 0, 0.02]}><boxGeometry args={[1.9, 0.05, 0.02]} /><meshBasicMaterial toneMapped={false} /></mesh>
      <group ref={bot} position={[0, 0.3, 0.3]}>
        <Bob amp={0.05} speed={3}>
          <S r={0.34} c="#5cc8ff" ei={0.6} />
          <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.42, 0.03, 8, 24]} /><meshBasicMaterial color={glow(COL.amber, 1.8)} toneMapped={false} /></mesh>
          <S r={0.1} c="#fff" position={[-0.13, 0.05, 0.3]} seg={8} /><S r={0.1} c="#fff" position={[0.13, 0.05, 0.3]} seg={8} />
          <S r={0.045} c="#111" position={[-0.13, 0.05, 0.39]} seg={8} /><S r={0.045} c="#111" position={[0.13, 0.05, 0.39]} seg={8} />
          <B s={[0.03, 0.3, 0.03]} c="#aaa" position={[0, 0.5, 0]} />
          <mesh position={[0, 0.7, 0]}><sphereGeometry args={[0.07, 8, 8]} /><meshBasicMaterial color={glow(COL.coral, 2.4)} toneMapped={false} /></mesh>
        </Bob>
      </group>
      <group position={[0, -1.15, 0.1]}>
        <B s={[4.4, 0.34, 0.03]} c="#0b0922" />
        <T size={0.2} color={COL.yellow} k={1.4} position={[0, 0, 0.05]}>{msg}</T>
      </group>
      <group ref={merged} position={[0, -1.7, 0]}>
        {Array.from({ length: 4 }, (_, i) => (
          <mesh key={i} position={[(i - 1.5) * 0.5, 0, 0]}><planeGeometry args={[0.46, 0.2]} /><meshBasicMaterial color={glow(COL.mint, 1.6)} toneMapped={false} /></mesh>
        ))}
        <T size={0.15} color={COL.mint} k={1.4} position={[2.15, 0, 0]} anchor="left">merged.csv</T>
      </group>
    </group>
  )
}

/* ================= 3. LDA: words drift, then fall into topics ================= */
const TOPICS = [
  { name: 'billing', col: COL.coral, c: [-2.4, 0.5], words: ['refund', 'charge', 'invoice', 'fee', 'payment', 'overcharged', 'bill', 'card'], sent: -0.6 },
  { name: 'delivery', col: COL.amber, c: [2.4, 0.5], words: ['late', 'package', 'shipping', 'courier', 'delayed', 'tracking', 'lost', 'damaged'], sent: -0.3 },
  { name: 'service', col: COL.mint, c: [0, -0.85], words: ['agent', 'support', 'wait', 'call', 'response', 'helpline', 'manager', 'rude'], sent: 0.4 },
]
export function Lda() {
  const items = useMemo(() => {
    const r = rng(12)
    const out = []
    TOPICS.forEach((t, ti) => t.words.forEach((w, wi) => {
      const a = (wi / t.words.length) * Math.PI * 2
      out.push({ w, ti, sx: (r() * 2 - 1) * 3.1, sy: (r() * 2 - 1) * 1.5, tx: t.c[0] + Math.cos(a) * 0.95, ty: t.c[1] + Math.sin(a) * 0.5, ph: r() * 6, col: t.col })
    }))
    return out
  }, [])
  const g = useRef()
  const labels = useRef(), bars = useRef()
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const cyc = t % 11
    const p = ease(clamp01((cyc - 2.5) / 2)) * (1 - ease(clamp01((cyc - 9.5) / 1.2)))
    g.current.children.forEach((c, i) => {
      const it = items[i]
      const dx = Math.sin(t * 0.6 + it.ph) * 0.18, dy = Math.cos(t * 0.5 + it.ph) * 0.12
      c.position.x = THREE.MathUtils.lerp(it.sx + dx, it.tx + dx * 0.4, p)
      c.position.y = THREE.MathUtils.lerp(it.sy + dy, it.ty + dy * 0.4, p)
      c.children[0].fillOpacity = 0.35 + 0.65 * p
    })
    labels.current.children.forEach((c) => { c.children[0].fillOpacity = p })
    bars.current.children.forEach((c, i) => { c.scale.x = Math.max(0.001, p * Math.abs(TOPICS[i].sent) * 1.6); c.position.x = TOPICS[i].c[0] + Math.sign(TOPICS[i].sent) * c.scale.x * 0.5 })
  })
  return (
    <group position={[0, 0.1, 0]}>
      <group ref={g}>
        {items.map((it, i) => (
          <group key={i}><T size={0.2} color={it.col} k={1.3} fillOpacity={0.4}>{it.w}</T></group>
        ))}
      </group>
      <group ref={labels}>
        {TOPICS.map((t, i) => (
          <group key={t.name} position={[t.c[0], t.c[1] + 1.05, 0]}><T size={0.19} color="#fff" k={1.2} fillOpacity={0}>{`topic ${i + 1}: ${t.name}`}</T></group>
        ))}
      </group>
      <group ref={bars}>
        {TOPICS.map((t, i) => (
          <mesh key={i} position={[t.c[0], t.c[1] - 1.12, 0]}><boxGeometry args={[1, 0.08, 0.02]} /><meshBasicMaterial color={glow(t.sent < 0 ? COL.coral : COL.mint, 1.8)} toneMapped={false} /></mesh>
        ))}
      </group>
      <T size={0.14} color="#9d97d8" position={[0, -1.78, 0]}>sentiment per topic (spaCy + NLTK)</T>
    </group>
  )
}
