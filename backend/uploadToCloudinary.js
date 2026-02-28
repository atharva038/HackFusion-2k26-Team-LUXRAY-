import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';

// Load env from backend
dotenv.config({ path: '/Users/atharva_beast/Desktop/Coading/Hackfusion-2k26/backend/.env' });

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

async function uploadVideo() {
    try {
        const videoPath = '/Users/atharva_beast/Desktop/Coading/Hackfusion-2k26/frontend/public/assets/Pharma-Ai-Agent-Working.mp4';
        console.log('Uploading video to Cloudinary...');

        const result = await cloudinary.uploader.upload(videoPath, {
            resource_type: "video",
            folder: "hackfusion/showcase",
            public_id: "pharma_ai_agent_demo"
        });

        console.log('Upload successful!');
        console.log('Video URL:', result.secure_url);
    } catch (error) {
        console.error('Upload failed:', error);
    }
}

uploadVideo();
