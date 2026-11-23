'use client'

import Image from 'next/image'
import { useState } from 'react'
import front from '@/app/articles/home-network-v2/rack_front.jpeg'
import rear from '@/app/articles/home-network-v2/rack_back.jpeg'
import original from '@/app/articles/home-network-v1/IMG_3972.jpeg'
import november from '@/images/rack-november-2026.jpg'

const photos = [
  {
    image: november,
    caption: 'Current rack',
    date: 'NOV 2026',
    alt: 'Full-height view of the homelab rack with two firewalls, two core switches, and several servers.',
  },
  {
    image: front,
    caption: 'Switch stack',
    date: 'JAN 2026',
    alt: 'Front of the homelab rack with red patch cables joining the switches.',
  },
  {
    image: rear,
    caption: 'Rear uplinks',
    date: 'JAN 2026',
    alt: 'Back of the rack, with fiber uplinks leading to the aggregation switch.',
  },
  {
    image: original,
    caption: 'First rack build',
    date: 'NOV 2023',
    alt: 'The earlier rack with a patch panel above the original switches.',
  },
]

export function RackViewer() {
  const [index, setIndex] = useState(0)
  const shot = photos[index]
  const count = [index + 1, photos.length]
    .map((value) => String(value).padStart(2, '0'))
    .join('/')

  return (
    <figure className="rack-viewer">
      <div className="rack-photo">
        <Image
          src={shot.image}
          alt={shot.alt}
          fill
          sizes="(max-width: 530px) calc(100vw - 60px), (max-width: 760px) 490px, (max-width: 1150px) 42vw, 490px"
        />
      </div>
      <figcaption>
        <span aria-live="polite">
          <span className="frame-count">{count}</span> {shot.caption}
          <span className="shot-date">{shot.date}</span>
        </span>
        <span className="rack-actions">
          <a className="rack-full-size" href={shot.image.src}>
            View full size <span aria-hidden="true">↗</span>
          </a>
          <span className="photo-controls">
            <button
              type="button"
              aria-label="Previous rack photo"
              onClick={() =>
                setIndex(
                  (current) => (current + photos.length - 1) % photos.length,
                )
              }
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Next rack photo"
              onClick={() =>
                setIndex((current) => (current + 1) % photos.length)
              }
            >
              ›
            </button>
          </span>
        </span>
      </figcaption>
    </figure>
  )
}
