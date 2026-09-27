import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Button,
  Typography,
  LinearProgress,
  Paper,
  IconButton,
  Tooltip,
  Alert
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
  Close as CloseIcon
} from '@mui/icons-material';

interface ImageUploadProps {
  onUpload: (file: File) => void;
  onDelete?: () => void;
  currentImage?: string;
  uploading?: boolean;
  uploadProgress?: number;
  accept?: string;
  maxSize?: number; // in MB
  disabled?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onUpload,
  onDelete,
  currentImage,
  uploading = false,
  uploadProgress = 0,
  accept = 'image/*',
  maxSize = 5, // 5MB default
  disabled = false
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return 'Please select an image file';
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      return `File size must be less than ${maxSize}MB`;
    }

    return null;
  };

  const handleFile = useCallback((file: File) => {
    setError(null);
    
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    onUpload(file);
  }, [onUpload, maxSize]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled || uploading) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile, disabled, uploading]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleClick = () => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click();
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete();
    }
  };

  return (
    <Box>
      <Paper
        elevation={dragActive ? 8 : 2}
        sx={{
          p: 3,
          textAlign: 'center',
          cursor: disabled || uploading ? 'default' : 'pointer',
          border: dragActive ? '2px dashed #1976d2' : '2px dashed #ccc',
          backgroundColor: dragActive ? '#f3f8ff' : 'transparent',
          transition: 'all 0.3s ease',
          position: 'relative',
          minHeight: '200px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          '&:hover': {
            borderColor: disabled || uploading ? '#ccc' : '#1976d2',
            backgroundColor: disabled || uploading ? 'transparent' : '#f3f8ff'
          }
        }}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileInput}
          style={{ display: 'none' }}
          disabled={disabled || uploading}
        />

        {currentImage ? (
          <Box sx={{ position: 'relative', width: '100%' }}>
            <img
              src={currentImage}
              alt="Current image"
              style={{
                maxWidth: '100%',
                maxHeight: '300px',
                objectFit: 'contain',
                borderRadius: '4px'
              }}
            />
            
            {!disabled && !uploading && onDelete && (
              <Tooltip title="Delete image">
                <IconButton
                  onClick={handleDelete}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 1)'
                    }
                  }}
                  size="small"
                >
                  <DeleteIcon color="error" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        ) : (
          <Box>
            <ImageIcon
              sx={{
                fontSize: 64,
                color: disabled || uploading ? 'text.disabled' : 'text.secondary',
                mb: 2
              }}
            />
            <Typography
              variant="h6"
              color={disabled || uploading ? 'text.disabled' : 'text.primary'}
              gutterBottom
            >
              {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
            </Typography>
            <Typography
              variant="body2"
              color={disabled || uploading ? 'text.disabled' : 'text.secondary'}
            >
              PNG, JPG, GIF up to {maxSize}MB
            </Typography>
          </Box>
        )}

        {uploading && (
          <Box sx={{ width: '100%', mt: 2 }}>
            <LinearProgress
              variant="determinate"
              value={uploadProgress}
              sx={{ mb: 1 }}
            />
            <Typography variant="body2" color="text.secondary">
              {uploadProgress}% uploaded
            </Typography>
          </Box>
        )}

        {!currentImage && !uploading && (
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            disabled={disabled}
            sx={{ mt: 2 }}
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
          >
            Choose File
          </Button>
        )}
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default ImageUpload;
