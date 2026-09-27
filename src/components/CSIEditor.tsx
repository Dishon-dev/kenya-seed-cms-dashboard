import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  LinearProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  ExpandMore as ExpandMoreIcon,
  Upload as UploadIcon,
  Image as ImageIcon,
  Book,
  Park as Leaf,
  Favorite as HeartPulse,
  EmojiEvents as Trophy
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5001';

interface CSIPillar {
  id: string;
  title: string;
  description: string;
  icon: string;
  order: number;
  isActive: boolean;
}

interface CSIInitiative {
  id: string;
  title: string;
  overview: string;
  images: string[];
  order: number;
  isActive: boolean;
}

interface CSIData {
  hero: {
    title: string;
    subtitle: string;
  };
  intro: string;
  pillars: CSIPillar[];
  initiatives: CSIInitiative[];
}

const CSIEditor: React.FC = () => {
  const [csiData, setCsiData] = useState<CSIData | null>(null);
  const [editingPillar, setEditingPillar] = useState<Partial<CSIPillar> | null>(null);
  const [editingInitiative, setEditingInitiative] = useState<Partial<CSIInitiative> | null>(null);
  const [isPillarDialogOpen, setIsPillarDialogOpen] = useState(false);
  const [isInitiativeDialogOpen, setIsInitiativeDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; type: 'pillar' | 'initiative'; id: string | null }>({ open: false, type: 'pillar', id: null });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const mountedRef = useRef(true);
  const messageTimeoutRef = useRef<number | null>(null);
  const queryClient = useQueryClient();

  // Fetch CSI data
  const { data: csiResponse, isPending, error } = useQuery({
    queryKey: ['csi'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/api/csi`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      return response.data;
    },
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  });

  // Save CSI mutation
  const saveCsiMutation = useMutation<any, any, CSIData>({
    mutationFn: async (data) => {
      const response = await axios.post(`${API_BASE}/api/csi`, data, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['csi'] });
      showMessage('success', 'CSI data updated successfully!');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error || 
        error?.message || 
        'Failed to save CSI data';
      showMessage('error', errorMessage);
    }
  });

  // Upload image mutation
  const uploadImageMutation = useMutation<any, any, { file: File; initiativeId: string }>({
    mutationFn: async ({ file, initiativeId }) => {
      const formData = new FormData();
      formData.append('image', file);

      const response = await axios.post(`${API_BASE}/api/csi/upload/${initiativeId}`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        }
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      showMessage('success', 'Image uploaded successfully!');
      setUploadProgress(0);
      setIsUploading(false);
      if (data?.imageUrl && editingInitiative && String(editingInitiative.id) === String(variables.initiativeId)) {
        const existing = Array.isArray(editingInitiative.images) ? editingInitiative.images : [];
        if (!existing.includes(data.imageUrl)) {
          setEditingInitiative({ ...editingInitiative, images: [...existing, data.imageUrl] });
        }
      }
      // Refresh the CSI data to show the new image
      queryClient.invalidateQueries({ queryKey: ['csi'] });
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error || 
        error?.message || 
        'Failed to upload image';
      showMessage('error', errorMessage);
      setUploadProgress(0);
      setIsUploading(false);
    }
  });

  // Delete image mutation
  const deleteImageMutation = useMutation<any, any, string>({
    mutationFn: async (imageId) => {
      const response = await axios.delete(`${API_BASE}/api/csi/images/${imageId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data;
    },
    onSuccess: () => {
      showMessage('success', 'Image deleted successfully!');
      // Refresh the CSI data to remove the deleted image
      queryClient.invalidateQueries({ queryKey: ['csi'] });
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error || 
        error?.message || 
        'Failed to delete image';
      showMessage('error', errorMessage);
    }
  });

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
        messageTimeoutRef.current = null;
      }
    };
  }, []);

  const showMessage = useCallback((type: 'success' | 'error', text: string, ttl: number = 5000) => {
    if (!mountedRef.current) return;
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
      messageTimeoutRef.current = null;
    }
    setMessage({ type, text });
    messageTimeoutRef.current = window.setTimeout(() => {
      if (mountedRef.current) {
        setMessage(null);
        messageTimeoutRef.current = null;
      }
    }, ttl);
  }, []);

  useEffect(() => {
    if (csiResponse) {
      // Convert numeric IDs to strings for consistency
      const processedData = {
        ...csiResponse,
        pillars: csiResponse.pillars?.map((pillar: any) => ({
          ...pillar,
          id: String(pillar.id)
        })) || [],
        initiatives: csiResponse.initiatives?.map((initiative: any) => ({
          ...initiative,
          id: String(initiative.id)
        })) || []
      };
      setCsiData(processedData);
    }
  }, [csiResponse]);

  const toggleSection = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const openEditPillar = (pillar?: CSIPillar) => {
    setEditingPillar(pillar || {
      id: '',
      title: '',
      description: '',
      icon: 'book',
      order: csiData?.pillars.length || 0,
      isActive: true
    });
    setIsPillarDialogOpen(true);
  };

  const openEditInitiative = (initiative?: CSIInitiative) => {
    setEditingInitiative(initiative || {
      id: '',
      title: '',
      overview: '',
      images: [],
      order: csiData?.initiatives.length || 0,
      isActive: true
    });
    setIsInitiativeDialogOpen(true);
  };

  const handleSave = async () => {
    if (!csiData) return;
    
    try {
      await saveCsiMutation.mutateAsync(csiData);
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const handlePillarSave = async () => {
    if (!editingPillar || !csiData) return;
    
    if (!editingPillar.title || !editingPillar.description) {
      showMessage('error', 'Title and description are required');
      return;
    }

    const newPillars = editingPillar.id && csiData.pillars.some(p => p.id === editingPillar.id)
      ? csiData.pillars.map(p => p.id === editingPillar.id ? { ...p, ...editingPillar } as CSIPillar : p)
      : [...csiData.pillars, { ...editingPillar, id: `pillar-${Date.now()}` } as CSIPillar];

    setCsiData({ ...csiData, pillars: newPillars });
    setIsPillarDialogOpen(false);
    setEditingPillar(null);
  };

  const handleInitiativeSave = async () => {
    if (!editingInitiative || !csiData) return;
    
    if (!editingInitiative.title || !editingInitiative.overview) {
      showMessage('error', 'Title and overview are required');
      return;
    }

    const newInitiatives = editingInitiative.id && csiData.initiatives.some(i => i.id === editingInitiative.id)
      ? csiData.initiatives.map(i => i.id === editingInitiative.id ? { ...i, ...editingInitiative } as CSIInitiative : i)
      : [...csiData.initiatives, { ...editingInitiative, id: `initiative-${Date.now()}` } as CSIInitiative];

    setCsiData({ ...csiData, initiatives: newInitiatives });
    setIsInitiativeDialogOpen(false);
    setEditingInitiative(null);
  };

  const handleDelete = async () => {
    if (!csiData || !deleteConfirm.id) return;
    
    if (deleteConfirm.type === 'pillar') {
      const newPillars = csiData.pillars.filter(p => p.id !== deleteConfirm.id);
      setCsiData({ ...csiData, pillars: newPillars });
    } else {
      const newInitiatives = csiData.initiatives.filter(i => i.id !== deleteConfirm.id);
      setCsiData({ ...csiData, initiatives: newInitiatives });
    }
    
    setDeleteConfirm({ open: false, type: 'pillar', id: null });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, initiativeId: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const result = await uploadImageMutation.mutateAsync({ file, initiativeId });
      
      // The mutation will automatically refresh the data via queryClient.invalidateQueries
      // No need to manually update local state as the data will be refetched
      console.log('Image uploaded successfully:', result);
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'book': return <Book className="h-12 w-12 text-green-600" />;
      case 'leaf': return <Leaf className="h-12 w-12 text-green-600" />;
      case 'heart': return <HeartPulse className="h-12 w-12 text-green-600" />;
      case 'trophy': return <Trophy className="h-12 w-12 text-green-600" />;
      default: return <Book className="h-12 w-12 text-green-600" />;
    }
  };

  const resolveImageUrl = (path?: string) => {
    if (!path) return null;
    if (path.includes('placeholder-600x400')) return null;
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
    return <Alert severity="error">Failed to load CSI data. Please try again.</Alert>;
  }

  if (!csiData) {
    return <Alert severity="warning">No CSI data found. Please contact your administrator.</Alert>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Corporate Social Investment Management
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage your CSI content including pillars and initiatives. Changes will appear on your website immediately.
      </Typography>

      {/* Live Preview */}
      <Box sx={{ mb: 4, position: 'relative' }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 2, color: 'primary.main', fontWeight: 'bold' }}>Live Preview - This is how your CSI section appears to visitors
        </Typography>
        
        <Paper sx={{ p: 3, bgcolor: 'grey.50' }}>
          {/* Hero Section */}
          <section className="py-32 gradient-primary text-primary-foreground" style={{ background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', color: 'white' }}>
            <div className="container mx-auto px-4 text-center">
              <h1 className="text-4xl lg:text-6xl font-bold mb-6">
                {csiData.hero.title}
              </h1>
              <p className="text-xl lg:text-2xl text-primary-foreground/90 leading-relaxed max-w-2xl mx-auto">
                {csiData.hero.subtitle}
              </p>
            </div>
          </section>

          {/* Intro Section */}
          <section className="bg-gray-50 py-16 px-6">
            <div className="max-w-4xl mx-auto text-center">
              <p className="text-lg text-gray-700 leading-relaxed">
                {csiData.intro}
              </p>
            </div>
          </section>

          {/* CSI Pillars Section */}
          <section className="py-20 bg-white px-6">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-3xl font-bold text-center text-green-700 mb-12">
                Our Four Pillars
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                {csiData.pillars.filter(p => p.isActive).map((pillar, index) => (
                  <div
                    key={pillar.id}
                    className="text-center p-6 bg-gray-50 rounded-2xl shadow hover:shadow-lg transition"
                  >
                    <div className="flex justify-center mb-4">{getIconComponent(pillar.icon)}</div>
                    <h3 className="text-xl font-semibold mb-3">{pillar.title}</h3>
                    <p className="text-gray-600 text-sm">{pillar.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CSI Initiatives Section */}
          <main className="min-h-screen bg-gray-50 py-16 px-6">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-3xl font-bold text-center text-green-700 mb-12">
                Our CSI Initiatives
              </h2>

              {csiData.initiatives.filter(i => i.isActive).map((item, index) => (
                <section
                  key={item.id}
                  className="mb-16"
                >
                  {/* Clickable Title */}
                  <button
                    onClick={() => toggleSection(index)}
                    className="text-2xl font-semibold text-green-800 mb-4 text-center block mx-auto hover:underline"
                  >
                    {item.title}
                  </button>

                  {/* Overview and Images */}
                  {openIndex === index && (
                    <>
                      <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-line text-center max-w-4xl mx-auto mb-8">
                        {item.overview}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {item.images
                          .map((src) => resolveImageUrl(src))
                          .filter((src): src is string => Boolean(src))
                          .map((src, i) => (
                            <div
                              key={i}
                              className="overflow-hidden rounded-2xl shadow-lg group"
                            >
                              <img
                                src={src}
                                alt={`CSI Image ${i + 1}`}
                                className="w-full h-64 object-cover transform group-hover:scale-110 transition duration-500"
                              />
                            </div>
                          ))}
                      </div>
                    </>
                  )}
                </section>
              ))}
            </div>
          </main>
        </Paper>
      </Box>

      {/* Management Controls */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Management Controls</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {/* Hero Section */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>Hero Section</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
            <TextField
              fullWidth
                  label="Hero Title"
                  value={csiData.hero.title}
                  onChange={(e) => setCsiData({ ...csiData, hero: { ...csiData.hero, title: e.target.value } })}
                />
              </Grid>
              <Grid item xs={12}>
            <TextField
              fullWidth
                  label="Hero Subtitle"
                  value={csiData.hero.subtitle}
                  onChange={(e) => setCsiData({ ...csiData, hero: { ...csiData.hero, subtitle: e.target.value } })}
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Intro Section */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>Intro Section</Typography>
            <TextField
              fullWidth
              label="Intro Text"
              value={csiData.intro}
              onChange={(e) => setCsiData({ ...csiData, intro: e.target.value })}
              multiline
              rows={4}
            />
          </Box>

      <Divider sx={{ my: 3 }} />

          {/* Pillars Management */}
          <Box sx={{ mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6">CSI Pillars</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
                onClick={() => openEditPillar()}
                disabled={saveCsiMutation.isPending}
          >
            Add Pillar
          </Button>
        </Box>
        <Grid container spacing={2}>
              {csiData.pillars.map((pillar) => (
                <Grid item xs={12} sm={6} md={4} key={pillar.id}>
              <Card>
                <CardContent>
                      <Box display="flex" alignItems="center" gap={2} mb={2}>
                        {getIconComponent(pillar.icon)}
                        <Typography variant="h6">{pillar.title}</Typography>
                    <Chip 
                          label={pillar.isActive ? "Active" : "Inactive"} 
                          color={pillar.isActive ? "success" : "default"} 
                      size="small" 
                    />
                  </Box>
                      <Typography variant="body2" color="text.secondary">
                    {pillar.description}
                  </Typography>
                </CardContent>
                <CardActions>
                      <Button size="small" onClick={() => openEditPillar(pillar)}>
                        <EditIcon fontSize="small" />
                      </Button>
                      <Button 
                        size="small" 
                        color="error"
                        onClick={() => setDeleteConfirm({ open: true, type: 'pillar', id: pillar.id })}
                      >
                        <DeleteIcon fontSize="small" />
                      </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Divider sx={{ my: 3 }} />

          {/* Initiatives Management */}
          <Box sx={{ mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6">CSI Initiatives</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
                onClick={() => openEditInitiative()}
                disabled={saveCsiMutation.isPending}
          >
            Add Initiative
          </Button>
        </Box>
        <Grid container spacing={2}>
              {csiData.initiatives.map((initiative) => (
                <Grid item xs={12} key={initiative.id}>
              <Card>
                <CardContent>
                      <Box display="flex" alignItems="center" gap={2} mb={2}>
                        <Typography variant="h6">{initiative.title}</Typography>
                    <Chip 
                          label={initiative.isActive ? "Active" : "Inactive"} 
                          color={initiative.isActive ? "success" : "default"} 
                      size="small" 
                    />
                  </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {initiative.overview.substring(0, 200)}...
                      </Typography>
                      <Box display="flex" gap={1} flexWrap="wrap">
                        {initiative.images
                          .map((image) => resolveImageUrl(image))
                          .filter((src): src is string => Boolean(src))
                          .map((src, index) => (
                            <img
                              key={index}
                              src={src}
                              alt={`Initiative ${index + 1}`}
                              style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8 }}
                            />
                          ))}
                  </Box>
                </CardContent>
                <CardActions>
                      <Button size="small" onClick={() => openEditInitiative(initiative)}>
                        <EditIcon fontSize="small" />
                      </Button>
                      <Button 
                        size="small" 
                        color="error"
                        onClick={() => setDeleteConfirm({ open: true, type: 'initiative', id: initiative.id })}
                      >
                        <DeleteIcon fontSize="small" />
                      </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

          {/* Save Button */}
          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={saveCsiMutation.isPending}
              size="large"
            >
              {saveCsiMutation.isPending ? 'Saving...' : 'Save All Changes'}
            </Button>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Pillar Dialog */}
      <Dialog open={isPillarDialogOpen} onClose={() => setIsPillarDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingPillar?.id ? 'Edit Pillar' : 'Add New Pillar'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
            <TextField
              fullWidth
                label="Title"
              value={editingPillar?.title || ''}
              onChange={(e) => setEditingPillar({ ...editingPillar!, title: e.target.value })}
              required
            />
            </Grid>
            <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              value={editingPillar?.description || ''}
              onChange={(e) => setEditingPillar({ ...editingPillar!, description: e.target.value })}
              multiline
              rows={3}
              required
            />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Icon"
                value={editingPillar?.icon || 'book'}
                onChange={(e) => setEditingPillar({ ...editingPillar!, icon: e.target.value })}
                SelectProps={{ native: true }}
              >
                <option value="book">Book (Education)</option>
                <option value="leaf">Leaf (Environment)</option>
                <option value="heart">Heart (Health)</option>
                <option value="trophy">Trophy (Sports)</option>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsPillarDialogOpen(false)}>Cancel</Button>
          <Button onClick={handlePillarSave} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Initiative Dialog */}
      <Dialog open={isInitiativeDialogOpen} onClose={() => setIsInitiativeDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>{editingInitiative?.id ? 'Edit Initiative' : 'Add New Initiative'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
            <TextField
              fullWidth
                label="Title"
              value={editingInitiative?.title || ''}
              onChange={(e) => setEditingInitiative({ ...editingInitiative!, title: e.target.value })}
              required
            />
            </Grid>
            <Grid item xs={12}>
            <TextField
              fullWidth
              label="Overview"
              value={editingInitiative?.overview || ''}
              onChange={(e) => setEditingInitiative({ ...editingInitiative!, overview: e.target.value })}
              multiline
                rows={4}
              required
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>Images</Typography>
                      <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                        {(editingInitiative?.images || [])
                          .map((image) => resolveImageUrl(image))
                          .filter((src): src is string => Boolean(src))
                          .map((src, index) => (
                          <Box key={index} position="relative">
                            <img
                              src={src}
                              alt={`Initiative ${index + 1}`}
                              style={{ width: 140, height: 140, objectFit: 'cover', borderRadius: 8 }}
                            />
                            <IconButton
                              size="small"
                              onClick={() => {
                                if (!editingInitiative) return;
                                // Extract image ID from URL (e.g., `${API_BASE}/api/csi/images/1` -> "1")
                                const imageUrl = editingInitiative.images?.[index];
                                if (!imageUrl) return;

                                const imageId = imageUrl.split('/').pop();

                                if (imageId && !isNaN(Number(imageId))) {
                                  deleteImageMutation.mutate(imageId);
                                } else {
                                  // Fallback to local state removal for non-database images
                                  const newImages = (editingInitiative.images || []).filter((_, i) => i !== index);
                                  setEditingInitiative({ ...editingInitiative, images: newImages });
                                }
                              }}
                              sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'error.main', color: 'white', width: 20, height: 20 }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        ))}
                      </Box>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (editingInitiative?.id) {
                    handleFileUpload(e, editingInitiative.id);
                  }
                }}
                style={{ display: 'none' }}
                id="initiative-image-upload"
              />
              <label htmlFor="initiative-image-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<UploadIcon />}
                  disabled={isUploading}
                >
                  {isUploading ? 'Uploading...' : 'Add Image'}
                </Button>
              </label>
              {isUploading && (
                <Box sx={{ mt: 1 }}>
                  <LinearProgress variant="determinate" value={uploadProgress} />
                  <Typography variant="caption">{uploadProgress}%</Typography>
                </Box>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsInitiativeDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleInitiativeSave} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm.open} onClose={() => setDeleteConfirm({ open: false, type: 'pillar', id: null })}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this {deleteConfirm.type}? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm({ open: false, type: 'pillar', id: null })}>
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

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

export default CSIEditor;
