import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Alert,
  CircularProgress,
  Divider,
  Grid
} from '@mui/material';
import {
  PhotoCamera as PhotoCameraIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  CloudUpload as UploadIcon,
  Preview as PreviewIcon
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5001';

interface ImageEditModalProps {
  open: boolean;
  onClose: () => void;
  currentImagePath?: string;
  title: string;
  entityType: 'product' | 'category' | 'variety';
  entityId: string;
  productSlug?: string;
  categorySlug?: string;
  varietySlug?: string;
  onImageUpdated: (newImagePath: string) => void;
}

const ImageEditModal: React.FC<ImageEditModalProps> = ({
  open,
  onClose,
  currentImagePath,
  title,
  entityType,
  entityId,
  productSlug,
  categorySlug,
  varietySlug,
  onImageUpdated
}) => {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      // Upload to CMS image server
      const formData = new FormData();
      formData.append('image', file);
      formData.append('productSlug', productSlug || '');
      formData.append('type', entityType);
      if (categorySlug) {
        formData.append('categorySlug', categorySlug);
      }
      if (varietySlug) {
        formData.append('varietySlug', varietySlug);
      }

      console.log('Uploading to image server...');
      const uploadResponse = await axios.post('http://localhost:3002/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log('Image server response:', uploadResponse.data);

      // Update the entity in the API server
      const token = localStorage.getItem('token');
      let updateEndpoint = '';
      
      switch (entityType) {
        case 'product':
          updateEndpoint = `/api/product-types/${entityId}`;
          break;
        case 'category':
          updateEndpoint = `/api/categories/${entityId}`;
          break;
        case 'variety':
          updateEndpoint = `/api/varieties/${entityId}`;
          break;
      }

      const headers: any = {
        'Content-Type': 'application/json'
      };
      
      // Add authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const updatePayload = {
        imagePath: uploadResponse.data.imageUrl
      };

      console.log(`Updating API server...`);
      console.log(`Endpoint: http://localhost:5001${updateEndpoint}`);
      console.log(`Payload:`, updatePayload);
      console.log(`Entity: ${entityType} (ID: ${entityId})`);

      const apiResponse = await axios.put(`${API_BASE}${updateEndpoint}`, updatePayload, {
        headers
      });
      
      console.log('API server response:', apiResponse.data);

      setSuccess('Image uploaded successfully!');
      onImageUpdated(uploadResponse.data.imageUrl);
      
      // Clear preview and file input
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error: any) {
      console.error('Upload error:', error);
      setError(error.response?.data?.error || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentImagePath) {
      setError('No image to delete');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this image?')) {
      return;
    }

    setDeleting(true);
    setError('');
    setSuccess('');

    try {
      // Delete from CMS image server
      await axios.delete('http://localhost:3002/delete', {
        data: { imagePath: currentImagePath }
      });

      // Update the entity in the API server to remove image path
      const token = localStorage.getItem('token');
      let updateEndpoint = '';
      
      switch (entityType) {
        case 'product':
          updateEndpoint = `/api/product-types/${entityId}`;
          break;
        case 'category':
          updateEndpoint = `/api/categories/${entityId}`;
          break;
        case 'variety':
          updateEndpoint = `/api/varieties/${entityId}`;
          break;
      }

      const headers: any = {
        'Content-Type': 'application/json'
      };
      
      // Add authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      await axios.put(`${API_BASE}${updateEndpoint}`, {
        imagePath: null
      }, {
        headers
      });

      setSuccess('Image deleted successfully!');
      onImageUpdated('');

    } catch (error: any) {
      console.error('Delete error:', error);
      setError(error.response?.data?.error || 'Failed to delete image');
    } finally {
      setDeleting(false);
    }
  };

  const handleClose = () => {
    setPreviewUrl(null);
    setError('');
    setSuccess('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            Edit Image - {title}
          </Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Current Image */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Current Image
            </Typography>
            <Box
              sx={{
                height: 250,
                border: '2px dashed #ccc',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                bgcolor: '#f7f8fa'
              }}
            >
              {currentImagePath ? (
                <img
                  src={`http://localhost:3002${currentImagePath}`}
                  alt="Current"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <Typography color="text.secondary">
                  No image uploaded
                </Typography>
              )}
            </Box>

            {currentImagePath && (
              <Box mt={2}>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={deleting ? <CircularProgress size={16} /> : <DeleteIcon />}
                  onClick={handleDelete}
                  disabled={deleting}
                  fullWidth
                >
                  {deleting ? 'Deleting...' : 'Delete Current Image'}
                </Button>
              </Box>
            )}
          </Grid>

          {/* New Image Upload */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Upload New Image
            </Typography>
            <Box
              sx={{
                height: 250,
                border: '2px dashed #ccc',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                bgcolor: '#f7f8fa'
              }}
            >
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <Box textAlign="center">
                  <PhotoCameraIcon sx={{ fontSize: 48, color: '#ccc', mb: 1 }} />
                  <Typography color="text.secondary">
                    Select an image to preview
                  </Typography>
                </Box>
              )}
            </Box>

            <Box mt={2}>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <Button
                variant="outlined"
                startIcon={<PhotoCameraIcon />}
                onClick={() => fileInputRef.current?.click()}
                fullWidth
                sx={{ mb: 1 }}
              >
                Select Image
              </Button>
              
              {previewUrl && (
                <Button
                  variant="contained"
                  startIcon={uploading ? <CircularProgress size={16} /> : <UploadIcon />}
                  onClick={handleUpload}
                  disabled={uploading}
                  fullWidth
                >
                  {uploading ? 'Uploading...' : 'Upload Image'}
                </Button>
              )}
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Typography variant="body2" color="text.secondary">
          <strong>Supported formats:</strong> JPG, PNG, GIF, WebP<br />
          <strong>Maximum size:</strong> 5MB<br />
          <strong>Recommended dimensions:</strong> 800x600px or higher
        </Typography>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImageEditModal;
