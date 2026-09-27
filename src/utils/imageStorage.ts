import { withAuthFetch as fetch } from './authFetch';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5001';
// Image storage utilities for both local and database storage

export interface ImageStorageData {
  id: string;
  productId: string;
  imageData: string; // Base64 encoded
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  localPath?: string;
}

// Save image to local storage (public directory)
export const saveImageLocally = async (
  imageData: string, 
  fileName: string, 
  productType: string
): Promise<string> => {
  try {
    // Convert base64 to blob
    const response = await fetch(imageData);
    const blob = await response.blob();
    
    // Create form data for upload
    const formData = new FormData();
    formData.append('image', blob, fileName);
    formData.append('productType', productType);
    
    // Upload to server endpoint
    const uploadResponse = await fetch(`${API_BASE}/api/upload-image`, {
      method: 'POST',
      body: formData,
    });
    
    if (!uploadResponse.ok) {
      throw new Error('Failed to upload image');
    }
    
    const result = await uploadResponse.json();
    return result.localPath;
  } catch (error) {
    console.error('Error saving image locally:', error);
    throw error;
  }
};

// Save image data to database
export const saveImageToDatabase = async (imageData: ImageStorageData): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE}/api/images`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(imageData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to save image to database');
    }
  } catch (error) {
    console.error('Error saving image to database:', error);
    throw error;
  }
};

// Get image from database
export const getImageFromDatabase = async (productId: string): Promise<ImageStorageData | null> => {
  try {
    const response = await fetch(`${API_BASE}/api/images/${productId}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to fetch image from database');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching image from database:', error);
    return null;
  }
};

// Delete image from both local storage and database
export const deleteImage = async (productId: string, localPath?: string): Promise<void> => {
  try {
    // Delete from database
    await fetch(`${API_BASE}/api/images/${productId}`, {
      method: 'DELETE',
    });
    
    // Delete from local storage if path exists
    if (localPath) {
      await fetch(`${API_BASE}/api/delete-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ localPath }),
      });
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
};

// Update product with image data
export const updateProductImage = async (
  productId: string, 
  imageData: string, 
  fileName: string, 
  productType: string
): Promise<{ localPath: string; databaseId: string }> => {
  try {
    // Save to local storage first
    const localPath = await saveImageLocally(imageData, fileName, productType);
    
    // Prepare data for database
    const imageStorageData: ImageStorageData = {
      id: `img_${Date.now()}`,
      productId,
      imageData,
      fileName,
      fileSize: imageData.length,
      mimeType: 'image/jpeg', // Default, could be detected from file
      uploadedAt: new Date().toISOString(),
      localPath,
    };
    
    // Save to database
    await saveImageToDatabase(imageStorageData);
    
    return {
      localPath,
      databaseId: imageStorageData.id,
    };
  } catch (error) {
    console.error('Error updating product image:', error);
    throw error;
  }
};

// Load existing images for products
export const loadProductImages = async (productIds: string[]): Promise<Map<string, ImageStorageData>> => {
  const imageMap = new Map<string, ImageStorageData>();
  
  try {
    const response = await fetch(`${API_BASE}/api/images/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ productIds }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch images');
    }
    
    const images = await response.json();
    
    // Convert to Map
    Object.entries(images).forEach(([productId, imageData]) => {
      imageMap.set(productId, imageData as ImageStorageData);
    });
    
    return imageMap;
  } catch (error) {
    console.error('Error loading product images:', error);
    return imageMap;
  }
};