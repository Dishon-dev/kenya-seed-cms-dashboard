import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  ExpandMore as ExpandMoreIcon,
  Image as ImageIcon,
  Link as LinkIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  DragIndicator as DragIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5001';

interface HeroSlide {
  id?: number | string;
  title: string;
  subtitle: string;
  imageUrl: string;
  imageId?: string;
  linkUrl?: string;
  buttonText?: string;
  showButton: boolean;
  order: number;
  isActive: boolean;
  objectPosition?: string;
}

interface HeroSection {
  id: number;
  name: string;
  title?: string;
  subtitle?: string;
  autoPlay: boolean;
  slideInterval: number;
  showNavigation: boolean;
  showScrollIndicator: boolean;
  isActive: boolean;
  slides: HeroSlide[];
}

const HeroEditor: React.FC = () => {
  const [heroSection, setHeroSection] = useState<HeroSection | null>(null);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [isSlideDialogOpen, setIsSlideDialogOpen] = useState(false);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{ open: boolean; slideId: number | string | null }>({ open: false, slideId: null });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [previewCurrentSlide, setPreviewCurrentSlide] = useState(0);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [pendingImagePreviewUrl, setPendingImagePreviewUrl] = useState<string | null>(null);
  const [originalEditingSlide, setOriginalEditingSlide] = useState<HeroSlide | null>(null);
  const mountedRef = useRef(true);
  const messageTimeoutRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();
  const HERO_API_ORIGIN = `${API_BASE}`;

  const normalizeImageUrl = useCallback((url?: string, imageId?: string): string => {
    if (url) {
      return url.startsWith('http') ? url : `${HERO_API_ORIGIN}${url.startsWith('/') ? '' : '/'}${url}`;
    }
    return imageId ? `${HERO_API_ORIGIN}/api/hero/images/${imageId}` : '';
  }, [HERO_API_ORIGIN]);

  // Fetch hero section data from the hero API
  const { data: heroData, isLoading, error } = useQuery({
    queryKey: ['hero'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/api/hero`);
      return response.data;
    },
    retry: 2,
    staleTime: 30000
  });

  // Update hero section mutation - now updates the hero config
  const updateHeroSectionMutation = useMutation<any, any, any>({
    mutationFn: async (data) => {
      const response = await axios.put(`${API_BASE}/api/hero/config`, data, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      return response.data;
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ['hero'] });
      const previous = queryClient.getQueryData<any>(['hero']);

      // optimistic update
      if (previous) {
        const optimistic = { ...previous, config: { ...previous.config, ...data } };
        queryClient.setQueryData(['hero'], optimistic);
        // Update local hero section state
        if (heroSection) {
          const updatedHero = { ...heroSection, ...data };
          setHeroSection(updatedHero);
          notifyPreview(updatedHero);
        }
      }

      return { previous };
    },
    onError: (err, variables, context: any) => {
      // rollback
      if (context?.previous) {
        queryClient.setQueryData(['hero'], context.previous);
      }
      showMessage('error', err.response?.data?.error || 'Failed to update hero section');
    },
    onSuccess: (updatedData) => {
      queryClient.setQueryData(['hero'], updatedData);
      queryClient.invalidateQueries({ queryKey: ['hero'] });
      showMessage('success', 'Hero section updated successfully!');
    }
  });

  // Update slides mutation - now updates the hero slides
  const updateSlidesMutation = useMutation<any, any, HeroSlide[]>({
    mutationFn: async (slides) => {
      const response = await axios.post(`${API_BASE}/api/hero/slides`, { slides }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      return response.data;
    },
    onMutate: async (slides) => {
      await queryClient.cancelQueries({ queryKey: ['hero'] });
      const previous = queryClient.getQueryData<any>(['hero']);

      if (previous && heroSection) {
        const optimistic = { ...heroSection, slides };
        setHeroSection(optimistic);
        notifyPreview(optimistic);
      }

      return { previous };
    },
    onError: (err, variables, context: any) => {
      if (context?.previous) {
        queryClient.setQueryData(['hero'], context.previous);
      }
      showMessage('error', err.response?.data?.error || 'Failed to update slides');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hero'] });
      showMessage('success', 'Slides updated successfully!');
    }
  });

  // Derive isSaving from React Query mutations (single source of truth)
  const isSaving = updateHeroSectionMutation.isPending || updateSlidesMutation.isPending;

  useEffect(() => {
    if (heroData) {
      console.log('Hero data loaded in CMS:', heroData);
      
      // Transform the hero API data into HeroSection format
      const heroSectionData: HeroSection = {
        id: 1, // Use a fixed ID since we're not using components
        name: 'Homepage Hero',
        title: heroData.config?.title || '',
        subtitle: heroData.config?.subtitle || '',
        autoPlay: heroData.config?.autoPlay || true,
        slideInterval: heroData.config?.slideInterval || 6000,
        showNavigation: heroData.config?.showNavigation || true,
        showScrollIndicator: heroData.config?.showScrollIndicator || true,
        isActive: heroData.config?.isActive || true,
        slides: (heroData.slides || []).map((slide: any, index: number) => ({
          id: slide.id || `slide-${index}`,
          title: slide.title || '',
          subtitle: slide.subtitle || '',
          imageUrl: normalizeImageUrl(slide.imageUrl, slide.imageId),
          imageId: slide.imageId || '',
          linkUrl: slide.linkUrl || '',
          buttonText: slide.buttonText || '',
          showButton: slide.showButton || false,
          order: slide.order || index,
          isActive: slide.isActive !== false,
          objectPosition: slide.objectPosition || 'center',
        }))
      };
      
      console.log('Transformed hero data:', heroSectionData);
      setHeroSection(heroSectionData);
    }
  }, [heroData]);

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

  // Auto-play preview slides
  useEffect(() => {
    if (!heroSection?.autoPlay || heroSection.slides.length <= 1) return;
    
    const timer = setInterval(() => {
      setPreviewCurrentSlide((prev) => (prev + 1) % heroSection.slides.length);
    }, heroSection.slideInterval || 6000);
    
    return () => clearInterval(timer);
  }, [heroSection?.autoPlay, heroSection?.slideInterval, heroSection?.slides.length]);

  useEffect(() => {
    if (!pendingImageFile) {
      setPendingImagePreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(pendingImageFile);
    setPendingImagePreviewUrl(objectUrl);
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [pendingImageFile]);

  const showMessage = useCallback((type: 'success' | 'error', text: string, ttl: number = 5000) => {
    if (!mountedRef.current) return;
    
    // Clear existing timeout
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
      messageTimeoutRef.current = null;
    }
    
    setMessage({ type, text });
    
    // Set new timeout
    messageTimeoutRef.current = window.setTimeout(() => {
      if (mountedRef.current) {
        setMessage(null);
        messageTimeoutRef.current = null;
      }
    }, ttl);
  }, []);

  // Notify preview window of changes
  const PREVIEW_ORIGIN = 'http://localhost:8081';
  const PREVIEW_WINDOW_NAME = 'cms-preview-window';
  const previewWindowRef = useRef<Window | null>(null);

  const notifyPreview = useCallback((heroData: HeroSection) => {
    try {
      console.log('Notifying preview window with data:', heroData);
      
      const targetOrigin = PREVIEW_ORIGIN;
      let win = previewWindowRef.current;
      
      // Only post to an already-open preview window to avoid redirecting the CMS tab.
      if (win && !win.closed) {
        // Validate payload before sending
        const message = {
          type: 'HERO_UPDATE',
          data: heroData,
          timestamp: Date.now(),
          source: 'cms-hero-editor'
        };
        
        console.log('Sending message to preview:', message);
        win.postMessage(message, targetOrigin);
      } else {
        console.warn('Could not open or access preview window');
        previewWindowRef.current = null;
      }
    } catch (err) {
      console.warn('Preview push failed:', err);
      previewWindowRef.current = null;
    }
  }, [PREVIEW_ORIGIN, PREVIEW_WINDOW_NAME]);

  const handleConfigSave = async () => {
    if (!heroSection) return;
    
    try {
      await updateHeroSectionMutation.mutateAsync({
        title: heroSection.title || '',
        subtitle: heroSection.subtitle || '',
        autoPlay: heroSection.autoPlay,
        slideInterval: heroSection.slideInterval,
        showNavigation: heroSection.showNavigation,
        showScrollIndicator: heroSection.showScrollIndicator,
        isActive: heroSection.isActive
      });
      setIsConfigDialogOpen(false);
    } catch (error) {
      console.error('Failed to save hero config:', error);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !editingSlide) return;

    console.log('[HeroEditor] Image selected for slide', {
      slideId: editingSlide.id,
      title: editingSlide.title,
      subtitle: editingSlide.subtitle,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size
    });

    setPendingImageFile(file);
    setEditingSlide({
      ...editingSlide,
      imageId: undefined,
      imageUrl: ''
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSlideSave = async () => {
    if (!editingSlide || !heroSection) {
      setMessage({ type: 'error', text: 'Nothing to save - please close this dialog and try editing the slide again.' });
      return;
    }

    let currentSlides = heroSection.slides;

    const applySlideToList = (slideToApply: HeroSlide) => (
      slideToApply.id
        ? currentSlides.map(slide => slide.id === slideToApply.id ? slideToApply : slide)
        : [...currentSlides, { ...slideToApply, id: `tmp-${Date.now()}` }]
    );

    try {
      let slideToSave: HeroSlide = { ...editingSlide };

      if (pendingImageFile) {
        setUploadingImage(true);

        console.log('[HeroEditor] Save clicked with pending image', {
          slideId: slideToSave.id,
          title: slideToSave.title,
          subtitle: slideToSave.subtitle,
          pendingFileName: pendingImageFile.name,
          pendingFileType: pendingImageFile.type,
          pendingFileSize: pendingImageFile.size
        });

        let slideId = slideToSave.id;
        if (!slideId) {
          const preSaveSlides = applySlideToList({ ...slideToSave, imageUrl: '' });
          await updateSlidesMutation.mutateAsync(preSaveSlides);
          await new Promise(resolve => setTimeout(resolve, 500));

          queryClient.invalidateQueries({ queryKey: ['hero'] });
          const refreshedData = await queryClient.fetchQuery<{ config: any; slides: HeroSlide[] }>({
            queryKey: ['hero'],
            queryFn: async () => {
              const response = await axios.get(`${API_BASE}/api/hero`);
              return response.data;
            }
          });

          const savedSlide = refreshedData.slides.find((s: HeroSlide) =>
            s.title === slideToSave.title && s.subtitle === slideToSave.subtitle
          );
          slideId = savedSlide?.id;
          currentSlides = refreshedData.slides;

          if (!slideId) {
            setMessage({ type: 'error', text: 'Failed to create slide. Please try again.' });
            return;
          }
        }

        const formData = new FormData();
        formData.append('image', pendingImageFile);
        formData.append('slideId', slideId.toString());

        const response = await axios.post(`${API_BASE}/api/hero/upload/image`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });

        console.log('[HeroEditor] Image upload response', response.data);

        if (!response.data?.success) {
          setMessage({ type: 'error', text: response.data?.error || 'Failed to upload image' });
          return;
        }

        slideToSave = {
          ...slideToSave,
          id: slideId,
          imageId: response.data.imageId?.toString(),
          imageUrl: normalizeImageUrl(response.data.imageUrl, response.data.imageId?.toString())
        };
      }

      console.log('[HeroEditor] Saving slide payload', slideToSave);

      await updateSlidesMutation.mutateAsync(applySlideToList(slideToSave));
      setEditingSlide(null);
      setIsSlideDialogOpen(false);
      setPendingImageFile(null);
      setPendingImagePreviewUrl(null);
      setOriginalEditingSlide(null);
    } catch (error) {
      console.error('Failed to save slide:', error);
      const serverMessage = axios.isAxiosError(error) ? error.response?.data?.error : undefined;
      setMessage({
        type: 'error',
        text: serverMessage || 'Failed to save the slide. Please check your connection and try again.'
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSlideCancel = () => {
    if (originalEditingSlide) {
      setEditingSlide(originalEditingSlide);
    } else {
      setEditingSlide(null);
    }
    setIsSlideDialogOpen(false);
    setPendingImageFile(null);
    setPendingImagePreviewUrl(null);
    setOriginalEditingSlide(null);
  };

  const handleSlideDelete = (slideId: number | string) => {
    setDeleteConfirmDialog({ open: true, slideId });
  };

  const confirmSlideDelete = async () => {
    if (!heroSection || !deleteConfirmDialog.slideId) return;

    const updatedSlides = heroSection.slides.filter(slide => slide.id !== deleteConfirmDialog.slideId);
    
    try {
      await updateSlidesMutation.mutateAsync(updatedSlides);
      setDeleteConfirmDialog({ open: false, slideId: null });
    } catch (error) {
      console.error('Failed to delete slide:', error);
    }
  };

  const handleSlideReorder = async (fromIndex: number, toIndex: number) => {
    if (!heroSection) return;

    const updatedSlides = [...heroSection.slides];
    const [movedSlide] = updatedSlides.splice(fromIndex, 1);
    updatedSlides.splice(toIndex, 0, movedSlide);
    
    // Update order numbers
    const reorderedSlides = updatedSlides.map((slide, index) => ({
      ...slide,
      order: index
    }));

    try {
      await updateSlidesMutation.mutateAsync(reorderedSlides);
    } catch (error) {
      console.error('Failed to reorder slides:', error);
    }
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
      <Alert severity="error">
        Failed to load hero section data. Please try again.
      </Alert>
    );
  }

  if (!heroSection) {
    return (
      <Alert severity="warning">
        No hero section found. Please contact your administrator.
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Hero Section Management
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage your homepage hero section slides and settings. Changes will appear on your website immediately.
      </Typography>

      {/* Hero Preview Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Live Preview
        </Typography>
        <Paper sx={{ overflow: 'hidden', borderRadius: 2, border: '1px solid #e5e7eb' }}>
          <Box
            sx={{
              height: 400,
              position: 'relative',
              overflow: 'hidden',
              backgroundColor: '#f7f8fa'
            }}
          >
            {heroSection.slides.length > 0 ? (
              <>
                {/* All Slides */}
                {heroSection.slides.map((slide, index) => {
                  // Use the imageUrl directly (already constructed with proper API endpoint)
                  const imageUrl = slide.imageUrl || '';
                  
                  console.log(`Slide ${index} (${slide.title}): ${imageUrl}`);
                  console.log(`Slide ${index} imageId: ${slide.imageId}`);
                  
                  return (
                    <Box
                      key={index}
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundImage: imageUrl ? `url(${imageUrl})` : 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)',
                        backgroundSize: imageUrl ? 'cover' : '20px 20px',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        opacity: index === previewCurrentSlide ? 1 : 0,
                        transition: 'opacity 1s ease-in-out'
                      }}
                    />
                  );
                })}
                <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' }} />
                
                {/* Content */}
                <Box sx={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ p: 3, maxWidth: '80%' }}>
                    <Typography 
                      variant="h4" 
                      sx={{ 
                        color: 'white', 
                        fontWeight: 'bold', 
                        mb: 2,
                        textShadow: '2px 2px 4px rgba(0,0,0,0.7)'
                      }}
                    >
                      {heroSection.slides[previewCurrentSlide]?.title || 'Slide Title'}
                    </Typography>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        color: 'rgba(255,255,255,0.9)', 
                        mb: 3,
                        textShadow: '1px 1px 2px rgba(0,0,0,0.7)'
                      }}
                    >
                      {heroSection.slides[previewCurrentSlide]?.subtitle || 'Slide subtitle goes here'}
                    </Typography>
                    {heroSection.slides[previewCurrentSlide]?.showButton && heroSection.slides[previewCurrentSlide]?.buttonText && (
                      <Button
                        variant="contained"
                        size="large"
                        sx={{
                          backgroundColor: '#15803d',
                          '&:hover': { backgroundColor: '#16692c' },
                          textTransform: 'none',
                          fontWeight: 'bold'
                        }}
                      >
                        {heroSection.slides[previewCurrentSlide].buttonText}
                      </Button>
                    )}
                  </Box>
                </Box>

                {/* Navigation Preview */}
                {heroSection.showNavigation && heroSection.slides.length > 1 && (
                  <Box sx={{ position: 'absolute', bottom: 16, right: 16, display: 'flex', gap: 1 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' }
                      }}
                    >
                      <Typography sx={{ color: 'white', fontSize: '1.2rem' }}>‹</Typography>
                    </Box>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' }
                      }}
                    >
                      <Typography sx={{ color: 'white', fontSize: '1.2rem' }}>›</Typography>
                    </Box>
                  </Box>
                )}

                {/* Scroll Indicator Preview */}
                {heroSection.showScrollIndicator && (
                  <Box sx={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 4px',
                        animation: 'bounce 2s infinite'
                      }}
                    >
                      <Typography sx={{ color: 'white', fontSize: '1.2rem' }}>↓</Typography>
                    </Box>
                    <Typography sx={{ color: 'white', fontSize: '0.75rem', textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}>
                      Scroll Down
                    </Typography>
                  </Box>
                )}

                {/* Slide Indicators */}
                {heroSection.slides.length > 1 && (
                  <Box sx={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 0.5 }}>
                    {heroSection.slides.map((_, index) => (
                      <Box
                        key={index}
                        onClick={() => setPreviewCurrentSlide(index)}
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: index === previewCurrentSlide ? 'white' : 'rgba(255,255,255,0.5)',
                          cursor: 'pointer',
                          transition: 'background-color 0.3s ease'
                        }}
                      />
                    ))}
                  </Box>
                )}
              </>
            ) : (
              <Box sx={{ 
                height: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                flexDirection: 'column',
                color: 'text.secondary'
              }}>
                <ImageIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                <Typography variant="h6" sx={{ opacity: 0.7 }}>
                  No slides available
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.5 }}>
                  Add your first slide to see the preview
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>
        
        {/* Preview Info */}
        <Box sx={{ mt: 2, p: 2, backgroundColor: '#f7f8fa', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <strong>Preview Info:</strong> Showing slide {previewCurrentSlide + 1} of {heroSection.slides.length}. Auto-play: {heroSection.autoPlay ? 'Enabled' : 'Disabled'} 
            {heroSection.autoPlay && ` (${heroSection.slideInterval}ms interval)`}
            {heroSection.showNavigation && ' • Navigation arrows enabled'}
            {heroSection.showScrollIndicator && ' • Scroll indicator enabled'}
          </Typography>
          
          {/* Test Communication Button */}
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              console.log('Testing communication with main website...');
              if (heroSection) {
                notifyPreview(heroSection);
                showMessage('success', 'Test message sent to preview window!', 3000);
              } else {
                showMessage('error', 'No hero data to send', 3000);
              }
            }}
            sx={{ mr: 1 }}
          >
            Test Live Preview
          </Button>
          
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              const previewWindow = window.open('http://localhost:8081', PREVIEW_WINDOW_NAME);
              if (previewWindow) {
                previewWindowRef.current = previewWindow;
                showMessage('success', 'Preview window opened! Make changes to see live updates.', 3000);
                
                // Send initial data to the preview window after a short delay
                setTimeout(() => {
                  if (heroSection) {
                    notifyPreview(heroSection);
                  }
                }, 1000);
              } else {
                showMessage('error', 'Preview window blocked. Please allow popups.', 5000);
              }
            }}
            sx={{ mr: 1 }}
          >
            Open Preview Window
          </Button>
          
          <Button
            variant="outlined"
            size="small"
            onClick={async () => {
              if (!heroSection) return;
              
              console.log('Testing hero API save...');
              try {
                // Make a small test change (toggle auto-play)
                const testData = {
                  autoPlay: !heroSection.autoPlay
                };
                
                console.log('Saving test change to hero API...');
                await updateHeroSectionMutation.mutateAsync(testData);
                
                showMessage('success', 'Test change saved to hero API! Check main website.', 3000);
              } catch (error) {
                console.error('Test save failed:', error);
                showMessage('error', 'Test save failed. Check console for details.', 5000);
              }
            }}
            disabled={!heroSection || updateHeroSectionMutation.isPending}
            sx={{ mr: 1 }}
          >
            Test Hero API Save
          </Button>
          
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              console.log('Testing image URLs...');
              heroSection.slides.forEach((slide, index) => {
                console.log(`Slide ${index}: ${slide.title}`);
                console.log(`ImageId: ${slide.imageId}`);
                console.log(`ImageUrl: ${slide.imageUrl}`);
                console.log(`Test URL: http://localhost:5001/api/images/${slide.imageId}`);
              });
              showMessage('success', 'Image URLs logged to console!', 3000);
            }}
          >
            Test Image URLs
          </Button>
        </Box>
      </Box>

      {/* CSS for bounce animation */}
      <style>
        {`
          @keyframes bounce {
            0%, 20%, 50%, 80%, 100% {
              transform: translateY(0);
            }
            40% {
              transform: translateY(-10px);
            }
            60% {
              transform: translateY(-5px);
            }
          }
        `}
      </style>

      {/* Configuration Section */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Hero Section Settings</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Section Title"
                value={heroSection.title || ''}
                onChange={(e) => setHeroSection({ ...heroSection, title: e.target.value })}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Section Subtitle"
                value={heroSection.subtitle || ''}
                onChange={(e) => setHeroSection({ ...heroSection, subtitle: e.target.value })}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={heroSection.autoPlay}
                    onChange={(e) => setHeroSection({ ...heroSection, autoPlay: e.target.checked })}
                  />
                }
                label="Auto Play Slides"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Slide Interval (ms)"
                type="number"
                value={heroSection.slideInterval}
                onChange={(e) => setHeroSection({ ...heroSection, slideInterval: parseInt(e.target.value) || 6000 })}
                margin="normal"
                disabled={!heroSection.autoPlay}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={heroSection.showNavigation}
                    onChange={(e) => setHeroSection({ ...heroSection, showNavigation: e.target.checked })}
                  />
                }
                label="Show Navigation Arrows"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={heroSection.showScrollIndicator}
                    onChange={(e) => setHeroSection({ ...heroSection, showScrollIndicator: e.target.checked })}
                  />
                }
                label="Show Scroll Indicator"
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleConfigSave}
                disabled={isSaving || updateHeroSectionMutation.isPending}
                sx={{ mt: 2 }}
              >
                {isSaving || updateHeroSectionMutation.isPending ? 'Saving...' : 'Save Settings'}
              </Button>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      <Divider sx={{ my: 3 }} />

      {/* Slides Section */}
      <Box sx={{ mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6">Hero Slides</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingSlide({
                title: '',
                subtitle: '',
                imageUrl: '',
                linkUrl: '',
                buttonText: '',
                showButton: false,
                order: heroSection.slides.length,
                isActive: true,
                objectPosition: 'center',
              });
              setOriginalEditingSlide(null);
              setPendingImageFile(null);
              setPendingImagePreviewUrl(null);
              setIsSlideDialogOpen(true);
            }}
            disabled={isSaving || updateSlidesMutation.isPending}
          >
            Add Slide
          </Button>
        </Box>

        <Grid container spacing={2}>
          {heroSection.slides.map((slide, index) => (
            <Grid item xs={12} md={6} lg={4} key={slide.id}>
              <Card>
                <Box
                  sx={{
                    height: 200,
                    backgroundImage: `url(${slide.imageUrl || ''})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    position: 'relative'
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Typography variant="h6" color="white" textAlign="center">
                      {slide.title}
                    </Typography>
                  </Box>
                  <Chip
                    label={slide.isActive ? 'Active' : 'Inactive'}
                    color={slide.isActive ? 'success' : 'default'}
                    size="small"
                    sx={{ position: 'absolute', top: 8, right: 8 }}
                  />
                </Box>
                <CardContent>
                  <Typography variant="h6" noWrap>
                    {slide.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {slide.subtitle}
                  </Typography>
                  {slide.linkUrl && (
                    <Box display="flex" alignItems="center" sx={{ mt: 1 }}>
                      <LinkIcon fontSize="small" color="action" />
                      <Typography variant="caption" sx={{ ml: 0.5 }}>
                        {slide.linkUrl}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
                <CardActions>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setEditingSlide(slide);
                      setOriginalEditingSlide(slide);
                      setPendingImageFile(null);
                      setPendingImagePreviewUrl(null);
                      setIsSlideDialogOpen(true);
                    }}
                    disabled={isSaving || updateSlidesMutation.isPending}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => slide.id != null && handleSlideDelete(slide.id)}
                    color="error"
                    disabled={isSaving || updateSlidesMutation.isPending || !slide.id}
                  >
                    <DeleteIcon />
                  </IconButton>
                  {index > 0 && (
                    <IconButton
                      size="small"
                      onClick={() => handleSlideReorder(index, index - 1)}
                      title="Move Up"
                      disabled={isSaving || updateSlidesMutation.isPending}
                    >
                      <DragIcon />
                    </IconButton>
                  )}
                  {index < heroSection.slides.length - 1 && (
                    <IconButton
                      size="small"
                      onClick={() => handleSlideReorder(index, index + 1)}
                      title="Move Down"
                      disabled={isSaving || updateSlidesMutation.isPending}
                    >
                      <DragIcon />
                    </IconButton>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Slide Edit Dialog */}
      <Dialog
        open={isSlideDialogOpen}
        onClose={() => setIsSlideDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingSlide?.id ? 'Edit Slide' : 'Add New Slide'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={editingSlide?.title || ''}
                onChange={(e) => setEditingSlide({ ...editingSlide!, title: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Subtitle"
                value={editingSlide?.subtitle || ''}
                onChange={(e) => setEditingSlide({ ...editingSlide!, subtitle: e.target.value })}
                multiline
                rows={2}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Image Position"
                value={editingSlide?.objectPosition || 'center'}
                onChange={(e) => setEditingSlide({ ...editingSlide!, objectPosition: e.target.value })}
                helperText='Controls which part of the image stays in frame on crop. Examples: "center", "center 15%" (shift focus down), "top", "center top". Defaults to "center".'
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Slide Image
                </Typography>
                {(pendingImagePreviewUrl || editingSlide?.imageUrl) && (
                  <Box sx={{ mb: 2, p: 2, bgcolor: '#f7f8fa', borderRadius: 1 }}>
                    <img 
                      src={pendingImagePreviewUrl || editingSlide?.imageUrl || ''} 
                      alt="Slide preview" 
                      style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      Current Image ID: {editingSlide?.imageId || 'None'}
                    </Typography>
                  </Box>
                )}
                <Box>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                  <Button
                    variant="outlined"
                    onClick={() => fileInputRef.current?.click()}
                    startIcon={uploadingImage ? <CircularProgress size={20} /> : <CloudUploadIcon />}
                    disabled={uploadingImage}
                    fullWidth
                    color="primary"
                  >
                    {uploadingImage ? 'Uploading...' : editingSlide?.imageId ? 'Replace Image' : 'Upload Image'}
                  </Button>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                    {pendingImageFile
                      ? 'Image selected. Click Save to upload and store in the database.'
                      : 'Select a new image file (JPG, PNG, etc.). Save will persist it.'}
                  </Typography>
                </Box>
              </Box>
              <TextField
                fullWidth
                label="Image ID (Auto-filled after upload)"
                value={editingSlide?.imageId || ''}
                onChange={(e) => {
                  const imageId = e.target.value;
                  setEditingSlide({ 
                    ...editingSlide!, 
                    imageId: imageId,
                    imageUrl: normalizeImageUrl(undefined, imageId)
                  });
                }}
                helperText="Image ID will be set automatically after uploading. You can also manually enter an existing image ID."
                disabled={!!editingSlide?.imageId}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Link URL (Optional)"
                value={editingSlide?.linkUrl || ''}
                onChange={(e) => setEditingSlide({ ...editingSlide!, linkUrl: e.target.value })}
                helperText="Where should this slide link to?"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Button Text (Optional)"
                value={editingSlide?.buttonText || ''}
                onChange={(e) => setEditingSlide({ ...editingSlide!, buttonText: e.target.value })}
                disabled={!editingSlide?.linkUrl}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={editingSlide?.showButton || false}
                    onChange={(e) => setEditingSlide({ ...editingSlide!, showButton: e.target.checked })}
                    disabled={!editingSlide?.linkUrl}
                  />
                }
                label="Show Button"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={editingSlide?.isActive || false}
                    onChange={(e) => setEditingSlide({ ...editingSlide!, isActive: e.target.checked })}
                  />
                }
                label="Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSlideCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleSlideSave}
            variant="contained"
            disabled={isSaving || updateSlidesMutation.isPending || uploadingImage || !editingSlide?.title || !editingSlide?.subtitle || (!editingSlide?.imageUrl && !pendingImagePreviewUrl && !pendingImageFile)}
          >
            {isSaving || updateSlidesMutation.isPending || uploadingImage ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmDialog.open}
        onClose={() => setDeleteConfirmDialog({ open: false, slideId: null })}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this slide? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmDialog({ open: false, slideId: null })}>
            Cancel
          </Button>
          <Button
            onClick={confirmSlideDelete}
            color="error"
            variant="contained"
            disabled={isSaving || updateSlidesMutation.isPending}
          >
            {isSaving || updateSlidesMutation.isPending ? 'Deleting...' : 'Delete'}
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
          severity={message?.type}
          sx={{ width: '100%' }}
        >
          {message?.text}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default HeroEditor;
