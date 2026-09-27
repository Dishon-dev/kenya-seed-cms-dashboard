import React, { useState } from 'react';
import { Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress, Alert, Breadcrumbs, Link, Chip, Grid, Card, CardContent, Select, MenuItem, InputLabel, FormControl, Switch, FormControlLabel, Tabs, Tab, Divider } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Save as SaveIcon, Cancel as CancelIcon, DragIndicator as DragIcon, Visibility as VisibilityIcon, VisibilityOff as VisibilityOffIcon, Settings as SettingsIcon, Person as PersonIcon, LocationOn as MapPinIcon, Description as FileTextIcon, Assignment as ClipboardCheckIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5001'; // Ensure this points to your API server

interface FormField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'date' | 'number' | 'file' | 'checkbox' | 'radio';
  required: boolean;
  placeholder?: string;
  options?: string[];
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    min?: number;
    max?: number;
  };
  section: 'applicant' | 'fields' | 'documents' | 'official';
  order: number;
  is_active: boolean;
  help_text?: string;
  conditional?: {
    dependsOn: string;
    value: string;
  };
}

interface FormSection {
  title: string;
  description: string;
  icon: string;
}

interface FormConfig {
  id: string;
  title: string;
  description: string;
  sections: {
    applicant: FormSection;
    fields: FormSection;
    documents: FormSection;
    official: FormSection;
  };
  fields: FormField[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const SoyaBeanFormEditor: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [fieldState, setFieldState] = useState<Partial<FormField>>({
    name: '', label: '', type: 'text', required: false, placeholder: '', options: [],
    section: 'applicant', order: 0, is_active: true, help_text: '', validation: {}
  });

  // Fetch form configuration
  const { data: formConfigData, isLoading: isLoadingConfig, error: errorConfig } = useQuery<FormConfig>({
    queryKey: ['soya-bean-form-config'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/api/soya-bean-form-config`);
      return response.data.data;
    }
  });

  // Fetch form fields
  const { data: fieldsData, isLoading: isLoadingFields, error: errorFields } = useQuery({
    queryKey: ['soya-bean-form-fields'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/api/soya-bean-form-fields`);
      return response.data;
    }
  });

  const fields: FormField[] = fieldsData?.data || [];
  const formConfig: FormConfig | undefined = formConfigData;

