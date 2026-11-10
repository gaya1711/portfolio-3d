import { useRef, useMemo, useLayoutEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { B, Cyl, S, T, Bob, COL, glow, dummy, rng } from './common'
import { scroll, goTo } from '../scroll'

const HERO = [
  ['$ whoami', '#5ef2c0'],
  ['  gayathri - software engineer', '#efeaff'],
  ['$ cat about.txt', '#5ef2c0'],
  ['  MS CS @ USC | React | Python | 3D', '#c9c2ff'],
  ['$ ls ~', '#5ef2c0'],
  ['  experience/  projects/  education/', '#ffb86b'],
  ['$ ./enter --screen', '#5ef2c0'],
  ['  > click the screen to go inside', '#ff6b8a'],
]
const END = [
  ['$ npm ls --depth=0', '#5ef2c0'],
  ['  gayathri@2026  (open to work)', '#efeaff'],
  ['$ ./say-hello.sh', '#5ef2c0'],
  ['  ok - thanks for scrolling all the way', '#ffb86b'],
  ['$ exit 0', '#5ef2c0'],
  ['  session closed. say hi!', '#ff6b8a'],
]

function draw(term, lines, tt, hover, title) {
  const g = term.ctx
  g.fillStyle = '#090818'
  g.fillRect(0, 0, 1024, 600)
  g.fillStyle = '#17143a'
  g.fillRect(0, 0, 1024, 56)
  ;['#ff6b8a', '#ffe066', '#5ef2c0'].forEach((c, i) => {
    g.fillStyle = c
    g.beginPath(); g.arc(34 + i * 30, 28, 8, 0, 7); g.fill()
  })
  g.fillStyle = '#8f8ab8'
  g.font = '500 22px "JetBrains Mono", monospace'
  g.fillText(title, 130, 35)
  g.font = '700 29px "JetBrains Mono", monospace'
  const cps = 26, gap = 8
  let chars = tt * cps, y = 118, lastX = 40, lastY = 118
  for (const [s, col] of lines) {
    const n = Math.max(0, Math.min(s.length, Math.floor(chars)))
    if (n > 0) {
      g.fillStyle = col
      g.fillText(s.slice(0, n), 40, y)
      lastX = 40 + g.measureText(s.slice(0, n)).width
      lastY = y
    }
    chars -= s.length + gap
    y += 54
  }
  if (Math.floor(tt * 2) % 2 === 0) { g.fillStyle = '#5ef2c0'; g.fillRect(lastX + 6, lastY - 24, 16, 30) }
  g.fillStyle = 'rgba(0,0,0,0.13)'
  for (let yy = 0; yy < 600; yy += 4) g.fillRect(0, yy, 1024, 1.5)
  if (hover) { g.strokeStyle = '#5ef2c0'; g.lineWidth = 8; g.strokeRect(4, 60, 1016, 536) }
  term.tex.needsUpdate = true
}

function Monitor() {
  const term = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 1024; c.height = 600
    const tex = new THREE.CanvasTexture(c)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 8
    return { c, ctx: c.getContext('2d'), tex }
  }, [])
  const [hover, setHover] = useState(false)
  const acc = useRef(0)
  const mode = useRef('hero')
  const t0 = useRef(0)
  useLayoutEffect(() => { document.fonts?.load('700 29px "JetBrains Mono"') }, [])

  useFrame((s, dt) => {
    acc.current += dt
    if (acc.current < 0.06) return
    acc.current = 0
    const end = scroll.sm > 9.3
    const m = end ? 'end' : 'hero'
    if (m !== mode.current) { mode.current = m; t0.current = s.clock.elapsedTime }
    const lines = end ? END : HERO
    const total = lines.reduce((a, l) => a + l[0].length + 8, 0) / 26 + 7
    const tt = (s.clock.elapsedTime - t0.current) % total
    draw(term, lines, tt, hover && !end, end ? '~/desk - zsh (exit 0)' : '~/desk - zsh')
  })

  const over = (e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = 'pointer' }
  const out = () => { setHover(false); document.body.style.cursor = 'auto' }
  return (
    <group>
      <B s={[0.5, 0.75, 0.28]} c="#1a1830" position={[0, 0.38, -1.55]} />
      <B s={[2.2, 0.08, 1.1]} c="#1a1830" position={[0, 0.04, -1.3]} />
      <group onPointerOver={over} onPointerOut={out} onClick={(e) => { e.stopPropagation(); if (scroll.sm < 0.6) goTo(1) }}>
        <B s={[5.7, 3.5, 0.26]} c="#1b1a34" m={0.4} position={[0, 2.35, -1.45]} />
        <mesh position={[0, 2.35, -1.31]}>
          <planeGeometry args={[5.3, 3.1]} />
          <meshBasicMaterial map={term.tex} toneMapped={false} color={hover ? '#ffffff' : '#e4e0ff'} />
        </mesh>
      </group>
      {/* little power led */}
      <mesh position={[2.5, 0.78, -1.3]}><sphereGeometry args={[0.04, 8, 8]} /><meshBasicMaterial color={glow(COL.mint, 3)} toneMapped={false} /></mesh>
    </group>
  )
}

