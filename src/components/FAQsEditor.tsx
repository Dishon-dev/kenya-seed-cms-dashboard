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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Divider,
  CircularProgress,
  Fab,
  Paper
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  ExpandMore as ExpandMoreIcon,
  QuestionAnswer as QuestionIcon,
  Help as HelpIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5001';

interface FAQ {
  id?: string;
  question: string;
  answer: string;
  order: number;
  isActive: boolean;
}

interface FAQsData {
  id: string;
  hero: {
    title: string;
    subtitle: string;
  };
  faqs: FAQ[];
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

const FAQsEditor: React.FC = () => {
  const [faqsData, setFaqsData] = useState<FAQsData | null>(null);
  const [editingFAQ, setEditingFAQ] = useState<Partial<FAQ> | null>(null);
  const [isFaqDialogOpen, setIsFaqDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const queryClient = useQueryClient();

  // Fetch FAQs data
  const { data, isPending, error } = useQuery({
    queryKey: ['faqs'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/api/faqs`);
      return response.data;
    },
    retry: 2,
    staleTime: 30000
  });

  // Update FAQs data
  const updateFaqsMutation = useMutation({
    mutationFn: async (data: FAQsData) => {
      const response = await axios.post(`${API_BASE}/api/faqs`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      showMessage('success', 'FAQs updated successfully');
    },
    onError: (error: any) => {
      showMessage('error', error?.response?.data?.error || 'Failed to update FAQs');
    }
  });

  // Delete FAQ
  const deleteFaqMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.delete(`${API_BASE}/api/faqs/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      showMessage('success', 'FAQ deleted successfully');
    },
    onError: (error: any) => {
      showMessage('error', error?.response?.data?.error || 'Failed to delete FAQ');
    }
  });

  // Reset FAQs to default
  const resetFaqsMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.delete(`${API_BASE}/api/faqs`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      showMessage('success', 'FAQs reset to default');
    },
    onError: (error: any) => {
      showMessage('error', error?.response?.data?.error || 'Failed to reset FAQs');
    }
  });

  useEffect(() => {
    if (data) {
      setFaqsData(data);
    }
  }, [data]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const addFaq = () => {
    setEditingFAQ({
      question: '',
      answer: '',
      order: faqsData?.faqs.length || 0,
      isActive: true
    });
    setIsFaqDialogOpen(true);
  };

  const editFaq = (faq: FAQ) => {
    setEditingFAQ(faq);
    setIsFaqDialogOpen(true);
  };

  const saveFaq = async () => {
    if (!editingFAQ || !faqsData) return;

    if (!editingFAQ.question || !editingFAQ.answer) {
      showMessage('error', 'Question and answer are required');
      return;
    }

    let updatedFaqs: FAQ[];
    if (editingFAQ.id) {
      // Update existing FAQ
      updatedFaqs = faqsData.faqs.map(faq => 
        faq.id === editingFAQ.id ? { ...faq, ...editingFAQ } : faq
      );
    } else {
      // Add new FAQ
      const newFaq: FAQ = {
        ...editingFAQ as FAQ,
        id: `faq-${Date.now()}`
      };
      updatedFaqs = [...faqsData.faqs, newFaq];
    }

    const updatedData = {
      ...faqsData,
      faqs: updatedFaqs
    };

    updateFaqsMutation.mutate(updatedData);
    setIsFaqDialogOpen(false);
    setEditingFAQ(null);
  };

  const deleteFaq = async (id: string) => {
    if (!faqsData) return;

    const updatedFaqs = faqsData.faqs.filter(faq => faq.id !== id);
    const updatedData = {
      ...faqsData,
      faqs: updatedFaqs
    };

    updateFaqsMutation.mutate(updatedData);
    setDeleteConfirm({ open: false, id: null });
  };

  const reorderFaq = (fromIndex: number, toIndex: number) => {
    if (!faqsData) return;

    const updatedFaqs = [...faqsData.faqs];
    const [movedFaq] = updatedFaqs.splice(fromIndex, 1);
    updatedFaqs.splice(toIndex, 0, movedFaq);

    // Update order numbers
    const reorderedFaqs = updatedFaqs.map((faq, index) => ({
      ...faq,
      order: index
    }));

    const updatedData = {
      ...faqsData,
      faqs: reorderedFaqs
    };

    updateFaqsMutation.mutate(updatedData);
  };

  const updateHero = (field: 'title' | 'subtitle', value: string) => {
    if (!faqsData) return;

    const updatedData = {
      ...faqsData,
      hero: {
        ...faqsData.hero,
        [field]: value
      }
    };

    updateFaqsMutation.mutate(updatedData);
  };

  if (isPending) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">Failed to load FAQs data. Please try again.</Alert>;
  }

