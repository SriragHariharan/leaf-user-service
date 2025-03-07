import AWS from 'aws-sdk';

// Configure AWS SDK
const s3 = new AWS.S3({
    region: process.env.AWS_REGION, // Use the region from environment variables
    accessKeyId: process.env.AWS_ACCESS_KEY_ID, // Set your AWS access key ID
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY // Set your AWS secret access key
});

const uploadToS3 = async (imageBuffer: string, imageName: string, bucketName: string = process.env.S3_BUCKET_NAME!): Promise<string> => {
    if (!imageBuffer || !imageName || !bucketName) {
        throw new Error('Image buffer, name, and bucket name are required');
    }

    const buffer = Buffer.from(imageBuffer, 'base64');

    const params: AWS.S3.PutObjectRequest = {
        Bucket: bucketName,
        Key: imageName,
        Body: buffer,
        ContentType: 'image/jpeg',
    };

    try {
        // Upload the image to S3
        const data = await s3.upload(params).promise();

        // Return the URL of the uploaded image
        return data.Location; // This is the URL of the uploaded image
    } catch (error) {
        console.error('Error uploading to S3:', error);
        throw new Error('An error occurred while uploading to S3');
    }
};

export default uploadToS3;