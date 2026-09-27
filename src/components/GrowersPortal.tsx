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
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Paper,
} from '@mui/material';
import {
  Agriculture as AgricultureIcon,
  Assignment as ApplicationIcon,
  Description as FormIcon,
  AttachMoney as PriceIcon,
  School as TrainingIcon,
  Support as SupportIcon,
  Timeline as GrowthIcon,
  People as GrowerIcon,
  Assessment as ReportIcon,
  Notifications as NotificationIcon,
  TrendingUp as TrendIcon,
  AccountCircle as AccountFormIcon,
  Description as UndertakingIcon,
  Description as StatementIcon,
} from '@mui/icons-material';

const GrowersPortal: React.FC = () => {
  const navigate = useNavigate();
  
  const portalSections = [
    {
      title: 'Application Forms',
      description: 'Grower registration and application forms',
      icon: <AccountFormIcon />,
      color: '#16a34a',
      path: '/account-form',
      stats: { forms: 9, applications: 156, pending: 23, approved: 133 }
    },
    {
      title: 'Planting Guides',
      description: 'Crop-specific planting and cultivation guides',
      icon: <GrowthIcon />,
      color: '#8b5cf6',
      path: '/planting-guides',
      stats: { total: 5, downloads: 234 }
    },
    {
      title: 'Producer Prices',
      description: 'Current market prices and payment information',
      icon: <PriceIcon />,
      color: '#3b82f6',
      path: '/producer-prices',
      stats: { total: 12, updated: 'Today' }
    },
    {
      title: 'Undertaking Forms',
      description: 'Grower undertaking and commitment forms',
      icon: <UndertakingIcon />,
      color: '#f59e0b',
      path: '/undertaking-forms',
      stats: { total: 8, active: 8, completed: 0 }
    },
    {
      title: 'Growers Statement',
      description: 'Grower statements and reports',
      icon: <StatementIcon />,
      color: '#ef4444',
      path: '/growers-statement',
      stats: { total: 6, participants: 450 }
    },
    {
      title: 'Training Programs',
      description: 'Farmer training and education programs',
      icon: <TrainingIcon />,
      color: '#06b6d4',
      path: '/training',
      stats: { total: 6, participants: 450 }
    },
    {
      title: 'Form Fields Management',
      description: 'Manage finger millet application form fields and configuration',
      icon: <FormIcon />,
      color: '#7c3aed',
      path: '/finger-millet-form-fields',
      stats: { total: 25, active: 20, sections: 4 }
    }
  ];

  const recentActivities = [
    { action: 'New grower application submitted', time: '2 hours ago', type: 'application' },
    { action: 'Maize seed form updated', time: '4 hours ago', type: 'form' },
    { action: 'Producer prices updated', time: '1 day ago', type: 'price' },
    { action: 'Training session completed', time: '2 days ago', type: 'training' },
    { action: 'Extension visit scheduled', time: '3 days ago', type: 'extension' },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'application': return <ApplicationIcon />;
      case 'form': return <FormIcon />;
      case 'price': return <PriceIcon />;
      case 'training': return <TrainingIcon />;
      case 'extension': return <SupportIcon />;
      default: return <NotificationIcon />;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
            <AgricultureIcon />
          </Avatar>
          Growers Portal
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage grower applications, forms, training programs, and agricultural support services
        </Typography>
      </Box>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="primary.main" gutterBottom>
              156
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Applications
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="success.main" gutterBottom>
              133
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Approved Applications
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="warning.main" gutterBottom>
              23
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Pending Review
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="info.main" gutterBottom>
              450
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Training Participants
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Portal Sections */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {portalSections.map((section, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
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
                  <Avatar sx={{ bgcolor: section.color, mr: 2 }}>
                    {section.icon}
                  </Avatar>
                  <Typography variant="h6" component="div">
                    {section.title}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {section.description}
                </Typography>
                
                
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {Object.entries(section.stats).map(([key, value]) => (
                    <Chip
                      key={key}
                      label={`${key}: ${value}`}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.75rem' }}
                    />
                  ))}
                </Box>
              </CardContent>
              <CardActions>
                <Button 
                  size="small" 
                  variant="contained"
                  onClick={() => {
                    if (section.title === 'Application Forms') {
                      navigate('/application-forms-management');
                    } else {
                      navigate(section.path);
                    }
                  }}
                  sx={{ 
                    bgcolor: section.color,
                    '&:hover': { bgcolor: section.color, opacity: 0.9 }
                  }}
                >
                  Manage
                </Button>
                <Button size="small" onClick={() => navigate(section.path)}>View Details</Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>


      {/* Recent Activities */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendIcon color="primary" />
                Recent Activities
              </Typography>
              <List>
                {recentActivities.map((activity, index) => (
                  <React.Fragment key={index}>
                    <ListItem>
                      <ListItemIcon>
                        {getActivityIcon(activity.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={activity.action}
                        secondary={activity.time}
                      />
                    </ListItem>
                    {index < recentActivities.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <GrowerIcon color="primary" />
                Quick Actions
              </Typography>
              <List>
                <ListItem>
                  <Button variant="outlined" fullWidth startIcon={<ApplicationIcon />} onClick={() => navigate('/maize-seed-form')}>Maize Seed Form
                  </Button>
                </ListItem>
                <ListItem>
                  <Button variant="outlined" fullWidth startIcon={<FormIcon />} onClick={() => navigate('/sunflower-form')}>Sunflower Form
                  </Button>
                </ListItem>
                <ListItem>
                  <Button variant="outlined" fullWidth startIcon={<PriceIcon />} onClick={() => navigate('/producer-prices')}>
                    Update Prices
                  </Button>
                </ListItem>
                <ListItem>
                  <Button variant="outlined" fullWidth startIcon={<ReportIcon />} onClick={() => navigate('/growers-statement')}>
                    Generate Report
                  </Button>
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default GrowersPortal;
