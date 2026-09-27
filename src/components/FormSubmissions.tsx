import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Breadcrumbs,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  AccountCircle as AccountFormIcon
} from '@mui/icons-material';

const FormSubmissions: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Mock submissions data
  const mockSubmissions = [
    { id: 1, submitterName: 'John Doe', email: 'john@example.com', status: 'pending', submittedAt: '2024-01-15', formId: '1' },
    { id: 2, submitterName: 'Jane Smith', email: 'jane@example.com', status: 'approved', submittedAt: '2024-01-14', formId: '1' },
    { id: 3, submitterName: 'Bob Johnson', email: 'bob@example.com', status: 'rejected', submittedAt: '2024-01-13', formId: '1' },
    { id: 4, submitterName: 'Alice Brown', email: 'alice@example.com', status: 'pending', submittedAt: '2024-01-12', formId: '1' },
    { id: 5, submitterName: 'Charlie Wilson', email: 'charlie@example.com', status: 'approved', submittedAt: '2024-01-11', formId: '1' }
  ];

  const formTitles = {
    '1': 'Maize Seed Application',
    '2': 'Sunflower Application',
    '3': 'Finger Millet Application',
    '4': 'Forage Sorghum Application',
    '5': 'Oats Seed Application',
    '6': 'Pasture Seed Application',
    '7': 'Rice Grower Application',
    '8': 'Wheat Application',
    '9': 'Soya Bean Application'
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const handleViewSubmission = (submissionId: number) => {
    navigate(`/submission-details/${submissionId}`);
  };

  const handleDownloadSubmission = (submissionId: number) => {
    // In a real app, this would download the submission
    console.log('Downloading submission:', submissionId);
    alert('Download functionality would be implemented here');
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
        <Typography color="text.primary">Form Submissions</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <Avatar sx={{ bgcolor: '#16a34a' }}>
          <AccountFormIcon />
        </Avatar>
        <Box>
          <Typography variant="h4" component="h1">
            Form Submissions
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {formTitles[id as keyof typeof formTitles] || 'Unknown Form'}
          </Typography>
        </Box>
      </Box>

      {/* Statistics */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Chip 
          label={`${mockSubmissions.length} Total Submissions`} 
          color="primary" 
          variant="outlined" 
        />
        <Chip 
          label={`${mockSubmissions.filter(s => s.status === 'pending').length} Pending`} 
          color="warning" 
          variant="outlined" 
        />
        <Chip 
          label={`${mockSubmissions.filter(s => s.status === 'approved').length} Approved`} 
          color="success" 
          variant="outlined" 
        />
        <Chip 
          label={`${mockSubmissions.filter(s => s.status === 'rejected').length} Rejected`} 
          color="error" 
          variant="outlined" 
        />
      </Box>

      {/* Submissions Table */}
      <Card>
        <CardContent>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Submitter</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Submitted At</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mockSubmissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: '#16a34a' }}>
                          {submission.submitterName.charAt(0)}
                        </Avatar>
                        {submission.submitterName}
                      </Box>
                    </TableCell>
                    <TableCell>{submission.email}</TableCell>
                    <TableCell>
                      <Chip 
                        label={submission.status} 
                        color={getStatusColor(submission.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{submission.submittedAt}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          startIcon={<ViewIcon />}
                          onClick={() => handleViewSubmission(submission.id)}
                          variant="outlined"
                        >
                          View
                        </Button>
                        <Button
                          size="small"
                          startIcon={<DownloadIcon />}
                          onClick={() => handleDownloadSubmission(submission.id)}
                          variant="outlined"
                        >
                          Download
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default FormSubmissions;
