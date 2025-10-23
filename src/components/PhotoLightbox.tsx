'use client'

import { Fragment, useEffect, useState, useRef } from 'react'
import Image, { StaticImageData } from 'next/image'
import { Dialog, Transition } from '@headlessui/react'
import { PhotoMetadata } from '@/lib/gallery'

interface Photo {
  src: StaticImageData
  metadata: PhotoMetadata
}

interface PhotoLightboxProps {
  isOpen: boolean
  onClose: () => void
  photos: Photo[]
  currentIndex: number
  onNext?: () => void
  onPrevious?: () => void
}

function CloseIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="m17.25 6.75-10.5 10.5M6.75 6.75l10.5 10.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ChevronLeftIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path
        d="M10.75 4.75 7.25 8l3.5 3.25"
        strokeWidth="1.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ChevronRightIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path
        d="M5.25 4.75 8.75 8l-3.5 3.25"
        strokeWidth="1.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function PhotoLightbox({
  isOpen,
  onClose,
  photos,
  currentIndex,
  onNext,
  onPrevious,
}: PhotoLightboxProps) {
  const [isImageLoaded, setIsImageLoaded] = useState(false)
  const [displayIndex, setDisplayIndex] = useState(currentIndex)
  const touchStartX = useRef<number>(0)
  const touchEndX = useRef<number>(0)

  // Update display index when currentIndex changes
  useEffect(() => {
    if (currentIndex !== displayIndex) {
      setIsImageLoaded(false)
      const timer = setTimeout(() => {
        setDisplayIndex(currentIndex)
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [currentIndex, displayIndex])

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setDisplayIndex(currentIndex)
      setIsImageLoaded(false)
    }
  }, [isOpen, currentIndex])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowRight' && onNext) {
        onNext()
      } else if (e.key === 'ArrowLeft' && onPrevious) {
        onPrevious()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, onNext, onPrevious])

  // Touch handlers for swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX
  }

  const handleTouchEnd = () => {
    const swipeThreshold = 50
    const diff = touchStartX.current - touchEndX.current

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0 && onNext) {
        // Swipe left - next image
        onNext()
      } else if (diff < 0 && onPrevious) {
        // Swipe right - previous image
        onPrevious()
      }
    }
  }

  if (!isOpen || !photos[displayIndex]) return null

  const photo = photos[displayIndex]
  const isPortrait = photo.src.height > photo.src.width

  // Preload adjacent images
  const nextIndex = (displayIndex + 1) % photos.length
  const prevIndex = displayIndex === 0 ? photos.length - 1 : displayIndex - 1

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/95 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-hidden">
          <div className="flex h-full items-center justify-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="relative flex h-full w-full transform flex-col transition-all md:max-w-7xl md:items-center md:justify-center md:p-4">
                {/* Close button */}
                <button
                  onClick={onClose}
                  className="absolute right-2 top-2 z-10 rounded-full bg-white/10 p-2 text-white backdrop-blur transition hover:bg-white/20 md:right-0 md:top-0"
                  aria-label="Close"
                >
                  <CloseIcon className="h-5 w-5 md:h-6 md:w-6" />
                </button>

                {/* Desktop Navigation buttons */}
                {onPrevious && (
                  <button
                    onClick={onPrevious}
                    className="absolute left-4 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white/10 p-3 text-white backdrop-blur transition hover:bg-white/20 md:block"
                    aria-label="Previous photo"
                  >
                    <ChevronLeftIcon className="h-6 w-6" />
                  </button>
                )}
                {onNext && (
                  <button
                    onClick={onNext}
                    className="absolute right-4 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white/10 p-3 text-white backdrop-blur transition hover:bg-white/20 md:block"
                    aria-label="Next photo"
                  >
                    <ChevronRightIcon className="h-6 w-6" />
                  </button>
                )}

                {/* Mobile: Vertical layout always */}
                <div className="flex h-full w-full flex-col md:hidden">
                  {/* Image container with touch handlers */}
                  <div
                    className="relative flex flex-1 items-center justify-center"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  >
                    <div
                      className={`transition-opacity duration-300 ${
                        isImageLoaded ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
                      <Image
                        src={photo.src}
                        alt=""
                        className="h-auto w-full object-contain"
                        style={{
                          maxHeight: 'calc(100vh - 200px)',
                        }}
                        priority
                        onLoad={() => setIsImageLoaded(true)}
                      />
                    </div>

                    {!isImageLoaded && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-white" />
                      </div>
                    )}

                    {/* Preload adjacent images */}
                    <div className="hidden">
                      <Image src={photos[nextIndex].src} alt="" priority />
                      <Image src={photos[prevIndex].src} alt="" priority />
                    </div>
                  </div>

                  {/* Mobile metadata - compact at bottom */}
                  <div className="flex-shrink-0 bg-black/80 p-4 backdrop-blur">
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <span>
                        {displayIndex + 1} / {photos.length}
                      </span>
                      <span>Swipe to navigate</span>
                    </div>
                    <div className="mt-3 space-y-2 text-sm text-white">
                      {photo.metadata.camera && (
                        <div className="font-medium">
                          {photo.metadata.camera}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-300">
                        {photo.metadata.focalLength && (
                          <span>{photo.metadata.focalLength}</span>
                        )}
                        {photo.metadata.aperture && (
                          <span>{photo.metadata.aperture}</span>
                        )}
                        {photo.metadata.shutterSpeed && (
                          <span>{photo.metadata.shutterSpeed}</span>
                        )}
                        {photo.metadata.iso && (
                          <span>ISO {photo.metadata.iso}</span>
                        )}
                      </div>
                      {photo.metadata.date && (
                        <div className="text-xs text-zinc-400">
                          {photo.metadata.date}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Desktop: Original adaptive layout */}
                <div
                  className={`hidden h-full w-full gap-6 transition-opacity duration-300 md:flex ${
                    isImageLoaded ? 'opacity-100' : 'opacity-0'
                  } ${
                    isPortrait
                      ? 'flex-row items-center'
                      : 'flex-col items-center justify-center'
                  }`}
                >
                  {/* Image */}
                  <div
                    className={`relative flex-shrink-0 ${
                      isPortrait ? 'h-full w-auto' : 'h-auto w-full'
                    }`}
                  >
                    <Image
                      src={photo.src}
                      alt=""
                      className={`rounded-lg object-contain ${
                        isPortrait ? 'h-full w-auto' : 'h-auto w-full'
                      }`}
                      style={{
                        maxHeight: isPortrait
                          ? 'calc(100vh - 2rem)'
                          : 'calc(100vh - 12rem)',
                        maxWidth: isPortrait ? 'auto' : '100%',
                      }}
                      priority
                      onLoad={() => setIsImageLoaded(true)}
                    />

                    {/* Preload adjacent images */}
                    <div className="hidden">
                      <Image src={photos[nextIndex].src} alt="" priority />
                      <Image src={photos[prevIndex].src} alt="" priority />
                    </div>
                  </div>

                  {/* Desktop metadata */}
                  <div
                    className={`flex-shrink-0 rounded-lg bg-white/5 p-6 backdrop-blur ${
                      isPortrait ? 'w-80' : 'w-full'
                    }`}
                  >
                    <div
                      className={`grid gap-4 text-sm text-zinc-300 ${
                        isPortrait
                          ? 'grid-cols-1'
                          : 'grid-cols-2 lg:grid-cols-4'
                      }`}
                    >
                      {photo.metadata.camera && (
                        <div>
                          <dt className="font-medium text-zinc-400">Camera</dt>
                          <dd className="mt-1 text-white">
                            {photo.metadata.camera}
                          </dd>
                        </div>
                      )}
                      {photo.metadata.lens && (
                        <div>
                          <dt className="font-medium text-zinc-400">Lens</dt>
                          <dd className="mt-1 text-white">
                            {photo.metadata.lens}
                          </dd>
                        </div>
                      )}
                      {photo.metadata.focalLength && (
                        <div>
                          <dt className="font-medium text-zinc-400">
                            Focal Length
                          </dt>
                          <dd className="mt-1 text-white">
                            {photo.metadata.focalLength}
                          </dd>
                        </div>
                      )}
                      {photo.metadata.aperture && (
                        <div>
                          <dt className="font-medium text-zinc-400">
                            Aperture
                          </dt>
                          <dd className="mt-1 text-white">
                            {photo.metadata.aperture}
                          </dd>
                        </div>
                      )}
                      {photo.metadata.shutterSpeed && (
                        <div>
                          <dt className="font-medium text-zinc-400">
                            Shutter Speed
                          </dt>
                          <dd className="mt-1 text-white">
                            {photo.metadata.shutterSpeed}
                          </dd>
                        </div>
                      )}
                      {photo.metadata.iso && (
                        <div>
                          <dt className="font-medium text-zinc-400">ISO</dt>
                          <dd className="mt-1 text-white">
                            {photo.metadata.iso}
                          </dd>
                        </div>
                      )}
                      {photo.metadata.date && (
                        <div>
                          <dt className="font-medium text-zinc-400">Date</dt>
                          <dd className="mt-1 text-white">
                            {photo.metadata.date}
                          </dd>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Desktop loading indicator */}
                {!isImageLoaded && (
                  <div className="absolute inset-0 hidden items-center justify-center md:flex">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-white" />
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
