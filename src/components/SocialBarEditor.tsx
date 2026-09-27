import React, { useState, useEffect, useCallback } from 'react';
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
  Snackbar,
  Alert,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  IconButton,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Divider,
  CircularProgress,
  Fab,
  Tooltip,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  FormControlLabel,
  Slider,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  DragIndicator as DragIcon,
  Facebook as FacebookIcon,
  LinkedIn as LinkedInIcon,
  Twitter as TwitterIcon,
  Instagram as InstagramIcon,
  WhatsApp as WhatsAppIcon,
  YouTube as YouTubeIcon,
  Telegram as TelegramIcon,
  GitHub as GitHubIcon,
  Reddit as RedditIcon,
  Pinterest as PinterestIcon,
  Share as ShareIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE = `${process.env.REACT_APP_API_BASE || 'http://localhost:5001'}/api`;

interface SocialMediaLink {
  id: string;
  platform: string;
  name: string;
  url: string;
  icon: string;
  color: string;
  isActive: boolean;
  order: number;
}

interface SocialBarConfig {
  position: 'left' | 'right';
  isActive: boolean;
  showLabels: boolean;
  animation: 'slide' | 'fade' | 'none';
  spacing: 'small' | 'medium' | 'large';
}

interface SocialBarData {
  id: string;
  config: SocialBarConfig;
  socials: SocialMediaLink[];
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

const PLATFORM_OPTIONS = [
  { value: 'facebook', label: 'Facebook', icon: 'FaFacebookF', color: '#1877F2' },
  { value: 'linkedin', label: 'LinkedIn', icon: 'FaLinkedinIn', color: '#0077B5' },
  { value: 'twitter', label: 'Twitter', icon: 'FaTwitter', color: '#1DA1F2' },
  { value: 'instagram', label: 'Instagram', icon: 'FaInstagram', color: '#E4405F' },
  { value: 'whatsapp', label: 'WhatsApp', icon: 'FaWhatsapp', color: '#25D366' },
  { value: 'youtube', label: 'YouTube', icon: 'FaYoutube', color: '#FF0000' },
  { value: 'telegram', label: 'Telegram', icon: 'FaTelegram', color: '#0088CC' },
  { value: 'github', label: 'GitHub', icon: 'FaGithub', color: '#333333' },
  { value: 'reddit', label: 'Reddit', icon: 'FaReddit', color: '#FF4500' },
  { value: 'pinterest', label: 'Pinterest', icon: 'FaPinterest', color: '#BD081C' }
];

const getPlatformIcon = (platform: string) => {
  switch (platform) {
    case 'facebook': return <FacebookIcon />;
    case 'linkedin': return <LinkedInIcon />;
    case 'twitter': return <TwitterIcon />;
    case 'instagram': return <InstagramIcon />;
    case 'whatsapp': return <WhatsAppIcon />;
    case 'youtube': return <YouTubeIcon />;
    case 'telegram': return <TelegramIcon />;
    case 'github': return <GitHubIcon />;
    case 'reddit': return <RedditIcon />;
    case 'pinterest': return <PinterestIcon />;
    default: return <ShareIcon />;
  }
};

const SocialBarEditor: React.FC = () => {
  const [socialBarData, setSocialBarData] = useState<SocialBarData | null>(null);
  const [editingSocial, setEditingSocial] = useState<SocialMediaLink | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const queryClient = useQueryClient();

  // Fetch social bar data
  const { data, isLoading, error } = useQuery({
    queryKey: ['social-bar'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/social-bar`);
      return response.data;
    }
  });

  // Update social bar data
  const updateSocialBarMutation = useMutation({
    mutationFn: async (data: Partial<SocialBarData>) => {
      const response = await axios.post(`${API_BASE}/social-bar`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-bar'] });
      setSnackbar({ open: true, message: 'Social Bar updated successfully', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to update Social Bar', severity: 'error' });
    }
  });

  // Add social media link
  const addSocialMutation = useMutation({
    mutationFn: async (social: Omit<SocialMediaLink, 'id' | 'order'>) => {
      const response = await axios.post(`${API_BASE}/social-bar/socials`, social);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-bar'] });
      setSnackbar({ open: true, message: 'Social media link added successfully', severity: 'success' });
      setIsAddDialogOpen(false);
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to add social media link', severity: 'error' });
    }
  });

  // Update social media link
  const updateSocialMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SocialMediaLink> & { id: string }) => {
      const response = await axios.put(`${API_BASE}/social-bar/socials/${id}`, updates);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-bar'] });
      setSnackbar({ open: true, message: 'Social media link updated successfully', severity: 'success' });
      setIsEditDialogOpen(false);
      setEditingSocial(null);
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to update social media link', severity: 'error' });
    }
  });

  // Delete social media link
  const deleteSocialMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.delete(`${API_BASE}/social-bar/socials/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-bar'] });
      setSnackbar({ open: true, message: 'Social media link deleted successfully', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to delete social media link', severity: 'error' });
    }
  });

  // Reset to default
  const resetSocialBarMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.delete(`${API_BASE}/social-bar`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-bar'] });
      setSnackbar({ open: true, message: 'Social Bar reset to default successfully', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to reset Social Bar', severity: 'error' });
    }
  });

  useEffect(() => {
    if (data) {
      setSocialBarData(data);
    }
  }, [data]);

  const handleConfigChange = useCallback((field: keyof SocialBarConfig, value: any) => {
    if (socialBarData) {
      const updatedConfig = { ...socialBarData.config, [field]: value };
      updateSocialBarMutation.mutate({ config: updatedConfig });
    }
  }, [socialBarData, updateSocialBarMutation]);

  const handleAddSocial = () => {
    setEditingSocial({
      id: '',
      platform: 'facebook',
      name: '',
      url: '',
      icon: 'FaFacebookF',
      color: '#1877F2',
      isActive: true,
      order: 0
    });
    setIsAddDialogOpen(true);
  };

  const handleEditSocial = (social: SocialMediaLink) => {
    setEditingSocial({ ...social });
    setIsEditDialogOpen(true);
  };

  const handleSaveSocial = () => {
    if (!editingSocial) return;

    if (editingSocial.id) {
      // Update existing
      updateSocialMutation.mutate(editingSocial);
    } else {
      // Add new
      addSocialMutation.mutate(editingSocial);
    }
  };

  const handleDeleteSocial = (id: string) => {
    if (window.confirm('Are you sure you want to delete this social media link?')) {
      deleteSocialMutation.mutate(id);
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset the Social Bar to default settings?')) {
      resetSocialBarMutation.mutate();
    }
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
        <Alert severity="error">Failed to load social bar data. Please try again later.</Alert>
      </Box>
    );
  }

  if (!socialBarData) {
    return (
      <Box p={3}>
        <Alert severity="warning">No social bar data available.</Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Social Bar Management
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<VisibilityIcon />}
            onClick={() => setIsPreviewOpen(true)}
            sx={{ mr: 1 }}
          >
            Preview
          </Button>
          <Button
            variant="outlined"
            color="warning"
            onClick={handleReset}
            disabled={resetSocialBarMutation.isPending}
          >
            Reset to Default
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Configuration */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Configuration" />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Position</InputLabel>
                    <Select
                      value={socialBarData.config.position}
                      onChange={(e) => handleConfigChange('position', e.target.value)}
                    >
                      <MenuItem value="left">Left</MenuItem>
                      <MenuItem value="right">Right</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Animation</InputLabel>
                    <Select
                      value={socialBarData.config.animation}
                      onChange={(e) => handleConfigChange('animation', e.target.value)}
                    >
                      <MenuItem value="slide">Slide</MenuItem>
                      <MenuItem value="fade">Fade</MenuItem>
                      <MenuItem value="none">None</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Spacing</InputLabel>
                    <Select
                      value={socialBarData.config.spacing}
                      onChange={(e) => handleConfigChange('spacing', e.target.value)}
                    >
                      <MenuItem value="small">Small</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="large">Large</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={socialBarData.config.isActive}
                        onChange={(e) => handleConfigChange('isActive', e.target.checked)}
                      />
                    }
                    label="Enable Social Bar"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={socialBarData.config.showLabels}
                        onChange={(e) => handleConfigChange('showLabels', e.target.checked)}
                      />
                    }
                    label="Show Labels"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Social Media Links */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title="Social Media Links" 
              action={
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddSocial}
                >
                  Add Link
                </Button>
              }
            />
            <CardContent>
              <List>
                {socialBarData.socials
                  .sort((a, b) => a.order - b.order)
                  .map((social) => (
                    <ListItem key={social.id} divider>
                      <Box display="flex" alignItems="center" mr={2}>
                        {getPlatformIcon(social.platform)}
                      </Box>
                      <ListItemText
                        primary={social.name}
                        secondary={social.url}
                      />
                      <Chip
                        label={social.isActive ? 'Active' : 'Inactive'}
                        color={social.isActive ? 'success' : 'default'}
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => handleEditSocial(social)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          edge="end"
                          onClick={() => handleDeleteSocial(social.id)}
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
      </Grid>

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen || isEditDialogOpen} onClose={() => {
        setIsAddDialogOpen(false);
        setIsEditDialogOpen(false);
        setEditingSocial(null);
      }} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingSocial?.id ? 'Edit Social Media Link' : 'Add Social Media Link'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Platform</InputLabel>
                <Select
                  value={editingSocial?.platform || ''}
                  onChange={(e) => {
                    const platform = e.target.value;
                    const platformData = PLATFORM_OPTIONS.find(p => p.value === platform);
                    if (editingSocial && platformData) {
                      setEditingSocial({
                        ...editingSocial,
                        platform,
                        name: platformData.label,
                        icon: platformData.icon,
                        color: platformData.color
                      });
                    }
                  }}
                >
                  {PLATFORM_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box display="flex" alignItems="center">
                        {getPlatformIcon(option.value)}
                        <Typography sx={{ ml: 1 }}>{option.label}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                value={editingSocial?.name || ''}
                onChange={(e) => editingSocial && setEditingSocial({ ...editingSocial, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="URL"
                value={editingSocial?.url || ''}
                onChange={(e) => editingSocial && setEditingSocial({ ...editingSocial, url: e.target.value })}
                placeholder="https://example.com"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Color"
                value={editingSocial?.color || ''}
                onChange={(e) => editingSocial && setEditingSocial({ ...editingSocial, color: e.target.value })}
                InputProps={{
                  startAdornment: <InputAdornment position="start">#</InputAdornment>
                }}
                placeholder="1877F2"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={editingSocial?.isActive || false}
                    onChange={(e) => editingSocial && setEditingSocial({ ...editingSocial, isActive: e.target.checked })}
                  />
                }
                label="Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setIsAddDialogOpen(false);
            setIsEditDialogOpen(false);
            setEditingSocial(null);
          }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveSocial}
            disabled={addSocialMutation.isPending || updateSocialMutation.isPending}
          >
            {editingSocial?.id ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Social Bar Preview</DialogTitle>
        <DialogContent>
          <Box
            sx={{
              minHeight: '400px',
              position: 'relative',
              border: '1px solid #e5e7eb',
              borderRadius: 1,
              p: 2
            }}
          >
            <Typography variant="h6" gutterBottom>
              Preview (Position: {socialBarData.config.position})
            </Typography>
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                [socialBarData.config.position]: 16,
                transform: 'translateY(-50%)',
                display: 'flex',
                flexDirection: 'column',
                gap: socialBarData.config.spacing === 'small' ? 1 : socialBarData.config.spacing === 'large' ? 3 : 2,
                zIndex: 50
              }}
            >
              {socialBarData.socials
                .filter(social => social.isActive)
                .sort((a, b) => a.order - b.order)
                .map((social) => (
                  <Tooltip key={social.id} title={social.name} placement={socialBarData.config.position === 'right' ? 'left' : 'right'}>
                    <IconButton
                      sx={{
                        p: 2,
                        borderRadius: '50%',
                        backgroundColor: 'transparent',
                        color: social.color,
                        '&:hover': {
                          backgroundColor: social.color,
                          color: 'white'
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {getPlatformIcon(social.platform)}
                    </IconButton>
                  </Tooltip>
                ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SocialBarEditor;
