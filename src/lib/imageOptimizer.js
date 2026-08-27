/**
 * Intelligent client-side image optimizer for HEETS ALCOL TIME
 * 
 * Rules:
 * 1. Visual quality is top priority: zero visible artifacts, high resolution preserved.
 * 2. If image is already optimized / small (<= 600KB and <= 2048px), do NOT touch it at all.
 * 3. If image is very large (e.g. 5MB-10MB 4000x3000 photo from smartphone):
 *    - Scale down gently to max 2560px (Retina 2K/4K ultra-sharp).
 *    - Use high-quality WebP (quality 0.92) or high-quality JPEG (0.92).
 * 4. If optimized output is not smaller than original, keep original.
 */

const MAX_DIMENSION = 2560; // 2.5K Retina resolution - extremely crisp
const TARGET_QUALITY = 0.92; // Visually indistinguishable from lossless
const SKIP_OPTIMIZATION_SIZE = 600 * 1024; // 600 KB

export const optimizeImage = async (file) => {
  if (!file || !(file instanceof File)) {
    return { file, isOptimized: false };
  }

  // Only optimize JPEG, PNG, WEBP
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    return { file, isOptimized: false };
  }

  // If already very light, return original
  if (file.size <= SKIP_OPTIMIZATION_SIZE) {
    return {
      file,
      isOptimized: false,
      originalSize: file.size,
      optimizedSize: file.size,
      reason: 'Già ottimizzato'
    };
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // If dimensions are reasonable and size is moderate, check if scaling is even needed
      let shouldScale = false;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        shouldScale = true;
        if (width > height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { alpha: file.type === 'image/png' });

      if (!ctx) {
        resolve({ file, isOptimized: false });
        return;
      }

      // High quality image rendering settings
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Determine output format
      // If PNG with possible transparency, keep PNG if not huge, or WebP if supported
      const outputType = file.type === 'image/png' ? 'image/png' : 'image/webp';

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve({ file, isOptimized: false });
            return;
          }

          // If compression didn't save significant space or made it larger, keep original
          if (blob.size >= file.size * 0.95) {
            resolve({
              file,
              isOptimized: false,
              originalSize: file.size,
              optimizedSize: file.size
            });
            return;
          }

          // Create new optimized File object
          const ext = outputType === 'image/webp' ? 'webp' : file.name.split('.').pop() || 'jpg';
          const newName = file.name.replace(/\.[^/.]+$/, '') + `_opt.${ext}`;
          const optimizedFile = new File([blob], newName, {
            type: outputType,
            lastModified: Date.now()
          });

          resolve({
            file: optimizedFile,
            isOptimized: true,
            originalSize: file.size,
            optimizedSize: blob.size,
            reductionPercent: Math.round(((file.size - blob.size) / file.size) * 100),
            width,
            height
          });
        },
        outputType,
        TARGET_QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ file, isOptimized: false });
    };

    img.src = objectUrl;
  });
};
