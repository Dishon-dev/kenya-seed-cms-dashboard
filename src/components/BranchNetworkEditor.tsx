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
  CircularProgress,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Fab,
  Paper,
  LinearProgress
} from '@mui/material';
import {
  Add as AddIcon, 
  Upload as UploadIcon,
  Download as DownloadIcon,
  Close as CloseIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5001';

interface BranchNetwork {
  id?: number | string;
  title: string;
  description: string;
  pdfUrl: string;
  isActive: boolean;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

const BranchNetworkEditor: React.FC = () => {
  const [branchNetwork, setBranchNetwork] = useState<BranchNetwork | null>(null);
  const [editingBranch, setEditingBranch] = useState<Partial<BranchNetwork> | null>(null);
  const [isBranchDialogOpen, setIsBranchDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: number | string | null | undefined }>({ open: false, id: null });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mountedRef = useRef(true);
  const messageTimeoutRef = useRef<number | null>(null);
  const queryClient = useQueryClient();

  // Fetch branch network data
  const { data: branchData, isPending, error } = useQuery({
    queryKey: ['branchNetwork'],
    queryFn: async () => {
      try {
        const cachedData = loadBranchNetworkFromStorage();
        if (cachedData) {
          setTimeout(async () => {
            try {
              const response = await axios.get(`${API_BASE}/api/branch-network`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
              });
              if (response.data) {
                saveBranchNetworkToStorage(response.data);
                queryClient.setQueryData(['branchNetwork'], response.data);
              }
            } catch (error) {
              console.log('Background API fetch failed, using cached data');
            }
          }, 100);
          return cachedData;
        }

        const response = await axios.get(`${API_BASE}/api/branch-network`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
        if (response.data) {
          saveBranchNetworkToStorage(response.data);
        }
      return response.data;
      } catch (error) {
        const cachedData = loadBranchNetworkFromStorage();
        if (cachedData) {
          return cachedData;
        }
        throw error;
      }
    },
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  });

  // Local storage functions
  const saveBranchNetworkToStorage = useCallback((data: BranchNetwork) => {
    try {
      localStorage.setItem('branchNetwork', JSON.stringify(data));
      console.log('Branch network saved to localStorage');
    } catch (error) {
      console.error('Failed to save branch network to localStorage:', error);
    }
  }, []);

  const loadBranchNetworkFromStorage = useCallback((): BranchNetwork | null => {
    try {
      const stored = localStorage.getItem('branchNetwork');
      if (stored) {
        const data = JSON.parse(stored);
        console.log('Branch network loaded from localStorage');
        return data;
      }
    } catch (error) {
      console.error('Failed to load branch network from localStorage:', error);
    }
    return null;
  }, []);

  // Mutations
  const saveBranchMutation = useMutation<any, any, BranchNetwork>({
    mutationFn: async (branchData) => {
      const isUpdate = branchData.id && !branchData.id.toString().startsWith('tmp-');
      const url = isUpdate 
        ? `${API_BASE}/api/branch-network/${branchData.id}`
        : `${API_BASE}/api/branch-network`;
      
      const method = isUpdate ? 'put' : 'post';
      const response = await axios[method](url, branchData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      const currentData = loadBranchNetworkFromStorage();
      if (variables.id && currentData) {
        const updatedData = { ...currentData, ...variables };
        saveBranchNetworkToStorage(updatedData);
      } else {
        const newData = { ...variables, id: data.id || variables.id };
        saveBranchNetworkToStorage(newData);
      }
      queryClient.invalidateQueries({ queryKey: ['branchNetwork'] });
      showMessage('success', 'Branch network saved successfully!');
      setEditingBranch(null);
      setIsBranchDialogOpen(false);
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error || 
        'Failed to save branch network. Please try again.';
      showMessage('error', errorMessage);
    }
  });

  const deleteBranchMutation = useMutation<any, any, number | string>({
    mutationFn: async (id) => {
      const response = await axios.delete(`${API_BASE}/api/branch-network/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      return response.data;
    },
    onSuccess: (data, deletedId) => {
      const currentData = loadBranchNetworkFromStorage();
      if (currentData) {
        const updatedData = { ...currentData, id: '1', title: 'Branch Network', description: 'Explore our branch locations across Kenya. You can view the network here or download the PDF for your reference.', pdfUrl: '/api/documents/branch-network.pdf' };
        saveBranchNetworkToStorage(updatedData);
      }
      queryClient.invalidateQueries({ queryKey: ['branchNetwork'] });
      showMessage('success', 'Branch network deleted successfully!');
      setDeleteConfirm({ open: false, id: null });
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error || 
        'Failed to delete branch network. Please try again.';
      showMessage('error', errorMessage);
    }
  });

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
    if (branchData) {
      setBranchNetwork(branchData);
    }
  }, [branchData]);

  const openAddBranch = () => {
    setEditingBranch({
      title: '',
      description: '',
      pdfUrl: '',
      isActive: true,
      order: 0
    });
    setIsBranchDialogOpen(true);
  };


  const handleSave = async () => {
    if (!editingBranch) return;
    
    if (!editingBranch.title || !editingBranch.description) {
      showMessage('error', 'Title and description are required');
      return;
    }

    try {
      await saveBranchMutation.mutateAsync(editingBranch as BranchNetwork);
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const confirmDelete = async () => {
    if (!branchNetwork || !deleteConfirm.id) return;
    try {
      await deleteBranchMutation.mutateAsync(deleteConfirm.id);
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      showMessage('error', 'Please select a PDF file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      showMessage('error', 'File size must be less than 10MB');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'branch-network');

      const response = await axios.post(`${API_BASE}/api/upload/pdf`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          setUploadProgress(percentCompleted);
        }
      });

      if (response.data.success && response.data.pdfUrl) {
        setEditingBranch(prev => prev ? { ...prev, pdfUrl: response.data.pdfUrl } : null);
        showMessage('success', 'PDF uploaded successfully!');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      const errorMessage = error?.response?.data?.error || 'Failed to upload PDF';
      showMessage('error', errorMessage);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const resolvePdfUrl = (pdfUrl: string) => {
    if (!pdfUrl) return '';
    if (pdfUrl.startsWith('http')) return pdfUrl;
    if (pdfUrl.startsWith('/')) return `${API_BASE}${pdfUrl}`;
    return `${API_BASE}/${pdfUrl}`;
  };

  const isSaving = saveBranchMutation.isPending || deleteBranchMutation.isPending;

  if (isPending) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">Failed to load branch network data. Please try again.</Alert>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Branch Network Management
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage your branch network information and PDF documents. Changes will appear on your website immediately.
      </Typography>

      {/* Live Preview */}
      <Box sx={{ mb: 4, position: 'relative' }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 2, color: 'primary.main', fontWeight: 'bold' }}>Live Preview - This is how your branch network appears to visitors
        </Typography>
        
        <Paper variant="outlined" sx={{ p: 3, backgroundColor: '#f7f8fa' }}>
          <div className="min-h-screen">
            {/* Hero Section */}
            <section className="py-32 gradient-primary text-primary-foreground">
              <div className="container mx-auto px-4 text-center">
                <h1 className="text-4xl lg:text-6xl font-bold mb-6">
                  {branchNetwork?.title || 'Branch Network'}
                </h1>
                <p className="text-xl lg:text-2xl text-primary-foreground/90 leading-relaxed max-w-2xl mx-auto">
                  {branchNetwork?.description || 'Explore our branch locations across Kenya. You can view the network here or download the PDF for your reference.'}
                </p>
              </div>
            </section>

            <main className="container mx-auto py-10">
              <p className="mb-4">
                You can view or download our branch network document below.
              </p>

              {/* PDF viewer */}
              {branchNetwork?.pdfUrl ? (
                <iframe
                  src={resolvePdfUrl(branchNetwork.pdfUrl)}
                  title="Branch Network"
                  className="w-full h-[800px] border"
                ></iframe>
              ) : (
                <div className="w-full h-[800px] border border-gray-300 flex items-center justify-center bg-gray-100">
                  <Typography variant="h6" color="text.secondary">
                    No PDF document uploaded yet
              </Typography>
                </div>
              )}

              {/* Download link */}
              <div className="mt-4">
                {branchNetwork?.pdfUrl ? (
                  <a
                    href={resolvePdfUrl(branchNetwork.pdfUrl)}
                    download
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded inline-block"
                  >
                    Download PDF
                  </a>
                ) : (
                  <Button variant="outlined" disabled>
                    No PDF Available
              </Button>
                )}
              </div>
            </main>
          </div>
        </Paper>
      </Box>

      {/* Management Controls */}
        <Card>
        <CardHeader>
          <Typography variant="h6" component="div">Branch Network Settings</Typography>
        </CardHeader>
          <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Page Title"
                value={branchNetwork?.title || ''}
                onChange={(e) => setBranchNetwork(prev => prev ? { ...prev, title: e.target.value } : null)}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Page Description"
                value={branchNetwork?.description || ''}
                onChange={(e) => setBranchNetwork(prev => prev ? { ...prev, description: e.target.value } : null)}
                margin="normal"
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                PDF Document
                  </Typography>
              {branchNetwork?.pdfUrl ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, border: '1px solid #e5e7eb', borderRadius: 1, backgroundColor: '#f7f8fa' }}>
                  <DownloadIcon color="primary" />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" color="text.secondary" display="block">
                      Current PDF: {branchNetwork.pdfUrl.split('/').pop()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ wordBreak: 'break-all' }}>
                      {resolvePdfUrl(branchNetwork.pdfUrl)}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => setBranchNetwork(prev => prev ? { ...prev, pdfUrl: '' } : null)}
                    sx={{ color: 'error.main' }}
                  >
                    <CloseIcon />
                  </IconButton>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4, border: '2px dashed #e5e7eb', borderRadius: 1 }}>
                  <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    No PDF document uploaded
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<UploadIcon />}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    Upload PDF
                  </Button>
                </Box>
              )}
              
              {isUploading && (
                <Box sx={{ mt: 2 }}>
                  <LinearProgress variant="determinate" value={uploadProgress} />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    Uploading... {uploadProgress}%
                  </Typography>
            </Box>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </Grid>
            <Grid item xs={12}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
                disabled={isSaving || !branchNetwork?.title || !branchNetwork?.description}
                sx={{ mt: 2 }}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
            </Grid>
          </Grid>
        </CardContent>
        </Card>

      {/* Floating Add Button */}
      <Fab
        color="primary"
        aria-label="add branch network"
        onClick={openAddBranch}
        disabled={isSaving}
        sx={{
          position: "fixed",
          bottom: 20,
          right: 20,
          zIndex: 1000,
          boxShadow: 3,
        }}
      >
        <AddIcon />
      </Fab>

      {/* Dialogs */}
      <Dialog open={isBranchDialogOpen} onClose={() => setIsBranchDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingBranch?.id ? 'Edit Branch Network' : 'Add Branch Network'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={editingBranch?.title || ''}
                onChange={(e) => setEditingBranch({ ...editingBranch!, title: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={editingBranch?.description || ''}
                onChange={(e) => setEditingBranch({ ...editingBranch!, description: e.target.value })}
                multiline
                rows={3}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                PDF Document
              </Typography>
              <Button
                variant="outlined"
                startIcon={<UploadIcon />}
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                fullWidth
              >
                {editingBranch?.pdfUrl ? 'Replace PDF' : 'Upload PDF'}
              </Button>
              {editingBranch?.pdfUrl && (
                <Box sx={{ mt: 2, p: 2, border: '1px solid #e5e7eb', borderRadius: 1, backgroundColor: '#f7f8fa' }}>
                  <Typography variant="body2" color="text.secondary">
                    Current: {editingBranch.pdfUrl.split('/').pop()}
                  </Typography>
      </Box>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsBranchDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={isSaving || !editingBranch?.title || !editingBranch?.description}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteConfirm.open} onClose={() => setDeleteConfirm({ open: false, id: null })}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this branch network? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm({ open: false, id: null })}>Cancel</Button>
          <Button
            onClick={confirmDelete}
            color="error"
            variant="contained"
            disabled={isSaving}
          >
            {isSaving ? 'Deleting...' : 'Delete'}
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

export default BranchNetworkEditor;