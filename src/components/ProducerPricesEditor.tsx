import React, { useState } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, CircularProgress, Alert, Breadcrumbs, Link, Chip, Grid, Card, CardContent
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Save as SaveIcon, Cancel as CancelIcon, AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5001';

interface ProducerPrice {
  id: number;
  crop_name: string;
  variety: string;
  price_per_kg: number | null;
  price_per_50kg: number | null;
  price_per_90kg: number | null;
  season: string;
  region: string;
  grade: string;
  notes: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const ProducerPricesEditor = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState<ProducerPrice | null>(null);
  const [formData, setFormData] = useState({
    crop_name: '',
    variety: '',
    price_per_kg: '',
    price_per_50kg: '',
    price_per_90kg: '',
    season: '',
    region: '',
    grade: '',
    notes: ''
  });

  // Fetch producer prices
  const { data: prices, isLoading, error } = useQuery({
    queryKey: ['producer-prices'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/api/producer-prices`);
      return response.data.data;
    }
  });

  // Create/Update mutation
  const mutation = useMutation({
    mutationFn: async (data: Partial<ProducerPrice>) => {
      if (editingPrice) {
        const response = await axios.put(`${API_BASE}/api/producer-prices/${editingPrice.id}`, data);
        return response.data;
      } else {
        const response = await axios.post(`${API_BASE}/api/producer-prices`, data);
        return response.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['producer-prices'] });
      setOpen(false);
      setEditingPrice(null);
      resetForm();
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await axios.delete(`${API_BASE}/api/producer-prices/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['producer-prices'] });
    }
  });

  const resetForm = () => {
    setFormData({
      crop_name: '',
      variety: '',
      price_per_kg: '',
      price_per_50kg: '',
      price_per_90kg: '',
      season: '',
      region: '',
      grade: '',
      notes: ''
    });
  };

  const handleOpen = (price?: ProducerPrice) => {
    if (price) {
      setEditingPrice(price);
      setFormData({
        crop_name: price.crop_name,
        variety: price.variety,
        price_per_kg: price.price_per_kg?.toString() || '',
        price_per_50kg: price.price_per_50kg?.toString() || '',
        price_per_90kg: price.price_per_90kg?.toString() || '',
        season: price.season,
        region: price.region,
        grade: price.grade,
        notes: price.notes
      });
    } else {
      setEditingPrice(null);
      resetForm();
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingPrice(null);
    resetForm();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      price_per_kg: formData.price_per_kg ? parseFloat(formData.price_per_kg) : null,
      price_per_50kg: formData.price_per_50kg ? parseFloat(formData.price_per_50kg) : null,
      price_per_90kg: formData.price_per_90kg ? parseFloat(formData.price_per_90kg) : null
    };
    mutation.mutate(submitData);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this producer price?')) {
      deleteMutation.mutate(id);
    }
  };

  const formatPrice = (price: number | null) => {
    return price ? `KSh ${price.toLocaleString()}` : '-';
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
          Failed to load producer prices. Please try again.
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box mb={3}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <Link
            component="button"
            variant="body1"
            onClick={() => navigate('/growers-portal')}
            sx={{ textDecoration: 'none' }}
          >
            Growers Portal
          </Link>
          <Typography color="text.primary">Producer Prices</Typography>
        </Breadcrumbs>

        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Producer Prices Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage crop prices for different varieties and regions
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpen()}
            sx={{ bgcolor: 'primary.main' }}
          >
            Add Price
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <MoneyIcon color="primary" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h6">{prices?.length || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Prices
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <MoneyIcon color="success" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h6">
                    {prices ? new Set(prices.map((p: ProducerPrice) => p.crop_name)).size : 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Crop Types
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'primary.main' }}>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Crop</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Variety</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Price/KG</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Price/50KG</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Price/90KG</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Season</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Region</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Grade</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {prices?.map((price: ProducerPrice) => (
              <TableRow key={price.id} hover>
                <TableCell>{price.crop_name}</TableCell>
                <TableCell>{price.variety || '-'}</TableCell>
                <TableCell>{formatPrice(price.price_per_kg)}</TableCell>
                <TableCell>{formatPrice(price.price_per_50kg)}</TableCell>
                <TableCell>{formatPrice(price.price_per_90kg)}</TableCell>
                <TableCell>
                  <Chip 
                    label={price.season || 'N/A'} 
                    size="small" 
                    color={price.season ? 'primary' : 'default'}
                  />
                </TableCell>
                <TableCell>{price.region || '-'}</TableCell>
                <TableCell>{price.grade || '-'}</TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleOpen(price)}
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(price.id)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingPrice ? 'Edit Producer Price' : 'Add New Producer Price'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Crop Name"
                  value={formData.crop_name}
                  onChange={(e) => setFormData({ ...formData, crop_name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Variety"
                  value={formData.variety}
                  onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Price per KG"
                  type="number"
                  value={formData.price_per_kg}
                  onChange={(e) => setFormData({ ...formData, price_per_kg: e.target.value })}
                  inputProps={{ step: "0.01" }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Price per 50KG"
                  type="number"
                  value={formData.price_per_50kg}
                  onChange={(e) => setFormData({ ...formData, price_per_50kg: e.target.value })}
                  inputProps={{ step: "0.01" }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Price per 90KG"
                  type="number"
                  value={formData.price_per_90kg}
                  onChange={(e) => setFormData({ ...formData, price_per_90kg: e.target.value })}
                  inputProps={{ step: "0.01" }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Season"
                  value={formData.season}
                  onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Region"
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Grade"
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  multiline
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} startIcon={<CancelIcon />}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? <CircularProgress size={20} /> : 'Save'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default ProducerPricesEditor;
