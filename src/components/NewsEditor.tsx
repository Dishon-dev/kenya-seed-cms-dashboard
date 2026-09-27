import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Chip,
  Divider,
  CircularProgress,
  Fab,
  Paper,
  LinearProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Image as ImageIcon,
  Article as NewsIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5001';

interface NewsItem {
  id?: string;
  title: string;
  date: string;
  image: string;
  content: string;
  order: number;
  isActive: boolean;
}

interface NewsData {
  id: string;
  hero: {
    title: string;
    subtitle: string;
  };
  news: NewsItem[];
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

const NewsEditor: React.FC = () => {
  const [newsData, setNewsData] = useState<NewsData | null>(null);
  const [editingNews, setEditingNews] = useState<Partial<NewsItem> | null>(null);
  const [isNewsDialogOpen, setIsNewsDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const queryClient = useQueryClient();

  // Fetch News data
  const { data, isPending, error } = useQuery({
    queryKey: ['news'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/api/news`);
      return response.data;
    },
    retry: 2,
    staleTime: 30000
  });

  // Update News data
  const updateNewsMutation = useMutation({
    mutationFn: async (data: NewsData) => {
      const response = await axios.post(`${API_BASE}/api/news`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news'] });
      showMessage('success', 'News updated successfully');
    },
    onError: (error: any) => {
      showMessage('error', error?.response?.data?.error || 'Failed to update news');
    }
  });

  // Upload image
  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await axios.post(`${API_BASE}/api/upload/image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          setUploadProgress(progress);
        },
      });
      return response.data;
    },
    onSuccess: (data) => {
      showMessage('success', 'Image uploaded successfully');
      setIsUploading(false);
      setUploadProgress(0);
    },
    onError: (error: any) => {
      showMessage('error', error?.response?.data?.error || 'Failed to upload image');
      setIsUploading(false);
      setUploadProgress(0);
    }
  });

  // Delete News item
  const deleteNewsMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.delete(`${API_BASE}/api/news/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news'] });
      showMessage('success', 'News item deleted successfully');
    },
    onError: (error: any) => {
      showMessage('error', error?.response?.data?.error || 'Failed to delete news item');
    }
  });

  // Reset News to default
  const resetNewsMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.delete(`${API_BASE}/api/news`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news'] });
      showMessage('success', 'News reset to default');
    },
    onError: (error: any) => {
      showMessage('error', error?.response?.data?.error || 'Failed to reset news');
    }
  });

  useEffect(() => {
    if (data) {
      setNewsData(data);
    }
  }, [data]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const addNews = () => {
    setEditingNews({
      title: '',
      date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      image: '',
      content: '',
      order: newsData?.news.length || 0,
      isActive: true
    });
    setIsNewsDialogOpen(true);
  };

  const editNews = (newsItem: NewsItem) => {
    setEditingNews(newsItem);
    setIsNewsDialogOpen(true);
  };

  const saveNews = async () => {
    if (!editingNews || !newsData) return;

    if (!editingNews.title || !editingNews.content) {
      showMessage('error', 'Title and content are required');
      return;
    }

    let updatedNews: NewsItem[];
    if (editingNews.id) {
      // Update existing news item
      updatedNews = newsData.news.map(item => 
        item.id === editingNews.id ? { ...item, ...editingNews } : item
      );
    } else {
      // Add new news item
      const newNewsItem: NewsItem = {
        ...editingNews as NewsItem,
        id: `news-${Date.now()}`
      };
      updatedNews = [...newsData.news, newNewsItem];
    }

    const updatedData = {
      ...newsData,
      news: updatedNews
    };

    updateNewsMutation.mutate(updatedData);
    setIsNewsDialogOpen(false);
    setEditingNews(null);
  };

  const deleteNews = async (id: string) => {
    if (!newsData) return;

    const updatedNews = newsData.news.filter(item => item.id !== id);
    const updatedData = {
      ...newsData,
      news: updatedNews
    };

    updateNewsMutation.mutate(updatedData);
    setDeleteConfirm({ open: false, id: null });
  };

  const reorderNews = (fromIndex: number, toIndex: number) => {
    if (!newsData) return;

    const updatedNews = [...newsData.news];
    const [movedItem] = updatedNews.splice(fromIndex, 1);
    updatedNews.splice(toIndex, 0, movedItem);

    // Update order numbers
    const reorderedNews = updatedNews.map((item, index) => ({
      ...item,
      order: index
    }));

    const updatedData = {
      ...newsData,
      news: reorderedNews
    };

    updateNewsMutation.mutate(updatedData);
  };

  const updateHero = (field: 'title' | 'subtitle', value: string) => {
    if (!newsData) return;

    const updatedData = {
      ...newsData,
      hero: {
        ...newsData.hero,
        [field]: value
      }
    };

    updateNewsMutation.mutate(updatedData);
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const result = await uploadImageMutation.mutateAsync(file);
      if (editingNews) {
        setEditingNews({ ...editingNews, image: result.imagePath });
      }
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const resolveImageUrl = (path?: string, fallback = '/api/images/placeholder-600x400.jpg') => {
    if (!path) return `${API_BASE}${fallback}`;
    if (path.startsWith('http') || path.startsWith('//')) return path;
    if (path.startsWith('/api/images/')) {
      return `${API_BASE}${path}`;
    }
    return `${API_BASE}${path.startsWith('/') ? path : '/' + path}`;
  };

  if (isPending) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">Failed to load news data. Please try again.</Alert>;
  }

  if (!newsData) {
    return <Alert severity="warning">No news data found. Please contact your administrator.</Alert>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        News Management
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage your news updates and success stories. Changes will appear on your website immediately.
      </Typography>

      {/* Live Preview */}
      <Box sx={{ mb: 4, position: 'relative' }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 2, color: 'primary.main', fontWeight: 'bold' }}>Live Preview - This is how your news section appears to visitors
        </Typography>
        
        <Paper sx={{ p: 3, border: '1px solid #e5e7eb', borderRadius: 2 }}>
          {/* Hero Section Preview */}
          <Box sx={{ 
            background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', 
            color: 'white', 
            p: 4, 
            borderRadius: 2, 
            mb: 3,
            textAlign: 'center'
          }}>
            <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 2 }}>
              {newsData.hero.title}
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, maxWidth: '600px', mx: 'auto' }}>
              {newsData.hero.subtitle}
            </Typography>
          </Box>

          {/* News Items Preview */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {newsData.news
              .filter(item => item.isActive)
              .sort((a, b) => a.order - b.order)
              .map((item, index) => (
                <Card key={item.id || index} sx={{ border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3, p: 3 }}>
                    {/* Content */}
                    <Box sx={{ flex: 1, zIndex: 10 }}>
                      <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                        {item.title}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {item.date}
                        </Typography>
                      </Box>
                      <Typography variant="body1" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                        {item.content}
                      </Typography>
                    </Box>

                    {/* Image */}
                    <Box sx={{ flex: 1, position: 'relative', zIndex: 0 }}>
                      <img
                        src={resolveImageUrl(item.image)}
                        alt={item.title}
                        style={{
                          width: '100%',
                          height: 'auto',
                          borderRadius: '8px',
                          boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                          transform: 'translateX(16px) translateY(-16px)'
                        }}
                        onError={(e: any) => (e.currentTarget.src = `${API_BASE}/api/images/placeholder-600x400.jpg`)}
                      />
                    </Box>
                  </Box>
                </Card>
              ))}
          </Box>
        </Paper>
      </Box>

      {/* Management Controls */}
      <Box sx={{ mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6">News Management</Typography>
          <Box>
            <Button
              variant="outlined"
              startIcon={<NewsIcon />}
              onClick={() => resetNewsMutation.mutate()}
              disabled={resetNewsMutation.isPending}
              sx={{ mr: 2 }}
            >
              Reset to Default
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={addNews}
              disabled={updateNewsMutation.isPending}
            >
              Add News Item
            </Button>
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Manage your news updates and success stories. Click edit to modify existing items or add new ones.
        </Typography>

        {/* Hero Section Controls */}
        <Box sx={{ mb: 3, p: 2, border: '1px solid #e5e7eb', borderRadius: 1 }}>
          <Typography variant="h6" gutterBottom>
            Hero Section Settings
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Hero Title"
                value={newsData.hero.title}
                onChange={(e) => updateHero('title', e.target.value)}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Hero Subtitle"
                value={newsData.hero.subtitle}
                onChange={(e) => updateHero('subtitle', e.target.value)}
                margin="normal"
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </Box>

        {/* News Items List */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {newsData.news
            .sort((a, b) => a.order - b.order)
            .map((item, index) => (
              <Card key={item.id || index} sx={{ border: '1px solid #e5e7eb' }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 500, mb: 1 }}>
                        {item.title}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {item.date}
                        </Typography>
                      </Box>
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ 
                          whiteSpace: 'pre-line',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          mb: 1
                        }}
                      >
                        {item.content}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip 
                          label={item.isActive ? 'Active' : 'Inactive'} 
                          color={item.isActive ? 'success' : 'default'} 
                          size="small" 
                        />
                        <Chip 
                          label={`Order: ${item.order}`} 
                          variant="outlined" 
                          size="small" 
                        />
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => editNews(item)}
                        disabled={updateNewsMutation.isPending}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => setDeleteConfirm({ open: true, id: item.id || null })}
                        disabled={updateNewsMutation.isPending}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
        </Box>
      </Box>

      {/* Add/Edit News Dialog */}
      <Dialog open={isNewsDialogOpen} onClose={() => setIsNewsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingNews?.id ? 'Edit News Item' : 'Add New News Item'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={editingNews?.title || ''}
                onChange={(e) => setEditingNews({ ...editingNews!, title: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Date"
                value={editingNews?.date || ''}
                onChange={(e) => setEditingNews({ ...editingNews!, date: e.target.value })}
                helperText="e.g., August 2025, December 2024"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Image URL or server path"
                value={editingNews?.image || ''}
                onChange={(e) => setEditingNews({ ...editingNews!, image: e.target.value })}
                helperText="Absolute URL or server path like /uploads/.."
              />
            </Grid>
            <Grid item xs={12}>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFileUpload(file);
                  }
                }}
                style={{ display: 'none' }}
                id="image-upload"
              />
              <label htmlFor="image-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<ImageIcon />}
                  disabled={isUploading}
                  sx={{ mb: 2 }}
                >
                  {isUploading ? 'Uploading...' : 'Upload Image'}
                </Button>
              </label>
              {isUploading && (
                <Box sx={{ width: '100%', mb: 2 }}>
                  <LinearProgress variant="determinate" value={uploadProgress} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Uploading... {uploadProgress}%
                  </Typography>
                </Box>
              )}
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Content"
                value={editingNews?.content || ''}
                onChange={(e) => setEditingNews({ ...editingNews!, content: e.target.value })}
                required
                multiline
                rows={6}
                helperText="Use line breaks to format your content. Each line break will be preserved in the display."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Order"
                type="number"
                value={editingNews?.order || 0}
                onChange={(e) => setEditingNews({ ...editingNews!, order: parseInt(e.target.value) || 0 })}
                helperText="Lower numbers appear first"
              />
            </Grid>
            <Grid item xs={12}>
              {editingNews?.image && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <img 
                    src={resolveImageUrl(editingNews.image)} 
                    alt="preview" 
                    style={{ 
                      width: '200px', 
                      height: '150px', 
                      objectFit: 'cover', 
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb'
                    }}
                    onError={(e: any) => (e.currentTarget.src = `${API_BASE}/api/images/placeholder-600x400.jpg`)}
                  />
                  <Chip label={resolveImageUrl(editingNews.image)} size="small" />
                </Box>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsNewsDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={saveNews} 
            variant="contained" 
            disabled={updateNewsMutation.isPending || !editingNews?.title || !editingNews?.content}
          >
            {updateNewsMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm.open} onClose={() => setDeleteConfirm({ open: false, id: null })}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this news item? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm({ open: false, id: null })}>
            Cancel
          </Button>
          <Button 
            onClick={() => deleteConfirm.id && deleteNews(deleteConfirm.id)} 
            color="error" 
            variant="contained"
            disabled={deleteNewsMutation.isPending}
          >
            {deleteNewsMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Add Button */}
      <Fab
        color="primary"
        aria-label="add news"
        onClick={addNews}
        disabled={updateNewsMutation.isPending}
        sx={{
          position: "fixed",
          bottom: 20,
          right: 20,
          zIndex: 1000,
        }}
      >
        <AddIcon />
      </Fab>

      {/* Success/Error Messages */}
      <Snackbar
        open={!!message}
        autoHideDuration={5000}
        onClose={() => setMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setMessage(null)} severity={message?.type} sx={{ width: '100%' }}>
          {message?.text}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default NewsEditor;