function Keyboard() {
  const keys = useRef()
  const N = 15 * 5
  useLayoutEffect(() => {
    let i = 0
    for (let r = 0; r < 5; r++)
      for (let c = 0; c < 15; c++) {
        dummy.position.set(-2.1 + c * 0.3, 0.17, -0.55 + r * 0.3)
        dummy.updateMatrix()
        keys.current.setMatrixAt(i++, dummy.matrix)
        keys.current.setColorAt(i - 1, new THREE.Color('#222'))
      }
    keys.current.instanceMatrix.needsUpdate = true
  }, [])
  const col = useMemo(() => new THREE.Color(), [])
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    let i = 0
    for (let r = 0; r < 5; r++)
      for (let c = 0; c < 15; c++) {
        col.setHSL((0.72 + c * 0.012 + r * 0.01 + Math.sin(t * 0.8 - c * 0.35) * 0.08) % 1, 0.85, 0.5)
        const pulse = 0.55 + 0.45 * Math.sin(t * 2.2 - c * 0.5 - r * 0.4)
        col.multiplyScalar(0.35 + pulse * 0.6)
        keys.current.setColorAt(i++, col)
      }
    keys.current.instanceColor.needsUpdate = true
  })
  return (
    <group position={[0, 0, 1.4]} rotation={[0.06, 0, 0]}>
      <B s={[4.8, 0.14, 1.9]} c="#15132c" m={0.4} position={[0, 0.07, 0.05]} />
      <instancedMesh ref={keys} args={[null, null, N]}>
        <boxGeometry args={[0.24, 0.1, 0.24]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
    </group>
  )
}

function Duck() {
  const g = useRef()
  const [quack, setQuack] = useState(0)
  const hit = useRef(-9)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (hit.current === Infinity) hit.current = t
    const since = t - hit.current
    const jump = since < 0.5 ? Math.sin((since / 0.5) * Math.PI) * 0.7 : 0
    g.current.position.y = 0.45 + jump + Math.sin(t * 1.6) * 0.03
    g.current.rotation.z = since < 0.5 ? Math.sin(since * 30) * 0.15 : Math.sin(t * 1.2) * 0.04
    const show = since < 3 ? 1 : 0
    if (show !== quack) setQuack(show)
  })
  return (
    <group position={[3.7, 0, 0.9]} rotation={[0, -0.45, 0]}
      onClick={(e) => { e.stopPropagation(); hit.current = Infinity }}
    >
      <group ref={g}>
        <S r={0.46} c="#ffd93d" scale={[1.05, 0.85, 1.25]} ei={0.25} ec="#ffb800" />
        <S r={0.3} c="#ffd93d" position={[0, 0.6, 0.5]} ei={0.25} ec="#ffb800" />
        <B s={[0.3, 0.1, 0.26]} c="#ff8a3d" position={[0, 0.55, 0.82]} ei={0.3} />
        <S r={0.05} c="#111" position={[-0.14, 0.7, 0.72]} seg={8} />
        <S r={0.05} c="#111" position={[0.14, 0.7, 0.72]} seg={8} />
        <S r={0.2} c="#ffc41f" position={[-0.45, 0.05, 0]} scale={[0.5, 0.8, 1]} />
        <S r={0.2} c="#ffc41f" position={[0.45, 0.05, 0]} scale={[0.5, 0.8, 1]} />
        <mesh position={[0, 0.25, -0.58]} rotation={[-0.9, 0, 0]}><coneGeometry args={[0.16, 0.34, 6]} /><meshStandardMaterial color="#ffd93d" flatShading /></mesh>
        {/* tiny headphones: this duck is debugging */}
        <mesh position={[0, 0.72, 0.5]} rotation={[0, 0, 0]}><torusGeometry args={[0.31, 0.03, 6, 20, Math.PI]} /><meshStandardMaterial color="#8b5cf6" /></mesh>
        <S r={0.1} c="#8b5cf6" position={[-0.31, 0.62, 0.5]} seg={8} />
        <S r={0.1} c="#8b5cf6" position={[0.31, 0.62, 0.5]} seg={8} />
      </group>
      {quack === 1 && (
        <group position={[0, 2.1, 0.4]}>
          <B s={[3.3, 0.8, 0.05]} c="#f4efe6" ei={0.5} />
          <T size={0.2} color="#2a1d4d" position={[0, 0.12, 0.04]}>quack! have you tried</T>
          <T size={0.2} color="#2a1d4d" position={[0, -0.14, 0.04]}>a hash map?</T>
        </group>
      )}
    </group>
  )
}
function Lamp() {
  const bulb = useRef()
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const flick = t < 3 ? (Math.sin(t * 40) > 0.6 && t < 1.5 ? 0.3 : 1) : 1
    bulb.current.color.copy(glow(COL.amber, 3 * flick))
  })
  return (
    <group position={[-5.6, 0, -1.4]}>
      <Cyl r={0.7} h={0.14} c="#1a1830" position={[0, 0.07, 0]} />
      <B s={[0.1, 2.6, 0.1]} c="#2d2a52" m={0.6} position={[0, 1.4, 0]} />
      <B s={[0.1, 2.0, 0.1]} c="#2d2a52" m={0.6} position={[0.7, 3.1, 0]} rotation={[0, 0, -1.1]} />
      <group position={[1.55, 3.3, 0]} rotation={[0, 0, 0.5]}>
        <mesh position={[0, -0.05, 0]}><coneGeometry args={[0.7, 0.8, 16, 1, true]} /><meshStandardMaterial color="#ff6b8a" side={THREE.DoubleSide} flatShading /></mesh>
        <mesh position={[0, -0.18, 0]}><sphereGeometry args={[0.22, 16, 16]} /><meshBasicMaterial ref={bulb} color={glow(COL.amber, 3)} toneMapped={false} /></mesh>
      </group>
      <pointLight position={[1.8, 2.8, 0.6]} color="#ffb86b" intensity={55} distance={15} decay={2} />
    </group>
  )
}

