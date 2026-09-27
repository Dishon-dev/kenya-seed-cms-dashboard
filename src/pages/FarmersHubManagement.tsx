import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
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
  LinearProgress,
  Tooltip,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
  PictureAsPdf as PdfIcon,
  Visibility as ViewIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import FarmersBlogManagement from './FarmersBlogManagement';
import FarmersTestimonialsManagement from './FarmersTestimonialsManagement';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5001';

interface FarmersHubDocument {
  id: number;
  document_type: string;
  title: string;
  description: string | null;
  pdf_filename: string | null;
  pdf_size: number | null;
  is_active: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

const FarmersHubManagement: React.FC = () => {
  const [documents, setDocuments] = useState<FarmersHubDocument[]>([]);
  const [editingDocument, setEditingDocument] = useState<Partial<FarmersHubDocument> | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeType, setActiveType] = useState<string>('all');
  const [uploadTargetId, setUploadTargetId] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState<'hub' | 'blog' | 'support' | 'testimonials'>('hub');

  const queryClient = useQueryClient();
  const quickPdfInputRef = useRef<HTMLInputElement>(null);
  const normalizeType = (value: string) =>
    value.trim().toLowerCase().replace(/\s+/g, '-');

  // Fetch documents
  const { data: documentsResponse, isLoading, error } = useQuery({
    queryKey: ['farmers-hub-documents'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/api/cms/farmers-hub/documents`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      return response.data;
    },
    retry: 2,
    staleTime: 30000
  });

  useEffect(() => {
    if (documentsResponse?.documents) {
      setDocuments(documentsResponse.documents);
    }
  }, [documentsResponse]);

  // Create/Update mutation
  const saveDocumentMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const documentId = editingDocument?.id;
      if (documentId) {
        return axios.put(`${API_BASE}/api/cms/farmers-hub/documents/${documentId}`, data, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress(percentCompleted);
            }
          }
        });
      } else {
        return axios.post(`${API_BASE}/api/cms/farmers-hub/documents`, data, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress(percentCompleted);
            }
          }
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farmers-hub-documents'] });
      setIsDialogOpen(false);
      setEditingDocument(null);
      setSelectedFile(null);
      setUploadProgress(0);
      setIsUploading(false);
      setMessage({ type: 'success', text: 'Document saved successfully!' });
      setTimeout(() => setMessage(null), 3000);
    },
    onError: (error: any) => {
      setIsUploading(false);
      setUploadProgress(0);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to save document' });
      setTimeout(() => setMessage(null), 5000);
    }
  });

  // Delete mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: async (id: number) => {
      return axios.delete(`${API_BASE}/api/cms/farmers-hub/documents/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farmers-hub-documents'] });
      setIsDeleteDialogOpen(false);
      setDocumentToDelete(null);
      setMessage({ type: 'success', text: 'Document deleted successfully!' });
      setTimeout(() => setMessage(null), 3000);
    },
    onError: (error: any) => {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to delete document' });
      setTimeout(() => setMessage(null), 5000);
    }
  });

