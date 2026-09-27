import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  Map as MapIcon,
  TableChart as TableIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Branch {
  id?: number;
  name: string;
  location: string;
  address: string;
  email: string;
  phone: string;
  coords: [number, number];
  country: string;
  isActive?: boolean;
  orderIndex?: number;
}

const BranchesEditor: React.FC = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState<Branch>({
    name: '',
    location: '',
    address: '',
    email: '',
    phone: '',
    coords: [0, 0],
    country: 'Kenya',
  });
  const [viewMode, setViewMode] = useState<'table' | 'map'>('table');
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const queryClient = useQueryClient();

  // Fetch all branches
  const { data: branchesData, isLoading, error } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const response = await axios.get('/api/branches');
      return response.data.branches;
    },
  });

  // Create branch mutation
  const createMutation = useMutation({
    mutationFn: async (branch: Branch) => {
      const response = await axios.post('/api/branches', branch);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      handleCloseDialog();
    },
  });

  // Update branch mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...branch }: Branch & { id: number }) => {
      const response = await axios.put(`/api/branches/${id}`, branch);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      handleCloseDialog();
    },
  });

  // Delete branch mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await axios.delete(`/api/branches/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
    },
  });

  const handleOpenDialog = (branch?: Branch & { id: number }) => {
    if (branch) {
      setEditingBranch(branch);
      // Ensure coords are numbers (they might come as strings from the database)
      setFormData({
        ...branch,
        coords: [Number(branch.coords[0]), Number(branch.coords[1])]
      });
    } else {
      setEditingBranch(null);
      setFormData({
        name: '',
        location: '',
        address: '',
        email: '',
        phone: '',
        coords: [0, 0],
        country: 'Kenya',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingBranch(null);
  };

  const handleSubmit = () => {
    if (editingBranch?.id) {
      updateMutation.mutate({ ...formData, id: editingBranch.id });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this branch?')) {
      deleteMutation.mutate(id);
    }
  };

  const getCountryColor = (country: string) => {
    switch (country) {
      case 'Kenya':
        return 'primary';
      case 'Uganda':
        return 'success';
      case 'Rwanda':
        return 'warning';
      case 'Tanzania':
        return 'error';
      default:
        return 'default';
    }
  };

  const branchesByCountry = branchesData?.reduce((acc: any, branch: Branch) => {
    if (!acc[branch.country]) acc[branch.country] = [];
    acc[branch.country].push(branch);
    return acc;
  }, {});

  // Initialize map
  useEffect(() => {
    if (viewMode === 'map' && mapRef.current && !mapInstanceRef.current && branchesData) {
      // Create map
      const map = L.map(mapRef.current).setView([0.0236, 37.9062], 5);
      
      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      // Define country-specific icons
      const createIcon = (color: string) => {
        return L.divIcon({
          className: 'custom-div-icon',
          html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });
      };

      const countryIcons: Record<string, L.DivIcon> = {
        'Kenya': createIcon('#3B82F6'),
        'Uganda': createIcon('#10B981'),
        'Rwanda': createIcon('#F59E0B'),
        'Tanzania': createIcon('#EF4444'),
      };

      // Add markers
      branchesData.forEach((branch: Branch & { id: number }) => {
        const icon = countryIcons[branch.country] || createIcon('#6B7280');
        const marker = L.marker([Number(branch.coords[0]), Number(branch.coords[1])], { icon }).addTo(map);
        
        marker.bindPopup(`
          <div style="padding: 8px; min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">${branch.name}</h3>
            <p style="margin: 4px 0; font-size: 12px;"><strong>Location:</strong> ${branch.location}</p>
            ${branch.phone ? `<p style="margin: 4px 0; font-size: 12px;"><strong>Phone:</strong> ${branch.phone}</p>` : ''}
            ${branch.email ? `<p style="margin: 4px 0; font-size: 12px;"><strong>Email:</strong> ${branch.email}</p>` : ''}
            <p style="margin: 4px 0; font-size: 11px; color: #666;">${branch.country}</p>
          </div>
        `);

        // Click marker to edit
        marker.on('click', () => {
          handleOpenDialog(branch);
        });
      });

      mapInstanceRef.current = map;
    }

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [viewMode, branchesData]);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Branch Network Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage branch locations across East Africa for the interactive map
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add New Branch
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 3 }}>
        <Paper sx={{ p: 2, bgcolor: '#3B82F6', color: 'white' }}>
          <Typography variant="h6">{branchesByCountry?.Kenya?.length || 0}</Typography>
          <Typography variant="body2">Kenya Branches</Typography>
        </Paper>
        <Paper sx={{ p: 2, bgcolor: '#10B981', color: 'white' }}>
          <Typography variant="h6">{branchesByCountry?.Uganda?.length || 0}</Typography>
          <Typography variant="body2">Uganda Branches</Typography>
        </Paper>
        <Paper sx={{ p: 2, bgcolor: '#F59E0B', color: 'white' }}>
          <Typography variant="h6">{branchesByCountry?.Rwanda?.length || 0}</Typography>
          <Typography variant="body2">Rwanda Branches</Typography>
        </Paper>
        <Paper sx={{ p: 2, bgcolor: '#EF4444', color: 'white' }}>
          <Typography variant="h6">{branchesByCountry?.Tanzania?.length || 0}</Typography>
          <Typography variant="body2">Tanzania Branches</Typography>
        </Paper>
      </Box>

      {/* View Toggle */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(e, newMode) => newMode && setViewMode(newMode)}
          aria-label="view mode"
        >
          <ToggleButton value="table" aria-label="table view">
            <TableIcon sx={{ mr: 1 }} />
            Table View
          </ToggleButton>
          <ToggleButton value="map" aria-label="map view">
            <MapIcon sx={{ mr: 1 }} />
            Map View
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Loading and Error States */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">Failed to load branches</Alert>
      ) : (
        <>
          {/* Table View */}
          {viewMode === 'table' && (
            <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Branch Name</strong></TableCell>
                <TableCell><strong>Location</strong></TableCell>
                <TableCell><strong>Country</strong></TableCell>
                <TableCell><strong>Contact</strong></TableCell>
                <TableCell><strong>Coordinates</strong></TableCell>
                <TableCell align="right"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {branchesData?.map((branch: Branch & { id: number }) => (
                <TableRow key={branch.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">{branch.name}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ maxWidth: 300 }}>{branch.location}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={branch.country}
                      size="small"
                      color={getCountryColor(branch.country) as any}
                    />
                  </TableCell>
                  <TableCell>
                    {branch.phone && (
                      <Typography variant="caption" display="block">{branch.phone}</Typography>
                    )}
                    {branch.email && (
                      <Typography variant="caption" display="block">{branch.email}</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" display="block">
                      {Number(branch.coords[0]).toFixed(4)}, {Number(branch.coords[1]).toFixed(4)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleOpenDialog(branch)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(branch.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
          )}

          {/* Map View */}
          {viewMode === 'map' && (
            <Paper sx={{ p: 2 }}>
              <Box
                ref={mapRef}
                sx={{
                  height: '600px',
                  width: '100%',
                  borderRadius: 1,
                  overflow: 'hidden',
                  '& .leaflet-container': {
                    height: '100%',
                    width: '100%',
                  },
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                Tip: Click on any marker to edit that branch
              </Typography>
            </Paper>
          )}
        </>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingBranch ? 'Edit Branch' : 'Add New Branch'}
          <IconButton
            onClick={handleCloseDialog}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Branch Name *"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Kitale Branch"
            />
            
            <TextField
              label="Location *"
              fullWidth
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., Mbegu Plaza, Kenya Seed Street"
            />
            
            <TextField
              label="Address"
              fullWidth
              multiline
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="P.O. Box address"
            />
            
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Email"
                fullWidth
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              
              <TextField
                label="Phone"
                fullWidth
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </Box>
            
            <FormControl fullWidth>
              <InputLabel>Country *</InputLabel>
              <Select
                value={formData.country}
                label="Country *"
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              >
                <MenuItem value="Kenya">Kenya</MenuItem>
                <MenuItem value="Uganda">Uganda</MenuItem>
                <MenuItem value="Rwanda">Rwanda</MenuItem>
                <MenuItem value="Tanzania">Tanzania</MenuItem>
              </Select>
            </FormControl>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Latitude *"
                fullWidth
                type="number"
                inputProps={{ step: 0.000001 }}
                value={formData.coords[0]}
                onChange={(e) => setFormData({
                  ...formData,
                  coords: [parseFloat(e.target.value) || 0, formData.coords[1]]
                })}
              />
              
              <TextField
                label="Longitude *"
                fullWidth
                type="number"
                inputProps={{ step: 0.000001 }}
                value={formData.coords[1]}
                onChange={(e) => setFormData({
                  ...formData,
                  coords: [formData.coords[0], parseFloat(e.target.value) || 0]
                })}
              />
            </Box>
            
            <Alert severity="info" icon={<MapIcon />}>
              <Typography variant="body2">
                <strong>Tip:</strong> Use Google Maps to find coordinates. Right-click a location and select "What's here?" to get latitude and longitude.
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSubmit}
            disabled={!formData.name || !formData.location || !formData.country}
          >
            {editingBranch ? 'Update Branch' : 'Create Branch'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BranchesEditor;

