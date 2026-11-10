import { useEffect, useRef, useState } from 'react'
import { STATIONS, NAV, LAYERS, LINKS } from './layout'
import { scroll, pointer, measure, update, goTo, listeners } from './scroll'

const Tags = ({ items }) => <p className="tags">{items.map((t) => <span key={t}>{t}</span>)}</p>
const Kicker = ({ children }) => <p className="kicker">{children}</p>

function Panel({ i, refs, children, wide }) {
  const s = STATIONS[i]
  return (
    <section ref={(el) => (refs.current[i] = el)} className={`sec ${s.side} ${s.top ? 'top' : ''}`} id={s.id}>
      <div className={`win ${wide ? 'wide' : ''}`}>
        <div className="bar"><b /><b /><b /><span>{s.file}</span></div>
        <div className="body">{children}</div>
      </div>
    </section>
  )
}

const groupOf = (i) => (i === 0 ? 0 : i <= 3 ? 1 : i <= 7 ? 2 : i <= 9 ? 3 : 4)

export default function Overlay() {
  const refs = useRef([])
  const flashRef = useRef()
  const labelRef = useRef()
  const [active, setActive] = useState(0)

  useEffect(() => {
    const m = () => { measure(refs.current); update() }
    const onMove = (e) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.y = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    m()
    document.fonts?.ready.then(m)
    const t = setTimeout(m, 700)
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', m)
    window.addEventListener('pointermove', onMove)
    listeners.add(setActive)
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && e.target.classList.add('in')),
      { threshold: 0.12 }
    )
    refs.current.forEach((el) => el && io.observe(el))
    let raf
    const loop = () => {
      const f = scroll.flash
      if (flashRef.current) {
        flashRef.current.style.opacity = Math.min(1, f * 1.25)
        labelRef.current.textContent = scroll.label
        labelRef.current.style.opacity = f > 0.35 ? 1 : 0
      }
      raf = requestAnimationFrame(loop)
    }
    loop()
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(t)
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', m)
      window.removeEventListener('pointermove', onMove)
      listeners.delete(setActive)
      io.disconnect()
    }
  }, [])

  const st = STATIONS[active]
  const g = groupOf(active)

  return (
    <>
      <div className="flash" ref={flashRef}><span ref={labelRef} /></div>

      <header className="hud top">
        <button className="logo" onClick={() => goTo(0)} aria-label="Back to top">gk<i>_</i></button>
        <nav aria-label="Sections">
          {NAV.map((n, k) => (
            <button key={n.label} className={k === g ? 'on' : ''} onClick={() => goTo(n.i)}>{n.label}<b /></button>
          ))}
        </nav>
      </header>

      <aside className="hud layers" aria-hidden="true">
        {LAYERS.map((l, k) => <div key={l} className={k === st.layer ? 'on' : ''}><b />{l}</div>)}
      </aside>

      <footer className="hud bottom">
        <span><em>gayathri@portfolio</em>:{st.crumb}$<i>_</i></span>
      </footer>

      <main>
        {/* 0 — desk */}
        <Panel i={0} refs={refs}>
          <Kicker>// hello, world</Kicker>
          <h1>Gayathri<br />Koramoni</h1>
          <p className="lead">Software engineer. I turn messy data into interfaces people trust: dashboards, pipelines, real-time 3D. I did my bachelor's in electrical engineering, so I like knowing what's under the hood.</p>
          <p className="tagline">Full-stack. <span>All the way down.</span></p>
          <div className="cta">
            <button className="btn" onClick={() => goTo(1)}>Enter the screen</button>
            <a className="btn ghost" href={LINKS.resume} target="_blank" rel="noreferrer">Resume</a>
          </div>
          <p className="hint">tip: click the monitor. or the duck.</p>
        </Panel>

        {/* 1 — Acies */}
        <Panel i={1} refs={refs}>
          <Kicker>// experience / 01 / most recent</Kicker>
          <h2>Software Engineer, Acies</h2>
          <p className="meta">Jul 2024 - Jan 2026 · Goa, India</p>
          <ul>
            <li>Built an analytics platform from scratch (Dataflows, Charts, Apps) with 30+ chart types across Plotly.js, ECharts and Recharts, incl. candlestick, boxplot, sankey and sunburst.</li>
            <li>Added pivot tables and logic to merge and reconcile data from many sources before it reached any chart.</li>
            <li>Proposed and shipped a React Flow lineage view so non-technical stakeholders could see where every number came from.</li>
            <li>Designed a job scheduler to track recurring runs and failures.</li>
          </ul>
          <Tags items={['React', 'MUI', 'Django', 'React Flow', 'Plotly', 'ECharts', 'Bootstrap']} />
        </Panel>

        {/* 2 — Doutya */}
        <Panel i={2} refs={refs}>
          <Kicker>// experience / 02 / HEAD~1</Kicker>
          <h2>Full-stack Intern, Doutya</h2>
          <p className="meta">Nov 2023 - Jun 2024 · Bangalore, India</p>
          <ul>
            <li>Built web and mobile apps with React, Node.js, React Native and PHP, plus Next.js admin dashboards on SQL.</li>
            <li>Real-time sync across web and mobile clients with Firebase.</li>
            <li>Made AR/VR experiences in Unity and ViroReact for location-based visualization.</li>
          </ul>
          <Tags items={['React', 'Next.js', 'Node', 'React Native', 'Firebase', 'Unity', 'SQL']} />
        </Panel>

        {/* 3 — IIT R&D */}
        <Panel i={3} refs={refs}>
          <Kicker>// experience / 03 / HEAD~2</Kicker>
          <h2>R&amp;D, IIT Dharwad</h2>
          <p className="meta">Aug - Oct 2023 · Dharwad, India</p>
          <ul>
            <li>Benchmarked ML (linear regression) against deep learning (ConvLSTM + Conv3D, 1D-CNN, Conv3D) for vegetative drought forecasting on NOAA satellite and gridded precipitation data (Karnataka, 1981-2021).</li>
            <li>The simple model won: <strong>R² 0.92 vs 0.22-0.83</strong>, training in <strong>under 2 minutes instead of 300</strong>. Watch the race.</li>
          </ul>
          <Tags items={['Python', 'ML', 'ConvLSTM', 'Satellite data']} />
        </Panel>

        {/* 4 — folder */}
        <Panel i={4} refs={refs}>
          <Kicker>// ~/projects</Kicker>
          <h2>Things I built.</h2>
          <p className="lead">The road ends at a folder. Open it: three files, each one a tiny working demo.</p>
          <p className="hint">keep scrolling</p>
        </Panel>

        {/* 5–7 — projects */}
        <Panel i={5} refs={refs}>
          <Kicker>// projects / 01</Kicker>
          <h2>Robot Digital Twin</h2>
          <p>A browser-based 3D simulation of an autonomous grass-cutting robot. Live telemetry (battery, position, sensors) streams over WebSockets to a real-time dashboard. Coverage path planning uses A*-based obstacle avoidance, and run history lives in PostgreSQL so strategies can be compared.</p>
          <p className="note">That's the rover in the window, rerouting around rocks.</p>
          <Tags items={['Three.js', 'React', 'TypeScript', 'Node.js', 'WebSockets', 'PostgreSQL', 'Docker Compose']} />
        </Panel>
        <Panel i={6} refs={refs}>
          <Kicker>// projects / 02</Kicker>
          <h2>Data Reconciliation Copilot</h2>
          <p>A web app that reconciles multi-source tables: fuzzy column matching (rapidfuzz) with LLM-confirmed mappings flags formatting issues, duplicates and conflicting records. An LLM then writes a plain-English report and answers follow-up questions grounded in the computed diffs.</p>
          <Tags items={['Python', 'FastAPI', 'React', 'TypeScript', 'PostgreSQL', 'LLM API', 'rapidfuzz']} />
        </Panel>
        <Panel i={7} refs={refs}>
          <Kicker>// projects / 03</Kicker>
          <h2>Topic Modelling with LDA</h2>
          <p>Applied Latent Dirichlet Allocation to a complaints dataset to surface hidden topics, then ran sentiment analysis on each topic to see what people were angriest about. (The words in the window are illustrative.)</p>
          <Tags items={['Python', 'LDA', 'spaCy', 'NLTK']} />
        </Panel>

        {/* 8–9 — education */}
        <Panel i={8} refs={refs}>
          <Kicker>// layer 0: hardware / education</Kicker>
          <h2>University of Southern California</h2>
          <p className="meta">M.S. Computer Science, Viterbi School of Engineering · 2026 - 2028</p>
          <p>Currently running. Each little chip is a course:</p>
          <Tags items={['Analysis of Algorithms', 'Database Systems', 'Natural Language Processing']} />
        </Panel>
        <Panel i={9} refs={refs}>
          <Kicker>// where it started</Kicker>
          <h2>IIT Dharwad</h2>
          <p className="meta">B.Tech, Electrical Engineering · 2020 - 2024 · CGPA 7.69 / 10</p>
          <p>Where I learned how the machine works underneath, which is why I'm comfortable going from a React component down to the silicon.</p>
        </Panel>

        {/* 10 — contact terminal */}
        <Panel i={10} refs={refs}>
          <Kicker>// back at the desk</Kicker>
          <h2>Let's talk.</h2>
          <pre className="term">{`$ npm ls --depth=0
gayathri@2026
├─ languages   Python, JavaScript, TypeScript, C++, Java
├─ frontend    React, React Native, Vue, Three.js, MUI
├─ backend     Node, Django, FastAPI, PostgreSQL, MySQL, MongoDB
├─ infra       Docker, Kubernetes, Azure, Linux, Git
└─ ai / data   LLM APIs, LangChain, RAG, Plotly, ECharts, Tableau`}</pre>
          <p>I'm looking for software engineering roles. If you're building something data-heavy, interactive, or just fun, say hi.</p>
          <div className="cta">
            <a className="btn" href={`mailto:${LINKS.email}`}>{LINKS.email}</a>
            <a className="btn ghost" href={LINKS.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
            <a className="btn ghost" href={LINKS.github} target="_blank" rel="noreferrer">GitHub</a>
            <a className="btn ghost" href={LINKS.resume} target="_blank" rel="noreferrer">Resume</a>
          </div>
        </Panel>
      </main>
    </>
  )
}
