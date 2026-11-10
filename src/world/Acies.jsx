import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { B, Cyl, S, T, Bob, Rod, Edges, COL, glow } from './common'
import { Avatar } from './Avatar'

/* tiny live charts on the monitors */
function Chart({ kind }) {
  const g = useRef()
  const N = 6
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (kind === 'donut') { g.current.rotation.z = -t * 0.6; return }
    g.current.children.forEach((c, i) => {
      const h = 0.15 + 0.85 * Math.abs(Math.sin(t * 0.9 + i * 0.8))
      if (kind === 'bars') { c.scale.y = h; c.position.y = -0.3 + (h * 0.55) / 2 }
      else {
        const body = c.children[0]
        body.scale.y = 0.15 + h * 0.3
        body.position.y = Math.sin(t * 0.9 + i) * 0.1
        c.children[1].position.y = body.position.y
      }
    })
  })
  if (kind === 'donut')
    return (
      <group ref={g}>
        {[[0, 2.2, COL.mint], [2.3, 1.9, COL.coral], [4.3, 1.6, COL.sky]].map(([a, l, c], i) => (
          <mesh key={i}><ringGeometry args={[0.2, 0.36, 24, 1, a, l]} /><meshBasicMaterial color={glow(c, 1.4)} toneMapped={false} side={THREE.DoubleSide} /></mesh>
        ))}
      </group>
    )
  return (
    <group ref={g}>
      {Array.from({ length: N }, (_, i) =>
        kind === 'bars' ? (
          <mesh key={i} position={[-0.55 + i * 0.22, -0.3, 0]}><boxGeometry args={[0.14, 0.55, 0.02]} /><meshBasicMaterial color={glow(i % 2 ? COL.mint : COL.sky, 1.4)} toneMapped={false} /></mesh>
        ) : (
          <group key={i} position={[-0.55 + i * 0.22, 0, 0]}>
            <mesh><boxGeometry args={[0.13, 1, 0.02]} /><meshBasicMaterial color={glow(i % 2 ? COL.mint : COL.coral, 1.4)} toneMapped={false} /></mesh>
            <mesh><boxGeometry args={[0.025, 0.6, 0.02]} /><meshBasicMaterial color={glow(i % 2 ? COL.mint : COL.coral, 1.4)} toneMapped={false} /></mesh>
          </group>
        )
      )}
    </group>
  )
}

function Monitor({ kind, ...p }) {
  return (
    <group {...p}>
      <B s={[1.7, 1.05, 0.08]} c="#1b1a30" m={0.4} />
      <mesh position={[0, 0, 0.045]}><planeGeometry args={[1.55, 0.92]} /><meshBasicMaterial color="#0a0f2e" /></mesh>
      <group position={[0, 0, 0.06]}><Chart kind={kind} /></group>
      <B s={[0.12, 0.4, 0.1]} c="#1b1a30" position={[0, -0.7, -0.02]} />
    </group>
  )
}

function Desk({ x, children }) {
  return (
    <group position={[x, 0, -2.5]}>
      <B s={[3.4, 0.12, 1.4]} c="#3a2a55" position={[0, 0.78, 0]} />
      <B s={[0.12, 0.78, 1.2]} c="#2a1f44" position={[-1.6, 0.39, 0]} />
      <B s={[0.12, 0.78, 1.2]} c="#2a1f44" position={[1.6, 0.39, 0]} />
      {children}
    </group>
  )
}

function Chair({ spin = false, ...p }) {
  const g = useRef()
  useFrame(({ clock }) => { if (spin) g.current.rotation.y = Math.sin(clock.elapsedTime * 0.8) * 1.2 })
  return (
    <group {...p}>
      <group ref={g}>
        <Cyl r={0.04} h={0.5} c="#222" position={[0, 0.25, 0]} seg={6} />
        <B s={[0.8, 0.12, 0.8]} c="#ff6b8a" position={[0, 0.55, 0]} />
        <B s={[0.8, 0.8, 0.1]} c="#ff6b8a" position={[0, 1.0, 0.4]} />
      </group>
    </group>
  )
}

