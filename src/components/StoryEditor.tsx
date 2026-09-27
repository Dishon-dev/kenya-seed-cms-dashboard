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
  Chip
} from '@mui/material';
import {
  Edit as EditIcon, 
  Save as SaveIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Event as CalendarIcon,
  LocationOn as MapPinIcon,
  People as UsersIcon,
  EmojiEvents as AwardIcon,
  LocalFlorist as SproutIcon,
  Business as FactoryIcon,
  Public as GlobeIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5001';

interface TimelineEvent {
  year: string;
  title: string;
  description: string;
  icon: string;
}

interface Milestone {
  metric: string;
  label: string;
  description: string;
}

interface StoryData {
  id?: string | number;
  introduction: {
  title: string;
    subtitle: string;
  description: string;
    cardContent: string;
    cardContent2: string;
  };
  milestones: Milestone[];
  timeline: TimelineEvent[];
  culture: {
    title: string;
    subtitle: string;
    heritage: {
      title: string;
      description: string;
      description2: string;
    };
    farmerCentric: {
      title: string;
      description: string;
      description2: string;
    };
  };
  isActive: boolean;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

const iconMap: { [key: string]: any } = {
  'Calendar': CalendarIcon,
  'MapPin': MapPinIcon,
  'Users': UsersIcon,
  'Award': AwardIcon,
  'Sprout': SproutIcon,
  'Factory': FactoryIcon,
  'Globe': GlobeIcon,
  'TrendingUp': TrendingUpIcon
};

const StoryEditor: React.FC = () => {
  const [storyData, setStoryData] = useState<StoryData | null>(null);
  const [editingStory, setEditingStory] = useState<StoryData | null>(null);
  const [isStoryDialogOpen, setIsStoryDialogOpen] = useState(false);
  const [editingTimelineIndex, setEditingTimelineIndex] = useState<number | null>(null);
  const [editingMilestoneIndex, setEditingMilestoneIndex] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const mountedRef = useRef(true);
  const messageTimeoutRef = useRef<number | null>(null);
  const queryClient = useQueryClient();

  // Local storage functions
  const saveStoryToStorage = useCallback((data: StoryData) => {
    try {
      localStorage.setItem('storyData', JSON.stringify(data));
      console.log('Story data saved to localStorage');
    } catch (error) {
      console.error('Failed to save story data to localStorage:', error);
    }
  }, []);

  const loadStoryFromStorage = useCallback((): StoryData | null => {
    try {
      const stored = localStorage.getItem('storyData');
      if (stored) {
        const data = JSON.parse(stored);
        console.log('Story data loaded from localStorage');
        return data;
      }
    } catch (error) {
      console.error('Failed to load story data from localStorage:', error);
    }
    return null;
  }, []);

  // Fetch story data
  const { data: storyResponse, isPending, error } = useQuery({
    queryKey: ['story'],
    queryFn: async () => {
      try {
        const cachedData = loadStoryFromStorage();
        if (cachedData) {
          setTimeout(async () => {
            try {
              const response = await axios.get(`${API_BASE}/api/story`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
              if (response.data) {
                saveStoryToStorage(response.data);
                queryClient.setQueryData(['story'], response.data);
              }
            } catch (error) {
              console.log('Background API fetch failed, using cached data');
            }
          }, 100);
          return cachedData;
        }

        const response = await axios.get(`${API_BASE}/api/story`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
        if (response.data) {
          saveStoryToStorage(response.data);
        }
      return response.data;
      } catch (error) {
        const cachedData = loadStoryFromStorage();
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

  // Save story mutation
  const saveStoryMutation = useMutation<any, any, StoryData>({
    mutationFn: async (data) => {
      const response = await axios.post(`${API_BASE}/api/story`, data, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      saveStoryToStorage(variables);
      queryClient.invalidateQueries({ queryKey: ['story'] });
      showMessage('success', 'Story updated successfully!');
      setEditingStory(null);
      setIsStoryDialogOpen(false);
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error || 
        'Failed to save story. Please try again.';
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
    if (storyResponse) {
      setStoryData(storyResponse);
    }
  }, [storyResponse]);

  const openEditStory = () => {
    setEditingStory(storyData || {
      introduction: {
        title: 'A Legacy Born from Vision',
        subtitle: 'Kenya Seed Company Limited was established with a clear vision: to transform Kenya\'s agricultural landscape through the provision of high-quality certified seeds and comprehensive farmer support services.',
        description: '',
        cardContent: 'Our story begins in the post-independence era when Kenya recognized the critical importance of agricultural self-sufficiency. Founded as a state corporation, we were entrusted with the vital mission of ensuring that Kenyan farmers had access to the best quality seeds available.',
        cardContent2: 'What started as a vision to improve maize production has evolved into a comprehensive agricultural support system that touches the lives of thousands of farmers across all 47 counties in Kenya. Today, we stand as a testament to what can be achieved when vision meets dedication and innovation.'
      },
      milestones: [
        { metric: '67+', label: 'Years of Excellence', description: 'Nearly seven decades serving Kenya\'s farmers' },
        { metric: '500+', label: 'Dedicated Staff', description: 'Experts in agronomy, research, and farmer support' },
        { metric: '47', label: 'Counties Covered', description: 'Nationwide presence across all Kenyan counties' },
        { metric: '50+', label: 'Seed Varieties', description: 'Diverse portfolio of certified quality seeds' }
      ],
      timeline: [
        { year: '1956', title: 'Foundation', description: 'Kenya Seed Company Limited was incorporated as a state corporation to address the seed needs of Kenya\'s agricultural sector.', icon: 'Factory' },
        { year: '1972', title: 'Operational Launch', description: 'Company began full operations with focus on maize seed production and distribution across Kenya.', icon: 'Sprout' },
        { year: '1980s', title: 'Product Expansion', description: 'Diversified into sunflower, oil crops, and vegetable seeds to meet growing farmer demands.', icon: 'Globe' },
        { year: '1990s', title: 'Research Excellence', description: 'Established state-of-the-art research facilities and launched hybrid seed development programs.', icon: 'Award' },
        { year: '2000s', title: 'National Coverage', description: 'Expanded distribution network to reach all 47 counties, ensuring nationwide seed accessibility.', icon: 'MapPin' },
        { year: '2010s', title: 'Innovation Focus', description: 'Launched climate-smart agriculture initiatives and drought-resistant seed varieties.', icon: 'TrendingUp' },
        { year: '2020+', title: 'Digital Transformation', description: 'Embraced digital technologies for farmer training, e-commerce, and precision agriculture support.', icon: 'Users' }
      ],
      culture: {
        title: 'Our Culture & Values',
        subtitle: 'The principles that have guided our journey and continue to shape our future.',
        heritage: {
          title: 'Heritage of Excellence',
          description: 'For nearly seven decades, we have maintained an unwavering commitment to quality. Our "Top Quality Seed" motto is not just a slogan—it\'s a promise that permeates every aspect of our operations.',
          description2: 'From our research laboratories to our production facilities, from our quality control processes to our farmer training programs, excellence is embedded in our DNA.'
        },
        farmerCentric: {
          title: 'Farmer-Centric Approach',
          description: 'Our farmers are at the heart of everything we do. We don\'t just supply seeds; we build partnerships that help farming communities thrive and contribute to Kenya\'s food security.',
          description2: 'Through comprehensive training programs, technical support, and continuous innovation, we empower farmers with the knowledge and tools they need for sustainable success.'
        }
      },
      isActive: true,
      order: 0
    });
    setIsStoryDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingStory) return;
    
    if (!editingStory.introduction.title || !editingStory.introduction.subtitle) {
      showMessage('error', 'Introduction title and subtitle are required');
        return;
    }

    setIsSaving(true);
    try {
      await saveStoryMutation.mutateAsync(editingStory);
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const addTimelineEvent = () => {
    if (!editingStory) return;
    const newEvent: TimelineEvent = {
          year: '',
          title: '',
          description: '',
      icon: 'Calendar'
    };
    setEditingStory({
      ...editingStory,
      timeline: [...editingStory.timeline, newEvent]
    });
  };

  const updateTimelineEvent = (index: number, field: keyof TimelineEvent, value: string) => {
    if (!editingStory) return;
    const updatedTimeline = [...editingStory.timeline];
    updatedTimeline[index] = { ...updatedTimeline[index], [field]: value };
    setEditingStory({ ...editingStory, timeline: updatedTimeline });
  };

  const removeTimelineEvent = (index: number) => {
    if (!editingStory) return;
    const updatedTimeline = editingStory.timeline.filter((_, i) => i !== index);
    setEditingStory({ ...editingStory, timeline: updatedTimeline });
  };

  const addMilestone = () => {
    if (!editingStory) return;
    const newMilestone: Milestone = {
      metric: '',
      label: '',
      description: ''
    };
    setEditingStory({
      ...editingStory,
      milestones: [...editingStory.milestones, newMilestone]
    });
  };

  const updateMilestone = (index: number, field: keyof Milestone, value: string) => {
    if (!editingStory) return;
    const updatedMilestones = [...editingStory.milestones];
    updatedMilestones[index] = { ...updatedMilestones[index], [field]: value };
    setEditingStory({ ...editingStory, milestones: updatedMilestones });
  };

  const removeMilestone = (index: number) => {
    if (!editingStory) return;
    const updatedMilestones = editingStory.milestones.filter((_, i) => i !== index);
    setEditingStory({ ...editingStory, milestones: updatedMilestones });
  };

  if (isPending) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">Failed to load story data. Please try again.</Alert>;
  }

  if (!storyData) {
    return <Alert severity="warning">No story data found. Please contact your administrator.</Alert>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Story Management</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage your company story content including introduction, timeline, milestones, and culture sections.
      </Typography>

      {/* Live Preview */}
      <Box sx={{ mb: 4, position: 'relative' }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 2, color: 'primary.main', fontWeight: 'bold' }}>Live Preview - This is how your story appears to visitors
        </Typography>
        
        <Paper sx={{ p: 3, bgcolor: '#f0fdf4', maxHeight: '600px', overflow: 'auto' }}>
            <div className="min-h-screen">
            <main>
              {/* Story Introduction */}
              <section className="py-20">
                <div className="container mx-auto px-4">
                  <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-16">
                      <h2 className="text-3xl lg:text-4xl font-bold text-primary mb-6">
                        {storyData.introduction.title}
                      </h2>
                      <p className="text-xl text-muted-foreground leading-relaxed">
                        {storyData.introduction.subtitle}
                      </p>
                    </div>
                    
                    <Card className="shadow-agricultural border-0 mb-12">
                      <CardContent className="p-8">
                        <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                          {storyData.introduction.cardContent}
                        </p>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                          {storyData.introduction.cardContent2}
                        </p>
                      </CardContent>
                    </Card>

                    {/* Key Milestones */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                      {storyData.milestones.map((milestone, index) => (
                        <Card key={index} className="text-center shadow-agricultural border-0">
                          <CardContent className="p-6">
                            <div className="text-3xl font-bold text-primary mb-2">
                              {milestone.metric}
                            </div>
                            <div className="font-semibold text-primary mb-2">
                              {milestone.label}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {milestone.description}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* Timeline */}
              <section className="py-20 bg-accent/10">
                <div className="container mx-auto px-4">
                  <div className="text-center mb-16">
                    <h2 className="text-3xl lg:text-4xl font-bold text-primary mb-6">
                      Our Journey Through Time
                    </h2>
                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                      Discover the key moments that have shaped Kenya Seed Company into 
                      the agricultural leader it is today.
                    </p>
                  </div>
                  
                  <div className="space-y-8">
                    {storyData.timeline.map((event, index) => {
                      const IconComponent = iconMap[event.icon] || CalendarIcon;
                      return (
                      <div key={index} className="flex items-start space-x-6">
                        <div className="flex-shrink-0">
                          <div className="w-16 h-16 gradient-secondary rounded-full flex items-center justify-center">
                              <IconComponent className="h-8 w-8 text-secondary-foreground" />
                          </div>
                        </div>
                        <div className="flex-grow">
                          <Card className="shadow-agricultural border-0">
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between mb-4">
                                <div>
                                    <Chip label={event.year} className="text-lg px-4 py-2 mb-3" />
                                  <h3 className="text-xl font-bold text-primary mb-2">
                                    {event.title}
                                  </h3>
                                </div>
                                <CalendarIcon className="h-6 w-6 text-primary" />
                              </div>
                              <p className="text-muted-foreground leading-relaxed">
                                {event.description}
                              </p>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </div>
              </section>

              {/* Values & Culture */}
              <section className="py-20">
                <div className="container mx-auto px-4">
                  <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-16">
                      <h2 className="text-3xl lg:text-4xl font-bold text-primary mb-6">
                        {storyData.culture.title}
                      </h2>
                      <p className="text-xl text-muted-foreground">
                        {storyData.culture.subtitle}
                      </p>
                    </div>
                    
                    <Card className="shadow-agricultural border-0">
                      <CardContent className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div>
                              <h3 className="text-2xl font-bold text-primary mb-4">
                              {storyData.culture.heritage.title}
                              </h3>
                            <p className="text-muted-foreground leading-relaxed mb-4">
                              {storyData.culture.heritage.description}
                            </p>
                              <p className="text-muted-foreground leading-relaxed">
                              {storyData.culture.heritage.description2}
                              </p>
                            </div>
                          <div>
                            <h3 className="text-2xl font-bold text-primary mb-4">
                              {storyData.culture.farmerCentric.title}
                            </h3>
                            <p className="text-muted-foreground leading-relaxed mb-4">
                              {storyData.culture.farmerCentric.description}
                            </p>
                            <p className="text-muted-foreground leading-relaxed">
                              {storyData.culture.farmerCentric.description2}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </section>
            </main>
            </div>
        </Paper>
      </Box>

      {/* Management Controls */}
          <Card>
        <CardHeader>
          <Typography variant="h6" component="div">Story Settings</Typography>
        </CardHeader>
            <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Edit your company story content including introduction, timeline events, milestones, and culture sections.
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<EditIcon />} 
              onClick={openEditStory}
              disabled={isSaving}
            >
              Edit Story
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog 
        open={isStoryDialogOpen} 
        onClose={() => setIsStoryDialogOpen(false)} 
        maxWidth="lg" 
        fullWidth
      >
        <DialogTitle>Edit Story</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {/* Introduction Section */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Introduction</Typography>
            </Grid>
            <Grid item xs={12}>
                <TextField
                  fullWidth
                label="Title"
                value={editingStory?.introduction.title || ''}
                onChange={(e) => setEditingStory({ 
                  ...editingStory!, 
                  introduction: { ...editingStory!.introduction, title: e.target.value }
                })}
                  required
                />
            </Grid>
            <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Subtitle"
                value={editingStory?.introduction.subtitle || ''}
                onChange={(e) => setEditingStory({ 
                  ...editingStory!, 
                  introduction: { ...editingStory!.introduction, subtitle: e.target.value }
                })}
                  multiline
                rows={2}
                  required
                />
            </Grid>
            <Grid item xs={12}>
                <TextField
                  fullWidth
                label="Card Content 1"
                value={editingStory?.introduction.cardContent || ''}
                onChange={(e) => setEditingStory({ 
                  ...editingStory!, 
                  introduction: { ...editingStory!.introduction, cardContent: e.target.value }
                })}
                  multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Card Content 2"
                value={editingStory?.introduction.cardContent2 || ''}
                onChange={(e) => setEditingStory({ 
                  ...editingStory!, 
                  introduction: { ...editingStory!.introduction, cardContent2: e.target.value }
                })}
                multiline
                rows={3}
              />
            </Grid>

            {/* Milestones Section */}
            <Grid item xs={12}>
              <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
                <Typography variant="h6">Milestones</Typography>
                <Button startIcon={<AddIcon />} onClick={addMilestone} size="small">
                  Add Milestone
              </Button>
              </Box>
            </Grid>
            {editingStory?.milestones.map((milestone, index) => (
              <Grid item xs={12} key={index}>
                <Box sx={{ p: 2, border: '1px solid #e5e7eb', borderRadius: 1 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="subtitle2">Milestone {index + 1}</Typography>
                    <IconButton size="small" onClick={() => removeMilestone(index)}>
                      <DeleteIcon />
                    </IconButton>
            </Box>
            <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Metric"
                        value={milestone.metric}
                        onChange={(e) => updateMilestone(index, 'metric', e.target.value)}
                          size="small" 
                        />
                </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Label"
                        value={milestone.label}
                        onChange={(e) => updateMilestone(index, 'label', e.target.value)}
                        size="small"
                      />
            </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Description"
                        value={milestone.description}
                        onChange={(e) => updateMilestone(index, 'description', e.target.value)}
                          size="small" 
                        />
                </Grid>
            </Grid>
          </Box>
              </Grid>
            ))}

            {/* Timeline Section */}
            <Grid item xs={12}>
              <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
                <Typography variant="h6">Timeline Events</Typography>
                <Button startIcon={<AddIcon />} onClick={addTimelineEvent} size="small">
                  Add Event
              </Button>
            </Box>
            </Grid>
            {editingStory?.timeline.map((event, index) => (
              <Grid item xs={12} key={index}>
                <Box sx={{ p: 2, border: '1px solid #e5e7eb', borderRadius: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="subtitle2">Event {index + 1}</Typography>
                    <IconButton size="small" onClick={() => removeTimelineEvent(index)}>
                        <DeleteIcon />
                      </IconButton>
          </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  label="Year"
                        value={event.year}
                        onChange={(e) => updateTimelineEvent(index, 'year', e.target.value)}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Title"
                        value={event.title}
                        onChange={(e) => updateTimelineEvent(index, 'title', e.target.value)}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        fullWidth
                        label="Icon"
                        value={event.icon}
                        onChange={(e) => updateTimelineEvent(index, 'icon', e.target.value)}
                        size="small"
                        select
                        SelectProps={{ native: true }}
                      >
                        {Object.keys(iconMap).map((icon) => (
                          <option key={icon} value={icon}>{icon}</option>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Description"
                        value={event.description}
                        onChange={(e) => updateTimelineEvent(index, 'description', e.target.value)}
                  multiline
                        rows={2}
                        size="small"
                      />
                    </Grid>
                  </Grid>
                        </Box>
              </Grid>
            ))}

            {/* Culture Section */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Culture & Values</Typography>
            </Grid>
            <Grid item xs={12}>
                <TextField
                  fullWidth
                label="Culture Title"
                value={editingStory?.culture.title || ''}
                onChange={(e) => setEditingStory({ 
                  ...editingStory!, 
                  culture: { ...editingStory!.culture, title: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={12}>
                <TextField
                  fullWidth
                label="Culture Subtitle"
                value={editingStory?.culture.subtitle || ''}
                onChange={(e) => setEditingStory({ 
                  ...editingStory!, 
                  culture: { ...editingStory!.culture, subtitle: e.target.value }
                })}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>Heritage of Excellence</Typography>
                <TextField
                  fullWidth
                label="Heritage Title"
                value={editingStory?.culture.heritage.title || ''}
                onChange={(e) => setEditingStory({ 
                  ...editingStory!, 
                  culture: { 
                    ...editingStory!.culture, 
                    heritage: { ...editingStory!.culture.heritage, title: e.target.value }
                  }
                })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Heritage Description 1"
                value={editingStory?.culture.heritage.description || ''}
                onChange={(e) => setEditingStory({ 
                  ...editingStory!, 
                  culture: { 
                    ...editingStory!.culture, 
                    heritage: { ...editingStory!.culture.heritage, description: e.target.value }
                  }
                })}
                  multiline
                  rows={3}
                sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                label="Heritage Description 2"
                value={editingStory?.culture.heritage.description2 || ''}
                onChange={(e) => setEditingStory({ 
                  ...editingStory!, 
                  culture: { 
                    ...editingStory!.culture, 
                    heritage: { ...editingStory!.culture.heritage, description2: e.target.value }
                  }
                })}
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>Farmer-Centric Approach</Typography>
                <TextField
                  fullWidth
                label="Farmer-Centric Title"
                value={editingStory?.culture.farmerCentric.title || ''}
                onChange={(e) => setEditingStory({ 
                  ...editingStory!, 
                  culture: { 
                    ...editingStory!.culture, 
                    farmerCentric: { ...editingStory!.culture.farmerCentric, title: e.target.value }
                  }
                })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Farmer-Centric Description 1"
                value={editingStory?.culture.farmerCentric.description || ''}
                onChange={(e) => setEditingStory({ 
                  ...editingStory!, 
                  culture: { 
                    ...editingStory!.culture, 
                    farmerCentric: { ...editingStory!.culture.farmerCentric, description: e.target.value }
                  }
                })}
                  multiline
                rows={3}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Farmer-Centric Description 2"
                value={editingStory?.culture.farmerCentric.description2 || ''}
                onChange={(e) => setEditingStory({ 
                  ...editingStory!, 
                  culture: { 
                    ...editingStory!.culture, 
                    farmerCentric: { ...editingStory!.culture.farmerCentric, description2: e.target.value }
                  }
                })}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsStoryDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            disabled={isSaving || !editingStory?.introduction.title || !editingStory?.introduction.subtitle}
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

export default StoryEditor;