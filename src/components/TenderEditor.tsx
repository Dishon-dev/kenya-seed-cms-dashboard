import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  Snackbar,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Description as DescriptionIcon,
  CalendarToday as CalendarIcon,
  Assignment as AssignmentIcon,
  CloudUpload as UploadIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

interface Tender {
  id: string;
  tenderNo: string;
  description: string;
  startDate: string;
  closingDate: string;
  fileUrl?: string | null;
  documents?: {
    id: string;
    filename: string;
    mimeType?: string;
    size?: number;
    fileUrl: string;
    order?: number;
    isActive?: boolean;
  }[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TendersData {
  id: string;
  hero: {
    title: string;
    subtitle: string;
  };
  tenders: Tender[];
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5001';

const TenderEditor: React.FC = () => {
  const [tendersData, setTendersData] = useState<TendersData | null>(null);
  const [editingTender, setEditingTender] = useState<Tender | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [tenderToDelete, setTenderToDelete] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [uploadingFile, setUploadingFile] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const queryClient = useQueryClient();

  // Database-first approach - no local storage fallback needed

  // Fetch tenders from database
  const { data: tendersResponse, isLoading, error } = useQuery({
    queryKey: ['tenders'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/api/tenders`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      return response.data;
    },
    retry: 2,
    staleTime: 30000
  });

  useEffect(() => {
    if (tendersResponse) {
      setTendersData(tendersResponse);
    }
  }, [tendersResponse]);

  // Update tenders mutation
  const updateTendersMutation = useMutation({
    mutationFn: async (data: TendersData) => {
      const response = await axios.post(`${API_BASE}/api/tenders`, data, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['tenders'], data);
      setTendersData(data);
      setMessage({ type: 'success', text: 'Tenders updated successfully' });
    },
    onError: (error: any) => {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to update tenders' 
      });
    }
  });

  // Create tender mutation
  const createTenderMutation = useMutation({
    mutationFn: async (tenderData: Partial<Tender>) => {
      const response = await axios.post(`${API_BASE}/api/tenders/create`, tenderData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    },
    onSuccess: (newTender) => {
      if (tendersData) {
        const updatedTenders = [...tendersData.tenders, newTender];
        const updatedData = { ...tendersData, tenders: updatedTenders };
        queryClient.setQueryData(['tenders'], updatedData);
        setTendersData(updatedData);
      }
      setMessage({ type: 'success', text: 'Tender created successfully' });
      setIsDialogOpen(false);
      setEditingTender(null);
    },
    onError: (error: any) => {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to create tender' 
      });
    }
  });

  // Update tender mutation
  const updateTenderMutation = useMutation({
    mutationFn: async ({ id, ...tenderData }: Partial<Tender> & { id: string }) => {
      // tenderData already excludes id due to destructuring, so we can use it directly
      console.log(`Sending update request for tender ${id}:`, tenderData);
      const response = await axios.put(`${API_BASE}/api/tenders/${id}`, tenderData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      console.log(`Received response:`, response.data);
      // API returns { success: true, data: updatedTender, message: '...' }
      return response.data.data || response.data;
    },
    onSuccess: (updatedTender) => {
      console.log('Tender updated successfully:', updatedTender);
      if (tendersData) {
        const updatedTenders = tendersData.tenders.map(tender => 
          tender.id === updatedTender.id ? updatedTender : tender
        );
        const updatedData = { ...tendersData, tenders: updatedTenders };
        queryClient.setQueryData(['tenders'], updatedData);
        setTendersData(updatedData);
      }
      // Only show dialog message if dialog is open (for edit operations)
      // For toggle operations, show snackbar instead
      if (isDialogOpen) {
      setMessage({ type: 'success', text: 'Tender updated successfully' });
      setIsDialogOpen(false);
      setEditingTender(null);
      } else {
        // For toggle operations, show snackbar
        setSnackbar({ 
          open: true, 
          message: `Tender ${updatedTender.isActive ? 'activated' : 'deactivated'} successfully`, 
          severity: 'success' 
        });
      }
    },
    onError: (error: any) => {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to update tender' 
      });
    }
  });

  // Delete tender mutation
  const deleteTenderMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.delete(`${API_BASE}/api/tenders/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['tenders'], data);
      setTendersData(data);
      setMessage({ type: 'success', text: 'Tender deleted successfully' });
      setIsDeleteDialogOpen(false);
      setTenderToDelete(null);
    },
    onError: (error: any) => {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to delete tender' 
      });
    }
  });

