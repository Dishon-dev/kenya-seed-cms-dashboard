import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button, 
  TextField, 
  Typography,
  Paper,
  Alert,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Tabs,
  Tab,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
  Work as JobsIcon,
  School as InternshipsIcon,
  Assignment as AttachmentsIcon
} from '@mui/icons-material';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5001';

interface Benefit {
  title: string;
  description: string;
}

interface JobPosition {
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  deadline?: string;
  isActive?: boolean;
}

interface ApplicationStep {
  step: number;
  title: string;
  description: string;
}

interface CareersData {
  id?: number;
  pageType: string;
    title: string;
  description: string;
  benefits: Benefit[];
  positions: JobPosition[];
  applicationProcess: ApplicationStep[];
  isActive?: boolean;
  pdfFilename?: string;
  pdfSize?: number;
  hasPdf?: boolean;
}

const CAREER_TYPES = [
  { value: 'jobs', label: 'Job Applications', icon: <JobsIcon /> },
  { value: 'internships', label: 'Internships', icon: <InternshipsIcon /> },
  { value: 'attachments', label: 'Student Attachments', icon: <AttachmentsIcon /> }
];

const CareersEditor: React.FC = () => {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [currentTab, setCurrentTab] = useState(0);
  const currentType = CAREER_TYPES[currentTab].value;
  
  // State for main data
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [positions, setPositions] = useState<JobPosition[]>([]);
  const [applicationProcess, setApplicationProcess] = useState<ApplicationStep[]>([]);
  const [pdfInfo, setPdfInfo] = useState<{filename?: string; size?: number; hasPdf?: boolean}>({});
  const [isActive, setIsActive] = useState(true);
  
  // Dialog states
  const [benefitDialog, setBenefitDialog] = useState(false);
  const [positionDialog, setPositionDialog] = useState(false);
  const [stepDialog, setStepDialog] = useState(false);
  
  // Editing states
  const [editingBenefit, setEditingBenefit] = useState<Benefit | null>(null);
  const [editingPosition, setEditingPosition] = useState<JobPosition | null>(null);
  const [editingStep, setEditingStep] = useState<ApplicationStep | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Fetch careers data for current type
  const { data: careersData, isLoading, error } = useQuery({
    queryKey: ['careers', currentType],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/api/careers?type=${currentType}`);
      return response.data;
    },
    retry: 2
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: CareersData) => {
      const response = await axios.put(`${API_BASE}/api/careers`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['careers', currentType] });
      setMessage({ type: 'success', text: `${CAREER_TYPES[currentTab].label} data updated successfully!` });
      setTimeout(() => setMessage(null), 3000);
    },
    onError: (error: any) => {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to update data' });
      setTimeout(() => setMessage(null), 5000);
    }
  });

  // Initialize form data when careersData changes
  useEffect(() => {
    if (careersData) {
      setTitle(careersData.title || '');
      setDescription(careersData.description || '');
      setBenefits(careersData.benefits || []);
      // Ensure all positions have isActive field (default to true for backward compatibility)
      const positionsWithActive = (careersData.positions || []).map((pos: JobPosition) => ({
        ...pos,
        isActive: pos.isActive !== false
      }));
      setPositions(positionsWithActive);
      setApplicationProcess(careersData.applicationProcess || []);
      setIsActive(careersData.isActive !== false);
      setPdfInfo({
        filename: careersData.pdfFilename,
        size: careersData.pdfSize,
        hasPdf: careersData.hasPdf
      });
    }
  }, [careersData, currentType]);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  // Handle save
  const handleSave = () => {
    const data: CareersData = {
      pageType: currentType,
      title,
      description,
      benefits,
      positions,
      applicationProcess,
      isActive: isActive
    };
    
    updateMutation.mutate(data);
  };

  // Benefit handlers
  const handleAddBenefit = () => {
    setEditingBenefit({ title: '', description: '' });
    setEditingIndex(null);
    setBenefitDialog(true);
  };

  const handleEditBenefit = (benefit: Benefit, index: number) => {
    setEditingBenefit(benefit);
    setEditingIndex(index);
    setBenefitDialog(true);
  };

  const handleSaveBenefit = () => {
    if (!editingBenefit) return;
    
    if (editingIndex !== null) {
      const updated = [...benefits];
      updated[editingIndex] = editingBenefit;
      setBenefits(updated);
      } else {
      setBenefits([...benefits, editingBenefit]);
    }
    
    setBenefitDialog(false);
    setEditingBenefit(null);
    setEditingIndex(null);
  };

  const handleDeleteBenefit = (index: number) => {
    setBenefits(benefits.filter((_, i) => i !== index));
  };

  // Position handlers
  const handleAddPosition = () => {
    setEditingPosition({
      title: '',
      department: '',
      location: '',
      type: currentType === 'jobs' ? 'Permanent & Pensionable' : currentType === 'internships' ? '6-month Internship' : '3-month Attachment',
      description: '',
      responsibilities: [],
      requirements: [],
      isActive: true
    });
    setEditingIndex(null);
    setPositionDialog(true);
  };

  const handleEditPosition = (position: JobPosition, index: number) => {
    setEditingPosition(position);
    setEditingIndex(index);
    setPositionDialog(true);
  };

  const handleSavePosition = () => {
    if (!editingPosition) return;
    
    if (editingIndex !== null) {
      const updated = [...positions];
      updated[editingIndex] = editingPosition;
      setPositions(updated);
      } else {
      setPositions([...positions, editingPosition]);
    }
    
    setPositionDialog(false);
    setEditingPosition(null);
    setEditingIndex(null);
  };

  const handleDeletePosition = (index: number) => {
    setPositions(positions.filter((_, i) => i !== index));
  };

  // Application step handlers
  const handleAddStep = () => {
    setEditingStep({ step: applicationProcess.length + 1, title: '', description: '' });
    setEditingIndex(null);
    setStepDialog(true);
  };

  const handleEditStep = (step: ApplicationStep, index: number) => {
    setEditingStep(step);
    setEditingIndex(index);
    setStepDialog(true);
  };

  const handleSaveStep = () => {
    if (!editingStep) return;
    
    if (editingIndex !== null) {
      const updated = [...applicationProcess];
      updated[editingIndex] = editingStep;
      setApplicationProcess(updated);
    } else {
      setApplicationProcess([...applicationProcess, editingStep]);
    }
    
    setStepDialog(false);
    setEditingStep(null);
    setEditingIndex(null);
  };

  const handleDeleteStep = (index: number) => {
    setApplicationProcess(applicationProcess.filter((_, i) => i !== index));
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
        <Alert severity="error">
          Failed to load careers data. Please try again later.
        </Alert>
    );
  }

    return (
    <Box sx={{ maxWidth: 1200, margin: '0 auto', padding: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>Careers Management
      </Typography>

      {message && (
        <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      {/* Category Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={currentTab} onChange={handleTabChange} variant="fullWidth">
          {CAREER_TYPES.map((type, index) => (
            <Tab 
              key={type.value} 
              label={type.label} 
              icon={type.icon}
              iconPosition="start"
            />
          ))}
        </Tabs>
      </Paper>

      {/* Main Information */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Page Information - {CAREER_TYPES[currentTab].label}
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                color="primary"
              />
            }
            label={isActive ? "Active" : "Inactive"}
          />
        </Box>
        {!isActive && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            This application form is currently inactive. It will not be visible on the public website.
          </Alert>
        )}
                  <TextField
                    fullWidth
          label="Page Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          margin="normal"
          placeholder="e.g., Join Our Team"
        />
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
          label="Page Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          margin="normal"
          placeholder="e.g., Build a rewarding career in agriculture"
        />
        
        {/* PDF Information */}
        <Box sx={{ mt: 3, p: 2, bgcolor: '#f7f8fa', borderRadius: 1 }}>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Application Form PDF
          </Typography>
          {pdfInfo.hasPdf ? (
            <Box>
              <Typography variant="body2" color="text.secondary">
                Current PDF: <strong>{pdfInfo.filename}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Size: {pdfInfo.size ? (pdfInfo.size / 1024 / 1024).toFixed(2) + ' MB' : 'Unknown'}
              </Typography>
              <Box display="flex" gap={1} mt={2}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => window.open(`${API_BASE}/api/careers/pdf/${currentType}`, '_blank')}
                >
                  View PDF
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  component="label"
                >
                  Replace PDF
                  <input
                    type="file"
                    accept="application/pdf"
                    hidden
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const formData = new FormData();
                        formData.append('pdf', file);
                        try {
                          await axios.post(`${API_BASE}/api/careers/pdf/${currentType}`, formData, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                          });
                          setMessage({ type: 'success', text: 'PDF uploaded successfully!' });
                          queryClient.invalidateQueries({ queryKey: ['careers', currentType] });
                        } catch (error) {
                          setMessage({ type: 'error', text: 'Failed to upload PDF' });
                        }
                      }
                    }}
                  />
                </Button>
              </Box>
            </Box>
          ) : (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                No PDF uploaded yet
              </Typography>
              <Button
                variant="contained"
                size="small"
                component="label"
              >
                Upload PDF
                <input
                  type="file"
                  accept="application/pdf"
                  hidden
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const formData = new FormData();
                      formData.append('pdf', file);
                      try {
                        await axios.post(`${API_BASE}/api/careers/pdf/${currentType}`, formData, {
                          headers: { 'Content-Type': 'multipart/form-data' }
                        });
                        setMessage({ type: 'success', text: 'PDF uploaded successfully!' });
                        queryClient.invalidateQueries({ queryKey: ['careers', currentType] });
                      } catch (error) {
                        setMessage({ type: 'error', text: 'Failed to upload PDF' });
                      }
                    }
                  }}
                />
              </Button>
                          </Box>
          )}
        </Box>
      </Paper>

      {/* Benefits Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Benefits ({benefits.length})
                          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddBenefit}
          >
            Add Benefit
          </Button>
        </Box>
        
        {benefits.map((benefit, index) => (
          <Accordion key={index}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ fontWeight: 'bold' }}>{benefit.title}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography paragraph>{benefit.description}</Typography>
                          <Box display="flex" gap={1}>
                            <Button
                              size="small"
                              startIcon={<EditIcon />}
                  onClick={() => handleEditBenefit(benefit, index)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="small"
                              color="error"
                              startIcon={<DeleteIcon />}
                  onClick={() => handleDeleteBenefit(index)}
                            >
                              Delete
                            </Button>
                          </Box>
            </AccordionDetails>
          </Accordion>
        ))}
      </Paper>

      {/* Job Positions Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Open Positions ({positions.length} total, {positions.filter(p => p.isActive !== false).length} active)
          </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddPosition}
                >
                  Add Position
                </Button>
                            </Box>
        
        {positions.map((position, index) => (
          <Accordion key={index}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box display="flex" gap={1} alignItems="center" flexWrap="wrap" sx={{ width: '100%' }}>
                <Typography sx={{ fontWeight: 'bold' }}>{position.title}</Typography>
                <Chip label={position.department} size="small" />
                <Chip label={position.type} size="small" color="primary" />
                <Chip label={position.location} size="small" color="secondary" />
                <Chip 
                  label={position.isActive !== false ? 'Active' : 'Inactive'} 
                  size="small" 
                  color={position.isActive !== false ? 'success' : 'default'}
                  sx={{ ml: 'auto' }}
                />
                          </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="subtitle2" color="text.secondary">
                  Position Status
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={position.isActive !== false}
                      onChange={(e) => {
                        const updated = [...positions];
                        updated[index] = { ...updated[index], isActive: e.target.checked };
                        setPositions(updated);
                      }}
                      color="primary"
                      size="small"
                    />
                  }
                  label={position.isActive !== false ? "Active" : "Inactive"}
                />
              </Box>
              {position.isActive === false && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  This position is inactive and will not be visible on the public website.
                </Alert>
              )}
              <Typography paragraph><strong>Description:</strong> {position.description}</Typography>
              <Typography><strong>Responsibilities:</strong></Typography>
              <ul>
                {position.responsibilities.map((resp, i) => (
                  <li key={i}>{resp}</li>
                ))}
              </ul>
              <Typography><strong>Requirements:</strong></Typography>
              <ul>
                {position.requirements.map((req, i) => (
                  <li key={i}>{req}</li>
                ))}
              </ul>
              {position.deadline && (
                <Typography><strong>Deadline:</strong> {position.deadline}</Typography>
              )}
              <Box display="flex" gap={1} mt={2}>
                <Button
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => handleEditPosition(position, index)}
                >
                  Edit
                </Button>
                <Button
                  size="small"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => handleDeletePosition(index)}
                >
                  Delete
                </Button>
                        </Box>
            </AccordionDetails>
          </Accordion>
        ))}
      </Paper>

      {/* Application Process Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Application Process ({applicationProcess.length} steps)
                        </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddStep}
          >
            Add Step
          </Button>
        </Box>
        
        {applicationProcess.map((step, index) => (
          <Accordion key={index}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ fontWeight: 'bold' }}>Step {step.step}: {step.title}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography paragraph>{step.description}</Typography>
                        <Box display="flex" gap={1}>
                          <Button
                            size="small"
                            startIcon={<EditIcon />}
                  onClick={() => handleEditStep(step, index)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            startIcon={<DeleteIcon />}
                  onClick={() => handleDeleteStep(index)}
                          >
                            Delete
                          </Button>
                        </Box>
            </AccordionDetails>
          </Accordion>
        ))}
      </Paper>

        {/* Save Button */}
      <Box display="flex" justifyContent="center" mt={4}>
            <Button
              variant="contained"
              size="large"
              startIcon={<SaveIcon />}
              onClick={handleSave}
          disabled={updateMutation.isPending}
            >
          {updateMutation.isPending ? 'Saving...' : `Save ${CAREER_TYPES[currentTab].label}`}
            </Button>
          </Box>

      {/* Benefit Dialog */}
      <Dialog open={benefitDialog} onClose={() => setBenefitDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingIndex !== null ? 'Edit Benefit' : 'Add Benefit'}</DialogTitle>
        <DialogContent>
              <TextField
                fullWidth
            label="Benefit Title"
                value={editingBenefit?.title || ''}
            onChange={(e) => setEditingBenefit(prev => prev ? { ...prev, title: e.target.value } : null)}
            margin="normal"
          />
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={editingBenefit?.description || ''}
            onChange={(e) => setEditingBenefit(prev => prev ? { ...prev, description: e.target.value } : null)}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBenefitDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveBenefit} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Position Dialog */}
      <Dialog open={positionDialog} onClose={() => setPositionDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingIndex !== null ? 'Edit Position' : 'Add Position'}</DialogTitle>
        <DialogContent>
              <TextField
                fullWidth
            label="Position Title"
                value={editingPosition?.title || ''}
            onChange={(e) => setEditingPosition(prev => prev ? { ...prev, title: e.target.value } : null)}
            margin="normal"
          />
          <Box display="flex" gap={2}>
              <TextField
                fullWidth
                label="Department"
                value={editingPosition?.department || ''}
              onChange={(e) => setEditingPosition(prev => prev ? { ...prev, department: e.target.value } : null)}
              margin="normal"
            />
              <TextField
                fullWidth
                label="Location"
                value={editingPosition?.location || ''}
              onChange={(e) => setEditingPosition(prev => prev ? { ...prev, location: e.target.value } : null)}
              margin="normal"
            />
              <TextField
                fullWidth
              label="Type"
              value={editingPosition?.type || ''}
              onChange={(e) => setEditingPosition(prev => prev ? { ...prev, type: e.target.value } : null)}
              margin="normal"
            />
          </Box>
              <TextField
                fullWidth
                multiline
                rows={3}
            label="Description"
                value={editingPosition?.description || ''}
            onChange={(e) => setEditingPosition(prev => prev ? { ...prev, description: e.target.value } : null)}
            margin="normal"
          />
                <TextField
                  fullWidth
            multiline
            rows={4}
            label="Responsibilities (one per line)"
            value={editingPosition?.responsibilities.join('\n') || ''}
            onChange={(e) => setEditingPosition(prev => prev ? { ...prev, responsibilities: e.target.value.split('\n').filter(Boolean) } : null)}
            margin="normal"
          />
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Requirements (one per line)"
            value={editingPosition?.requirements.join('\n') || ''}
            onChange={(e) => setEditingPosition(prev => prev ? { ...prev, requirements: e.target.value.split('\n').filter(Boolean) } : null)}
            margin="normal"
          />
          <TextField
            fullWidth
            type="date"
            label="Application Deadline"
            value={editingPosition?.deadline || ''}
            onChange={(e) => setEditingPosition(prev => prev ? { ...prev, deadline: e.target.value } : null)}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <Box mt={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={editingPosition?.isActive !== false}
                  onChange={(e) => setEditingPosition(prev => prev ? { ...prev, isActive: e.target.checked } : null)}
                  color="primary"
                />
              }
              label="Position Active"
            />
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
              Inactive positions will not be visible on the public website
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPositionDialog(false)}>Cancel</Button>
          <Button onClick={handleSavePosition} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Application Step Dialog */}
      <Dialog open={stepDialog} onClose={() => setStepDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingIndex !== null ? 'Edit Step' : 'Add Step'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            type="number"
            label="Step Number"
            value={editingStep?.step || 1}
            onChange={(e) => setEditingStep(prev => prev ? { ...prev, step: parseInt(e.target.value) } : null)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Step Title"
            value={editingStep?.title || ''}
            onChange={(e) => setEditingStep(prev => prev ? { ...prev, title: e.target.value } : null)}
            margin="normal"
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Description"
            value={editingStep?.description || ''}
            onChange={(e) => setEditingStep(prev => prev ? { ...prev, description: e.target.value } : null)}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStepDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveStep} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CareersEditor;
