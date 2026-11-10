// Shared scroll / pointer state, read every frame by the 3D world.
const q = new URLSearchParams(window.location.search)
export const debug = { t: q.get('t') !== null ? parseFloat(q.get('t')) : null }

export const scroll = {
  t: 0, // target position in "station units"
  sm: 0, // smoothed camera position (written by the rig)
  active: 0,
  flash: 0, // 0..1 intensity of the cut transition
  label: '',
  shot: 'desk',
}
export const pointer = { x: 0, y: 0 }
export const listeners = new Set()

let stops = []
const ease = (x) => x * x * (3 - 2 * x)

export function measure(els) {
  const vh = window.innerHeight
  stops = els.filter(Boolean).map((el) => {
    const top = el.getBoundingClientRect().top + window.scrollY
    const h = el.offsetHeight
    return { a: top, b: Math.max(top, top + h - vh) } // camera holds while the panel is on screen
  })
}

export function update() {
  let t = 0
  if (debug.t !== null) t = debug.t
  else if (stops.length) {
    const y = window.scrollY
    t = stops.length - 1
    for (let i = 0; i < stops.length; i++) {
      if (y <= stops[i].b) {
        t = i
        if (i > 0 && y < stops[i].a) {
          const prev = stops[i - 1]
          const f = Math.min(1, Math.max(0, (y - prev.b) / (stops[i].a - prev.b)))
          t = i - 1 + ease(f)
        }
        break
      }
    }
  }
  scroll.t = t
  const a = Math.round(t)
  if (a !== scroll.active) {
    scroll.active = a
    listeners.forEach((fn) => fn(a))
  }
}

export function goTo(i) {
  if (stops[i]) window.scrollTo({ top: stops[i].a, behavior: 'smooth' })
}
