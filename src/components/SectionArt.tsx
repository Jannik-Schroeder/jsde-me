/** Small hardware illustrations, drawn as parts so they stay sharp at every size. */
export function SectionArt({ kind }: { kind: 'notes' | 'gear' | 'play' }) {
  if (kind === 'notes') {
    return (
      <div aria-hidden="true" className="artifact crt">
        <div className="crt-body">
          <div className="crt-glass">
            <b>&gt;_</b>
            <i />
            <i />
          </div>
          <span className="crt-knob" />
        </div>
        <div className="crt-foot" />
        <div className="crt-keyboard" />
      </div>
    )
  }
  if (kind === 'gear') {
    return (
      <div aria-hidden="true" className="artifact blades">
        {[0, 1, 2].map((n) => (
          <div className="blade" key={n}>
            <span className="blade-led" />
            <span className="blade-grille" />
            <span className="blade-ports" />
          </div>
        ))}
      </div>
    )
  }
  return (
    <div aria-hidden="true" className="artifact controller">
      <div className="controller-lead" />
      <div className="controller-shell">
        <i className="controller-cross" />
        <span className="controller-select" />
        <span className="controller-a" />
        <span className="controller-b" />
      </div>
    </div>
  )
}
