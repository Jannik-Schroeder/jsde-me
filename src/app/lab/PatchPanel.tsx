'use client'

import { useRef, useState, useSyncExternalStore } from 'react'
import styles from './lab.module.css'

const rounds = [
  {
    name: 'Bring-up',
    services: [
      {
        name: 'SSH',
        port: 22,
        hint: 'Look for the lowest port on this panel.',
        explanation:
          'SSH uses TCP port 22 for encrypted remote shell sessions.',
      },
      {
        name: 'DNS',
        port: 53,
        hint: 'Look for the port in the fifties.',
        explanation: 'DNS uses port 53 over UDP or TCP to answer name lookups.',
      },
      {
        name: 'HTTPS',
        port: 443,
        hint: 'Look for the only three-digit port on this panel.',
        explanation:
          'HTTPS defaults to port 443. HTTP/3 uses UDP, while HTTP/1.1 and HTTP/2 typically use TCP.',
      },
    ],
    ports: [443, 22, 53],
  },
  {
    name: 'Housekeeping',
    services: [
      {
        name: 'NTP',
        port: 123,
        hint: 'The digits count upward from one.',
        explanation: 'NTP uses UDP port 123 to keep clocks in sync.',
      },
      {
        name: 'SMTP submission',
        port: 587,
        hint: 'Look for the port in the five hundreds.',
        explanation:
          'Mail clients typically use TCP port 587 to submit outgoing mail with SMTP.',
      },
      {
        name: 'SMB',
        port: 445,
        hint: 'Look for the port in the four hundreds.',
        explanation: 'SMB uses TCP port 445 for shared files and printers.',
      },
    ],
    ports: [445, 123, 587],
  },
  {
    name: 'Application rack',
    services: [
      {
        name: 'PostgreSQL',
        port: 5432,
        hint: 'Its digits count down from five.',
        explanation:
          'PostgreSQL listens for database clients on TCP port 5432 by default.',
      },
      {
        name: 'MQTT',
        port: 1883,
        hint: 'The default port for plain MQTT is the lowest one on this panel.',
        explanation:
          'MQTT commonly uses TCP port 1883 without TLS and port 8883 with TLS.',
      },
      {
        name: 'Redis',
        port: 6379,
        hint: 'Look for the only port that ends in nine.',
        explanation:
          'Redis listens for client connections on TCP port 6379 by default.',
      },
    ],
    ports: [1883, 6379, 5432],
  },
]

const storageKey = 'jsde.patch-panel.best-mistakes'
const initialStatus = 'Choose a service to begin.'

function mistakeCount(count: number) {
  return `${count} ${count === 1 ? 'mistake' : 'mistakes'}`
}

function readBest() {
  try {
    const saved = window.localStorage.getItem(storageKey)
    const value = Number(saved)
    if (saved && Number.isSafeInteger(value) && value >= 0) return value
  } catch {
    // Storage can be unavailable in restricted browsing contexts.
  }
  return null
}

function subscribeToBest(notify: () => void) {
  window.addEventListener('storage', notify)
  return () => window.removeEventListener('storage', notify)
}

function serverBest() {
  return null
}

