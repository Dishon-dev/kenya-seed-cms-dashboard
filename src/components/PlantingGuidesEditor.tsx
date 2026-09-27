import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Breadcrumbs,
  Link
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Upload as UploadIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Agriculture as AgricultureIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5001';

interface PlantingGuide {
  id: number;
  title: string;
  description: string;
  crop_type: string;
  season: string;
  difficulty_level: string;
  estimated_duration: string;
  pdf_filename?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const PlantingGuidesEditor: React.FC = () => {
  const navigate = useNavigate();
  const [guides, setGuides] = useState<PlantingGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGuide, setEditingGuide] = useState<PlantingGuide | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    crop_type: '',
    season: '',
    difficulty_level: 'beginner',
    estimated_duration: ''
  });

  const cropTypes = ['Maize', 'Wheat', 'Finger Millet', 'Sorghum', 'Sunflower', 'Rice', 'Beans', 'Other'];
  const seasons = ['Long Rains', 'Short Rains', 'All Year', 'Dry Season'];
  const difficultyLevels = ['beginner', 'intermediate', 'advanced'];

  useEffect(() => {
    fetchGuides();
  }, []);

  const fetchGuides = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/planting-guides`);
      const data = await response.json();
      
      if (data.success) {
        setGuides(data.data);
      } else {
        setError('Failed to fetch planting guides');
      }
    } catch (err) {
      setError('Error fetching planting guides');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGuide = () => {
    setEditingGuide(null);
    setFormData({
      title: '',
      description: '',
      crop_type: '',
      season: '',
      difficulty_level: 'beginner',
      estimated_duration: ''
    });
    setDialogOpen(true);
  };

  const handleEditGuide = (guide: PlantingGuide) => {
    setEditingGuide(guide);
    setFormData({
      title: guide.title,
      description: guide.description,
      crop_type: guide.crop_type,
      season: guide.season,
      difficulty_level: guide.difficulty_level,
      estimated_duration: guide.estimated_duration
    });
    setDialogOpen(true);
  };

  const handleSaveGuide = async () => {
    try {
      const url = editingGuide 
        ? `${API_BASE}/api/planting-guides/${editingGuide.id}`
        : `${API_BASE}/api/planting-guides`;
      
      const method = editingGuide ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setDialogOpen(false);
        fetchGuides();
      } else {
        setError('Failed to save planting guide');
      }
    } catch (err) {
      setError('Error saving planting guide');
      console.error('Error:', err);
    }
  };

  const handleDeleteGuide = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this planting guide?')) {
      try {
        const response = await fetch(`${API_BASE}/api/planting-guides/${id}`, {
          method: 'DELETE',
        });
        
        const data = await response.json();
        
        if (data.success) {
          fetchGuides();
        } else {
          setError('Failed to delete planting guide');
        }
      } catch (err) {
        setError('Error deleting planting guide');
        console.error('Error:', err);
      }
    }
  };

  const handleUploadPDF = async (id: number, file: File) => {
    try {
      const formData = new FormData();
      formData.append('pdf', file);
      
      const response = await fetch(`${API_BASE}/api/planting-guides/${id}/pdf`, {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (data.success) {
        fetchGuides();
      } else {
        setError('Failed to upload PDF');
      }
    } catch (err) {
      setError('Error uploading PDF');
      console.error('Error:', err);
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'success';
      case 'intermediate': return 'warning';
      case 'advanced': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link 
          color="inherit" 
          href="#" 
          onClick={(e) => {
            e.preventDefault();
            navigate('/growers-portal');
          }}
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
        >
          <ArrowBackIcon fontSize="small" />
          Growers Portal
        </Link>
        <Typography color="text.primary">Planting Guides</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <Avatar sx={{ bgcolor: '#16a34a' }}>
          <AgricultureIcon />
        </Avatar>
        <Box>
          <Typography variant="h4" component="h1">
            Planting Guides Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage crop-specific planting guides and PDFs
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Action Buttons */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateGuide}
          sx={{ 
            bgcolor: '#16a34a',
            '&:hover': { bgcolor: '#16a34a', opacity: 0.9 }
          }}
        >
          Add New Guide
        </Button>
      </Box>

      {/* Guides Table */}
      <Card>
        <CardContent>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Crop Type</TableCell>
                  <TableCell>Season</TableCell>
                  <TableCell>Difficulty</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>PDF</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {guides.map((guide) => (
                  <TableRow key={guide.id}>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {guide.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {guide.description}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={guide.crop_type} variant="outlined" size="small" />
                    </TableCell>
                    <TableCell>{guide.season}</TableCell>
                    <TableCell>
                      <Chip 
                        label={guide.difficulty_level} 
                        color={getDifficultyColor(guide.difficulty_level) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{guide.estimated_duration}</TableCell>
                    <TableCell>
                      {guide.pdf_filename ? (
                        <Chip 
                          label="PDF Available" 
                          color="success" 
                          size="small"
                          icon={<DownloadIcon />}
                        />
                      ) : (
                        <Chip label="No PDF" color="default" size="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleEditGuide(guide)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteGuide(guide.id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                        {guide.pdf_filename && (
                          <IconButton
                            size="small"
                            onClick={() => window.open(`${API_BASE}/api/planting-guides/${guide.id}/pdf`, '_blank')}
                            color="info"
                          >
                            <ViewIcon />
                          </IconButton>
                        )}
                        <input
                          type="file"
                          accept=".pdf"
                          style={{ display: 'none' }}
                          id={`upload-pdf-${guide.id}`}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleUploadPDF(guide.id, file);
                            }
                          }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => document.getElementById(`upload-pdf-${guide.id}`)?.click()}
                          color="secondary"
                        >
                          <UploadIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingGuide ? 'Edit Planting Guide' : 'Create New Planting Guide'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                variant="outlined"
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Crop Type</InputLabel>
                <Select
                  value={formData.crop_type}
                  onChange={(e) => setFormData({ ...formData, crop_type: e.target.value })}
                  label="Crop Type"
                >
                  {cropTypes.map((type) => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Season</InputLabel>
                <Select
                  value={formData.season}
                  onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                  label="Season"
                >
                  {seasons.map((season) => (
                    <MenuItem key={season} value={season}>{season}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Difficulty Level</InputLabel>
                <Select
                  value={formData.difficulty_level}
                  onChange={(e) => setFormData({ ...formData, difficulty_level: e.target.value })}
                  label="Difficulty Level"
                >
                  {difficultyLevels.map((level) => (
                    <MenuItem key={level} value={level}>{level}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Estimated Duration"
                value={formData.estimated_duration}
                onChange={(e) => setFormData({ ...formData, estimated_duration: e.target.value })}
                variant="outlined"
                placeholder="e.g., 4-6 months"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSaveGuide} 
            variant="contained"
            sx={{ 
              bgcolor: '#16a34a',
              '&:hover': { bgcolor: '#16a34a', opacity: 0.9 }
            }}
          >
            {editingGuide ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PlantingGuidesEditor;
