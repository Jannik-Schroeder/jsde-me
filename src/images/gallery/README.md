# Gallery Images

This directory contains images for your photography gallery.

## How It Works

The gallery automatically loads all images from this folder. Simply:

1. **Add your photos to this directory**
   - Place your images here (JPG, PNG, WEBP, GIF)
   - Keep original EXIF data intact for automatic metadata extraction
   - The filename doesn't matter - it won't be displayed

2. **Run the generation script**
   ```bash
   npm run generate-gallery
   ```
   This creates `src/lib/galleryImages.ts` with all image imports.

3. **Build or run your site**
   ```bash
   npm run dev    # For development
   npm run build  # For production (runs generate-gallery automatically)
   ```

That's it! Your new photos will appear in the gallery automatically.

## EXIF Data

The gallery automatically extracts the following EXIF data from your images:
- Camera model (e.g., "Sony A7 III")
- Lens (e.g., "Sony FE 35mm f/1.8")
- ISO (e.g., 800)
- Aperture (e.g., "f/2.8")
- Focal length (e.g., "35mm")
- Shutter speed (e.g., "1/250s")
- Date taken

**Important**: Make sure your photos contain EXIF data. Most cameras and phones embed this automatically.

## Adding or Removing Photos

To add new photos:
1. Copy images to this directory
2. Run `npm run generate-gallery`
3. Rebuild/restart your dev server

To remove photos:
1. Delete images from this directory
2. Run `npm run generate-gallery`
3. Rebuild/restart your dev server

## Image Formats

Supported formats:
- `.jpg` / `.jpeg`
- `.png`
- `.webp`
- `.gif`

Any aspect ratio is supported (16:9, 3:4, 2:1, etc.) - the masonry layout adapts automatically!

## Notes

- The `galleryImages.ts` file is auto-generated - don't edit it manually
- Images are sorted alphabetically by filename
- Next.js automatically optimizes images for web delivery
