import { trackImageOptimization } from './performanceMonitor';

const MAX_DIMENSIONS = {
  logo: { width: 128, height: 128 },
  avatar: { width: 64, height: 64 }
};

export const optimizeImage = async (file, type = 'thumbnail') => {
  return new Promise((resolve, reject) => {
    // For thumbnail and cover images, return original file without resizing
    if (type === 'thumbnail' || type === 'cover') {
      resolve(file);
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    const objectUrl = URL.createObjectURL(file); // Store URL for cleanup

    img.onload = () => {
      const maxDims = MAX_DIMENSIONS[type];
      if (!maxDims) {
        // No restrictions for unknown types, return original
        URL.revokeObjectURL(objectUrl); // Clean up
        resolve(file);
        return;
      }

      // Calculate new dimensions maintaining aspect ratio
      let { width, height } = maxDims;
      const aspectRatio = img.width / img.height;

      if (aspectRatio > 1) {
        // Landscape image
        height = width / aspectRatio;
      } else {
        // Portrait image
        width = height * aspectRatio;
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw optimized image
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob with quality optimization
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(objectUrl); // Clean up object URL
          if (blob) {
            // Track performance improvement
            trackImageOptimization(file.size, blob.size);
            resolve(blob);
          } else {
            reject(new Error('Failed to create optimized image'));
          }
        },
        'image/jpeg',
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl); // Clean up on error
      reject(new Error('Image load failed'));
    };
    img.src = objectUrl;
  });
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};


export const validateImageDimensions = (file, type = 'thumbnail') => {
  return new Promise((resolve) => {
    // For thumbnail and cover images, always accept (no size restrictions)
    if (type === 'thumbnail' || type === 'cover') {
      resolve(true);
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file); // Store URL for cleanup

    img.onload = () => {
      URL.revokeObjectURL(objectUrl); // Clean up
      const maxDims = MAX_DIMENSIONS[type];
      if (!maxDims) {
        resolve(true); // No restrictions for unknown types
        return;
      }
      const isAcceptable = img.width <= maxDims.width && img.height <= maxDims.height;
      resolve(isAcceptable);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl); // Clean up on error
      resolve(false);
    };
    
    img.src = objectUrl;
  });
}; 