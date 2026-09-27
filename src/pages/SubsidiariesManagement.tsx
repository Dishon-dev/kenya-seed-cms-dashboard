import React, { useState, useEffect } from 'react';
const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5001';

import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Grid,
  Avatar
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  Remove as RemoveIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { 
  getSubsidiaries, 
  createOrUpdateSubsidiaries, 
  updateSubsidiaries, 
  deleteSubsidiaries,
  uploadSubsidiaryMemberImage,
  SubsidiariesData,
  SubsidiaryMember 
} from '../utils/subsidiariesApi';

const SubsidiariesManagement: React.FC = () => {
  const [subsidiariesData, setSubsidiariesData] = useState<SubsidiariesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingSubsidiaries, setEditingSubsidiaries] = useState<Partial<SubsidiariesData>>({});
  const [newMember, setNewMember] = useState<Partial<SubsidiaryMember>>({ 
    name: '', 
    position: '', 
    image: '', 
    bio: '', 
    order: 0, 
    isActive: true 
  });
  const [activeModal, setActiveModal] = useState<number | null>(null);
  const [uploadingImage, setUploadingImage] = useState<number | null>(null);

  useEffect(() => {
    loadSubsidiaries();
  }, []);

  const loadSubsidiaries = async () => {
    try {
      setLoading(true);
      const data = await getSubsidiaries();
      setSubsidiariesData(data);
    } catch (err) {
      console.error('Error loading subsidiaries:', err);
      setError('Failed to load subsidiaries data');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (subsidiariesData) {
      setEditingSubsidiaries(subsidiariesData);
      setEditDialogOpen(true);
    }
  };

  const handleSave = async () => {
    try {
      if (subsidiariesData?.id) {
        await updateSubsidiaries(subsidiariesData.id, editingSubsidiaries);
      } else {
        await createOrUpdateSubsidiaries(editingSubsidiaries);
      }
      setEditDialogOpen(false);
      await loadSubsidiaries();
    } catch (err) {
      console.error('Error saving subsidiaries:', err);
      setError('Failed to save subsidiaries');
    }
  };

  const handleDelete = async () => {
    if (subsidiariesData?.id && window.confirm('Are you sure you want to delete this subsidiaries data?')) {
      try {
        await deleteSubsidiaries(subsidiariesData.id);
        await loadSubsidiaries();
      } catch (err) {
        console.error('Error deleting subsidiaries:', err);
        setError('Failed to delete subsidiaries');
      }
    }
  };

  const addMember = () => {
    if (newMember.name && newMember.position) {
      setEditingSubsidiaries({
        ...editingSubsidiaries,
        members: [...(editingSubsidiaries.members || []), { ...newMember } as SubsidiaryMember]
      });
      setNewMember({ name: '', position: '', image: '', bio: '', order: 0, isActive: true });
    }
  };

  const removeMember = (index: number) => {
    const updatedMembers = [...(editingSubsidiaries.members || [])];
    updatedMembers.splice(index, 1);
    setEditingSubsidiaries({
      ...editingSubsidiaries,
      members: updatedMembers
    });
  };

  const updateMember = (index: number, field: keyof SubsidiaryMember, value: string | boolean | number) => {
    const updatedMembers = [...(editingSubsidiaries.members || [])];
    updatedMembers[index] = { ...updatedMembers[index], [field]: value };
    setEditingSubsidiaries({
      ...editingSubsidiaries,
      members: updatedMembers
    });
  };

  const handleImageUpload = async (memberId: number, file: File) => {
    try {
      setUploadingImage(memberId);
      const result = await uploadSubsidiaryMemberImage(memberId, file);
      
      // Update the member's image URL in the editing state
      const updatedMembers = editingSubsidiaries.members?.map(member => 
        parseInt(member.id || '0') === memberId 
          ? { ...member, image: result.imageUrl }
          : member
      );
      
      setEditingSubsidiaries({
        ...editingSubsidiaries,
        members: updatedMembers
      });
      
      // Reload subsidiaries data to get updated image
      await loadSubsidiaries();
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Failed to upload image');
    } finally {
      setUploadingImage(null);
    }
  };

  const openModal = (index: number) => setActiveModal(index);
  const closeModal = () => setActiveModal(null);

  const resolveMemberImage = (image?: string) => {
    if (!image) return '/images/subsidiaries/placeholder.svg';
    if (image.startsWith('http')) return image;
    if (image.startsWith('/api/')) return `${API_BASE}${image}`;
    if (image.startsWith('/images/')) return `${API_BASE}${image}`;
    return image;
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
      <Typography variant="h4" gutterBottom>
        Subsidiaries Management
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Manage the subsidiaries page content including hero section, section headers, and subsidiary member profiles.
      </Typography>

      {subsidiariesData ? (
        <Card sx={{ maxWidth: 1000 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h5" component="h2">
                Subsidiaries Page
              </Typography>
              <Chip 
                label={subsidiariesData.isActive ? 'Active' : 'Inactive'} 
                color={subsidiariesData.isActive ? 'success' : 'default'} 
              />
            </Box>
            
            <Box mb={2}>
              <Typography variant="subtitle2" gutterBottom>
                Hero Section:
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                <strong>Title:</strong> {subsidiariesData.hero.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                <strong>Subtitle:</strong> {subsidiariesData.hero.subtitle}
              </Typography>
            </Box>

            <Box mb={2}>
              <Typography variant="subtitle2" gutterBottom>
                Section Headers:
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                <strong>Title:</strong> {subsidiariesData.section.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                <strong>Subtitle:</strong> {subsidiariesData.section.subtitle}
              </Typography>
            </Box>

            <Box mb={2}>
              <Typography variant="subtitle2" gutterBottom>
                Members ({subsidiariesData.members.length}):
              </Typography>
              <Grid container spacing={2}>
                {subsidiariesData.members.map((member, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card sx={{ height: '100%' }}>
                      <Box
                        sx={{
                          height: 200,
                          backgroundImage: `url(${resolveMemberImage(member.image)})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          backgroundRepeat: 'no-repeat'
                        }}
                      />
                      <CardContent>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {member.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {member.position}
                        </Typography>
                        <Chip
                          label={member.isActive ? 'Active' : 'Inactive'}
                          color={member.isActive ? 'success' : 'default'}
                          size="small"
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>

            <Box mb={2}>
              <Typography variant="subtitle2" gutterBottom>
                Last Updated:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {subsidiariesData.updatedAt ? new Date(subsidiariesData.updatedAt).toLocaleString() : 'Unknown'}
              </Typography>
            </Box>
          </CardContent>
          
          <CardActions>
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={handleEdit}
            >
              Edit
            </Button>
            
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDelete}
            >
              Delete
            </Button>
          </CardActions>
        </Card>
      ) : (
        <Card sx={{ maxWidth: 1000 }}>
          <CardContent>
            <Typography variant="h6" color="text.secondary">
              No subsidiaries data found
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Create subsidiaries data to get started.
            </Typography>
          </CardContent>
          <CardActions>
            <Button
              variant="contained"
              onClick={() => {
                setEditingSubsidiaries({
                  hero: { title: '', subtitle: '' },
                  section: { title: '', subtitle: '' },
                  members: []
                });
                setEditDialogOpen(true);
              }}
            >
              Create Subsidiaries Data
            </Button>
          </CardActions>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          {subsidiariesData?.id ? 'Edit Subsidiaries' : 'Create Subsidiaries'}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            {/* Hero Section */}
            <Typography variant="h6">Hero Section</Typography>
            <TextField
              label="Hero Title"
              value={editingSubsidiaries.hero?.title || ''}
              onChange={(e) => setEditingSubsidiaries({ 
                ...editingSubsidiaries, 
                hero: { ...editingSubsidiaries.hero!, title: e.target.value }
              })}
              fullWidth
              required
            />
            <TextField
              label="Hero Subtitle"
              value={editingSubsidiaries.hero?.subtitle || ''}
              onChange={(e) => setEditingSubsidiaries({ 
                ...editingSubsidiaries, 
                hero: { ...editingSubsidiaries.hero!, subtitle: e.target.value }
              })}
              fullWidth
              multiline
              rows={2}
              required
            />

            {/* Section Headers */}
            <Typography variant="h6" sx={{ mt: 2 }}>Section Headers</Typography>
            <TextField
              label="Section Title"
              value={editingSubsidiaries.section?.title || ''}
              onChange={(e) => setEditingSubsidiaries({ 
                ...editingSubsidiaries, 
                section: { ...editingSubsidiaries.section!, title: e.target.value }
              })}
              fullWidth
            />
            <TextField
              label="Section Subtitle"
              value={editingSubsidiaries.section?.subtitle || ''}
              onChange={(e) => setEditingSubsidiaries({ 
                ...editingSubsidiaries, 
                section: { ...editingSubsidiaries.section!, subtitle: e.target.value }
              })}
              fullWidth
              multiline
              rows={2}
            />

            {/* Members Section */}
            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
              <Typography variant="h6">Subsidiary Members</Typography>
            </Box>

            {/* Add New Member */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">Add New Member</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Name"
                      value={newMember.name}
                      onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Position"
                      value={newMember.position}
                      onChange={(e) => setNewMember({ ...newMember, position: e.target.value })}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Image URL"
                      value={newMember.image}
                      onChange={(e) => setNewMember({ ...newMember, image: e.target.value })}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Bio"
                      value={newMember.bio}
                      onChange={(e) => setNewMember({ ...newMember, bio: e.target.value })}
                      fullWidth
                      multiline
                      rows={3}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Order"
                      type="number"
                      value={newMember.order}
                      onChange={(e) => setNewMember({ ...newMember, order: parseInt(e.target.value) || 0 })}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={newMember.isActive}
                          onChange={(e) => setNewMember({ ...newMember, isActive: e.target.checked })}
                        />
                      }
                      label="Active"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button onClick={addMember} startIcon={<AddIcon />} variant="outlined">
                      Add Member
                    </Button>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* Existing Members */}
            <Typography variant="h6">Existing Members</Typography>
            {editingSubsidiaries.members?.map((member, index) => (
              <Box key={index} sx={{ p: 2, border: '1px solid #e5e7eb', borderRadius: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">Member {index + 1}</Typography>
                  <IconButton size="small" onClick={() => removeMember(index)}>
                    <RemoveIcon />
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
                      label="Image URL"
                      value={member.image}
                      onChange={(e) => updateMember(index, 'image', e.target.value)}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file && member.id) {
                            handleImageUpload(parseInt(member.id), file);
                          }
                        }}
                        style={{ display: 'none' }}
                        id={`upload-member-${index}`}
                      />
                      <label htmlFor={`upload-member-${index}`}>
                        <Button
                          variant="outlined"
                          component="span"
                          size="small"
                          disabled={uploadingImage === parseInt(member.id || '0')}
                          startIcon={uploadingImage === parseInt(member.id || '0') ? <CircularProgress size={16} /> : <AddIcon />}
                        >
                          {uploadingImage === parseInt(member.id || '0') ? 'Uploading...' : 'Upload Image'}
                        </Button>
                      </label>
                      {member.image && (
                        <Box>
                          <img
                            src={member.image}
                            alt="Preview"
                            style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 4 }}
                            onError={(e) => {
                              e.currentTarget.src = '/images/subsidiaries/placeholder.svg';
                            }}
                          />
                        </Box>
                      )}
                    </Box>
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
                    <FormControlLabel
                      control={
                        <Switch
                          checked={member.isActive}
                          onChange={(e) => updateMember(index, 'isActive', e.target.checked)}
                        />
                      }
                      label="Active"
                    />
                  </Grid>
                </Grid>
              </Box>
            ))}
            
            <FormControlLabel
              control={
                <Switch
                  checked={editingSubsidiaries.isActive !== false}
                  onChange={(e) => setEditingSubsidiaries({ ...editingSubsidiaries, isActive: e.target.checked })}
                />
              }
              label="Active"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} startIcon={<CancelIcon />}>
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained" startIcon={<SaveIcon />}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SubsidiariesManagement;