  // File upload mutation
  const uploadFileMutation = useMutation({
    mutationFn: async ({ tenderId, files }: { tenderId: string; files: File[] }) => {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));

      const response = await axios.post(`${API_BASE}/api/tenders/${tenderId}/documents`, formData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    },
    onSuccess: (data) => {
      setSnackbar({ open: true, message: 'Documents uploaded successfully', severity: 'success' });
      return data;
    },
    onError: (error: any) => {
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.error || 'Failed to upload documents', 
        severity: 'error' 
      });
    }
  });

  const handleAddTender = () => {
    setEditingTender({
      id: '',
      tenderNo: '',
      description: '',
      startDate: '',
      closingDate: '',
      fileUrl: null,
      isActive: true,
      createdAt: '',
      updatedAt: ''
    });
    setIsDialogOpen(true);
  };

  const handleEditTender = (tender: Tender) => {
    setEditingTender(tender);
    setIsDialogOpen(true);
  };

  const handleDeleteTender = (id: string) => {
    setTenderToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleToggleTender = (tender: Tender) => {
    console.log(`Toggling tender ${tender.id} from ${tender.isActive} to ${!tender.isActive}`);
    // Only send the isActive field to toggle
    updateTenderMutation.mutate({
      id: tender.id,
      isActive: !tender.isActive
    }, {
      onError: (error: any) => {
        console.error('Error toggling tender:', error);
        console.error('Error response:', error.response?.data);
        const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to update tender status';
        setSnackbar({ 
          open: true, 
          message: errorMessage, 
          severity: 'error' 
        });
      }
    });
  };

  const confirmDeleteTender = () => {
    if (tenderToDelete) {
      deleteTenderMutation.mutate(tenderToDelete);
    }
  };

  const handleSaveTender = () => {
    if (!editingTender) return;

    const tenderData = {
      tenderNo: editingTender.tenderNo,
      description: editingTender.description,
      startDate: editingTender.startDate,
      closingDate: editingTender.closingDate,
      fileUrl: editingTender.fileUrl,
      isActive: editingTender.isActive
    };

    if (editingTender.id) {
      updateTenderMutation.mutate({ id: editingTender.id, ...tenderData });
    } else {
      createTenderMutation.mutate(tenderData);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    if (files.length === 0) return;
    if (!editingTender?.id) {
      setSnackbar({ open: true, message: 'Please save the tender before uploading documents.', severity: 'error' });
      return;
    }

    setUploadingFile(true);
    try {
      const result = await uploadFileMutation.mutateAsync({ tenderId: editingTender.id, files });
      const uploaded = result?.documents || [];
      if (editingTender) {
        const updatedDocuments = [...(editingTender.documents || []), ...uploaded];
        setEditingTender({ ...editingTender, documents: updatedDocuments });
        if (tendersData) {
          const updatedTenders = tendersData.tenders.map(tender =>
            tender.id === editingTender.id ? { ...tender, documents: updatedDocuments } : tender
          );
          setTendersData({ ...tendersData, tenders: updatedTenders });
        }
      }
    } catch (error) {
      console.error('File upload error:', error);
    } finally {
      setUploadingFile(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatus = (tender: Tender) => {
    const now = new Date();
    const closingDate = new Date(tender.closingDate);
    return closingDate > now ? 'Open' : 'Closed';
  };

  const getStatusColor = (tender: Tender) => {
    const status = getStatus(tender);
    return status === 'Open' ? 'success' : 'error';
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Failed to load tenders. Please try again.
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1">
          Tender Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddTender}
          disabled={createTenderMutation.isPending}
        >
          Add New Tender
        </Button>
      </Box>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Manage tender opportunities, upload documents, and track submission deadlines.
      </Typography>

      {/* Live Preview */}
      {tendersData && (
        <Box sx={{ mb: 4, position: 'relative' }}>
          <Typography variant="h5" gutterBottom sx={{ mb: 2, color: 'primary.main', fontWeight: 'bold' }}>Live Preview - This is how your tenders page appears to visitors
          </Typography>
          
          <Paper sx={{ p: 3, bgcolor: '#f0fdf4', maxHeight: '600px', overflow: 'auto' }}>
            <div className="w-full max-w-6xl mx-auto">
              {/* Hero Section */}
              <section className="py-32 gradient-primary text-primary-foreground text-center">
                <div className="container mx-auto px-4">
                  <h1 className="text-5xl lg:text-6xl font-bold mb-6 text-white">
                    {tendersData.hero.title}
                  </h1>
                  <p className="text-lg lg:text-xl max-w-3xl mx-auto leading-relaxed mt-4 text-white/90">
                    {tendersData.hero.subtitle}
                  </p>
                </div>
              </section>

              {/* Tender List */}
              <div className="container mx-auto p-6">
                <h2 className="text-2xl font-bold mb-4">Available Tenders</h2>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="border px-4 py-2">No</th>
                        <th className="border px-4 py-2">Tender No</th>
                        <th className="border px-4 py-2">Tender Description</th>
                        <th className="border px-4 py-2">Start Date</th>
                        <th className="border px-4 py-2">Closing Date</th>
                        <th className="border px-4 py-2">Status</th>
                        <th className="border px-4 py-2">Download</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tendersData.tenders.length > 0 ? (
                        tendersData.tenders
                          .filter(tender => tender.isActive)
                          .map((tender, idx) => {
                            const status = new Date(tender.closingDate) > new Date() ? "Open" : "Closed";
                            return (
                              <tr key={tender.id || `tender-row-${idx}`}>
                                <td className="border px-4 py-2">{idx + 1}</td>
                                <td className="border px-4 py-2">{tender.tenderNo}</td>
                                <td className="border px-4 py-2">{tender.description}</td>
                                <td className="border px-4 py-2">{tender.startDate}</td>
                                <td className="border px-4 py-2">{tender.closingDate}</td>
                                <td className="border px-4 py-2">{status}</td>
                                <td className="border px-4 py-2">
                                  {tender.documents && tender.documents.length > 0 ? (
                                    <a
                                      href={`${API_BASE}${tender.documents[0].fileUrl}`}
                                      className="text-blue-600 underline"
                                      target="_blank"
                                      rel="noreferrer"
                                    >
                                      Download ({tender.documents.length})
                                    </a>
                                  ) : tender.fileUrl ? (
                                    <a
                                      href={`${API_BASE}${tender.fileUrl}`}
                                      className="text-blue-600 underline"
                                      target="_blank"
                                      rel="noreferrer"
                                    >
                                      Download
                                    </a>
                                  ) : (
                                    "No file"
                                  )}
                                </td>
                              </tr>
                            );
                          })
                      ) : (
                        <tr>
                          <td colSpan={7} className="text-center py-4 text-gray-500 border">
                            No tenders available.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </Paper>
        </Box>
      )}

      {/* Hero Section Management */}
      {tendersData && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Hero Section Settings
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Hero Title"
                  value={tendersData.hero.title}
                  onChange={(e) => {
                    const updatedData = {
                      ...tendersData,
                      hero: { ...tendersData.hero, title: e.target.value }
                    };
                    setTendersData(updatedData);
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Hero Subtitle"
                  value={tendersData.hero.subtitle}
                  onChange={(e) => {
                    const updatedData = {
                      ...tendersData,
                      hero: { ...tendersData.hero, subtitle: e.target.value }
                    };
                    setTendersData(updatedData);
                  }}
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  onClick={() => updateTendersMutation.mutate(tendersData)}
                  disabled={updateTendersMutation.isPending}
                  startIcon={<SaveIcon />}
                >
                  {updateTendersMutation.isPending ? 'Saving...' : 'Save Hero Settings'}
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Tenders Table */}
      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tender No</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>Closing Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>File</TableCell>
              <TableCell>Active</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tendersData?.tenders.map((tender, idx) => (
              <TableRow key={tender.id || `tender-row-${idx}`}>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {tender.tenderNo}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ maxWidth: 300 }}>
                    {tender.description}
                  </Typography>
                </TableCell>
                <TableCell>{formatDate(tender.startDate)}</TableCell>
                <TableCell>{formatDate(tender.closingDate)}</TableCell>
                <TableCell>
                  <Chip
                    label={getStatus(tender)}
                    color={getStatusColor(tender)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {tender.documents && tender.documents.length > 0 ? (
                    <Box display="flex" gap={1} flexWrap="wrap">
                      {tender.documents.map((doc, docIndex) => (
                        <IconButton
                          key={doc.id || doc.fileUrl || `doc-${docIndex}`}
                          size="small"
                          onClick={() => window.open(`${API_BASE}${doc.fileUrl}`, '_blank')}
                          title={doc.filename || 'View Document'}
                        >
                          <ViewIcon />
                        </IconButton>
                      ))}
                      <Typography variant="body2" color="text.secondary">
                        {tender.documents.length} docs
                      </Typography>
                    </Box>
                  ) : tender.fileUrl ? (
                    <Box display="flex" gap={1}>
                      <IconButton
                        size="small"
                        onClick={() => window.open(`${API_BASE}${tender.fileUrl}`, '_blank')}
                        title="View File"
                      >
                        <ViewIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = `${API_BASE}${tender.fileUrl}`;
                          link.download = `tender-${tender.tenderNo}.pdf`;
                          link.click();
                        }}
                        title="Download File"
                      >
                        <DownloadIcon />
                      </IconButton>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No file
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={tender.isActive}
                        onChange={() => handleToggleTender(tender)}
                        disabled={updateTenderMutation.isPending}
                        color="primary"
                      />
                    }
                    label={tender.isActive ? 'Active' : 'Inactive'}
                    labelPlacement="end"
                  />
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleEditTender(tender)}
                    disabled={updateTenderMutation.isPending}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteTender(tender.id)}
                    color="error"
                    disabled={deleteTenderMutation.isPending}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {tendersData?.tenders.length === 0 && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <AssignmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Tenders Found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Start by adding your first tender opportunity.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddTender}
            >
              Add First Tender
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Tender Dialog */}
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingTender?.id ? 'Edit Tender' : 'Add New Tender'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Tender Number"
                value={editingTender?.tenderNo || ''}
                onChange={(e) => setEditingTender({ ...editingTender!, tenderNo: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={editingTender?.startDate || ''}
                onChange={(e) => setEditingTender({ ...editingTender!, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Closing Date"
                type="date"
                value={editingTender?.closingDate || ''}
                onChange={(e) => setEditingTender({ ...editingTender!, closingDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={editingTender?.isActive || false}
                    onChange={(e) => setEditingTender({ ...editingTender!, isActive: e.target.checked })}
                  />
                }
                label="Active"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={editingTender?.description || ''}
                onChange={(e) => setEditingTender({ ...editingTender!, description: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Tender Documents
              </Typography>
              <Box display="flex" alignItems="center" gap={2}>
                <input
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg"
                  style={{ display: 'none' }}
                  id="file-upload"
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                />
                <label htmlFor="file-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<UploadIcon />}
                    disabled={uploadingFile}
                  >
                    {uploadingFile ? 'Uploading...' : 'Upload Documents'}
                  </Button>
                </label>
              </Box>
              {(editingTender?.documents?.length || editingTender?.fileUrl) ? (
                <Box mt={2} display="flex" flexDirection="column" gap={1}>
                  {editingTender.documents?.map((doc, docIndex) => (
                    <Box key={doc.id || doc.fileUrl || `doc-${docIndex}`} display="flex" alignItems="center" gap={1}>
                      <DescriptionIcon color="primary" />
                      <Typography variant="body2">{doc.filename || 'Document'}</Typography>
                      <IconButton
                        size="small"
                        onClick={() => window.open(`${API_BASE}${doc.fileUrl}`, '_blank')}
                      >
                        <ViewIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = `${API_BASE}${doc.fileUrl}`;
                          link.download = doc.filename || 'tender-document';
                          link.click();
                        }}
                      >
                        <DownloadIcon />
                      </IconButton>
                    </Box>
                  ))}
                  {!editingTender.documents?.length && editingTender.fileUrl && (
                    <Box display="flex" alignItems="center" gap={1}>
                      <DescriptionIcon color="primary" />
                      <Typography variant="body2" color="primary">
                        Document uploaded
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => window.open(`${API_BASE}${editingTender.fileUrl}`, '_blank')}
                      >
                        <ViewIcon />
                      </IconButton>
                    </Box>
                  )}
                </Box>
              ) : null}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveTender}
            variant="contained"
            disabled={createTenderMutation.isPending || updateTenderMutation.isPending}
          >
            {createTenderMutation.isPending || updateTenderMutation.isPending ? (
              <CircularProgress size={20} />
            ) : (
              editingTender?.id ? 'Update' : 'Create'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this tender? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={confirmDeleteTender}
            color="error"
            variant="contained"
            disabled={deleteTenderMutation.isPending}
          >
            {deleteTenderMutation.isPending ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TenderEditor;
