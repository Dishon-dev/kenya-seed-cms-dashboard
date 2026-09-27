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

interface TeamMember {
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

interface TeamData {
  id?: string | number;
  hero: {
    title: string;
    subtitle: string;
  };
  members: TeamMember[];
  isActive: boolean;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

const TeamEditor: React.FC = () => {
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [editingTeam, setEditingTeam] = useState<TeamData | null>(null);
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);
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
  const saveTeamToStorage = useCallback((data: TeamData) => {
    try {
      localStorage.setItem('teamData', JSON.stringify(data));
      console.log('Team data saved to localStorage');
    } catch (error) {
      console.error('Failed to save team data to localStorage:', error);
    }
  }, []);

  const loadTeamFromStorage = useCallback((): TeamData | null => {
    try {
      const stored = localStorage.getItem('teamData');
      if (stored) {
        const data = JSON.parse(stored);
        console.log('Team data loaded from localStorage');
        return data;
      }
    } catch (error) {
      console.error('Failed to load team data from localStorage:', error);
    }
    return null;
  }, []);

  // Image caching functions
  const cacheImage = useCallback((imageUrl: string, imageData: string) => {
    try {
      const imageCache = JSON.parse(localStorage.getItem('teamImages') || '{}');
      imageCache[imageUrl] = imageData;
      localStorage.setItem('teamImages', JSON.stringify(imageCache));
      console.log('Image cached for:', imageUrl);
    } catch (error) {
      console.error('Failed to cache image:', error);
    }
  }, []);

  const getCachedImage = useCallback((imageUrl: string): string | null => {
    try {
      const imageCache = JSON.parse(localStorage.getItem('teamImages') || '{}');
      return imageCache[imageUrl] || null;
    } catch (error) {
      console.error('Failed to get cached image:', error);
      return null;
    }
  }, []);