/* lineage whiteboard: dots flow along the edges (the React Flow bit) */
function Lineage() {
  const nodes = {
    a: [-2.0, 0.7], b: [-2.0, -0.65], c: [-0.65, 0.02], d: [0.75, 0.02], e: [2.1, 0.7], f: [2.1, -0.65],
  }
  const edges = [['a', 'c'], ['b', 'c'], ['c', 'd'], ['d', 'e'], ['d', 'f']]
  const dots = useRef()
  useFrame(({ clock }) => {
    dots.current.children.forEach((m, i) => {
      const [a, b] = edges[i % edges.length]
      const ph = (clock.elapsedTime * 0.5 + i * 0.37) % 1
      m.position.set(nodes[a][0] + (nodes[b][0] - nodes[a][0]) * ph, nodes[a][1] + (nodes[b][1] - nodes[a][1]) * ph, 0.08)
    })
  })
  const labels = { a: 'src_a', b: 'src_b', c: 'clean', d: 'merge', e: 'chart', f: 'pivot' }
  const colors = { a: COL.sky, b: COL.sky, c: COL.amber, d: COL.violet, e: COL.mint, f: COL.mint }
  return (
    <group>
      {edges.map(([a, b], i) => (
        <Rod key={i} a={[nodes[a][0], nodes[a][1], 0.05]} b={[nodes[b][0], nodes[b][1], 0.05]} r={0.025} color="#8f8ab8" k={0.8} />
      ))}
      {Object.entries(nodes).map(([k, [x, y]]) => (
        <group key={k} position={[x, y, 0.06]}>
          <B s={[0.95, 0.42, 0.06]} c="#1d1948" />
          <Edges s={[0.95, 0.42, 0.06]} c={colors[k]} k={1.5} />
          <T size={0.17} color={colors[k]} position={[0, 0, 0.05]}>{labels[k]}</T>
        </group>
      ))}
      <group ref={dots}>
        {Array.from({ length: 10 }, (_, i) => <mesh key={i}><sphereGeometry args={[0.06, 8, 8]} /><meshBasicMaterial color={glow(COL.yellow, 2.5)} toneMapped={false} /></mesh>)}
      </group>
    </group>
  )
}

function Scheduler() {
  const rows = [['etl_nightly', 'ok'], ['sync_rates', 'ok'], ['refresh_dash', 'run'], ['backfill_q3', 'fail'], ['cleanup', 'ok']]
  const dots = useRef()
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    dots.current.children.forEach((d, i) => {
      const s = rows[i][1]
      const k = s === 'ok' ? 1.6 : s === 'run' ? 1.4 + Math.sin(t * 6) * 1.2 : Math.sin(t * 5) > 0 ? 2.6 : 0.4
      d.material.color.copy(glow(s === 'ok' ? COL.mint : s === 'run' ? COL.amber : COL.coral, Math.max(0.3, k)))
    })
  })
  return (
    <group>
      <B s={[3.0, 2.3, 0.08]} c="#17143a" />
      <Edges s={[3.0, 2.3, 0.08]} c={COL.violet} k={1.4} />
      <T size={0.2} color={COL.violet} k={1.5} position={[0, 0.92, 0.06]}>JOBS / cron</T>
      {rows.map(([n], i) => (
        <T key={n} size={0.17} color="#d6d1ff" anchor="left" position={[-1.3, 0.45 - i * 0.37, 0.06]}>{n}</T>
      ))}
      <group ref={dots}>
        {rows.map((_, i) => (
          <mesh key={i} position={[1.2, 0.45 - i * 0.37, 0.07]}><sphereGeometry args={[0.09, 10, 10]} /><meshBasicMaterial color={glow(COL.mint, 1.6)} toneMapped={false} /></mesh>
        ))}
      </group>
    </group>
  )
}

/* floating hologram "30+ chart types" carousel */
function Holos() {
  const g = useRef()
  useFrame((_, dt) => { g.current.rotation.y += dt * 0.5 })
  const M = (c, o = 0.8) => <meshBasicMaterial color={glow(c, 1.4)} transparent opacity={o} toneMapped={false} side={THREE.DoubleSide} depthWrite={false} />
  return (
    <group position={[0, 8.2, -0.5]}>
      <T size={0.5} color={COL.mint} k={1.5} position={[0, 2.0, 0]}>30+ chart types</T>
      <group ref={g}>
        {/* candlestick */}
        <Bob position={[3.2, 0, 0]} phase={0}>
          <group rotation={[0, Math.PI / 2, 0]}>
            {[0, 1, 2, 3, 4].map((i) => (
              <group key={i} position={[-0.6 + i * 0.3, 0, 0]}>
                <mesh position={[0, 0.1 * Math.sin(i * 2), 0]}><boxGeometry args={[0.18, 0.4 + (i % 3) * 0.2, 0.05]} />{M(i % 2 ? COL.mint : COL.coral)}</mesh>
                <mesh><boxGeometry args={[0.03, 1.1, 0.03]} />{M(i % 2 ? COL.mint : COL.coral)}</mesh>
              </group>
            ))}
          </group>
        </Bob>
        {/* sunburst */}
        <Bob position={[-1.6, 0, -2.8]} phase={2}>
          <group rotation={[0, -Math.PI / 6, 0]}>
            {[[0.15, 0.4, [COL.violet, COL.sky]], [0.45, 0.75, [COL.coral, COL.amber, COL.mint]], [0.8, 1.1, [COL.sky, COL.violet, COL.coral, COL.mint]]].map(([a, b, cs], ri) => {
              const n = cs.length
              return cs.map((c, k) => (
                <mesh key={ri + '-' + k}><ringGeometry args={[a, b, 20, 1, (k / n) * Math.PI * 2, (Math.PI * 2) / n - 0.06]} />{M(c, 0.85)}</mesh>
              ))
            })}
          </group>
        </Bob>
        {/* boxplot */}
        <Bob position={[-1.6, 0, 2.8]} phase={4}>
          <group rotation={[0, Math.PI / 6, 0]}>
            {[0, 1, 2].map((i) => (
              <group key={i} position={[-0.6 + i * 0.6, 0, 0]}>
                <mesh position={[0, i * 0.1, 0]}><boxGeometry args={[0.35, 0.5 + i * 0.1, 0.04]} />{M(COL.sky, 0.7)}</mesh>
                <mesh position={[0, i * 0.1, 0]}><boxGeometry args={[0.03, 1.2, 0.03]} />{M(COL.sky, 0.9)}</mesh>
                <mesh position={[0, 0.1 + i * 0.1, 0.03]}><boxGeometry args={[0.4, 0.04, 0.04]} />{M(COL.yellow, 1)}</mesh>
              </group>
            ))}
          </group>
        </Bob>
      </group>
    </group>
  )
}

