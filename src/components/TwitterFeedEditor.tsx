import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Card,
  CardContent,
  CardHeader,
  Switch,
  FormControlLabel,
  Divider,
  Snackbar,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Tooltip
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Twitter as TwitterIcon,
  Facebook as FacebookIcon,
  Article as NewsIcon,
  Event as EventIcon,
  Palette as PaletteIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE = `${process.env.REACT_APP_API_BASE || 'http://localhost:5001'}/api`;

// Types
interface TwitterFeedConfig {
  title: string;
  newsTitle: string;
  eventsTitle: string;
  facebookTitle: string;
  newsUrl: string;
  localhostNewsUrl: string;
}

interface TwitterFeedNews {
  title: string;
  date: string;
  description: string;
  image: string;
  readMoreText: string;
}

interface TwitterFeedEvent {
  id: string;
  date: string;
  title: string;
}

interface FacebookConfig {
  enabled: boolean;
  pageUrl: string;
  width: string;
  height: string;
  showFaces: boolean;
  showStream: boolean;
  showHeader: boolean;
}

interface TwitterConfig {
  enabled: boolean;
  tweetId: string;
  theme: string;
  width: string;
  height: string;
}

interface SocialMediaConfig {
  facebook: FacebookConfig;
  twitter: TwitterConfig;
}

interface TwitterFeedStyling {
  containerMaxWidth: string;
  gridCols: string;
  cardBackground: string;
  cardBorderRadius: string;
  cardShadow: string;
  cardBorder: string;
  titleColor: string;
  textColor: string;
  linkColor: string;
  hoverColor: string;
}

