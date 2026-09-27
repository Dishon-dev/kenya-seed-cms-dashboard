import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  IconButton,
  Chip,
  CircularProgress,
  Fab,
  Paper,
  LinearProgress,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
  Business as PartnersIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5001';

interface Partner {
  id?: string;
  name: string;
  image: string;
  website?: string;
  description?: string;
  order: number;
  isActive: boolean;
  category?: string;
}

interface PartnersData {
  id: string;
  hero: {
    title: string;
    subtitle: string;
  };
  partners: Partner[];
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

const PartnersEditor: React.FC = () => {
  const [partnersData, setPartnersData] = useState<PartnersData | null>(null);
  const [editingPartner, setEditingPartner] = useState<Partial<Partner> | null>(null);
  const [isPartnerDialogOpen, setIsPartnerDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const queryClient = useQueryClient();

  // Fetch Partners data with throttling
  const { data, isPending, error } = useQuery({
    queryKey: ['partners'],
    queryFn: async () => {
      try {
        const response = await axios.get(`${API_BASE}/api/partners`, {
          timeout: 10000,
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        return response.data;
      } catch (error: any) {
        if (error.response?.status === 429) {
          // Wait and retry once
          await new Promise(resolve => setTimeout(resolve, 2000));
          const response = await axios.get(`${API_BASE}/api/partners`, {
            timeout: 10000,
            headers: {
              'Cache-Control': 'no-cache'
            }
          });
          return response.data;
        }
        throw error;
      }
    },
    retry: 1,
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false
  });

  // Update Partners data with throttling
  const updatePartnersMutation = useMutation({
    mutationFn: async (data: PartnersData) => {
      try {
        const response = await axios.post(`${API_BASE}/api/partners`, data, {
          timeout: 15000,
          headers: {
            'Content-Type': 'application/json'
          }
        });
        return response.data;
      } catch (error: any) {
        if (error.response?.status === 429) {
          // Wait and retry once
          await new Promise(resolve => setTimeout(resolve, 3000));
          const response = await axios.post(`${API_BASE}/api/partners`, data, {
            timeout: 15000,
            headers: {
              'Content-Type': 'application/json'
            }
          });
          return response.data;
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] });
      showMessage('success', 'Partners updated successfully');
    },
    onError: (error: any) => {
      showMessage('error', error?.response?.data?.error || 'Failed to update partners');
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

  // Delete Partner
  const deletePartnerMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.delete(`${API_BASE}/api/partners/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] });
      showMessage('success', 'Partner deleted successfully');
    },
    onError: (error: any) => {
      showMessage('error', error?.response?.data?.error || 'Failed to delete partner');
    }
  });

  // Reset Partners to default
  const resetPartnersMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.delete(`${API_BASE}/api/partners`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] });
      showMessage('success', 'Partners reset to default');
    },
    onError: (error: any) => {
      showMessage('error', error?.response?.data?.error || 'Failed to reset partners');
    }
  });

  useEffect(() => {
    if (data) {
      setPartnersData(data);
    }
  }, [data]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  // Debounced update function to prevent rapid API calls
  const debouncedUpdate = useCallback((data: PartnersData) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      updatePartnersMutation.mutate(data);
    }, 1000); // 1 second debounce
  }, [updatePartnersMutation]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const addPartner = () => {
    setEditingPartner({
      name: '',
      image: '',
      website: '',
      description: '',
      order: partnersData?.partners.length || 0,
      isActive: true,
      category: 'Government'
    });
    setIsPartnerDialogOpen(true);
  };

  const editPartner = (partner: Partner) => {
    setEditingPartner(partner);
    setIsPartnerDialogOpen(true);
  };

  const savePartner = async () => {
    if (!editingPartner || !partnersData) return;

    if (!editingPartner.name || !editingPartner.image) {
      showMessage('error', 'Name and image are required');
      return;
    }

    let updatedPartners: Partner[];
    if (editingPartner.id) {
      // Update existing partner
      updatedPartners = partnersData.partners.map(item => 
        item.id === editingPartner.id ? { ...item, ...editingPartner } : item
      );
    } else {
      // Add new partner
      const newPartner: Partner = {
        ...editingPartner as Partner,
        id: `partner-${Date.now()}`
      };
      updatedPartners = [...partnersData.partners, newPartner];
    }

    const updatedData = {
      ...partnersData,
      partners: updatedPartners
    };

    updatePartnersMutation.mutate(updatedData);
    setIsPartnerDialogOpen(false);
    setEditingPartner(null);
  };

  const deletePartner = async (id: string) => {
    if (!partnersData) return;

    const updatedPartners = partnersData.partners.filter(item => item.id !== id);
    const updatedData = {
      ...partnersData,
      partners: updatedPartners
    };

    updatePartnersMutation.mutate(updatedData);
    setDeleteConfirm({ open: false, id: null });
  };

  const reorderPartner = (fromIndex: number, toIndex: number) => {
    if (!partnersData) return;

    const updatedPartners = [...partnersData.partners];
    const [movedItem] = updatedPartners.splice(fromIndex, 1);
    updatedPartners.splice(toIndex, 0, movedItem);

    // Update order numbers
    const reorderedPartners = updatedPartners.map((item, index) => ({
      ...item,
      order: index
    }));

    const updatedData = {
      ...partnersData,
      partners: reorderedPartners
    };

    updatePartnersMutation.mutate(updatedData);
  };

  const updateHero = (field: 'title' | 'subtitle', value: string) => {
    if (!partnersData) return;

    const updatedData = {
      ...partnersData,
      hero: {
        ...partnersData.hero,
        [field]: value
      }
    };

    // Update local state immediately for responsive UI
    setPartnersData(updatedData);
    
    // Debounce the API call
    debouncedUpdate(updatedData);
  };

  const togglePartnerStatus = (id: string) => {
    if (!partnersData) return;

    const updatedPartners = partnersData.partners.map(item =>
      item.id === id ? { ...item, isActive: !item.isActive } : item
    );

    const updatedData = {
      ...partnersData,
      partners: updatedPartners
    };

    // Update local state immediately for responsive UI
    setPartnersData(updatedData);
    
    // Debounce the API call
    debouncedUpdate(updatedData);
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const result = await uploadImageMutation.mutateAsync(file);
      if (editingPartner) {
        const imageValue = result.imagePath || result.imageUrl || '';
        if (!imageValue) {
          showMessage('error', 'Upload completed but no image path was returned');
          return;
        }
        setEditingPartner({ ...editingPartner, image: imageValue });
        if (partnersData && editingPartner.id) {
          const updatedPartners = partnersData.partners.map((partner) =>
            partner.id === editingPartner.id ? { ...partner, image: imageValue } : partner
          );
          setPartnersData({ ...partnersData, partners: updatedPartners });
        }
      }
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const resolveImageUrl = (path?: string) => {
    const placeholderSvg = encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400">
        <rect width="100%" height="100%" fill="#e5e7eb"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#6b7280" font-family="Arial, sans-serif" font-size="20">
          No Image
        </text>
      </svg>`
    );
    const placeholderUrl = `data:image/svg+xml;utf8,${placeholderSvg}`;

    if (!path) return placeholderUrl;
    if (path.includes('placeholder-600x400')) return placeholderUrl;
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
    return <Alert severity="error">Failed to load partners data. Please try again.</Alert>;
  }

  if (!partnersData) {
    return <Alert severity="warning">No partners data found. Please contact your administrator.</Alert>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Partners Management
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage your partners and collaborators. Changes will appear on your website immediately.
      </Typography>

      {/* Live Preview */}
      <Box sx={{ mb: 4, position: 'relative' }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 2, color: 'primary.main', fontWeight: 'bold' }}>Live Preview - This is how your partners section appears to visitors
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
              {partnersData.hero.title}
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, maxWidth: '600px', mx: 'auto' }}>
              {partnersData.hero.subtitle}
            </Typography>
          </Box>

          {/* Partners Preview */}
          <Box sx={{ 
            bgcolor: 'grey.100', 
            p: 3, 
            borderRadius: 2,
            overflow: 'hidden',
            position: 'relative'
          }}>
            <Typography variant="h6" sx={{ textAlign: 'center', mb: 3, color: 'text.secondary' }}>
              Partner Logos (Auto-scrolling)
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              gap: 3, 
              overflowX: 'auto',
              pb: 2,
              '&::-webkit-scrollbar': { height: 8 },
              '&::-webkit-scrollbar-track': { bgcolor: 'grey.200', borderRadius: 4 },
              '&::-webkit-scrollbar-thumb': { bgcolor: 'grey.400', borderRadius: 4 }
            }}>
              {partnersData.partners
                .filter(partner => partner.isActive)
                .sort((a, b) => a.order - b.order)
                .map((partner, index) => (
                  <Box 
                    key={partner.id || index}
                    sx={{ 
                      flex: '0 0 120px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'white',
                      borderRadius: 2,
                      p: 2,
                      boxShadow: 1,
                      minHeight: '80px'
                    }}
                  >
                    <img
                      src={resolveImageUrl(partner.image)}
                      alt={partner.name}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '60px',
                        objectFit: 'contain'
                      }}
                      onError={(e: any) => (e.currentTarget.src = resolveImageUrl())}
                    />
                  </Box>
                ))}
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Management Controls */}
      <Box sx={{ mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6">Partners Management</Typography>
          <Box>
            <Button
              variant="outlined"
              startIcon={<PartnersIcon />}
              onClick={() => resetPartnersMutation.mutate()}
              disabled={resetPartnersMutation.isPending}
              sx={{ mr: 2 }}
            >
              Reset to Default
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={addPartner}
              disabled={updatePartnersMutation.isPending}
            >
              Add Partner
            </Button>
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Manage your partners and collaborators. Click edit to modify existing partners or add new ones.
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
                value={partnersData.hero.title}
                onChange={(e) => updateHero('title', e.target.value)}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Hero Subtitle"
                value={partnersData.hero.subtitle}
                onChange={(e) => updateHero('subtitle', e.target.value)}
                margin="normal"
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </Box>

        {/* Partners List */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {partnersData.partners
            .sort((a, b) => a.order - b.order)
            .map((partner, index) => (
              <Card key={partner.id || index} sx={{ border: '1px solid #e5e7eb' }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                      {/* Partner Logo */}
                      <Box sx={{ 
                        width: 80, 
                        height: 60, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        bgcolor: 'grey.100',
                        borderRadius: 1,
                        p: 1
                      }}>
                        <img
                          src={resolveImageUrl(partner.image)}
                          alt={partner.name}
                          style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'contain'
                          }}
                          onError={(e: any) => (e.currentTarget.src = resolveImageUrl())}
                        />
                      </Box>
                      
                      {/* Partner Info */}
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 500, mb: 1 }}>
                          {partner.name}
                        </Typography>
                        {partner.website && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Website: {partner.website}
                          </Typography>
                        )}
                        {partner.description && (
                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            sx={{ 
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              mb: 1
                            }}
                          >
                            {partner.description}
                          </Typography>
                        )}
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <Chip 
                            label={partner.isActive ? 'Active' : 'Inactive'} 
                            color={partner.isActive ? 'success' : 'default'} 
                            size="small" 
                          />
                          <Chip 
                            label={`Order: ${partner.order}`} 
                            variant="outlined" 
                            size="small" 
                          />
                          {partner.category && (
                            <Chip 
                              label={partner.category} 
                              variant="outlined" 
                              size="small" 
                            />
                          )}
                          <FormControlLabel
                            control={
                              <Switch
                                checked={partner.isActive}
                                onChange={() => partner.id && togglePartnerStatus(partner.id)}
                                size="small"
                              />
                            }
                            label="Active"
                            labelPlacement="start"
                          />
                        </Box>
                      </Box>
                    </Box>
                    
                    {/* Action Buttons */}
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => editPartner(partner)}
                        disabled={updatePartnersMutation.isPending}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => setDeleteConfirm({ open: true, id: partner.id || null })}
                        disabled={updatePartnersMutation.isPending}
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

      {/* Add/Edit Partner Dialog */}
      <Dialog open={isPartnerDialogOpen} onClose={() => setIsPartnerDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingPartner?.id ? 'Edit Partner' : 'Add New Partner'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Partner Name"
                value={editingPartner?.name || ''}
                onChange={(e) => setEditingPartner({ ...editingPartner!, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Website"
                value={editingPartner?.website || ''}
                onChange={(e) => setEditingPartner({ ...editingPartner!, website: e.target.value })}
                helperText="e.g., https://example.com"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Category"
                value={editingPartner?.category || ''}
                onChange={(e) => setEditingPartner({ ...editingPartner!, category: e.target.value })}
                helperText="e.g., Government, NGO, Private"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Image URL or server path"
                value={editingPartner?.image || ''}
                onChange={(e) => setEditingPartner({ ...editingPartner!, image: e.target.value })}
                required
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
                label="Description"
                value={editingPartner?.description || ''}
                onChange={(e) => setEditingPartner({ ...editingPartner!, description: e.target.value })}
                multiline
                rows={3}
                helperText="Brief description of the partner organization"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Order"
                type="number"
                value={editingPartner?.order || 0}
                onChange={(e) => setEditingPartner({ ...editingPartner!, order: parseInt(e.target.value) || 0 })}
                helperText="Lower numbers appear first"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={editingPartner?.isActive || false}
                    onChange={(e) => setEditingPartner({ ...editingPartner!, isActive: e.target.checked })}
                  />
                }
                label="Active"
              />
            </Grid>
            <Grid item xs={12}>
              {editingPartner?.image && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <img 
                    src={resolveImageUrl(editingPartner.image)} 
                    alt="preview" 
                    style={{ 
                      width: '120px', 
                      height: '80px', 
                      objectFit: 'contain', 
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      backgroundColor: '#f7f8fa'
                    }}
                    onError={(e: any) => (e.currentTarget.src = resolveImageUrl())}
                  />
                  <Chip label={resolveImageUrl(editingPartner.image)} size="small" />
                </Box>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsPartnerDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={savePartner} 
            variant="contained" 
            disabled={updatePartnersMutation.isPending || !editingPartner?.name || !editingPartner?.image}
          >
            {updatePartnersMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm.open} onClose={() => setDeleteConfirm({ open: false, id: null })}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this partner? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm({ open: false, id: null })}>
            Cancel
          </Button>
          <Button 
            onClick={() => deleteConfirm.id && deletePartner(deleteConfirm.id)} 
            color="error" 
            variant="contained"
            disabled={deletePartnerMutation.isPending}
          >
            {deletePartnerMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Add Button */}
      <Fab
        color="primary"
        aria-label="add partner"
        onClick={addPartner}
        disabled={updatePartnersMutation.isPending}
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

export default PartnersEditor;
