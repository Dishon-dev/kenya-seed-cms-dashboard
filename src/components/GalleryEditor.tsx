import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Chip,
  Divider,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Upload as UploadIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5001';

interface GalleryImage {
  id: number;
  filename: string;
  url: string;
  order: number;
  isActive: boolean;
  size?: number;
  mimeType?: string;
}

interface GalleryCategory {
  id: number;
  title: string;
  overview: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  images: GalleryImage[];
}

const GalleryEditor = () => {
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editingCategory, setEditingCategory] = useState<GalleryCategory | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploadingImages, setUploadingImages] = useState<{ [categoryId: number]: boolean }>({});

  const queryClient = useQueryClient();

  // Fetch gallery data
  const { data: categories, isLoading, error } = useQuery<GalleryCategory[]>({
    queryKey: ['galleryData'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/api/gallery`);
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<GalleryCategory> }) => {
      const response = await axios.put(`${API_BASE}/api/gallery/categories/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['galleryData'] });
      showMessage({ type: 'success', text: 'Category updated successfully!' });
    },
    onError: (error: any) => {
      showMessage({ type: 'error', text: `Error updating category: ${error.response?.data?.message || error.message}` });
    },
  });

  // Upload image mutation
  const uploadImageMutation = useMutation({
    mutationFn: async ({ categoryId, file }: { categoryId: number; file: File }) => {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await axios.post(`${API_BASE}/api/gallery/upload/${categoryId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['galleryData'] });
      showMessage({ type: 'success', text: 'Image uploaded successfully!' });
      setUploadingImages(prev => ({ ...prev, [variables.categoryId]: false }));
    },
    onError: (error: any) => {
      showMessage({ type: 'error', text: `Error uploading image: ${error.response?.data?.message || error.message}` });
      setUploadingImages(prev => ({ ...prev, [Object.keys(prev).find(key => prev[parseInt(key)] === true) as any]: false }));
    },
  });

  const showMessage = (msg: { type: 'success' | 'error'; text: string }) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 5000);
  };

  const handleEditCategory = (category: GalleryCategory) => {
    setEditingCategory(category);
    setIsDialogOpen(true);
  };

  const handleSaveCategory = () => {
    if (!editingCategory) return;
    
    updateCategoryMutation.mutate({
      id: editingCategory.id,
      data: {
        title: editingCategory.title,
        overview: editingCategory.overview,
        order_index: editingCategory.order_index,
        is_active: editingCategory.is_active
      }
    });
    
    setIsDialogOpen(false);
    setEditingCategory(null);
  };

  const handleImageUpload = (categoryId: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showMessage({ type: 'error', text: 'Please select a valid image file' });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      showMessage({ type: 'error', text: 'File size must be less than 5MB' });
      return;
    }

    setUploadingImages(prev => ({ ...prev, [categoryId]: true }));
    uploadImageMutation.mutate({ categoryId, file });
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Failed to load gallery data. Please try again.
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          Gallery Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            // TODO: Implement add category functionality
            showMessage({ type: 'error', text: 'Add category functionality not implemented yet' });
          }}
        >
          Add Category
        </Button>
      </Box>

      <Grid container spacing={3}>
        {categories?.map((category) => (
          <Grid item xs={12} md={6} key={category.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Typography variant="h6" component="h2">
                    {category.title}
                  </Typography>
                  <Chip
                    label={category.is_active ? 'Active' : 'Inactive'}
                    color={category.is_active ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
                
                <Typography variant="body2" color="text.secondary" paragraph>
                  {category.overview}
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" gutterBottom>
                  Images ({category.images.length})
                </Typography>

                {category.images.length > 0 ? (
                  <Grid container spacing={2}>
                    {category.images.map((image) => (
                      <Grid item xs={12} sm={6} md={4} key={image.id}>
                        <Card variant="outlined">
                          <Box
                            sx={{
                              height: 200,
                              backgroundImage: `url(${API_BASE}${image.url})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              backgroundRepeat: 'no-repeat',
                              position: 'relative',
                              display: 'flex',
                              alignItems: 'flex-end'
                            }}
                          >
                            <Box
                              sx={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                                color: 'white',
                                p: 1
                              }}
                            >
                              <Typography variant="body2" noWrap>
                                {image.filename}
                              </Typography>
                              <Typography variant="caption" display="block">
                                {image.size ? `${(image.size / 1024).toFixed(1)} KB` : 'Unknown size'}
                                {image.mimeType && ` • ${image.mimeType.split('/')[1].toUpperCase()}`}
                              </Typography>
                            </Box>
                          </Box>
                          <CardContent sx={{ p: 1 }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Typography variant="caption" color="text.secondary">
                                Order: {image.order}
                              </Typography>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => {
                                  // TODO: Implement delete image functionality
                                  showMessage({ type: 'error', text: 'Delete image functionality not implemented yet' });
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No images in this category
                  </Typography>
                )}

                <Box mt={2}>
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id={`upload-${category.id}`}
                    type="file"
                    onChange={(e) => handleImageUpload(category.id, e)}
                  />
                  <label htmlFor={`upload-${category.id}`}>
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<UploadIcon />}
                      disabled={uploadingImages[category.id]}
                      fullWidth
                    >
                      {uploadingImages[category.id] ? 'Uploading...' : 'Upload Image'}
                    </Button>
                  </label>
                </Box>
              </CardContent>

              <CardActions>
                <Button
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => handleEditCategory(category)}
                >
                  Edit
                </Button>
                <Button
                  size="small"
                  startIcon={<DeleteIcon />}
                  color="error"
                  onClick={() => {
                    // TODO: Implement delete category functionality
                    showMessage({ type: 'error', text: 'Delete category functionality not implemented yet' });
                  }}
                >
                  Delete
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Edit Category Dialog */}
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Category</DialogTitle>
        <DialogContent>
          {editingCategory && (
            <Box pt={2}>
              <TextField
                fullWidth
                label="Title"
                value={editingCategory.title}
                onChange={(e) => setEditingCategory({ ...editingCategory, title: e.target.value })}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Overview"
                value={editingCategory.overview}
                onChange={(e) => setEditingCategory({ ...editingCategory, overview: e.target.value })}
                margin="normal"
                multiline
                rows={4}
              />
              <TextField
                fullWidth
                label="Order Index"
                type="number"
                value={editingCategory.order_index}
                onChange={(e) => setEditingCategory({ ...editingCategory, order_index: parseInt(e.target.value) || 0 })}
                margin="normal"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveCategory} variant="contained" disabled={updateCategoryMutation.isPending}>
            {updateCategoryMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for messages */}
      <Snackbar
        open={!!message}
        autoHideDuration={5000}
        onClose={() => setMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setMessage(null)}
          severity={message?.type}
          sx={{ width: '100%' }}
        >
          {message?.text}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default GalleryEditor;
