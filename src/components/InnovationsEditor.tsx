import React, { useState } from 'react';
import {
  Box, Typography, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, Snackbar, Grid, Card, CardContent, IconButton, Switch, FormControlLabel,
  CircularProgress, Chip, MenuItem,
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Lightbulb, Shield as ShieldCheckIcon,
  WbSunny, Grass as Eco, Science, TrendingUp, Agriculture,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5001';

// Matches the icon names used on the public website (lucide-react names) -
// mapped here to MUI equivalents just for the CMS preview.
const ICON_OPTIONS = ['Lightbulb', 'ShieldCheck', 'CloudSun', 'Leaf', 'FlaskConical', 'TrendingUp', 'Sprout'];
const ICON_PREVIEW: Record<string, React.ElementType> = {
  Lightbulb, ShieldCheck: ShieldCheckIcon, CloudSun: WbSunny, Leaf: Eco,
  FlaskConical: Science, TrendingUp, Sprout: Agriculture,
};

interface Innovation {
  id: number;
  title: string;
  description: string;
  icon: string;
  action_text: string | null;
  action_link: string | null;
  is_active: boolean;
  order_index: number;
}

const emptyForm = { title: '', description: '', icon: 'Lightbulb', actionText: '', actionLink: '', isActive: true, order: 0 };

const InnovationsEditor: React.FC = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  const { data, isLoading } = useQuery({
    queryKey: ['innovations-admin'],
    queryFn: async () => { const res = await axios.get(`${API_BASE}/api/innovations/admin`); return res.data.innovations as Innovation[]; },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingId) return axios.put(`${API_BASE}/api/innovations/${editingId}`, form);
      return axios.post(`${API_BASE}/api/innovations`, form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['innovations-admin'] });
      setSnackbar({ open: true, message: `Innovation ${editingId ? 'updated' : 'created'} successfully`, severity: 'success' });
      closeDialog();
    },
    onError: () => setSnackbar({ open: true, message: 'Failed to save innovation', severity: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => axios.delete(`${API_BASE}/api/innovations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['innovations-admin'] });
      setSnackbar({ open: true, message: 'Innovation deleted', severity: 'success' });
    },
    onError: () => setSnackbar({ open: true, message: 'Failed to delete innovation', severity: 'error' }),
  });

  const openCreateDialog = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEditDialog = (item: Innovation) => {
    setEditingId(item.id);
    setForm({ title: item.title, description: item.description || '', icon: item.icon || 'Lightbulb', actionText: item.action_text || '', actionLink: item.action_link || '', isActive: item.is_active, order: item.order_index });
    setDialogOpen(true);
  };
  const closeDialog = () => { setDialogOpen(false); setEditingId(null); };

  const innovations = data || [];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Innovations</Typography>
          <Typography variant="body2" color="text.secondary">Manage the "Innovations at Kenya Seed" cards shown on the public site</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateDialog}>New Innovation</Button>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : innovations.length === 0 ? (
        <Card sx={{ p: 6, textAlign: 'center' }}>
          <Lightbulb sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">No innovations yet. Add your first one.</Typography>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {innovations.map((item) => {
            const Icon = ICON_PREVIEW[item.icon] || Lightbulb;
            return (
              <Grid item xs={12} sm={6} md={4} key={item.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                      <Box sx={{ p: 1.5, borderRadius: '50%', bgcolor: 'primary.main', opacity: 0.1, position: 'absolute' }} />
                      <Icon sx={{ fontSize: 36, color: 'primary.main' }} />
                    </Box>
                    <Typography variant="subtitle1" fontWeight={600} textAlign="center">{item.title}</Typography>
                    <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 1.5 }}>
                      {item.description}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Chip size="small" label={item.is_active ? 'Active' : 'Hidden'} color={item.is_active ? 'primary' : 'default'} />
                      <Box>
                        <IconButton size="small" onClick={() => openEditDialog(item)}><EditIcon fontSize="small" /></IconButton>
                        <IconButton size="small" color="error" onClick={() => deleteMutation.mutate(item.id)}><DeleteIcon fontSize="small" /></IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit Innovation' : 'New Innovation'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField label="Title" fullWidth required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <TextField label="Description" fullWidth multiline rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <TextField select label="Icon" fullWidth value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })}>
            {ICON_OPTIONS.map((opt) => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
          </TextField>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Button Text (optional)" fullWidth value={form.actionText} onChange={(e) => setForm({ ...form, actionText: e.target.value })} />
            <TextField label="Button Link (optional)" fullWidth value={form.actionLink} onChange={(e) => setForm({ ...form, actionLink: e.target.value })} />
          </Box>
          <FormControlLabel control={<Switch checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />} label="Visible on website" />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button variant="contained" disabled={!form.title || saveMutation.isPending} onClick={() => saveMutation.mutate()}>
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

export default InnovationsEditor;
