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
  Card,
  CardContent,
  CardHeader,
  CardActions,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  Snackbar,
  Alert,
  CircularProgress,
  LinearProgress,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip,
  Fab
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  Description as DocumentIcon,
  AudioFile as AudioIcon,
  CloudUpload as UploadIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  VolumeUp as VolumeIcon,
  PictureAsPdf as PdfIcon,
  MusicNote as MusicIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5001';

interface ServiceCharterData {
  id: string;
  hero: {
    title: string;
    subtitle: string;
  };
  pdfs: {
    english: {
      title: string;
      filename: string;
      url: string;
      size: string;
      lastUpdated: string;
    };
    kiswahili: {
      title: string;
      filename: string;
      url: string;
      size: string;
      lastUpdated: string;
    };
  };
  audio: {
    english: {
      title: string;
      filename: string;
      url: string;
      duration: string;
      lastUpdated: string;
    };
    kiswahili: {
      title: string;
      filename: string;
      url: string;
      duration: string;
      lastUpdated: string;
    };
  };
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

const ServiceCharterEditor: React.FC = () => {
  const [serviceCharterData, setServiceCharterData] = useState<ServiceCharterData | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [editingHero, setEditingHero] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [showEnglishPDF, setShowEnglishPDF] = useState(false);
  const [showKiswahiliPDF, setShowKiswahiliPDF] = useState(false);
  const [showEnglishAudio, setShowEnglishAudio] = useState(false);
  const [showKiswahiliAudio, setShowKiswahiliAudio] = useState(false);
  const [uploadingEnglishPDF, setUploadingEnglishPDF] = useState(false);
  const [uploadingKiswahiliPDF, setUploadingKiswahiliPDF] = useState(false);
  const [uploadingEnglishAudio, setUploadingEnglishAudio] = useState(false);
  const [uploadingKiswahiliAudio, setUploadingKiswahiliAudio] = useState(false);

  const queryClient = useQueryClient();

  // Local storage functions
  const saveServiceCharterToStorage = useCallback((data: ServiceCharterData) => {
    try {
      localStorage.setItem('serviceCharterData', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving to local storage:', error);
    }
  }, []);

  const loadServiceCharterFromStorage = useCallback((): ServiceCharterData | null => {
    try {
      const stored = localStorage.getItem('serviceCharterData');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error loading from local storage:', error);
      return null;
    }
  }, []);

  // Fetch service charter data
  const { data: fetchedData, isLoading, error } = useQuery({
    queryKey: ['serviceCharter'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/api/service-charter`);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update mutation
  const updateServiceCharterMutation = useMutation({
    mutationFn: async (data: ServiceCharterData) => {
      const response = await axios.post(`${API_BASE}/api/service-charter`, data);
      return response.data;
    },
    onSuccess: (data) => {
      setServiceCharterData(data);
      saveServiceCharterToStorage(data);
      queryClient.invalidateQueries({ queryKey: ['serviceCharter'] });
      showMessage({ type: 'success', text: 'Service charter updated successfully!' });
    },
    onError: (error: any) => {
      showMessage({ type: 'error', text: `Error updating service charter: ${error.response?.data?.message || error.message}` });
    },
  });

  // Upload PDF mutation
  const uploadPdfMutation = useMutation({
    mutationFn: async ({ file, language }: { file: File; language: string }) => {
      const formData = new FormData();
      formData.append('pdf', file);
      
      const response = await axios.post(`${API_BASE}/api/service-charter/upload/pdf/${language}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        },
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      showMessage({ type: 'success', text: `${variables.language} PDF uploaded successfully!` });
      queryClient.invalidateQueries({ queryKey: ['serviceCharter'] });
    },
    onError: (error: any) => {
      showMessage({ type: 'error', text: `Error uploading PDF: ${error.response?.data?.message || error.message}` });
    },
  });

  // Upload audio mutation
  const uploadAudioMutation = useMutation({
    mutationFn: async ({ file, language }: { file: File; language: string }) => {
      const formData = new FormData();
      formData.append('audio', file);
      
      const response = await axios.post(`${API_BASE}/api/service-charter/upload/audio/${language}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        },
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      showMessage({ type: 'success', text: `${variables.language} audio uploaded successfully!` });
      queryClient.invalidateQueries({ queryKey: ['serviceCharter'] });
    },
    onError: (error: any) => {
      showMessage({ type: 'error', text: `Error uploading audio: ${error.response?.data?.message || error.message}` });
    },
  });

  // File upload handlers
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'pdf' | 'audio', language: 'english' | 'kiswahili') => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (type === 'pdf' && file.type !== 'application/pdf') {
      showMessage({ type: 'error', text: 'Please select a valid PDF file' });
      return;
    }
    
    if (type === 'audio' && !file.type.startsWith('audio/')) {
      showMessage({ type: 'error', text: 'Please select a valid audio file' });
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      showMessage({ type: 'error', text: 'File size must be less than 10MB' });
      return;
    }

    // Upload the file
    if (type === 'pdf') {
      uploadPdfMutation.mutate({ file, language });
    } else {
      uploadAudioMutation.mutate({ file, language });
    }
  };

  const handleFileDelete = async (type: 'pdf' | 'audio', language: 'english' | 'kiswahili') => {
    if (!window.confirm(`Are you sure you want to delete the ${language} ${type.toUpperCase()}?`)) {
      return;
    }

    if (!serviceCharterData) return;

    try {
      // For now, we'll update the service charter to remove the file reference
      // In a real implementation, you might want a dedicated delete endpoint
      const updatedData = { ...serviceCharterData };
      if (type === 'pdf' && updatedData.pdfs) {
        updatedData.pdfs[language] = {
          title: `${language.charAt(0).toUpperCase() + language.slice(1)} Service Charter`,
          filename: `${language}.pdf`,
          url: `/pdfs/${language}.pdf`,
          size: '0 KB',
          lastUpdated: new Date().toISOString()
        };
      } else if (type === 'audio' && updatedData.audio) {
        updatedData.audio[language] = {
          title: `${language.charAt(0).toUpperCase() + language.slice(1)} Audio`,
          filename: `charter-${language}.mp3`,
          url: `/documents/service-charter/charter-${language}.mp3`,
          duration: '0:00',
          lastUpdated: new Date().toISOString()
        };
      }

      await updateServiceCharterMutation.mutateAsync(updatedData);
      showMessage({ type: 'success', text: `${language} ${type.toUpperCase()} deleted successfully!` });
    } catch (error: any) {
      console.error(`Error deleting ${type}:`, error);
      showMessage({ type: 'error', text: `Failed to delete ${type}` });
    }
  };

  // Update service charter data when fetched data changes
  useEffect(() => {
    if (fetchedData) {
      setServiceCharterData(fetchedData);
      saveServiceCharterToStorage(fetchedData);
    } else {
      // Try to load from local storage as fallback
      const storedData = loadServiceCharterFromStorage();
      if (storedData) {
        setServiceCharterData(storedData);
      }
    }
  }, [fetchedData, saveServiceCharterToStorage, loadServiceCharterFromStorage]);

  const showMessage = (msg: { type: 'success' | 'error'; text: string }) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 5000);
  };

  const handleSave = () => {
    if (serviceCharterData) {
      updateServiceCharterMutation.mutate(serviceCharterData);
    }
  };

  const handleHeroChange = (field: keyof ServiceCharterData['hero'], value: string) => {
    if (serviceCharterData) {
      setServiceCharterData({
        ...serviceCharterData,
        hero: {
          ...serviceCharterData.hero,
          [field]: value
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
          Error loading service charter data: {error.message}
        </Alert>
      </Box>
    );
  }

  if (!serviceCharterData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          No service charter data available. Please check your connection.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <DocumentIcon sx={{ mr: 2, color: '#1976d2' }} />
        <Typography variant="h4" component="h1">
          Service Charter Editor
        </Typography>
      </Box>

      {/* Live Preview */}
      {serviceCharterData && (
        <Box sx={{ mb: 4, position: 'relative' }}>
          <Typography variant="h5" gutterBottom sx={{ mb: 2, color: 'primary.main', fontWeight: 'bold' }}>Live Preview - This is how your service charter appears to visitors
          </Typography>
          
          <Paper sx={{ p: 3, bgcolor: '#f0fdf4', maxHeight: '800px', overflow: 'auto' }}>
            <div className="w-full max-w-6xl mx-auto">
              {/* Hero Section */}
              <section className="py-32 bg-gradient-to-r from-green-600 to-green-800 text-white">
                <div className="container mx-auto px-4 text-center">
                  <h1 className="text-5xl lg:text-6xl font-bold mb-6 text-white">
                    {serviceCharterData?.hero?.title || 'Service Charter'}
                  </h1>
                  <p className="text-lg lg:text-xl max-w-3xl mx-auto leading-relaxed mt-4 text-white/90">
                    {serviceCharterData?.hero?.subtitle || 'Our commitment to excellent customer service'}
                  </p>
                </div>
              </section>

              {/* Main Content */}
              <main className="flex-grow container mx-auto px-6 py-20 space-y-16">
                {/* PDF Section */}
                <section>
                  <h2 className="text-3xl font-bold text-green-700 mb-10 text-center">
                    Citizen Service Delivery Charter
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {/* English PDF */}
                    <div>
                      <h3 className="text-xl font-semibold text-center mb-4">English</h3>
                      <div className="flex justify-center gap-4 mb-4">
                        <button
                          onClick={() => setShowEnglishPDF(!showEnglishPDF)}
                          className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2"
                        >
                          {showEnglishPDF ? "Hide PDF" : "View PDF"}
                        </button>
                        <a
                          href={`${API_BASE}${serviceCharterData?.pdfs?.english?.url || '/api/service-charter/pdf/english'}`}
                          download
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          Download PDF
                        </a>
                      </div>

                      <div
                        className={`overflow-hidden transition-all duration-500 ${
                          showEnglishPDF ? "max-h-[800px]" : "max-h-0"
                        }`}
                      >
                        <div className="w-full h-[800px] border rounded-lg shadow-lg bg-gray-50">
                          <iframe
                            src={`${API_BASE}${serviceCharterData?.pdfs?.english?.url || '/api/service-charter/pdf/english'}`}
                            title="English Service Charter PDF"
                            className="w-full h-full border-0 rounded-lg"
                            allow="fullscreen"
                            onError={(e) => {
                              console.log('PDF iframe failed, trying object fallback');
                              // Hide iframe and show object fallback
                              e.currentTarget.style.display = 'none';
                              const objectElement = e.currentTarget.nextElementSibling as HTMLElement;
                              if (objectElement) objectElement.style.display = 'block';
                            }}
                          ></iframe>
                          <object
                            data={`${API_BASE}${serviceCharterData?.pdfs?.english?.url || '/api/service-charter/pdf/english'}`}
                            type="application/pdf"
                            className="w-full h-full border-0 rounded-lg hidden"
                            onError={(e) => {
                              console.log('PDF object failed, showing download link');
                              // Hide object and show download fallback
                              e.currentTarget.style.display = 'none';
                              const fallbackElement = e.currentTarget.nextElementSibling as HTMLElement;
                              if (fallbackElement) fallbackElement.style.display = 'block';
                            }}
                          >
                            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                              <div className="mb-4">
                                <svg className="w-16 h-16 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <h3 className="text-lg font-semibold text-gray-700 mb-2">PDF Viewer Not Available</h3>
                              <p className="text-gray-600 mb-4">Your browser doesn't support PDF viewing. You can download the PDF to view it.</p>
                              <div className="flex flex-col sm:flex-row gap-3">
                                <a
                                  href={`${API_BASE}${serviceCharterData?.pdfs?.english?.url || '/api/service-charter/pdf/english'}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                  Open in New Tab
                                </a>
                                <a
                                  href={`${API_BASE}${serviceCharterData?.pdfs?.english?.url || '/api/service-charter/pdf/english'}`}
                                  download={`${serviceCharterData?.pdfs?.english?.filename || 'english.pdf'}`}
                                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                >
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  Download English PDF
                                </a>
                              </div>
                            </div>
                          </object>
                        </div>
                      </div>
                    </div>

                    {/* Kiswahili PDF */}
                    <div>
                      <h3 className="text-xl font-semibold text-center mb-4">Kiswahili</h3>
                      <div className="flex justify-center gap-4 mb-4">
                        <button
                          onClick={() => setShowKiswahiliPDF(!showKiswahiliPDF)}
                          className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2"
                        >
                          {showKiswahiliPDF ? "Hide PDF" : "View PDF"}
                        </button>
                        <a
                          href={`${API_BASE}${serviceCharterData?.pdfs?.kiswahili?.url || '/api/service-charter/pdf/kiswahili'}`}
                          download
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          Download PDF
                        </a>
                      </div>

                      <div
                        className={`overflow-hidden transition-all duration-500 ${
                          showKiswahiliPDF ? "max-h-[800px]" : "max-h-0"
                        }`}
                      >
                        <div className="w-full h-[800px] border rounded-lg shadow-lg bg-gray-50">
                          <iframe
                            src={`${API_BASE}${serviceCharterData?.pdfs?.kiswahili?.url || '/api/service-charter/pdf/kiswahili'}`}
                            title="Kiswahili Service Charter PDF"
                            className="w-full h-full border-0 rounded-lg"
                            allow="fullscreen"
                            onError={(e) => {
                              console.log('PDF iframe failed, trying object fallback');
                              // Hide iframe and show object fallback
                              e.currentTarget.style.display = 'none';
                              const objectElement = e.currentTarget.nextElementSibling as HTMLElement;
                              if (objectElement) objectElement.style.display = 'block';
                            }}
                          ></iframe>
                          <object
                            data={`${API_BASE}${serviceCharterData?.pdfs?.kiswahili?.url || '/api/service-charter/pdf/kiswahili'}`}
                            type="application/pdf"
                            className="w-full h-full border-0 rounded-lg hidden"
                            onError={(e) => {
                              console.log('PDF object failed, showing download link');
                              // Hide object and show download fallback
                              e.currentTarget.style.display = 'none';
                              const fallbackElement = e.currentTarget.nextElementSibling as HTMLElement;
                              if (fallbackElement) fallbackElement.style.display = 'block';
                            }}
                          >
                            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                              <div className="mb-4">
                                <svg className="w-16 h-16 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <h3 className="text-lg font-semibold text-gray-700 mb-2">PDF Viewer Not Available</h3>
                              <p className="text-gray-600 mb-4">Your browser doesn't support PDF viewing. You can download the PDF to view it.</p>
                              <div className="flex flex-col sm:flex-row gap-3">
                                <a
                                  href={`${API_BASE}${serviceCharterData?.pdfs?.kiswahili?.url || '/api/service-charter/pdf/kiswahili'}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                  Open in New Tab
                                </a>
                                <a
                                  href={`${API_BASE}${serviceCharterData?.pdfs?.kiswahili?.url || '/api/service-charter/pdf/kiswahili'}`}
                                  download={`${serviceCharterData?.pdfs?.kiswahili?.filename || 'kiswahili.pdf'}`}
                                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                >
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  Download Kiswahili PDF
                                </a>
                              </div>
                            </div>
                          </object>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Audio Section */}
                <section>
                  <h2 className="text-3xl font-bold text-green-700 mb-8 text-center">
                    Listen to Our Service Charter
                  </h2>
                  <div className="flex flex-col md:flex-row justify-center items-center gap-6">
                    <div className="w-full md:w-1/2">
                      <h3 className="font-semibold mb-2 text-center">English</h3>
                      <audio controls className="w-full">
                        <source src={`${API_BASE}${serviceCharterData?.audio?.english?.url || '/api/service-charter/audio/english'}`} type="audio/mpeg" />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                    <div className="w-full md:w-1/2">
                      <h3 className="font-semibold mb-2 text-center">Kiswahili</h3>
                      <audio controls className="w-full">
                        <source src={`${API_BASE}${serviceCharterData?.audio?.kiswahili?.url || '/api/service-charter/audio/kiswahili'}`} type="audio/mpeg" />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  </div>
                </section>
              </main>
            </div>
          </Paper>
        </Box>
      )}

      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Configuration" />
          <Tab label="PDFs" />
          <Tab label="Audio" />
          <Tab label="Preview" />
        </Tabs>
      </Paper>

      {/* Configuration Tab */}
      {activeTab === 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Service Charter Configuration
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Configure the basic settings for the service charter section.
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
                value={serviceCharterData?.hero?.title || ''}
                onChange={(e) => handleHeroChange('title', e.target.value)}
                helperText="Main title displayed at the top of the service charter page"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Hero Subtitle"
                multiline
                rows={3}
                value={serviceCharterData?.hero?.subtitle || ''}
                onChange={(e) => handleHeroChange('subtitle', e.target.value)}
                helperText="Subtitle text displayed below the main title"
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Status Configuration */}
          <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 2, color: 'primary.main' }}>Status Settings
          </Typography>
          
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={serviceCharterData?.isActive || false}
                    onChange={(e) => {
                      if (serviceCharterData) {
                        setServiceCharterData({
                          ...serviceCharterData,
                          isActive: e.target.checked
                        });
                      }
                    }}
                  />
                }
                label="Service Charter Active"
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={updateServiceCharterMutation.isPending}
              startIcon={<SaveIcon />}
            >
              Save Configuration
            </Button>
            <Button
              variant="outlined"
              onClick={() => window.location.reload()}
              disabled={updateServiceCharterMutation.isPending}
            >
              Reset
            </Button>
          </Box>
        </Paper>
      )}

      {/* PDFs Tab */}
      {activeTab === 1 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            PDF Management
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Upload and manage PDF documents for the service charter in both English and Kiswahili.
          </Typography>

          <Grid container spacing={3}>
            {/* English PDF */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader
                  title="English PDF"
                  avatar={<PdfIcon color="error" />}
                  action={
                    <Chip 
                      label={serviceCharterData?.pdfs?.english?.size || '2.5 MB'} 
                      size="small" 
                      color="primary" 
                    />
                  }
                />
                <CardContent>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Filename: {serviceCharterData?.pdfs?.english?.filename || 'service-charter-english.pdf'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Last Updated: {serviceCharterData?.pdfs?.english?.lastUpdated || new Date().toISOString()}
                  </Typography>
                  
                  <Box sx={{ mt: 2 }}>
                    <input
                      accept=".pdf"
                      style={{ display: 'none' }}
                      id="english-pdf-upload"
                      type="file"
                      onChange={(e) => handleFileUpload(e, 'pdf', 'english')}
                    />
                    <label htmlFor="english-pdf-upload">
                      <Button
                        variant="outlined"
                        component="span"
                        startIcon={<UploadIcon />}
                        disabled={isUploading}
                        fullWidth
                      >
                        Upload English PDF
                      </Button>
                    </label>
                  </Box>

                  {isUploading && (
                    <Box sx={{ mt: 2 }}>
                      <LinearProgress variant="determinate" value={uploadProgress} />
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        Uploading... {uploadProgress}%
                      </Typography>
                    </Box>
                  )}
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    startIcon={<DownloadIcon />}
                    href={`${API_BASE}${serviceCharterData?.pdfs?.english?.url || '/api/service-charter/pdf/english'}`}
                    download
                  >
                    Download
                  </Button>
                  <Button
                    size="small"
                    startIcon={<DeleteIcon />}
                    color="error"
                    onClick={() => handleFileDelete('pdf', 'english')}
                    disabled={uploadPdfMutation.isPending}
                  >
                    Delete
                  </Button>
                </CardActions>
              </Card>
            </Grid>

            {/* Kiswahili PDF */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader
                  title="Kiswahili PDF"
                  avatar={<PdfIcon color="error" />}
                  action={
                    <Chip 
                      label={serviceCharterData?.pdfs?.kiswahili?.size || '2.8 MB'} 
                      size="small" 
                      color="primary" 
                    />
                  }
                />
                <CardContent>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Filename: {serviceCharterData?.pdfs?.kiswahili?.filename || 'service-charter-kiswahili.pdf'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Last Updated: {serviceCharterData?.pdfs?.kiswahili?.lastUpdated || new Date().toISOString()}
                  </Typography>
                  
                  <Box sx={{ mt: 2 }}>
                    <input
                      accept=".pdf"
                      style={{ display: 'none' }}
                      id="kiswahili-pdf-upload"
                      type="file"
                      onChange={(e) => handleFileUpload(e, 'pdf', 'kiswahili')}
                    />
                    <label htmlFor="kiswahili-pdf-upload">
                      <Button
                        variant="outlined"
                        component="span"
                        startIcon={<UploadIcon />}
                        disabled={isUploading}
                        fullWidth
                      >
                        Upload Kiswahili PDF
                      </Button>
                    </label>
                  </Box>

                  {isUploading && (
                    <Box sx={{ mt: 2 }}>
                      <LinearProgress variant="determinate" value={uploadProgress} />
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        Uploading... {uploadProgress}%
                      </Typography>
                    </Box>
                  )}
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    startIcon={<DownloadIcon />}
                    href={`${API_BASE}${serviceCharterData?.pdfs?.kiswahili?.url || '/api/service-charter/pdf/kiswahili'}`}
                    download
                  >
                    Download
                  </Button>
                  <Button
                    size="small"
                    startIcon={<DeleteIcon />}
                    color="error"
                    onClick={() => handleFileDelete('pdf', 'kiswahili')}
                    disabled={uploadPdfMutation.isPending}
                  >
                    Delete
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Audio Tab */}
      {activeTab === 2 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Audio Management
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Upload and manage audio files for the service charter in both English and Kiswahili.
          </Typography>

          <Grid container spacing={3}>
            {/* English Audio */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader
                  title="English Audio"
                  avatar={<MusicIcon color="primary" />}
                  action={
                    <Chip 
                      label={serviceCharterData?.audio?.english?.duration || '15:30'} 
                      size="small" 
                      color="primary" 
                    />
                  }
                />
                <CardContent>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Filename: {serviceCharterData?.audio?.english?.filename || 'charter-english.mp3'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Last Updated: {serviceCharterData?.audio?.english?.lastUpdated || new Date().toISOString()}
                  </Typography>
                  
                  <Box sx={{ mt: 2 }}>
                    <input
                      accept=".mp3,.wav,.m4a"
                      style={{ display: 'none' }}
                      id="english-audio-upload"
                      type="file"
                      onChange={(e) => handleFileUpload(e, 'audio', 'english')}
                    />
                    <label htmlFor="english-audio-upload">
                      <Button
                        variant="outlined"
                        component="span"
                        startIcon={<UploadIcon />}
                        disabled={isUploading}
                        fullWidth
                      >
                        Upload English Audio
                      </Button>
                    </label>
                  </Box>

                  {isUploading && (
                    <Box sx={{ mt: 2 }}>
                      <LinearProgress variant="determinate" value={uploadProgress} />
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        Uploading... {uploadProgress}%
                      </Typography>
                    </Box>
                  )}
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    startIcon={<PlayIcon />}
                    href={`${API_BASE}${serviceCharterData?.audio?.english?.url || '/api/service-charter/audio/english'}`}
                    target="_blank"
                  >
                    Play
                  </Button>
                  <Button
                    size="small"
                    startIcon={<DownloadIcon />}
                    href={`${API_BASE}${serviceCharterData?.audio?.english?.url || '/api/service-charter/audio/english'}`}
                    download
                  >
                    Download
                  </Button>
                  <Button
                    size="small"
                    startIcon={<DeleteIcon />}
                    color="error"
                    onClick={() => handleFileDelete('audio', 'english')}
                    disabled={uploadAudioMutation.isPending}
                  >
                    Delete
                  </Button>
                </CardActions>
              </Card>
            </Grid>

            {/* Kiswahili Audio */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader
                  title="Kiswahili Audio"
                  avatar={<MusicIcon color="primary" />}
                  action={
                    <Chip 
                      label={serviceCharterData?.audio?.kiswahili?.duration || '16:45'} 
                      size="small" 
                      color="primary" 
                    />
                  }
                />
                <CardContent>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Filename: {serviceCharterData?.audio?.kiswahili?.filename || 'charter-kiswahili.mp3'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Last Updated: {serviceCharterData?.audio?.kiswahili?.lastUpdated || new Date().toISOString()}
                  </Typography>
                  
                  <Box sx={{ mt: 2 }}>
                    <input
                      accept=".mp3,.wav,.m4a"
                      style={{ display: 'none' }}
                      id="kiswahili-audio-upload"
                      type="file"
                      onChange={(e) => handleFileUpload(e, 'audio', 'kiswahili')}
                    />
                    <label htmlFor="kiswahili-audio-upload">
                      <Button
                        variant="outlined"
                        component="span"
                        startIcon={<UploadIcon />}
                        disabled={isUploading}
                        fullWidth
                      >
                        Upload Kiswahili Audio
                      </Button>
                    </label>
                  </Box>

                  {isUploading && (
                    <Box sx={{ mt: 2 }}>
                      <LinearProgress variant="determinate" value={uploadProgress} />
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        Uploading... {uploadProgress}%
                      </Typography>
                    </Box>
                  )}
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    startIcon={<PlayIcon />}
                    href={`${API_BASE}${serviceCharterData?.audio?.kiswahili?.url || '/api/service-charter/audio/kiswahili'}`}
                    target="_blank"
                  >
                    Play
                  </Button>
                  <Button
                    size="small"
                    startIcon={<DownloadIcon />}
                    href={`${API_BASE}${serviceCharterData?.audio?.kiswahili?.url || '/api/service-charter/audio/kiswahili'}`}
                    download
                  >
                    Download
                  </Button>
                  <Button
                    size="small"
                    startIcon={<DeleteIcon />}
                    color="error"
                    onClick={() => handleFileDelete('audio', 'kiswahili')}
                    disabled={uploadAudioMutation.isPending}
                  >
                    Delete
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Preview Tab */}
      {activeTab === 3 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Service Charter Preview
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Preview the complete service charter page as it will appear to users.
          </Typography>

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={updateServiceCharterMutation.isPending}
              startIcon={<SaveIcon />}
            >
              Save Changes
            </Button>
          </Box>
        </Paper>
      )}

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

export default ServiceCharterEditor;
