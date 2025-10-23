const fs = require('fs');
const path = require('path');

const galleryDir = path.join(__dirname, '../images/gallery');
const outputFile = path.join(__dirname, '../lib/galleryImages.ts');

// Check if directory exists
if (!fs.existsSync(galleryDir)) {
  console.log('Gallery directory does not exist, creating empty file');
  fs.writeFileSync(outputFile, `import { StaticImageData } from 'next/image'\n\nexport const galleryImages: StaticImageData[] = []\n`);
  process.exit(0);
}

// Get all image files
const files = fs.readdirSync(galleryDir);
const imageFiles = files.filter(file => {
  const ext = path.extname(file).toLowerCase();
  return ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext);
}).sort();

if (imageFiles.length === 0) {
  console.log('No images found, creating empty file');
  fs.writeFileSync(outputFile, `import { StaticImageData } from 'next/image'\n\nexport const galleryImages: StaticImageData[] = []\n`);
  process.exit(0);
}

// Generate imports and exports
let content = `// This file is auto-generated. Do not edit manually.\n`;
content += `// Run 'npm run generate-gallery' to regenerate.\n\n`;
content += `import { StaticImageData } from 'next/image'\n\n`;

// Add imports
imageFiles.forEach((file, index) => {
  content += `import photo${index} from '@/images/gallery/${file}'\n`;
});

content += `\nexport const galleryImages: StaticImageData[] = [\n`;
imageFiles.forEach((file, index) => {
  content += `  photo${index},\n`;
});
content += `]\n`;

// Also export filenames for EXIF extraction
content += `\nexport const galleryImageFilenames: string[] = [\n`;
imageFiles.forEach(file => {
  content += `  '${file}',\n`;
});
content += `]\n`;

fs.writeFileSync(outputFile, content);
console.log(`Generated gallery imports for ${imageFiles.length} images`);
