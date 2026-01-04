import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

import { Platform } from 'react-native';

// CONFIGURATION
// Create an "Unsigned" Upload Preset in Cloudinary Settings -> Upload -> Add upload preset
// Set "Signing Mode" to "Unsigned"
const CLOUDINARY_CLOUD_NAME = "duskoy255"; 
const CLOUDINARY_UPLOAD_PRESET = "Portfolio_uploads"; 
const CLOUDINARY_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;

export interface UploadResult {
    url: string;
    originalName: string;
    format: string;
    bytes: number;
}

/**
 * Picks a file from the device and uploads it to Cloudinary.
 * Returns the secure URL of the uploaded file.
 */
const pickAndUploadToCloudinary = async (): Promise<UploadResult | null> => {
    try {
        // 1. Pick the file
        const result = await DocumentPicker.getDocumentAsync({
            type: '*/*', 
            copyToCacheDirectory: true,
        });

        if (result.canceled || !result.assets || result.assets.length === 0) {
            console.log("User cancelled file picker");
            return null;
        }

        const asset = result.assets[0];
        console.log("File picked:", asset.uri);

        // 2. Upload Logic based on Platform
        if (Platform.OS === 'web') {
            // WEB UPLOAD (Standard fetch + Blob/File)
            const formData = new FormData();

            if (asset.file) {
                 formData.append('file', asset.file);
            } else {
                // Fallback: fetch blob from uri
                const res = await fetch(asset.uri);
                const blob = await res.blob();
                formData.append('file', blob, asset.name);
            }
            

            formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
            formData.append('resource_type', 'auto'); 

            const response = await fetch(CLOUDINARY_API_URL, {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            if (data.error) throw new Error(data.error.message);
            
            return {
                url: data.secure_url,
                originalName: data.original_filename,
                format: data.format,
                bytes: data.bytes
            };

        } else {
            // NATIVE UPLOAD (Android/iOS) - Use FileSystem for robustness
            const uploadResult = await FileSystem.uploadAsync(CLOUDINARY_API_URL, asset.uri, {
                httpMethod: 'POST',
                uploadType: 1, // FileSystemUploadType.MULTIPART
                fieldName: 'file',
                parameters: {
                    'upload_preset': CLOUDINARY_UPLOAD_PRESET,
                    'resource_type': 'auto',
                },
            });

            if (uploadResult.status !== 200) throw new Error("Upload failed: " + uploadResult.body);
            const data = JSON.parse(uploadResult.body);
            if (data.error) throw new Error(data.error.message);

            return {
                url: data.secure_url,
                originalName: data.original_filename,
                format: data.format,
                bytes: data.bytes
            };
        }

    } catch (error) {
        console.error("Upload failed", error);
        throw error;
    }
};

export { pickAndUploadToCloudinary };