function Mug() {
  const steam = useRef()
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    steam.current.children.forEach((c, i) => {
      const ph = (t * 0.45 + i * 0.33) % 1
      c.position.y = ph * 1.3
      c.position.x = Math.sin(ph * 6 + i) * 0.12
      c.scale.setScalar(0.4 + ph * 0.8)
      c.material.opacity = (1 - ph) * 0.35
    })
  })
  return (
    <group position={[-3.6, 0, 2.3]}>
      <Cyl r={0.42} h={0.8} c="#ff6b8a" position={[0, 0.4, 0]} />
      <Cyl r={0.36} h={0.05} c="#3b2012" position={[0, 0.78, 0]} />
      <mesh position={[0.48, 0.42, 0]}><torusGeometry args={[0.2, 0.06, 8, 14]} /><meshStandardMaterial color="#ff6b8a" flatShading /></mesh>
      <group ref={steam} position={[0, 0.85, 0]}>
        {[0, 1, 2].map((i) => (
          <mesh key={i}><sphereGeometry args={[0.18, 8, 8]} /><meshBasicMaterial color="#fff" transparent opacity={0.3} depthWrite={false} /></mesh>
        ))}
      </group>
    </group>
  )
}

function Plant() {
  const g = useRef()
  useFrame(({ clock }) => { g.current.rotation.z = Math.sin(clock.elapsedTime * 0.8) * 0.03 })
  return (
    <group position={[6.6, 0, -2.4]}>
      <Cyl r={0.6} rb={0.45} h={0.8} c="#ff9f6b" position={[0, 0.4, 0]} />
      <group ref={g} position={[0, 0.8, 0]}>
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <S key={i} r={0.3} c={i % 2 ? '#2fbf8f' : '#5ef2c0'} scale={[0.35, 1.7, 0.12]}
            position={[Math.cos(i * 0.9) * 0.28, 0.8, Math.sin(i * 0.9) * 0.28]}
            rotation={[Math.sin(i * 0.9) * 0.6, 0, -Math.cos(i * 0.9) * 0.6]} />
        ))}
      </group>
    </group>
  )
}

function Notes() {
  const items = [
    { p: [-4.4, 4.3, -5.8], r: 0.08, c: '#ffe066', t: ['TODO:', 'get hired'] },
    { p: [-3.0, 3.1, -5.8], r: -0.06, c: '#ff9ec0', t: ['works on', 'my machine'] },
    { p: [4.2, 4.0, -5.8], r: -0.05, c: '#8ff0d0', t: ['coffee', '> bugs'] },
  ]
  return items.map((n, i) => (
    <group key={i} position={n.p} rotation={[0, 0, n.r]}>
      <B s={[1.3, 1.3, 0.03]} c={n.c} ei={0.35} />
      <T size={0.2} color="#2a1d4d" position={[0, 0.16, 0.03]}>{n.t[0]}</T>
      <T size={0.2} color="#2a1d4d" position={[0, -0.12, 0.03]}>{n.t[1]}</T>
    </group>
  ))
}

