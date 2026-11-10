import * as THREE from 'three'

/* One continuous journey, three little worlds placed far apart:
   desk (hero + contact) → screen (road, folder) → hw (chips). */
export const OFF = { desk: [0, 0, 0], screen: [0, 0, -300], hw: [300, 0, -300] }
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
const W = (shot, v) => add(OFF[shot], v)

/* ---------- the road (screen-local coordinates) ---------- */
export const ROAD_PTS = [[0, 0, 6], [0, 0, -18], [3, 0, -45], [-3, 0, -78], [-6, 0, -108], [2, 0, -140], [5, 0, -170], [0, 0, -205], [0, 0, -232]]
export const roadCurve = new THREE.CatmullRomCurve3(ROAD_PTS.map((p) => new THREE.Vector3(...p)), false, 'catmullrom', 0.5)

export function uAtZ(z) {
  let best = 0, bd = 1e9
  for (let i = 0; i <= 800; i++) {
    const u = i / 800
    const d = Math.abs(roadCurve.getPointAt(u).z - z)
    if (d < bd) { bd = d; best = u }
  }
  return best
}
export function roadFrame(u) {
  const p = roadCurve.getPointAt(u)
  const t = roadCurve.getTangentAt(u)
  const n = new THREE.Vector3(-t.z, 0, t.x).normalize() // +x side when heading -z
  return { p, t, n }
}

/* a building beside the road, front side facing the road */
function place(z, side, off) {
  const u = uAtZ(z)
  const { p, n } = roadFrame(u)
  const pos = p.clone().addScaledVector(n, side * off)
  const front = n.clone().multiplyScalar(-side)
  return { pos: [pos.x, 0, pos.z], rotY: Math.atan2(front.x, front.z), u, side, off }
}
export const PL = {
  acies: place(-45, -1, 13),
  doutya: place(-108, 1, 12),
  iit: place(-170, -1, 13.5),
}
// building-local → screen-local
export function bl(pl, v) {
  const c = Math.cos(pl.rotY), s = Math.sin(pl.rotY)
  return [pl.pos[0] + v[0] * c + v[2] * s, v[1], pl.pos[2] - v[0] * s + v[2] * c]
}

/* ---------- the projects folder at the end of the road ---------- */
export const F = [0, 0, -252]
export const WIN = [
  { pos: [-17, 5.4, 3], rot: 0.75 },
  { pos: [0, 6.2, 11], rot: 0 },
  { pos: [17, 5.4, 3], rot: -0.75 },
]
const winCam = (k, d, dy = 0) => {
  const w = WIN[k]
  return [F[0] + w.pos[0] + Math.sin(w.rot) * d, F[1] + w.pos[1] + dy, F[2] + w.pos[2] + Math.cos(w.rot) * d]
}
const winLook = (k) => [F[0] + WIN[k].pos[0], F[1] + WIN[k].pos[1], F[2] + WIN[k].pos[2]]

/* ---------- walking avatar stops (screen-local) ---------- */
export const AV = {
  1: { road: true, u: PL.acies.u, lat: -5.2, extra: 3.2 },
  2: { road: true, u: PL.doutya.u, lat: 4.8, extra: 3.2 },
  3: { road: true, u: PL.iit.u, lat: -5.4, extra: 3.2 },
  4: { x: -5, z: F[2] + 22, face: Math.PI },
  5: { x: -15, z: F[2] + 14, face: Math.PI },
  6: { x: -3, z: F[2] + 19, face: Math.PI },
  7: { x: 15, z: F[2] + 14, face: Math.PI },
}

