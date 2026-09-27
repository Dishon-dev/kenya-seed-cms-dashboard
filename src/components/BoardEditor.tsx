// BoardEditor.tsx — Board members management for CMS dashboard (v5-ready)
// Images rendered consistently (object-cover) + client-side image size validation
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
  CircularProgress,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
  Person as PersonIcon,
  DragIndicator as DragIcon,
  CloudUpload as UploadIcon,
  PhotoLibrary as MediaIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Star as StarIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5001';

interface BoardMember {
  id?: string;
  name: string;
  position: string;
  image: string;
  bio: string;
  isChairperson: boolean;
  order: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const MIN_IMAGE_WIDTH = 200;  // minimum acceptable width in px
const MIN_IMAGE_HEIGHT = 200; // minimum acceptable height in px
const CMS_IMAGE_SIZE = 80;    // consistent size for CMS dashboard images

const BoardEditor: React.FC = () => {
  const [boardMembers, setBoardMembers] = useState<BoardMember[]>([]);
  const [editingMember, setEditingMember] = useState<BoardMember | null>(null);
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mountedRef = useRef(true);
  const messageTimeoutRef = useRef<number | null>(null);
  const queryClient = useQueryClient();
  const cacheBust = () => `t=${Date.now()}`;

  const normalizeImageUrlForSave = useCallback((url: string) => {
    if (!url) return url;
    try {
      if (url.startsWith('http')) {
        const parsed = new URL(url);
        if (parsed.searchParams.has('t')) {
          parsed.searchParams.delete('t');
          return parsed.toString();
        }
      }
    } catch {
      // Ignore parse errors and keep the original URL.
    }
    return url;
  }, []);

  // Local storage functions for board members
  const saveBoardMembersToStorage = useCallback((members: BoardMember[]) => {
    try {
      localStorage.setItem('boardMembers', JSON.stringify(members));
      console.log('Board members saved to localStorage');
    } catch (error) {
      console.error('Failed to save board members to localStorage:', error);
    }
  }, []);

  const loadBoardMembersFromStorage = useCallback((): BoardMember[] | null => {
    try {
      const stored = localStorage.getItem('boardMembers');
      if (stored) {
        const members = JSON.parse(stored);
        console.log('Board members loaded from localStorage');
        return members;
      }
    } catch (error) {
      console.error('Failed to load board members from localStorage:', error);
    }
    return null;
  }, []);


  // Image caching functions
  const cacheImage = useCallback((imageUrl: string, imageData: string) => {
    try {
      const imageCache = JSON.parse(localStorage.getItem('boardMemberImages') || '{}');
      imageCache[imageUrl] = imageData;
      localStorage.setItem('boardMemberImages', JSON.stringify(imageCache));
      console.log('Image cached for:', imageUrl);
    } catch (error) {
      console.error('Failed to cache image:', error);
    }
  }, []);

  const getCachedImage = useCallback((imageUrl: string): string | null => {
    try {
      const imageCache = JSON.parse(localStorage.getItem('boardMemberImages') || '{}');
      return imageCache[imageUrl] || null;
    } catch (error) {
      console.error('Failed to get cached image:', error);
      return null;
    }
  }, []);


  // Preload and cache images for board members
  const preloadImages = useCallback((members: BoardMember[]) => {
    members.forEach(member => {
      if (member.image && !getCachedImage(member.image)) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (ctx) {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            const imageData = canvas.toDataURL('image/jpeg', 0.8);
            cacheImage(member.image, imageData);
          }
        };
        img.onerror = () => {
          console.warn('Failed to preload image:', member.image);
        };
        img.src = member.image;
      }
    });
  }, [cacheImage, getCachedImage]);

  // Fetch board members — v5: use isPending for initial load
  const { data: membersData, isPending, error } = useQuery({
    queryKey: ['boardMembers'],
    queryFn: async () => {
      try {
        // First try to load from localStorage for faster initial load
        const cachedMembers = loadBoardMembersFromStorage();
        if (cachedMembers && cachedMembers.length > 0) {
          console.log('Using cached board members for initial load');
          // Still fetch from API in background to ensure data is fresh
          setTimeout(async () => {
            try {
              const response = await axios.get(`${API_BASE}/api/board-members`, {
                headers: { 
                  Authorization: `Bearer ${localStorage.getItem('token')}`,
                  'Content-Type': 'application/json'
                }
              });
              if (response.data.members) {
                saveBoardMembersToStorage(response.data.members);
                queryClient.setQueryData(['boardMembers'], response.data);
              }
            } catch (error) {
              console.log('Background API fetch failed, using cached data');
            }
          }, 100);
          return { members: cachedMembers };
        }

        // If no cached data, fetch from API
        const response = await axios.get(`${API_BASE}/api/board-members`, {
          headers: { 
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        // Save to localStorage for future use
        if (response.data.members) {
          saveBoardMembersToStorage(response.data.members);
        }
        
        return response.data;
      } catch (error) {
        console.error('Fetch board members error:', error);
        // Return cached data if API fails
        const cachedMembers = loadBoardMembersFromStorage();
        if (cachedMembers) {
          console.log('Using cached board members due to API error');
          return { members: cachedMembers };
        }
        throw error;
      }
    },
    retry: (failureCount, error: any) => {
      // Don't retry on 401/403 errors
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 30000,
    refetchOnWindowFocus: false
  });

  // Update board members mutation
  const updateMembersMutation = useMutation<any, any, { members: BoardMember[] }>({
    mutationFn: async ({ members }) => {
      const response = await axios.put(`${API_BASE}/api/board-members/reorder`, 
        { members },
        { 
          headers: { 
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          } 
        }
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Save updated members to localStorage
      saveBoardMembersToStorage(variables.members);
      queryClient.invalidateQueries({ queryKey: ['boardMembers'] });
      showMessage('success', 'Board members reordered successfully!');
    },
    onError: (err: any) => {
      console.error('Reorder members error:', err);
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.message || 
                          err.message || 
                          'Failed to reorder board members';
      showMessage('error', errorMessage);
    }
  });

  // Create/Update board member mutation
  const saveMemberMutation = useMutation<any, any, { member: BoardMember; isUpdate: boolean }>({
    mutationFn: async ({ member, isUpdate }) => {
      const url = isUpdate 
        ? `${API_BASE}/api/board-members/${member.id}`
        : `${API_BASE}/api/board-members`;
      
      const method = isUpdate ? 'put' : 'post';
      const payloadMember = { ...member, image: normalizeImageUrlForSave(member.image) };
      
      const response = await axios[method](url, payloadMember, {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Update localStorage with the new/updated member
      const currentMembers = loadBoardMembersFromStorage() || [];
      if (variables.isUpdate) {
        // Update existing member
        const updatedMembers = currentMembers.map(member => 
          member.id === variables.member.id ? variables.member : member
        );
        saveBoardMembersToStorage(updatedMembers);
      } else {
        // Add new member
        const newMember = { ...variables.member, id: data.id || variables.member.id };
        saveBoardMembersToStorage([...currentMembers, newMember]);
      }
      
      queryClient.invalidateQueries({ queryKey: ['boardMembers'] });
      showMessage('success', 'Board member saved successfully!');
      setEditingMember(null);
      setIsMemberDialogOpen(false);
    },
    onError: (err: any) => {
      console.error('Save member error:', err);
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.message || 
                          err.message || 
                          'Failed to save board member';
      showMessage('error', errorMessage);
    }
  });

  // Delete board member mutation
  const deleteMemberMutation = useMutation<any, any, string>({
    mutationFn: async (id) => {
      const response = await axios.delete(`${API_BASE}/api/board-members/${id}`, {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    },
    onSuccess: (data, deletedId) => {
      // Remove member from localStorage
      const currentMembers = loadBoardMembersFromStorage() || [];
      const updatedMembers = currentMembers.filter(member => member.id !== deletedId);
      saveBoardMembersToStorage(updatedMembers);
      
      queryClient.invalidateQueries({ queryKey: ['boardMembers'] });
      showMessage('success', 'Board member deleted successfully!');
      setDeleteConfirm({ open: false, id: null });
    },
    onError: (err: any) => {
      console.error('Delete member error:', err);
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.message || 
                          err.message || 
                          'Failed to delete board member';
      showMessage('error', errorMessage);
    }
  });

  useEffect(() => {
    if (membersData) {
      // Handle both array and object with members property
      const members = Array.isArray(membersData) ? membersData : membersData.members || [];
      setBoardMembers(members);
      // Preload and cache images for offline use
      if (members.length > 0) {
        preloadImages(members);
      }
    }
  }, [membersData, preloadImages]);

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

  const handleAddMember = () => {
    setEditingMember({
      name: '',
      position: '',
      image: '',
      bio: '',
      isChairperson: false,
      order: boardMembers.length,
      isActive: true
    });
    setIsMemberDialogOpen(true);
  };

  const handleEditMember = (member: BoardMember) => {
    setEditingMember({ ...member });
    setIsMemberDialogOpen(true);
  };

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      showMessage('error', 'Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showMessage('error', 'Image size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      if (!editingMember?.id) {
        showMessage('error', 'Please save the board member before uploading an image.');
        return;
      }

      const formData = new FormData();
      formData.append('image', file);

      const response = await axios.post(
        `${API_BASE}/api/board-members/${editingMember.id}/image`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress(progress);
            }
          }
        }
      );

      if (response.data.success && response.data.imageUrl) {
        // Cache the image data for offline use
        const reader = new FileReader();
        reader.onload = () => {
          if (reader.result) {
            cacheImage(response.data.imageUrl, reader.result as string);
          }
        };
        reader.readAsDataURL(file);

        const imageUrl = `${response.data.imageUrl}?${cacheBust()}`;
        setEditingMember({ ...editingMember, image: imageUrl });
        setBoardMembers((prev) =>
          prev.map((member) =>
            member.id === editingMember.id ? { ...member, image: imageUrl } : member
          )
        );
        // Persist to localStorage so it survives refresh.
        const cachedMembers = loadBoardMembersFromStorage() || [];
        const updatedMembers = cachedMembers.map((member) =>
          member.id === editingMember.id ? { ...member, image: imageUrl } : member
        );
        saveBoardMembersToStorage(updatedMembers);
        queryClient.setQueryData(['boardMembers'], (prevData: any) => {
          if (!prevData?.members) return prevData;
          return {
            ...prevData,
            members: prevData.members.map((member: any) =>
              member.id === editingMember.id ? { ...member, image: imageUrl } : member
            )
          };
        });

        setShowImageUpload(false);
        showMessage('success', 'Image uploaded successfully!');
      } else {
        throw new Error(response.data.error || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      showMessage('error', error.response?.data?.error || 'Failed to upload image');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Handle file input change
  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  // Trigger file input
  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  // Validate remote image dimensions by loading it in browser
  const validateImageUrl = (url: string, minW = MIN_IMAGE_WIDTH, minH = MIN_IMAGE_HEIGHT): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!url) return resolve(false);
      
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      const timeout = setTimeout(() => {
        resolve(false); // Timeout after 5 seconds
      }, 5000);
      
      img.onload = () => {
        clearTimeout(timeout);
        const ok = (img.naturalWidth >= minW && img.naturalHeight >= minH);
        resolve(ok);
      };
      
      img.onerror = () => {
        clearTimeout(timeout);
        // For local paths, we'll be more lenient and just check if it's a valid path
        if (url.startsWith('/images/') || url.startsWith('http')) {
          resolve(true); // Assume it's valid if it's a proper path
        } else {
          resolve(false);
        }
      };
      
      img.src = url;
    });
  };

  const handleSaveMember = async () => {
    if (!editingMember) return;
    
    // Basic validation
    if (!editingMember.name.trim()) {
      showMessage('error', 'Name is required');
      return;
    }
    if (!editingMember.position.trim()) {
      showMessage('error', 'Position is required');
      return;
    }
    if (!editingMember.image.trim()) {
      showMessage('error', 'Image is required');
      return;
    }
    if (!editingMember.bio.trim()) {
      showMessage('error', 'Bio is required');
      return;
    }

    // Validate image URL format
    const imageUrl = editingMember.image.trim();
    if (!imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
      showMessage('error', 'Please enter a valid image URL or path');
      return;
    }

    // Validate image size before saving (prevent extremely small avatars)
    try {
      const ok = await validateImageUrl(imageUrl);
      if (!ok) {
        showMessage('error', `Image seems too small. Minimum recommended size is ${MIN_IMAGE_WIDTH}×${MIN_IMAGE_HEIGHT}px.`);
        return;
      }
    } catch (err) {
      console.warn('Image validation failed:', err);
      // Continue with save but show warning
      showMessage('error', 'Could not validate image dimensions. Please ensure image is accessible and larger than recommended minimum.');
      return;
    }

    try {
      await saveMemberMutation.mutateAsync({
        member: editingMember,
        isUpdate: !!editingMember.id
      });
    } catch (error) {
      console.error('Save member error:', error);
      // Error handling is done in the mutation
    }
  };

  const handleDeleteMember = (id: string) => {
    setDeleteConfirm({ open: true, id });
  };

  const confirmDeleteMember = async () => {
    if (!deleteConfirm.id) return;
    await deleteMemberMutation.mutateAsync(deleteConfirm.id);
  };

  const handleMemberReorder = async (fromIndex: number, toIndex: number) => {
    const updatedMembers = [...boardMembers];
    const [movedMember] = updatedMembers.splice(fromIndex, 1);
    updatedMembers.splice(toIndex, 0, movedMember);
    
    // Update order numbers
    const reorderedMembers = updatedMembers.map((member, index) => ({
      ...member,
      order: index
    }));
    
    setBoardMembers(reorderedMembers);
    
    await updateMembersMutation.mutateAsync({ members: reorderedMembers });
  };

  const resolveImageUrl = (image: string) => {
    if (!image) return '/images/board-members/placeholder.jpg';
    
    // Check if we have a cached version of this image
    const cachedImage = getCachedImage(image);
    if (cachedImage) {
      return cachedImage;
    }
    
    // Convert API path to public folder path
    if (image.startsWith('/api/images/board-members/')) {
      const filename = image.replace('/api/images/board-members/', '');
      return `/images/board-members/${filename}`;
    }
    
    // Fallback to original URL
    if (image.startsWith('http')) return image;
    if (image.startsWith('/')) return `${API_BASE}${image}`;
    return `${API_BASE}/${image}`;
  };

  const isSaving = saveMemberMutation.isPending || deleteMemberMutation.isPending || updateMembersMutation.isPending;

  // v5: use isPending for initial loading spinner
  if (isPending) {
    return (
      <Box sx={{ p: 3 }}>
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="400px">
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Loading Board Members
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Please wait while we fetch the board members data...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Failed to load board members
          </Typography>
          <Typography variant="body2">
            {(error as any)?.response?.status === 401 || (error as any)?.response?.status === 403
              ? 'Please log in to access board members management.'
              : (error as any)?.response?.data?.error || (error as any)?.message || 'An unexpected error occurred. Please try again.'
            }
          </Typography>
        </Alert>
        <Button 
          variant="contained" 
          onClick={() => window.location.reload()}
          startIcon={<RefreshIcon />}
        >
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Board Members Management
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage your board members and their information. Changes will appear on your website immediately.
      </Typography>

      {/* Live Preview Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Live Preview
        </Typography>
        <Paper sx={{ 
          overflow: 'hidden', 
          borderRadius: 'var(--radius)', 
          border: '1px solid hsl(var(--border))',
          backgroundColor: 'hsl(var(--card))',
          color: 'hsl(var(--card-foreground))',
          boxShadow: 'var(--shadow-soft)'
        }}>
          <Box sx={{ p: 3 }}>
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-primary mb-6">
                Meet Our Board Members
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Our board comprises experienced leaders who provide strategic guidance
                and governance oversight to ensure Kenya Seed Company's continued success and impact in the agricultural sector.
              </p>
            </div>

            {/* Chairperson Section */}
            {Array.isArray(boardMembers) && boardMembers.find(member => member.isChairperson) && (
              <div className="flex justify-center mb-12">
                <Card className="shadow-agricultural border-0 hover:shadow-lg transition-all duration-300 max-w-lg">
                  <CardContent className="p-6">
                    <div className="text-center mb-4">
                      <img
                        src={resolveImageUrl(boardMembers.find(member => member.isChairperson)?.image || '')}
                        alt={boardMembers.find(member => member.isChairperson)?.name || ''}
                        style={{ 
                          width: 100, 
                          height: 100, 
                          objectFit: 'cover',
                          borderRadius: '50%',
                          border: '3px solid #15803d',
                          backgroundColor: '#f7f8fa'
                        }}
                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                          const target = e.currentTarget as HTMLImageElement;
                          target.src = "/images/board-members/placeholder.jpg";
                        }}
                        loading="lazy"
                      />
                      <h3 className="text-xl font-bold text-primary mb-2 mt-4">
                        {boardMembers.find(member => member.isChairperson)?.name || ''}
                      </h3>
                      <p className="text-secondary font-semibold text-base mb-3">
                        {boardMembers.find(member => member.isChairperson)?.position || ''}
                      </p>
                      <Chip 
                        label="Board Chairperson" 
                        color="primary" 
                        size="small"
                        sx={{ 
                          backgroundColor: '#15803d', 
                          color: 'white',
                          fontSize: '0.7rem',
                          height: 24
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Other Board Members */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {boardMembers
                .filter(member => !member.isChairperson)
                .map((member, index) => (
                <Card
                  key={member.id}
                  className="shadow-agricultural border-0 hover:shadow-lg transition-all duration-300"
                >
                  <CardContent className="p-4">
                    <div className="text-center mb-4">
                      <img
                        src={resolveImageUrl(member.image)}
                        alt={member.name}
                        style={{ 
                          width: 80, 
                          height: 80, 
                          objectFit: 'cover',
                          borderRadius: '50%',
                          border: '2px solid #15803d',
                          backgroundColor: '#f7f8fa'
                        }}
                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                          const target = e.currentTarget as HTMLImageElement;
                          target.src = "/images/board-members/placeholder.jpg";
                        }}
                        loading="lazy"
                      />
                      <h3 className="text-lg font-bold text-primary mb-1 mt-3">
                        {member.name}
                      </h3>
                      <p className="text-sm text-secondary font-medium">
                        {member.position}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </Box>
        </Paper>
      </Box>

      {/* Board Members Management */}
      <Box sx={{ mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6">Board Members</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddMember}
            disabled={isSaving}
          >
            Add Board Member
          </Button>
        </Box>

        {!Array.isArray(boardMembers) || boardMembers.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <PersonIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Board Members Found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Get started by adding your first board member.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddMember}
              disabled={isSaving}
            >
              Add First Board Member
            </Button>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {Array.isArray(boardMembers) && boardMembers.map((member, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={member.id}>
              <Card className="shadow-agricultural border-0 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-4">
                  <div className="text-center mb-4">
                    <div className="relative inline-block">
                      <img
                        src={resolveImageUrl(member.image)}
                        alt={member.name}
                        style={{ 
                          width: CMS_IMAGE_SIZE, 
                          height: CMS_IMAGE_SIZE, 
                          objectFit: 'cover',
                          borderRadius: '50%',
                          border: '2px solid #15803d',
                          backgroundColor: '#f7f8fa'
                        }}
                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                          const target = e.currentTarget as HTMLImageElement;
                          target.src = "/images/board-members/placeholder.jpg";
                        }}
                        loading="lazy"
                      />
                      {member.isChairperson && (
                        <div className="absolute -top-1 -right-1">
                          <Chip
                            icon={<StarIcon />}
                            label="Chair"
                            color="primary"
                            size="small"
                            sx={{ 
                              backgroundColor: '#15803d', 
                              color: 'white',
                              fontSize: '0.65rem',
                              height: 20
                            }}
                          />
                        </div>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-primary mb-1 truncate" title={member.name}>
                      {member.name}
                    </h3>
                    <p className="text-sm text-secondary font-medium mb-2 truncate" title={member.position}>
                      {member.position}
                    </p>
                    <Chip
                      label={member.isActive ? 'Active' : 'Inactive'}
                      color={member.isActive ? 'success' : 'default'}
                      size="small"
                      sx={{ 
                        backgroundColor: member.isActive ? '#22c55e' : '#6b7280', 
                        color: 'white',
                        fontSize: '0.7rem',
                        height: 20
                      }}
                    />
                  </div>

                  <CardActions className="justify-center pt-2">
                    <IconButton
                      size="small"
                      onClick={() => handleEditMember(member)}
                      disabled={isSaving}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => member.id && handleDeleteMember(member.id)}
                      color="error"
                      disabled={isSaving || !member.id}
                    >
                      <DeleteIcon />
                    </IconButton>
                    {index > 0 && (
                      <IconButton
                        size="small"
                        onClick={() => handleMemberReorder(index, index - 1)}
                        title="Move Up"
                        disabled={isSaving}
                      >
                        <DragIcon />
                      </IconButton>
                    )}
                    {index < boardMembers.length - 1 && (
                      <IconButton
                        size="small"
                        onClick={() => handleMemberReorder(index, index + 1)}
                        title="Move Down"
                        disabled={isSaving}
                      >
                        <DragIcon />
                      </IconButton>
                    )}
                  </CardActions>
                </CardContent>
              </Card>
            </Grid>
          ))}
          </Grid>
        )}
      </Box>

      {/* Board Member Edit Dialog */}
      <Dialog open={isMemberDialogOpen} onClose={() => setIsMemberDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingMember?.id ? 'Edit Board Member' : 'Add New Board Member'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                value={editingMember?.name || ''}
                onChange={(e) => setEditingMember({ ...editingMember!, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Position"
                value={editingMember?.position || ''}
                onChange={(e) => setEditingMember({ ...editingMember!, position: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Image URL"
                value={editingMember?.image || ''}
                onChange={(e) => setEditingMember({ ...editingMember!, image: e.target.value })}
                required
                helperText="Enter the full URL or path to the image"
                InputProps={{
                  endAdornment: (
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Button
                        size="small"
                        startIcon={<UploadIcon />}
                        onClick={triggerFileUpload}
                        disabled={isUploading}
                        variant="outlined"
                      >
                        Upload
                      </Button>
                      <Button
                        size="small"
                        startIcon={<MediaIcon />}
                        onClick={() => setShowImageUpload(true)}
                        disabled={isUploading}
                        variant="outlined"
                      >
                        Media
                      </Button>
                    </Box>
                  )
                }}
              />
              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInputChange}
                accept="image/*"
                style={{ display: 'none' }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Bio"
                value={editingMember?.bio || ''}
                onChange={(e) => setEditingMember({ ...editingMember!, bio: e.target.value })}
                multiline
                rows={4}
                required
                helperText="Enter the board member's biography"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={editingMember?.isChairperson || false}
                    onChange={(e) => setEditingMember({ ...editingMember!, isChairperson: e.target.checked })}
                  />
                }
                label="Chairperson"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={editingMember?.isActive || false}
                    onChange={(e) => setEditingMember({ ...editingMember!, isActive: e.target.checked })}
                  />
                }
                label="Active"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Order"
                type="number"
                value={editingMember?.order || 0}
                onChange={(e) => setEditingMember({ ...editingMember!, order: parseInt(e.target.value) || 0 })}
                helperText="Order in which the member appears (0 = first)"
              />
            </Grid>
            <Grid item xs={12}>
              {/* Upload Progress */}
              {isUploading && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Uploading image... {uploadProgress}%
                  </Typography>
                  <Box sx={{ width: '100%', bgcolor: '#f0f0f0', borderRadius: 1, overflow: 'hidden' }}>
                    <Box 
                      sx={{ 
                        width: `${uploadProgress}%`, 
                        height: 8, 
                        bgcolor: '#15803d', 
                        transition: 'width 0.3s ease' 
                      }} 
                    />
                  </Box>
                </Box>
              )}

              {/* Image preview */}
              {editingMember?.image && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, border: '1px solid #e5e7eb', borderRadius: 1, backgroundColor: '#f7f8fa' }}>
                  <img 
                    src={resolveImageUrl(editingMember.image)} 
                    alt="preview" 
                    style={{ 
                      width: 60, 
                      height: 60, 
                      objectFit: 'cover', 
                      borderRadius: '50%',
                      border: '2px solid #15803d'
                    }} 
                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                      (e.currentTarget as HTMLImageElement).src = "/images/board-members/placeholder.jpg";
                    }}
                  />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Preview (60×60px)
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ wordBreak: 'break-all' }}>
                      {resolveImageUrl(editingMember.image)}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => setEditingMember({ ...editingMember!, image: '' })}
                    sx={{ color: 'error.main' }}
                  >
                    <CloseIcon />
                  </IconButton>
                </Box>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsMemberDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveMember}
            variant="contained"
            disabled={isSaving || !editingMember?.name || !editingMember?.position || !editingMember?.image || !editingMember?.bio}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm.open} onClose={() => setDeleteConfirm({ open: false, id: null })}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this board member? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm({ open: false, id: null })}>
            Cancel
          </Button>
          <Button
            onClick={confirmDeleteMember}
            color="error"
            variant="contained"
            disabled={isSaving}
          >
            {isSaving ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Media Library Dialog */}
      <Dialog open={showImageUpload} onClose={() => setShowImageUpload(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Select Image</Typography>
            <Button
              startIcon={<UploadIcon />}
              onClick={triggerFileUpload}
              variant="contained"
              size="small"
            >
              Upload New
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <ImageIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Media Library
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Select an image from your media library or upload a new one.
            </Typography>
            
            {/* Sample images for demonstration */}
            <Grid container spacing={2}>
              {[
                { url: '/images/board of directors/placeholder.jpg', name: 'Default Avatar' },
                { url: 'https://via.placeholder.com/300x300/1e7e34/ffffff?text=Board+Member', name: 'Sample 1' },
                { url: 'https://via.placeholder.com/300x300/22c55e/ffffff?text=Director', name: 'Sample 2' },
                { url: 'https://via.placeholder.com/300x300/3b82f6/ffffff?text=Manager', name: 'Sample 3' }
              ].map((img, index) => (
                <Grid item xs={6} sm={3} key={index}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer', 
                      '&:hover': { boxShadow: 3 },
                      border: editingMember?.image === img.url ? '2px solid #15803d' : '1px solid #e5e7eb'
                    }}
                    onClick={() => {
                      setEditingMember({ ...editingMember!, image: img.url });
                      setShowImageUpload(false);
                    }}
                  >
                    <CardContent sx={{ p: 1 }}>
                      <img 
                        src={img.url} 
                        alt={img.name}
                        style={{ 
                          width: '100%', 
                          height: 80, 
                          objectFit: 'cover',
                          borderRadius: 4
                        }}
                      />
                      <Typography variant="caption" display="block" sx={{ mt: 1, textAlign: 'center' }}>
                        {img.name}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowImageUpload(false)}>
            Cancel
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
        <Alert onClose={() => setMessage(null)} severity={message?.type} sx={{ width: '100%' }}>
          {message?.text}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BoardEditor;
