import React, { useState } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, CircularProgress, Alert, Breadcrumbs, Link, 
  Chip, Grid, Card, CardContent, FormControl, InputLabel, Select, MenuItem,
  Tabs, Tab, Accordion, AccordionSummary, AccordionDetails, Divider
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Save as SaveIcon, Cancel as CancelIcon, Description as FormIcon,
  Download as DownloadIcon, ExpandMore as ExpandMoreIcon, Person as PersonIcon,
  LocationOn as LocationIcon, AttachFile as FileIcon, Assessment as AssessmentIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5001';

interface FingerMilletApplication {
  id: number;
  full_name: string;
  postal_address: string;
  telephone: string;
  email: string;
  id_number: string;
  farm_name: string;
  lr_number: string;
  field_protection: string;
  field_accessibility: string;
  responsible_name: string;
  responsible_tel: string;
  responsible_position: string;
  machinery_ownership: string;
  finance_plan: string;
  isolation: string;
  production_rules: string;
  field_history: any[];
  total_area: number;
  area_unit: string;
  farm_route_description: string;
  signature: string;
  signature_date: string;
  field_officer_remarks: string;
  evaluation_date: string;
  officer_name: string;
  officer_signature: string;
  manager_remarks: string;
  manager_date: string;
  manager_signature: string;
  status: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const FingerMilletApplicationsEditor: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [editingApplication, setEditingApplication] = useState<FingerMilletApplication | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [formState, setFormState] = useState<Partial<FingerMilletApplication>>({
    full_name: '',
    postal_address: '',
    telephone: '',
    email: '',
    id_number: '',
    farm_name: '',
    lr_number: '',
    field_protection: '',
    field_accessibility: '',
    responsible_name: '',
    responsible_tel: '',
    responsible_position: '',
    machinery_ownership: '',
    finance_plan: '',
    isolation: '',
    production_rules: '',
    field_history: [],
    total_area: 0,
    area_unit: 'acres',
    farm_route_description: '',
    signature: '',
    signature_date: '',
    field_officer_remarks: '',
    evaluation_date: '',
    officer_name: '',
    officer_signature: '',
    manager_remarks: '',
    manager_date: '',
    manager_signature: '',
    status: 'pending'
  });

  // Fetch finger millet applications
  const { data: applications, isLoading, error } = useQuery({
    queryKey: ['finger-millet-applications'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/api/finger-millet-applications`);
      return response.data.data;
    }
  });

  // Create/Update mutation
  const mutation = useMutation({
    mutationFn: async (data: Partial<FingerMilletApplication>) => {
      // Convert field_history to JSON string if it's an array
      const processedData = {
        ...data,
        field_history: Array.isArray(data.field_history) 
          ? JSON.stringify(data.field_history) 
          : data.field_history
      };
      
      if (editingApplication) {
        const response = await axios.put(`${API_BASE}/api/finger-millet-applications/${editingApplication.id}`, processedData);
        return response.data;
      } else {
        const response = await axios.post(`${API_BASE}/api/finger-millet-applications`, processedData);
        return response.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finger-millet-applications'] });
      setOpen(false);
      setEditingApplication(null);
      resetForm();
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await axios.delete(`${API_BASE}/api/finger-millet-applications/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finger-millet-applications'] });
    }
  });

