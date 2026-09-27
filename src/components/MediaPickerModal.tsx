//cms-dashboard/src/components/MediaPickerModal.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
  IconButton,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Close as CloseIcon,
  Search as SearchIcon,
  Image as ImageIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface MediaFile {
  id: string;
  filename: string;
  url: string;
  size: number;
  uploadedAt: string;
  type: string;
  mimeType?: string;
}

interface MediaPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  title?: string;
  acceptTypes?: string[];
}

const MediaPickerModal: React.FC<MediaPickerModalProps> = ({
  open,
  onClose,
  onSelect,
  title = 'Select Media',
  acceptTypes = ['image/*'],
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);

  // Fetch media files
  const { data: mediaFiles, isLoading, error } = useQuery({
    queryKey: ['media-files'],
    queryFn: async () => {
      const response = await axios.get('/api/media/files');
      return response.data;
    },
    enabled: open,
  });

  // Filter files based on search term and accepted types
  const filteredFiles = React.useMemo(() => {
    if (!mediaFiles) return [];
    
    return mediaFiles.filter((file: MediaFile) => {
      const filename = file.filename ?? '';
      const fileType = (file.mimeType ?? file.type ?? '').toLowerCase();
      const matchesSearch = filename.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = acceptTypes.some(type => {
        if (type === 'image/*') return fileType.startsWith('image/');
        return fileType === type;
      });
      return matchesSearch && matchesType;
    });
  }, [mediaFiles, searchTerm, acceptTypes]);

  const handleSelect = () => {
    if (selectedFile) {
      onSelect(selectedFile.url);
      onClose();
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  useEffect(() => {
    if (open) {
      setSearchTerm('');
      setSelectedFile(null);
    }
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="media-picker-title"
    >
      <DialogTitle id="media-picker-title">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">{title}</Typography>
          <IconButton
            aria-label="Close media picker"
            onClick={onClose}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Search */}
        <TextField
          fullWidth
          placeholder="Search media files..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />

        {/* Loading State */}
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Error State */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Failed to load media files. Please try again.
          </Alert>
        )}

        {/* No Files */}
        {!isLoading && !error && filteredFiles.length === 0 && (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <ImageIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              {searchTerm ? 'No files match your search.' : 'No media files found.'}
            </Typography>
          </Box>
        )}

        {/* Media Grid */}
        {!isLoading && !error && filteredFiles.length > 0 && (
          <Grid container spacing={2}>
            {filteredFiles.map((file: MediaFile) => (
              <Grid item xs={12} sm={6} md={4} key={file.id}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    border: selectedFile?.id === file.id ? 2 : 1,
                    borderColor: selectedFile?.id === file.id ? 'primary.main' : 'divider',
                    '&:hover': {
                      borderColor: 'primary.main',
                    },
                  }}
                  onClick={() => setSelectedFile(file)}
                >
                  <CardMedia
                    component="img"
                    height="140"
                    image={file.url}
                    alt={file.filename}
                    sx={{ objectFit: 'cover' }}
                  />
                  <CardContent>
                    <Typography variant="subtitle2" noWrap title={file.filename}>
                      {file.filename}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatFileSize(file.size)} • {formatDate(file.uploadedAt)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          aria-label="Cancel media selection"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSelect}
          disabled={!selectedFile}
          variant="contained"
          startIcon={<UploadIcon />}
          aria-label="Select media file"
        >
          Select
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MediaPickerModal;
