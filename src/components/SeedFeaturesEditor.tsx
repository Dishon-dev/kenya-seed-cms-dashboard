import React, { useState, useEffect } from 'react';
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
  Fab,
  Paper,
  LinearProgress,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Image as ImageIcon,
  Article as ArticleIcon,
  CalendarToday as CalendarIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5001';

interface SeedFeature {
  id?: string;
  title: string;
  date: string;
  heroImage: string;
  content: string;
  order: number;
  isActive: boolean;
  category: string;
  author: string;
  readTime: string;
}

interface SeedFeaturesData {
  id: string;
  hero: {
    title: string;
    subtitle: string;
  };
  features: SeedFeature[];
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

const SeedFeaturesEditor: React.FC = () => {
  const [seedFeaturesData, setSeedFeaturesData] = useState<SeedFeaturesData | null>(null);
  const [editingFeature, setEditingFeature] = useState<Partial<SeedFeature> | null>(null);
  const [isFeatureDialogOpen, setIsFeatureDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const queryClient = useQueryClient();

  // Fetch Seed Features data
  const { data, isPending, error } = useQuery({
    queryKey: ['seed-features'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/api/seed-features`);
      return response.data;
    },
    retry: 2,
    staleTime: 30000
  });

  // Update Seed Features data
  const updateSeedFeaturesMutation = useMutation({
    mutationFn: async (data: SeedFeaturesData) => {
      const response = await axios.post(`${API_BASE}/api/seed-features`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seed-features'] });
      showMessage('success', 'Seed features updated successfully');
    },
    onError: (error: any) => {
      showMessage('error', error?.response?.data?.error || 'Failed to update seed features');
    }
  });

  // Upload image
  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await axios.post(`${API_BASE}/api/upload/image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          setUploadProgress(progress);
        },
      });
      return response.data;
    },
    onSuccess: (data) => {
      showMessage('success', 'Image uploaded successfully');
      setIsUploading(false);
      setUploadProgress(0);
    },
    onError: (error: any) => {
      showMessage('error', error?.response?.data?.error || 'Failed to upload image');
      setIsUploading(false);
      setUploadProgress(0);
    }
  });

  // Delete Seed Feature
  const deleteFeatureMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.delete(`${API_BASE}/api/seed-features/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seed-features'] });
      showMessage('success', 'Seed feature deleted successfully');
    },
    onError: (error: any) => {
      showMessage('error', error?.response?.data?.error || 'Failed to delete seed feature');
    }
  });

  // Reset Seed Features to default
  const resetSeedFeaturesMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.delete(`${API_BASE}/api/seed-features`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seed-features'] });
      showMessage('success', 'Seed features reset to default');
    },
    onError: (error: any) => {
      showMessage('error', error?.response?.data?.error || 'Failed to reset seed features');
    }
  });

  useEffect(() => {
    if (data) {
      setSeedFeaturesData(data);
    }
  }, [data]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const addFeature = () => {
    setEditingFeature({
      title: '',
      date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }),
      heroImage: '',
      content: '',
      order: seedFeaturesData?.features.length || 0,
      isActive: true,
      category: 'Seed Feature',
      author: 'Kenya Seed Team',
      readTime: '5 min read'
    });
    setIsFeatureDialogOpen(true);
  };

  const editFeature = (feature: SeedFeature) => {
    setEditingFeature(feature);
    setIsFeatureDialogOpen(true);
  };

  const saveFeature = async () => {
    if (!editingFeature || !seedFeaturesData) return;

    if (!editingFeature.title || !editingFeature.content) {
      showMessage('error', 'Title and content are required');
      return;
    }

    let updatedFeatures: SeedFeature[];
    if (editingFeature.id) {
      // Update existing feature
      updatedFeatures = seedFeaturesData.features.map(item => 
        item.id === editingFeature.id ? { ...item, ...editingFeature } : item
      );
    } else {
      // Add new feature
      const newFeature: SeedFeature = {
        ...editingFeature as SeedFeature,
        id: `feature-${Date.now()}`
      };
      updatedFeatures = [...seedFeaturesData.features, newFeature];
    }

    const updatedData = {
      ...seedFeaturesData,
      features: updatedFeatures
    };

    updateSeedFeaturesMutation.mutate(updatedData);
    setIsFeatureDialogOpen(false);
    setEditingFeature(null);
  };

  const deleteFeature = async (id: string) => {
    if (!seedFeaturesData) return;

    const updatedFeatures = seedFeaturesData.features.filter(item => item.id !== id);
    const updatedData = {
      ...seedFeaturesData,
      features: updatedFeatures
    };

    updateSeedFeaturesMutation.mutate(updatedData);
    setDeleteConfirm({ open: false, id: null });
  };

  const reorderFeature = (fromIndex: number, toIndex: number) => {
    if (!seedFeaturesData) return;

    const updatedFeatures = [...seedFeaturesData.features];
    const [movedItem] = updatedFeatures.splice(fromIndex, 1);
    updatedFeatures.splice(toIndex, 0, movedItem);

    // Update order numbers
    const reorderedFeatures = updatedFeatures.map((item, index) => ({
      ...item,
      order: index
    }));

    const updatedData = {
      ...seedFeaturesData,
      features: reorderedFeatures
    };

    updateSeedFeaturesMutation.mutate(updatedData);
  };

  const updateHero = (field: 'title' | 'subtitle', value: string) => {
    if (!seedFeaturesData) return;

    const updatedData = {
      ...seedFeaturesData,
      hero: {
        ...seedFeaturesData.hero,
        [field]: value
      }
    };

    updateSeedFeaturesMutation.mutate(updatedData);
  };

  const toggleFeatureStatus = (id: string) => {
    if (!seedFeaturesData) return;

    const updatedFeatures = seedFeaturesData.features.map(item =>
      item.id === id ? { ...item, isActive: !item.isActive } : item
    );

    const updatedData = {
      ...seedFeaturesData,
      features: updatedFeatures
    };

    updateSeedFeaturesMutation.mutate(updatedData);
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const result = await uploadImageMutation.mutateAsync(file);
      if (editingFeature) {
        setEditingFeature({ ...editingFeature, heroImage: result.imagePath });
      }
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const resolveImageUrl = (path?: string, fallback = '/api/images/placeholder-600x400.jpg') => {
    if (!path) return `${API_BASE}${fallback}`;
    if (path.startsWith('http') || path.startsWith('//')) return path;
    if (path.startsWith('/api/images/')) {
      return `${API_BASE}${path}`;
    }
    return `${API_BASE}${path.startsWith('/') ? path : '/' + path}`;
  };

  if (isPending) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">Failed to load seed features data. Please try again.</Alert>;
  }

  if (!seedFeaturesData) {
    return <Alert severity="warning">No seed features data found. Please contact your administrator.</Alert>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Seed Features Management
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage your seed feature articles and educational content. Changes will appear on your website immediately.
      </Typography>

      {/* Live Preview */}
      <Box sx={{ mb: 4, position: 'relative' }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 2, color: 'primary.main', fontWeight: 'bold' }}>Live Preview - This is how your seed features section appears to visitors
        </Typography>
        
        <Paper sx={{ p: 3, border: '1px solid #e5e7eb', borderRadius: 2 }}>
          {/* Hero Section Preview */}
          <Box sx={{ 
            background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', 
            color: 'white', 
            p: 4, 
            borderRadius: 2, 
            mb: 3,
            textAlign: 'center'
          }}>
            <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 2 }}>
              {seedFeaturesData.hero.title}
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, maxWidth: '600px', mx: 'auto' }}>
              {seedFeaturesData.hero.subtitle}
            </Typography>
          </Box>

          {/* Features Preview */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {seedFeaturesData.features
              .filter(feature => feature.isActive)
              .sort((a, b) => a.order - b.order)
              .map((feature, index) => (
                <Card key={feature.id || index} sx={{ border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                  <Box sx={{ p: 3 }}>
                    {/* Article Header */}
                    <Box sx={{ mb: 2, pb: 2, borderBottom: '1px solid #e5e7eb' }}>
                      <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'green.800', mb: 1 }}>
                        {feature.title}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          {feature.category} • {feature.date}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {feature.author}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {feature.readTime}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Hero Image */}
                    <Box sx={{ mb: 3 }}>
                      <img
                        src={resolveImageUrl(feature.heroImage)}
                        alt={feature.title}
                        style={{
                          width: '100%',
                          height: '320px',
                          objectFit: 'cover',
                          borderRadius: '8px'
                        }}
                        onError={(e: any) => (e.currentTarget.src = `${API_BASE}/api/images/placeholder-600x400.jpg`)}
                      />
                    </Box>

                    {/* Article Content */}
                    <Box sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          whiteSpace: 'pre-line',
                          display: '-webkit-box',
                          WebkitLineClamp: 6,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {feature.content}
                      </Typography>
                    </Box>
                  </Box>
                </Card>
              ))}
          </Box>
        </Paper>
      </Box>

      {/* Management Controls */}
      <Box sx={{ mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6">Seed Features Management</Typography>
          <Box>
            <Button
              variant="outlined"
              startIcon={<ArticleIcon />}
              onClick={() => resetSeedFeaturesMutation.mutate()}
              disabled={resetSeedFeaturesMutation.isPending}
              sx={{ mr: 2 }}
            >
              Reset to Default
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={addFeature}
              disabled={updateSeedFeaturesMutation.isPending}
            >
              Add Seed Feature
            </Button>
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Manage your seed feature articles and educational content. Click edit to modify existing features or add new ones.
        </Typography>

        {/* Hero Section Controls */}
        <Box sx={{ mb: 3, p: 2, border: '1px solid #e5e7eb', borderRadius: 1 }}>
          <Typography variant="h6" gutterBottom>
            Hero Section Settings
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Hero Title"
                value={seedFeaturesData.hero.title}
                onChange={(e) => updateHero('title', e.target.value)}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Hero Subtitle"
                value={seedFeaturesData.hero.subtitle}
                onChange={(e) => updateHero('subtitle', e.target.value)}
                margin="normal"
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </Box>

        {/* Features List */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {seedFeaturesData.features
            .sort((a, b) => a.order - b.order)
            .map((feature, index) => (
              <Card key={feature.id || index} sx={{ border: '1px solid #e5e7eb' }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 500, mb: 1 }}>
                        {feature.title}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          {feature.category} • {feature.date}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {feature.author}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {feature.readTime}
                        </Typography>
                      </Box>
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ 
                          whiteSpace: 'pre-line',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          mb: 1
                        }}
                      >
                        {feature.content}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Chip 
                          label={feature.isActive ? 'Active' : 'Inactive'} 
                          color={feature.isActive ? 'success' : 'default'} 
                          size="small" 
                        />
                        <Chip 
                          label={`Order: ${feature.order}`} 
                          variant="outlined" 
                          size="small" 
                        />
                        <FormControlLabel
                          control={
                            <Switch
                              checked={feature.isActive}
                              onChange={() => feature.id && toggleFeatureStatus(feature.id)}
                              size="small"
                            />
                          }
                          label="Active"
                          labelPlacement="start"
                        />
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => editFeature(feature)}
                        disabled={updateSeedFeaturesMutation.isPending}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => setDeleteConfirm({ open: true, id: feature.id || null })}
                        disabled={updateSeedFeaturesMutation.isPending}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
        </Box>
      </Box>

      {/* Add/Edit Feature Dialog */}
      <Dialog open={isFeatureDialogOpen} onClose={() => setIsFeatureDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingFeature?.id ? 'Edit Seed Feature' : 'Add New Seed Feature'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={editingFeature?.title || ''}
                onChange={(e) => setEditingFeature({ ...editingFeature!, title: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date"
                value={editingFeature?.date || ''}
                onChange={(e) => setEditingFeature({ ...editingFeature!, date: e.target.value })}
                helperText="e.g., 3rd June 2025"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Category"
                value={editingFeature?.category || ''}
                onChange={(e) => setEditingFeature({ ...editingFeature!, category: e.target.value })}
                helperText="e.g., Seed Feature, Agriculture Tips"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Author"
                value={editingFeature?.author || ''}
                onChange={(e) => setEditingFeature({ ...editingFeature!, author: e.target.value })}
                helperText="e.g., Kenya Seed Team"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Read Time"
                value={editingFeature?.readTime || ''}
                onChange={(e) => setEditingFeature({ ...editingFeature!, readTime: e.target.value })}
                helperText="e.g., 5 min read"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Hero Image URL or server path"
                value={editingFeature?.heroImage || ''}
                onChange={(e) => setEditingFeature({ ...editingFeature!, heroImage: e.target.value })}
                helperText="Absolute URL or server path like /uploads/.."
              />
            </Grid>
            <Grid item xs={12}>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFileUpload(file);
                  }
                }}
                style={{ display: 'none' }}
                id="image-upload"
              />
              <label htmlFor="image-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<ImageIcon />}
                  disabled={isUploading}
                  sx={{ mb: 2 }}
                >
                  {isUploading ? 'Uploading...' : 'Upload Image'}
                </Button>
              </label>
              {isUploading && (
                <Box sx={{ width: '100%', mb: 2 }}>
                  <LinearProgress variant="determinate" value={uploadProgress} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Uploading... {uploadProgress}%
                  </Typography>
                </Box>
              )}
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Content"
                value={editingFeature?.content || ''}
                onChange={(e) => setEditingFeature({ ...editingFeature!, content: e.target.value })}
                required
                multiline
                rows={8}
                helperText="Use line breaks to format your content. Each line break will be preserved in the display."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Order"
                type="number"
                value={editingFeature?.order || 0}
                onChange={(e) => setEditingFeature({ ...editingFeature!, order: parseInt(e.target.value) || 0 })}
                helperText="Lower numbers appear first"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={editingFeature?.isActive || false}
                    onChange={(e) => setEditingFeature({ ...editingFeature!, isActive: e.target.checked })}
                  />
                }
                label="Active"
              />
            </Grid>
            <Grid item xs={12}>
              {editingFeature?.heroImage && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <img 
                    src={resolveImageUrl(editingFeature.heroImage)} 
                    alt="preview" 
                    style={{ 
                      width: '200px', 
                      height: '150px', 
                      objectFit: 'cover', 
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb'
                    }}
                    onError={(e: any) => (e.currentTarget.src = `${API_BASE}/api/images/placeholder-600x400.jpg`)}
                  />
                  <Chip label={resolveImageUrl(editingFeature.heroImage)} size="small" />
                </Box>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsFeatureDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={saveFeature} 
            variant="contained" 
            disabled={updateSeedFeaturesMutation.isPending || !editingFeature?.title || !editingFeature?.content}
          >
            {updateSeedFeaturesMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm.open} onClose={() => setDeleteConfirm({ open: false, id: null })}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this seed feature? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm({ open: false, id: null })}>
            Cancel
          </Button>
          <Button 
            onClick={() => deleteConfirm.id && deleteFeature(deleteConfirm.id)} 
            color="error" 
            variant="contained"
            disabled={deleteFeatureMutation.isPending}
          >
            {deleteFeatureMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Add Button */}
      <Fab
        color="primary"
        aria-label="add seed feature"
        onClick={addFeature}
        disabled={updateSeedFeaturesMutation.isPending}
        sx={{
          position: "fixed",
          bottom: 20,
          right: 20,
          zIndex: 1000,
        }}
      >
        <AddIcon />
      </Fab>

      {/* Success/Error Messages */}
      <Snackbar
        open={!!message}
        autoHideDuration={5000}
        onClose={() => setMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setMessage(null)} severity={message?.type} sx={{ width: '100%' }}>
          {message?.text}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SeedFeaturesEditor;
