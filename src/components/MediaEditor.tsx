import React, { useState, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  IconButton,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  LinearProgress,
  Alert,
  Switch,
  FormControlLabel,
  Slider,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText as MuiListItemText,
  ListItemSecondaryAction,
  CircularProgress,
  Backdrop,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Image as ImageIcon,
  VideoLibrary as VideoIcon,
  AudioFile as AudioIcon,
  Description as DocumentIcon,
  Archive as ArchiveIcon,
  Search as SearchIcon,
  ViewModule as GridViewIcon,
  ViewList as ListViewIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Download as DownloadIcon,
  Close as CloseIcon,
  ZoomIn as ZoomIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  MediaFile,
  MediaCategory,
  MediaFilter,
  MediaUploadProgress,
  MediaCollection,
  getMediaType,
  getMediaCategory,
  formatFileSize,
  ALL_SUPPORTED_TYPES,
} from '../types/media';

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
      id={`media-tabpanel-${index}`}
      aria-labelledby={`media-tab-${index}`}
      {...other}
    >
      {value === index && <Box component="div" sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const MediaEditor: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [filter, setFilter] = useState<MediaFilter>({});
  const [uploadProgress, setUploadProgress] = useState<MediaUploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<MediaCollection | null>(null);
  const [collectionDialogOpen, setCollectionDialogOpen] = useState(false);
  const [uploadConfig, setUploadConfig] = useState({
    maxFileSize: 50 * 1024 * 1024, // 50MB
    maxFiles: 10,
    generateThumbnails: true,
    compressImages: true,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Update filter when tab changes
  React.useEffect(() => {
    const categoryMap: Record<number, MediaCategory | undefined> = {
      0: undefined, // All Media
      1: 'image',
      2: 'video',
      3: 'audio',
      4: 'document',
      5: undefined, // Collections
    };
    
    if (tabValue !== 5) {
      setFilter(prev => ({
        ...prev,
        category: categoryMap[tabValue]
      }));
    }
  }, [tabValue]);

  // Fetch media files
  const { data: mediaFiles, isLoading, error } = useQuery({
    queryKey: ['media-files', filter],
    queryFn: async () => {
      const response = await axios.get('/api/media/files', { params: filter });
      return response.data;
    },
  });

  // Fetch media collections
  const { data: collections } = useQuery({
    queryKey: ['media-collections'],
    queryFn: async () => {
      const response = await axios.get('/api/media/collections');
      return response.data;
    },
  });

  // Fetch collection files when a collection is selected
  const { data: collectionFiles, isLoading: isLoadingCollectionFiles } = useQuery({
    queryKey: ['collection-files', selectedCollection?.category],
    queryFn: async () => {
      if (!selectedCollection?.category) return null;
      const response = await axios.get(`/api/media/collections/${selectedCollection.category}/files`);
      return response.data.files;
    },
    enabled: !!selectedCollection?.category,
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append(`files`, file);
      });
      
      const response = await axios.post('/api/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          setUploadProgress(prev => 
            prev.map((item, index) => 
              index < files.length ? { ...item, progress } : item
            )
          );
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-files'] });
      setUploadProgress([]);
      setIsUploading(false);
    },
    onError: (error) => {
      console.error('Upload error:', error);
      setIsUploading(false);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (fileIds: string[]) => {
      await axios.delete('/api/media/files', { data: { fileIds } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-files'] });
      setSelectedFiles([]);
    },
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleFileUpload = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => 
      ALL_SUPPORTED_TYPES.includes(file.type) && 
      file.size <= uploadConfig.maxFileSize
    );

    if (validFiles.length === 0) {
      alert('No valid files selected');
      return;
    }

    setIsUploading(true);
    setUploadProgress(
      validFiles.map(file => ({
        fileId: Math.random().toString(36),
        filename: file.name,
        progress: 0,
        status: 'uploading' as const,
      }))
    );

    uploadMutation.mutate(validFiles);
  }, [uploadConfig, uploadMutation]);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    handleFileUpload(event.dataTransfer.files);
  }, [handleFileUpload]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  const getFileIcon = (mimeType: string) => {
    const type = getMediaType(mimeType);
    switch (type) {
      case 'image': return <ImageIcon />;
      case 'video': return <VideoIcon />;
      case 'audio': return <AudioIcon />;
      case 'document': return <DocumentIcon />;
      case 'archive': return <ArchiveIcon />;
      default: return <DocumentIcon />;
    }
  };

  const getCategoryColor = (category: MediaCategory) => {
    const colors = {
      image: 'primary',
      video: 'secondary',
      audio: 'success',
      document: 'warning',
      archive: 'info',
      other: 'default',
    };
    return colors[category] as any;
  };

  const renderMediaCard = (file: MediaFile) => (
    <Card 
      key={file.id} 
      sx={{ 
        position: 'relative',
        cursor: 'pointer',
        '&:hover': { boxShadow: 4 },
        border: selectedFiles.includes(file.id) ? 2 : 0,
        borderColor: 'primary.main',
      }}
      onClick={() => {
        if (selectedFiles.includes(file.id)) {
          setSelectedFiles(prev => prev.filter(id => id !== file.id));
        } else {
          setSelectedFiles(prev => [...prev, file.id]);
        }
      }}
    >
      {getMediaType(file.mimeType) === 'image' ? (
        <CardMedia
          component="img"
          height="200"
          image={file.thumbnailUrl || file.url}
          alt={file.filename}
          sx={{
            objectFit: 'cover',
            backgroundColor: 'grey.100',
          }}
        />
      ) : (
        <Box
          sx={{
            height: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'grey.100',
            flexDirection: 'column',
          }}
        >
          {getFileIcon(file.mimeType)}
          <Typography variant="h6" sx={{ mt: 1 }}>
            {file.filename}
          </Typography>
        </Box>
      )}
      
      <CardContent>
        <Typography variant="subtitle2" noWrap>
          {file.filename}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
          <Chip 
            label={getMediaCategory(file.mimeType)} 
            size="small" 
            color={getCategoryColor(getMediaCategory(file.mimeType))}
          />
          <Chip 
            label={formatFileSize(file.size)} 
            size="small" 
            variant="outlined"
          />
        </Box>
        {file.tags.length > 0 && (
          <Box sx={{ mt: 1 }}>
            {file.tags.slice(0, 2).map((tag, index) => (
              <Chip key={index} label={tag} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
            ))}
            {file.tags.length > 2 && (
              <Chip label={`+${file.tags.length - 2}`} size="small" />
            )}
          </Box>
        )}
      </CardContent>
      
      <CardActions>
        <IconButton 
          size="small" 
          onClick={(e) => {
            e.stopPropagation();
            setSelectedFile(file);
            setPreviewOpen(true);
          }}
        >
          <ZoomIcon />
        </IconButton>
        <IconButton 
          size="small" 
          onClick={(e) => {
            e.stopPropagation();
            // TODO: Implement edit functionality
          }}
        >
          <EditIcon />
        </IconButton>
        <IconButton 
          size="small" 
          onClick={(e) => {
            e.stopPropagation();
            window.open(file.url, '_blank');
          }}
        >
          <DownloadIcon />
        </IconButton>
      </CardActions>
    </Card>
  );

  const renderMediaList = (file: MediaFile) => (
    <ListItem
      key={file.id}
      button
      selected={selectedFiles.includes(file.id)}
      onClick={() => {
        if (selectedFiles.includes(file.id)) {
          setSelectedFiles(prev => prev.filter(id => id !== file.id));
        } else {
          setSelectedFiles(prev => [...prev, file.id]);
        }
      }}
    >
      <ListItemAvatar>
        <Avatar>
          {getFileIcon(file.mimeType)}
        </Avatar>
      </ListItemAvatar>
      <MuiListItemText
        primary={file.filename}
        secondary={
          <Box>
            <Typography variant="body2" color="text.secondary">
              {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString()}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
              <Chip 
                label={getMediaCategory(file.mimeType)} 
                size="small" 
                color={getCategoryColor(getMediaCategory(file.mimeType))}
              />
              {file.tags.slice(0, 3).map((tag, index) => (
                <Chip key={index} label={tag} size="small" variant="outlined" />
              ))}
            </Box>
          </Box>
        }
      />
      <ListItemSecondaryAction>
        <IconButton 
          size="small" 
          onClick={() => {
            setSelectedFile(file);
            setPreviewOpen(true);
          }}
        >
          <ZoomIcon />
        </IconButton>
        <IconButton 
          size="small" 
          onClick={() => {
            // TODO: Implement edit functionality
          }}
        >
          <EditIcon />
        </IconButton>
        <IconButton 
          size="small" 
          onClick={() => window.open(file.url, '_blank')}
        >
          <DownloadIcon />
        </IconButton>
      </ListItemSecondaryAction>
    </ListItem>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Media Library
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            Upload Files
          </Button>
          <IconButton onClick={() => setSettingsOpen(true)}>
            <SettingsIcon />
          </IconButton>
        </Box>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="All Media" />
          <Tab label="Images" />
          <Tab label="Videos" />
          <Tab label="Audio" />
          <Tab label="Documents" />
          <Tab label="Collections" />
        </Tabs>
      </Paper>

      {/* Upload Area */}
      <Paper
        sx={{
          p: 4,
          mb: 3,
          border: '2px dashed',
          borderColor: 'primary.main',
          textAlign: 'center',
          cursor: 'pointer',
          '&:hover': { backgroundColor: 'action.hover' },
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
      >
        <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Drag & Drop files here or click to browse
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Supports images, videos, audio, documents, and archives
        </Typography>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ALL_SUPPORTED_TYPES.join(',')}
          style={{ display: 'none' }}
          onChange={(e) => handleFileUpload(e.target.files)}
        />
      </Paper>

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Upload Progress
          </Typography>
          {uploadProgress.map((item) => (
            <Box key={item.fileId} sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">{item.filename}</Typography>
                <Typography variant="body2">{item.progress}%</Typography>
              </Box>
              <LinearProgress variant="determinate" value={item.progress} />
            </Box>
          ))}
        </Paper>
      )}

      {/* Filter and View Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search media..."
            value={filter.searchTerm || ''}
            onChange={(e) => setFilter(prev => ({ ...prev, searchTerm: e.target.value }))}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={filter.category || ''}
              onChange={(e) => setFilter(prev => ({ ...prev, category: e.target.value as MediaCategory }))}
            >
              <MenuItem value="">All Categories</MenuItem>
              <MenuItem value="image">Images</MenuItem>
              <MenuItem value="video">Videos</MenuItem>
              <MenuItem value="audio">Audio</MenuItem>
              <MenuItem value="document">Documents</MenuItem>
              <MenuItem value="archive">Archives</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton
            onClick={() => setViewMode('grid')}
            color={viewMode === 'grid' ? 'primary' : 'default'}
          >
            <GridViewIcon />
          </IconButton>
          <IconButton
            onClick={() => setViewMode('list')}
            color={viewMode === 'list' ? 'primary' : 'default'}
          >
            <ListViewIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Media Content */}
      <TabPanel value={tabValue} index={0}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">Failed to load media files</Alert>
        ) : (
          <>
            {selectedFiles.length > 0 && (
              <Paper sx={{ p: 2, mb: 3, backgroundColor: 'action.selected' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">
                    {selectedFiles.length} file(s) selected
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      startIcon={<DeleteIcon />}
                      onClick={() => deleteMutation.mutate(selectedFiles)}
                    >
                      Delete
                    </Button>
                    <Button
                      size="small"
                      startIcon={<DownloadIcon />}
                      onClick={() => {
                        // Implement bulk download
                      }}
                    >
                      Download
                    </Button>
                  </Box>
                </Box>
              </Paper>
            )}

            {viewMode === 'grid' ? (
              <Grid container spacing={2}>
                {mediaFiles?.map(renderMediaCard)}
              </Grid>
            ) : (
              <List>
                {mediaFiles?.map(renderMediaList)}
              </List>
            )}
          </>
        )}
      </TabPanel>

      {/* Individual category tabs */}
      {[1, 2, 3, 4].map((index) => (
        <TabPanel key={index} value={tabValue} index={index}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error">Failed to load media files</Alert>
          ) : (
            <>
              {selectedFiles.length > 0 && (
                <Paper sx={{ p: 2, mb: 3, backgroundColor: 'action.selected' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">
                      {selectedFiles.length} file(s) selected
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        startIcon={<DeleteIcon />}
                        onClick={() => deleteMutation.mutate(selectedFiles)}
                      >
                        Delete
                      </Button>
                      <Button
                        size="small"
                        startIcon={<DownloadIcon />}
                        onClick={() => {
                          // Implement bulk download
                        }}
                      >
                        Download
                      </Button>
                    </Box>
                  </Box>
                </Paper>
              )}

              {mediaFiles && mediaFiles.length === 0 ? (
                <Alert severity="info">
                  No {['images', 'videos', 'audio files', 'documents'][index - 1]} found.
                </Alert>
              ) : (
                viewMode === 'grid' ? (
                  <Grid container spacing={2}>
                    {mediaFiles?.map(renderMediaCard)}
                  </Grid>
                ) : (
                  <List>
                    {mediaFiles?.map(renderMediaList)}
                  </List>
                )
              )}
            </>
          )}
        </TabPanel>
      ))}

      {/* Collections Tab */}
      <TabPanel value={tabValue} index={5}>
        <Typography variant="h6" gutterBottom>
          Media Collections
        </Typography>
        <Grid container spacing={2}>
          {collections?.map((collection: MediaCollection) => (
            <Grid item xs={12} sm={6} md={4} key={collection.id}>
              <Card>
                <CardMedia
                  component="img"
                  height="140"
                  image={collection.thumbnailUrl}
                  alt={collection.name}
                />
                <CardContent>
                  <Typography variant="h6">{collection.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {collection.mediaIds.length} items
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small"
                    onClick={() => {
                      setSelectedCollection(collection);
                      setCollectionDialogOpen(true);
                    }}
                  >
                    View
                  </Button>
                  <Button size="small">Edit</Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedFile?.filename}
          <IconButton
            onClick={() => setPreviewOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedFile && (
            <Box sx={{ textAlign: 'center' }}>
              {getMediaType(selectedFile.mimeType) === 'image' ? (
                <img
                  src={selectedFile.url}
                  alt={selectedFile.filename}
                  style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
                />
              ) : getMediaType(selectedFile.mimeType) === 'video' ? (
                <video
                  controls
                  style={{ maxWidth: '100%', maxHeight: '70vh' }}
                >
                  <source src={selectedFile.url} type={selectedFile.mimeType} />
                </video>
              ) : getMediaType(selectedFile.mimeType) === 'audio' ? (
                <audio controls style={{ width: '100%' }}>
                  <source src={selectedFile.url} type={selectedFile.mimeType} />
                </audio>
              ) : (
                <Box sx={{ p: 4 }}>
                  {getFileIcon(selectedFile.mimeType)}
                  <Typography variant="h6" sx={{ mt: 2 }}>
                    {selectedFile.filename}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatFileSize(selectedFile.size)}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
          <Button 
            variant="contained" 
            startIcon={<DownloadIcon />}
            onClick={() => selectedFile && window.open(selectedFile.url, '_blank')}
          >
            Download
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upload Settings Dialog */}
      <Dialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Upload Settings</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={uploadConfig.generateThumbnails}
                  onChange={(e) => setUploadConfig(prev => ({ 
                    ...prev, 
                    generateThumbnails: e.target.checked 
                  }))}
                />
              }
              label="Generate Thumbnails"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={uploadConfig.compressImages}
                  onChange={(e) => setUploadConfig(prev => ({ 
                    ...prev, 
                    compressImages: e.target.checked 
                  }))}
                />
              }
              label="Compress Images"
            />
            <Box sx={{ mt: 3 }}>
              <Typography gutterBottom>
                Max File Size: {formatFileSize(uploadConfig.maxFileSize)}
              </Typography>
              <Slider
                value={uploadConfig.maxFileSize}
                onChange={(_, value) => setUploadConfig(prev => ({ 
                  ...prev, 
                  maxFileSize: value as number 
                }))}
                min={1024 * 1024} // 1MB
                max={100 * 1024 * 1024} // 100MB
                step={1024 * 1024} // 1MB
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => formatFileSize(value)}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>Close</Button>
          <Button variant="contained">Save Settings</Button>
        </DialogActions>
      </Dialog>

      {/* Collection View Dialog */}
      <Dialog
        open={collectionDialogOpen}
        onClose={() => {
          setCollectionDialogOpen(false);
          setSelectedCollection(null);
        }}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          {selectedCollection?.name || 'Collection'}
          <IconButton
            onClick={() => {
              setCollectionDialogOpen(false);
              setSelectedCollection(null);
            }}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {isLoadingCollectionFiles ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : collectionFiles && collectionFiles.length > 0 ? (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {collectionFiles.map((file: MediaFile) => renderMediaCard(file))}
            </Grid>
          ) : (
            <Alert severity="info" sx={{ mt: 2 }}>
              No files found in this collection.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setCollectionDialogOpen(false);
              setSelectedCollection(null);
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Loading Backdrop */}
      <Backdrop open={isUploading} sx={{ zIndex: 9999 }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress color="primary" />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Uploading files...
          </Typography>
        </Box>
      </Backdrop>
    </Box>
  );
};

export default MediaEditor;
