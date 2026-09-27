import React, { useState } from 'react';
import {
  Box, Typography, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, Snackbar, Table, TableHead, TableBody, TableRow, TableCell, TableContainer, Paper,
  IconButton, Chip, MenuItem, Switch, FormControlLabel, CircularProgress,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, LocationOn as LocationIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5001';

interface BranchLocation {
  id: number; name: string; location: string; address: string; email: string; phone: string;
  latitude: number; longitude: number; country: string; is_active: boolean; order_index: number;
}

const COUNTRIES = ['Kenya', 'Uganda', 'Rwanda', 'Tanzania'];
const emptyForm = { name: '', location: '', address: '', email: '', phone: '', latitude: '', longitude: '', country: 'Kenya', isActive: true, order: 0 };

const BranchLocationsEditor: React.FC = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  const { data, isLoading } = useQuery({
    queryKey: ['branch-locations-admin'],
    queryFn: async () => { const res = await axios.get(`${API_BASE}/api/branch-locations/admin`); return res.data.branches as BranchLocation[]; },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form, latitude: parseFloat(form.latitude), longitude: parseFloat(form.longitude) };
      if (editingId) return axios.put(`${API_BASE}/api/branch-locations/${editingId}`, payload);
      return axios.post(`${API_BASE}/api/branch-locations`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branch-locations-admin'] });
      setSnackbar({ open: true, message: `Branch ${editingId ? 'updated' : 'created'} successfully`, severity: 'success' });
      closeDialog();
    },
    onError: () => setSnackbar({ open: true, message: 'Failed to save branch. Check latitude/longitude are valid numbers.', severity: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => axios.delete(`${API_BASE}/api/branch-locations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branch-locations-admin'] });
      setSnackbar({ open: true, message: 'Branch deleted', severity: 'success' });
    },
    onError: () => setSnackbar({ open: true, message: 'Failed to delete branch', severity: 'error' }),
  });

  const openCreateDialog = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEditDialog = (branch: BranchLocation) => {
    setEditingId(branch.id);
    setForm({ name: branch.name, location: branch.location || '', address: branch.address || '', email: branch.email || '', phone: branch.phone || '', latitude: String(branch.latitude), longitude: String(branch.longitude), country: branch.country, isActive: branch.is_active, order: branch.order_index });
    setDialogOpen(true);
  };
  const closeDialog = () => { setDialogOpen(false); setEditingId(null); };

  const branches = data || [];
  const isValidCoords = !isNaN(parseFloat(form.latitude)) && !isNaN(parseFloat(form.longitude));

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Branch Network</Typography>
          <Typography variant="body2" color="text.secondary">Manage the branches shown on the public interactive map ({branches.length} total)</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateDialog}>New Branch</Button>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : branches.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <LocationIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">No branches yet. Add your first location.</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell><TableCell>Country</TableCell><TableCell>Location</TableCell>
                <TableCell>Phone</TableCell><TableCell>Coordinates</TableCell><TableCell>Status</TableCell><TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {branches.map((branch) => (
                <TableRow key={branch.id} hover>
                  <TableCell><Typography variant="body2" fontWeight={600}>{branch.name}</Typography></TableCell>
                  <TableCell><Chip size="small" label={branch.country} /></TableCell>
                  <TableCell sx={{ maxWidth: 200 }}><Typography variant="body2" noWrap>{branch.location}</Typography></TableCell>
                  <TableCell>{branch.phone}</TableCell>
                  <TableCell><Typography variant="caption" color="text.secondary">{branch.latitude.toFixed(4)}, {branch.longitude.toFixed(4)}</Typography></TableCell>
                  <TableCell><Chip size="small" label={branch.is_active ? 'Active' : 'Hidden'} color={branch.is_active ? 'primary' : 'default'} /></TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => openEditDialog(branch)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => deleteMutation.mutate(branch.id)}><DeleteIcon fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit Branch' : 'New Branch'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField label="Branch Name" fullWidth required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <TextField select label="Country" fullWidth value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}>
            {COUNTRIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField>
          <TextField label="Location (building/street)" fullWidth value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <TextField label="Postal Address" fullWidth value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Email" fullWidth value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <TextField label="Phone" fullWidth value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Latitude" fullWidth required placeholder="e.g. 1.01572" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} error={form.latitude !== '' && isNaN(parseFloat(form.latitude))} />
            <TextField label="Longitude" fullWidth required placeholder="e.g. 35.00622" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} error={form.longitude !== '' && isNaN(parseFloat(form.longitude))} />
          </Box>
          <Typography variant="caption" color="text.secondary">Tip: find coordinates by right-clicking the location on Google Maps and copying the numbers shown.</Typography>
          <FormControlLabel control={<Switch checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />} label="Visible on website" />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button variant="contained" disabled={!form.name || !isValidCoords || saveMutation.isPending} onClick={() => saveMutation.mutate()}>
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

export default BranchLocationsEditor;
