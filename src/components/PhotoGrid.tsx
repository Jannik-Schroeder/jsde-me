'use client'

import { useState } from 'react'
import Image, { StaticImageData } from 'next/image'
import { PhotoMetadata, formatMetadata } from '@/lib/gallery'
import { PhotoLightbox } from './PhotoLightbox'

interface Photo {
  src: StaticImageData
  metadata: PhotoMetadata
}

interface PhotoGridProps {
  photos: Photo[]
}

function PhotoCard({ photo, onClick }: { photo: Photo; onClick: () => void }) {
  const [isHovered, setIsHovered] = useState(false)
  const metadataLines = formatMetadata(photo.metadata)

  return (
    <div
      className="group relative cursor-pointer overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <Image
        src={photo.src}
        alt=""
        className="h-auto w-full object-cover transition duration-300 group-hover:scale-105"
        sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
      />

      {/* Hover overlay */}
      <div
        className={`absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="space-y-1 text-sm text-white">
          {photo.metadata.camera && (
            <div className="font-medium">{photo.metadata.camera}</div>
          )}
          {metadataLines.length > 0 && (
            <div className="text-xs text-zinc-300">
              {metadataLines.join(' • ')}
            </div>
          )}
          {photo.metadata.date && (
            <div className="text-xs text-zinc-400">{photo.metadata.date}</div>
          )}
        </div>
      </div>
    </div>
  )
}

export function PhotoGrid({ photos }: PhotoGridProps) {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(
    null,
  )

  const handleNext = () => {
    if (selectedPhotoIndex === null) return
    setSelectedPhotoIndex((selectedPhotoIndex + 1) % photos.length)
  }

  const handlePrevious = () => {
    if (selectedPhotoIndex === null) return
    setSelectedPhotoIndex(
      selectedPhotoIndex === 0 ? photos.length - 1 : selectedPhotoIndex - 1,
    )
  }

  return (
    <>
      <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 xl:gap-8">
        {photos.map((photo, index) => (
          <div key={index} className="mb-5 break-inside-avoid xl:mb-8">
            <PhotoCard
              photo={photo}
              onClick={() => setSelectedPhotoIndex(index)}
            />
          </div>
        ))}
      </div>

      <PhotoLightbox
        isOpen={selectedPhotoIndex !== null}
        onClose={() => setSelectedPhotoIndex(null)}
        photos={photos}
        currentIndex={selectedPhotoIndex ?? 0}
        onNext={handleNext}
        onPrevious={handlePrevious}
      />
    </>
  )
}
