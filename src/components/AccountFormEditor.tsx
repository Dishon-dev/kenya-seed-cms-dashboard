import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Grid,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Chip,
  Divider,
  Snackbar,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  AccordionActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Tooltip,
  Fab,
  LinearProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  AccountCircle as AccountIcon,
  ExpandMore as ExpandMoreIcon,
  CloudUpload as UploadIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  DragIndicator as DragIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5001';

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'number' | 'date' | 'select' | 'textarea' | 'file' | 'checkbox' | 'radio';
  required: boolean;
  placeholder?: string;
  options?: string[];
  multiple?: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

interface FormSection {
  title: string;
  description: string;
  fields: FormField[];
}

interface AccountFormData {
  hero: {
    title: string;
    subtitle: string;
  };
  formConfig: {
    submitButtonText: string;
    successMessage: string;
    formAction: string;
    nextUrl: string;
    requireAllFields: boolean;
    allowDraft: boolean;
    emailNotifications: boolean;
    autoApprove: boolean;
  };
  sections: {
    businessDetails: FormSection;
    owners: FormSection;
    banking: FormSection;
    tradeReferences: FormSection;
    consideration: FormSection;
    signatures: FormSection;
    documents: FormSection;
    officialUse: FormSection;
  };
  isActive: boolean;
}