  if (!faqsData) {
    return <Alert severity="warning">No FAQs data found. Please contact your administrator.</Alert>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        FAQs Management
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage your frequently asked questions and hero section content. Changes will appear on your website immediately.
      </Typography>

      {/* Live Preview */}
      <Box sx={{ mb: 4, position: 'relative' }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 2, color: 'primary.main', fontWeight: 'bold' }}>Live Preview - This is how your FAQs section appears to visitors
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
              {faqsData.hero.title}
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, maxWidth: '600px', mx: 'auto' }}>
              {faqsData.hero.subtitle}
            </Typography>
          </Box>

          {/* FAQs Preview */}
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 3 }}>
            Frequently Asked Questions (FAQs)
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {faqsData.faqs
              .filter(faq => faq.isActive)
              .sort((a, b) => a.order - b.order)
              .map((faq, index) => (
                <Accordion key={faq.id || index} sx={{ border: '1px solid #e5e7eb', borderRadius: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6" sx={{ fontWeight: 500 }}>
                      {faq.question}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography sx={{ whiteSpace: 'pre-line', color: 'text.secondary' }}>
                      {faq.answer}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
          </Box>
        </Paper>
      </Box>

      {/* Management Controls */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Management Controls</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {/* Hero Section Controls */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Hero Section Settings
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Hero Title"
                  value={faqsData.hero.title}
                  onChange={(e) => updateHero('title', e.target.value)}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Hero Subtitle"
                  value={faqsData.hero.subtitle}
                  onChange={(e) => updateHero('subtitle', e.target.value)}
                  margin="normal"
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* FAQs Management */}
          <Box sx={{ mb: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6">FAQs Management</Typography>
              <Box>
                <Button
                  variant="outlined"
                  startIcon={<HelpIcon />}
                  onClick={() => resetFaqsMutation.mutate()}
                  disabled={resetFaqsMutation.isPending}
                  sx={{ mr: 2 }}
                >
                  Reset to Default
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={addFaq}
                  disabled={updateFaqsMutation.isPending}
                >
                  Add FAQ
                </Button>
              </Box>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Manage your frequently asked questions. Click edit to modify existing FAQs or add new ones.
            </Typography>

            {/* FAQs List */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {faqsData.faqs
                .sort((a, b) => a.order - b.order)
                .map((faq, index) => (
                  <Card key={faq.id || index} sx={{ border: '1px solid #e5e7eb' }}>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 500, mb: 1 }}>
                            {faq.question}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            sx={{ 
                              whiteSpace: 'pre-line',
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}
                          >
                            {faq.answer}
                          </Typography>
                          <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                            <Chip 
                              label={faq.isActive ? 'Active' : 'Inactive'} 
                              color={faq.isActive ? 'success' : 'default'} 
                              size="small" 
                            />
                            <Chip 
                              label={`Order: ${faq.order}`} 
                              variant="outlined" 
                              size="small" 
                            />
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => editFaq(faq)}
                            disabled={updateFaqsMutation.isPending}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => setDeleteConfirm({ open: true, id: faq.id || null })}
                            disabled={updateFaqsMutation.isPending}
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
        </AccordionDetails>
      </Accordion>

      {/* Add/Edit FAQ Dialog */}
      <Dialog open={isFaqDialogOpen} onClose={() => setIsFaqDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingFAQ?.id ? 'Edit FAQ' : 'Add New FAQ'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Question"
                value={editingFAQ?.question || ''}
                onChange={(e) => setEditingFAQ({ ...editingFAQ!, question: e.target.value })}
                required
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Answer"
                value={editingFAQ?.answer || ''}
                onChange={(e) => setEditingFAQ({ ...editingFAQ!, answer: e.target.value })}
                required
                multiline
                rows={6}
                helperText="Use line breaks to format your answer. Each line break will be preserved in the display."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Order"
                type="number"
                value={editingFAQ?.order || 0}
                onChange={(e) => setEditingFAQ({ ...editingFAQ!, order: parseInt(e.target.value) || 0 })}
                helperText="Lower numbers appear first"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsFaqDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={saveFaq} 
            variant="contained" 
            disabled={updateFaqsMutation.isPending || !editingFAQ?.question || !editingFAQ?.answer}
          >
            {updateFaqsMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm.open} onClose={() => setDeleteConfirm({ open: false, id: null })}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this FAQ? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm({ open: false, id: null })}>
            Cancel
          </Button>
          <Button 
            onClick={() => deleteConfirm.id && deleteFaq(deleteConfirm.id)} 
            color="error" 
            variant="contained"
            disabled={deleteFaqMutation.isPending}
          >
            {deleteFaqMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Add Button */}
      <Fab
        color="primary"
        aria-label="add faq"
        onClick={addFaq}
        disabled={updateFaqsMutation.isPending}
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

export default FAQsEditor;
