import { sanitizeFileName } from './registerUtils';

export const validateImageQuality = (file) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
            // Clean up object URL
            URL.revokeObjectURL(objectUrl);

            // Check minimum dimensions
            if (img.width < 200 || img.height < 200) {
                reject(new Error('Image dimensions too small. Minimum size: 200x200px'));
                return;
            }

            const aspectRatio = img.width / img.height;
            if (aspectRatio < 0.5 || aspectRatio > 2) {
                reject(new Error('Logo/thumbnail should have a reasonable aspect ratio (not too wide or tall)'));
                return;
            }

            resolve(true);
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Invalid image file'));
        };

        img.src = objectUrl;
    });
};

export const preserveImageQuality = (file) => {
    return new Promise((resolve, reject) => {
        // For maximum quality preservation, we'll use different strategies based on file type
        const fileType = file.type.toLowerCase();

        // If it's already a high-quality format and small enough, don't process
        if (file.size < 5 * 1024 * 1024 && (fileType.includes('png') || fileType.includes('webp'))) {
            resolve(file);
            return;
        }

        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        // Store the original onload handler before overwriting
        const processImage = () => {
            // Clean up object URL first
            URL.revokeObjectURL(objectUrl);

            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Set canvas size to match image dimensions (no resizing)
                canvas.width = img.width;
                canvas.height = img.height;

                // Use highest quality rendering settings
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';

                // Set composite operation for better quality
                ctx.globalCompositeOperation = 'source-over';

                // Clear canvas with transparent background
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                // Draw image at original size with high quality
                ctx.drawImage(img, 0, 0);

                // Determine best output format for quality
                let outputType = 'image/png'; // PNG for maximum quality
                let quality = 1.0; // Maximum quality

                // For JPEG images, use WebP if supported, otherwise PNG
                if (fileType.includes('jpeg') || fileType.includes('jpg')) {
                    // Try WebP first for better compression with quality
                    if (canvas.toDataURL('image/webp', 1.0)) {
                        outputType = 'image/webp';
                        quality = 1.0;
                    } else {
                        outputType = 'image/png';
                        quality = 1.0;
                    }
                }

                // Convert to blob with maximum quality
                canvas.toBlob((blob) => {
                    if (blob) {
                        // Create new file with preserved quality
                        const qualityFile = new File([blob], file.name, {
                            type: outputType,
                            lastModified: Date.now()
                        });

                        // Image quality optimization completed
                        resolve(qualityFile);
                    } else {
                        // Blob creation failed, using original file
                        resolve(file);
                    }
                }, outputType, quality);
            } catch (error) {
                // Image processing error, using original file
                resolve(file);
            }
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            // Image loading failed, using original file
            resolve(file);
        };

        img.onload = processImage;
        img.src = objectUrl;
    });
};

export const handleImageUpload = async (file, type, supabase) => {
    try {
        await validateImageQuality(file);

        // Preserve image quality
        const qualityFile = await preserveImageQuality(file);

        // Upload the quality-preserved file
        const timestamp = Date.now();
        const fileName = `${timestamp}-${type}-${sanitizeFileName(file.name)}`;

        const { data, error } = await supabase.storage
            .from('startup-media')
            .upload(fileName, qualityFile, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            throw new Error(`Upload failed: ${error.message}`);
        }

        const { data: urlData } = supabase.storage
            .from('startup-media')
            .getPublicUrl(fileName);

        return urlData.publicUrl;
    } catch (error) {
        // Upload error occurred
        throw error;
    }
};
