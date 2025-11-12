# Icon Files

The following icon files need to be generated from `favicon.svg`:

- `favicon-16x16.png` - 16x16 PNG
- `favicon-32x32.png` - 32x32 PNG
- `apple-touch-icon.png` - 180x180 PNG
- `favicon-192x192.png` - 192x192 PNG
- `favicon-512x512.png` - 512x512 PNG
- `og-image.png` - 1200x630 PNG for social media

You can generate these using:
1. Online tool: https://realfavicongenerator.net/
2. Or use ImageMagick:
   ```bash
   magick convert favicon.svg -resize 16x16 favicon-16x16.png
   magick convert favicon.svg -resize 32x32 favicon-32x32.png
   magick convert favicon.svg -resize 180x180 apple-touch-icon.png
   magick convert favicon.svg -resize 192x192 favicon-192x192.png
   magick convert favicon.svg -resize 512x512 favicon-512x512.png
   ```

For now, the site will use `favicon.svg` which is supported by modern browsers.
