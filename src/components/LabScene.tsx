'use client'

import { useState } from 'react'
import styles from './lab-hero.module.css'

const switchPorts = Array.from({ length: 8 }, (_, index) => index)
const drives = Array.from({ length: 5 }, (_, index) => index)

export function LabScene() {
  const [tracing, setTracing] = useState(false)

  return (
    <button
      type="button"
      className={styles.scene}
      aria-label="Trace the patch cable on the pixel-art homelab rack"
      aria-pressed={tracing}
      onClick={() => setTracing((value) => !value)}
    >
      <span className={styles.art} aria-hidden="true">
        <span className={styles.floor} />
        <span className={styles.cabinetSide} />
        <span className={styles.cabinetTop} />
        <span className={styles.cabinet}>
          <span className={styles.patch}>
            {switchPorts.map((port) => (
              <span key={port} />
            ))}
          </span>
          <span className={styles.switch}>
            {switchPorts.map((port) => (
              <span key={port} />
            ))}
          </span>
          <span className={styles.server}>
            {drives.map((drive) => (
              <span key={drive} />
            ))}
          </span>
          <span className={styles.storage}>
            <span />
            <span />
            <span />
          </span>
          <span className={styles.ups}>
            <span />
          </span>
          <span className={styles.cable} />
          <span className={styles.signal} />
        </span>
      </span>
    </button>
  )
}