/* ---------- stations: one per scroll section ---------- */
export const STATIONS = [
  {
    id: 'boot', shot: 'desk', side: 'left', layer: 0, group: 0,
    crumb: '~/desk', file: 'hello.sh',
    cam: [0, 3.4, 10.5], look: [0, 2.0, -0.8],
    exit: { cam: [0, 2.4, 2.6], look: [0, 2.35, -1.3] },
    label: '> ./enter --screen',
  },
  {
    id: 'acies', shot: 'screen', side: 'right', layer: 1, group: 1,
    crumb: '~/screen/experience/acies', file: 'acies.tsx',
    entry: { cam: W('screen', [0, 2.6, 18]), look: W('screen', [0, 2.6, -30]) },
    cam: W('screen', bl(PL.acies, [2, 5, 16])), look: W('screen', bl(PL.acies, [0, 3.2, 0])),
  },
  {
    id: 'doutya', shot: 'screen', side: 'left', layer: 1, group: 1,
    crumb: '~/screen/experience/doutya', file: 'doutya.tsx',
    cam: W('screen', bl(PL.doutya, [-2, 4.6, 15])), look: W('screen', bl(PL.doutya, [0, 2.8, 0])),
  },
  {
    id: 'iit', shot: 'screen', side: 'right', layer: 1, group: 1,
    crumb: '~/screen/experience/iit_dharwad', file: 'drought_forecast.py',
    cam: W('screen', bl(PL.iit, [2, 4.8, 15.5])), look: W('screen', bl(PL.iit, [0, 2.4, 0])),
  },
  {
    id: 'folder', shot: 'screen', side: 'left', layer: 2, group: 2,
    crumb: '~/screen/projects/', file: 'projects/',
    cam: W('screen', [0, 8.5, F[2] + 38]), look: W('screen', [0, 4.6, F[2] + 4]), shift: 0.05, top: true,
  },
  {
    id: 'robot', shot: 'screen', side: 'right', layer: 2, group: 2,
    crumb: '~/screen/projects/robot_twin.ts', file: 'robot_twin.ts',
    cam: W('screen', winCam(0, 10.5)), look: W('screen', winLook(0)),
  },
  {
    id: 'copilot', shot: 'screen', side: 'left', layer: 2, group: 2,
    crumb: '~/screen/projects/reconcile.py', file: 'reconcile.py',
    cam: W('screen', winCam(1, 10.5)), look: W('screen', winLook(1)),
  },
  {
    id: 'lda', shot: 'screen', side: 'right', layer: 2, group: 2,
    crumb: '~/screen/projects/lda.ipynb', file: 'lda.ipynb',
    cam: W('screen', winCam(2, 10.5)), look: W('screen', winLook(2)),
    exit: { cam: W('screen', winCam(2, 2.6)), look: W('screen', winLook(2)) },
    label: '$ make build  # compiling down to silicon',
  },
  {
    id: 'usc', shot: 'hw', side: 'left', layer: 3, group: 3,
    crumb: '/hardware/cpu0/usc', file: 'usc.cpu',
    entry: { cam: W('hw', [-4, 34, 44]), look: W('hw', [0, 0, 2]) },
    cam: W('hw', [-1, 13, 19]), look: W('hw', [0, 0.6, 1.5]),
  },
  {
    id: 'iitdh', shot: 'hw', side: 'right', layer: 3, group: 3,
    crumb: '/hardware/legacy/iit_dharwad', file: 'iit_dharwad.rom',
    cam: W('hw', [22, 9.5, 16]), look: W('hw', [24, 3.4, -1]),
    exit: { cam: W('hw', [24, 22, 12]), look: W('hw', [24, 8, -1]) },
    label: '↩ exit 0',
  },
  {
    id: 'contact', shot: 'desk', side: 'right', layer: 0, group: 4,
    crumb: '~/desk/terminal', file: 'terminal',
    entry: { cam: [1.4, 3.4, 4.2], look: [0, 2.3, -1.3] },
    cam: [-0.5, 3.4, 9.5], look: [0, 2.1, -0.8],
  },
]

export const NAV = [
  { label: 'HOME', i: 0 },
  { label: 'EXPERIENCE', i: 1 },
  { label: 'PROJECTS', i: 4 },
  { label: 'EDUCATION', i: 8 },
  { label: 'CONTACT', i: 10 },
]
export const LAYERS = ['DESK', 'SCREEN', 'FILES', 'SILICON']

export const LINKS = {
  email: 'koramoni@usc.edu',
  linkedin: 'https://linkedin.com/in/gayathri-koramoni',
  github: 'https://github.com/gaya1711/', // TODO: put your GitHub profile URL here
  resume: '/Gayathri_Koramoni_Resume.pdf',
}
