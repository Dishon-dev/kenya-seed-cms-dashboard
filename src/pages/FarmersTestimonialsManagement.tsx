import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Visibility as ViewIcon,
  CloudUpload as UploadIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5001';

interface FarmersTestimonial {
  id: number;
  name: string;
  location: string | null;
  quote: string;
  file_filename?: string | null;
  file_mime_type?: string | null;
  file_size?: number | null;
  is_active: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

const FarmersTestimonialsManagement: React.FC = () => {
  const [testimonials, setTestimonials] = useState<FarmersTestimonial[]>([]);
  const [editingTestimonial, setEditingTestimonial] = useState<Partial<FarmersTestimonial> | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [testimonialToDelete, setTestimonialToDelete] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const queryClient = useQueryClient();

  const { data: testimonialsResponse, isLoading, error } = useQuery({
    queryKey: ['farmers-testimonials'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/api/cms/farmers-testimonials/testimonials`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      return response.data;
    },
    retry: 2,
    staleTime: 30000
  });

  useEffect(() => {
    if (testimonialsResponse?.testimonials) {
      setTestimonials(testimonialsResponse.testimonials);
    }
  }, [testimonialsResponse]);

  const saveTestimonialMutation = useMutation({
    mutationFn: async (data: FarmersTestimonial | Partial<FarmersTestimonial>) => {
      if (data.id) {
        return axios.put(`${API_BASE}/api/cms/farmers-testimonials/testimonials/${data.id}`, data, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
      }
      return axios.post(`${API_BASE}/api/cms/farmers-testimonials/testimonials`, data, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farmers-testimonials'] });
      setIsDialogOpen(false);
      setEditingTestimonial(null);
      setMessage({ type: 'success', text: 'Testimonial saved successfully!' });
      setTimeout(() => setMessage(null), 3000);
    },
    onError: (error: any) => {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to save testimonial' });
      setTimeout(() => setMessage(null), 5000);
    }
  });

  const deleteTestimonialMutation = useMutation({
    mutationFn: async (id: number) => {
      return axios.delete(`${API_BASE}/api/cms/farmers-testimonials/testimonials/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farmers-testimonials'] });
      setIsDeleteDialogOpen(false);
      setTestimonialToDelete(null);
      setMessage({ type: 'success', text: 'Testimonial deleted successfully!' });
      setTimeout(() => setMessage(null), 3000);
    },
    onError: (error: any) => {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to delete testimonial' });
      setTimeout(() => setMessage(null), 5000);
    }
  });

  const handleEdit = (testimonial: FarmersTestimonial) => {
    setEditingTestimonial(testimonial);
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingTestimonial({
      name: '',
      location: '',
      quote: '',
      order_index: testimonials.length,
      is_active: true
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    setTestimonialToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleSave = () => {
    if (!editingTestimonial?.name || !editingTestimonial?.quote) {
      setMessage({ type: 'error', text: 'Name and quote are required' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    saveTestimonialMutation.mutate(editingTestimonial as FarmersTestimonial);
  };

  const uploadFileMutation = useMutation({
    mutationFn: async ({ id, file }: { id: number; file: File }) => {
      const formData = new FormData();
      formData.append('file', file);
      return axios.post(`${API_BASE}/api/cms/farmers-testimonials/testimonials/${id}/file`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farmers-testimonials'] });
      setMessage({ type: 'success', text: 'File uploaded successfully!' });
      setTimeout(() => setMessage(null), 3000);
    },
    onError: (error: any) => {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to upload file' });
      setTimeout(() => setMessage(null), 5000);
    }
  });

  const handleUploadFile = (id: number, file: File) => {
    uploadFileMutation.mutate({ id, file });
  };

  const viewFile = (id: number) => {
    window.open(`${API_BASE}/api/farmers-testimonials/files/${id}`, '_blank');
  };

  if (isLoading) {
    return (
      <Box p={3} display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">Failed to load testimonials. Please try again.</Alert>
      </Box>
    );
  }

  return (
    <Box p={0}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" gutterBottom>
            Farmers Testimonials
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage testimonials shown on the website
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
          color="primary"
        >
          Add Testimonial
        </Button>
      </Box>

      {message && (
        <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Order</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Quote</TableCell>
              <TableCell>File</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {testimonials.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body2" color="text.secondary" py={3}>
                    No testimonials yet. Click "Add Testimonial" to create one.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              testimonials.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.order_index}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.location || '-'}</TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 280 }}>
                      {item.quote}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {item.file_filename ? (
                      <Typography variant="body2" noWrap sx={{ maxWidth: 160 }}>
                        {item.file_filename}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No file
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={item.is_active ? 'Active' : 'Inactive'}
                      color={item.is_active ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Box display="flex" gap={1} justifyContent="flex-end">
                      {item.file_filename && (
                        <Tooltip title="View File">
                          <IconButton
                            size="small"
                            onClick={() => viewFile(item.id)}
                            color="primary"
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Upload File">
                        <IconButton
                          size="small"
                          component="label"
                          color="primary"
                        >
                          <UploadIcon />
                          <input
                            type="file"
                            hidden
                            accept="*/*"
                            onChange={(event) => {
                              if (event.target.files && event.target.files[0]) {
                                handleUploadFile(item.id, event.target.files[0]);
                              }
                            }}
                          />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(item)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(item.id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingTestimonial?.id ? 'Edit Testimonial' : 'Add New Testimonial'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Name"
                value={editingTestimonial?.name || ''}
                onChange={(e) => setEditingTestimonial({ ...editingTestimonial, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Location"
                value={editingTestimonial?.location || ''}
                onChange={(e) => setEditingTestimonial({ ...editingTestimonial, location: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={5}
                label="Quote"
                value={editingTestimonial?.quote || ''}
                onChange={(e) => setEditingTestimonial({ ...editingTestimonial, quote: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Order Index"
                type="number"
                value={editingTestimonial?.order_index || 0}
                onChange={(e) => setEditingTestimonial({ ...editingTestimonial, order_index: parseInt(e.target.value) || 0 })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={editingTestimonial?.is_active !== false}
                    onChange={(e) => setEditingTestimonial({ ...editingTestimonial, is_active: e.target.checked })}
                  />
                }
                label="Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            startIcon={<SaveIcon />}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)}>
        <DialogTitle>Delete Testimonial</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this testimonial? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => testimonialToDelete && deleteTestimonialMutation.mutate(testimonialToDelete)}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FarmersTestimonialsManagement;