function Bokeh({ n = 38 }) {
  const ref = useRef()
  const data = useMemo(() => {
    const r = rng(11)
    const pal = [COL.violet, COL.coral, COL.sky, COL.amber, COL.mint]
    return Array.from({ length: n }, () => ({ x: (r() * 2 - 1) * 18, y: 0.5 + r() * 9, s: 0.2 + r() * 0.6, c: pal[Math.floor(r() * 5)], ph: r() * 6 }))
  }, [n])
  useLayoutEffect(() => {
    data.forEach((d, i) => ref.current.setColorAt(i, new THREE.Color(d.c)))
    ref.current.instanceColor.needsUpdate = true
  }, [data])
  useFrame(({ clock }) => {
    data.forEach((d, i) => {
      dummy.position.set(d.x, d.y, -5.95)
      dummy.scale.setScalar(d.s * (1 + Math.sin(clock.elapsedTime * 0.7 + d.ph) * 0.15))
      dummy.updateMatrix()
      ref.current.setMatrixAt(i, dummy.matrix)
    })
    ref.current.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh ref={ref} args={[null, null, n]}>
      <circleGeometry args={[1, 24]} />
      <meshBasicMaterial transparent opacity={0.13} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
    </instancedMesh>
  )
}

function Glyphs() {
  const g = useRef()
  const items = useMemo(() => {
    const r = rng(31)
    const sym = ['{ }', '=>', '</>', '01', '[ ]', ';', '&&', '#', 'fn()']
    return Array.from({ length: 16 }, (_, i) => ({ s: sym[i % sym.length], x: (r() * 2 - 1) * 8, z: -3 + r() * 5, sp: 0.25 + r() * 0.35, ph: r(), c: [COL.violet, COL.sky, COL.mint, COL.coral][i % 4] }))
  }, [])
  useFrame(({ clock }) => {
    g.current.children.forEach((c, i) => {
      const it = items[i]
      const ph = (clock.elapsedTime * it.sp * 0.25 + it.ph) % 1
      c.position.y = 0.6 + ph * 8
      c.children[0].fillOpacity = Math.sin(ph * Math.PI) * 0.55
    })
  })
  return (
    <group ref={g}>
      {items.map((it, i) => (
        <group key={i} position={[it.x, 0, it.z]}>
          <T size={0.4} color={it.c} fillOpacity={0}>{it.s}</T>
        </group>
      ))}
    </group>
  )
}

export default function Desk() {
  return (
    <group>
      {/* room */}
      <mesh position={[0, 6, -5.9]}><planeGeometry args={[50, 18]} /><meshStandardMaterial color="#120f2c" roughness={1} /></mesh>
      <Bokeh />
      <T size={1.0} color={COL.violet} k={1.7} position={[0, 6.1, -5.8]}>hello, world</T>
      <Notes />
      {/* desk */}
      <B s={[20, 0.4, 9]} c="#2c1d3f" r={0.55} m={0.2} position={[0, -0.2, 0.2]} />
      <mesh position={[0, -0.05, 4.72]}><boxGeometry args={[20, 0.06, 0.05]} /><meshBasicMaterial color={glow(COL.coral, 1.8)} toneMapped={false} /></mesh>
      <Monitor />
      <Keyboard />
      <mesh position={[3.4, 0.1, 1.9]} scale={[1, 0.6, 1.5]}><sphereGeometry args={[0.35, 16, 12]} /><meshStandardMaterial color="#1a1830" metalness={0.4} roughness={0.4} /></mesh>
      <Duck />
      <Lamp />
      <Mug />
      <Plant />
      <group position={[-4.6, 0, 0.5]}>
        <B s={[1.8, 0.3, 1.2]} c="#8b5cf6" position={[0, 0.15, 0]} rotation={[0, 0.2, 0]} />
        <B s={[1.6, 0.26, 1.1]} c="#ff6b8a" position={[0.05, 0.43, 0]} rotation={[0, -0.1, 0]} />
        <B s={[1.7, 0.28, 1.15]} c="#5cc8ff" position={[-0.05, 0.7, 0]} rotation={[0, 0.15, 0]} />
      </group>
      <Glyphs />
      <pointLight position={[0, 4, 5]} color="#8b5cf6" intensity={30} distance={22} decay={2} />
      <pointLight position={[0, 2.4, 0.6]} color="#5cc8ff" intensity={10} distance={10} decay={2} />
    </group>
  )
}
