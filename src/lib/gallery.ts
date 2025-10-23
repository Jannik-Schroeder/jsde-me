import exifr from 'exifr'
import { StaticImageData } from 'next/image'

export interface PhotoMetadata {
  camera?: string
  lens?: string
  iso?: number
  aperture?: string
  focalLength?: string
  shutterSpeed?: string
  date?: string
}

export interface GalleryPhoto {
  src: StaticImageData
  metadata: PhotoMetadata
}

/**
 * Extract EXIF metadata from an image file
 */
export async function extractExifData(
  imagePath: string,
): Promise<PhotoMetadata> {
  try {
    const exif = await exifr.parse(imagePath, {
      tiff: true,
      exif: true,
      gps: false,
      interop: false,
    })

    if (!exif) {
      return {}
    }

    // Extract and format camera model
    let camera: string | undefined
    if (exif.Make && exif.Model) {
      camera = `${exif.Make} ${exif.Model}`.trim()
    } else {
      camera = exif.Model || exif.Make || undefined
    }

    // Map Sony camera model names to readable format
    if (camera) {
      const sonyModelMap: Record<string, string> = {
        'SONY ILCE-7M4': 'Sony Alpha 7 IV',
        'SONY ILCE-7M3': 'Sony Alpha 7 III',
        'SONY ILCE-7RM4': 'Sony Alpha 7R IV',
        'SONY ILCE-7RM3': 'Sony Alpha 7R III',
        'SONY ILCE-7SM3': 'Sony Alpha 7S III',
        'SONY ILCE-7C': 'Sony Alpha 7C',
        'SONY ILCE-9M2': 'Sony Alpha 9 II',
        'SONY ILCE-6600': 'Sony Alpha 6600',
        'SONY ILCE-6400': 'Sony Alpha 6400',
        'SONY ZV-E10': 'Sony ZV E10',
      }

      camera = sonyModelMap[camera] || camera
    }

    // Extract lens information
    const lens = exif.LensModel || exif.LensInfo || undefined

    // Extract ISO
    const iso = exif.ISO || exif.ISOSpeedRatings || undefined

    // Format aperture (f-number)
    const aperture = exif.FNumber
      ? `f/${exif.FNumber.toFixed(1)}`
      : exif.ApertureValue
        ? `f/${Math.pow(2, exif.ApertureValue / 2).toFixed(1)}`
        : undefined

    // Format focal length
    const focalLength = exif.FocalLength
      ? `${Math.round(exif.FocalLength)}mm`
      : undefined

    // Format shutter speed
    let shutterSpeed: string | undefined
    if (exif.ExposureTime !== undefined) {
      if (exif.ExposureTime < 1) {
        shutterSpeed = `1/${Math.round(1 / exif.ExposureTime)}s`
      } else {
        shutterSpeed = `${exif.ExposureTime}s`
      }
    } else if (exif.ShutterSpeedValue !== undefined) {
      const speed = Math.pow(2, -exif.ShutterSpeedValue)
      if (speed < 1) {
        shutterSpeed = `1/${Math.round(1 / speed)}s`
      } else {
        shutterSpeed = `${speed.toFixed(1)}s`
      }
    }

    // Format date
    const date = exif.DateTimeOriginal || exif.DateTime || exif.CreateDate
    const formattedDate = date
      ? new Date(date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : undefined

    return {
      camera,
      lens,
      iso,
      aperture,
      focalLength,
      shutterSpeed,
      date: formattedDate,
    }
  } catch (error) {
    console.error('Error extracting EXIF data:', error)
    return {}
  }
}

/**
 * Format metadata for display (hover overlay)
 * Only shows technical specs, no lens
 */
export function formatMetadata(metadata: PhotoMetadata): string[] {
  const parts: string[] = []

  // Don't include camera or lens here - camera is shown separately
  if (metadata.focalLength) parts.push(metadata.focalLength)
  if (metadata.aperture) parts.push(metadata.aperture)
  if (metadata.shutterSpeed) parts.push(metadata.shutterSpeed)
  if (metadata.iso) parts.push(`ISO ${metadata.iso}`)

  return parts
}
