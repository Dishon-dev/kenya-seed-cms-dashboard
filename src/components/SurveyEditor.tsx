import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  TextField, 
  Grid, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Alert, 
  Snackbar, 
  CircularProgress, 
  Card,
  CardContent,
  CardHeader,
  Paper,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Save as SaveIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Upload as UploadIcon,
  Close as CloseIcon,
  QuestionAnswer as QuestionIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5001';

interface SurveyQuestion {
  id?: string | number;
  question: string;
  type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox';
  required: boolean;
  placeholder?: string;
  options?: string[];
  order: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface SurveyData {
  id?: string | number;
  title: string;
  subtitle?: string;
  logo: string;
  companyName: string;
  companySubtitle: string;
  formAction: string;
  nextUrl: string;
  questions: SurveyQuestion[];
  isActive: boolean;
  order: number;
  // Popup configuration
  popup: {
    enabled: boolean;
    delay: number; // in milliseconds
    title: string;
    message: string;
    buttonText: string;
    dismissText: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

const SurveyEditor: React.FC = () => {
  const [surveyData, setSurveyData] = useState<SurveyData | null>(null);
  const [editingSurvey, setEditingSurvey] = useState<SurveyData | null>(null);
  const [isSurveyDialogOpen, setIsSurveyDialogOpen] = useState(false);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const mountedRef = useRef(true);
  const messageTimeoutRef = useRef<number | null>(null);
  const queryClient = useQueryClient();

  // Local storage functions
  const saveSurveyToStorage = useCallback((data: SurveyData) => {
    try {
      localStorage.setItem('surveyData', JSON.stringify(data));
      console.log('Survey data saved to localStorage');
    } catch (error) {
      console.error('Failed to save survey data to localStorage:', error);
    }
  }, []);

  const loadSurveyFromStorage = useCallback((): SurveyData | null => {
    try {
      const stored = localStorage.getItem('surveyData');
      if (stored) {
        const data = JSON.parse(stored);
        console.log('Survey data loaded from localStorage');
        return data;
      }
    } catch (error) {
      console.error('Failed to load survey data from localStorage:', error);
    }
    return null;
  }, []);

  // Image caching functions
  const cacheImage = useCallback((imageUrl: string, imageData: string) => {
    try {
      const imageCache = JSON.parse(localStorage.getItem('surveyImages') || '{}');
      imageCache[imageUrl] = imageData;
      localStorage.setItem('surveyImages', JSON.stringify(imageCache));
      console.log('Image cached for:', imageUrl);
    } catch (error) {
      console.error('Failed to cache image:', error);
    }
  }, []);

  const getCachedImage = useCallback((imageUrl: string): string | null => {
    try {
      const imageCache = JSON.parse(localStorage.getItem('surveyImages') || '{}');
      return imageCache[imageUrl] || null;
    } catch (error) {
      console.error('Failed to get cached image:', error);
      return null;
    }
  }, []);

  // Fetch survey data
  const { data: surveyResponse, isPending, error } = useQuery({
    queryKey: ['survey'],
    queryFn: async () => {
      try {
        const cachedData = loadSurveyFromStorage();
        if (cachedData) {
          setTimeout(async () => {
            try {
              const response = await axios.get(`${API_BASE}/api/survey`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
              });
              if (response.data) {
                saveSurveyToStorage(response.data);
                queryClient.setQueryData(['survey'], response.data);
              }
            } catch (error) {
              console.log('Background API fetch failed, using cached data');
            }
          }, 100);
          return cachedData;
        }

        const response = await axios.get(`${API_BASE}/api/survey`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.data) {
          saveSurveyToStorage(response.data);
        }
        return response.data;
      } catch (error) {
        const cachedData = loadSurveyFromStorage();
        if (cachedData) {
          return cachedData;
        }
        throw error;
      }
    },
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  });

  // Save survey mutation
  const saveSurveyMutation = useMutation<any, any, SurveyData>({
    mutationFn: async (data) => {
      const response = await axios.post(`${API_BASE}/api/survey`, data, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      saveSurveyToStorage(variables);
      queryClient.invalidateQueries({ queryKey: ['survey'] });
      showMessage('success', 'Survey updated successfully!');
      setEditingSurvey(null);
      setIsSurveyDialogOpen(false);
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error || 
        'Failed to save survey. Please try again.';
      showMessage('error', errorMessage);
    }
  });

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
        messageTimeoutRef.current = null;
      }
    };
  }, []);

  const showMessage = useCallback((type: 'success' | 'error', text: string, ttl: number = 5000) => {
    if (!mountedRef.current) return;
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
      messageTimeoutRef.current = null;
    }
    setMessage({ type, text });
    messageTimeoutRef.current = window.setTimeout(() => {
      if (mountedRef.current) {
        setMessage(null);
        messageTimeoutRef.current = null;
      }
    }, ttl);
  }, []);

  useEffect(() => {
    if (surveyResponse) {
      setSurveyData(surveyResponse);
    }
  }, [surveyResponse]);

  const openEditSurvey = () => {
    setEditingSurvey(surveyData || {
      title: 'Customer Satisfaction Survey',
      subtitle: '',
      logo: '/api/images/survey/ksc_logo.png',
      companyName: 'Kenya Seed',
      companySubtitle: 'Company Limited',
      formAction: 'https://formsubmit.co/complaints@kenyaseed.co.ke',
      nextUrl: 'https://kenyaseed.co.ke/thank-you',
      popup: {
        enabled: true,
        delay: 2000,
        title: "We'd love your feedback!",
        message: "Help us improve by taking a short survey.",
        buttonText: "Take Survey",
        dismissText: "Maybe Later"
      },
      questions: [
        {
          id: '1',
          question: 'What are your preferred Maize Seed varieties?',
          type: 'text',
          required: true,
          placeholder: 'Enter your preferred variety',
          order: 0,
          isActive: true
        },
        {
          id: '2',
          question: 'What has been your experience with our products & services?',
          type: 'text',
          required: true,
          placeholder: 'Share your experience',
          order: 1,
          isActive: true
        },
        {
          id: '3',
          question: 'What would you like Kenya Seed to improve on?',
          type: 'textarea',
          required: true,
          placeholder: 'Please share your suggestions',
          order: 2,
          isActive: true
        }
      ],
      isActive: true,
      order: 0
    });
    setIsSurveyDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingSurvey) return;
    
    if (!editingSurvey.title || !editingSurvey.companyName) {
      showMessage('error', 'Title and company name are required');
      return;
    }

    setIsSaving(true);
    try {
      await saveSurveyMutation.mutateAsync(editingSurvey);
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const addQuestion = () => {
    if (!editingSurvey) return;
    const newQuestion: SurveyQuestion = {
      question: '',
      type: 'text',
      required: true,
      placeholder: '',
      order: editingSurvey.questions.length,
      isActive: true
    };
    setEditingSurvey({
      ...editingSurvey,
      questions: [...editingSurvey.questions, newQuestion]
    });
  };

  const updateQuestion = (index: number, field: keyof SurveyQuestion, value: string | boolean | number | string[]) => {
    if (!editingSurvey) return;
    const updatedQuestions = [...editingSurvey.questions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    setEditingSurvey({ ...editingSurvey, questions: updatedQuestions });
  };

  const removeQuestion = (index: number) => {
    if (!editingSurvey) return;
    const updatedQuestions = editingSurvey.questions.filter((_, i) => i !== index);
    setEditingSurvey({ ...editingSurvey, questions: updatedQuestions });
  };

  const addOption = (questionIndex: number) => {
    if (!editingSurvey) return;
    const updatedQuestions = [...editingSurvey.questions];
    const question = updatedQuestions[questionIndex];
    const newOptions = [...(question.options || []), ''];
    updatedQuestions[questionIndex] = { ...question, options: newOptions };
    setEditingSurvey({ ...editingSurvey, questions: updatedQuestions });
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    if (!editingSurvey) return;
    const updatedQuestions = [...editingSurvey.questions];
    const question = updatedQuestions[questionIndex];
    const newOptions = [...(question.options || [])];
    newOptions[optionIndex] = value;
    updatedQuestions[questionIndex] = { ...question, options: newOptions };
    setEditingSurvey({ ...editingSurvey, questions: updatedQuestions });
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    if (!editingSurvey) return;
    const updatedQuestions = [...editingSurvey.questions];
    const question = updatedQuestions[questionIndex];
    const newOptions = (question.options || []).filter((_, i) => i !== optionIndex);
    updatedQuestions[questionIndex] = { ...question, options: newOptions };
    setEditingSurvey({ ...editingSurvey, questions: updatedQuestions });
  };

  const handleFileUpload = async (file: File) => {
    if (!editingSurvey) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('folder', 'survey');
      
      const response = await axios.post(`${API_BASE}/api/upload/image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          setUploadProgress(percentCompleted);
        }
      });

      if (response.data.success && response.data.imageUrl) {
        setEditingSurvey({ ...editingSurvey, logo: response.data.imageUrl });
        
        // Cache the uploaded image
        const reader = new FileReader();
        reader.onload = () => {
          if (reader.result) {
            cacheImage(response.data.imageUrl, reader.result as string);
          }
        };
        reader.readAsDataURL(file);
        
        showMessage('success', 'Logo uploaded successfully!');
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || 'Failed to upload logo';
      showMessage('error', errorMessage);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const resolveImageUrl = (image: string) => {
    if (!image) return '/api/images/survey/placeholder.svg';
    
    // Check if we have a cached version of this image
    const cachedImage = getCachedImage(image);
    if (cachedImage) {
      return cachedImage;
    }
    
    // Convert API path to public folder path
    if (image.startsWith('/api/images/survey/')) {
      return image;
    }
    
    // Fallback to original URL
    if (image.startsWith('http')) return image;
    if (image.startsWith('/')) return `${API_BASE}${image}`;
    return `${API_BASE}/${image}`;
  };

  const renderQuestionPreview = (question: SurveyQuestion, index: number) => {
    const questionNumber = index + 1;
    
    switch (question.type) {
      case 'text':
        return (
          <div key={index}>
            <label className="block font-medium mb-2">
              {questionNumber}. {question.question} {question.required && '*'}
            </label>
            <input
              type="text"
              placeholder={question.placeholder}
              disabled
              className="w-full border border-gray-300 px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        );
      
      case 'textarea':
        return (
          <div key={index}>
            <label className="block font-medium mb-2">
              {questionNumber}. {question.question} {question.required && '*'}
            </label>
            <textarea
              rows={4}
              placeholder={question.placeholder}
              disabled
              className="w-full border border-gray-300 px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        );
      
      case 'select':
        return (
          <div key={index}>
            <label className="block font-medium mb-2">
              {questionNumber}. {question.question} {question.required && '*'}
            </label>
            <select
              disabled
              className="w-full border border-gray-300 px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option>Select an option</option>
              {question.options?.map((option, optIndex) => (
                <option key={optIndex} value={option}>{option}</option>
              ))}
            </select>
          </div>
        );
      
      case 'radio':
        return (
          <div key={index}>
            <label className="block font-medium mb-2">
              {questionNumber}. {question.question} {question.required && '*'}
            </label>
            <div className="space-y-2">
              {question.options?.map((option, optIndex) => (
                <label key={optIndex} className="flex items-center">
                  <input
                    type="radio"
                    name={`question-${index}`}
                    disabled
                    className="mr-2"
                  />
                  {option}
                </label>
              ))}
            </div>
          </div>
        );
      
      case 'checkbox':
        return (
          <div key={index}>
            <label className="block font-medium mb-2">
              {questionNumber}. {question.question} {question.required && '*'}
            </label>
            <div className="space-y-2">
              {question.options?.map((option, optIndex) => (
                <label key={optIndex} className="flex items-center">
                  <input
                    type="checkbox"
                    disabled
                    className="mr-2"
                  />
                  {option}
                </label>
              ))}
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  if (isPending) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">Failed to load survey data. Please try again.</Alert>;
  }

  if (!surveyData) {
    return <Alert severity="warning">No survey data found. Please contact your administrator.</Alert>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Survey Management</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage your customer satisfaction survey including questions, branding, and form settings.
      </Typography>

      {/* Live Preview */}
      <Box sx={{ mb: 4, position: 'relative' }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 2, color: 'primary.main', fontWeight: 'bold' }}>Live Preview - This is how your survey appears to visitors
        </Typography>
        
        <Paper sx={{ p: 3, bgcolor: '#f0fdf4', maxHeight: '600px', overflow: 'auto' }}>
          <div className="w-full max-w-2xl mx-auto px-4 py-8">
            {/* Logo + Company Name */}
            <div className="flex flex-col items-center mb-6">
              <img 
                src={resolveImageUrl(surveyData.logo)} 
                alt="Kenya Seed Logo" 
                className="h-16 mb-2"
                onError={(e) => {
                  e.currentTarget.src = '/api/images/survey/placeholder.svg';
                }}
              />
              <div className="text-center">
                <h1 className="text-xl font-bold text-[#15803d]">{surveyData.companyName}</h1>
                <p className="text-sm text-gray-600">{surveyData.companySubtitle}</p>
              </div>
            </div>

            {/* Survey Title */}
            <h2 className="text-2xl font-bold mb-6 text-center text-green-800">
              {surveyData.title}
            </h2>

            <form
              action={surveyData.formAction}
              method="POST"
              className="space-y-6"
            >
              <input type="hidden" name="_next" value={surveyData.nextUrl} />
              <input type="hidden" name="_captcha" value="false" />

              {/* Questions Preview */}
              {surveyData.questions
                .filter(question => question.isActive)
                .sort((a, b) => a.order - b.order)
                .map((question, index) => renderQuestionPreview(question, index))}

              {/* Buttons */}
              <div className="flex justify-end gap-4 mt-4">
                <button
                  type="button"
                  className="px-4 py-2 border rounded bg-gray-100 hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </Paper>
      </Box>

      {/* Popup Preview */}
      {surveyData?.popup?.enabled && (
        <Box sx={{ mb: 4, position: 'relative' }}>
          <Typography variant="h5" gutterBottom sx={{ mb: 2, color: 'primary.main', fontWeight: 'bold' }}>Popup Preview - This is how your survey popup appears to visitors
          </Typography>
          
          <Paper sx={{ p: 3, bgcolor: '#f0f9ff', maxHeight: '400px', overflow: 'auto' }}>
            <div className="w-full max-w-md mx-auto">
              <div className="bg-white rounded-lg shadow-lg border">
                <div className="flex flex-col items-center gap-2 bg-[#007A33] text-white rounded-t-lg p-4">
                  <img 
                    src={resolveImageUrl(surveyData.logo)} 
                    alt="Kenya Seed Logo" 
                    className="h-12"
                    onError={(e) => {
                      e.currentTarget.src = '/api/images/survey/placeholder.svg';
                    }}
                  />
                  <h3 className="text-lg text-center font-semibold">
                    {surveyData.popup.title}
                  </h3>
                </div>
                <div className="flex flex-col gap-3 bg-white text-[#007A33] p-6">
                  <p className="text-sm text-center">
                    {surveyData.popup.message}
                  </p>
                  <div className="flex justify-between mt-2 gap-2">
                    <button className="w-[48%] bg-[#FFD700] text-black hover:bg-yellow-400 px-4 py-2 rounded font-medium">
                      {surveyData.popup.buttonText}
                    </button>
                    <button className="w-[48%] border border-[#007A33] text-[#007A33] hover:bg-[#007A33]/10 px-4 py-2 rounded font-medium">
                      {surveyData.popup.dismissText}
                    </button>
                  </div>
                </div>
              </div>
              <div className="mt-4 text-center text-sm text-gray-600">
                <p>Popup will appear after {surveyData.popup.delay}ms delay</p>
                <p>Only shows on homepage</p>
              </div>
            </div>
          </Paper>
        </Box>
      )}

      {/* Management Controls */}
      <Card>
        <CardHeader>
          <Typography variant="h6" component="div">Survey Settings</Typography>
        </CardHeader>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Edit your survey content including questions, branding, and form settings.
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<EditIcon />} 
              onClick={openEditSurvey}
              disabled={isSaving}
            >
              Edit Survey
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog 
        open={isSurveyDialogOpen} 
        onClose={() => setIsSurveyDialogOpen(false)} 
        maxWidth="lg" 
        fullWidth
      >
        <DialogTitle>Edit Survey</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {/* Basic Settings */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Basic Settings</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Survey Title"
                value={editingSurvey?.title || ''}
                onChange={(e) => setEditingSurvey({ 
                  ...editingSurvey!, 
                  title: e.target.value
                })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Company Name"
                value={editingSurvey?.companyName || ''}
                onChange={(e) => setEditingSurvey({ 
                  ...editingSurvey!, 
                  companyName: e.target.value
                })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Company Subtitle"
                value={editingSurvey?.companySubtitle || ''}
                onChange={(e) => setEditingSurvey({ 
                  ...editingSurvey!, 
                  companySubtitle: e.target.value
                })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Form Action URL"
                value={editingSurvey?.formAction || ''}
                onChange={(e) => setEditingSurvey({ 
                  ...editingSurvey!, 
                  formAction: e.target.value
                })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Next URL (after submission)"
                value={editingSurvey?.nextUrl || ''}
                onChange={(e) => setEditingSurvey({ 
                  ...editingSurvey!, 
                  nextUrl: e.target.value
                })}
                required
              />
            </Grid>

            {/* Logo Upload */}
            <Grid item xs={12}>
              <Box display="flex" alignItems="center" gap={2}>
                <TextField
                  fullWidth
                  label="Logo URL"
                  value={editingSurvey?.logo || ''}
                  onChange={(e) => setEditingSurvey({ 
                    ...editingSurvey!, 
                    logo: e.target.value
                  })}
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileUpload(file);
                    }
                  }}
                  style={{ display: 'none' }}
                  id="upload-logo"
                />
                <label htmlFor="upload-logo">
                  <IconButton component="span" size="small">
                    <UploadIcon />
                  </IconButton>
                </label>
              </Box>
              {editingSurvey?.logo && (
                <Box sx={{ mt: 1 }}>
                  <img
                    src={resolveImageUrl(editingSurvey.logo)}
                    alt="Logo Preview"
                    style={{ width: '100px', height: '100px', objectFit: 'contain' }}
                    onError={(e) => {
                      e.currentTarget.src = '/api/images/survey/placeholder.svg';
                    }}
                  />
                </Box>
              )}
            </Grid>

            {/* Popup Configuration */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>Popup Configuration
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={editingSurvey?.popup?.enabled || false}
                    onChange={(e) => setEditingSurvey({ 
                      ...editingSurvey!, 
                      popup: { 
                        ...editingSurvey?.popup || {
                          enabled: false,
                          delay: 2000,
                          title: "We'd love your feedback!",
                          message: "Help us improve by taking a short survey.",
                          buttonText: "Take Survey",
                          dismissText: "Maybe Later"
                        },
                        enabled: e.target.checked
                      }
                    })}
                  />
                }
                label="Enable Survey Popup"
              />
            </Grid>
            {editingSurvey?.popup?.enabled && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Popup Title"
                    value={editingSurvey?.popup?.title || ''}
                    onChange={(e) => setEditingSurvey({ 
                      ...editingSurvey!, 
                      popup: { 
                        ...editingSurvey?.popup || {},
                        title: e.target.value
                      }
                    })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Delay (milliseconds)"
                    type="number"
                    value={editingSurvey?.popup?.delay || 2000}
                    onChange={(e) => setEditingSurvey({ 
                      ...editingSurvey!, 
                      popup: { 
                        ...editingSurvey?.popup || {},
                        delay: parseInt(e.target.value) || 2000
                      }
                    })}
                    helperText="Time before popup appears (in milliseconds)"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Popup Message"
                    multiline
                    rows={2}
                    value={editingSurvey?.popup?.message || ''}
                    onChange={(e) => setEditingSurvey({ 
                      ...editingSurvey!, 
                      popup: { 
                        ...editingSurvey?.popup || {},
                        message: e.target.value
                      }
                    })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Button Text"
                    value={editingSurvey?.popup?.buttonText || ''}
                    onChange={(e) => setEditingSurvey({ 
                      ...editingSurvey!, 
                      popup: { 
                        ...editingSurvey?.popup || {},
                        buttonText: e.target.value
                      }
                    })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Dismiss Text"
                    value={editingSurvey?.popup?.dismissText || ''}
                    onChange={(e) => setEditingSurvey({ 
                      ...editingSurvey!, 
                      popup: { 
                        ...editingSurvey?.popup || {},
                        dismissText: e.target.value
                      }
                    })}
                  />
                </Grid>
              </>
            )}

            {/* Questions Section */}
            <Grid item xs={12}>
              <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
                <Typography variant="h6">Survey Questions</Typography>
                <Button startIcon={<AddIcon />} onClick={addQuestion} size="small">
                  Add Question
                </Button>
              </Box>
            </Grid>
            {editingSurvey?.questions.map((question, index) => (
              <Grid item xs={12} key={index}>
                <Box sx={{ p: 2, border: '1px solid #e5e7eb', borderRadius: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="subtitle2">Question {index + 1}</Typography>
                    <IconButton size="small" onClick={() => removeQuestion(index)}>
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Question Text"
                        value={question.question}
                        onChange={(e) => updateQuestion(index, 'question', e.target.value)}
                        size="small"
                        required
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Question Type</InputLabel>
                        <Select
                          value={question.type}
                          onChange={(e) => updateQuestion(index, 'type', e.target.value)}
                          label="Question Type"
                        >
                          <MenuItem value="text">Text Input</MenuItem>
                          <MenuItem value="textarea">Text Area</MenuItem>
                          <MenuItem value="select">Dropdown</MenuItem>
                          <MenuItem value="radio">Radio Buttons</MenuItem>
                          <MenuItem value="checkbox">Checkboxes</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Placeholder"
                        value={question.placeholder || ''}
                        onChange={(e) => updateQuestion(index, 'placeholder', e.target.value)}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2">Required:</Typography>
                        <Switch
                          checked={question.required}
                          onChange={(e) => updateQuestion(index, 'required', e.target.checked)}
                          size="small"
                        />
                      </Box>
                    </Grid>
                    
                    {/* Options for select, radio, checkbox */}
                    {(question.type === 'select' || question.type === 'radio' || question.type === 'checkbox') && (
                      <Grid item xs={12}>
                        <Typography variant="body2" sx={{ mb: 1 }}>Options:</Typography>
                        {(question.options || []).map((option, optIndex) => (
                          <Box key={optIndex} display="flex" alignItems="center" gap={1} sx={{ mb: 1 }}>
                            <TextField
                              fullWidth
                              size="small"
                              value={option}
                              onChange={(e) => updateOption(index, optIndex, e.target.value)}
                              placeholder={`Option ${optIndex + 1}`}
                            />
                            <IconButton 
                              size="small" 
                              onClick={() => removeOption(index, optIndex)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        ))}
                        <Button 
                          size="small" 
                          startIcon={<AddIcon />} 
                          onClick={() => addOption(index)}
                        >
                          Add Option
                        </Button>
                      </Grid>
                    )}
                    
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Order"
                        type="number"
                        value={question.order}
                        onChange={(e) => updateQuestion(index, 'order', parseInt(e.target.value) || 0)}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2">Active:</Typography>
                        <Chip
                          label={question.isActive ? 'Active' : 'Inactive'}
                          color={question.isActive ? 'success' : 'default'}
                          size="small"
                          onClick={() => updateQuestion(index, 'isActive', !question.isActive)}
                          style={{ cursor: 'pointer' }}
                        />
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsSurveyDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            disabled={isSaving || !editingSurvey?.title || !editingSurvey?.companyName}
            startIcon={<SaveIcon />}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={!!message} 
        autoHideDuration={5000} 
        onClose={() => setMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setMessage(null)} severity={message?.type} sx={{ width: '100%' }}>
          {message?.text}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SurveyEditor;
