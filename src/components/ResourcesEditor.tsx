import React, { useState } from 'react';
import {
  Box, Typography, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, Snackbar, Table, TableHead, TableBody, TableRow, TableCell, TableContainer, Paper,
  IconButton, Switch, FormControlLabel, CircularProgress, Chip,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Download as DownloadIcon, Description as ResourceIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5001';

interface Resource {
  id: number;
  title: string;
  description: string;
  file_name: string | null;
  is_active: boolean;
  order_index: number;
}

const emptyForm = { title: '', description: '', isActive: true, order: 0 };

const ResourcesEditor: React.FC = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  const { data, isLoading } = useQuery({
    queryKey: ['resources-admin'],
    queryFn: async () => { const res = await axios.get(`${API_BASE}/api/resources/admin`); return res.data.resources as Resource[]; },
  });

  const buildFormData = () => {
    const fd = new FormData();
    fd.append('title', form.title);
    fd.append('description', form.description);
    fd.append('isActive', String(form.isActive));
    fd.append('order', String(form.order));
    if (file) fd.append('file', file);
    return fd;
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const fd = buildFormData();
      if (editingId) return axios.put(`${API_BASE}/api/resources/${editingId}`, fd);
      return axios.post(`${API_BASE}/api/resources`, fd);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources-admin'] });
      setSnackbar({ open: true, message: `Resource ${editingId ? 'updated' : 'added'} successfully`, severity: 'success' });
      closeDialog();
    },
    onError: () => setSnackbar({ open: true, message: 'Failed to save resource', severity: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => axios.delete(`${API_BASE}/api/resources/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources-admin'] });
      setSnackbar({ open: true, message: 'Resource deleted', severity: 'success' });
    },
    onError: () => setSnackbar({ open: true, message: 'Failed to delete resource', severity: 'error' }),
  });

  const openCreateDialog = () => { setEditingId(null); setForm(emptyForm); setFile(null); setDialogOpen(true); };
  const openEditDialog = (resource: Resource) => {
    setEditingId(resource.id);
    setForm({ title: resource.title, description: resource.description || '', isActive: resource.is_active, order: resource.order_index });
    setFile(null);
    setDialogOpen(true);
  };
  const closeDialog = () => { setDialogOpen(false); setEditingId(null); setFile(null); };

  const resources = data || [];
  const canSave = form.title && (file || editingId);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Resources</Typography>
          <Typography variant="body2" color="text.secondary">Manage downloadable documents shown on the public Resources page</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateDialog}>New Resource</Button>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : resources.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <ResourceIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">No resources yet. Add your first document.</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell><TableCell>File</TableCell><TableCell>Status</TableCell><TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {resources.map((resource) => (
                <TableRow key={resource.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{resource.title}</Typography>
                    <Typography variant="caption" color="text.secondary">{resource.description}</Typography>
                  </TableCell>
                  <TableCell>
                    {resource.file_name ? (
                      <Button size="small" startIcon={<DownloadIcon />} onClick={() => window.open(`${API_BASE}/api/resources/${resource.id}/file`, '_blank')}>
                        {resource.file_name}
                      </Button>
                    ) : '—'}
                  </TableCell>
                  <TableCell><Chip size="small" label={resource.is_active ? 'Active' : 'Hidden'} color={resource.is_active ? 'primary' : 'default'} /></TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => openEditDialog(resource)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => deleteMutation.mutate(resource.id)}><DeleteIcon fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit Resource' : 'New Resource'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField label="Title" fullWidth required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <TextField label="Description" fullWidth multiline rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Button component="label" variant="outlined" sx={{ alignSelf: 'flex-start' }}>
            {file ? file.name : editingId ? 'Replace PDF (optional)' : 'Choose PDF file'}
            <input type="file" accept="application/pdf" hidden onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </Button>
          <FormControlLabel control={<Switch checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />} label="Visible on website" />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button variant="contained" disabled={!canSave || saveMutation.isPending} onClick={() => saveMutation.mutate()}>
            {saveMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default ResourcesEditor;
