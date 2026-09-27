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
  Tabs,
  Tab
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  Upload as UploadIcon,
  PictureAsPdf as PdfIcon,
  Map as MapIcon
} from '@mui/icons-material';
import { 
  getBranchNetwork, 
  createOrUpdateBranchNetwork, 
  updateBranchNetwork, 
  deleteBranchNetwork,
  uploadBranchNetworkPDF,
  BranchNetworkDocument 
} from '../utils/branchNetworkApi';
import BranchesEditor from '../components/BranchesEditor';

const BranchNetworkManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [branchNetwork, setBranchNetwork] = useState<BranchNetworkDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingBranchNetwork, setEditingBranchNetwork] = useState<Partial<BranchNetworkDocument>>({});
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadBranchNetwork();
  }, []);

  const loadBranchNetwork = async () => {
    try {
      setLoading(true);
      const data = await getBranchNetwork();
      setBranchNetwork(data);
    } catch (err) {
      console.error('Error loading branch network:', err);
      setError('Failed to load branch network data');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (branchNetwork) {
      setEditingBranchNetwork(branchNetwork);
      setEditDialogOpen(true);
    }
  };

  const handleSave = async () => {
    try {
      if (branchNetwork?.id) {
        await updateBranchNetwork(branchNetwork.id, editingBranchNetwork);
      } else {
        await createOrUpdateBranchNetwork(editingBranchNetwork);
      }
      setEditDialogOpen(false);
      await loadBranchNetwork();
    } catch (err) {
      console.error('Error saving branch network:', err);
      setError('Failed to save branch network');
    }
  };

  const handleDelete = async () => {
    if (branchNetwork?.id && window.confirm('Are you sure you want to delete this branch network document?')) {
      try {
        await deleteBranchNetwork(branchNetwork.id);
        await loadBranchNetwork();
      } catch (err) {
        console.error('Error deleting branch network:', err);
        setError('Failed to delete branch network');
      }
    }
  };

  const handlePDFUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !branchNetwork?.id) return;

    try {
      setUploading(true);
      const result = await uploadBranchNetworkPDF(branchNetwork.id, file);
      if (result.success) {
        await loadBranchNetwork();
      }
    } catch (err) {
      console.error('Error uploading PDF:', err);
      setError('Failed to upload PDF');
    } finally {
      setUploading(false);
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
      <Typography variant="h4" gutterBottom>
        Branch Network Management
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Manage branch locations for the interactive map and PDF documents.
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab icon={<MapIcon />} label="Branch Locations (Interactive Map)" iconPosition="start" />
          <Tab icon={<PdfIcon />} label="PDF Document" iconPosition="start" />
        </Tabs>
      </Box>

      {/* Tab 1: Interactive Branch Locations */}
      {activeTab === 0 && (
        <BranchesEditor />
      )}

      {/* Tab 2: PDF Document Management */}
      {activeTab === 1 && (
        <Box>
          {branchNetwork ? (
        <Card sx={{ maxWidth: 800 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h5" component="h2">
                {branchNetwork.title}
              </Typography>
              <Chip 
                label={branchNetwork.is_active ? 'Active' : 'Inactive'} 
                color={branchNetwork.is_active ? 'success' : 'default'} 
              />
            </Box>
            
            <Typography variant="body1" paragraph>
              {branchNetwork.description}
            </Typography>
            
            <Box mb={2}>
              <Typography variant="subtitle2" gutterBottom>
                PDF URL:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {branchNetwork.pdf_url || 'No PDF uploaded'}
              </Typography>
            </Box>

            <Box mb={2}>
              <Typography variant="subtitle2" gutterBottom>
                Order Index:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {branchNetwork.order_index || 0}
              </Typography>
            </Box>

            <Box mb={2}>
              <Typography variant="subtitle2" gutterBottom>
                Last Updated:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {branchNetwork.updated_at ? new Date(branchNetwork.updated_at).toLocaleString() : 'Unknown'}
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
              startIcon={<UploadIcon />}
              component="label"
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Upload PDF'}
              <input
                type="file"
                accept=".pdf"
                hidden
                onChange={handlePDFUpload}
              />
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
        <Card sx={{ maxWidth: 800 }}>
          <CardContent>
            <Typography variant="h6" color="text.secondary">
              No branch network document found
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Create a new branch network document to get started.
            </Typography>
          </CardContent>
          <CardActions>
            <Button
              variant="contained"
              onClick={() => {
                setEditingBranchNetwork({});
                setEditDialogOpen(true);
              }}
            >
              Create Branch Network Document
            </Button>
          </CardActions>
        </Card>
          )}
        </Box>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {branchNetwork?.id ? 'Edit Branch Network' : 'Create Branch Network'}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField
              label="Title"
              value={editingBranchNetwork.title || ''}
              onChange={(e) => setEditingBranchNetwork({ ...editingBranchNetwork, title: e.target.value })}
              fullWidth
              required
            />
            
            <TextField
              label="Description"
              value={editingBranchNetwork.description || ''}
              onChange={(e) => setEditingBranchNetwork({ ...editingBranchNetwork, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
              required
            />
            
            <TextField
              label="PDF URL"
              value={editingBranchNetwork.pdf_url || ''}
              onChange={(e) => setEditingBranchNetwork({ ...editingBranchNetwork, pdf_url: e.target.value })}
              fullWidth
              helperText="URL to the PDF document"
            />
            
            <TextField
              label="Order Index"
              type="number"
              value={editingBranchNetwork.order_index || 0}
              onChange={(e) => setEditingBranchNetwork({ ...editingBranchNetwork, order_index: parseInt(e.target.value) || 0 })}
              fullWidth
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={editingBranchNetwork.is_active !== false}
                  onChange={(e) => setEditingBranchNetwork({ ...editingBranchNetwork, is_active: e.target.checked })}
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

export default BranchNetworkManagement;
