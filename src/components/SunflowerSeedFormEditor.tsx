import React, { useState } from 'react';
import { Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress, Alert, Breadcrumbs, Link, Chip, Grid, Card, CardContent, Select, MenuItem, InputLabel, FormControl, Switch, FormControlLabel, Tabs, Tab, Divider } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Save as SaveIcon, Cancel as CancelIcon, DragIndicator as DragIcon, Visibility as VisibilityIcon, VisibilityOff as VisibilityOffIcon, Settings as SettingsIcon, Person as PersonIcon, LocationOn as MapPinIcon, Description as FileTextIcon, Info as InfoIcon } from '@mui/icons-material';
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
  section: 'applicant' | 'fields' | 'documents' | 'evaluation';
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
    evaluation: FormSection;
  };
  fields: FormField[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const SunflowerSeedFormEditor: React.FC = () => {
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
    queryKey: ['sunflower-seed-form-config'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/api/sunflower-seed-form-config`);
      return response.data.data;
    }
  });

  // Fetch form fields
  const { data: fieldsData, isLoading: isLoadingFields, error: errorFields } = useQuery({
    queryKey: ['sunflower-seed-form-fields'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/api/sunflower-seed-form-fields`);
      return response.data;
    }
  });

  const fields: FormField[] = fieldsData?.data || [];
  const formConfig: FormConfig | undefined = formConfigData;

  // Create/Update field mutation
  const createMutation = useMutation({
    mutationFn: async (data: Partial<FormField>) => {
      const response = await axios.post(`${API_BASE}/api/sunflower-seed-form-fields`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sunflower-seed-form-fields'] });
      queryClient.invalidateQueries({ queryKey: ['sunflower-seed-form-config'] });
      setOpenDialog(false);
      resetField();
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<FormField> }) => {
      const response = await axios.put(`${API_BASE}/api/sunflower-seed-form-fields/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sunflower-seed-form-fields'] });
      queryClient.invalidateQueries({ queryKey: ['sunflower-seed-form-config'] });
      setOpenDialog(false);
      resetField();
    }
  });

  // Delete field mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.delete(`${API_BASE}/api/sunflower-seed-form-fields/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sunflower-seed-form-fields'] });
      queryClient.invalidateQueries({ queryKey: ['sunflower-seed-form-config'] });
    }
  });

  const handleOpenDialog = (field?: FormField) => {
    if (field) {
      setEditingField(field);
      setFieldState(field);
    } else {
      resetField();
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
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

  const handleFieldChange = (field: keyof FormField, value: any) => {
    setFieldState(prev => ({ ...prev, [field]: value }));
  };

  const handleOptionsChange = (index: number, value: string) => {
    const newOptions = [...(fieldState.options || [])];
    newOptions[index] = value;
    setFieldState(prev => ({ ...prev, options: newOptions }));
  };

  const addOption = () => {
    setFieldState(prev => ({ ...prev, options: [...(prev.options || []), ''] }));
  };

  const removeOption = (index: number) => {
    const newOptions = (fieldState.options || []).filter((_, i) => i !== index);
    setFieldState(prev => ({ ...prev, options: newOptions }));
  };

  const handleSubmit = () => {
    if (editingField) {
      updateMutation.mutate({ id: editingField.id, data: fieldState });
    } else {
      createMutation.mutate(fieldState);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this field?')) {
      deleteMutation.mutate(id);
    }
  };

  const getSectionIcon = (section: string) => {
    switch (section) {
      case 'applicant': return <PersonIcon />;
      case 'fields': return <MapPinIcon />;
      case 'documents': return <FileTextIcon />;
      case 'evaluation': return <InfoIcon />;
      default: return <SettingsIcon />;
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

  if (isLoadingConfig || isLoadingFields) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (errorConfig || errorFields) {
    return (
      <Alert severity="error">
        Error loading form configuration: {(errorConfig || errorFields)?.message}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link underline="hover" color="inherit" onClick={() => navigate('/growers-portal')}>
          Growers Portal
        </Link>
        <Typography color="text.primary">Sunflower Seed Form Fields</Typography>
      </Breadcrumbs>

      <Typography variant="h4" gutterBottom>
        Sunflower Seed Application Form Fields Management
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Manage the form fields that appear in the sunflower seed application form. You can add, edit, delete, and reorder fields for each section.
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
                <InfoIcon color="primary" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h6">
                    {getFieldsBySection('evaluation').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Evaluation Fields
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Button 
        variant="contained" 
        color="primary" 
        startIcon={<AddIcon />} 
        onClick={() => handleOpenDialog()}
        sx={{ mb: 2 }}
      >
        Add New Field
      </Button>

      <Paper sx={{ width: '100%' }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Applicant Info" icon={<PersonIcon />} />
          <Tab label="Field Details" icon={<MapPinIcon />} />
          <Tab label="Documents" icon={<FileTextIcon />} />
          <Tab label="Evaluation" icon={<InfoIcon />} />
        </Tabs>

        {['applicant', 'fields', 'documents', 'evaluation'].map((section, index) => (
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
                          <Chip 
                            label={field.type} 
                            color={getFieldTypeColor(field.type) as any} 
                            size="small" 
                          />
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
                            <Chip 
                              label="Active" 
                              color="success" 
                              size="small" 
                              icon={<VisibilityIcon />} 
                            />
                          ) : (
                            <Chip 
                              label="Inactive" 
                              color="default" 
                              size="small" 
                              icon={<VisibilityOffIcon />} 
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <IconButton 
                            color="primary" 
                            onClick={() => handleOpenDialog(field)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton 
                            color="error" 
                            onClick={() => handleDelete(field.id)}
                          >
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

      {/* Add/Edit Field Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingField ? 'Edit Form Field' : 'Add New Form Field'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Field Name"
                value={fieldState.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                placeholder="e.g., full_name"
                helperText="Internal field name (no spaces, use underscores)"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Field Label"
                value={fieldState.label}
                onChange={(e) => handleFieldChange('label', e.target.value)}
                placeholder="e.g., Full Name"
                helperText="Display label for the field"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Field Type</InputLabel>
                <Select
                  value={fieldState.type}
                  onChange={(e) => handleFieldChange('type', e.target.value)}
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
                  value={fieldState.section}
                  onChange={(e) => handleFieldChange('section', e.target.value)}
                  label="Section"
                >
                  <MenuItem value="applicant">Applicant Info</MenuItem>
                  <MenuItem value="fields">Field Details</MenuItem>
                  <MenuItem value="documents">Documents</MenuItem>
                  <MenuItem value="evaluation">Evaluation</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Placeholder"
                value={fieldState.placeholder}
                onChange={(e) => handleFieldChange('placeholder', e.target.value)}
                placeholder="e.g., Enter your full name"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Order"
                type="number"
                value={fieldState.order}
                onChange={(e) => handleFieldChange('order', parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Help Text"
                value={fieldState.help_text}
                onChange={(e) => handleFieldChange('help_text', e.target.value)}
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
              <Divider sx={{ my: 2 }} />
              <Box display="flex" gap={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={fieldState.required || false}
                      onChange={(e) => handleFieldChange('required', e.target.checked)}
                    />
                  }
                  label="Required Field"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={fieldState.is_active || false}
                      onChange={(e) => handleFieldChange('is_active', e.target.checked)}
                    />
                  }
                  label="Active"
                />
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} startIcon={<CancelIcon />}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            color="primary" 
            variant="contained" 
            startIcon={<SaveIcon />}
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {(createMutation.isPending || updateMutation.isPending) ? (
              <CircularProgress size={24} />
            ) : (
              'Save'
            )}
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

export default SunflowerSeedFormEditor;
