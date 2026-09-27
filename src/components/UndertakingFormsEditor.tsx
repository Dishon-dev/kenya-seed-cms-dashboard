import React, { useState } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, CircularProgress, Alert, Breadcrumbs, Link, 
  Chip, Grid, Card, CardContent, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Save as SaveIcon, Cancel as CancelIcon, Description as FormIcon,
  Download as DownloadIcon, Upload as UploadIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5001';

interface UndertakingForm {
  id: number;
  from_name: string;
  from_address: string;
  date: string;
  acres: string;
  zone: string;
  county: string;
  bank: string;
  account_number: string;
  amount: string;
  seed_type: string;
  signature: string;
  contract_file_name: string;
  status: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const UndertakingFormsEditor: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [editingForm, setEditingForm] = useState<UndertakingForm | null>(null);
  const [formState, setFormState] = useState<Partial<UndertakingForm>>({
    from_name: '',
    from_address: '',
    date: '',
    acres: '',
    zone: '',
    county: '',
    bank: '',
    account_number: '',
    amount: '',
    seed_type: '',
    signature: '',
    contract_file_name: '',
    status: 'pending'
  });

  // Fetch undertaking forms
  const { data: forms, isLoading, error } = useQuery({
    queryKey: ['undertaking-forms'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/api/undertaking-forms`);
      return response.data.data;
    }
  });

  // Create/Update mutation
  const mutation = useMutation({
    mutationFn: async (data: Partial<UndertakingForm>) => {
      if (editingForm) {
        const response = await axios.put(`${API_BASE}/api/undertaking-forms/${editingForm.id}`, data);
        return response.data;
      } else {
        const response = await axios.post(`${API_BASE}/api/undertaking-forms`, data);
        return response.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['undertaking-forms'] });
      setOpen(false);
      setEditingForm(null);
      resetForm();
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await axios.delete(`${API_BASE}/api/undertaking-forms/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['undertaking-forms'] });
    }
  });

  const handleOpen = (form?: UndertakingForm) => {
    if (form) {
      setEditingForm(form);
      setFormState({
        from_name: form.from_name,
        from_address: form.from_address,
        date: form.date,
        acres: form.acres,
        zone: form.zone,
        county: form.county,
        bank: form.bank,
        account_number: form.account_number,
        amount: form.amount,
        seed_type: form.seed_type,
        signature: form.signature,
        contract_file_name: form.contract_file_name,
        status: form.status
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingForm(null);
    resetForm();
  };

  const resetForm = () => {
    setFormState({
      from_name: '',
      from_address: '',
      date: '',
      acres: '',
      zone: '',
      county: '',
      bank: '',
      account_number: '',
      amount: '',
      seed_type: '',
      signature: '',
      contract_file_name: '',
      status: 'pending'
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any) => {
    const { name, value } = e.target;
    setFormState(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = () => {
    mutation.mutate(formState);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this undertaking form?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleDownload = (id: number) => {
    window.open(`${API_BASE}/api/undertaking-forms/${id}/download`, '_blank');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  if (isLoading) return <CircularProgress />;
  if (error) return <Alert severity="error">Error loading undertaking forms: {error.message}</Alert>;

  return (
    <Box sx={{ p: 3 }}>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link underline="hover" color="inherit" onClick={() => navigate('/growers-portal')}>
          Growers Portal
        </Link>
        <Typography color="text.primary">Undertaking Forms</Typography>
      </Breadcrumbs>

      <Typography variant="h4" gutterBottom>
        Undertaking Forms Management
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <FormIcon color="primary" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h6">
                    {forms?.length || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Forms
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <FormIcon color="success" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h6">
                    {forms?.filter((f: UndertakingForm) => f.status === 'approved').length || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Approved
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <FormIcon color="warning" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h6">
                    {forms?.filter((f: UndertakingForm) => f.status === 'pending').length || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Button
        variant="contained"
        color="primary"
        startIcon={<AddIcon />}
        onClick={() => handleOpen()}
        sx={{ mb: 2 }}
      >
        Add New Form
      </Button>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>From Name</TableCell>
              <TableCell>Seed Type</TableCell>
              <TableCell>Acres</TableCell>
              <TableCell>County</TableCell>
              <TableCell>Bank</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {forms?.map((form: UndertakingForm) => (
              <TableRow key={form.id}>
                <TableCell>{form.from_name}</TableCell>
                <TableCell>{form.seed_type}</TableCell>
                <TableCell>{form.acres}</TableCell>
                <TableCell>{form.county}</TableCell>
                <TableCell>{form.bank}</TableCell>
                <TableCell>KES {form.amount}</TableCell>
                <TableCell>
                  <Chip 
                    label={form.status} 
                    color={getStatusColor(form.status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>{new Date(form.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <IconButton color="primary" onClick={() => handleOpen(form)}>
                    <EditIcon />
                  </IconButton>
                  {form.contract_file_name && (
                    <IconButton color="info" onClick={() => handleDownload(form.id)}>
                      <DownloadIcon />
                    </IconButton>
                  )}
                  <IconButton color="error" onClick={() => handleDelete(form.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>{editingForm ? 'Edit Undertaking Form' : 'Add New Undertaking Form'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="from_name"
            label="From Name"
            type="text"
            fullWidth
            variant="outlined"
            value={formState.from_name}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="from_address"
            label="From Address"
            type="text"
            fullWidth
            multiline
            rows={2}
            variant="outlined"
            value={formState.from_address}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="date"
            label="Date"
            type="text"
            fullWidth
            variant="outlined"
            value={formState.date}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="acres"
            label="Acres"
            type="text"
            fullWidth
            variant="outlined"
            value={formState.acres}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="zone"
            label="Zone"
            type="text"
            fullWidth
            variant="outlined"
            value={formState.zone}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="county"
            label="County"
            type="text"
            fullWidth
            variant="outlined"
            value={formState.county}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="bank"
            label="Bank"
            type="text"
            fullWidth
            variant="outlined"
            value={formState.bank}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="account_number"
            label="Account Number"
            type="text"
            fullWidth
            variant="outlined"
            value={formState.account_number}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="amount"
            label="Amount (KES)"
            type="text"
            fullWidth
            variant="outlined"
            value={formState.amount}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="seed_type"
            label="Seed Type"
            type="text"
            fullWidth
            variant="outlined"
            value={formState.seed_type}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="signature"
            label="Signature"
            type="text"
            fullWidth
            variant="outlined"
            value={formState.signature}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="contract_file_name"
            label="Contract File Name"
            type="text"
            fullWidth
            variant="outlined"
            value={formState.contract_file_name}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Status</InputLabel>
            <Select
              name="status"
              value={formState.status}
              onChange={handleChange}
              label="Status"
            >
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} startIcon={<CancelIcon />}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} color="primary" variant="contained" startIcon={<SaveIcon />}>
            {mutation.isPending ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UndertakingFormsEditor;