const AccountFormEditor: React.FC = () => {
  const [accountFormData, setAccountFormData] = useState<AccountFormData | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [isFieldDialogOpen, setIsFieldDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const queryClient = useQueryClient();

  // Local storage functions
  const saveAccountFormToStorage = useCallback((data: AccountFormData) => {
    try {
      localStorage.setItem('accountFormData', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving to local storage:', error);
    }
  }, []);

  const loadAccountFormFromStorage = useCallback((): AccountFormData | null => {
    try {
      const stored = localStorage.getItem('accountFormData');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error loading from local storage:', error);
      return null;
    }
  }, []);

  // Fetch account form data
  const { data: fetchedData, isLoading, error } = useQuery({
    queryKey: ['accountForm'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/api/account-form`);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update mutation
  const updateAccountFormMutation = useMutation({
    mutationFn: async (data: AccountFormData) => {
      const response = await axios.post(`${API_BASE}/api/account-form`, data);
      return response.data;
    },
    onSuccess: (data) => {
      setAccountFormData(data);
      saveAccountFormToStorage(data);
      queryClient.invalidateQueries({ queryKey: ['accountForm'] });
      showMessage({ type: 'success', text: 'Account form updated successfully!' });
    },
    onError: (error: any) => {
      showMessage({ type: 'error', text: `Error updating account form: ${error.response?.data?.message || error.message}` });
    },
  });

  // Update account form data when fetched data changes
  useEffect(() => {
    if (fetchedData) {
      setAccountFormData(fetchedData);
      saveAccountFormToStorage(fetchedData);
    } else {
      // Try to load from local storage as fallback
      const storedData = loadAccountFormFromStorage();
      if (storedData) {
        setAccountFormData(storedData);
      }
    }
  }, [fetchedData, saveAccountFormToStorage, loadAccountFormFromStorage]);

  const showMessage = (msg: { type: 'success' | 'error'; text: string }) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 5000);
  };

  const handleSave = () => {
    if (accountFormData) {
      updateAccountFormMutation.mutate(accountFormData);
    }
  };

  const handleHeroChange = (field: keyof AccountFormData['hero'], value: string) => {
    if (accountFormData) {
      setAccountFormData({
        ...accountFormData,
        hero: {
          ...accountFormData.hero,
          [field]: value
        }
      });
    }
  };

  const handleFormConfigChange = (field: keyof AccountFormData['formConfig'], value: string | boolean) => {
    if (accountFormData) {
      setAccountFormData({
        ...accountFormData,
        formConfig: {
          ...accountFormData.formConfig,
          [field]: value
        }
      });
    }
  };

  const handleSectionChange = (sectionKey: keyof AccountFormData['sections'], field: keyof FormSection, value: string) => {
    if (accountFormData) {
      setAccountFormData({
        ...accountFormData,
        sections: {
          ...accountFormData.sections,
          [sectionKey]: {
            ...accountFormData.sections[sectionKey],
            [field]: value
          }
        }
      });
    }
  };

  const handleAddField = (sectionKey: keyof AccountFormData['sections']) => {
    const newField: FormField = {
      name: '',
      label: '',
      type: 'text',
      required: false,
      placeholder: ''
    };
    
    if (accountFormData) {
      setAccountFormData({
        ...accountFormData,
        sections: {
          ...accountFormData.sections,
          [sectionKey]: {
            ...accountFormData.sections[sectionKey],
            fields: [...accountFormData.sections[sectionKey].fields, newField]
          }
        }
      });
    }
  };

  const handleUpdateField = (sectionKey: keyof AccountFormData['sections'], fieldIndex: number, field: FormField) => {
    if (accountFormData) {
      const updatedFields = [...accountFormData.sections[sectionKey].fields];
      updatedFields[fieldIndex] = field;
      
      setAccountFormData({
        ...accountFormData,
        sections: {
          ...accountFormData.sections,
          [sectionKey]: {
            ...accountFormData.sections[sectionKey],
            fields: updatedFields
          }
        }
      });
    }
  };

  const handleDeleteField = (sectionKey: keyof AccountFormData['sections'], fieldIndex: number) => {
    if (accountFormData) {
      const updatedFields = accountFormData.sections[sectionKey].fields.filter((_, index) => index !== fieldIndex);
      
      setAccountFormData({
        ...accountFormData,
        sections: {
          ...accountFormData.sections,
          [sectionKey]: {
            ...accountFormData.sections[sectionKey],
            fields: updatedFields
          }
        }
      });
    }
  };

  const handleReorderField = (sectionKey: keyof AccountFormData['sections'], fromIndex: number, toIndex: number) => {
    if (accountFormData) {
      const fields = [...accountFormData.sections[sectionKey].fields];
      const [movedField] = fields.splice(fromIndex, 1);
      fields.splice(toIndex, 0, movedField);
      
      setAccountFormData({
        ...accountFormData,
        sections: {
          ...accountFormData.sections,
          [sectionKey]: {
            ...accountFormData.sections[sectionKey],
            fields
          }
        }
      });
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Error loading account form data: {error.message}
        </Alert>
      </Box>
    );
  }

  if (!accountFormData || !accountFormData.hero || !accountFormData.sections) {
    return (
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={60} sx={{ mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Loading account form data...
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Please wait while we fetch the latest form configuration.
            </Typography>
            {isLoading && (
              <Box sx={{ mt: 2 }}>
                <LinearProgress sx={{ width: '200px', mx: 'auto' }} />
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <AccountIcon sx={{ mr: 2, color: '#1976d2' }} />
        <Typography variant="h4" component="h1">
          Account Application Form Editor
        </Typography>
      </Box>

      {/* Live Preview */}
      {accountFormData && (
        <Box sx={{ mb: 4, position: 'relative' }}>
          <Typography variant="h5" gutterBottom sx={{ mb: 2, color: 'primary.main', fontWeight: 'bold' }}>Live Preview - This is how your account application form appears to visitors
          </Typography>
          
          <Paper sx={{ p: 3, bgcolor: '#f0fdf4', maxHeight: '800px', overflow: 'auto' }}>
            <div className="w-full max-w-6xl mx-auto">
              {/* Hero Section */}
              <section className="py-32 bg-gradient-to-r from-green-600 to-green-800 text-white">
                <div className="container mx-auto px-4 text-center">
                  <div className="max-w-4xl mx-auto">
                    <h1 className="text-5xl lg:text-6xl font-bold mb-6 text-white">
                      {accountFormData?.hero?.title || 'Account Application Form'}
                    </h1>
                    <p className="text-lg lg:text-xl max-w-3xl mx-auto leading-relaxed mt-4 text-white/90 whitespace-pre-line">
                      {accountFormData?.hero?.subtitle || 'Please fill out the form below to apply for an account with Kenya Seed Company.'}
                    </p>
                  </div>
                </div>
              </section>

              {/* Form Preview */}
              <div className="max-w-5xl mx-auto p-6 bg-white shadow rounded my-8 space-y-10">
                <form>
                  {/* Business Details Section */}
                  <section>
                    <h2 className="text-xl font-bold mb-4">{accountFormData?.sections?.businessDetails?.title || 'Business Details'}</h2>
                    <p className="mb-4 text-gray-600 italic">{accountFormData?.sections?.businessDetails?.description || 'Please provide your business information below.'}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {accountFormData?.sections?.businessDetails?.fields?.map((field, index) => (
                        <div key={field.name} className="flex flex-col mb-3">
                          <label className="font-semibold mb-1">
                            {field.label}
                            {field.required && <span className="text-red-500">*</span>}
                          </label>
                          {field.type === 'select' ? (
                            <select className="border border-gray-400 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-600">
                              <option value="">Select {field.label}</option>
                              {field.options?.map(option => (
                                <option key={option} value={option}>{option}</option>
                              ))}
                            </select>
                          ) : field.type === 'file' ? (
                            <input
                              type="file"
                              multiple={field.multiple}
                              className="w-full border border-gray-400 rounded px-3 py-2 cursor-pointer bg-gray-50"
                            />
                          ) : (
                            <input
                              type={field.type}
                              placeholder={field.placeholder || ''}
                              required={field.required}
                              className="border border-gray-400 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-600"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Other sections preview */}
                  {Object.entries(accountFormData?.sections || {}).slice(1, 4).map(([sectionKey, section]) => (
                    <section key={sectionKey}>
                      <h2 className="text-xl font-bold mb-4">{section?.title || 'Section'}</h2>
                      <p className="mb-4 text-gray-600 italic">{section?.description || 'Section description'}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {section?.fields?.slice(0, 4).map((field) => (
                          <div key={field.name} className="flex flex-col mb-3">
                            <label className="font-semibold mb-1">
                              {field.label}
                              {field.required && <span className="text-red-500">*</span>}
                            </label>
                            {field.type === 'select' ? (
                              <select className="border border-gray-400 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-600">
                                <option value="">Select {field.label}</option>
                                {field.options?.map(option => (
                                  <option key={option} value={option}>{option}</option>
                                ))}
                              </select>
                            ) : field.type === 'file' ? (
                              <input
                                type="file"
                                multiple={field.multiple}
                                className="w-full border border-gray-400 rounded px-3 py-2 cursor-pointer bg-gray-50"
                              />
                            ) : (
                              <input
                                type={field.type}
                                placeholder={field.placeholder || ''}
                                required={field.required}
                                className="border border-gray-400 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-600"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </section>
                  ))}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="mt-6 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded transition-colors"
                  >
                    {accountFormData?.formConfig?.submitButtonText || 'Submit Application'}
                  </button>
                </form>
              </div>
            </div>
          </Paper>
        </Box>
      )}

      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Configuration" />
          <Tab label="Form Fields" />
          <Tab label="Documents" />
          <Tab label="Preview" />
        </Tabs>
      </Paper>

      {/* Configuration Tab */}
      {activeTab === 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Form Configuration
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Configure the basic settings for the account application form.
          </Typography>

          {/* Hero Section Configuration */}
          <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 2, color: 'primary.main' }}>
            Hero Section
          </Typography>
          
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Hero Title"
                value={accountFormData?.hero?.title || ''}
                onChange={(e) => handleHeroChange('title', e.target.value)}
                helperText="Main title displayed at the top of the form"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Hero Subtitle"
                multiline
                rows={3}
                value={accountFormData?.hero?.subtitle || ''}
                onChange={(e) => handleHeroChange('subtitle', e.target.value)}
                helperText="Subtitle text displayed below the main title"
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Form Configuration Settings */}
          <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 2, color: 'primary.main' }}>
            Form Settings
          </Typography>
          
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Submit Button Text"
                value={accountFormData?.formConfig.submitButtonText || ''}
                onChange={(e) => handleFormConfigChange('submitButtonText', e.target.value)}
                helperText="Text displayed on the submit button"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Success Message"
                value={accountFormData?.formConfig.successMessage || ''}
                onChange={(e) => handleFormConfigChange('successMessage', e.target.value)}
                helperText="Message shown after successful submission"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Form Action URL"
                value={accountFormData?.formConfig.formAction || ''}
                onChange={(e) => handleFormConfigChange('formAction', e.target.value)}
                helperText="URL where the form will be submitted"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Next URL"
                value={accountFormData?.formConfig.nextUrl || ''}
                onChange={(e) => handleFormConfigChange('nextUrl', e.target.value)}
                helperText="URL to redirect to after form submission"
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={accountFormData?.formConfig.requireAllFields || false}
                    onChange={(e) => handleFormConfigChange('requireAllFields', e.target.checked)}
                  />
                }
                label="Require All Fields"
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={accountFormData?.formConfig.allowDraft || false}
                    onChange={(e) => handleFormConfigChange('allowDraft', e.target.checked)}
                  />
                }
                label="Allow Draft Saving"
              />
          </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={accountFormData?.formConfig.emailNotifications || false}
                    onChange={(e) => handleFormConfigChange('emailNotifications', e.target.checked)}
                  />
                }
                label="Send Email Notifications"
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={accountFormData?.formConfig.autoApprove || false}
                    onChange={(e) => handleFormConfigChange('autoApprove', e.target.checked)}
                  />
                }
                label="Auto-approve Applications"
                />
              </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={updateAccountFormMutation.isPending}
              startIcon={<SaveIcon />}
            >
              Save Configuration
            </Button>
            <Button
              variant="outlined"
              onClick={() => window.location.reload()}
              disabled={updateAccountFormMutation.isPending}
            >
              Reset
            </Button>
          </Box>
        </Paper>
      )}

      {/* Form Fields Tab */}
      {activeTab === 1 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Form Fields Management
            </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Manage form fields for each section of the account application form.
          </Typography>

          {Object.entries(accountFormData?.sections || {}).map(([sectionKey, section]) => (
            <Accordion key={sectionKey} sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <Typography variant="h6" sx={{ flexGrow: 1 }}>
                    {section?.title || 'Section'}
                  </Typography>
                  <Chip 
                    label={`${section?.fields?.length || 0} fields`} 
                    size="small" 
                    color="primary" 
                    sx={{ mr: 2 }}
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    label="Section Title"
                    value={section?.title || ''}
                    onChange={(e) => handleSectionChange(sectionKey as keyof AccountFormData['sections'], 'title', e.target.value)}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Section Description"
                    multiline
                    rows={2}
                    value={section?.description || ''}
                    onChange={(e) => handleSectionChange(sectionKey as keyof AccountFormData['sections'], 'description', e.target.value)}
                  />
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1">Fields</Typography>
            <Button
                    variant="outlined"
              startIcon={<AddIcon />}
                    onClick={() => handleAddField(sectionKey as keyof AccountFormData['sections'])}
                    size="small"
            >
              Add Field
            </Button>
          </Box>

          <TableContainer>
                  <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Label</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Required</TableCell>
                        <TableCell>Placeholder</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                      {section?.fields?.map((field, fieldIndex) => (
                        <TableRow key={fieldIndex}>
                    <TableCell>
                            <TextField
                              size="small"
                              value={field.label}
                              onChange={(e) => handleUpdateField(
                                sectionKey as keyof AccountFormData['sections'], 
                                fieldIndex, 
                                { ...field, label: e.target.value }
                              )}
                              placeholder="Field label"
                            />
                    </TableCell>
                    <TableCell>
                            <FormControl size="small" sx={{ minWidth: 120 }}>
                              <Select
                                value={field.type}
                                onChange={(e) => handleUpdateField(
                                  sectionKey as keyof AccountFormData['sections'], 
                                  fieldIndex, 
                                  { ...field, type: e.target.value as FormField['type'] }
                                )}
                              >
                                <MenuItem value="text">Text</MenuItem>
                                <MenuItem value="email">Email</MenuItem>
                                <MenuItem value="tel">Phone</MenuItem>
                                <MenuItem value="number">Number</MenuItem>
                                <MenuItem value="date">Date</MenuItem>
                                <MenuItem value="select">Select</MenuItem>
                                <MenuItem value="textarea">Textarea</MenuItem>
                                <MenuItem value="file">File</MenuItem>
                                <MenuItem value="checkbox">Checkbox</MenuItem>
                                <MenuItem value="radio">Radio</MenuItem>
                              </Select>
                            </FormControl>
                    </TableCell>
                    <TableCell>
                            <Switch
                              checked={field.required}
                              onChange={(e) => handleUpdateField(
                                sectionKey as keyof AccountFormData['sections'], 
                                fieldIndex, 
                                { ...field, required: e.target.checked }
                              )}
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                            <TextField
                              size="small"
                              value={field.placeholder || ''}
                              onChange={(e) => handleUpdateField(
                                sectionKey as keyof AccountFormData['sections'], 
                                fieldIndex, 
                                { ...field, placeholder: e.target.value }
                              )}
                              placeholder="Placeholder text"
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Tooltip title="Edit Field">
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setEditingField(field);
                                    setIsFieldDialogOpen(true);
                                  }}
                                >
                                  <EditIcon fontSize="small" />
                      </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete Field">
                                <IconButton
                                  size="small"
                                  onClick={() => setDeleteConfirm(`${sectionKey}-${fieldIndex}`)}
                                  color="error"
                                >
                                  <DeleteIcon fontSize="small" />
                      </IconButton>
                              </Tooltip>
                            </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
              </AccordionDetails>
            </Accordion>
          ))}

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={updateAccountFormMutation.isPending}
              startIcon={<SaveIcon />}
            >
              Save Changes
            </Button>
          </Box>
        </Paper>
      )}

      {/* Documents Tab */}
      {activeTab === 2 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
              Document Requirements
            </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Configure required documents for the account application form.
          </Typography>

          <Alert severity="info" sx={{ mb: 3 }}>
            Document requirements are configured through the form fields. Use file input fields in the Form Fields tab to specify required documents.
          </Alert>

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={updateAccountFormMutation.isPending}
              startIcon={<SaveIcon />}
            >
              Save Changes
            </Button>
          </Box>
        </Paper>
      )}

      {/* Preview Tab */}
      {activeTab === 3 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Form Preview
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Preview the complete account application form as it will appear to users.
            </Typography>

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={updateAccountFormMutation.isPending}
              startIcon={<SaveIcon />}
            >
              Save Changes
            </Button>
                  </Box>
        </Paper>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this field? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button
            onClick={() => {
              if (deleteConfirm) {
                const [sectionKey, fieldIndex] = deleteConfirm.split('-');
                handleDeleteField(sectionKey as keyof AccountFormData['sections'], parseInt(fieldIndex));
                setDeleteConfirm(null);
              }
            }}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Message Snackbar */}
      <Snackbar
        open={!!message}
        autoHideDuration={5000}
        onClose={() => setMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setMessage(null)}
          severity={message?.type || 'info'}
          sx={{ width: '100%' }}
        >
          {message?.text}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AccountFormEditor;