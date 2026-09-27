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
  type: 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'date' | 'number' | 'file' | 'checkbox' | 'radio';
  required: boolean;
  placeholder?: string;
  options?: string[];
  section: 'applicant' | 'fields' | 'documents' | 'official';
  order: number;
  is_active: boolean;
  help_text?: string;
}

const ForageSorghumFormEditor: React.FC = () => {
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
    is_active: true,
    help_text: ''
  });

  // Fetch form fields
  const { data: fieldsData, isLoading, error } = useQuery({
    queryKey: ['forage-sorghum-form-fields'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/api/forage-sorghum-form-fields`);
      return response.data;
    }
  });

  // Extract fields array from the response
  const fields: FormField[] = fieldsData?.data || [];

  // Create/Update field mutation
  const saveMutation = useMutation({
    mutationFn: async (data: Partial<FormField>) => {
      if (editingField) {
        const response = await axios.put(`${API_BASE}/api/forage-sorghum-form-fields/${editingField.id}`, data);
        return response.data;
      } else {
        const response = await axios.post(`${API_BASE}/api/forage-sorghum-form-fields`, data);
        return response.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forage-sorghum-form-fields'] });
      setOpenDialog(false);
      setEditingField(null);
      resetForm();
    }
  });

  // Delete field mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.delete(`${API_BASE}/api/forage-sorghum-form-fields/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forage-sorghum-form-fields'] });
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
      is_active: true,
      help_text: ''
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
      file: 'default',
      radio: 'primary',
      checkbox: 'secondary'
    };
    return colors[type] || 'default';
  };

  const sections = [
    { key: 'applicant', label: 'Applicant Information', icon: 'User' },
    { key: 'fields', label: 'Field Details', icon: 'Wheat' },
    { key: 'documents', label: 'Documents', icon: 'FileText' },
    { key: 'official', label: 'Official Use', icon: 'Lock' }
  ];

  if (isLoading) return <CircularProgress />;
  if (error) return <Alert severity="error">Error loading form fields: {error.message}</Alert>;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Forage Sorghum Form Fields Management
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Manage the fields for the Forage Sorghum Application Form. Add, edit, or delete fields as needed.
      </Typography>

      <Button
        variant="contained"
        color="primary"
        startIcon={<AddIcon />}
        onClick={() => handleOpenDialog()}
        sx={{ mb: 2, mr: 2 }}
      >
        Add New Field
      </Button>
      <Button
        variant="outlined"
        color="info"
        startIcon={<OpenInNewIcon />}
        onClick={() => window.open('http://localhost:3000/customer/growers/forage-sorghum', '_blank')}
        sx={{ mb: 2 }}
      >
        View Live Form
      </Button>

      <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 2 }}>
        {sections.map((section, index) => (
          <Tab key={section.key} label={`${section.icon} ${section.label}`} />
        ))}
      </Tabs>

      {sections.map((section, index) => (
        <TabPanel value={activeTab} index={index} key={section.key}>
          <Typography variant="h6" gutterBottom>{section.label}</Typography>
          <List>
            {getFieldsBySection(section.key).map((field) => (
              <ListItem
                key={field.id}
                secondaryAction={
                  <Box>
                    <IconButton edge="end" aria-label="edit" onClick={() => handleOpenDialog(field)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton edge="end" aria-label="delete" onClick={() => handleDelete(field.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                }
              >
                <ListItemText
                  primary={field.label}
                  secondary={
                    <Box>
                      <Chip label={field.type} size="small" color={getFieldTypeColor(field.type) as any} sx={{ mr: 1 }} />
                      <Chip label={field.required ? 'Required' : 'Optional'} size="small" color={field.required ? 'error' : 'default'} sx={{ mr: 1 }} />
                      <Chip label={field.is_active ? 'Active' : 'Inactive'} size="small" color={field.is_active ? 'success' : 'default'} />
                      {field.help_text && <Typography variant="caption" display="block">{field.help_text}</Typography>}
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </TabPanel>
      ))}

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingField ? 'Edit Form Field' : 'Add New Form Field'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Field Name (unique)"
                name="name"
                value={fieldData.name}
                onChange={(e) => setFieldData({ ...fieldData, name: e.target.value })}
                helperText="Internal identifier (e.g., full_name)"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Field Label"
                name="label"
                value={fieldData.label}
                onChange={(e) => setFieldData({ ...fieldData, label: e.target.value })}
                helperText="Display label for the user"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Field Type</InputLabel>
                <Select
                  name="type"
                  value={fieldData.type}
                  label="Field Type"
                  onChange={(e) => setFieldData({ ...fieldData, type: e.target.value as FormField['type'] })}
                >
                  <MenuItem value="text">Text Input</MenuItem>
                  <MenuItem value="email">Email</MenuItem>
                  <MenuItem value="tel">Telephone</MenuItem>
                  <MenuItem value="textarea">Text Area</MenuItem>
                  <MenuItem value="select">Select Dropdown</MenuItem>
                  <MenuItem value="date">Date Picker</MenuItem>
                  <MenuItem value="number">Number Input</MenuItem>
                  <MenuItem value="file">File Upload</MenuItem>
                  <MenuItem value="checkbox">Checkbox</MenuItem>
                  <MenuItem value="radio">Radio Button</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Section</InputLabel>
                <Select
                  name="section"
                  value={fieldData.section}
                  label="Section"
                  onChange={(e) => setFieldData({ ...fieldData, section: e.target.value as FormField['section'] })}
                >
                  <MenuItem value="applicant">Applicant Information</MenuItem>
                  <MenuItem value="fields">Field Details</MenuItem>
                  <MenuItem value="documents">Documents</MenuItem>
                  <MenuItem value="official">Official Use</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Placeholder"
                name="placeholder"
                value={fieldData.placeholder}
                onChange={(e) => setFieldData({ ...fieldData, placeholder: e.target.value })}
                helperText="Hint text inside the input"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Order"
                name="order"
                type="number"
                value={fieldData.order}
                onChange={(e) => setFieldData({ ...fieldData, order: parseInt(e.target.value) || 0 })}
                helperText="Order of field within its section"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Help Text"
                name="help_text"
                value={fieldData.help_text}
                onChange={(e) => setFieldData({ ...fieldData, help_text: e.target.value })}
                multiline
                rows={2}
                helperText="Additional information for the user"
              />
            </Grid>
            {(fieldData.type === 'select' || fieldData.type === 'radio' || fieldData.type === 'checkbox') && (
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Options</Typography>
                <List>
                  {(fieldData.options || []).map((option, index) => (
                    <ListItem key={index} secondaryAction={
                      <IconButton edge="end" aria-label="delete-option" onClick={() => {
                        const newOptions = (fieldData.options || []).filter((_, i) => i !== index);
                        setFieldData({ ...fieldData, options: newOptions });
                      }}>
                        <DeleteIcon />
                      </IconButton>
                    }>
                      <ListItemText>
                        <TextField
                          fullWidth
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...(fieldData.options || [])];
                            newOptions[index] = e.target.value;
                            setFieldData({ ...fieldData, options: newOptions });
                          }}
                          label={`Option ${index + 1}`}
                        />
                      </ListItemText>
                    </ListItem>
                  ))}
                </List>
                <Button startIcon={<AddIcon />} onClick={() => setFieldData({ ...fieldData, options: [...(fieldData.options || []), ''] })}>
                  Add Option
                </Button>
              </Grid>
            )}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={fieldData.required || false}
                    onChange={(e) => setFieldData({ ...fieldData, required: e.target.checked })}
                  />
                }
                label="Required Field"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={fieldData.is_active || false}
                    onChange={(e) => setFieldData({ ...fieldData, is_active: e.target.checked })}
                  />
                }
                label="Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="primary" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? <CircularProgress size={24} /> : 'Save Field'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default ForageSorghumFormEditor;