  const handleOpen = (application?: FingerMilletApplication) => {
    if (application) {
      setEditingApplication(application);
      setFormState({
        full_name: application.full_name,
        postal_address: application.postal_address,
        telephone: application.telephone,
        email: application.email,
        id_number: application.id_number,
        farm_name: application.farm_name,
        lr_number: application.lr_number,
        field_protection: application.field_protection,
        field_accessibility: application.field_accessibility,
        responsible_name: application.responsible_name,
        responsible_tel: application.responsible_tel,
        responsible_position: application.responsible_position,
        machinery_ownership: application.machinery_ownership,
        finance_plan: application.finance_plan,
        isolation: application.isolation,
        production_rules: application.production_rules,
        field_history: typeof application.field_history === 'string' 
          ? JSON.parse(application.field_history) 
          : application.field_history || [],
        total_area: application.total_area,
        area_unit: application.area_unit,
        farm_route_description: application.farm_route_description,
        signature: application.signature,
        signature_date: application.signature_date,
        field_officer_remarks: application.field_officer_remarks,
        evaluation_date: application.evaluation_date,
        officer_name: application.officer_name,
        officer_signature: application.officer_signature,
        manager_remarks: application.manager_remarks,
        manager_date: application.manager_date,
        manager_signature: application.manager_signature,
        status: application.status
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingApplication(null);
    resetForm();
  };

  const resetForm = () => {
    setFormState({
      full_name: '',
      postal_address: '',
      telephone: '',
      email: '',
      id_number: '',
      farm_name: '',
      lr_number: '',
      field_protection: '',
      field_accessibility: '',
      responsible_name: '',
      responsible_tel: '',
      responsible_position: '',
      machinery_ownership: '',
      finance_plan: '',
      isolation: '',
      production_rules: '',
      field_history: [],
      total_area: 0,
      area_unit: 'acres',
      farm_route_description: '',
      signature: '',
      signature_date: '',
      field_officer_remarks: '',
      evaluation_date: '',
      officer_name: '',
      officer_signature: '',
      manager_remarks: '',
      manager_date: '',
      manager_signature: '',
      status: 'pending'
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormState(prevState => ({
      ...prevState,
      [field]: value
    }));
  };

  const handleSubmit = () => {
    mutation.mutate(formState);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this finger millet application?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleDownload = (id: number, documentType: string) => {
    window.open(`${API_BASE}/api/finger-millet-applications/${id}/download/${documentType}`, '_blank');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'under_review': return 'info';
      default: return 'default';
    }
  };

  if (isLoading) return <CircularProgress />;
  if (error) return <Alert severity="error">Error loading finger millet applications: {error.message}</Alert>;

  return (
    <Box sx={{ p: 3 }}>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link underline="hover" color="inherit" onClick={() => navigate('/growers-portal')}>
          Growers Portal
        </Link>
        <Typography color="text.primary">Finger Millet Applications</Typography>
      </Breadcrumbs>

      <Typography variant="h4" gutterBottom>
        Finger Millet Applications Management
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <FormIcon color="primary" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h6">
                    {applications?.length || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Applications
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <FormIcon color="success" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h6">
                    {applications?.filter((a: FingerMilletApplication) => a.status === 'approved').length || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Approved
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <FormIcon color="warning" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h6">
                    {applications?.filter((a: FingerMilletApplication) => a.status === 'pending').length || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <FormIcon color="info" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h6">
                    {applications?.filter((a: FingerMilletApplication) => a.status === 'under_review').length || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Under Review
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
        Add New Application
      </Button>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Applicant Name</TableCell>
              <TableCell>Farm Name</TableCell>
              <TableCell>Telephone</TableCell>
              <TableCell>Total Area</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Applied Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {applications?.map((application: FingerMilletApplication) => (
              <TableRow key={application.id}>
                <TableCell>{application.full_name}</TableCell>
                <TableCell>{application.farm_name}</TableCell>
                <TableCell>{application.telephone}</TableCell>
                <TableCell>{application.total_area} {application.area_unit}</TableCell>
                <TableCell>
                  <Chip 
                    label={application.status} 
                    color={getStatusColor(application.status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>{new Date(application.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <IconButton color="primary" onClick={() => handleOpen(application)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton color="error" onClick={() => handleDelete(application.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
        <DialogTitle>{editingApplication ? 'Edit Finger Millet Application' : 'Add New Finger Millet Application'}</DialogTitle>
        <DialogContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
              <Tab icon={<PersonIcon />} label="Applicant Info" />
              <Tab icon={<LocationIcon />} label="Field Details" />
              <Tab icon={<FileIcon />} label="Documents" />
              <Tab icon={<AssessmentIcon />} label="Official Use" />
            </Tabs>
          </Box>

          {/* Applicant Information Tab */}
          {activeTab === 0 && (
            <Box sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="full_name"
                    label="Full Name"
                    value={formState.full_name}
                    onChange={handleChange}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="telephone"
                    label="Telephone"
                    value={formState.telephone}
                    onChange={handleChange}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    name="postal_address"
                    label="Postal Address"
                    multiline
                    rows={2}
                    value={formState.postal_address}
                    onChange={handleChange}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="email"
                    label="Email"
                    type="email"
                    value={formState.email}
                    onChange={handleChange}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="id_number"
                    label="ID Number"
                    value={formState.id_number}
                    onChange={handleChange}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="farm_name"
                    label="Farm Name"
                    value={formState.farm_name}
                    onChange={handleChange}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="lr_number"
                    label="LR Number"
                    value={formState.lr_number}
                    onChange={handleChange}
                    sx={{ mb: 2 }}
                  />
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Field Details Tab */}
          {activeTab === 1 && (
            <Box sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Field Protection</InputLabel>
                    <Select
                      name="field_protection"
                      value={formState.field_protection}
                      onChange={(e) => handleSelectChange("field_protection", e.target.value)}
                      label="Field Protection"
                    >
                      <MenuItem value="yes">Yes</MenuItem>
                      <MenuItem value="no">No</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Field Accessibility</InputLabel>
                    <Select
                      name="field_accessibility"
                      value={formState.field_accessibility}
                      onChange={(e) => handleSelectChange("field_accessibility", e.target.value)}
                      label="Field Accessibility"
                    >
                      <MenuItem value="yes">Yes</MenuItem>
                      <MenuItem value="no">No</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="responsible_name"
                    label="Responsible Person"
                    value={formState.responsible_name}
                    onChange={handleChange}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="responsible_tel"
                    label="Responsible Person Tel"
                    value={formState.responsible_tel}
                    onChange={handleChange}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Machinery Ownership</InputLabel>
                    <Select
                      name="machinery_ownership"
                      value={formState.machinery_ownership}
                      onChange={(e) => handleSelectChange("machinery_ownership", e.target.value)}
                      label="Machinery Ownership"
                    >
                      <MenuItem value="yes">Yes</MenuItem>
                      <MenuItem value="no">No</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="total_area"
                    label="Total Area"
                    type="number"
                    value={formState.total_area}
                    onChange={handleChange}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    name="finance_plan"
                    label="Finance Plan"
                    multiline
                    rows={3}
                    value={formState.finance_plan}
                    onChange={handleChange}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    name="isolation"
                    label="Isolation Commitment"
                    multiline
                    rows={3}
                    value={formState.isolation}
                    onChange={handleChange}
                    sx={{ mb: 2 }}
                  />
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Documents Tab */}
          {activeTab === 2 && (
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Document Management</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>Land Certificate</Typography>
                      <Button 
                        variant="outlined" 
                        startIcon={<DownloadIcon />}
                        onClick={() => editingApplication && handleDownload(editingApplication.id, 'land-certificate')}
                        disabled={!editingApplication}
                      >
                        Download
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>ID Copy</Typography>
                      <Button 
                        variant="outlined" 
                        startIcon={<DownloadIcon />}
                        onClick={() => editingApplication && handleDownload(editingApplication.id, 'id-copy')}
                        disabled={!editingApplication}
                      >
                        Download
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>Lease Agreement</Typography>
                      <Button 
                        variant="outlined" 
                        startIcon={<DownloadIcon />}
                        onClick={() => editingApplication && handleDownload(editingApplication.id, 'lease-agreement')}
                        disabled={!editingApplication}
                      >
                        Download
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>Farm Map</Typography>
                      <Button 
                        variant="outlined" 
                        startIcon={<DownloadIcon />}
                        onClick={() => editingApplication && handleDownload(editingApplication.id, 'farm-map')}
                        disabled={!editingApplication}
                      >
                        Download
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Official Use Tab */}
          {activeTab === 3 && (
            <Box sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    name="field_officer_remarks"
                    label="Field Officer Remarks"
                    multiline
                    rows={4}
                    value={formState.field_officer_remarks}
                    onChange={handleChange}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="evaluation_date"
                    label="Evaluation Date"
                    type="date"
                    value={formState.evaluation_date}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="officer_name"
                    label="Officer Name"
                    value={formState.officer_name}
                    onChange={handleChange}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    name="manager_remarks"
                    label="Manager Remarks"
                    multiline
                    rows={4}
                    value={formState.manager_remarks}
                    onChange={handleChange}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="manager_date"
                    label="Manager Date"
                    type="date"
                    value={formState.manager_date}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Status</InputLabel>
                    <Select
                      name="status"
                      value={formState.status}
                      onChange={(e) => handleSelectChange("status", e.target.value)}
                      label="Status"
                    >
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="under_review">Under Review</MenuItem>
                      <MenuItem value="approved">Approved</MenuItem>
                      <MenuItem value="rejected">Rejected</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          )}
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

export default FingerMilletApplicationsEditor;