  // Fetch team data
  const { data: teamResponse, isPending, error } = useQuery({
    queryKey: ['team'],
    queryFn: async () => {
      try {
        const cachedData = loadTeamFromStorage();
        if (cachedData) {
          setTimeout(async () => {
            try {
              const response = await axios.get(`${API_BASE}/api/team`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
              });
              if (response.data) {
                saveTeamToStorage(response.data);
                queryClient.setQueryData(['team'], response.data);
              }
            } catch (error) {
              console.log('Background API fetch failed, using cached data');
            }
          }, 100);
          return cachedData;
        }

        const response = await axios.get(`${API_BASE}/api/team`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
        if (response.data) {
          saveTeamToStorage(response.data);
        }
      return response.data;
      } catch (error) {
        const cachedData = loadTeamFromStorage();
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

  // Save team mutation
  const saveTeamMutation = useMutation<any, any, TeamData>({
    mutationFn: async (data) => {
      const response = await axios.post(`${API_BASE}/api/team`, data, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      saveTeamToStorage(variables);
      queryClient.invalidateQueries({ queryKey: ['team'] });
      showMessage('success', 'Team updated successfully!');
      setEditingTeam(null);
      setIsTeamDialogOpen(false);
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error || 
        'Failed to save team. Please try again.';
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
    if (teamResponse) {
      setTeamData(teamResponse);
    }
  }, [teamResponse]);

  const openEditTeam = () => {
    setEditingTeam(teamData || {
      hero: {
        title: 'Management Team',
        subtitle: 'Meet the dedicated professionals who lead Kenya Seed Company\'s mission to transform agriculture through innovation, quality, and farmer empowerment.'
      },
      members: [
        {
          name: 'Mr. Chepsiror Kiplagat Sammy',
          position: 'Managing Director',
          image: 'https://dev.xtranet.co.ke/kenyaseed/wp-content/uploads/2025/07/Sammy3-297x300.png',
          bio: 'Mr. Chepsiror has over 25 years of experience in strategic marketing, sales operations, and agricultural sector development. He provides strategic leadership and oversees all company operations to ensure sustainable growth and market expansion.',
          order: 0,
          isActive: true
        },
        {
          name: 'Ms. Wilkister Simiyu',
          position: 'Company Secretary & General Manager Legal Services',
          image: '/images/general managers/wilkister-simiyu.jpg',
          bio: 'Ms. Wilkister Simiyu (born 16 June 1981) is the Company Secretary and General Manager Legal Services at Kenya Seed, joining in May 2024. She has 19 years of experience as an advocate, both in private practice and as in-house counsel, contributing to initiatives such as the establishment of multiple constituent colleges and the Universities Act, 2012. Ms. Simiyu has held leadership roles including Director and Chair at the Kenya Revenue Authority and Council Member at KIBU. She holds an LLM in Commercial and Corporate Law, a Postgraduate Diploma in Law and Development (University of London), an LLB (Hons) from Moi University, and is a Certified Public Secretary (CPS-K), Governance and Legal Auditor, and certified Pension Trustee.',
          order: 1,
          isActive: true
        },
        {
          name: 'CPA Leonard Kibet',
          position: 'AG. General Manager Internal Audit & Risk Assurance',
          image: '/images/general managers/Leonard-Kibet.jpg',
          bio: 'CPA Kibet leads the Internal Audit and Risk Assurance function, ensuring robust internal controls, risk management frameworks, and compliance with regulatory and industry standards.',
          order: 2,
          isActive: true
        },
        {
          name: 'Mr. Hezekiah Keitany',
          position: 'AG. General Manager Finance & Investment',
          image: '/images/general managers/Hezekiah-Keitany.jpg',
          bio: 'Mr. Keitany oversees the company\'s financial operations, investment strategies, and ensures sound financial management practices that support the organization\'s growth objectives.',
          order: 3,
          isActive: true
        },
        {
          name: 'Mr. William K. Kiberen',
          position: 'AG. General Manager Sales, Marketing & Business Development',
          image: '/images/general managers/william-Kiberen.jpg',
          bio: 'Mr. Kiberen leads the Sales, Marketing and Business Development functions, driving market expansion, customer relationship management, and strategic partnerships across Kenya.',
          order: 4,
          isActive: true
        },
        {
          name: 'Mr. Joseph Kimutai Kigen',
          position: 'AG. Manager, Supply Chain Management',
          image: '/images/general managers/Joseph-Kigen.jpg',
          bio: 'Mr. Kigen manages the company\'s supply chain operations, ensuring efficient procurement, inventory management, and distribution of products to farmers nationwide.',
          order: 5,
          isActive: true
        },
        {
          name: 'Eng. Erick Nyamburi',
          position: 'General Manager Processing & Engineering',
          image: '/images/general managers/erick-nyamburi.jpg',
          bio: 'Eng. Nyamburi oversees all processing and engineering operations, ensuring optimal seed processing, quality control, and maintenance of processing infrastructure.',
          order: 6,
          isActive: true
        },
        {
          name: 'Mr. Francis Chege Mwaura',
          position: 'General Manager Seed Production',
          image: '/images/general managers/Francis-Mwaura.jpg',
          bio: 'Mr. Mwaura leads seed production operations, overseeing the entire production cycle from farmer contracting to seed harvesting and ensuring quality seed production standards.',
          order: 7,
          isActive: true
        },
        {
          name: 'Mr. Joseph Kamau',
          position: 'General Manager Research & Development',
          image: 'https://dev.xtranet.co.ke/kenyaseed/wp-content/uploads/2025/07/kamau.png',
          bio: 'Mr. Kamau heads the Research and Development department, leading innovative research in plant breeding, variety development, and agricultural technology advancement.',
          order: 8,
          isActive: true
        },
        {
          name: 'Mrs. Beatrice Aiyabei',
          position: 'AG. General Manager Strategy & Planning, ICT & Quality Assurance',
          image: '/images/general managers/Beatrice-Aiyabei.jpg',
          bio: 'Mrs. Beatrice Aiyabei is the Acting General Manager Strategy & Planning, ICT and Quality Assurance with responsibility to formulate policies on seed quality, coordinating risk management efforts and leading planning and performance management processes. She holds Bachelors (Hons) and Master of Science Degree in Agricultural Economics from Egerton University and Moi University respectively. Her training includes Certificate in Seed Business Management from CYMMIT and carries a vast experience from the seed industry attained while serving in various positions at Kenya Seed Company Ltd and Simlaw Seeds Company Ltd. She is a member of the Marketing Society of Kenya (MSK) and African Association of Agricultural Economists (AAAE). She was born in 1968 and joined the company in 1992. Beatrice strives to share her vision of exemplary seed market gains across the African continent to millions of organizations and farmers.',
          order: 9,
          isActive: true
        }
      ],
      isActive: true,
      order: 0
    });
    setIsTeamDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingTeam) return;
    
    if (!editingTeam.hero.title || !editingTeam.hero.subtitle) {
      showMessage('error', 'Hero title and subtitle are required');
      return;
    }

    setIsSaving(true);
    try {
      await saveTeamMutation.mutateAsync(editingTeam);
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const addMember = () => {
    if (!editingTeam) return;
    const newMember: TeamMember = {
      name: '',
      position: '',
      image: '',
      bio: '',
      order: editingTeam.members.length,
      isActive: true
    };
    setEditingTeam({
      ...editingTeam,
      members: [...editingTeam.members, newMember]
    });
  };

  const updateMember = (index: number, field: keyof TeamMember, value: string | boolean | number) => {
    if (!editingTeam) return;
    const updatedMembers = [...editingTeam.members];
    updatedMembers[index] = { ...updatedMembers[index], [field]: value };
    setEditingTeam({ ...editingTeam, members: updatedMembers });
  };

  const removeMember = (index: number) => {
    if (!editingTeam) return;
    const updatedMembers = editingTeam.members.filter((_, i) => i !== index);
    setEditingTeam({ ...editingTeam, members: updatedMembers });
  };

  const handleFileUpload = async (file: File, memberIndex: number) => {
    if (!editingTeam) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('folder', 'team');
      
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
    if (!image) return '/api/images/team/placeholder.svg';
    
    // Check if we have a cached version of this image
    const cachedImage = getCachedImage(image);
    if (cachedImage) {
      return cachedImage;
    }
    
    // Convert API path to public folder path
    if (image.startsWith('/api/images/team/')) {
      const filename = image.replace('/api/images/team/', '');
      return `/api/images/team/${filename}`;
    }
    
    // If it's already a public path, return as is
    if (image.startsWith('/images/general managers/')) {
      return image.replace('/images/general managers/', '/api/images/team/');
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

  if (!teamData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <Typography>Loading team data...</Typography>
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">Failed to load team data. Please try again.</Alert>;
  }

  if (!teamData) {
    return <Alert severity="warning">No team data found. Please contact your administrator.</Alert>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Team Management</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage your team page content including hero section and team member profiles.
      </Typography>

      {/* Live Preview */}
      <Box sx={{ mb: 4, position: 'relative' }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 2, color: 'primary.main', fontWeight: 'bold' }}>Live Preview - This is how your team page appears to visitors
        </Typography>
        
        <Paper sx={{ p: 3, bgcolor: '#f0fdf4', maxHeight: '600px', overflow: 'auto' }}>
          <style>{`
            .team-image {
              width: 128px !important;
              height: 128px !important;
              object-fit: cover !important;
              object-position: center !important;
              border-radius: 50% !important;
              border: 4px solid #0ea5e9 !important;
              margin: 0 auto 16px auto !important;
              display: block !important;
            }
            .team-preview-image {
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
              <section className="py-32 gradient-primary text-primary-foreground">
                <div className="container mx-auto px-4">
                  <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-4xl lg:text-6xl font-bold mb-6">
                      {teamData?.hero?.title || 'Our Team'}
                    </h1>
                    <p className="text-xl lg:text-2xl text-primary-foreground/90 leading-relaxed">
                      {teamData?.hero?.subtitle || 'Meet the dedicated professionals behind our success'}
                    </p>
                  </div>
                </div>
              </section>

              {/* Team Members */}
              <section className="py-20">
                <div className="container mx-auto px-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {teamData?.members
                      ?.filter(member => member.isActive)
                      .sort((a, b) => a.order - b.order)
                      .map((member, index) => (
                      <Card key={index} className="shadow-agricultural border-0 hover:shadow-lg transition-all duration-300">
                        <CardContent className="p-6">
                          <div className="text-center mb-6">
                            <img
                              src={resolveImageUrl(member.image)}
                              alt={member.name}
                              className="team-image"
                              onError={(e) => {
                                e.currentTarget.src = '/api/images/team/placeholder.svg';
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
              {activeModal !== null && teamData?.members?.[activeModal] && (
                <div
                  className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                  onClick={closeModal}
                  aria-modal="true"
                  role="dialog"
                >
                  <div
                    className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="text-center mb-4">
                      <img
                        src={resolveImageUrl(teamData?.members?.[activeModal]?.image || '')}
                        alt={teamData?.members?.[activeModal]?.name || ''}
                        className="team-image"
                        onError={(e) => {
                          e.currentTarget.src = '/api/images/team/placeholder.svg';
                        }}
                      />
                      <h3 className="text-xl font-bold text-primary">
                        {teamData?.members?.[activeModal]?.name || ''}
                      </h3>
                      <p className="text-secondary font-semibold mb-3">
                        {teamData?.members?.[activeModal]?.position || ''}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {teamData?.members?.[activeModal]?.bio || ''}
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
          <Typography variant="h6" component="div">Team Settings</Typography>
        </CardHeader>
            <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Edit your team page content including hero section and team member profiles.
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<EditIcon />} 
              onClick={openEditTeam}
              disabled={isSaving}
            >
              Edit Team
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog 
        open={isTeamDialogOpen} 
        onClose={() => setIsTeamDialogOpen(false)} 
        maxWidth="lg" 
        fullWidth
      >
        <DialogTitle>Edit Team</DialogTitle>
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
                value={editingTeam?.hero.title || ''}
                onChange={(e) => setEditingTeam({ 
                  ...editingTeam!, 
                  hero: { ...editingTeam!.hero, title: e.target.value }
                })}
                  required
                />
            </Grid>
            <Grid item xs={12}>
                <TextField
                  fullWidth
                label="Hero Subtitle"
                value={editingTeam?.hero.subtitle || ''}
                onChange={(e) => setEditingTeam({ 
                  ...editingTeam!, 
                  hero: { ...editingTeam!.hero, subtitle: e.target.value }
                })}
                  multiline
                  rows={3}
                  required
              />
            </Grid>

            {/* Members Section */}
            <Grid item xs={12}>
              <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
                <Typography variant="h6">Team Members</Typography>
                <Button startIcon={<AddIcon />} onClick={addMember} size="small">
            Add Member
          </Button>
        </Box>
            </Grid>
            {editingTeam?.members.map((member, index) => (
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
                            className="team-preview-image"
                            onError={(e) => {
                              e.currentTarget.src = '/api/images/team/placeholder.svg';
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
          <Button onClick={() => setIsTeamDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            disabled={isSaving || !editingTeam?.hero.title || !editingTeam?.hero.subtitle}
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

export default TeamEditor;