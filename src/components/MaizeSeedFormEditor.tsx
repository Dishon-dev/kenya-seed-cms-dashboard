import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5001';

interface FormField {
  id: number;
  name: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
  section: string;
  order: number;
  is_active: boolean;
  help_text?: string;
  validation?: any;
  conditional?: any;
}

const MaizeSeedFormEditor: React.FC = () => {
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<FormField>>({});
  const [newOption, setNewOption] = useState('');
  const queryClient = useQueryClient();

  // Fetch form fields
  const { data: fields, isLoading, error } = useQuery<FormField[]>({
    queryKey: ['maize-seed-form-fields'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/api/maize-seed-form-fields`);
      return response.data.data;
    }
  });

  // Create field mutation
  const createFieldMutation = useMutation({
    mutationFn: async (fieldData: Partial<FormField>) => {
      const response = await axios.post(`${API_BASE}/api/maize-seed-form-fields`, fieldData);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maize-seed-form-fields'] });
      setIsDialogOpen(false);
      setEditingField(null);
      setFormData({});
    }
  });

  // Update field mutation
  const updateFieldMutation = useMutation({
    mutationFn: async ({ id, ...fieldData }: Partial<FormField> & { id: number }) => {
      const response = await axios.put(`${API_BASE}/api/maize-seed-form-fields/${id}`, fieldData);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maize-seed-form-fields'] });
      setIsDialogOpen(false);
      setEditingField(null);
      setFormData({});
    }
  });

  // Delete field mutation
  const deleteFieldMutation = useMutation({
    mutationFn: async (id: number) => {
      await axios.delete(`${API_BASE}/api/maize-seed-form-fields/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maize-seed-form-fields'] });
    }
  });

  const handleAddField = () => {
    setEditingField(null);
    setFormData({
      type: 'text',
      required: false,
      section: 'applicant',
      order: 1,
      is_active: true
    });
    setIsDialogOpen(true);
  };

  const handleEditField = (field: FormField) => {
    setEditingField(field);
    setFormData(field);
    setIsDialogOpen(true);
  };

  const handleDeleteField = (id: number) => {
    if (window.confirm('Are you sure you want to delete this field?')) {
      deleteFieldMutation.mutate(id);
    }
  };

  const handleSaveField = () => {
    if (editingField) {
      updateFieldMutation.mutate({ ...formData, id: editingField.id } as any);
    } else {
      createFieldMutation.mutate(formData);
    }
  };

  const handleAddOption = () => {
    if (newOption.trim()) {
      setFormData(prev => ({
        ...prev,
        options: [...(prev.options || []), newOption.trim()]
      }));
      setNewOption('');
    }
  };

  const handleRemoveOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options?.filter((_, i) => i !== index)
    }));
  };

  const getSectionFields = (section: string) => {
    if (!fields) return [];
    return fields
      .filter(field => field.section === section)
      .sort((a, b) => a.order - b.order);
  };

  const getSectionTitle = (section: string) => {
    const titles: { [key: string]: string } = {
      applicant: 'Applicant Information',
      fields: 'Field Details',
      documents: 'Documents',
      evaluation: 'Field Evaluation'
    };
    return titles[section] || section;
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Error loading form fields: {error.message}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Maize Seed Form Editor
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage form fields for the Maize Seed Application Form
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddField}
          sx={{ 
            bgcolor: '#16a34a',
            '&:hover': { bgcolor: '#16a34a', opacity: 0.9 }
          }}
        >
          Add Field
        </Button>
      </Box>

      {/* Form Fields by Section */}
      {['applicant', 'fields', 'documents', 'evaluation'].map((section) => (
        <Accordion key={section} defaultExpanded sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">
              {getSectionTitle(section)} ({getSectionFields(section).length} fields)
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              {getSectionFields(section).map((field) => (
                <Grid item xs={12} sm={6} md={4} key={field.id}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      border: field.is_active ? '1px solid #e5e7eb' : '1px solid #ffcdd2',
                      opacity: field.is_active ? 1 : 0.7
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="h6" component="div" sx={{ fontSize: '1rem' }}>
                          {field.label}
                        </Typography>
                        <Chip 
                          label={field.type} 
                          size="small" 
                          color={field.type === 'select' ? 'primary' : 'default'}
                        />
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        <strong>Name:</strong> {field.name}
                      </Typography>
                      
                      {field.placeholder && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          <strong>Placeholder:</strong> {field.placeholder}
                        </Typography>
                      )}
                      
                      {field.help_text && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          <strong>Help:</strong> {field.help_text}
                        </Typography>
                      )}
                      
                      {field.options && field.options.length > 0 && (
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            <strong>Options:</strong>
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {field.options.map((option, index) => (
                              <Chip key={index} label={option} size="small" variant="outlined" />
                            ))}
                          </Box>
                        </Box>
                      )}
                      
                      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <Chip 
                          label={field.required ? 'Required' : 'Optional'} 
                          size="small" 
                          color={field.required ? 'error' : 'default'}
                        />
                        <Chip 
                          label={`Order: ${field.order}`} 
                          size="small" 
                          variant="outlined"
                        />
                      </Box>
                    </CardContent>
                    
                    <CardActions>
                      <Button 
                        size="small" 
                        startIcon={<EditIcon />}
                        onClick={() => handleEditField(field)}
                      >
                        Edit
                      </Button>
                      <Button 
                        size="small" 
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDeleteField(field.id)}
                        color="error"
                      >
                        Delete
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </AccordionDetails>
        </Accordion>
      ))}

      {/* Add/Edit Field Dialog */}
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingField ? 'Edit Field' : 'Add New Field'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Field Name"
                value={formData.name || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Field Label"
                value={formData.label || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Field Type</InputLabel>
                <Select
                  value={formData.type || 'text'}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                >
                  <MenuItem value="text">Text</MenuItem>
                  <MenuItem value="email">Email</MenuItem>
                  <MenuItem value="tel">Telephone</MenuItem>
                  <MenuItem value="number">Number</MenuItem>
                  <MenuItem value="date">Date</MenuItem>
                  <MenuItem value="textarea">Textarea</MenuItem>
                  <MenuItem value="select">Select</MenuItem>
                  <MenuItem value="file">File</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Section</InputLabel>
                <Select
                  value={formData.section || 'applicant'}
                  onChange={(e) => setFormData(prev => ({ ...prev, section: e.target.value }))}
                >
                  <MenuItem value="applicant">Applicant Information</MenuItem>
                  <MenuItem value="fields">Field Details</MenuItem>
                  <MenuItem value="documents">Documents</MenuItem>
                  <MenuItem value="evaluation">Field Evaluation</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Placeholder"
                value={formData.placeholder || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, placeholder: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Order"
                type="number"
                value={formData.order || 1}
                onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Help Text"
                multiline
                rows={2}
                value={formData.help_text || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, help_text: e.target.value }))}
              />
            </Grid>
            
            {/* Options for select fields */}
            {formData.type === 'select' && (
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Select Options
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <TextField
                    size="small"
                    label="Add Option"
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddOption()}
                  />
                  <Button onClick={handleAddOption} variant="outlined">
                    Add
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {formData.options?.map((option, index) => (
                    <Chip
                      key={index}
                      label={option}
                      onDelete={() => handleRemoveOption(index)}
                      color="primary"
                    />
                  ))}
                </Box>
              </Grid>
            )}
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.required || false}
                    onChange={(e) => setFormData(prev => ({ ...prev, required: e.target.checked }))}
                  />
                }
                label="Required Field"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)} startIcon={<CancelIcon />}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveField} 
            variant="contained" 
            startIcon={<SaveIcon />}
            disabled={createFieldMutation.isPending || updateFieldMutation.isPending}
            sx={{ 
              bgcolor: '#16a34a',
              '&:hover': { bgcolor: '#16a34a', opacity: 0.9 }
            }}
          >
            {editingField ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MaizeSeedFormEditor;
