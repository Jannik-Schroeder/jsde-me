// src/components/Photos.tsx
import { type ImageProps } from 'next/image'
import Image from 'next/image'
import clsx from 'clsx'
import React from 'react'

type PhotosProps = {
  images: ImageProps['src'][]
}

export default function Photos({ images }: PhotosProps) {
  const rotations = ['rotate-2', '-rotate-2', 'rotate-2', 'rotate-2', '-rotate-2']

  return (
    <div className="mt-16 sm:mt-20 overflow-hidden">
      <div className="relative w-full">
        <div className="flex animate-marquee">
          {/* First set of images */}
          <div className="flex gap-5 sm:gap-8">
            {images.map((image, imageIndex) => (
              <div
                key={`${typeof image === 'string' ? image : image.src}-1`}
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
          
          {/* Duplicate set for seamless loop */}
          <div className="flex gap-5 sm:gap-8 pl-5 sm:pl-8">
            {images.map((image, imageIndex) => (
              <div
                key={`${typeof image === 'string' ? image : image.src}-2`}
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
        </div>
      </div>
    </div>
  )
}