export default function PatchPanel() {
  const [roundIndex, setRoundIndex] = useState(0)
  const [selectedPort, setSelectedPort] = useState<number | null>(null)
  const [connected, setConnected] = useState<number[]>([])
  const [mistakes, setMistakes] = useState(0)
  const [sessionBest, setSessionBest] = useState<number | null>(null)
  const savedBest = useSyncExternalStore(subscribeToBest, readBest, serverBest)
  const best = Math.min(savedBest ?? Infinity, sessionBest ?? Infinity)
  const [finished, setFinished] = useState(false)
  const [status, setStatus] = useState(initialStatus)
  const heading = useRef<HTMLHeadingElement>(null)
  const serviceButtons = useRef<(HTMLButtonElement | null)[]>([])
  const next = useRef<HTMLButtonElement>(null)

  const round = rounds[roundIndex]
  const selected = round.services.find(({ port }) => port === selectedPort)
  const roundFinished = connected.length === round.services.length
  const totalConnections = rounds.reduce(
    (total, { services }) => total + services.length,
    0,
  )
  const patched = rounds
    .slice(0, roundIndex)
    .reduce((total, { services }) => total + services.length, connected.length)

  function choosePort(port: number) {
    if (!selected || connected.includes(port)) return

    if (port !== selected.port) {
      setMistakes((count) => count + 1)
      setStatus(
        `Port ${port} doesn’t match ${selected.name}. Try another port or show a hint.`,
      )
      return
    }

    const solved = connected.length + 1 === round.services.length
    setConnected([...connected, port])
    setSelectedPort(null)
    setStatus(`${selected.name} patched. ${selected.explanation}`)
    if (solved) {
      next.current?.focus()
    } else {
      const remaining = round.services.findIndex(
        (service) => service.port !== port && !connected.includes(service.port),
      )
      serviceButtons.current[remaining]?.focus()
    }
  }

  function advance() {
    if (roundIndex + 1 < rounds.length) {
      setRoundIndex(roundIndex + 1)
      setConnected([])
      setStatus(initialStatus)
    } else {
      setFinished(true)
      setStatus(
        `All ${totalConnections} services connected with ${mistakeCount(mistakes)}.`,
      )
      const score = Math.min(best, mistakes, readBest() ?? Infinity)
      setSessionBest(score)
      try {
        window.localStorage.setItem(storageKey, String(score))
      } catch {
        // The game can still track the best score for this visit.
      }
    }
    heading.current?.focus()
  }

  function reset() {
    setRoundIndex(0)
    setSelectedPort(null)
    setConnected([])
    setMistakes(0)
    setFinished(false)
    setStatus('Run reset. Choose a service to begin.')
    heading.current?.focus()
  }

  return (
    <section className={styles.panel} aria-labelledby="patch-round">
      <div className={styles.summary}>
        <div>
          <p className={styles.eyebrow}>
            {finished
              ? 'Challenge complete'
              : `Round ${roundIndex + 1} / ${rounds.length}`}
          </p>
          <h2 id="patch-round" ref={heading} tabIndex={-1}>
            {finished ? 'Rack online' : round.name}
          </h2>
        </div>
        <dl className={styles.stats}>
          <div>
            <dt>Patched</dt>
            <dd>
              {patched}/{totalConnections}
            </dd>
          </div>
          <div>
            <dt>Mistakes</dt>
            <dd>{mistakes}</dd>
          </div>
          <div>
            <dt>Best run</dt>
            <dd>{Number.isFinite(best) ? mistakeCount(best) : '—'}</dd>
          </div>
        </dl>
      </div>
      {!finished && (
        <div className={styles.board}>
          <div className={styles.column}>
            <h3>Services</h3>
            {round.services.map(({ name, port }, index) => (
              <button
                key={port}
                ref={(button) => {
                  serviceButtons.current[index] = button
                }}
                type="button"
                className={styles.slot}
                aria-pressed={selectedPort === port}
                disabled={connected.includes(port)}
                data-connected={connected.includes(port)}
                onClick={() => {
                  setSelectedPort(port)
                  setStatus(`${name} selected. Choose a port.`)
                }}
              >
                <span>{name}</span>
                <span className={styles.plug} aria-hidden="true" />
                {connected.includes(port) && (
                  <small>
                    <span className="sr-only">Patched to port </span>
                    {port}
                  </small>
                )}
              </button>
            ))}
          </div>
          <div className={styles.column}>
            <h3>Ports</h3>
            {round.ports.map((port) => (
              <button
                key={port}
                type="button"
                className={`${styles.slot} ${styles.port}`}
                disabled={!selected || connected.includes(port)}
                data-connected={connected.includes(port)}
                onClick={() => choosePort(port)}
              >
                <span className={styles.jack} aria-hidden="true" />
                <span>
                  <span className="sr-only">Port </span>
                  {port}
                </span>
                {connected.includes(port) && (
                  <span className="sr-only">, connected</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
      <p className={styles.feedback} role="status">
        {status}
      </p>
      <div className={styles.actions}>
        <button
          className={styles.secondary}
          type="button"
          disabled={!selected}
          onClick={() =>
            selected && setStatus(`Hint for ${selected.name}. ${selected.hint}`)
          }
        >
          Show hint
        </button>
        <button className={styles.secondary} type="button" onClick={reset}>
          {finished ? 'Play again' : 'Reset run'}
        </button>
        {!finished && (
          <button
            ref={next}
            className={styles.primary}
            type="button"
            aria-disabled={!roundFinished}
            onClick={() => roundFinished && advance()}
          >
            {roundIndex === rounds.length - 1 ? 'Finish run' : 'Next round'}
          </button>
        )}
      </div>
    </section>
  )
}
