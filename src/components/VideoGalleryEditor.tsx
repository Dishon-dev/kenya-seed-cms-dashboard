import React, { useState } from 'react';
import {
  Box, Typography, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, Snackbar, Grid, Card, CardContent, CardMedia, IconButton, Switch, FormControlLabel,
  CircularProgress, Chip, Tabs, Tab,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, VideoLibrary as VideoIcon, PlayCircle } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5001';

interface GalleryVideo {
  id: number;
  title: string;
  description: string;
  video_url: string;
  video_filename: string | null;
  thumbnail_url: string | null;
  is_active: boolean;
  order_index: number;
}

const emptyForm = { title: '', description: '', videoUrl: '', thumbnailUrl: '', isActive: true, order: 0 };

const VideoGalleryEditor: React.FC = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [sourceTab, setSourceTab] = useState<'upload' | 'url'>('url');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  const { data, isLoading } = useQuery({
    queryKey: ['video-gallery-admin'],
    queryFn: async () => { const res = await axios.get(`${API_BASE}/api/video-gallery/admin`); return res.data.videos as GalleryVideo[]; },
  });

  const buildFormData = () => {
    const fd = new FormData();
    fd.append('title', form.title);
    fd.append('description', form.description);
    fd.append('thumbnailUrl', form.thumbnailUrl);
    fd.append('isActive', String(form.isActive));
    fd.append('order', String(form.order));
    if (sourceTab === 'url') fd.append('videoUrl', form.videoUrl);
    if (videoFile) fd.append('video', videoFile);
    return fd;
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const fd = buildFormData();
      if (editingId) return axios.put(`${API_BASE}/api/video-gallery/${editingId}`, fd);
      return axios.post(`${API_BASE}/api/video-gallery`, fd);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-gallery-admin'] });
      setSnackbar({ open: true, message: `Video ${editingId ? 'updated' : 'added'} successfully`, severity: 'success' });
      closeDialog();
    },
    onError: () => setSnackbar({ open: true, message: 'Failed to save video', severity: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => axios.delete(`${API_BASE}/api/video-gallery/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-gallery-admin'] });
      setSnackbar({ open: true, message: 'Video deleted', severity: 'success' });
    },
    onError: () => setSnackbar({ open: true, message: 'Failed to delete video', severity: 'error' }),
  });

  const openCreateDialog = () => { setEditingId(null); setForm(emptyForm); setVideoFile(null); setSourceTab('url'); setDialogOpen(true); };
  const openEditDialog = (video: GalleryVideo) => {
    setEditingId(video.id);
    setForm({ title: video.title, description: video.description || '', videoUrl: video.video_filename ? '' : video.video_url, thumbnailUrl: video.thumbnail_url || '', isActive: video.is_active, order: video.order_index });
    setVideoFile(null);
    setSourceTab(video.video_filename ? 'upload' : 'url');
    setDialogOpen(true);
  };
  const closeDialog = () => { setDialogOpen(false); setEditingId(null); setVideoFile(null); };

  const videos = data || [];
  const canSave = form.title && (sourceTab === 'url' ? form.videoUrl : (videoFile || editingId));

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Video Gallery</Typography>
          <Typography variant="body2" color="text.secondary">Manage videos shown on the public Video Gallery page</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateDialog}>Add Video</Button>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : videos.length === 0 ? (
        <Card sx={{ p: 6, textAlign: 'center' }}>
          <VideoIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">No videos yet. Add your first one.</Typography>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {videos.map((video) => (
            <Grid item xs={12} sm={6} md={4} key={video.id}>
              <Card>
                <Box sx={{ position: 'relative', bgcolor: 'grey.900', height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {video.thumbnail_url ? (
                    <CardMedia component="img" image={video.thumbnail_url} sx={{ height: 160, objectFit: 'cover', width: '100%' }} />
                  ) : (
                    <PlayCircle sx={{ fontSize: 56, color: 'white', opacity: 0.8 }} />
                  )}
                </Box>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={600} noWrap>{video.title}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {video.description}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Chip size="small" label={video.is_active ? 'Active' : 'Hidden'} color={video.is_active ? 'primary' : 'default'} />
                    <Box>
                      <IconButton size="small" onClick={() => openEditDialog(video)}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" color="error" onClick={() => deleteMutation.mutate(video.id)}><DeleteIcon fontSize="small" /></IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit Video' : 'Add Video'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField label="Title" fullWidth required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <TextField label="Description" fullWidth multiline rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

          <Tabs value={sourceTab} onChange={(_, v) => setSourceTab(v)}>
            <Tab label="Link (YouTube/Vimeo)" value="url" />
            <Tab label="Upload File" value="upload" />
          </Tabs>

          {sourceTab === 'url' ? (
            <TextField
              label="Video URL"
              fullWidth
              placeholder="https://www.youtube.com/watch?v=..."
              value={form.videoUrl}
              onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
            />
          ) : (
            <Button component="label" variant="outlined" sx={{ alignSelf: 'flex-start' }}>
              {videoFile ? videoFile.name : editingId ? 'Replace video file (optional)' : 'Choose video file'}
              <input type="file" accept="video/*" hidden onChange={(e) => setVideoFile(e.target.files?.[0] || null)} />
            </Button>
          )}

          <TextField label="Thumbnail Image URL (optional)" fullWidth value={form.thumbnailUrl} onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })} />
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

export default VideoGalleryEditor;
