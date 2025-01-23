/* SHARP: A library used for compressing and cropping images */

import sharp from 'sharp';

interface Size {
    width: number;
    height: number;
}

const resizeImage = async (imageBuffer: Buffer, sizes: Size[]): Promise<{ width: number; height: number; buffer: string }[]> => {
    if (!imageBuffer) {
        throw new Error('No image provided');
    }

    if (!sizes || !Array.isArray(sizes)) {
        throw new Error('Sizes must be an array');
    }

    const resizedImages: { width: number; height: number; buffer: string }[] = [];
    for (const size of sizes) {
        if (!size.width || !size.height) {
            throw new Error('Each size object must have width and height properties');
        }

        const resizedImageBuffer = await sharp(imageBuffer)
            .resize(size.width, size.height) // Use width and height from the size object
            .jpeg({ quality: 80 })
            .toBuffer();

        resizedImages.push({
            width: size.width,
            height: size.height,
            buffer: resizedImageBuffer.toString('base64'),
        });
    }

    return resizedImages;
};

export default resizeImage;