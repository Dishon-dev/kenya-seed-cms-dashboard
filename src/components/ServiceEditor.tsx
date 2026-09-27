import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import ServiceCard from './ServiceCard';
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
  Chip,
  Divider,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Fab
} from '@mui/material';
import {
  Add as AddIcon,
  Save as SaveIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5001';

interface Service {
  id?: number | string;
  title: string;
  description: string;
  image: string;
  imageId?: number | string;
  link: string;
  order: number;
  isActive: boolean;
}

interface ServiceSection {
  id: number | string;
  title: string;
  subtitle: string;
  services: Service[];
}

const deepClone = <T,>(obj: T): T => JSON.parse(JSON.stringify(obj));

const resolveImageUrl = (path?: string, fallback = '/images/placeholder-600x400.jpg') => {
  if (!path) return fallback;
  if (path.startsWith('http') || path.startsWith('//')) return path;
  return `${API_BASE}${path.startsWith('/') ? path : '/' + path}`;
};

const ServiceEditor: React.FC = () => {
  const [serviceSection, setServiceSection] = useState<ServiceSection | null>(null);
  const [editingService, setEditingService] = useState<Partial<Service> | null>(null);
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: number | string | null | undefined }>({ open: false, id: null });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeService, setActiveService] = useState<number | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const mountedRef = useRef(true);
  const messageTimeoutRef = useRef<number | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Fetch services data from the services API
  const { data: servicesData, isPending, error } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/api/services`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      return response.data;
    },
    retry: 2,
    staleTime: 30000
  });

  // Mutations for services API
  const updateServicesMutation = useMutation<Service[], any, Service[]>({
    mutationFn: async (services) => {
      const promises = services.map(async (service) => {
        if (service.id && !service.id.toString().startsWith('tmp-')) {
          const response = await axios.put(`${API_BASE}/api/services/${service.id}`, service, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          return response.data || service;
        } else {
          const response = await axios.post(`${API_BASE}/api/services`, service, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          return response.data || service;
        }
      });
      const results = await Promise.all(promises);
      return results.map((result, index) => ({
        ...(services[index] || {}),
        ...(result || {})
      }));
    }
  });

  const updateServiceSectionMutation = useMutation<any, any, { title: string; subtitle: string }>({
    mutationFn: async (data) => {
      const response = await axios.post(`${API_BASE}/api/services-page`, data, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      return response.data;
    }
  });

  const isSaving = updateServiceSectionMutation.isPending || updateServicesMutation.isPending;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
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
    if (!servicesData) return;
    
    const serviceSectionData: ServiceSection = {
      id: servicesData.servicesPage?.id || 'new',
      title: servicesData.servicesPage?.title || 'CUSTOMER SERVICE DESK',
      subtitle: servicesData.servicesPage?.subtitle || 'Dedicated support and services designed to meet all your agricultural needs',
      services: (servicesData.services || []).map((s: any, idx: number) => ({
        id: s.id || `service-${idx}`,
        title: s.title || '',
        description: s.description || '',
        image: s.image || '',
        imageId: s.imageId || '',
        link: s.link || '',
        order: typeof s.order === 'number' ? s.order : idx,
        isActive: s.isActive !== false
      }))
    };
    setServiceSection(serviceSectionData);
  }, [servicesData]);

  const persistServices = useCallback(async (services: Service[]) => {
    const normalized = services.map((s, i) => ({ ...s, order: i }));

    const previous = queryClient.getQueryData(['services']) as any;
    if (previous) {
      const optimistic = deepClone(previous);
      optimistic.services = normalized;
      queryClient.setQueryData(['services'], optimistic);
      setServiceSection(prevSec => prevSec ? { ...prevSec, services: normalized } : prevSec);
    }

    try {
      const savedServices = await updateServicesMutation.mutateAsync(normalized);
      if (savedServices && Array.isArray(savedServices)) {
        setServiceSection(prevSec => prevSec ? { ...prevSec, services: savedServices } : prevSec);
        queryClient.setQueryData(['services'], (prev: any) => {
          if (!prev) return prev;
          const next = deepClone(prev);
          next.services = savedServices;
          return next;
        });
      }
      queryClient.invalidateQueries({ queryKey: ['services'] });
      showMessage('success', 'Services updated');
    } catch (err: any) {
      if (previous) queryClient.setQueryData(['services'], previous);
      showMessage('error', err?.response?.data?.error || 'Failed to save services');
      throw err;
    }
  }, [queryClient, updateServicesMutation, showMessage]);

  const openAddService = useCallback(() => {
    setEditingService({ title: '', description: '', image: '', link: '', order: serviceSection?.services.length ?? 0, isActive: true });
    setIsServiceDialogOpen(true);
  }, [serviceSection?.services.length]);

  const handleServiceSave = async () => {
    if (!editingService || !serviceSection) return;
    if (!editingService.title || !editingService.description) {
      showMessage('error', 'Title and description are required');
      return;
    }
    if (editingService.link && editingService.link.startsWith('http')) {
      showMessage('error', 'Link must be display text, not a URL');
      return;
    }

    let newServices: Service[];
    if (editingService.id && serviceSection.services.some(s => s.id === editingService.id)) {
      newServices = serviceSection.services.map(s => s.id === editingService.id ? ({ ...(s as Service), ...(editingService as Service) }) : s);
    } else {
      const tmpId = `tmp-${Date.now()}`;
      newServices = [...serviceSection.services, { ...(editingService as Service), id: tmpId }];
    }

    try {
      await persistServices(newServices);
      setIsServiceDialogOpen(false);
      setEditingService(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleServiceImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const serviceId = editingService?.id?.toString() || '';
    if (!serviceId || serviceId.startsWith('tmp-')) {
      showMessage('error', 'Please save the service first, then upload an image.');
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await axios.post(`${API_BASE}/api/services/${serviceId}/image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data?.imageId) {
        const imageUrl = response.data.imageUrl || `/api/services/images/${response.data.imageId}`;
        setEditingService(prev => ({ ...(prev || {}), imageId: response.data.imageId, image: imageUrl }));
        showMessage('success', 'Image uploaded successfully');
      } else {
        showMessage('error', 'Upload succeeded but no image ID returned');
      }
    } catch (err: any) {
      showMessage('error', err?.response?.data?.error || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    }
  };

  const confirmDelete = async () => {
    if (!serviceSection || !deleteConfirm.id) return;
    const filtered = serviceSection.services.filter(s => s.id !== deleteConfirm.id);
    try {
      await persistServices(filtered);
      setDeleteConfirm({ open: false, id: null });
    } catch (err) {
      console.error(err);
    }
  };

  const moveService = useCallback(async (fromIndex: number, toIndex: number) => {
    if (!serviceSection) return;
    const copy = [...serviceSection.services];
    const [item] = copy.splice(fromIndex, 1);
    copy.splice(toIndex, 0, item);
    await persistServices(copy);
  }, [serviceSection, persistServices]);

  const handleSaveSettings = async () => {
    if (!serviceSection) return;
    try {
      await updateServiceSectionMutation.mutateAsync({
        title: serviceSection.title,
        subtitle: serviceSection.subtitle
      });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      showMessage('success', 'Section settings saved');
    } catch (err: any) {
      showMessage('error', err?.response?.data?.error || 'Failed to save settings');
    }
  };

  // Memoized preview section to match main site
  const preview = useMemo(() => {
    if (!serviceSection) return null;

    const activeServices = serviceSection.services
      .filter(s => s.isActive !== false)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    return (
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-green-800 mb-6">
              {serviceSection.title}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              {serviceSection.subtitle}
            </p>
          </div>

        <div 
          className="services-grid"
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr)', 
            gap: '1.5rem',
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0 1rem',
            alignItems: 'stretch'
          }}
        >
            {activeServices.map((service, index) => (
              <ServiceCard
                key={service.id ?? index}
                service={{
                  id: String(service.id ?? `service-${index}`),
                  title: service.title ?? '',
                  description: service.description ?? '',
                  image: resolveImageUrl(service.image),
                  link: service.link || 'Learn more',
                  order: service.order ?? index,
                  isActive: service.isActive ?? true
                }}
                index={index}
                isSaving={isSaving}
                servicesLength={activeServices.length}
                onEdit={(service) => {
                  setEditingService(service);
                  setIsServiceDialogOpen(true);
                }}
                onDelete={(id) => setDeleteConfirm({ open: true, id })}
                onMove={moveService}
                onModalOpen={(index) => setActiveService(index)}
              />
            ))}
          </div>

          {/* Modal Popup - Exact match with main site */}
          {activeService !== null && activeServices[activeService] && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4">
              <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full p-8 relative animate-fadeIn">
                <button
                  className="absolute top-4 right-6 text-gray-600 hover:text-green-800 text-2xl font-bold"
                  onClick={() => setActiveService(null)}
                  aria-label={`Close ${activeServices[activeService].title} details`}
                >
                  ×
                </button>
                <h3 className="text-2xl font-semibold leading-none tracking-tight text-green-900 mb-6">
                  {activeServices[activeService].title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {activeServices[activeService].description}
                </p>
              </div>
            </div>
          )}

          {/* Floating Add Service Button */}
          <Fab
            color="primary"
            aria-label="add service"
            onClick={openAddService}
            disabled={isSaving}
            sx={{
              position: "absolute",
              top: 20,
              right: 20,
              zIndex: 1000,
              boxShadow: 3,
            }}
          >
            <AddIcon />
          </Fab>

          {/* CSS for animations and responsive grid - identical to main site */}
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; transform: scale(0.9); }
              to { opacity: 1; transform: scale(1); }
            }
            .animate-fadeIn { animation: fadeIn 0.3s ease-in-out; }
            
            /* Ensure service cards have consistent height */
            .service-card {
              height: 320px !important;
              min-height: 320px !important;
              max-height: 320px !important;
            }
            
            /* Force hover effects to work properly */
            .group .absolute[style*="opacity: 0"] {
              opacity: 0 !important;
            }
            .group:hover .absolute[style*="opacity: 0"] {
              opacity: 1 !important;
            }
            
            @media (max-width: 1024px) {
              .services-grid {
                grid-template-columns: repeat(2, 1fr) !important;
              }
            }
            @media (max-width: 640px) {
              .services-grid {
                grid-template-columns: 1fr !important;
              }
            }
          `}</style>
        </div>
      </section>
    );
  }, [serviceSection, activeService, isSaving, openAddService, moveService]);

  if (isPending) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">Failed to load service section data. Please try again.</Alert>;
  }

  if (!serviceSection) {
    return <Alert severity="warning">No service section found. Please contact your administrator.</Alert>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Service Section Management</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage your services section content and settings. Changes will appear on your website immediately.
      </Typography>

      {/* Live Preview */}
      <Box sx={{ mb: 4, position: 'relative' }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 2, color: 'primary.main', fontWeight: 'bold' }}>Live Preview - This is how your service section appears to visitors
        </Typography>
        {preview}
      </Box>

      {/* Management Controls */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Management Controls</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>Section Settings</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Section Title"
                  value={serviceSection.title}
                  onChange={(e) => setServiceSection({ ...serviceSection, title: e.target.value })}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Section Subtitle"
                  value={serviceSection.subtitle}
                  onChange={(e) => setServiceSection({ ...serviceSection, subtitle: e.target.value })}
                  margin="normal"
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveSettings}
                  disabled={isSaving || updateServiceSectionMutation.isPending}
                  sx={{ mt: 2 }}
                >
                  {isSaving || updateServiceSectionMutation.isPending ? 'Saving...' : 'Save Settings'}
                </Button>
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ mb: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6">Services Management</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={openAddService}
                disabled={isSaving || updateServicesMutation.isPending}
              >
                Add Service
              </Button>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Use the edit buttons on the service cards above to manage individual services, or add a new service using the button above.
            </Typography>
          </Box>
        </AccordionDetails>
      </Accordion>

      <Dialog open={isServiceDialogOpen} onClose={() => setIsServiceDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingService?.id ? 'Edit Service' : 'Add New Service'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={editingService?.title || ''}
                onChange={(e) => setEditingService({ ...editingService!, title: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={editingService?.description || ''}
                onChange={(e) => setEditingService({ ...editingService!, description: e.target.value })}
                multiline
                rows={3}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Image URL or server path"
                value={editingService?.image || ''}
                onChange={(e) => setEditingService({ ...editingService!, image: e.target.value })}
                required
                helperText="Absolute URL or server path like /uploads/.."
              />
            </Grid>
            <Grid item xs={12}>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={handleServiceImageUpload}
                style={{ display: 'none' }}
              />
              <Button
                variant="outlined"
                onClick={() => imageInputRef.current?.click()}
                disabled={uploadingImage}
                fullWidth
              >
                {uploadingImage ? 'Uploading...' : 'Upload Image'}
              </Button>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Link Text"
                value={editingService?.link || ''}
                onChange={(e) => setEditingService({ ...editingService!, link: e.target.value })}
                helperText="Text shown on card (e.g., 'Learn more', 'Want to know more...')"
              />
            </Grid>
            <Grid item xs={12}>
              {editingService?.image ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <img
                    src={resolveImageUrl(editingService.image)}
                    alt="preview"
                    style={{
                      width: '200px',
                      height: '200px',
                      objectFit: 'cover',
                      borderRadius: 8,
                      border: '1px solid #e5e7eb'
                    }}
                    onError={(e) => (e.currentTarget.src = '/images/placeholder-600x400.jpg')}
                  />
                  <Chip label={resolveImageUrl(editingService.image)} size="small" />
                </Box>
              ) : (
                <Chip label={`Preview image: none`} />
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsServiceDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleServiceSave}
            variant="contained"
            disabled={isSaving || updateServicesMutation.isPending || !editingService?.title || !editingService?.description || !editingService?.image}
          >
            {isSaving || updateServicesMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteConfirm.open} onClose={() => setDeleteConfirm({ open: false, id: null })}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this service? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm({ open: false, id: null })}>Cancel</Button>
          <Button
            onClick={confirmDelete}
            color="error"
            variant="contained"
            disabled={isSaving || updateServicesMutation.isPending}
          >
            {isSaving || updateServicesMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!message} autoHideDuration={5000} onClose={() => setMessage(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={() => setMessage(null)} severity={message?.type} sx={{ width: '100%' }}>{message?.text}</Alert>
      </Snackbar>
    </Box>
  );
};

export default ServiceEditor;
