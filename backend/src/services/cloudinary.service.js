import cloudinary from "../config/cloudinary.js"; 

export const uploadToCloudinary = (fileBuffer) => {
    return new Promise((resolve, reject) => {
        // Now uploader knows your keys because of the import above
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder: 'prescriptions' },
            (error, result) => {
                if (error) return reject(error);
                resolve(result); 
            }
        );
        uploadStream.end(fileBuffer);
    });
};