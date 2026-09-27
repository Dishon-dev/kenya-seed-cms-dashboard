import React, { useState } from 'react';
import {
  Box, Typography, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, Snackbar, Table, TableHead, TableBody, TableRow, TableCell, TableContainer, Paper,
  IconButton, Switch, FormControlLabel, CircularProgress, Chip,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Event as EventIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5001';

interface CalendarEvent {
  id: number;
  title: string;
  start_date: string;
  end_date: string | null;
  location: string;
  description: string;
  is_active: boolean;
  order_index: number;
}

const emptyForm = { title: '', startDate: '', endDate: '', location: '', description: '', isActive: true, order: 0 };

const CalendarEventsEditor: React.FC = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  const { data, isLoading } = useQuery({
    queryKey: ['calendar-events-admin'],
    queryFn: async () => { const res = await axios.get(`${API_BASE}/api/calendar-events/admin`); return res.data.events as CalendarEvent[]; },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingId) return axios.put(`${API_BASE}/api/calendar-events/${editingId}`, form);
      return axios.post(`${API_BASE}/api/calendar-events`, form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events-admin'] });
      setSnackbar({ open: true, message: `Event ${editingId ? 'updated' : 'created'} successfully`, severity: 'success' });
      closeDialog();
    },
    onError: () => setSnackbar({ open: true, message: 'Failed to save event', severity: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => axios.delete(`${API_BASE}/api/calendar-events/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events-admin'] });
      setSnackbar({ open: true, message: 'Event deleted', severity: 'success' });
    },
    onError: () => setSnackbar({ open: true, message: 'Failed to delete event', severity: 'error' }),
  });

  const openCreateDialog = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEditDialog = (event: CalendarEvent) => {
    setEditingId(event.id);
    setForm({
      title: event.title,
      startDate: event.start_date?.slice(0, 10) || '',
      endDate: event.end_date?.slice(0, 10) || '',
      location: event.location || '',
      description: event.description || '',
      isActive: event.is_active,
      order: event.order_index,
    });
    setDialogOpen(true);
  };
  const closeDialog = () => { setDialogOpen(false); setEditingId(null); };

  const events = data || [];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Calendar of Events</Typography>
          <Typography variant="body2" color="text.secondary">Manage events shown on the public Calendar of Events page</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateDialog}>New Event</Button>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : events.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <EventIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">No events yet. Add your first one.</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell><TableCell>Start</TableCell><TableCell>End</TableCell>
                <TableCell>Location</TableCell><TableCell>Status</TableCell><TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id} hover>
                  <TableCell><Typography variant="body2" fontWeight={600}>{event.title}</Typography></TableCell>
                  <TableCell>{event.start_date?.slice(0, 10)}</TableCell>
                  <TableCell>{event.end_date?.slice(0, 10) || '—'}</TableCell>
                  <TableCell>{event.location || '—'}</TableCell>
                  <TableCell><Chip size="small" label={event.is_active ? 'Active' : 'Hidden'} color={event.is_active ? 'primary' : 'default'} /></TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => openEditDialog(event)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => deleteMutation.mutate(event.id)}><DeleteIcon fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit Event' : 'New Event'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField label="Title" fullWidth required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Start Date" type="date" fullWidth required InputLabelProps={{ shrink: true }} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            <TextField label="End Date (optional)" type="date" fullWidth InputLabelProps={{ shrink: true }} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          </Box>
          <TextField label="Location (optional)" fullWidth value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <TextField label="Description (optional)" fullWidth multiline rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <FormControlLabel control={<Switch checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />} label="Visible on website" />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button variant="contained" disabled={!form.title || !form.startDate || saveMutation.isPending} onClick={() => saveMutation.mutate()}>
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

export default CalendarEventsEditor;
