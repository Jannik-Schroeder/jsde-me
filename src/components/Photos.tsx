import { type StaticImageData } from 'next/image'
import Image from 'next/image'
import clsx from 'clsx'
import React from 'react'

type PhotosProps = {
  images: (StaticImageData | string)[]
}

function PhotoSet({ images, rotations, index }: { 
  images: (StaticImageData | string)[], 
  rotations: string[],
  index: number 
}) {
  return (
    <div className="flex gap-5 sm:gap-8">
      {images.map((image, imageIndex) => (
        <div
          key={`image-${index}-${imageIndex}`}
          className={clsx(
            'relative aspect-[9/10] w-44 flex-none overflow-hidden rounded-xl bg-zinc-100 sm:w-72 sm:rounded-2xl dark:bg-zinc-800',
            rotations[imageIndex % rotations.length],
          )}
        >
          <Image
            src={image}
            alt=""
            sizes="(min-width: 640px) 18rem, 11rem"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
      ))}
    </div>
  )
}

export default function Photos({ images }: PhotosProps) {
  const rotations = ['rotate-2', '-rotate-2', 'rotate-2', 'rotate-2', '-rotate-2']
  
  // Berechne wie viele Sets wir basierend auf der Bildanzahl brauchen
  const setsNeeded = Math.max(4, Math.ceil(12 / images.length))
  const totalSets = setsNeeded * 2 // Verdoppeln für den Loop-Effekt
  
  return (
    <div className="mt-16 sm:mt-20 overflow-hidden">
      <div className="relative w-full">
        <div className="flex animate-marquee">
          <div className="flex flex-nowrap gap-5 sm:gap-8">
            {Array.from({ length: totalSets }, (_, i) => (
              <PhotoSet 
                key={i} 
                images={images} 
                rotations={rotations} 
                index={i} 
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
