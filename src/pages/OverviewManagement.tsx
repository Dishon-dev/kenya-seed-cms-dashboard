import React, { useState, useEffect } from 'react';
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
  ListItemSecondaryAction
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  Remove as RemoveIcon
} from '@mui/icons-material';
import { 
  getOverview, 
  createOrUpdateOverview, 
  updateOverview, 
  deleteOverview,
  OverviewData,
  CoreValue 
} from '../utils/overviewApi';

const OverviewManagement: React.FC = () => {
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingOverview, setEditingOverview] = useState<Partial<OverviewData>>({});
  const [newSubsidiary, setNewSubsidiary] = useState('');
  const [newCoreValue, setNewCoreValue] = useState<CoreValue>({ title: '', description: '' });

  useEffect(() => {
    loadOverview();
  }, []);

  const loadOverview = async () => {
    try {
      setLoading(true);
      const data = await getOverview();
      setOverviewData(data);
    } catch (err) {
      console.error('Error loading overview:', err);
      setError('Failed to load overview data');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (overviewData) {
      setEditingOverview(overviewData);
      setEditDialogOpen(true);
    }
  };

  const handleSave = async () => {
    try {
      if (overviewData?.id) {
        await updateOverview(overviewData.id, editingOverview);
      } else {
        await createOrUpdateOverview(editingOverview);
      }
      setEditDialogOpen(false);
      await loadOverview();
    } catch (err) {
      console.error('Error saving overview:', err);
      setError('Failed to save overview');
    }
  };

  const handleDelete = async () => {
    if (overviewData?.id && window.confirm('Are you sure you want to delete this overview data?')) {
      try {
        await deleteOverview(overviewData.id);
        await loadOverview();
      } catch (err) {
        console.error('Error deleting overview:', err);
        setError('Failed to delete overview');
      }
    }
  };

  const addSubsidiary = () => {
    if (newSubsidiary.trim()) {
      setEditingOverview({
        ...editingOverview,
        subsidiaries: [...(editingOverview.subsidiaries || []), newSubsidiary.trim()]
      });
      setNewSubsidiary('');
    }
  };

  const removeSubsidiary = (index: number) => {
    const updatedSubsidiaries = [...(editingOverview.subsidiaries || [])];
    updatedSubsidiaries.splice(index, 1);
    setEditingOverview({
      ...editingOverview,
      subsidiaries: updatedSubsidiaries
    });
  };

  const addCoreValue = () => {
    if (newCoreValue.title.trim() && newCoreValue.description.trim()) {
      setEditingOverview({
        ...editingOverview,
        coreValues: [...(editingOverview.coreValues || []), { ...newCoreValue }]
      });
      setNewCoreValue({ title: '', description: '' });
    }
  };

  const removeCoreValue = (index: number) => {
    const updatedCoreValues = [...(editingOverview.coreValues || [])];
    updatedCoreValues.splice(index, 1);
    setEditingOverview({
      ...editingOverview,
      coreValues: updatedCoreValues
    });
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
        Overview Management
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Manage the company overview content that appears on the website.
      </Typography>

      {overviewData ? (
        <Card sx={{ maxWidth: 1000 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h5" component="h2">
                Company Overview
              </Typography>
              <Chip 
                label={overviewData.isActive ? 'Active' : 'Inactive'} 
                color={overviewData.isActive ? 'success' : 'default'} 
              />
            </Box>
            
            <Box mb={2}>
              <Typography variant="subtitle2" gutterBottom>
                Company History:
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {overviewData.companyHistory}
              </Typography>
            </Box>

            <Box mb={2}>
              <Typography variant="subtitle2" gutterBottom>
                Vision:
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {overviewData.vision}
              </Typography>
            </Box>

            <Box mb={2}>
              <Typography variant="subtitle2" gutterBottom>
                Mission:
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {overviewData.mission}
              </Typography>
            </Box>

            <Box mb={2}>
              <Typography variant="subtitle2" gutterBottom>
                Subsidiaries:
              </Typography>
              <List dense>
                {overviewData.subsidiaries.map((subsidiary, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={subsidiary} />
                  </ListItem>
                ))}
              </List>
            </Box>

            <Box mb={2}>
              <Typography variant="subtitle2" gutterBottom>
                Core Values:
              </Typography>
              <List dense>
                {overviewData.coreValues.map((value, index) => (
                  <ListItem key={index}>
                    <ListItemText 
                      primary={value.title}
                      secondary={value.description}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>

            <Box mb={2}>
              <Typography variant="subtitle2" gutterBottom>
                Last Updated:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {overviewData.updatedAt ? new Date(overviewData.updatedAt).toLocaleString() : 'Unknown'}
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
              No overview data found
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Create overview data to get started.
            </Typography>
          </CardContent>
          <CardActions>
            <Button
              variant="contained"
              onClick={() => {
                setEditingOverview({});
                setEditDialogOpen(true);
              }}
            >
              Create Overview Data
            </Button>
          </CardActions>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          {overviewData?.id ? 'Edit Overview' : 'Create Overview'}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField
              label="Company History"
              value={editingOverview.companyHistory || ''}
              onChange={(e) => setEditingOverview({ ...editingOverview, companyHistory: e.target.value })}
              fullWidth
              multiline
              rows={4}
              required
            />
            
            <TextField
              label="Vision"
              value={editingOverview.vision || ''}
              onChange={(e) => setEditingOverview({ ...editingOverview, vision: e.target.value })}
              fullWidth
              required
            />
            
            <TextField
              label="Mission"
              value={editingOverview.mission || ''}
              onChange={(e) => setEditingOverview({ ...editingOverview, mission: e.target.value })}
              fullWidth
              required
            />

            {/* Subsidiaries */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">Subsidiaries</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box display="flex" gap={1} mb={2}>
                  <TextField
                    label="Add Subsidiary"
                    value={newSubsidiary}
                    onChange={(e) => setNewSubsidiary(e.target.value)}
                    size="small"
                    fullWidth
                  />
                  <Button onClick={addSubsidiary} startIcon={<AddIcon />}>
                    Add
                  </Button>
                </Box>
                <List>
                  {(editingOverview.subsidiaries || []).map((subsidiary, index) => (
                    <ListItem key={index}>
                      <ListItemText primary={subsidiary} />
                      <ListItemSecondaryAction>
                        <IconButton onClick={() => removeSubsidiary(index)}>
                          <RemoveIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>

            {/* Core Values */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">Core Values</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box display="flex" flexDirection="column" gap={2} mb={2}>
                  <TextField
                    label="Value Title"
                    value={newCoreValue.title}
                    onChange={(e) => setNewCoreValue({ ...newCoreValue, title: e.target.value })}
                    size="small"
                    fullWidth
                  />
                  <TextField
                    label="Value Description"
                    value={newCoreValue.description}
                    onChange={(e) => setNewCoreValue({ ...newCoreValue, description: e.target.value })}
                    size="small"
                    fullWidth
                    multiline
                    rows={2}
                  />
                  <Button onClick={addCoreValue} startIcon={<AddIcon />}>
                    Add Core Value
                  </Button>
                </Box>
                <List>
                  {(editingOverview.coreValues || []).map((value, index) => (
                    <ListItem key={index}>
                      <ListItemText 
                        primary={value.title}
                        secondary={value.description}
                      />
                      <ListItemSecondaryAction>
                        <IconButton onClick={() => removeCoreValue(index)}>
                          <RemoveIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
            
            <FormControlLabel
              control={
                <Switch
                  checked={editingOverview.isActive !== false}
                  onChange={(e) => setEditingOverview({ ...editingOverview, isActive: e.target.checked })}
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

export default OverviewManagement;