interface TwitterFeedData {
  id: string;
  config: TwitterFeedConfig;
  news: TwitterFeedNews;
  events: TwitterFeedEvent[];
  socialMedia: SocialMediaConfig;
  styling: TwitterFeedStyling;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

const TwitterFeedEditor: React.FC = () => {
  const [twitterFeedData, setTwitterFeedData] = useState<TwitterFeedData | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [editingEvent, setEditingEvent] = useState<TwitterFeedEvent | null>(null);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({ date: '', title: '' });

  const queryClient = useQueryClient();

  // Local storage functions
  const saveTwitterFeedToStorage = useCallback((data: TwitterFeedData) => {
    try {
      localStorage.setItem('twitterFeedData', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving twitter feed to storage:', error);
    }
  }, []);

  const loadTwitterFeedFromStorage = useCallback((): TwitterFeedData | null => {
    try {
      const stored = localStorage.getItem('twitterFeedData');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error loading twitter feed from storage:', error);
      return null;
    }
  }, []);

  // Fetch twitter feed data
  const { data: fetchedData, isLoading, error } = useQuery({
    queryKey: ['twitter-feed'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/twitter-feed`);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Initialize twitterFeedData when API data is fetched
  useEffect(() => {
    if (fetchedData && fetchedData.success && fetchedData.data) {
      const apiData = fetchedData.data;
      
      // Transform API data to match component structure
      const transformedData: TwitterFeedData = {
        id: apiData.id?.toString() || '1',
        config: {
          title: apiData.title || 'Social Media Feed',
          newsTitle: 'Latest News',
          eventsTitle: 'Upcoming Events',
          facebookTitle: 'Facebook Feed',
          newsUrl: '#',
          localhostNewsUrl: '#'
        },
        news: {
          title: apiData.news?.title || 'Latest News',
          date: new Date().toISOString().split('T')[0],
          description: apiData.description || 'Stay updated with our latest news and events',
          image: apiData.news?.image || '/api/images/twitter-feed/news.jpg',
          readMoreText: 'Read More'
        },
        events: apiData.events || [],
        socialMedia: {
          facebook: {
            enabled: false,
            pageUrl: apiData.social_media?.facebook || '',
            width: '500',
            height: '400',
            showFaces: true,
            showStream: true,
            showHeader: true
          },
          twitter: {
            enabled: false,
            tweetId: apiData.social_media?.twitter || '',
            theme: 'light',
            width: '500',
            height: '400'
          }
        },
        styling: {
          containerMaxWidth: '6xl',
          gridCols: 'md:grid-cols-2',
          cardBackground: 'white',
          cardBorderRadius: 'lg',
          cardShadow: 'md',
          cardBorder: '',
          titleColor: '#000000',
          textColor: '#000000',
          linkColor: '#0000ff',
          hoverColor: '#f0f0f0'
        },
        isActive: apiData.is_active || true,
        order: 1,
        createdAt: apiData.created_at || new Date().toISOString(),
        updatedAt: apiData.updated_at || new Date().toISOString()
      };
      
      setTwitterFeedData(transformedData);
    }
  }, [fetchedData]);

  // Update twitter feed data mutation
  const updateTwitterFeedMutation = useMutation({
    mutationFn: async (data: Partial<TwitterFeedData>) => {
      const response = await axios.post(`${API_BASE}/twitter-feed`, data);
      return response.data;
    },
    onSuccess: (data) => {
      setTwitterFeedData(data.data);
      saveTwitterFeedToStorage(data.data);
      queryClient.invalidateQueries({ queryKey: ['twitter-feed'] });
      setMessage({ type: 'success', text: 'Twitter Feed updated successfully!' });
    },
    onError: (error: any) => {
      console.error('Error updating twitter feed:', error);
      setMessage({ type: 'error', text: 'Failed to update twitter feed. Please try again.' });
    }
  });

  // Add event mutation
  const addEventMutation = useMutation({
    mutationFn: async (event: { date: string, title: string }) => {
      const response = await axios.post(`${API_BASE}/twitter-feed/events`, event);
      return response.data;
    },
    onSuccess: (data) => {
      setTwitterFeedData(data.data);
      saveTwitterFeedToStorage(data.data);
      queryClient.invalidateQueries({ queryKey: ['twitter-feed'] });
      setMessage({ type: 'success', text: 'Event added successfully!' });
      setIsEventDialogOpen(false);
      setNewEvent({ date: '', title: '' });
    },
    onError: (error: any) => {
      console.error('Error adding event:', error);
      setMessage({ type: 'error', text: 'Failed to add event. Please try again.' });
    }
  });

  // Update event mutation
  const updateEventMutation = useMutation({
    mutationFn: async ({ id, event }: { id: string, event: { date: string, title: string } }) => {
      const response = await axios.put(`${API_BASE}/twitter-feed/events/${id}`, event);
      return response.data;
    },
    onSuccess: (data) => {
      setTwitterFeedData(data.data);
      saveTwitterFeedToStorage(data.data);
      queryClient.invalidateQueries({ queryKey: ['twitter-feed'] });
      setMessage({ type: 'success', text: 'Event updated successfully!' });
      setIsEventDialogOpen(false);
      setEditingEvent(null);
    },
    onError: (error: any) => {
      console.error('Error updating event:', error);
      setMessage({ type: 'error', text: 'Failed to update event. Please try again.' });
    }
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.delete(`${API_BASE}/twitter-feed/events/${id}`);
      return response.data;
    },
    onSuccess: (data) => {
      setTwitterFeedData(data.data);
      saveTwitterFeedToStorage(data.data);
      queryClient.invalidateQueries({ queryKey: ['twitter-feed'] });
      setMessage({ type: 'success', text: 'Event deleted successfully!' });
    },
    onError: (error: any) => {
      console.error('Error deleting event:', error);
      setMessage({ type: 'error', text: 'Failed to delete event. Please try again.' });
    }
  });

  // Set twitter feed data from fetched data
  useEffect(() => {
    if (fetchedData) {
      setTwitterFeedData(fetchedData);
      saveTwitterFeedToStorage(fetchedData);
    } else {
      // Try to load from local storage as fallback
      const storedData = loadTwitterFeedFromStorage();
      if (storedData) {
        setTwitterFeedData(storedData);
      }
    }
  }, [fetchedData, saveTwitterFeedToStorage, loadTwitterFeedFromStorage]);

  // Handle save
  const handleSave = () => {
    if (twitterFeedData) {
      updateTwitterFeedMutation.mutate(twitterFeedData);
    }
  };

  // Handle add event
  const handleAddEvent = () => {
    if (newEvent.date && newEvent.title) {
      addEventMutation.mutate(newEvent);
    }
  };

  // Handle edit event
  const handleEditEvent = (event: TwitterFeedEvent) => {
    setEditingEvent(event);
    setNewEvent({ date: event.date, title: event.title });
    setIsEventDialogOpen(true);
  };

  // Handle update event
  const handleUpdateEvent = () => {
    if (editingEvent && newEvent.date && newEvent.title) {
      updateEventMutation.mutate({ id: editingEvent.id, event: newEvent });
    }
  };

  // Handle delete event
  const handleDeleteEvent = (id: string) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      deleteEventMutation.mutate(id);
    }
  };

  // Handle dialog close
  const handleDialogClose = () => {
    setIsEventDialogOpen(false);
    setEditingEvent(null);
    setNewEvent({ date: '', title: '' });
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
          Failed to load twitter feed data. Please try again later.
        </Alert>
      </Box>
    );
  }

  if (!twitterFeedData) {
    return (
      <Box p={3}>
        <Alert severity="info">
          No twitter feed data available.
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, color: 'primary.main', fontWeight: 'bold' }}>Twitter Feed Management
      </Typography>

      {/* Live Preview */}
      <Paper sx={{ p: 3, mb: 4, bgcolor: '#f7f8fa' }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 3, color: 'primary.main', fontWeight: 'bold' }}>
          Live Preview - This is how your Twitter Feed appears to visitors
        </Typography>
        
        {twitterFeedData?.styling ? (
        <div style={{ 
          backgroundColor: '#f7f8fa',
          border: '2px dashed #ccc',
          borderRadius: '8px',
          padding: '20px',
          minHeight: '400px'
        }}>
          <div className={`w-full max-w-${twitterFeedData?.styling?.containerMaxWidth || '6xl'} mx-auto my-10 px-4`}>
            <div className={`grid grid-cols-1 ${twitterFeedData?.styling?.gridCols || 'md:grid-cols-2'} gap-6`}>
              {/* News Section */}
              <div 
                className={`bg-${twitterFeedData?.styling?.cardBackground || 'white'} rounded-${twitterFeedData?.styling?.cardBorderRadius || 'lg'} shadow-${twitterFeedData?.styling?.cardShadow || 'md'} p-4 ${twitterFeedData?.styling?.cardBorder || ''}`}
                style={{ backgroundColor: twitterFeedData?.styling?.cardBackground || 'white' }}
              >
                <h2 
                  className="text-xl font-semibold mb-4"
                  style={{ color: twitterFeedData?.styling?.titleColor || '#000000' }}
                >
                  {twitterFeedData.config?.newsTitle || 'Latest News'}
                </h2>
                <a
                  href={twitterFeedData.config?.newsUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 rounded-lg transition"
                  style={{ 
                    color: twitterFeedData?.styling?.textColor || '#000000',
                    '--hover-bg': twitterFeedData?.styling?.hoverColor || '#f0f0f0'
                  } as React.CSSProperties}
                >
                  <img
                    src={twitterFeedData?.news?.image || ''.startsWith('http') ? twitterFeedData?.news?.image || '' : `http://localhost:5001${twitterFeedData?.news?.image || ''}`}
                    alt="Happy Farmer"
                    className="w-full h-48 object-cover rounded-md shadow-sm mb-3"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `${API_BASE}/api/images/placeholder-400x300.jpg`;
                    }}
                  />
                  <div>
                    <h3 
                      className="text-lg font-semibold hover:underline mb-1"
                      style={{ color: twitterFeedData?.styling?.linkColor || '#0000ff' }}
                    >
                      {twitterFeedData?.news?.title || ''}
                    </h3>
                    <p 
                      className="text-sm mb-2"
                      style={{ color: twitterFeedData?.styling?.textColor || '#000000', opacity: 0.7 }}
                    >
                      {twitterFeedData?.news?.date || ''}
                    </p>
                    <p 
                      className="mb-3 text-sm"
                      style={{ color: twitterFeedData?.styling?.textColor || '#000000' }}
                    >
                      {twitterFeedData?.news?.description || ''}
                    </p>
                    <div 
                      className="text-sm font-medium"
                      style={{ color: twitterFeedData?.styling?.linkColor || '#0000ff' }}
                    >
                      {twitterFeedData?.news?.readMoreText || 'Read More'}
                    </div>
                  </div>
                </a>
              </div>

              {/* Events Section */}
              <div 
                className={`bg-${twitterFeedData?.styling?.cardBackground || 'white'} rounded-${twitterFeedData?.styling?.cardBorderRadius || 'lg'} shadow-${twitterFeedData?.styling?.cardShadow || 'md'} p-4 ${twitterFeedData?.styling?.cardBorder || ''}`}
                style={{ backgroundColor: twitterFeedData?.styling?.cardBackground || 'white' }}
              >
                <h2 
                  className="text-xl font-semibold mb-4"
                  style={{ color: twitterFeedData?.styling?.titleColor || '#000000' }}
                >
                  {twitterFeedData?.config?.eventsTitle || ''}
                </h2>
                <ul className="space-y-3">
                  {(twitterFeedData?.events || []).slice(0, 4).map((event, index) => (
                    <li key={event.id} className="border-b border-gray-100 pb-3 last:border-b-0 flex items-start gap-3">
                      <span className="text-lg mt-1 flex-shrink-0">Note:</span>
                      <div>
                        <p 
                          className="text-sm"
                          style={{ color: twitterFeedData?.styling?.textColor || '#000000', opacity: 0.7 }}
                        >
                          {event.date}
                        </p>
                        <p 
                          className="font-medium"
                          style={{ color: twitterFeedData?.styling?.textColor || '#000000' }}
                        >
                          {event.title}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Social Media Section */}
              <div 
                className={`bg-${twitterFeedData?.styling?.cardBackground || 'white'} rounded-${twitterFeedData?.styling?.cardBorderRadius || 'lg'} shadow-${twitterFeedData?.styling?.cardShadow || 'md'} p-4 ${twitterFeedData?.styling?.cardBorder || ''}`}
                style={{ backgroundColor: twitterFeedData?.styling?.cardBackground || 'white' }}
              >
                <div className="mb-6">
                  <h2 
                    className="text-lg font-semibold mb-3 text-center"
                    style={{ color: twitterFeedData?.styling?.titleColor || '#000000' }}
                  >
                    {twitterFeedData?.config?.facebookTitle || ''}
                  </h2>
                  <div className="text-center p-4 border-2 border-dashed border-gray-300 rounded">
                    <FacebookIcon sx={{ fontSize: 40, color: '#1877f2', mb: 1 }} />
                    <p style={{ color: twitterFeedData?.styling?.textColor || '#000000', fontSize: '14px' }}>
                      Facebook Plugin Preview
                    </p>
                  </div>
                </div>

                <div>
                  <h2 
                    className="text-lg font-semibold mb-3 text-center"
                    style={{ color: twitterFeedData?.styling?.titleColor || '#000000' }}
                  >
                    {twitterFeedData?.config?.title || ''}
                  </h2>
                  <div className="text-center p-4 border-2 border-dashed border-gray-300 rounded">
                    <TwitterIcon sx={{ fontSize: 40, color: '#1da1f2', mb: 1 }} />
                    <p style={{ color: twitterFeedData?.styling?.textColor || '#000000', fontSize: '14px' }}>
                      Twitter Tweet Embed Preview
                    </p>
                    <p style={{ color: twitterFeedData?.styling?.textColor || '#000000', fontSize: '12px', opacity: 0.7 }}>
                      Tweet ID: {twitterFeedData?.socialMedia?.twitter?.tweetId || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        ) : (
          <div style={{ 
            backgroundColor: '#f7f8fa',
            border: '2px dashed #ccc',
            borderRadius: '8px',
            padding: '20px',
            minHeight: '400px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Typography variant="h6" color="text.secondary">
              Loading preview...
            </Typography>
          </div>
        )}
      </Paper>

      {/* Management Controls */}
      <Grid container spacing={3}>
        {/* Configuration Management */}
        <Grid item xs={12}>
          <Card>
            <CardHeader 
              title="Widget Configuration" 
              avatar={<SettingsIcon color="primary" />}
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="News Section Title"
                    value={twitterFeedData?.config?.newsTitle || ''}
                    onChange={(e) => setTwitterFeedData({
                      ...twitterFeedData,
                      config: { ...twitterFeedData?.config, newsTitle: e.target.value }
                    })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Events Section Title"
                    value={twitterFeedData?.config?.eventsTitle || ''}
                    onChange={(e) => setTwitterFeedData({
                      ...twitterFeedData,
                      config: { ...twitterFeedData?.config, eventsTitle: e.target.value }
                    })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Facebook Section Title"
                    value={twitterFeedData?.config?.facebookTitle || ''}
                    onChange={(e) => setTwitterFeedData({
                      ...twitterFeedData,
                      config: { ...twitterFeedData?.config, facebookTitle: e.target.value }
                    })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Twitter Section Title"
                    value={twitterFeedData?.config?.title || ''}
                    onChange={(e) => setTwitterFeedData({
                      ...twitterFeedData,
                      config: { ...twitterFeedData?.config, title: e.target.value }
                    })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="News URL (Production)"
                    value={twitterFeedData?.config?.newsUrl || ''}
                    onChange={(e) => setTwitterFeedData({
                      ...twitterFeedData,
                      config: { ...twitterFeedData?.config, newsUrl: e.target.value }
                    })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="News URL (Localhost)"
                    value={twitterFeedData?.config?.localhostNewsUrl || ''}
                    onChange={(e) => setTwitterFeedData({
                      ...twitterFeedData,
                      config: { ...twitterFeedData?.config, localhostNewsUrl: e.target.value }
                    })}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* News Management */}
        <Grid item xs={12}>
          <Card>
            <CardHeader 
              title="News Article" 
              avatar={<NewsIcon color="primary" />}
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Article Title"
                    value={twitterFeedData?.news?.title || ''}
                    onChange={(e) => setTwitterFeedData({
                      ...twitterFeedData,
                      news: { ...twitterFeedData?.news, title: e.target.value }
                    })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Article Date"
                    value={twitterFeedData?.news?.date || ''}
                    onChange={(e) => setTwitterFeedData({
                      ...twitterFeedData,
                      news: { ...twitterFeedData?.news, date: e.target.value }
                    })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Article Description"
                    multiline
                    rows={3}
                    value={twitterFeedData?.news?.description || ''}
                    onChange={(e) => setTwitterFeedData({
                      ...twitterFeedData,
                      news: { ...twitterFeedData?.news, description: e.target.value }
                    })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Image URL"
                    value={twitterFeedData?.news?.image || ''}
                    onChange={(e) => setTwitterFeedData({
                      ...twitterFeedData,
                      news: { ...twitterFeedData?.news, image: e.target.value }
                    })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Read More Text"
                    value={twitterFeedData?.news?.readMoreText || 'Read More'}
                    onChange={(e) => setTwitterFeedData({
                      ...twitterFeedData,
                      news: { ...twitterFeedData?.news, readMoreText: e.target.value }
                    })}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Events Management */}
        <Grid item xs={12}>
          <Card>
            <CardHeader 
              title="Upcoming Events" 
              avatar={<EventIcon color="primary" />}
              action={
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setIsEventDialogOpen(true)}
                >
                  Add Event
                </Button>
              }
            />
            <CardContent>
              <List>
                {(twitterFeedData?.events || []).map((event) => (
                  <ListItem key={event.id} divider>
                    <ListItemText
                      primary={event.title}
                      secondary={event.date}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => handleEditEvent(event)}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        onClick={() => handleDeleteEvent(event.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Social Media Management */}
        <Grid item xs={12}>
          <Card>
            <CardHeader 
              title="Social Media Configuration" 
              avatar={<TwitterIcon color="primary" />}
            />
            <CardContent>
              <Grid container spacing={3}>
                {/* Facebook Configuration */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    <FacebookIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Facebook
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={twitterFeedData?.socialMedia?.facebook?.enabled || false}
                        onChange={(e) => setTwitterFeedData({
                          ...twitterFeedData,
                          socialMedia: {
                            ...twitterFeedData?.socialMedia,
                            facebook: { ...twitterFeedData?.socialMedia?.facebook, enabled: e.target.checked }
                          }
                        })}
                      />
                    }
                    label="Enable Facebook Plugin"
                  />
                  <TextField
                    fullWidth
                    label="Facebook Page URL"
                    value={twitterFeedData?.socialMedia?.facebook?.pageUrl || ''}
                    onChange={(e) => setTwitterFeedData({
                      ...twitterFeedData,
                      socialMedia: {
                        ...twitterFeedData.socialMedia,
                        facebook: { ...twitterFeedData?.socialMedia?.facebook, pageUrl: e.target.value }
                      }
                    })}
                    sx={{ mt: 2 }}
                  />
                </Grid>

                {/* Twitter Configuration */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    <TwitterIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Twitter
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={twitterFeedData?.socialMedia?.twitter?.enabled || false}
                        onChange={(e) => setTwitterFeedData({
                          ...twitterFeedData,
                          socialMedia: {
                            ...twitterFeedData?.socialMedia,
                            twitter: { ...twitterFeedData?.socialMedia?.twitter, enabled: e.target.checked }
                          }
                        })}
                      />
                    }
                    label="Enable Twitter Embed"
                  />
                  <TextField
                    fullWidth
                    label="Tweet ID"
                    value={twitterFeedData?.socialMedia?.twitter?.tweetId || ''}
                    onChange={(e) => setTwitterFeedData({
                      ...twitterFeedData,
                      socialMedia: {
                        ...twitterFeedData.socialMedia,
                        twitter: { ...twitterFeedData?.socialMedia?.twitter, tweetId: e.target.value }
                      }
                    })}
                    sx={{ mt: 2 }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Styling Management */}
        <Grid item xs={12}>
          <Card>
            <CardHeader 
              title="Widget Styling" 
              avatar={<PaletteIcon color="primary" />}
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Card Background Color"
                    type="color"
                    value={twitterFeedData?.styling?.cardBackground || 'white'}
                    onChange={(e) => setTwitterFeedData({
                      ...twitterFeedData,
                      styling: { ...twitterFeedData?.styling, cardBackground: e.target.value }
                    })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Title Color"
                    type="color"
                    value={twitterFeedData?.styling?.titleColor || '#000000'}
                    onChange={(e) => setTwitterFeedData({
                      ...twitterFeedData,
                      styling: { ...twitterFeedData?.styling, titleColor: e.target.value }
                    })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Text Color"
                    type="color"
                    value={twitterFeedData?.styling?.textColor || '#000000'}
                    onChange={(e) => setTwitterFeedData({
                      ...twitterFeedData,
                      styling: { ...twitterFeedData?.styling, textColor: e.target.value }
                    })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Link Color"
                    type="color"
                    value={twitterFeedData?.styling?.linkColor || '#0000ff'}
                    onChange={(e) => setTwitterFeedData({
                      ...twitterFeedData,
                      styling: { ...twitterFeedData?.styling, linkColor: e.target.value }
                    })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Hover Color"
                    type="color"
                    value={twitterFeedData?.styling?.hoverColor || '#f0f0f0'}
                    onChange={(e) => setTwitterFeedData({
                      ...twitterFeedData,
                      styling: { ...twitterFeedData?.styling, hoverColor: e.target.value }
                    })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Container Max Width"
                    value={twitterFeedData?.styling?.containerMaxWidth || '6xl'}
                    onChange={(e) => setTwitterFeedData({
                      ...twitterFeedData,
                      styling: { ...twitterFeedData?.styling, containerMaxWidth: e.target.value }
                    })}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Save Button */}
        <Grid item xs={12}>
          <Box display="flex" justifyContent="center" mt={3}>
            <Button
              variant="contained"
              size="large"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={updateTwitterFeedMutation.isPending}
            >
              {updateTwitterFeedMutation.isPending ? 'Saving...' : 'Save All Changes'}
            </Button>
          </Box>
        </Grid>
      </Grid>

      {/* Event Dialog */}
      <Dialog open={isEventDialogOpen} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingEvent ? 'Edit Event' : 'Add New Event'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Event Date"
            value={newEvent.date}
            onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
            sx={{ mt: 2 }}
            placeholder="e.g., 18–20 Sept 2025"
          />
          <TextField
            fullWidth
            label="Event Title"
            value={newEvent.title}
            onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
            sx={{ mt: 2 }}
            placeholder="e.g., Baringo Branch Show"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button
            onClick={editingEvent ? handleUpdateEvent : handleAddEvent}
            variant="contained"
            disabled={!newEvent.date || !newEvent.title}
          >
            {editingEvent ? 'Update' : 'Add'} Event
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for messages */}
      <Snackbar
        open={!!message}
        autoHideDuration={6000}
        onClose={() => setMessage(null)}
      >
        <Alert
          onClose={() => setMessage(null)}
          severity={message?.type || 'success'}
          sx={{ width: '100%' }}
        >
          {message?.text}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TwitterFeedEditor;
