import React, { useState } from 'react';
import {
  Box, Typography, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, Snackbar, Table, TableHead, TableBody, TableRow, TableCell, TableContainer, Paper,
  IconButton, Chip, MenuItem, Switch, FormControlLabel, CircularProgress, Tooltip,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Download as DownloadIcon, Campaign as NoticeIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5001';

interface Notice {
  id: number; title: string; type: string; priority: string; notice_date: string;
  excerpt: string; content: string; downloadable: boolean; file_name: string | null;
  is_active: boolean; order_index: number;
}

const NOTICE_TYPES = ['Notice', 'Product Launch', 'Advisory', 'Price Update', 'Training', 'Partnership'];
const PRIORITIES = ['high', 'medium', 'low'];
const emptyForm = { title: '', type: 'Notice', priority: 'medium', date: new Date().toISOString().slice(0, 10), excerpt: '', content: '', isActive: true, order: 0 };

const NoticesEditor: React.FC = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  const { data, isLoading } = useQuery({
    queryKey: ['notices-admin'],
    queryFn: async () => { const res = await axios.get(`${API_BASE}/api/notices/admin`); return res.data.notices as Notice[]; },
  });

  const buildFormData = () => {
    const fd = new FormData();
    Object.entries(form).forEach(([key, value]) => fd.append(key, String(value)));
    if (file) fd.append('file', file);
    return fd;
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const fd = buildFormData();
      if (editingId) return axios.put(`${API_BASE}/api/notices/${editingId}`, fd);
      return axios.post(`${API_BASE}/api/notices`, fd);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notices-admin'] });
      setSnackbar({ open: true, message: `Notice ${editingId ? 'updated' : 'created'} successfully`, severity: 'success' });
      closeDialog();
    },
    onError: () => setSnackbar({ open: true, message: 'Failed to save notice', severity: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => axios.delete(`${API_BASE}/api/notices/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notices-admin'] });
      setSnackbar({ open: true, message: 'Notice deleted', severity: 'success' });
    },
    onError: () => setSnackbar({ open: true, message: 'Failed to delete notice', severity: 'error' }),
  });

  const openCreateDialog = () => { setEditingId(null); setForm(emptyForm); setFile(null); setDialogOpen(true); };
  const openEditDialog = (notice: Notice) => {
    setEditingId(notice.id);
    setForm({ title: notice.title, type: notice.type, priority: notice.priority, date: notice.notice_date?.slice(0, 10) || emptyForm.date, excerpt: notice.excerpt || '', content: notice.content || '', isActive: notice.is_active, order: notice.order_index });
    setFile(null);
    setDialogOpen(true);
  };
  const closeDialog = () => { setDialogOpen(false); setEditingId(null); setFile(null); };

  const notices = data || [];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Notice Board</Typography>
          <Typography variant="body2" color="text.secondary">Manage announcements shown on the public Notice Board page</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateDialog}>New Notice</Button>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : notices.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <NoticeIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">No notices yet. Create your first one.</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell><TableCell>Type</TableCell><TableCell>Priority</TableCell>
                <TableCell>Date</TableCell><TableCell>Status</TableCell><TableCell>File</TableCell><TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {notices.map((notice) => (
                <TableRow key={notice.id} hover>
                  <TableCell sx={{ maxWidth: 280 }}><Typography variant="body2" fontWeight={600} noWrap>{notice.title}</Typography></TableCell>
                  <TableCell>{notice.type}</TableCell>
                  <TableCell><Chip size="small" label={notice.priority} color={notice.priority === 'high' ? 'error' : notice.priority === 'medium' ? 'warning' : 'success'} /></TableCell>
                  <TableCell>{notice.notice_date?.slice(0, 10)}</TableCell>
                  <TableCell><Chip size="small" label={notice.is_active ? 'Active' : 'Hidden'} color={notice.is_active ? 'primary' : 'default'} /></TableCell>
                  <TableCell>
                    {notice.file_name ? (
                      <Tooltip title={notice.file_name}>
                        <IconButton size="small" onClick={() => window.open(`${API_BASE}/api/notices/${notice.id}/file`, '_blank')}><DownloadIcon fontSize="small" /></IconButton>
                      </Tooltip>
                    ) : <Typography variant="caption" color="text.disabled">—</Typography>}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => openEditDialog(notice)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => deleteMutation.mutate(notice.id)}><DeleteIcon fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit Notice' : 'New Notice'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField label="Title" fullWidth required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField select label="Type" fullWidth value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {NOTICE_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
            <TextField select label="Priority" fullWidth value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              {PRIORITIES.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
            </TextField>
          </Box>
          <TextField label="Date" type="date" fullWidth InputLabelProps={{ shrink: true }} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <TextField label="Excerpt (short summary shown in the list)" fullWidth multiline rows={2} value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
          <TextField label="Full Content" fullWidth multiline rows={4} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
          <Button component="label" variant="outlined" sx={{ alignSelf: 'flex-start' }}>
            {file ? file.name : 'Attach PDF (optional)'}
            <input type="file" accept="application/pdf" hidden onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </Button>
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

export default NoticesEditor;
