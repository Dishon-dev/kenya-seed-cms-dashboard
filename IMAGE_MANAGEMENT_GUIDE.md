# Image Management System

## Overview
The image management system allows you to upload, store, and manage product images both locally and in the database. Images are stored as actual image data (base64) in the database for dynamic accessibility.

## Features

### 🖼️ **Image Upload & Storage**
- **Local Storage**: Images are saved to `/public/images/{productType}/` directory
- **Database Storage**: Base64 encoded image data stored in database
- **Dynamic Access**: Images can be accessed without file system dependencies

### 🎯 **Image Management Actions**
- **Upload**: Add new images to products
- **Update**: Replace existing images
- **Delete**: Remove images from both local and database storage
- **View**: Preview images in the management interface

### 📁 **Directory Structure**
```
server-cms/public/images/
├── maize/
│   ├── image-1234567890-123456789.jpg
│   └── image-1234567891-123456790.png
├── horticulture/
│   └── image-1234567892-123456791.jpg
└── legumes/
    └── image-1234567893-123456792.jpg
```

## API Endpoints

### Upload Image
```http
POST /api/upload-image
Content-Type: multipart/form-data

FormData:
- image: File
- productType: string
```

### Save Image Data
```http
POST /api/images
Content-Type: application/json

{
  "id": "img_1234567890",
  "productId": "maize",
  "imageData": "data:image/jpeg;base64,/9j/4AAQ...",
  "fileName": "maize-image.jpg",
  "fileSize": 123456,
  "mimeType": "image/jpeg",
  "uploadedAt": "2024-01-15T10:30:00.000Z",
  "localPath": "/images/maize/image-1234567890-123456789.jpg"
}
```

### Get Image
```http
GET /api/images/:productId
```

### Delete Image
```http
DELETE /api/images/:productId
```

### Batch Get Images
```http
POST /api/images/batch
Content-Type: application/json

{
  "productIds": ["maize", "horticulture", "legumes"]
}
```

## Usage in CMS

### 1. **Product Management Page**
- Click the camera icon on any product image
- Upload new image or delete existing
- Images are automatically saved to both local and database

### 2. **Image Dialog Features**
- **Current Image Preview**: Shows existing image
- **File Upload**: Choose new image file
- **Delete Button**: Remove image completely
- **Save Button**: Apply changes

### 3. **Fallback Handling**
- Products without images show a placeholder
- Graceful degradation when images fail to load
- Color-coded backgrounds using product theme colors

## Technical Implementation

### Frontend (React)
- **Image Storage Utility**: `src/utils/imageStorage.ts`
- **State Management**: React hooks for image data
- **File Handling**: FileReader API for base64 conversion
- **UI Components**: Material-UI dialogs and forms

### Backend (Node.js/Express)
- **Multer**: File upload handling
- **File System**: Local image storage
- **JSON Storage**: Database simulation
- **CORS**: Cross-origin image access

### Data Flow
1. User selects image file
2. File converted to base64
3. Image uploaded to server
4. Server saves to local directory
5. Base64 data saved to database
6. Frontend updates with new image

## File Size Limits
- **Maximum file size**: 5MB
- **Supported formats**: All image types (JPEG, PNG, GIF, WebP)
- **Compression**: Automatic optimization on upload

## Security Features
- **File type validation**: Only image files allowed
- **Size limits**: Prevents oversized uploads
- **Path sanitization**: Secure file naming
- **CORS protection**: Controlled access

## Error Handling
- **Upload failures**: User-friendly error messages
- **Network issues**: Retry mechanisms
- **File validation**: Clear error feedback
- **Storage errors**: Graceful fallbacks

## Future Enhancements
- **Image optimization**: Automatic compression
- **Multiple formats**: WebP conversion
- **CDN integration**: Cloud storage support
- **Batch operations**: Multiple image uploads
- **Image editing**: Crop, resize, filters

## Troubleshooting

### Common Issues
1. **Images not loading**: Check file paths and permissions
2. **Upload failures**: Verify file size and format
3. **Database errors**: Check storage configuration
4. **CORS issues**: Verify server CORS settings

### Debug Steps
1. Check browser console for errors
2. Verify server logs for upload issues
3. Test API endpoints directly
4. Check file system permissions
5. Validate image data in database

## Performance Considerations
- **Lazy loading**: Images load on demand
- **Caching**: Browser and server caching
- **Compression**: Optimized file sizes
- **CDN**: Consider for production deployment