  // Upload PDF only mutation
  const uploadPdfMutation = useMutation({
    mutationFn: async ({ id, file }: { id: number; file: File }) => {
      const formData = new FormData();
      formData.append('pdf', file);
      return axios.post(`${API_BASE}/api/cms/farmers-hub/documents/${id}/pdf`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farmers-hub-documents'] });
      setSelectedFile(null);
      setUploadProgress(0);
      setIsUploading(false);
      setMessage({ type: 'success', text: 'PDF uploaded successfully!' });
      setTimeout(() => setMessage(null), 3000);
    },
    onError: (error: any) => {
      setIsUploading(false);
      setUploadProgress(0);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to upload PDF' });
      setTimeout(() => setMessage(null), 5000);
    }
  });

  const handleEdit = (document: FarmersHubDocument) => {
    setEditingDocument(document);
    setSelectedFile(null);
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingDocument({
      document_type: activeType === 'all' ? '' : activeType,
      title: '',
      description: '',
      order_index: documents.length,
      is_active: true
    });
    setSelectedFile(null);
    setIsDialogOpen(true);
  };

  const handleAddSupport = () => {
    setEditingDocument({
      document_type: 'support-services',
      title: '',
      description: '',
      order_index: documents.length,
      is_active: true
    });
    setSelectedFile(null);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    setDocumentToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleSave = () => {
    if (!editingDocument?.document_type || !editingDocument?.title) {
      setMessage({ type: 'error', text: 'Document type and title are required' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('document_type', normalizeType(editingDocument.document_type));
    formData.append('title', editingDocument.title);
    if (editingDocument.description) {
      formData.append('description', editingDocument.description);
    }
    formData.append('order_index', String(editingDocument.order_index || 0));
    formData.append('is_active', String(editingDocument.is_active || true));
    
    if (selectedFile) {
      formData.append('pdf', selectedFile);
    }

    saveDocumentMutation.mutate(formData);
  };

  const handleUploadPdf = (id: number, file: File) => {
    setIsUploading(true);
    uploadPdfMutation.mutate({ id, file });
  };

  const handleDialogFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.type !== 'application/pdf') {
        setMessage({ type: 'error', text: 'Please select a PDF file' });
        setTimeout(() => setMessage(null), 3000);
        return;
      }
      setSelectedFile(file);
    }
  };

  const triggerQuickUpload = (id: number) => {
    setUploadTargetId(id);
    if (quickPdfInputRef.current) {
      quickPdfInputRef.current.value = '';
      quickPdfInputRef.current.click();
    }
  };

  const handleQuickUploadFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!uploadTargetId || !event.target.files || !event.target.files[0]) {
      return;
    }
    const file = event.target.files[0];
    if (file.type !== 'application/pdf') {
      setMessage({ type: 'error', text: 'Please select a PDF file' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    handleUploadPdf(uploadTargetId, file);
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const viewPdf = (type: string) => {
    window.open(`${API_BASE}/api/farmers-hub/pdf/${encodeURIComponent(type)}`, '_blank');
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
        <Alert severity="error">Failed to load farmers hub documents. Please try again.</Alert>
      </Box>
    );
  }

  const documentTypes = Array.from(
    new Set(documents.map((doc) => doc.document_type).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));
  const filteredDocuments = activeType === 'all'
    ? documents
    : documents.filter((doc) => doc.document_type === activeType);
  const supportDocuments = documents.filter((doc) => doc.document_type === 'support-services');

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Farmers Hub Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage documents for the Farmers Hub and Farmers Blog sections on the website
          </Typography>
        </Box>
        {activeSection === 'hub' && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAdd}
            color="primary"
          >
            Add Document
          </Button>
        )}
        {activeSection === 'support' && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddSupport}
            color="primary"
          >
            Add Support Document
          </Button>
        )}
      </Box>

      {message && (
        <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <Box sx={{ mb: 2 }}>
        <Tabs
          value={activeSection}
          onChange={(_, value) => setActiveSection(value)}
          variant="standard"
          aria-label="Farmers hub sections"
        >
          <Tab label="Hub Documents" value="hub" />
          <Tab label="Support Services" value="support" />
          <Tab label="Farmers Blog" value="blog" />
          <Tab label="Testimonials" value="testimonials" />
        </Tabs>
      </Box>

      {activeSection === 'hub' ? (
        <>
          <input
            ref={quickPdfInputRef}
            type="file"
            hidden
            accept="application/pdf"
            onChange={handleQuickUploadFileChange}
          />

          <Box sx={{ mb: 2 }}>
            <Tabs
              value={activeType}
              onChange={(_, value) => setActiveType(value)}
              variant="scrollable"
              scrollButtons="auto"
              aria-label="Farmers hub document navigation"
            >
              <Tab label="All" value="all" />
              {documentTypes.map((type) => (
                <Tab
                  key={type}
                  label={type.replace(/-/g, ' ')}
                  value={type}
                />
              ))}
            </Tabs>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Order</TableCell>
                  <TableCell>Document Type</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>PDF File</TableCell>
                  <TableCell>Size</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredDocuments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography variant="body2" color="text.secondary" py={3}>
                        No documents found for this section. Click "Add Document" to create one.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDocuments.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>{doc.order_index}</TableCell>
                      <TableCell>
                        <Chip label={doc.document_type} size="small" />
                      </TableCell>
                      <TableCell>{doc.title}</TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                          {doc.description || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {doc.pdf_filename ? (
                          <Box display="flex" alignItems="center" gap={1}>
                            <PdfIcon color="error" fontSize="small" />
                            <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                              {doc.pdf_filename}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No PDF
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{formatFileSize(doc.pdf_size)}</TableCell>
                      <TableCell>
                        <Chip
                          label={doc.is_active ? 'Active' : 'Inactive'}
                          color={doc.is_active ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Box display="flex" gap={1} justifyContent="flex-end">
                          {doc.pdf_filename && (
                            <Tooltip title="View PDF">
                              <IconButton
                                size="small"
                                onClick={() => viewPdf(doc.document_type)}
                                color="primary"
                              >
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Upload PDF">
                            <IconButton
                              size="small"
                              onClick={() => triggerQuickUpload(doc.id)}
                              color="primary"
                            >
                              <UploadIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => handleEdit(doc)}
                              color="primary"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(doc.id)}
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
        </>
      ) : activeSection === 'support' ? (
        <>
          <input
            ref={quickPdfInputRef}
            type="file"
            hidden
            accept="application/pdf"
            onChange={handleQuickUploadFileChange}
          />
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Order</TableCell>
                  <TableCell>Document Type</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>PDF File</TableCell>
                  <TableCell>Size</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {supportDocuments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography variant="body2" color="text.secondary" py={3}>
                        No support services document yet. Click "Add Support Document" to create one.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  supportDocuments.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>{doc.order_index}</TableCell>
                      <TableCell>
                        <Chip label={doc.document_type} size="small" />
                      </TableCell>
                      <TableCell>{doc.title}</TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                          {doc.description || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {doc.pdf_filename ? (
                          <Box display="flex" alignItems="center" gap={1}>
                            <PdfIcon color="error" fontSize="small" />
                            <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                              {doc.pdf_filename}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No PDF
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{formatFileSize(doc.pdf_size)}</TableCell>
                      <TableCell>
                        <Chip
                          label={doc.is_active ? 'Active' : 'Inactive'}
                          color={doc.is_active ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Box display="flex" gap={1} justifyContent="flex-end">
                          {doc.pdf_filename && (
                            <Tooltip title="View PDF">
                              <IconButton
                                size="small"
                                onClick={() => viewPdf(doc.document_type)}
                                color="primary"
                              >
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Upload PDF">
                            <IconButton
                              size="small"
                              onClick={() => triggerQuickUpload(doc.id)}
                              color="primary"
                            >
                              <UploadIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => handleEdit(doc)}
                              color="primary"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(doc.id)}
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
        </>
      ) : activeSection === 'blog' ? (
        <FarmersBlogManagement />
      ) : (
        <FarmersTestimonialsManagement />
      )}

      {/* Edit/Create Dialog */}
      <Dialog open={isDialogOpen} onClose={() => !isUploading && setIsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingDocument?.id ? 'Edit Document' : 'Add New Document'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Document Type"
                value={editingDocument?.document_type || ''}
                onChange={(e) => setEditingDocument({ ...editingDocument, document_type: e.target.value })}
                required
                disabled={!!editingDocument?.id}
                helperText="e.g., product-catalogue, price-list, planting-guide, support-services"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Order Index"
                type="number"
                value={editingDocument?.order_index || 0}
                onChange={(e) => setEditingDocument({ ...editingDocument, order_index: parseInt(e.target.value) || 0 })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={editingDocument?.title || ''}
                onChange={(e) => setEditingDocument({ ...editingDocument, title: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={editingDocument?.description || ''}
                onChange={(e) => setEditingDocument({ ...editingDocument, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={editingDocument?.is_active !== false}
                    onChange={(e) => setEditingDocument({ ...editingDocument, is_active: e.target.checked })}
                  />
                }
                label="Active"
              />
            </Grid>
            <Grid item xs={12}>
              <Box>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<UploadIcon />}
                  fullWidth
                >
                  {selectedFile ? `Selected: ${selectedFile.name}` : 'Select PDF File'}
                  <input
                    type="file"
                    hidden
                    accept="application/pdf"
                    onChange={handleDialogFileChange}
                  />
                </Button>
                {selectedFile && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    File size: {formatFileSize(selectedFile.size)}
                  </Typography>
                )}
              </Box>
            </Grid>
            {isUploading && (
              <Grid item xs={12}>
                <Box>
                  <LinearProgress variant="determinate" value={uploadProgress} />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Uploading... {uploadProgress}%
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)} disabled={isUploading}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={isUploading}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)}>
        <DialogTitle>Delete Document</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this document? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => documentToDelete && deleteDocumentMutation.mutate(documentToDelete)}
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

export default FarmersHubManagement;

