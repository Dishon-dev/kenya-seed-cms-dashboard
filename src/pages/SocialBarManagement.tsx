import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
  Chip,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  Facebook as FacebookIcon,
  LinkedIn as LinkedInIcon,
  Twitter as TwitterIcon,
  Instagram as InstagramIcon,
  WhatsApp as WhatsAppIcon,
} from '@mui/icons-material';
import { 
  getSocialBar, 
  createOrUpdateSocialBar, 
  addSocialLink,
  updateSocialLink,
  deleteSocialLink,
  SocialBar,
  SocialLink 
} from '../utils/socialBarApi';

const SocialBarManagement: React.FC = () => {
  const [socialBar, setSocialBar] = useState<SocialBar | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openSocialDialog, setOpenSocialDialog] = useState(false);
  const [editingSocial, setEditingSocial] = useState<SocialLink | null>(null);
  const [editingConfig, setEditingConfig] = useState(false);

  // Load social bar from database
  useEffect(() => {
    let isMounted = true;
    
    const loadSocialBar = async () => {
      try {
        setLoading(true);
        const data = await getSocialBar();
        if (isMounted) {
          setSocialBar(data);
        }
      } catch (err) {
        console.error('Error loading social bar:', err);
        if (isMounted) {
          setError('Failed to load social bar');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadSocialBar();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenEditDialog = () => {
    setEditingConfig(true);
    setOpenEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setEditingConfig(false);
  };

  const handleOpenSocialDialog = (social?: SocialLink) => {
    if (social) {
      setEditingSocial(social);
    } else {
      setEditingSocial({
        id: '',
        name: '',
        url: '',
        icon: 'FaFacebookF',
        color: '#1877F2',
        hoverColor: '#166FE5',
        order: 1,
        isActive: true
      });
    }
    setOpenSocialDialog(true);
  };

  const handleCloseSocialDialog = () => {
    setOpenSocialDialog(false);
    setEditingSocial(null);
  };

  const handleSaveConfig = async () => {
    if (socialBar) {
      try {
        const updatedSocialBar = await createOrUpdateSocialBar(socialBar);
        setSocialBar(updatedSocialBar);
        alert('Social bar configuration saved successfully!');
        handleCloseEditDialog();
      } catch (error) {
        console.error('Error saving social bar:', error);
        alert('Error saving social bar. Please try again.');
      }
    }
  };

  const handleSaveSocial = async () => {
    if (editingSocial) {
      try {
        let updatedSocialBar;
        if (editingSocial.id === '') {
          // Add new social link
          updatedSocialBar = await addSocialLink(editingSocial);
        } else {
          // Update existing social link
          updatedSocialBar = await updateSocialLink(editingSocial.id, editingSocial);
        }
        setSocialBar(updatedSocialBar);
        alert('Social link saved successfully!');
        handleCloseSocialDialog();
      } catch (error) {
        console.error('Error saving social link:', error);
        alert('Error saving social link. Please try again.');
      }
    }
  };

  const handleDeleteSocial = async (socialId: string) => {
    if (window.confirm('Are you sure you want to delete this social link?')) {
      try {
        const updatedSocialBar = await deleteSocialLink(socialId);
        setSocialBar(updatedSocialBar);
        alert('Social link deleted successfully!');
      } catch (error) {
        console.error('Error deleting social link:', error);
        alert('Error deleting social link. Please try again.');
      }
    }
  };

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'FaFacebookF':
        return <FacebookIcon />;
      case 'FaLinkedinIn':
        return <LinkedInIcon />;
      case 'FaTwitter':
        return <TwitterIcon />;
      case 'FaInstagram':
        return <InstagramIcon />;
      case 'FaWhatsapp':
        return <WhatsAppIcon />;
      default:
        return <FacebookIcon />;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
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
            startIcon={<EditIcon />}
            onClick={handleOpenEditDialog}
            sx={{ mr: 2 }}
          >
            Edit Configuration
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenSocialDialog()}
          >
            Add Social Link
          </Button>
        </Box>
      </Box>

      {/* Configuration Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Configuration
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Title: {socialBar?.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Description: {socialBar?.description}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Position: {socialBar?.config?.position} - {socialBar?.config?.location}
          </Typography>
        </CardContent>
      </Card>

      {/* Social Links */}
      <Typography variant="h6" gutterBottom>
        Social Links ({socialBar?.socials?.length || 0})
      </Typography>
      <Grid container spacing={3}>
        {socialBar?.socials?.map((social) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={social.id}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  {getIconComponent(social.icon)}
                  <Typography variant="h6" sx={{ ml: 1 }}>
                    {social.name}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {social.url}
                </Typography>
                <Box mt={1} display="flex" gap={1}>
                  <Chip 
                    label={`Order: ${social.order}`} 
                    size="small" 
                    color="primary" 
                  />
                  <Chip 
                    label={social.isActive ? 'Active' : 'Inactive'} 
                    size="small" 
                    color={social.isActive ? 'success' : 'default'} 
                  />
                </Box>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => handleOpenSocialDialog(social)}
                >
                  Edit
                </Button>
                <Button
                  size="small"
                  startIcon={<DeleteIcon />}
                  color="error"
                  onClick={() => handleDeleteSocial(social.id)}
                >
                  Delete
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Configuration Edit Dialog */}
      <Dialog open={openEditDialog} onClose={handleCloseEditDialog} maxWidth="md" fullWidth>
        <DialogTitle>Edit Social Bar Configuration</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Title"
              value={socialBar?.title || ''}
              onChange={(e) => setSocialBar(prev => prev ? { ...prev, title: e.target.value } : null)}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={socialBar?.description || ''}
              onChange={(e) => setSocialBar(prev => prev ? { ...prev, description: e.target.value } : null)}
              margin="normal"
            />
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Position</InputLabel>
                  <Select
                    value={socialBar?.config?.position || 'fixed'}
                    onChange={(e) => setSocialBar(prev => prev ? { 
                      ...prev, 
                      config: { ...prev.config, position: e.target.value }
                    } : null)}
                  >
                    <MenuItem value="fixed">Fixed</MenuItem>
                    <MenuItem value="absolute">Absolute</MenuItem>
                    <MenuItem value="relative">Relative</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Location</InputLabel>
                  <Select
                    value={socialBar?.config?.location || 'right'}
                    onChange={(e) => setSocialBar(prev => prev ? { 
                      ...prev, 
                      config: { ...prev.config, location: e.target.value }
                    } : null)}
                  >
                    <MenuItem value="right">Right</MenuItem>
                    <MenuItem value="left">Left</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Cancel</Button>
          <Button onClick={handleSaveConfig} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Social Link Edit Dialog */}
      <Dialog open={openSocialDialog} onClose={handleCloseSocialDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingSocial?.id === '' ? 'Add Social Link' : 'Edit Social Link'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Name"
              value={editingSocial?.name || ''}
              onChange={(e) => setEditingSocial(prev => prev ? { ...prev, name: e.target.value } : null)}
              margin="normal"
            />
            <TextField
              fullWidth
              label="URL"
              value={editingSocial?.url || ''}
              onChange={(e) => setEditingSocial(prev => prev ? { ...prev, url: e.target.value } : null)}
              margin="normal"
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Icon</InputLabel>
              <Select
                value={editingSocial?.icon || 'FaFacebookF'}
                onChange={(e) => setEditingSocial(prev => prev ? { ...prev, icon: e.target.value } : null)}
              >
                <MenuItem value="FaFacebookF">Facebook</MenuItem>
                <MenuItem value="FaLinkedinIn">LinkedIn</MenuItem>
                <MenuItem value="FaTwitter">Twitter</MenuItem>
                <MenuItem value="FaInstagram">Instagram</MenuItem>
                <MenuItem value="FaWhatsapp">WhatsApp</MenuItem>
              </Select>
            </FormControl>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Color"
                  value={editingSocial?.color || ''}
                  onChange={(e) => setEditingSocial(prev => prev ? { ...prev, color: e.target.value } : null)}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Hover Color"
                  value={editingSocial?.hoverColor || ''}
                  onChange={(e) => setEditingSocial(prev => prev ? { ...prev, hoverColor: e.target.value } : null)}
                  margin="normal"
                />
              </Grid>
            </Grid>
            <TextField
              fullWidth
              label="Order"
              type="number"
              value={editingSocial?.order || 1}
              onChange={(e) => setEditingSocial(prev => prev ? { ...prev, order: parseInt(e.target.value) || 1 } : null)}
              margin="normal"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={editingSocial?.isActive || false}
                  onChange={(e) => setEditingSocial(prev => prev ? { ...prev, isActive: e.target.checked } : null)}
                />
              }
              label="Active"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSocialDialog}>Cancel</Button>
          <Button onClick={handleSaveSocial} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SocialBarManagement;