export default function Acies() {
  return (
    <group>
      <pointLight position={[0, 4, 2]} color="#ffd9a8" intensity={55} distance={20} decay={2} />
      <pointLight position={[0, 7, 9]} color="#8b5cf6" intensity={30} distance={26} decay={2} />
      {/* floor + glass walls */}
      <B s={[11.5, 0.3, 9.5]} c="#2b2550" position={[0, -0.15, 0]} m={0.3} r={0.5} />
      <B s={[11.5, 5, 0.12]} c="#6c5ce7" position={[0, 2.5, -4.7]} ei={0} flat>
        <meshStandardMaterial color="#2a2368" transparent opacity={0.55} roughness={0.2} metalness={0.4} />
      </B>
      <B s={[0.12, 5, 9.5]} c="#2a2368" position={[-5.75, 2.5, 0]}>
        <meshStandardMaterial color="#2a2368" transparent opacity={0.35} roughness={0.2} metalness={0.4} />
      </B>
      <Edges s={[11.5, 5, 9.5]} c={COL.violet} k={1.2} position={[0, 2.5, 0]} />
      {/* sign */}
      <B s={[5.6, 1.3, 0.2]} c="#0d0b26" position={[0, 5.75, -4.6]} />
      <Edges s={[5.6, 1.3, 0.2]} c={COL.coral} k={1.8} position={[0, 5.75, -4.6]} />
      <T size={0.95} color={COL.coral} k={1.9} position={[0, 5.75, -4.45]}>ACIES</T>

      {/* desks */}
      <Desk x={-3.3}>
        <Monitor kind="bars" position={[-0.8, 1.55, -0.3]} />
        <Monitor kind="candle" position={[0.9, 1.55, -0.3]} rotation={[0, -0.15, 0]} />
      </Desk>
      <Chair position={[-3.3, 0, -1.3]} />
      <Avatar hoodie="#ff9f6b" hair="#3b2a20" glasses={false} bun={false} mode="type" position={[-3.3, 0.35, -1.5]} rotation={[0, Math.PI, 0]} scale={0.7} skin="#b7805a" />
      <Desk x={3.3}>
        <Monitor kind="donut" position={[0, 1.55, -0.3]} />
      </Desk>
      <Chair spin position={[3.3, 0, -1.3]} />

      {/* lineage whiteboard + coworker explaining it */}
      <group position={[0, 3.0, -4.58]}>
        <B s={[5.6, 2.7, 0.1]} c="#14113a" />
        <Edges s={[5.6, 2.7, 0.1]} c={COL.sky} k={1.4} />
        <T size={0.2} color={COL.sky} k={1.4} position={[-2.1, 1.1, 0.06]} anchor="left">data lineage</T>
        <group position={[0, -0.1, 0.05]}><Lineage /></group>
      </group>
      <Avatar hoodie="#5cc8ff" hair="#e8e0d0" glasses mode="point" position={[0.2, 0, -2.6]} rotation={[0, Math.PI, 0]} scale={0.75} skin="#f0c8a8" bun={false} />

      {/* scheduler on the side wall */}
      <group position={[-5.62, 2.7, -0.8]} rotation={[0, Math.PI / 2, 0]}><Scheduler /></group>

      {/* coffee machine + plant */}
      <B s={[0.9, 1.3, 0.8]} c="#1b1a30" position={[4.7, 0.65, 0.8]} />
      <B s={[0.5, 0.1, 0.04]} c="#5ef2c0" ei={2} position={[4.7, 1.0, 1.22]} />
      <Cyl r={0.4} rb={0.3} h={0.6} c="#ff9f6b" position={[-4.7, 0.3, 2.8]} />
      {[0, 1, 2, 3, 4].map((i) => (
        <S key={i} r={0.3} c="#5ef2c0" scale={[0.3, 1.5, 0.1]} position={[-4.7 + Math.cos(i * 1.3) * 0.2, 1.3, 2.8 + Math.sin(i * 1.3) * 0.2]} rotation={[Math.sin(i * 1.3) * 0.5, 0, -Math.cos(i * 1.3) * 0.5]} />
      ))}
      <Holos />
    </group>
  )
}
