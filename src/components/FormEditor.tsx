import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Breadcrumbs,
  Link,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Avatar
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  AccountCircle as AccountFormIcon
} from '@mui/icons-material';

const FormEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'active',
    fields: []
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Mock form data - in a real app, this would come from an API
  const mockForms = {
    '1': { title: 'Maize Seed Application', description: 'Application form for maize seed growers', status: 'active', fields: [] },
    '2': { title: 'Sunflower Application', description: 'Application form for sunflower growers', status: 'active', fields: [] },
    '3': { title: 'Finger Millet Application', description: 'Application form for finger millet growers', status: 'active', fields: [] },
    '4': { title: 'Forage Sorghum Application', description: 'Application form for forage sorghum growers', status: 'active', fields: [] },
    '5': { title: 'Oats Seed Application', description: 'Application form for oats seed growers', status: 'active', fields: [] },
    '6': { title: 'Pasture Seed Application', description: 'Application form for pasture seed growers', status: 'active', fields: [] },
    '7': { title: 'Rice Grower Application', description: 'Application form for rice growers', status: 'active', fields: [] },
    '8': { title: 'Wheat Application', description: 'Application form for wheat growers', status: 'active', fields: [] },
    '9': { title: 'Soya Bean Application', description: 'Application form for soya bean growers', status: 'active', fields: [] }
  };

  useEffect(() => {
    if (id && mockForms[id as keyof typeof mockForms]) {
      setFormData(mockForms[id as keyof typeof mockForms]);
    }
  }, [id]);

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleStatusChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      status: event.target.checked ? 'active' : 'draft'
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Saving form:', formData);
      // In a real app, you would make an API call here
      alert('Form saved successfully!');
      navigate('/application-forms-management');
    } catch (error) {
      console.error('Error saving form:', error);
      alert('Error saving form. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/application-forms-management');
  };

  if (!id || !mockForms[id as keyof typeof mockForms]) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Form not found. Please check the form ID and try again.
        </Alert>
        <Button 
          variant="contained" 
          onClick={() => navigate('/application-forms-management')}
          sx={{ mt: 2 }}
        >
          Back to Forms Management
        </Button>
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
        <Link 
          color="inherit" 
          href="#" 
          onClick={(e) => {
            e.preventDefault();
            navigate('/application-forms-management');
          }}
        >
          Application Forms Management
        </Link>
        <Typography color="text.primary">Edit Form</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <Avatar sx={{ bgcolor: '#16a34a' }}>
          <AccountFormIcon />
        </Avatar>
        <Box>
          <Typography variant="h4" component="h1">
            Edit Form
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Modify form settings and configuration
          </Typography>
        </Box>
      </Box>

      {/* Form Editor */}
      <Card>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Form Title"
                value={formData.title}
                onChange={handleInputChange('title')}
                variant="outlined"
                sx={{ mb: 3 }}
              />
              
              <TextField
                fullWidth
                label="Form Description"
                value={formData.description}
                onChange={handleInputChange('description')}
                variant="outlined"
                multiline
                rows={4}
                sx={{ mb: 3 }}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Form Settings
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.status === 'active'}
                        onChange={handleStatusChange}
                        color="primary"
                      />
                    }
                    label={formData.status === 'active' ? 'Active' : 'Draft'}
                    sx={{ mb: 2 }}
                  />
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Form ID: {id}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary">
                    Last Modified: {new Date().toLocaleDateString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          startIcon={<CancelIcon />}
          onClick={handleCancel}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={saving}
          sx={{ 
            bgcolor: '#16a34a',
            '&:hover': { bgcolor: '#16a34a', opacity: 0.9 }
          }}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </Box>
    </Box>
  );
};

export default FormEditor;
