import React, { useState } from 'react';
import {
  Box, Typography, Button, Card, CardContent, CardHeader,
  TextField, Grid, FormControl, InputLabel, Select, MenuItem,
  Switch, FormControlLabel, Chip, Alert, CircularProgress,
  Tabs, Tab, Divider, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, List, ListItem, ListItemText, ListItemSecondaryAction
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Save as SaveIcon, Visibility as VisibilityIcon, OpenInNew as OpenInNewIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5001';

interface FormField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'date' | 'number' | 'file';
  required: boolean;
  placeholder?: string;
  options?: string[];
  section: 'applicant' | 'fields' | 'documents' | 'official';
  order: number;
  isActive: boolean;
  helpText?: string;
}

const FingerMilletFormEditor: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [fieldData, setFieldData] = useState<Partial<FormField>>({
    name: '',
    label: '',
    type: 'text',
    required: false,
    placeholder: '',
    section: 'applicant',
    order: 0,
    isActive: true,
    helpText: ''
  });

  // Fetch form fields
  const { data: fieldsData, isLoading, error } = useQuery({
    queryKey: ['finger-millet-form-fields'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/api/finger-millet-form-fields`);
      return response.data;
    }
  });

  // Extract fields array from the response
  const fields: FormField[] = fieldsData?.data || [];
  
  // Debug logging
  console.log('Fields data:', fieldsData);
  console.log('Extracted fields:', fields);

  // Create/Update field mutation
  const saveMutation = useMutation({
    mutationFn: async (data: Partial<FormField>) => {
      if (editingField) {
        const response = await axios.put(`${API_BASE}/api/finger-millet-form-fields/${editingField.id}`, data);
        return response.data;
      } else {
        const response = await axios.post(`${API_BASE}/api/finger-millet-form-fields`, data);
        return response.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finger-millet-form-fields'] });
      setOpenDialog(false);
      setEditingField(null);
      resetForm();
    }
  });

  // Delete field mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.delete(`${API_BASE}/api/finger-millet-form-fields/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finger-millet-form-fields'] });
    }
  });

  const resetForm = () => {
    setFieldData({
      name: '',
      label: '',
      type: 'text',
      required: false,
      placeholder: '',
      section: 'applicant',
      order: 0,
      isActive: true,
      helpText: ''
    });
  };

  const handleOpenDialog = (field?: FormField) => {
    if (field) {
      setEditingField(field);
      setFieldData(field);
    } else {
      setEditingField(null);
      resetForm();
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingField(null);
    resetForm();
  };

  const handleSave = () => {
    saveMutation.mutate(fieldData);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this field?')) {
      deleteMutation.mutate(id);
    }
  };

  const getFieldsBySection = (section: string) => {
    if (!Array.isArray(fields)) {
      console.warn('Fields is not an array:', fields);
      return [];
    }
    return fields.filter(field => field.section === section).sort((a, b) => a.order - b.order);
  };

  const getFieldTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      text: 'default',
      email: 'primary',
      tel: 'secondary',
      textarea: 'info',
      select: 'success',
      date: 'warning',
      number: 'error',
      file: 'default'
    };
    return colors[type] || 'default';
  };

  const sections = [
    { key: 'applicant', label: 'Applicant Information', icon: 'User' },
    { key: 'fields', label: 'Field Details', icon: 'Wheat' },
    { key: 'documents', label: 'Documents', icon: 'FileText' },
    { key: 'official', label: 'Official Use', icon: 'Lock' }
  ];

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
        Error loading form fields: {error.message}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Finger Millet Form Editor
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage the fields that appear in the finger millet application form
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<VisibilityIcon />}
            onClick={() => window.open('http://localhost:3000/customer/growers/finger-millet', '_blank')}
          >
            View Live Form
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Field
          </Button>
        </Box>
      </Box>

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            {sections.map((section, index) => (
              <Tab
                key={section.key}
                label={`${section.icon} ${section.label}`}
                icon={<Chip label={getFieldsBySection(section.key).length} size="small" />}
              />
            ))}
          </Tabs>
        </Box>

        {sections.map((section, index) => (
          <Box key={section.key} hidden={activeTab !== index} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              {section.label} Fields
            </Typography>
            
            {getFieldsBySection(section.key).length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                <Typography variant="body1">No fields in this section yet</Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setFieldData(prev => ({ ...prev, section: section.key as any }));
                    handleOpenDialog();
                  }}
                  sx={{ mt: 2 }}
                >
                  Add First Field
                </Button>
              </Box>
            ) : (
              <List>
                {getFieldsBySection(section.key).map((field) => (
                  <ListItem key={field.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, mb: 1 }}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1">{field.label}</Typography>
                          {field.required && <Chip label="Required" size="small" color="error" />}
                          <Chip 
                            label={field.type} 
                            size="small" 
                            color={getFieldTypeColor(field.type) as any}
                          />
                          {!field.isActive && <Chip label="Inactive" size="small" color="default" />}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Field name: {field.name}
                          </Typography>
                          {field.placeholder && (
                            <Typography variant="body2" color="text.secondary">
                              Placeholder: {field.placeholder}
                            </Typography>
                          )}
                          {field.helpText && (
                            <Typography variant="body2" color="text.secondary">
                              Help: {field.helpText}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton onClick={() => handleOpenDialog(field)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(field.id)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        ))}
      </Card>

      {/* Add/Edit Field Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingField ? 'Edit Field' : 'Add New Field'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Field Name"
                value={fieldData.name}
                onChange={(e) => setFieldData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., full_name"
                helperText="Internal field name (no spaces, use underscores)"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Field Label"
                value={fieldData.label}
                onChange={(e) => setFieldData(prev => ({ ...prev, label: e.target.value }))}
                placeholder="e.g., Full Name"
                helperText="Display label for the field"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Field Type</InputLabel>
                <Select
                  value={fieldData.type}
                  onChange={(e) => setFieldData(prev => ({ ...prev, type: e.target.value as any }))}
                  label="Field Type"
                >
                  <MenuItem value="text">Text Input</MenuItem>
                  <MenuItem value="email">Email</MenuItem>
                  <MenuItem value="tel">Telephone</MenuItem>
                  <MenuItem value="textarea">Text Area</MenuItem>
                  <MenuItem value="select">Select Dropdown</MenuItem>
                  <MenuItem value="date">Date Picker</MenuItem>
                  <MenuItem value="number">Number Input</MenuItem>
                  <MenuItem value="file">File Upload</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Section</InputLabel>
                <Select
                  value={fieldData.section}
                  onChange={(e) => setFieldData(prev => ({ ...prev, section: e.target.value as any }))}
                  label="Section"
                >
                  <MenuItem value="applicant">Applicant Information</MenuItem>
                  <MenuItem value="fields">Field Details</MenuItem>
                  <MenuItem value="documents">Documents</MenuItem>
                  <MenuItem value="official">Official Use</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Placeholder"
                value={fieldData.placeholder}
                onChange={(e) => setFieldData(prev => ({ ...prev, placeholder: e.target.value }))}
                placeholder="e.g., Enter your full name"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Help Text"
                value={fieldData.helpText}
                onChange={(e) => setFieldData(prev => ({ ...prev, helpText: e.target.value }))}
                placeholder="Additional information for users"
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={fieldData.required || false}
                      onChange={(e) => setFieldData(prev => ({ ...prev, required: e.target.checked }))}
                    />
                  }
                  label="Required Field"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={fieldData.isActive || false}
                      onChange={(e) => setFieldData(prev => ({ ...prev, isActive: e.target.checked }))}
                    />
                  }
                  label="Active"
                />
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FingerMilletFormEditor;
