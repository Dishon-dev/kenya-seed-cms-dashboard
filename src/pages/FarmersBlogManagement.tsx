import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
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
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
  PictureAsPdf as PdfIcon,
  Visibility as ViewIcon,
  Add as AddIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5001';

interface FarmersBlogDocument {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  pdf_filename: string | null;
  pdf_mime_type: string | null;
  pdf_size: number | null;
  is_active: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

const normalizeSlug = (value: string) =>
  value.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

const FarmersBlogManagement: React.FC = () => {
  const [documents, setDocuments] = useState<FarmersBlogDocument[]>([]);
  const [editingDocument, setEditingDocument] = useState<Partial<FarmersBlogDocument> | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const queryClient = useQueryClient();

  const { data: documentsResponse, isLoading, error } = useQuery({
    queryKey: ['farmers-blog-documents'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/api/cms/farmers-blog/documents`, {
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

  const saveDocumentMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const documentId = editingDocument?.id;
      if (documentId) {
        return axios.put(`${API_BASE}/api/cms/farmers-blog/documents/${documentId}`, data, {
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
      return axios.post(`${API_BASE}/api/cms/farmers-blog/documents`, data, {
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
      queryClient.invalidateQueries({ queryKey: ['farmers-blog-documents'] });
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

  const deleteDocumentMutation = useMutation({
    mutationFn: async (id: number) => {
      return axios.delete(`${API_BASE}/api/cms/farmers-blog/documents/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farmers-blog-documents'] });
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

  const uploadFileMutation = useMutation({
    mutationFn: async ({ id, file }: { id: number; file: File }) => {
      const formData = new FormData();
      formData.append('file', file);
      return axios.post(`${API_BASE}/api/cms/farmers-blog/documents/${id}/file`, formData, {
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
      queryClient.invalidateQueries({ queryKey: ['farmers-blog-documents'] });
      setSelectedFile(null);
      setUploadProgress(0);
      setIsUploading(false);
      setMessage({ type: 'success', text: 'File uploaded successfully!' });
      setTimeout(() => setMessage(null), 3000);
    },
    onError: (error: any) => {
      setIsUploading(false);
      setUploadProgress(0);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to upload file' });
      setTimeout(() => setMessage(null), 5000);
    }
  });

  const handleEdit = (document: FarmersBlogDocument) => {
    setEditingDocument(document);
    setSelectedFile(null);
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingDocument({
      slug: '',
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
    if (!editingDocument?.slug || !editingDocument?.title) {
      setMessage({ type: 'error', text: 'Slug and title are required' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('slug', normalizeSlug(editingDocument.slug));
    formData.append('title', editingDocument.title);
    if (editingDocument.description !== undefined) {
      formData.append('description', editingDocument.description || '');
    }
    formData.append('order_index', String(editingDocument.order_index || 0));
    formData.append('is_active', String(editingDocument.is_active || true));

    if (selectedFile) {
      formData.append('file', selectedFile);
    }

    saveDocumentMutation.mutate(formData);
  };

  const handleUploadFile = (id: number, file: File) => {
    setIsUploading(true);
    uploadFileMutation.mutate({ id, file });
  };

  const handleDialogFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const viewFile = (slug: string) => {
    window.open(`${API_BASE}/api/farmers-blog/pdf/${encodeURIComponent(slug)}`, '_blank');
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
        <Alert severity="error">Failed to load farmers blog documents. Please try again.</Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Farmers Blog Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage documents for the Farmers Blog section on the website
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
          color="primary"
        >
          Add Document
        </Button>
      </Box>

      {message && (
        <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Order</TableCell>
              <TableCell>Slug</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>File</TableCell>
              <TableCell>Size</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="text.secondary" py={3}>
                    No documents found. Click "Add Document" to create one.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>{doc.order_index}</TableCell>
                  <TableCell>
                    <Chip label={doc.slug} size="small" />
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
                        No file
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
                        <Tooltip title="View File">
                          <IconButton
                            size="small"
                            onClick={() => viewFile(doc.slug)}
                            color="primary"
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Upload File">
                        <IconButton
                          size="small"
                          component="label"
                          color="primary"
                        >
                          <UploadIcon />
                          <input
                            type="file"
                            hidden
                            accept="*/*"
                            onChange={(event) => {
                              if (event.target.files && event.target.files[0]) {
                                handleUploadFile(doc.id, event.target.files[0]);
                              }
                            }}
                          />
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

      <Dialog open={isDialogOpen} onClose={() => !isUploading && setIsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingDocument?.id ? 'Edit Document' : 'Add New Document'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Slug"
                value={editingDocument?.slug || ''}
                onChange={(e) => setEditingDocument({ ...editingDocument, slug: e.target.value })}
                required
                helperText="e.g., ask-field-days, rallying-call-second-season"
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
                  {selectedFile ? `Selected: ${selectedFile.name}` : 'Select File'}
                  <input
                    type="file"
                    hidden
                    accept="*/*"
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

export default FarmersBlogManagement;
