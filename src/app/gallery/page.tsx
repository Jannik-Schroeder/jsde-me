import { type Metadata } from 'next'
import { SimpleLayout } from '@/components/SimpleLayout'
import { PhotoGrid } from '@/components/PhotoGrid'
import { type GalleryPhoto, extractExifData } from '@/lib/gallery'
import { galleryImages, galleryImageFilenames } from '@/lib/galleryImages'
import path from 'path'

export const metadata: Metadata = {
  title: 'Gallery',
  description:
    'A collection of my photography work, capturing moments from street photography, motorcycles, and cars.',
}

export default async function Gallery() {
  // Load photos with EXIF data
  const photos: GalleryPhoto[] = await Promise.all(
    galleryImages.map(async (image, index) => {
      const filename = galleryImageFilenames[index]
      const fullPath = path.join(process.cwd(), 'src/images/gallery', filename)

      // Extract EXIF data from the actual file
      const metadata = await extractExifData(fullPath)

      return {
        src: image,
        metadata,
      }
    }),
  )

  return (
    <SimpleLayout
      title="Capturing life through the lens."
      intro="Photography has been a passion of mine since 2024. What started as a casual interest has evolved into a dedicated pursuit of capturing the energy of street life, the raw power of motorcycles, and the sleek beauty of automotive design. Each photograph tells a story—a fleeting moment frozen in time. This gallery showcases my journey as I explore different perspectives and continue to develop my craft behind the camera."
    >
      <div className="mt-16 sm:mt-20">
        {photos.length > 0 ? (
          <PhotoGrid photos={photos} />
        ) : (
          <div className="rounded-2xl border border-zinc-100 p-8 text-center dark:border-zinc-700/40">
            <p className="text-base text-zinc-600 dark:text-zinc-400">
              Gallery photos coming soon. Add your images to{' '}
              <code className="rounded bg-zinc-100 px-2 py-1 text-sm dark:bg-zinc-800">
                src/images/gallery/
              </code>{' '}
              and run{' '}
              <code className="rounded bg-zinc-100 px-2 py-1 text-sm dark:bg-zinc-800">
                npm run generate-gallery
              </code>{' '}
              to update the gallery.
            </p>
          </div>
        )}
      </div>
    </SimpleLayout>
  )
}
