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
  Paper,
  IconButton,
  Chip,
  Avatar
} from '@mui/material';
import {
  Edit as EditIcon, 
  Save as SaveIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Upload as UploadIcon,
  Close as CloseIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5001';

interface SubsidiaryMember {
  id?: string | number;
  name: string;
  position: string;
  image: string;
  bio: string;
  order: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface SubsidiariesData {
  id?: string | number;
  hero: {
    title: string;
    subtitle: string;
  };
  section: {
    title: string;
    subtitle: string;
  };
  members: SubsidiaryMember[];
  isActive: boolean;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

const SubsidiariesEditor: React.FC = () => {
  const [subsidiariesData, setSubsidiariesData] = useState<SubsidiariesData | null>(null);
  const [editingSubsidiaries, setEditingSubsidiaries] = useState<SubsidiariesData | null>(null);
  const [isSubsidiariesDialogOpen, setIsSubsidiariesDialogOpen] = useState(false);
  const [editingMemberIndex, setEditingMemberIndex] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeModal, setActiveModal] = useState<number | null>(null);
  const mountedRef = useRef(true);
  const messageTimeoutRef = useRef<number | null>(null);
  const queryClient = useQueryClient();

  // Local storage functions
  const saveSubsidiariesToStorage = useCallback((data: SubsidiariesData) => {
    try {
      localStorage.setItem('subsidiariesData', JSON.stringify(data));
      console.log('Subsidiaries data saved to localStorage');
    } catch (error) {
      console.error('Failed to save subsidiaries data to localStorage:', error);
    }
  }, []);

  const loadSubsidiariesFromStorage = useCallback((): SubsidiariesData | null => {
    try {
      const stored = localStorage.getItem('subsidiariesData');
      if (stored) {
        const data = JSON.parse(stored);
        console.log('Subsidiaries data loaded from localStorage');
        return data;
      }
    } catch (error) {
      console.error('Failed to load subsidiaries data from localStorage:', error);
    }
    return null;
  }, []);

  // Image caching functions
  const cacheImage = useCallback((imageUrl: string, imageData: string) => {
    try {
      const imageCache = JSON.parse(localStorage.getItem('subsidiaryImages') || '{}');
      imageCache[imageUrl] = imageData;
      localStorage.setItem('subsidiaryImages', JSON.stringify(imageCache));
      console.log('Image cached for:', imageUrl);
    } catch (error) {
      console.error('Failed to cache image:', error);
    }
  }, []);

  const getCachedImage = useCallback((imageUrl: string): string | null => {
    try {
      const imageCache = JSON.parse(localStorage.getItem('subsidiaryImages') || '{}');
      return imageCache[imageUrl] || null;
    } catch (error) {
      console.error('Failed to get cached image:', error);
      return null;
    }
  }, []);

  // Fetch subsidiaries data
  const { data: subsidiariesResponse, isPending, error } = useQuery({
    queryKey: ['subsidiaries'],
    queryFn: async () => {
      try {
        const cachedData = loadSubsidiariesFromStorage();
        if (cachedData) {
          setTimeout(async () => {
            try {
              const response = await axios.get(`${API_BASE}/api/subsidiaries`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
              });
              if (response.data) {
                saveSubsidiariesToStorage(response.data);
                queryClient.setQueryData(['subsidiaries'], response.data);
              }
            } catch (error) {
              console.log('Background API fetch failed, using cached data');
            }
          }, 100);
          return cachedData;
        }

        const response = await axios.get(`${API_BASE}/api/subsidiaries`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
        if (response.data) {
          saveSubsidiariesToStorage(response.data);
        }
      return response.data;
      } catch (error) {
        const cachedData = loadSubsidiariesFromStorage();
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

  // Save subsidiaries mutation
  const saveSubsidiariesMutation = useMutation<any, any, SubsidiariesData>({
    mutationFn: async (data) => {
      const response = await axios.post(`${API_BASE}/api/subsidiaries`, data, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      saveSubsidiariesToStorage(variables);
      queryClient.invalidateQueries({ queryKey: ['subsidiaries'] });
      showMessage('success', 'Subsidiaries updated successfully!');
      setEditingSubsidiaries(null);
      setIsSubsidiariesDialogOpen(false);
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error || 
        'Failed to save subsidiaries. Please try again.';
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
    if (subsidiariesResponse) {
      setSubsidiariesData(subsidiariesResponse);
    }
  }, [subsidiariesResponse]);

  const openEditSubsidiaries = () => {
    setEditingSubsidiaries(subsidiariesData || {
      hero: {
        title: 'Subsidiaries',
        subtitle: 'Meet the leaders driving our subsidiaries in Kenya, Uganda, Rwanda, and Tanzania.'
      },
      section: {
        title: 'Our Subsidiary Leaders',
        subtitle: 'These leaders oversee operations in our regional subsidiaries, ensuring quality and excellence across borders.'
      },
      members: [
        {
          name: 'Mr. David Kiplagat Tum',
          position: 'General Manager - Simlaw Seeds Company, Kenya',
          image: '/images/subsidiaries/David.png',
          bio: 'Mr. David Kiplagat Tum was born in 1978 and is the General Manager of Simlaw Seeds Company Kenya Ltd, a subsidiary of Kenya Seed Company. Mr. Tum holds a BSc in Business Administration from USIU and a Masters of Business Administration from Staffordshire University in the UK. He has served in various leadership roles including Accountant at Simlaw Seeds (2000-2003), Director at Soet Group (2003-2007), and Managing Director at Commercial Grain Services Ltd (2008-2016). He was appointed General Manager of Simlaw Seeds Company Limited in September 2016.',
          order: 0,
          isActive: true
        },
        {
          name: 'Mr. Hosea Sirma',
          position: 'General Manager - Simlaw Seeds Company, Uganda',
          image: '/images/subsidiaries/hosea-sirma.jpg',
          bio: 'Mr. Hosea Sirma was born on 28th August 1962 and is the Ag. General Manager of Simlaw Seeds Company Uganda Ltd., a subsidiary of Kenya Seed Company. He holds a BSc degree from the University of Nairobi and has over 25 years\' experience in seed business management and quality management systems. His career includes roles as Head of Production, Research Officer, Wheat Production Officer, Quality Management Systems Auditor, and Company Management Representative (2008–2011).',
          order: 1,
          isActive: true
        },
        {
          name: 'Ms. Kate Ojungo Lule',
          position: 'Ag. Country Manager - Kenya Seed, Rwanda',
          image: '/images/subsidiaries/Kate.jpg',
          bio: 'Ms. Kate Ojungo Lule is currently the Country Representative for Kenya Seed Company Rwanda Ltd. She holds a Master of Science in Development Studies from JKUAT, a Bachelor\'s degree in Business Management from Moi University, and is a Food System Leadership Fellow from Wageningen University & Research, Netherlands.',
          order: 2,
          isActive: true
        },
        {
          name: 'CPA Mr. Patrick Thuo',
          position: 'General Manager - Kibo Seed, Tanzania',
          image: '/images/subsidiaries/patrick-thuo.jpg',
          bio: 'CPA Mr. Patrick Thuo was born on 20th August 1972 and is the General Manager of Kibo Seed Company in Arusha, Tanzania. He holds a Bachelor of Commerce and is pursuing a Master\'s in Business Administration from the University of Nairobi. He is a member of ICPAK, KIM, a graduate of the Advanced Management Programme (Strathmore IESE Business School, Barcelona), and a CPSK finalist. With over 20 years of managerial experience in banking, public, and private sectors, he has worked with Coca-Cola, Citibank, and UBA. He joined Kenya Seed in November 2011 as Head of Finance and served until June 2023.',
          order: 3,
          isActive: true
        }
      ],
      isActive: true,
      order: 0
    });
    setIsSubsidiariesDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingSubsidiaries) return;
    
    if (!editingSubsidiaries.hero.title || !editingSubsidiaries.hero.subtitle) {
      showMessage('error', 'Hero title and subtitle are required');
      return;
    }

    setIsSaving(true);
    try {
      await saveSubsidiariesMutation.mutateAsync(editingSubsidiaries);
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const addMember = () => {
    if (!editingSubsidiaries) return;
    const newMember: SubsidiaryMember = {
      name: '',
      position: '',
      image: '',
      bio: '',
      order: editingSubsidiaries.members.length,
      isActive: true
    };
    setEditingSubsidiaries({
      ...editingSubsidiaries,
      members: [...editingSubsidiaries.members, newMember]
    });
  };

  const updateMember = (index: number, field: keyof SubsidiaryMember, value: string | boolean | number) => {
    if (!editingSubsidiaries) return;
    const updatedMembers = [...editingSubsidiaries.members];
    updatedMembers[index] = { ...updatedMembers[index], [field]: value };
    setEditingSubsidiaries({ ...editingSubsidiaries, members: updatedMembers });
  };

  const removeMember = (index: number) => {
    if (!editingSubsidiaries) return;
    const updatedMembers = editingSubsidiaries.members.filter((_, i) => i !== index);
    setEditingSubsidiaries({ ...editingSubsidiaries, members: updatedMembers });
  };

  const handleFileUpload = async (file: File, memberIndex: number) => {
    if (!editingSubsidiaries) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('folder', 'subsidiaries');
      
      const response = await axios.post(`${API_BASE}/api/upload/image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          setUploadProgress(percentCompleted);
        }
      });

      if (response.data.success && response.data.imageUrl) {
        updateMember(memberIndex, 'image', response.data.imageUrl);
        
        // Cache the uploaded image
        const reader = new FileReader();
        reader.onload = () => {
          if (reader.result) {
            cacheImage(response.data.imageUrl, reader.result as string);
          }
        };
        reader.readAsDataURL(file);
        
        showMessage('success', 'Image uploaded successfully!');
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || 'Failed to upload image';
      showMessage('error', errorMessage);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const resolveImageUrl = (image: string) => {
    if (!image) return '/api/images/subsidiaries/placeholder.svg';
    
    // Check if we have a cached version of this image
    const cachedImage = getCachedImage(image);
    if (cachedImage) {
      return cachedImage;
    }
    
    // Convert API path to public folder path
    if (image.startsWith('/api/images/subsidiaries/')) {
      const filename = image.replace('/api/images/subsidiaries/', '');
      return `/images/subsidiaries/${filename}`;
    }
    
    // If it's already a public path, return as is
    if (image.startsWith('/images/subsidiaries/')) {
      return image;
    }
    
    // Fallback to original URL
    if (image.startsWith('http')) return image;
    if (image.startsWith('/')) return `${API_BASE}${image}`;
    return `${API_BASE}/${image}`;
  };

  const openModal = (index: number) => setActiveModal(index);
  const closeModal = () => setActiveModal(null);

  if (isPending) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">Failed to load subsidiaries data. Please try again.</Alert>;
  }

  if (!subsidiariesData) {
    return <Alert severity="warning">No subsidiaries data found. Please contact your administrator.</Alert>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Subsidiaries Management</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage your subsidiaries page content including hero section, section headers, and subsidiary member profiles.
      </Typography>

      {/* Live Preview */}
      <Box sx={{ mb: 4, position: 'relative' }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 2, color: 'primary.main', fontWeight: 'bold' }}>Live Preview - This is how your subsidiaries page appears to visitors
        </Typography>
        
        <Paper sx={{ p: 3, bgcolor: '#f0fdf4', maxHeight: '600px', overflow: 'auto' }}>
          <style>{`
            .subsidiary-image {
              width: 128px !important;
              height: 128px !important;
              object-fit: cover !important;
              object-position: center !important;
              border-radius: 50% !important;
              border: 4px solid #0ea5e9 !important;
              margin: 0 auto 16px auto !important;
              display: block !important;
            }
            .subsidiary-preview-image {
              width: 100px !important;
              height: 100px !important;
              object-fit: cover !important;
              object-position: center !important;
              border-radius: 8px !important;
            }
          `}</style>
            <div className="min-h-screen">
            <main>
              {/* Hero Section */}
              <section className="py-32 gradient-primary text-primary-foreground text-center">
                <div className="container mx-auto px-4">
                  <h1 className="text-5xl lg:text-6xl font-bold mb-6 text-white">
                    {subsidiariesData.hero.title}
                  </h1>
                  <p className="text-lg lg:text-xl max-w-3xl mx-auto leading-relaxed mt-4 text-white/90">
                    {subsidiariesData.hero.subtitle}
                  </p>
                </div>
              </section>

              {/* Subsidiary Members */}
              <section className="py-20">
                <div className="container mx-auto px-4">
                  <div className="text-center mb-16">
                    <h2 className="text-3xl lg:text-4xl font-bold text-primary mb-6">
                      {subsidiariesData.section.title}
                    </h2>
                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                      {subsidiariesData.section.subtitle}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {subsidiariesData.members
                      .filter(member => member.isActive)
                      .sort((a, b) => a.order - b.order)
                      .map((member, index) => (
                      <Card key={index} className="shadow-agricultural border-0 hover:shadow-lg transition-all duration-300">
                        <CardContent className="p-6">
                          <div className="text-center mb-6">
                            <img
                              src={resolveImageUrl(member.image)}
                              alt={member.name}
                              className="subsidiary-image"
                              onError={(e) => {
                                e.currentTarget.src = '/api/images/subsidiaries/placeholder.svg';
                              }}
                            />
                            <h3 className="text-xl font-bold text-primary mb-2">{member.name}</h3>
                            <p className="text-secondary font-semibold mb-3">{member.position}</p>
                          </div>

                          <div className="text-center mt-4">
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => openModal(index)}
                            >
                              Read More
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </section>

              {/* Modal Popup */}
              {activeModal !== null && subsidiariesData.members[activeModal] && (
                <div
                  className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                  onClick={closeModal}
                  aria-modal="true"
                  role="dialog"
                >
                  <div
                    className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full overflow-y-auto max-h-[90vh]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="text-center mb-4">
                      <img
                        src={resolveImageUrl(subsidiariesData.members[activeModal].image)}
                        alt={subsidiariesData.members[activeModal].name}
                        className="subsidiary-image"
                        onError={(e) => {
                          e.currentTarget.src = '/api/images/subsidiaries/placeholder.svg';
                        }}
                      />
                      <h3 className="text-xl font-bold text-primary">
                        {subsidiariesData.members[activeModal].name}
                      </h3>
                      <p className="text-secondary font-semibold mb-3">
                        {subsidiariesData.members[activeModal].position}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                      {subsidiariesData.members[activeModal].bio}
                    </p>
                    <div className="text-center mt-4">
                      <Button variant="outlined" size="small" onClick={closeModal}>
                        Close
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </main>
            </div>
        </Paper>
      </Box>

      {/* Management Controls */}
          <Card>
        <CardHeader>
          <Typography variant="h6" component="div">Subsidiaries Settings</Typography>
        </CardHeader>
            <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Edit your subsidiaries page content including hero section, section headers, and member profiles.
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<EditIcon />} 
              onClick={openEditSubsidiaries}
              disabled={isSaving}
            >
              Edit Subsidiaries
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog 
        open={isSubsidiariesDialogOpen} 
        onClose={() => setIsSubsidiariesDialogOpen(false)} 
        maxWidth="lg" 
        fullWidth
      >
        <DialogTitle>Edit Subsidiaries</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {/* Hero Section */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Hero Section</Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Hero Title"
                value={editingSubsidiaries?.hero.title || ''}
                onChange={(e) => setEditingSubsidiaries({ 
                  ...editingSubsidiaries!, 
                  hero: { ...editingSubsidiaries!.hero, title: e.target.value }
                })}
                required
              />
            </Grid>
            <Grid item xs={12}>
                <TextField
                  fullWidth
                label="Hero Subtitle"
                value={editingSubsidiaries?.hero.subtitle || ''}
                onChange={(e) => setEditingSubsidiaries({ 
                  ...editingSubsidiaries!, 
                  hero: { ...editingSubsidiaries!.hero, subtitle: e.target.value }
                })}
                multiline
                rows={2}
                  required
              />
            </Grid>

            {/* Section Headers */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Section Headers</Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Section Title"
                value={editingSubsidiaries?.section.title || ''}
                onChange={(e) => setEditingSubsidiaries({ 
                  ...editingSubsidiaries!, 
                  section: { ...editingSubsidiaries!.section, title: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={12}>
                <TextField
                  fullWidth
                label="Section Subtitle"
                value={editingSubsidiaries?.section.subtitle || ''}
                onChange={(e) => setEditingSubsidiaries({ 
                  ...editingSubsidiaries!, 
                  section: { ...editingSubsidiaries!.section, subtitle: e.target.value }
                })}
                  multiline
                rows={2}
              />
            </Grid>

            {/* Members Section */}
            <Grid item xs={12}>
              <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
                <Typography variant="h6">Subsidiary Members</Typography>
                <Button startIcon={<AddIcon />} onClick={addMember} size="small">
                  Add Member
                </Button>
              </Box>
            </Grid>
            {editingSubsidiaries?.members.map((member, index) => (
              <Grid item xs={12} key={index}>
                <Box sx={{ p: 2, border: '1px solid #e5e7eb', borderRadius: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="subtitle2">Member {index + 1}</Typography>
                    <IconButton size="small" onClick={() => removeMember(index)}>
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Name"
                        value={member.name}
                        onChange={(e) => updateMember(index, 'name', e.target.value)}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Position"
                        value={member.position}
                        onChange={(e) => updateMember(index, 'position', e.target.value)}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Bio"
                        value={member.bio}
                        onChange={(e) => updateMember(index, 'bio', e.target.value)}
                        multiline
                        rows={3}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Box display="flex" alignItems="center" gap={2}>
            <TextField
              fullWidth
              label="Image URL"
                          value={member.image}
                          onChange={(e) => updateMember(index, 'image', e.target.value)}
                    size="small"
                        />
            <input
              type="file"
              accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFileUpload(file, index);
                            }
                          }}
              style={{ display: 'none' }}
                          id={`upload-${index}`}
                        />
                        <label htmlFor={`upload-${index}`}>
                          <IconButton component="span" size="small">
                            <UploadIcon />
                          </IconButton>
                        </label>
                      </Box>
                      {member.image && (
                        <Box sx={{ mt: 1 }}>
                          <img
                            src={resolveImageUrl(member.image)}
                            alt="Preview"
                            className="subsidiary-preview-image"
                            onError={(e) => {
                              e.currentTarget.src = '/api/images/subsidiaries/placeholder.svg';
                            }}
                          />
              </Box>
            )}
                    </Grid>
                    <Grid item xs={12} md={6}>
            <TextField
              fullWidth
                        label="Order"
                        type="number"
                        value={member.order}
                        onChange={(e) => updateMember(index, 'order', parseInt(e.target.value) || 0)}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2">Active:</Typography>
                        <Chip
                          label={member.isActive ? 'Active' : 'Inactive'}
                          color={member.isActive ? 'success' : 'default'}
                          size="small"
                          onClick={() => updateMember(index, 'isActive', !member.isActive)}
                          style={{ cursor: 'pointer' }}
                  />
                </Box>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsSubsidiariesDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            disabled={isSaving || !editingSubsidiaries?.hero.title || !editingSubsidiaries?.hero.subtitle}
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

export default SubsidiariesEditor;