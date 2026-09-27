import React, { useState, useEffect } from 'react';
const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5001';

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
  CircularProgress,
  Alert,
  Chip,
  Avatar,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PhotoCamera as PhotoCameraIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import {
  getTeamMembers,
  createOrUpdateTeamMember,
  updateTeamMember,
  deleteTeamMember,
  uploadTeamMemberImage,
  TeamMember
} from '../utils/teamApi';

const TeamManagement = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [uploadingImage, setUploadingImage] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    position: '',
    bio: '',
    order_index: 0,
    is_active: true
  });

  useEffect(() => {
    loadTeamMembers();
  }, []);

  const loadTeamMembers = async () => {
    try {
      setLoading(true);
      const members = await getTeamMembers();
      setTeamMembers(members);
    } catch (err) {
      setError('Failed to load team members');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (member?: TeamMember) => {
    if (member) {
      setEditingMember(member);
      setFormData({
        name: member.name,
        position: member.position,
        bio: member.bio,
        order_index: member.order_index || 0,
        is_active: member.is_active !== false
      });
    } else {
      setEditingMember(null);
      setFormData({
        name: '',
        position: '',
        bio: '',
        order_index: 0,
        is_active: true
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingMember(null);
    setFormData({
      name: '',
      position: '',
      bio: '',
      order_index: 0,
      is_active: true
    });
  };

  const handleSave = async () => {
    try {
      if (editingMember) {
        await updateTeamMember(editingMember.id!, formData);
        setSuccess('Team member updated successfully');
      } else {
        await createOrUpdateTeamMember(formData);
        setSuccess('Team member created successfully');
      }
      await loadTeamMembers();
      handleCloseDialog();
    } catch (err) {
      setError('Failed to save team member');
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this team member?')) {
      try {
        await deleteTeamMember(id);
        setSuccess('Team member deleted successfully');
        await loadTeamMembers();
      } catch (err) {
        setError('Failed to delete team member');
        console.error(err);
      }
    }
  };

  const handleImageUpload = async (memberId: number, file: File) => {
    try {
      setUploadingImage(memberId);
      const result = await uploadTeamMemberImage(memberId, file);
      
      // Update the member's image URL in the local state
      setTeamMembers(prev => 
        prev.map(member => 
          member.id === memberId 
            ? { ...member, image: result.imageUrl }
            : member
        )
      );
      
      setSuccess('Image uploaded successfully');
    } catch (err) {
      setError('Failed to upload image');
      console.error(err);
    } finally {
      setUploadingImage(null);
    }
  };

  const resolveImageUrl = (imagePath: string | null | undefined) => {
    if (!imagePath) {
      return '/images/placeholder-400x300.jpg'; // Default placeholder
    }
    if (imagePath.startsWith(`${API_BASE}/api/team-members/`)) {
      return imagePath; // Already a direct API image URL
    }
    if (imagePath.startsWith('http')) {
      return imagePath; // External URL
    }
    if (imagePath.startsWith('/images/')) {
      return `${API_BASE}${imagePath}`; // Old path-based image
    }
    return imagePath; // Fallback for other cases
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Team Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Team Member
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {teamMembers.map((member) => (
          <Grid item xs={12} sm={6} md={4} key={member.id}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Avatar
                    src={resolveImageUrl(member.image)}
                    alt={member.name}
                    sx={{ width: 60, height: 60, mr: 2 }}
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      target.src = '/images/placeholder.svg';
                    }}
                  >
                    <PersonIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" component="h3">
                      {member.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {member.position}
                    </Typography>
                    <Chip
                      label={member.is_active ? 'Active' : 'Inactive'}
                      color={member.is_active ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {member.bio.length > 100 ? `${member.bio.substring(0, 100)}...` : member.bio}
                </Typography>

                <Box display="flex" alignItems="center" gap={1}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && member.id) {
                        handleImageUpload(member.id, file);
                      }
                    }}
                    style={{ display: 'none' }}
                    id={`upload-${member.id}`}
                  />
                  <label htmlFor={`upload-${member.id}`}>
                    <Button
                      variant="outlined"
                      size="small"
                      component="span"
                      disabled={uploadingImage === member.id}
                      startIcon={uploadingImage === member.id ? <CircularProgress size={16} /> : <PhotoCameraIcon />}
                    >
                      {uploadingImage === member.id ? 'Uploading...' : 'Upload Image'}
                    </Button>
                  </label>
                </Box>
              </CardContent>
              
              <CardActions>
                <Button
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => handleOpenDialog(member)}
                >
                  Edit
                </Button>
                <Button
                  size="small"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => member.id && handleDelete(member.id)}
                >
                  Delete
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingMember ? 'Edit Team Member' : 'Add Team Member'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Position"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                multiline
                rows={4}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Order Index"
                type="number"
                value={formData.order_index}
                onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                }
                label="Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {editingMember ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeamManagement;
