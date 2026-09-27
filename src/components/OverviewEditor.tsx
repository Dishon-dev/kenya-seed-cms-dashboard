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
  Paper
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5001';

interface OverviewData {
  id?: string | number;
  companyHistory: string;
  vision: string;
  mission: string;
  coreValues: Array<{
    title: string;
    description: string;
  }>;
  subsidiaries: string[];
  isActive: boolean;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

const OverviewEditor: React.FC = () => {
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [editingOverview, setEditingOverview] = useState<OverviewData | null>(null);
  const [isOverviewDialogOpen, setIsOverviewDialogOpen] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const mountedRef = useRef(true);
  const messageTimeoutRef = useRef<number | null>(null);
  const queryClient = useQueryClient();

  // Local storage functions
  const saveOverviewToStorage = useCallback((data: OverviewData) => {
    try {
      localStorage.setItem('overviewData', JSON.stringify(data));
      console.log('Overview data saved to localStorage');
    } catch (error) {
      console.error('Failed to save overview data to localStorage:', error);
    }
  }, []);

  const loadOverviewFromStorage = useCallback((): OverviewData | null => {
    try {
      const stored = localStorage.getItem('overviewData');
      if (stored) {
        const data = JSON.parse(stored);
        console.log('Overview data loaded from localStorage');
        return data;
      }
    } catch (error) {
      console.error('Failed to load overview data from localStorage:', error);
    }
    return null;
  }, []);

  // Fetch overview data
  const { data: overviewResponse, isPending, error } = useQuery({
    queryKey: ['overview'],
    queryFn: async () => {
      try {
        const cachedData = loadOverviewFromStorage();
        if (cachedData) {
          setTimeout(async () => {
            try {
              const response = await axios.get(`${API_BASE}/api/overview`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
              });
              if (response.data) {
                saveOverviewToStorage(response.data);
                queryClient.setQueryData(['overview'], response.data);
              }
            } catch (error) {
              console.log('Background API fetch failed, using cached data');
            }
          }, 100);
          return cachedData;
        }

        const response = await axios.get(`${API_BASE}/api/overview`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
        if (response.data) {
          saveOverviewToStorage(response.data);
        }
      return response.data;
      } catch (error) {
        const cachedData = loadOverviewFromStorage();
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

  // Save overview mutation
  const saveOverviewMutation = useMutation<any, any, OverviewData>({
    mutationFn: async (data) => {
      const response = await axios.post(`${API_BASE}/api/overview`, data, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      saveOverviewToStorage(variables);
      queryClient.invalidateQueries({ queryKey: ['overview'] });
      showMessage('success', 'Overview updated successfully!');
      setEditingOverview(null);
      setIsOverviewDialogOpen(false);
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error || 
        'Failed to save overview. Please try again.';
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
    if (overviewResponse) {
      setOverviewData(overviewResponse);
    }
  }, [overviewResponse]);

  const openEditOverview = () => {
    setEditingOverview(overviewData || {
      companyHistory: '',
      vision: '',
      mission: '',
      coreValues: [
        { title: 'Integrity', description: '' },
        { title: 'Customer Focus', description: '' },
        { title: 'Innovation', description: '' },
        { title: 'Teamwork', description: '' }
      ],
      subsidiaries: ['', '', '', ''],
      isActive: true,
      order: 0
    });
    setIsOverviewDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingOverview) return;
    
    if (!editingOverview.companyHistory || !editingOverview.vision || !editingOverview.mission) {
      showMessage('error', 'Company history, vision, and mission are required');
      return;
    }

    setIsSaving(true);
    try {
      await saveOverviewMutation.mutateAsync(editingOverview);
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateCoreValue = (index: number, field: 'title' | 'description', value: string) => {
    if (!editingOverview) return;
    const updatedValues = [...editingOverview.coreValues];
    updatedValues[index] = { ...updatedValues[index], [field]: value };
    setEditingOverview({ ...editingOverview, coreValues: updatedValues });
  };

  const updateSubsidiary = (index: number, value: string) => {
    if (!editingOverview) return;
    const updatedSubsidiaries = [...editingOverview.subsidiaries];
    updatedSubsidiaries[index] = value;
    setEditingOverview({ ...editingOverview, subsidiaries: updatedSubsidiaries });
  };

  if (isPending) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">Failed to load overview data. Please try again.</Alert>;
  }

  if (!overviewData) {
    return <Alert severity="warning">No overview data found. Please contact your administrator.</Alert>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Overview Management</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage your company overview content including history, vision, mission, core values, and subsidiaries.
      </Typography>

      {/* Live Preview */}
      <Box sx={{ mb: 4, position: 'relative' }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 2, color: 'primary.main', fontWeight: 'bold' }}>Live Preview - This is how your overview appears to visitors
        </Typography>
        
        <Paper sx={{ p: 3, bgcolor: '#f0fdf4' }}>
            <div className="min-h-screen bg-green-50 flex flex-col">
              <main className="flex-grow container mx-auto px-6 lg:px-20 py-16 space-y-8">
              <p>{overviewData.companyHistory}</p>
              
              <p>{overviewData.companyHistory}</p>
              
              <p>{overviewData.companyHistory}</p>
              
              <p>As part of its expansion strategy, KSC has four wholly owned subsidiaries:</p>
              <ul className="list-disc list-inside pl-6 space-y-1">
                {overviewData.subsidiaries.map((subsidiary, index) => (
                  <li key={index}>{subsidiary}</li>
                ))}
              </ul>

              {/* Vision & Mission */}
                <div className="grid lg:grid-cols-2 gap-8 mt-16">
                  <Card className="shadow-lg hover:shadow-2xl transition-shadow duration-300">
                    <CardContent className="p-6 space-y-4 text-center">
                      <h3 className="text-xl font-semibold">Vision Statement</h3>
                    <p>{overviewData.vision}</p>
                    </CardContent>
                  </Card>

                  <Card className="shadow-lg hover:shadow-2xl transition-shadow duration-300">
                    <CardContent className="p-6 space-y-4 text-center">
                      <h3 className="text-xl font-semibold">Mission Statement</h3>
                    <p>{overviewData.mission}</p>
                    </CardContent>
                  </Card>
                </div>

              {/* Core Values */}
                <section className="mt-16">
                <h2 className="text-3xl font-bold mb-10 text-center">Core Values</h2>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {overviewData.coreValues.map((value, index) => (
                      <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                        <CardContent className="p-6 text-center space-y-4">
                          <h3 className="text-xl font-semibold">{value.title}</h3>
                          <p>{value.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </section>
              </main>
            </div>
        </Paper>
      </Box>

      {/* Management Controls */}
          <Card>
        <CardHeader>
          <Typography variant="h6" component="div">Overview Settings</Typography>
        </CardHeader>
            <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Edit your company overview content including history, vision, mission, core values, and subsidiaries.
            </Typography>
          <Button
            variant="contained"
              startIcon={<EditIcon />} 
              onClick={openEditOverview}
            disabled={isSaving}
          >
              Edit Overview
          </Button>
                  </Box>
                </CardContent>
              </Card>

      {/* Edit Dialog */}
      <Dialog 
        open={isOverviewDialogOpen} 
        onClose={() => setIsOverviewDialogOpen(false)} 
        maxWidth="lg" 
        fullWidth
      >
        <DialogTitle>Edit Overview</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
            <TextField
              fullWidth
                label="Company History"
                value={editingOverview?.companyHistory || ''}
                onChange={(e) => setEditingOverview({ ...editingOverview!, companyHistory: e.target.value })}
                multiline
                rows={4}
              required
            />
            </Grid>
            
            <Grid item xs={12} md={6}>
            <TextField
              fullWidth
                label="Vision Statement"
                value={editingOverview?.vision || ''}
                onChange={(e) => setEditingOverview({ ...editingOverview!, vision: e.target.value })}
              multiline
              rows={3}
              required
            />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Mission Statement"
                value={editingOverview?.mission || ''}
                onChange={(e) => setEditingOverview({ ...editingOverview!, mission: e.target.value })}
                multiline
                rows={3}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Core Values</Typography>
              {editingOverview?.coreValues.map((value, index) => (
                <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #e5e7eb', borderRadius: 1 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Value Title"
                        value={value.title}
                        onChange={(e) => updateCoreValue(index, 'title', e.target.value)}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} md={8}>
                      <TextField
                        fullWidth
                        label="Value Description"
                        value={value.description}
                        onChange={(e) => updateCoreValue(index, 'description', e.target.value)}
                        multiline
                        rows={2}
                        size="small"
                      />
                    </Grid>
                  </Grid>
                    </Box>
              ))}
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Subsidiaries</Typography>
              {editingOverview?.subsidiaries.map((subsidiary, index) => (
                <TextField
                  key={index}
                  fullWidth
                  label={`Subsidiary ${index + 1}`}
                  value={subsidiary}
                  onChange={(e) => updateSubsidiary(index, e.target.value)}
                  sx={{ mb: 1 }}
                  size="small"
                />
              ))}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsOverviewDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            disabled={isSaving || !editingOverview?.companyHistory || !editingOverview?.vision || !editingOverview?.mission}
            startIcon={<SaveIcon />}
          >
            {isSaving ? 'Saving...' : 'Save'}
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

export default OverviewEditor;