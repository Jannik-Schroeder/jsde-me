import { type ImageProps } from 'next/image'
import Image from 'next/image'
import clsx from 'clsx'
import React from 'react'

type PhotosProps = {
  images: ImageProps['src'][]
}

function PhotoSet({ images, rotations, index }: { 
  images: ImageProps['src'][], 
  rotations: string[],
  index: number 
}) {
  return (
    <div className="flex gap-5 sm:gap-8">
      {images.map((image, imageIndex) => (
        <div
          key={`${typeof image === 'string' ? image : image.src}-${index}-${imageIndex}`}
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

  return (
    <div className="mt-16 sm:mt-20 overflow-hidden">
      <div className="relative w-full">
        <div className="flex animate-marquee">
          <div className="flex flex-nowrap gap-5 sm:gap-8">
            <PhotoSet images={images} rotations={rotations} index={1} />
            <PhotoSet images={images} rotations={rotations} index={2} />
            <PhotoSet images={images} rotations={rotations} index={3} />
            <PhotoSet images={images} rotations={rotations} index={4} />
            {/* Duplicate sets for seamless loop */}
            <PhotoSet images={images} rotations={rotations} index={5} />
            <PhotoSet images={images} rotations={rotations} index={6} />
            <PhotoSet images={images} rotations={rotations} index={7} />
            <PhotoSet images={images} rotations={rotations} index={8} />
          </div>
        </div>
      </div>
    </div>
  )
}
