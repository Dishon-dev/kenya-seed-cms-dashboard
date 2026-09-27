import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Avatar,
  Chip,
  Breadcrumbs,
  Link
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  AccountCircle as AccountFormIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';

const ApplicationFormsManagement: React.FC = () => {
  const navigate = useNavigate();
  
  
  // Static application forms (for other forms not yet integrated)
  const staticApplicationForms = [
    { 
      id: 1,
      title: 'Maize Seed Application', 
      path: '/maize-seed-form', 
      icon: 'Sprout',
      description: 'Application form for maize seed growers',
      status: 'active',
      submissions: 45,
      lastUpdated: '2024-01-15',
      isIntegrated: false
    },
    { 
      id: 2,
      title: 'Sunflower Application', 
      path: '/sunflower-form', 
      icon: 'Flower2',
      description: 'Application form for sunflower growers',
      status: 'active',
      submissions: 23,
      lastUpdated: '2024-01-14',
      isIntegrated: false
    },
    { 
      id: 5,
      title: 'Oats Seed Application', 
      path: '/oats-seed-form', 
      icon: 'Leaf',
      description: 'Application form for oats seed growers',
      status: 'active',
      submissions: 8,
      lastUpdated: '2024-01-11',
      isIntegrated: false
    },
    { 
      id: 6,
      title: 'Pasture Seed Application', 
      path: '/pasture-seed-form', 
      icon: 'Wheat',
      description: 'Application form for pasture seed growers',
      status: 'active',
      submissions: 15,
      lastUpdated: '2024-01-10',
      isIntegrated: false
    },
    { 
      id: 7,
      title: 'Rice Grower Application', 
      path: '/rice-grower-form', 
      icon: 'Wheat',
      description: 'Application form for rice growers',
      status: 'active',
      submissions: 32,
      lastUpdated: '2024-01-09',
      isIntegrated: false
    },
    { 
      id: 8,
      title: 'Wheat Application', 
      path: '/wheat-grower-form', 
      icon: 'Wheat',
      description: 'Application form for wheat growers',
      status: 'active',
      submissions: 28,
      lastUpdated: '2024-01-08',
      isIntegrated: false
    },
    { 
      id: 9,
      title: 'Soya Bean Application', 
      path: '/soyabean-form', 
      icon: 'Sprout',
      description: 'Application form for soya bean growers',
      status: 'active',
      submissions: 19,
      lastUpdated: '2024-01-07',
      isIntegrated: false
    }
  ];

  // Create finger millet form editor section
  const fingerMilletForm = {
    id: 3,
    title: 'Finger Millet Form Editor', 
    path: '/finger-millet-form-fields', 
    icon: 'Wheat',
    description: 'Dynamic form editor for finger millet growers',
    status: 'active',
    submissions: 0, // This is a form editor, not submissions
    lastUpdated: '2024-01-15',
    isIntegrated: true
  };

  // Create forage sorghum form editor section
  const forageSorghumForm = {
    id: 4,
    title: 'Forage Sorghum Form Editor', 
    path: '/forage-sorghum-form-fields', 
    icon: 'Sprout',
    description: 'Dynamic form editor for forage sorghum growers',
    status: 'active',
    submissions: 0, // This is a form editor, not submissions
    lastUpdated: '2024-01-15',
    isIntegrated: true
  };

  // Create maize seed form editor section
  const maizeSeedForm = {
    id: 5,
    title: 'Maize Seed Form Editor', 
    path: '/maize-seed-form-fields', 
    icon: 'Sprout',
    description: 'Dynamic form editor for maize seed growers',
    status: 'active',
    submissions: 0, // This is a form editor, not submissions
    lastUpdated: '2024-01-15',
    isIntegrated: true
  };

  const sunflowerSeedForm = {
    id: 6,
    title: 'Sunflower Seed Form Editor', 
    path: '/sunflower-seed-form-fields', 
    icon: 'Flower2',
    description: 'Dynamic form editor for sunflower seed growers',
    status: 'active',
    submissions: 0, // This is a form editor, not submissions
    lastUpdated: '2024-01-15',
    isIntegrated: true
  };

  const oatsSeedForm = {
    id: 7,
    title: 'Oats Seed Form Editor', 
    path: '/oats-seed-form-fields', 
    icon: 'Wheat',
    description: 'Dynamic form editor for oats seed growers',
    status: 'active',
    submissions: 0, // This is a form editor, not submissions
    lastUpdated: '2024-01-15',
    isIntegrated: true
  };

  const pastureSeedForm = {
    id: 8,
    title: 'Pasture Seed Form Editor', 
    path: '/pasture-seed-form-fields', 
    icon: 'Sprout',
    description: 'Dynamic form editor for pasture seed growers',
    status: 'active',
    submissions: 0, // This is a form editor, not submissions
    lastUpdated: '2024-01-15',
    isIntegrated: true
  };

  const riceSeedForm = {
    id: 9,
    title: 'Rice Seed Form Editor', 
    path: '/rice-seed-form-fields', 
    icon: 'Wheat',
    description: 'Dynamic form editor for rice seed growers',
    status: 'active',
    submissions: 0, // This is a form editor, not submissions
    lastUpdated: '2024-01-15',
    isIntegrated: true
  };

  const wheatSeedForm = {
    id: 10,
    title: 'Wheat Seed Form Editor', 
    path: '/wheat-seed-form-fields', 
    icon: 'Wheat',
    description: 'Dynamic form editor for wheat seed growers',
    status: 'active',
    submissions: 0, // This is a form editor, not submissions
    lastUpdated: '2024-01-15',
    isIntegrated: true
  };

  const soyaBeanForm = {
    id: 11,
    title: 'Soya Bean Form Editor', 
    path: '/soya-bean-form-fields', 
    icon: 'Sprout',
    description: 'Dynamic form editor for soya bean growers',
    status: 'active',
    submissions: 0, // This is a form editor, not submissions
    lastUpdated: '2024-01-15',
    isIntegrated: true
  };

  // Combine all forms
  const applicationForms = [fingerMilletForm, forageSorghumForm, maizeSeedForm, sunflowerSeedForm, oatsSeedForm, pastureSeedForm, riceSeedForm, wheatSeedForm, soyaBeanForm, ...staticApplicationForms];

  const handleFormAction = (action: string, formId: number, formPath?: string) => {
    switch (action) {
      case 'view':
        if (formPath === '/finger-millet-form-fields') {
          navigate('/finger-millet-form-fields');
        } else if (formPath === '/forage-sorghum-form-fields') {
          navigate('/forage-sorghum-form-fields');
        } else if (formPath === '/maize-seed-form-fields') {
          navigate('/maize-seed-form-fields');
        } else if (formPath === '/sunflower-seed-form-fields') {
          navigate('/sunflower-seed-form-fields');
        } else if (formPath === '/oats-seed-form-fields') {
          navigate('/oats-seed-form-fields');
        } else if (formPath === '/pasture-seed-form-fields') {
          navigate('/pasture-seed-form-fields');
        } else if (formPath === '/rice-seed-form-fields') {
          navigate('/rice-seed-form-fields');
        } else if (formPath === '/wheat-seed-form-fields') {
          navigate('/wheat-seed-form-fields');
        } else if (formPath === '/soya-bean-form-fields') {
          navigate('/soya-bean-form-fields');
        } else {
          navigate(`/form-submissions/${formId}`);
        }
        break;
      case 'edit':
        if (formPath === '/finger-millet-form-fields') {
          navigate('/finger-millet-form-fields');
        } else if (formPath === '/forage-sorghum-form-fields') {
          navigate('/forage-sorghum-form-fields');
        } else if (formPath === '/maize-seed-form-fields') {
          navigate('/maize-seed-form-fields');
        } else if (formPath === '/sunflower-seed-form-fields') {
          navigate('/sunflower-seed-form-fields');
        } else if (formPath === '/oats-seed-form-fields') {
          navigate('/oats-seed-form-fields');
        } else if (formPath === '/pasture-seed-form-fields') {
          navigate('/pasture-seed-form-fields');
        } else if (formPath === '/rice-seed-form-fields') {
          navigate('/rice-seed-form-fields');
        } else if (formPath === '/wheat-seed-form-fields') {
          navigate('/wheat-seed-form-fields');
        } else if (formPath === '/soya-bean-form-fields') {
          navigate('/soya-bean-form-fields');
        } else {
          navigate(`/edit-form/${formId}`);
        }
        break;
      case 'delete':
        if (window.confirm('Are you sure you want to delete this form?')) {
          // Handle delete logic here
          console.log('Delete form:', formId);
        }
        break;
      default:
        break;
    }
  };


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
        <Typography color="text.primary">Application Forms Management</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: '#16a34a' }}>
            <AccountFormIcon />
          </Avatar>
          <Box>
            <Typography variant="h4" component="h1">
              Application Forms Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage all grower application forms and submissions
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/create-form')}
          sx={{ 
            bgcolor: '#16a34a',
            '&:hover': { bgcolor: '#16a34a', opacity: 0.9 }
          }}
        >
          Create New Form
        </Button>
      </Box>

      {/* Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">
                {applicationForms.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Forms
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="success.main">
                {applicationForms.reduce((sum, form) => sum + form.submissions, 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Submissions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="info.main">
                {applicationForms.filter(form => form.status === 'active').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Forms
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="warning.main">
                {applicationForms.filter(form => form.status === 'draft').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Draft Forms
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>


      {/* Forms Grid */}
      <Grid container spacing={3}>
        {applicationForms.map((form) => (
          <Grid item xs={12} sm={6} md={4} key={form.id}>
            <Card 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'border-color 0.15s ease',
                '&:hover': {
                  borderColor: 'primary.main',
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h4" sx={{ mr: 2 }}>
                    {form.icon}
                  </Typography>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="div" gutterBottom>
                      {form.title}
                    </Typography>
                    <Chip 
                      label={form.status} 
                      size="small" 
                      color={form.status === 'active' ? 'success' : 'default'}
                      sx={{ mb: 1 }}
                    />
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {form.description}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  <Chip 
                    label={`${form.submissions} submissions`} 
                    size="small" 
                    variant="outlined"
                  />
                  <Chip 
                    label={`Updated ${form.lastUpdated}`} 
                    size="small" 
                    variant="outlined"
                  />
                  {form.isIntegrated && (
                    <Chip 
                      label="Integrated" 
                      size="small" 
                      color="success"
                      variant="filled"
                    />
                  )}
                </Box>
              </CardContent>
              <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
                <Button 
                  size="small" 
                  startIcon={<ViewIcon />}
                  onClick={() => handleFormAction('view', form.id, form.path)}
                >
                  {(form.path === '/finger-millet-form-fields' || form.path === '/forage-sorghum-form-fields' || form.path === '/maize-seed-form-fields' || form.path === '/sunflower-seed-form-fields' || form.path === '/oats-seed-form-fields' || form.path === '/pasture-seed-form-fields' || form.path === '/rice-seed-form-fields' || form.path === '/wheat-seed-form-fields' || form.path === '/soya-bean-form-fields') ? 'Edit Form' : form.isIntegrated ? 'Manage' : 'View'}
                </Button>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button 
                    size="small" 
                    startIcon={<EditIcon />}
                    onClick={() => handleFormAction('edit', form.id, form.path)}
                    variant="outlined"
                  >
                    {(form.path === '/finger-millet-form-fields' || form.path === '/forage-sorghum-form-fields' || form.path === '/maize-seed-form-fields' || form.path === '/sunflower-seed-form-fields' || form.path === '/oats-seed-form-fields' || form.path === '/pasture-seed-form-fields' || form.path === '/rice-seed-form-fields' || form.path === '/wheat-seed-form-fields' || form.path === '/soya-bean-form-fields') ? 'Edit Fields' : form.isIntegrated ? 'Edit Apps' : 'Edit'}
                  </Button>
                  {!form.isIntegrated && (
                    <Button 
                      size="small" 
                      startIcon={<DeleteIcon />}
                      onClick={() => handleFormAction('delete', form.id)}
                      color="error"
                      variant="outlined"
                    >
                      Delete
                    </Button>
                  )}
                </Box>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ApplicationFormsManagement;
