'use client'

import Image from 'next/image'
import { useState } from 'react'
import front from '@/app/articles/home-network-v2/rack_front.jpeg'
import rear from '@/app/articles/home-network-v2/rack_back.jpeg'
import original from '@/app/articles/home-network-v1/IMG_3972.jpeg'

const photos = [
  {
    image: front,
    caption: 'Switch stack',
    date: 'JAN 2026',
    alt: 'Front of the homelab rack with red patch cables joining the switches.',
    position: '50% 36%',
  },
  {
    image: rear,
    caption: 'Rear uplinks',
    date: 'JAN 2026',
    alt: 'Back of the rack, with fiber uplinks leading to the aggregation switch.',
    position: '50% 38%',
  },
  {
    image: original,
    caption: 'First rack build',
    date: 'NOV 2023',
    alt: 'The earlier rack with a patch panel above the original switches.',
    position: '50% 48%',
  },
]

export function RackViewer() {
  const [index, setIndex] = useState(0)
  const shot = photos[index]
  return (
    <figure className="rack-viewer">
      <div className="rack-photo">
        <Image
          src={shot.image}
          alt={shot.alt}
          fill
          sizes="(max-width: 700px) 100vw, 56vw"
          style={{ objectPosition: shot.position }}
        />
      </div>
      <figcaption>
        <span aria-live="polite">
          <span className="frame-count">0{index + 1}/03</span> {shot.caption}{' '}
          <span className="shot-date">/ {shot.date}</span>
        </span>
        <span className="photo-controls">
          <button
            aria-label="Previous rack photo"
            onClick={() =>
              setIndex((index + photos.length - 1) % photos.length)
            }
          >
            ‹
          </button>
          <button
            aria-label="Next rack photo"
            onClick={() => setIndex((index + 1) % photos.length)}
          >
            ›
          </button>
        </span>
      </figcaption>
    </figure>
  )
}