  // Create/Update field mutation
  const mutation = useMutation({
    mutationFn: async (data: Partial<FormField>) => {
      if (editingField) {
        const response = await axios.put(`${API_BASE}/api/soya-bean-form-fields/${editingField.id}`, data);
        return response.data;
      } else {
        const response = await axios.post(`${API_BASE}/api/soya-bean-form-fields`, data);
        return response.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['soya-bean-form-config'] });
      queryClient.invalidateQueries({ queryKey: ['soya-bean-form-fields'] });
      setOpenDialog(false);
      setEditingField(null);
      resetField();
    }
  });

  // Delete field mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.delete(`${API_BASE}/api/soya-bean-form-fields/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['soya-bean-form-config'] });
      queryClient.invalidateQueries({ queryKey: ['soya-bean-form-fields'] });
    }
  });

  const handleOpen = (field?: FormField) => {
    if (field) {
      setEditingField(field);
      setFieldState(field);
    } else {
      setFieldState({
        name: '', label: '', type: 'text', required: false, placeholder: '', options: [],
        section: 'applicant', order: 0, is_active: true, help_text: '', validation: {}
      });
    }
    setOpenDialog(true);
  };

  const handleClose = () => {
    setOpenDialog(false);
    setEditingField(null);
    resetField();
  };

  const resetField = () => {
    setFieldState({
      name: '', label: '', type: 'text', required: false, placeholder: '', options: [],
      section: 'applicant', order: 0, is_active: true, help_text: '', validation: {}
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any) => {
    const { name, value, type, checked } = e.target;
    setFieldState(prevState => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleValidationChange = (key: string, value: any) => {
    setFieldState(prevState => ({
      ...prevState,
      validation: { ...prevState.validation, [key]: value }
    }));
  };

  const handleOptionsChange = (index: number, value: any) => {
    const newOptions = [...(fieldState.options || [])];
    newOptions[index] = value;
    setFieldState(prevState => ({
      ...prevState,
      options: newOptions
    }));
  };

  const addOption = () => {
    setFieldState(prevState => ({
      ...prevState,
      options: [...(prevState.options || []), '']
    }));
  };

  const removeOption = (index: number) => {
    const newOptions = (fieldState.options || []).filter((_, i) => i !== index);
    setFieldState(prevState => ({
      ...prevState,
      options: newOptions
    }));
  };

  const handleSubmit = () => {
    mutation.mutate(fieldState);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this field?')) {
      deleteMutation.mutate(id);
    }
  };

  const getFieldTypeColor = (type: string) => {
    switch (type) {
      case 'text': return 'default';
      case 'email': return 'primary';
      case 'tel': return 'secondary';
      case 'textarea': return 'info';
      case 'select': return 'success';
      case 'date': return 'warning';
      case 'number': return 'error';
      case 'file': return 'default';
      default: return 'default';
    }
  };

  const getFieldsBySection = (section: string) => {
    return fields.filter(field => field.section === section);
  };

  if (isLoadingConfig || isLoadingFields) return <CircularProgress />;
  if (errorConfig || errorFields) return <Alert severity="error">Error loading form configuration: {(errorConfig || errorFields)?.message}</Alert>;

  return (
    <Box sx={{ p: 3 }}>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link underline="hover" color="inherit" onClick={() => navigate('/growers-portal')}>
          Growers Portal
        </Link>
        <Typography color="text.primary">Soya Bean Form Fields</Typography>
      </Breadcrumbs>

      <Typography variant="h4" gutterBottom>
        Soya Bean Application Form Fields Management
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Manage the form fields that appear in the soya bean application form. You can add, edit, delete, and reorder fields for each section.
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <PersonIcon color="primary" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h6">
                    {getFieldsBySection('applicant').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Applicant Fields
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <MapPinIcon color="primary" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h6">
                    {getFieldsBySection('fields').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Field Details
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <FileTextIcon color="primary" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h6">
                    {getFieldsBySection('documents').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Document Fields
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <ClipboardCheckIcon color="primary" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h6">
                    {getFieldsBySection('official').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Official Fields
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => handleOpen()} sx={{ mb: 2 }}>
        Add New Field
      </Button>

      <Paper sx={{ width: '100%' }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Applicant Info" icon={<PersonIcon />} />
          <Tab label="Field Details" icon={<MapPinIcon />} />
          <Tab label="Documents" icon={<FileTextIcon />} />
          <Tab label="Official Use" icon={<ClipboardCheckIcon />} />
        </Tabs>

        {['applicant', 'fields', 'documents', 'official'].map((section, index) => (
          <TabPanel key={section} value={activeTab} index={index}>
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                {formConfig?.sections[section as keyof typeof formConfig.sections]?.title} Fields
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {formConfig?.sections[section as keyof typeof formConfig.sections]?.description}
              </Typography>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Field Name</TableCell>
                      <TableCell>Label</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Required</TableCell>
                      <TableCell>Order</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getFieldsBySection(section).map((field) => (
                      <TableRow key={field.id}>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <DragIcon sx={{ mr: 1, color: 'text.secondary' }} />
                            {field.name}
                          </Box>
                        </TableCell>
                        <TableCell>{field.label}</TableCell>
                        <TableCell>
                          <Chip label={field.type} color={getFieldTypeColor(field.type) as any} size="small" />
                        </TableCell>
                        <TableCell>
                          {field.required ? (
                            <Chip label="Required" color="error" size="small" />
                          ) : (
                            <Chip label="Optional" color="default" size="small" />
                          )}
                        </TableCell>
                        <TableCell>{field.order}</TableCell>
                        <TableCell>
                          {field.is_active ? (
                            <Chip label="Active" color="success" size="small" icon={<VisibilityIcon />} />
                          ) : (
                            <Chip label="Inactive" color="default" size="small" icon={<VisibilityOffIcon />} />
                          )}
                        </TableCell>
                        <TableCell>
                          <IconButton color="primary" onClick={() => handleOpen(field)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton color="error" onClick={() => handleDelete(field.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </TabPanel>
        ))}
      </Paper>

      <Dialog open={openDialog} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>{editingField ? 'Edit Form Field' : 'Add New Form Field'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Field Name"
                name="name"
                value={fieldState.name}
                onChange={handleChange}
                placeholder="e.g., full_name"
                helperText="Internal field name (no spaces, use underscores)"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Field Label"
                name="label"
                value={fieldState.label}
                onChange={handleChange}
                placeholder="e.g., Full Name"
                helperText="Display label for the field"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Field Type</InputLabel>
                <Select
                  name="type"
                  value={fieldState.type}
                  onChange={handleChange}
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
                  value={fieldState.section}
                  onChange={handleChange}
                  label="Section"
                >
                  <MenuItem value="applicant">Applicant Info</MenuItem>
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
                value={fieldState.placeholder}
                onChange={handleChange}
                placeholder="e.g., Enter your full name"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Order"
                name="order"
                type="number"
                value={fieldState.order}
                onChange={handleChange}
                placeholder="0"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Help Text"
                name="help_text"
                value={fieldState.help_text}
                onChange={handleChange}
                placeholder="Additional information for users"
                multiline
                rows={2}
              />
            </Grid>

            {(fieldState.type === 'select' || fieldState.type === 'radio' || fieldState.type === 'checkbox') && (
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Options
                </Typography>
                {(fieldState.options || []).map((option, index) => (
                  <Box key={index} display="flex" alignItems="center" sx={{ mb: 1 }}>
                    <TextField
                      fullWidth
                      label={`Option ${index + 1}`}
                      value={option}
                      onChange={(e) => handleOptionsChange(index, e.target.value)}
                      sx={{ mr: 1 }}
                    />
                    <IconButton onClick={() => removeOption(index)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ))}
                <Button onClick={addOption} startIcon={<AddIcon />}>
                  Add Option
                </Button>
              </Grid>
            )}

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Validation Rules
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Min Length"
                    type="number"
                    value={fieldState.validation?.minLength || ''}
                    onChange={(e) => handleValidationChange('minLength', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Max Length"
                    type="number"
                    value={fieldState.validation?.maxLength || ''}
                    onChange={(e) => handleValidationChange('maxLength', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Min Value"
                    type="number"
                    value={fieldState.validation?.min || ''}
                    onChange={(e) => handleValidationChange('min', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Max Value"
                    type="number"
                    value={fieldState.validation?.max || ''}
                    onChange={(e) => handleValidationChange('max', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Pattern (Regex)"
                    value={fieldState.validation?.pattern || ''}
                    onChange={(e) => handleValidationChange('pattern', e.target.value)}
                    placeholder="e.g., ^[0-9]{10}$ for 10-digit phone number"
                  />
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Box display="flex" gap={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={fieldState.required || false}
                      onChange={(e) => setFieldState(prev => ({ ...prev, required: e.target.checked }))}
                    />
                  }
                  label="Required Field"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={fieldState.is_active || false}
                      onChange={(e) => setFieldState(prev => ({ ...prev, is_active: e.target.checked }))}
                    />
                  }
                  label="Active"
                />
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} startIcon={<CancelIcon />}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} color="primary" variant="contained" startIcon={<SaveIcon />}>
            {mutation.isPending ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// TabPanel component
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
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default SoyaBeanFormEditor;
