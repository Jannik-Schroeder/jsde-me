import { type StaticImageData } from 'next/image'
import Image from 'next/image'
import clsx from 'clsx'

type PhotosProps = {
  images: (StaticImageData | string)[]
}

function PhotoSet({
  images,
  rotations,
  index,
  ariaHidden,
}: {
  images: (StaticImageData | string)[]
  rotations: string[]
  index: number
  ariaHidden?: boolean
}) {
  return (
    <div
      className="flex gap-5 pr-5 sm:gap-8 sm:pr-8"
      aria-hidden={ariaHidden}
    >
      {images.map((image, imageIndex) => (
        <div
          key={`image-${index}-${imageIndex}`}
          className={clsx(
            'relative aspect-[9/10] w-44 flex-none overflow-hidden rounded-xl bg-zinc-100 sm:w-72 sm:rounded-2xl dark:bg-zinc-800',
            rotations[imageIndex % rotations.length],
          )}
        >
          {/* Use blur placeholders for statically imported images. */}
          {(() => {
            const placeholder = typeof image === 'string' ? 'empty' : 'blur'

            return (
          <Image
            src={image}
            alt=""
            sizes="(min-width: 640px) 18rem, 11rem"
            className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
                placeholder={placeholder}
          />
            )
          })()}
        </div>
      ))}
    </div>
  )
}

export default function Photos({ images }: PhotosProps) {
  if (images.length === 0) {
    return null
  }

  const rotations = ['rotate-2', '-rotate-2', 'rotate-2', 'rotate-2', '-rotate-2']
  // Keep exactly two strips so the `marquee` keyframes (-50%) loop seamlessly.
  // If we have very few images, repeat them inside the strip instead of adding more strips.
  const minImagesPerStrip = 8
  const stripImages =
    images.length >= minImagesPerStrip
      ? images
      : Array.from({ length: minImagesPerStrip }, (_, i) => images[i % images.length])
  
  return (
    <div className="mt-16 overflow-hidden sm:mt-20 motion-reduce:overflow-x-auto">
      <div className="relative w-full">
        <div className="flex w-max animate-marquee motion-reduce:animate-none">
          <div className="flex flex-nowrap">
            {Array.from({ length: 2 }, (_, i) => (
              <PhotoSet
                key={i}
                images={stripImages}
                rotations={rotations}
                index={i}
                ariaHidden={i > 0}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
