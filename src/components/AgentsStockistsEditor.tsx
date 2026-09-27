import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Switch,
  FormControlLabel,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Snackbar,
  Alert,
  CircularProgress,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  Description as FileTextIcon,
  CreditCard as CreditCardIcon,
  Business as BusinessIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  Support as SupportIcon,
  AttachMoney as AttachMoneyIcon,
  School as SchoolIcon,
  Campaign as CampaignIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE = `${process.env.REACT_APP_API_BASE || 'http://localhost:5001'}/api`;

// Types
interface Application {
  id: string;
  applicationId?: string;
  title: string;
  description: string;
  icon: string;
  iconColor?: string;
  color?: string;
  link: string;
  buttonText: string;
  buttonColor?: string;
  isActive: boolean;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

interface Benefit {
  id: string;
  title: string;
  description: string;
  isActive: boolean;
  order: number;
}

interface Requirement {
  title: string;
  items: string[];
}

interface ProcessStep {
  step: number;
  title: string;
  description: string;
}

interface Process {
  title: string;
  steps: ProcessStep[];
}

interface AgentsStockistsData {
  id: string;
  hero: {
    title: string;
    subtitle: string;
  };
  applications: Application[];
  benefits: Benefit[];
  requirements: Requirement;
  process: Process;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

const AgentsStockistsEditor: React.FC = () => {
  const [agentsStockistsData, setAgentsStockistsData] = useState<AgentsStockistsData | null>(null);
  const [editingApplication, setEditingApplication] = useState<Application | null>(null);
  const [editingBenefit, setEditingBenefit] = useState<Benefit | null>(null);
  const [isApplicationDialogOpen, setIsApplicationDialogOpen] = useState(false);
  const [isBenefitDialogOpen, setIsBenefitDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'application' | 'benefit', id: string } | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [newRequirement, setNewRequirement] = useState('');
  const [newProcessStep, setNewProcessStep] = useState({ title: '', description: '' });

  const queryClient = useQueryClient();

  // Local storage functions
  const saveAgentsStockistsToStorage = useCallback((data: AgentsStockistsData) => {
    try {
      localStorage.setItem('agentsStockistsData', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving agents & stockists to storage:', error);
    }
  }, []);

  const loadAgentsStockistsFromStorage = useCallback((): AgentsStockistsData | null => {
    try {
      const stored = localStorage.getItem('agentsStockistsData');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error loading agents & stockists from storage:', error);
      return null;
    }
  }, []);

  // Fetch agents & stockists data
  const { data: fetchedData, isLoading, error } = useQuery({
    queryKey: ['agents-stockists'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/agents-stockists`);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update agents & stockists data mutation
  const updateAgentsStockistsMutation = useMutation({
    mutationFn: async (data: Partial<AgentsStockistsData>) => {
      const response = await axios.put(`${API_BASE}/agents-stockists`, data);
      return response.data;
    },
    onSuccess: (data) => {
      setAgentsStockistsData(data.data);
      saveAgentsStockistsToStorage(data.data);
      queryClient.invalidateQueries({ queryKey: ['agents-stockists'] });
      setMessage({ type: 'success', text: 'Agents & Stockists updated successfully!' });
    },
    onError: (error: any) => {
      console.error('Error updating agents & stockists:', error);
      setMessage({ type: 'error', text: 'Failed to update agents & stockists. Please try again.' });
    }
  });

  // Add application mutation
  const addApplicationMutation = useMutation({
    mutationFn: async (application: Omit<Application, 'id' | 'order'>) => {
      if (!agentsStockistsData) throw new Error('No data available');
      
      const newApplication: Application = {
        ...application,
        id: `app-${Date.now()}`,
        order: (agentsStockistsData.applications || []).length
      };
      
      const updatedData = {
        ...agentsStockistsData,
        applications: [...(agentsStockistsData.applications || []), newApplication]
      };
      
      const response = await axios.put(`${API_BASE}/agents-stockists`, updatedData);
      return response.data;
    },
    onSuccess: (data) => {
      setAgentsStockistsData(data.data);
      saveAgentsStockistsToStorage(data.data);
      queryClient.invalidateQueries({ queryKey: ['agents-stockists'] });
      setMessage({ type: 'success', text: 'Application added successfully!' });
      setIsApplicationDialogOpen(false);
      setEditingApplication(null);
    },
    onError: (error: any) => {
      console.error('Error adding application:', error);
      setMessage({ type: 'error', text: 'Failed to add application. Please try again.' });
    }
  });

  // Update application mutation
  const updateApplicationMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: Partial<Application> }) => {
      if (!agentsStockistsData) throw new Error('No data available');
      
      const updatedApplications = (agentsStockistsData.applications || []).map(app => 
        app.id === id ? { ...app, ...updates } : app
      );
      
      const updatedData = {
        ...agentsStockistsData,
        applications: updatedApplications
      };
      
      const response = await axios.put(`${API_BASE}/agents-stockists`, updatedData);
      return response.data;
    },
    onSuccess: (data) => {
      setAgentsStockistsData(data.data);
      saveAgentsStockistsToStorage(data.data);
      queryClient.invalidateQueries({ queryKey: ['agents-stockists'] });
      setMessage({ type: 'success', text: 'Application updated successfully!' });
      setIsApplicationDialogOpen(false);
      setEditingApplication(null);
    },
    onError: (error: any) => {
      console.error('Error updating application:', error);
      setMessage({ type: 'error', text: 'Failed to update application. Please try again.' });
    }
  });

  // Delete application mutation
  const deleteApplicationMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!agentsStockistsData) throw new Error('No data available');
      
      const updatedApplications = (agentsStockistsData.applications || []).filter(app => app.id !== id);
      
      const updatedData = {
        ...agentsStockistsData,
        applications: updatedApplications
      };
      
      const response = await axios.put(`${API_BASE}/agents-stockists`, updatedData);
      return response.data;
    },
    onSuccess: (data) => {
      setAgentsStockistsData(data.data);
      saveAgentsStockistsToStorage(data.data);
      queryClient.invalidateQueries({ queryKey: ['agents-stockists'] });
      setMessage({ type: 'success', text: 'Application deleted successfully!' });
      setDeleteConfirm(null);
    },
    onError: (error: any) => {
      console.error('Error deleting application:', error);
      setMessage({ type: 'error', text: 'Failed to delete application. Please try again.' });
    }
  });

  // Add benefit mutation
  const addBenefitMutation = useMutation({
    mutationFn: async (benefit: Omit<Benefit, 'id' | 'order'>) => {
      if (!agentsStockistsData) throw new Error('No data available');
      
      const newBenefit: Benefit = {
        ...benefit,
        id: `benefit-${Date.now()}`,
        order: (agentsStockistsData.benefits || []).length
      };
      
      const updatedData = {
        ...agentsStockistsData,
        benefits: [...(agentsStockistsData.benefits || []), newBenefit]
      };
      
      const response = await axios.put(`${API_BASE}/agents-stockists`, updatedData);
      return response.data;
    },
    onSuccess: (data) => {
      setAgentsStockistsData(data.data);
      saveAgentsStockistsToStorage(data.data);
      queryClient.invalidateQueries({ queryKey: ['agents-stockists'] });
      setMessage({ type: 'success', text: 'Benefit added successfully!' });
      setIsBenefitDialogOpen(false);
      setEditingBenefit(null);
    },
    onError: (error: any) => {
      console.error('Error adding benefit:', error);
      setMessage({ type: 'error', text: 'Failed to add benefit. Please try again.' });
    }
  });

  // Update benefit mutation
  const updateBenefitMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: Partial<Benefit> }) => {
      if (!agentsStockistsData) throw new Error('No data available');
      
      const updatedBenefits = (agentsStockistsData.benefits || []).map(benefit => 
        benefit.id === id ? { ...benefit, ...updates } : benefit
      );
      
      const updatedData = {
        ...agentsStockistsData,
        benefits: updatedBenefits
      };
      
      const response = await axios.put(`${API_BASE}/agents-stockists`, updatedData);
      return response.data;
    },
    onSuccess: (data) => {
      setAgentsStockistsData(data.data);
      saveAgentsStockistsToStorage(data.data);
      queryClient.invalidateQueries({ queryKey: ['agents-stockists'] });
      setMessage({ type: 'success', text: 'Benefit updated successfully!' });
      setIsBenefitDialogOpen(false);
      setEditingBenefit(null);
    },
    onError: (error: any) => {
      console.error('Error updating benefit:', error);
      setMessage({ type: 'error', text: 'Failed to update benefit. Please try again.' });
    }
  });

  // Delete benefit mutation
  const deleteBenefitMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!agentsStockistsData) throw new Error('No data available');
      
      const updatedBenefits = (agentsStockistsData.benefits || []).filter(benefit => benefit.id !== id);
      
      const updatedData = {
        ...agentsStockistsData,
        benefits: updatedBenefits
      };
      
      const response = await axios.put(`${API_BASE}/agents-stockists`, updatedData);
      return response.data;
    },
    onSuccess: (data) => {
      setAgentsStockistsData(data.data);
      saveAgentsStockistsToStorage(data.data);
      queryClient.invalidateQueries({ queryKey: ['agents-stockists'] });
      setMessage({ type: 'success', text: 'Benefit deleted successfully!' });
      setDeleteConfirm(null);
    },
    onError: (error: any) => {
      console.error('Error deleting benefit:', error);
      setMessage({ type: 'error', text: 'Failed to delete benefit. Please try again.' });
    }
  });

  // Set agents & stockists data from fetched data
  useEffect(() => {
    if (fetchedData) {
      // Ensure all required properties exist with defaults
      const dataWithDefaults = {
        ...fetchedData,
        hero: fetchedData.hero || { title: 'Agents & Stockists Hub', subtitle: 'Join Kenya Seed Co. Ltd as an agent or stockist. Choose the application form that best suits your needs below.' },
        applications: fetchedData.applications || [],
        benefits: fetchedData.benefits || [],
        requirements: fetchedData.requirements || { title: 'Requirements', items: [] },
        process: fetchedData.process || { title: 'Application Process', steps: [] }
      };
      setAgentsStockistsData(dataWithDefaults);
      saveAgentsStockistsToStorage(dataWithDefaults);
    } else {
      // Try to load from local storage as fallback
      const storedData = loadAgentsStockistsFromStorage();
      if (storedData) {
        setAgentsStockistsData(storedData);
      }
    }
  }, [fetchedData, saveAgentsStockistsToStorage, loadAgentsStockistsFromStorage]);

  // Handle save
  const handleSave = () => {
    if (agentsStockistsData) {
      updateAgentsStockistsMutation.mutate(agentsStockistsData);
    }
  };

  // Handle add application
  const handleAddApplication = () => {
    setEditingApplication({
      id: '',
      title: '',
      description: '',
      icon: 'FileText',
      color: 'green',
      link: '',
      buttonText: 'Start Application',
      isActive: true,
      order: 0
    });
    setIsApplicationDialogOpen(true);
  };

  // Handle edit application
  const handleEditApplication = (application: Application) => {
    setEditingApplication({ ...application });
    setIsApplicationDialogOpen(true);
  };

  // Handle save application
  const handleSaveApplication = () => {
    if (editingApplication) {
      if (editingApplication.id) {
        updateApplicationMutation.mutate({ id: editingApplication.id, updates: editingApplication });
      } else {
        addApplicationMutation.mutate(editingApplication);
      }
    }
  };

  // Handle add benefit
  const handleAddBenefit = () => {
    setEditingBenefit({
      id: '',
      title: '',
      description: '',
      isActive: true,
      order: 0
    });
    setIsBenefitDialogOpen(true);
  };

  // Handle edit benefit
  const handleEditBenefit = (benefit: Benefit) => {
    setEditingBenefit({ ...benefit });
    setIsBenefitDialogOpen(true);
  };

  // Handle save benefit
  const handleSaveBenefit = () => {
    if (editingBenefit) {
      if (editingBenefit.id) {
        updateBenefitMutation.mutate({ id: editingBenefit.id, updates: editingBenefit });
    } else {
        addBenefitMutation.mutate(editingBenefit);
      }
    }
  };

  // Handle add requirement
  const handleAddRequirement = () => {
    if (newRequirement.trim() && agentsStockistsData) {
      setAgentsStockistsData({
        ...agentsStockistsData,
        requirements: {
          ...agentsStockistsData.requirements,
          items: [...(agentsStockistsData.requirements?.items || []), newRequirement.trim()]
        }
      });
      setNewRequirement('');
    }
  };

  // Handle remove requirement
  const handleRemoveRequirement = (index: number) => {
    if (agentsStockistsData) {
      setAgentsStockistsData({
        ...agentsStockistsData,
        requirements: {
          ...agentsStockistsData.requirements,
          items: (agentsStockistsData.requirements?.items || []).filter((_, i) => i !== index)
        }
      });
    }
  };

  // Handle add process step
  const handleAddProcessStep = () => {
    if (newProcessStep.title.trim() && newProcessStep.description.trim() && agentsStockistsData) {
      setAgentsStockistsData({
        ...agentsStockistsData,
        process: {
          ...agentsStockistsData.process,
          steps: [
            ...(agentsStockistsData.process?.steps || []),
            {
              step: (agentsStockistsData.process?.steps || []).length + 1,
              title: newProcessStep.title.trim(),
              description: newProcessStep.description.trim()
            }
          ]
        }
      });
      setNewProcessStep({ title: '', description: '' });
    }
  };

  // Handle remove process step
  const handleRemoveProcessStep = (index: number) => {
    if (agentsStockistsData) {
      setAgentsStockistsData({
        ...agentsStockistsData,
        process: {
          ...agentsStockistsData.process,
          steps: (agentsStockistsData.process?.steps || []).filter((_, i) => i !== index).map((step, i) => ({
            ...step,
            step: i + 1
          }))
        }
      });
    }
  };

  // Icon mapping
  const getIcon = (iconName: string) => {
    const iconMap: { [key: string]: React.ComponentType<any> } = {
      FileText: FileTextIcon,
      CreditCard: CreditCardIcon,
      Business: BusinessIcon,
      Star: StarIcon,
      TrendingUp: TrendingUpIcon,
      Support: SupportIcon,
      AttachMoney: AttachMoneyIcon,
      School: SchoolIcon,
      Campaign: CampaignIcon
    };
    return iconMap[iconName] || FileTextIcon;
  };

  // Color mapping
  const getColorClasses = (color: string) => {
    const colorMap: { [key: string]: { bg: string, text: string, button: string } } = {
      green: { bg: 'bg-green-100', text: 'text-green-600', button: 'bg-green-600 hover:bg-green-700' },
      blue: { bg: 'bg-blue-100', text: 'text-blue-600', button: 'bg-blue-600 hover:bg-blue-700' },
      purple: { bg: 'bg-purple-100', text: 'text-purple-600', button: 'bg-purple-600 hover:bg-purple-700' },
      orange: { bg: 'bg-orange-100', text: 'text-orange-600', button: 'bg-orange-600 hover:bg-orange-700' },
      red: { bg: 'bg-red-100', text: 'text-red-600', button: 'bg-red-600 hover:bg-red-700' }
    };
    return colorMap[color] || colorMap.green;
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
      <Box p={3}>
        <Alert severity="error">
          Failed to load agents & stockists data. Please try again later.
        </Alert>
      </Box>
    );
  }

  if (!agentsStockistsData) {
  return (
      <Box p={3}>
        <Alert severity="info">
          No agents & stockists data available.
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, color: 'primary.main', fontWeight: 'bold' }}>Agents & Stockists Management
      </Typography>

      {/* Live Preview */}
      <Paper sx={{ p: 3, mb: 4, bgcolor: '#f7f8fa' }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 3, color: 'primary.main', fontWeight: 'bold' }}>
          Live Preview - This is how your agents & stockists page appears to visitors
          </Typography>
          
        <div className="min-h-screen">
          {/* Hero Section */}
          <section className="relative py-32 bg-gradient-to-r from-green-700 via-green-600 to-green-800 text-center text-white">
            <div className="container mx-auto px-4">
              <h1 className="text-5xl lg:text-6xl font-bold mb-4">
                {agentsStockistsData.hero?.title || 'Agents & Stockists Hub'}
              </h1>
              <p className="max-w-3xl mx-auto mb-12 text-lg lg:text-xl text-white/90">
                {agentsStockistsData.hero?.subtitle || 'Join Kenya Seed Co. Ltd as an agent or stockist. Choose the application form that best suits your needs below.'}
              </p>

              {/* Application Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {(agentsStockistsData.applications || []).filter(app => app.isActive).map((application, index) => {
                  const IconComponent = getIcon(application.icon);
                  const colorClasses = getColorClasses(application.iconColor || application.color || 'green');
                  return (
                    <a key={index} href={application.link} className="block">
                      <div className="bg-white text-gray-800 rounded-2xl shadow-lg p-8 hover:shadow-xl transition transform hover:-translate-y-1">
                        <div className="flex items-center mb-4">
                          <div className={`${colorClasses.bg} p-3 rounded-xl mr-4`}>
                            <IconComponent className={`h-8 w-8 ${colorClasses.text}`} />
                          </div>
                          <h3 className="text-2xl font-semibold">
                            {application.title}
                          </h3>
                        </div>
                        <p className="text-gray-600 mb-6">
                          {application.description}
                        </p>
                        <button className={`${colorClasses.button} text-white font-semibold py-2 px-5 rounded-lg`}>
                          {application.buttonText}
                        </button>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Benefits Section */}
          <section className="py-16 bg-gray-50">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-green-600 mb-4">Why Partner With Us?</h2>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                  Join our network of trusted agents and stockists and enjoy exclusive benefits
                </p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(agentsStockistsData.benefits || []).filter(b => b.isActive).map((benefit, index) => (
                  <div key={index} className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-xl font-semibold mb-3 text-green-600">{benefit.title}</h3>
                    <p className="text-gray-600">{benefit.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Requirements Section */}
          <section className="py-16">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-green-600 mb-4">{agentsStockistsData.requirements?.title || 'Requirements'}</h2>
              </div>
              <div className="max-w-4xl mx-auto">
                <div className="grid md:grid-cols-2 gap-6">
                  {(agentsStockistsData.requirements?.items || []).map((item, index) => (
                    <div key={index} className="flex items-center p-4 bg-white rounded-lg shadow-sm">
                      <CheckCircleIcon className="text-green-600 mr-3" />
                      <span className="text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Process Section */}
          <section className="py-16 bg-gray-50">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-green-600 mb-4">{agentsStockistsData.process?.title || 'Application Process'}</h2>
              </div>
              <div className="max-w-4xl mx-auto">
                <div className="space-y-8">
                  {(agentsStockistsData.process?.steps || []).map((step, index) => (
                    <div key={index} className="flex items-start">
                      <div className="flex-shrink-0 w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center text-xl font-bold mr-6">
                        {step.step}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">{step.title}</h3>
                        <p className="text-gray-600">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </Paper>

      {/* Management Controls */}
          <Grid container spacing={3}>
        {/* Hero Section Management */}
            <Grid item xs={12}>
          <Card>
            <CardHeader title="Hero Section" />
            <CardContent>
              <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                    label="Title"
                    value={agentsStockistsData.hero?.title || ''}
                    onChange={(e) => setAgentsStockistsData({
                      ...agentsStockistsData,
                      hero: { ...agentsStockistsData.hero, title: e.target.value }
                    })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                    label="Subtitle"
                    value={agentsStockistsData.hero?.subtitle || ''}
                    onChange={(e) => setAgentsStockistsData({
                      ...agentsStockistsData,
                      hero: { ...agentsStockistsData.hero, subtitle: e.target.value }
                    })}
              />
            </Grid>
              </Grid>
            </CardContent>
          </Card>
          </Grid>

        {/* Applications Management */}
        <Grid item xs={12}>
          <Card>
            <CardHeader 
              title="Application Forms" 
              action={
            <Button
              variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddApplication}
            >
                  Add Application
            </Button>
              }
            />
            <CardContent>
              <Grid container spacing={2}>
                {(agentsStockistsData.applications || []).map((application, index) => {
                  const IconComponent = getIcon(application.icon);
                  return (
                    <Grid item xs={12} md={6} key={application.id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box display="flex" alignItems="center" mb={2}>
                            <IconComponent sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography variant="h6">{application.title}</Typography>
                            <Box flexGrow={1} />
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={application.isActive}
                                  onChange={(e) => {
                                    const updatedApplications = [...agentsStockistsData.applications];
                                    updatedApplications[index].isActive = e.target.checked;
                                    setAgentsStockistsData({
                                      ...agentsStockistsData,
                                      applications: updatedApplications
                                    });
                                  }}
                                />
                              }
                              label="Active"
                            />
          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {application.description}
            </Typography>
                          <Box display="flex" gap={1}>
            <Button
                              size="small"
                              startIcon={<EditIcon />}
                              onClick={() => handleEditApplication(application)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="small"
                              color="error"
                              startIcon={<DeleteIcon />}
                              onClick={() => setDeleteConfirm({ type: 'application', id: application.id })}
                            >
                              Delete
            </Button>
          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Benefits Management */}
        <Grid item xs={12}>
          <Card>
            <CardHeader 
              title="Benefits" 
              action={
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddBenefit}
                >
                  Add Benefit
                </Button>
              }
            />
                          <CardContent>
              <Grid container spacing={2}>
                {(agentsStockistsData.benefits || []).map((benefit, index) => (
                  <Grid item xs={12} md={6} key={benefit.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                          <Typography variant="h6">{benefit.title}</Typography>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={benefit.isActive}
                                onChange={(e) => {
                                  const updatedBenefits = [...agentsStockistsData.benefits];
                                  updatedBenefits[index].isActive = e.target.checked;
                                  setAgentsStockistsData({
                                    ...agentsStockistsData,
                                    benefits: updatedBenefits
                                  });
                                }}
                              />
                            }
                            label="Active"
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {benefit.description}
                                </Typography>
                        <Box display="flex" gap={1}>
                          <Button
                            size="small"
                            startIcon={<EditIcon />}
                            onClick={() => handleEditBenefit(benefit)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={() => setDeleteConfirm({ type: 'benefit', id: benefit.id })}
                          >
                            Delete
                          </Button>
                            </Box>
                          </CardContent>
                        </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Requirements Management */}
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Requirements" />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Requirements Title"
                    value={agentsStockistsData.requirements?.title || ''}
                    onChange={(e) => setAgentsStockistsData({
                      ...agentsStockistsData,
                      requirements: {
                        ...agentsStockistsData.requirements,
                        title: e.target.value
                      }
                    })}
                  />
                </Grid>
                <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
                    Requirements List
          </Typography>
                  <Box display="flex" gap={1} mb={2}>
                    <TextField
                      fullWidth
                      label="Add Requirement"
                      value={newRequirement}
                      onChange={(e) => setNewRequirement(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleAddRequirement();
                        }
                      }}
                    />
                    <Button
                      variant="contained"
                      onClick={handleAddRequirement}
                      disabled={!newRequirement.trim()}
                    >
                      Add
                    </Button>
          </Box>
                  <List>
                    {(agentsStockistsData.requirements?.items || []).map((item, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={item} />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            onClick={() => handleRemoveRequirement(index)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Process Management */}
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Application Process" />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Process Title"
                    value={agentsStockistsData.process?.title || ''}
                    onChange={(e) => setAgentsStockistsData({
                      ...agentsStockistsData,
                      process: {
                        ...agentsStockistsData.process,
                        title: e.target.value
                      }
                    })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Process Steps
                      </Typography>
                  <Box display="flex" gap={1} mb={2}>
                    <TextField
                      fullWidth
                      label="Step Title"
                      value={newProcessStep.title}
                      onChange={(e) => setNewProcessStep({ ...newProcessStep, title: e.target.value })}
                    />
                    <TextField
                      fullWidth
                      label="Step Description"
                      value={newProcessStep.description}
                      onChange={(e) => setNewProcessStep({ ...newProcessStep, description: e.target.value })}
                    />
                  <Button 
                    variant="contained" 
                      onClick={handleAddProcessStep}
                      disabled={!newProcessStep.title.trim() || !newProcessStep.description.trim()}
                    >
                      Add Step
                  </Button>
                  </Box>
                  <List>
                    {(agentsStockistsData.process?.steps || []).map((step, index) => (
                      <ListItem key={index}>
                        <ListItemText 
                          primary={`Step ${step.step}: ${step.title}`}
                          secondary={step.description}
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            onClick={() => handleRemoveProcessStep(index)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </Grid>
              </Grid>
            </CardContent>
                </Card>
              </Grid>

        {/* Save Button */}
        <Grid item xs={12}>
          <Box display="flex" justifyContent="center" mt={3}>
            <Button
              variant="contained"
              size="large"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={updateAgentsStockistsMutation.isPending}
            >
              {updateAgentsStockistsMutation.isPending ? 'Saving...' : 'Save All Changes'}
            </Button>
          </Box>
          </Grid>
      </Grid>

      {/* Application Dialog */}
      <Dialog open={isApplicationDialogOpen} onClose={() => setIsApplicationDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingApplication?.id ? 'Edit Application' : 'Add Application'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={editingApplication?.title || ''}
                onChange={(e) => setEditingApplication({
                  ...editingApplication!,
                  title: e.target.value
                })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={editingApplication?.description || ''}
                onChange={(e) => setEditingApplication({
                  ...editingApplication!,
                  description: e.target.value
                })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Icon</InputLabel>
                <Select
                  value={editingApplication?.icon || 'FileText'}
                  onChange={(e) => setEditingApplication({
                    ...editingApplication!,
                    icon: e.target.value
                  })}
                >
                  <MenuItem value="FileText">File Text</MenuItem>
                  <MenuItem value="CreditCard">Credit Card</MenuItem>
                  <MenuItem value="Business">Business</MenuItem>
                  <MenuItem value="Star">Star</MenuItem>
                  <MenuItem value="TrendingUp">Trending Up</MenuItem>
                  <MenuItem value="Support">Support</MenuItem>
                  <MenuItem value="AttachMoney">Money</MenuItem>
                  <MenuItem value="School">School</MenuItem>
                  <MenuItem value="Campaign">Campaign</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Color</InputLabel>
                <Select
                  value={editingApplication?.color || 'green'}
                  onChange={(e) => setEditingApplication({
                    ...editingApplication!,
                    color: e.target.value
                  })}
                >
                  <MenuItem value="green">Green</MenuItem>
                  <MenuItem value="blue">Blue</MenuItem>
                  <MenuItem value="purple">Purple</MenuItem>
                  <MenuItem value="orange">Orange</MenuItem>
                  <MenuItem value="red">Red</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Link"
                value={editingApplication?.link || ''}
                onChange={(e) => setEditingApplication({
                  ...editingApplication!,
                  link: e.target.value
                })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Button Text"
                value={editingApplication?.buttonText || ''}
                onChange={(e) => setEditingApplication({
                  ...editingApplication!,
                  buttonText: e.target.value
                })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={editingApplication?.isActive || false}
                    onChange={(e) => setEditingApplication({
                      ...editingApplication!,
                      isActive: e.target.checked
                    })}
                  />
                }
                label="Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsApplicationDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSaveApplication}
            variant="contained"
            disabled={addApplicationMutation.isPending || updateApplicationMutation.isPending}
          >
            {addApplicationMutation.isPending || updateApplicationMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Benefit Dialog */}
      <Dialog open={isBenefitDialogOpen} onClose={() => setIsBenefitDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingBenefit?.id ? 'Edit Benefit' : 'Add Benefit'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={editingBenefit?.title || ''}
                onChange={(e) => setEditingBenefit({
                  ...editingBenefit!,
                  title: e.target.value
                })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={editingBenefit?.description || ''}
                onChange={(e) => setEditingBenefit({
                  ...editingBenefit!,
                  description: e.target.value
                })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={editingBenefit?.isActive || false}
                    onChange={(e) => setEditingBenefit({
                      ...editingBenefit!,
                      isActive: e.target.checked
                    })}
                  />
                }
                label="Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsBenefitDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSaveBenefit}
            variant="contained"
            disabled={addBenefitMutation.isPending || updateBenefitMutation.isPending}
          >
            {addBenefitMutation.isPending || updateBenefitMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this {deleteConfirm?.type}? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button
            onClick={() => {
              if (deleteConfirm) {
                if (deleteConfirm.type === 'application') {
                  deleteApplicationMutation.mutate(deleteConfirm.id);
                } else {
                  deleteBenefitMutation.mutate(deleteConfirm.id);
                }
              }
            }}
            color="error"
            variant="contained"
            disabled={deleteApplicationMutation.isPending || deleteBenefitMutation.isPending}
          >
            {deleteApplicationMutation.isPending || deleteBenefitMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for messages */}
      <Snackbar
        open={!!message}
        autoHideDuration={6000}
        onClose={() => setMessage(null)}
      >
        <Alert 
          onClose={() => setMessage(null)}
          severity={message?.type || 'success'}
          sx={{ width: '100%' }}
        >
          {message?.text}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AgentsStockistsEditor;