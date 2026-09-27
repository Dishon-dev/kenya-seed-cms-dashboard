import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Grid,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  Remove as RemoveIcon,
  QuestionAnswer as QuestionIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5001';

interface SurveyQuestion {
  id?: string | number;
  question: string;
  type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox';
  required: boolean;
  placeholder?: string;
  options?: string[];
  order: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface SurveyData {
  id?: string | number;
  title: string;
  subtitle?: string;
  logo: string;
  companyName: string;
  companySubtitle: string;
  formAction: string;
  nextUrl: string;
  questions: SurveyQuestion[];
  isActive: boolean;
  order: number;
  popup: {
    enabled: boolean;
    delay: number;
    title: string;
    message: string;
    buttonText: string;
    dismissText: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

const SurveyManagement: React.FC = () => {
  const [surveyData, setSurveyData] = useState<SurveyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingSurvey, setEditingSurvey] = useState<Partial<SurveyData>>({});
  const [newQuestion, setNewQuestion] = useState<Partial<SurveyQuestion>>({});
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const queryClient = useQueryClient();

  // Fetch survey data
  const { data: surveyResponse, isPending, error: fetchError } = useQuery({
    queryKey: ['survey'],
    queryFn: async () => {
      try {
        const response = await axios.get(`${API_BASE}/api/survey`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        return response.data;
      } catch (err) {
        console.error('Error fetching survey data:', err);
        throw err;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    retry: 1,
  });

  useEffect(() => {
    if (surveyResponse) {
      setSurveyData(surveyResponse);
      setLoading(false);
    }
  }, [surveyResponse]);

  // Save survey mutation
  const saveSurveyMutation = useMutation({
    mutationFn: async (data: SurveyData) => {
      const response = await axios.post(`${API_BASE}/api/survey`, data, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['survey'] });
      setEditDialogOpen(false);
    },
    onError: (error: any) => {
      console.error('Error saving survey:', error);
      setError('Failed to save survey data');
    }
  });

  const handleEdit = () => {
    if (surveyData) {
      setEditingSurvey(surveyData);
      setEditDialogOpen(true);
    }
  };

  const handleSave = async () => {
    try {
      await saveSurveyMutation.mutateAsync(editingSurvey as SurveyData);
    } catch (err) {
      console.error('Error saving survey:', err);
    }
  };

  const handleDelete = async () => {
    if (surveyData?.id && window.confirm('Are you sure you want to delete this survey?')) {
      try {
        await axios.delete(`${API_BASE}/api/survey/${surveyData.id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        queryClient.invalidateQueries({ queryKey: ['survey'] });
      } catch (err) {
        console.error('Error deleting survey:', err);
        setError('Failed to delete survey');
      }
    }
  };

  const addQuestion = () => {
    if (!editingSurvey.questions) {
      setEditingSurvey({ ...editingSurvey, questions: [] });
    }
    const newQuestionData: SurveyQuestion = {
      id: `new-${Date.now()}`,
      question: newQuestion.question || '',
      type: newQuestion.type || 'text',
      required: newQuestion.required || false,
      placeholder: newQuestion.placeholder || '',
      options: newQuestion.options || [],
      order: editingSurvey.questions?.length || 0,
      isActive: true,
    };
    setEditingSurvey({
      ...editingSurvey,
      questions: [...(editingSurvey.questions || []), newQuestionData]
    });
    setNewQuestion({});
    setIsAddingQuestion(false);
  };

  const updateQuestion = (index: number, field: keyof SurveyQuestion, value: any) => {
    if (!editingSurvey.questions) return;
    const updatedQuestions = [...editingSurvey.questions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    setEditingSurvey({ ...editingSurvey, questions: updatedQuestions });
  };

  const deleteQuestion = (index: number) => {
    if (!editingSurvey.questions) return;
    const updatedQuestions = editingSurvey.questions.filter((_, i) => i !== index);
    setEditingSurvey({ ...editingSurvey, questions: updatedQuestions });
  };

  const addQuestionOption = (questionIndex: number) => {
    if (!editingSurvey.questions) return;
    const updatedQuestions = [...editingSurvey.questions];
    const question = updatedQuestions[questionIndex];
    const options = question.options || [];
    options.push('');
    updatedQuestions[questionIndex] = { ...question, options };
    setEditingSurvey({ ...editingSurvey, questions: updatedQuestions });
  };

  const updateQuestionOption = (questionIndex: number, optionIndex: number, value: string) => {
    if (!editingSurvey.questions) return;
    const updatedQuestions = [...editingSurvey.questions];
    const question = updatedQuestions[questionIndex];
    const options = [...(question.options || [])];
    options[optionIndex] = value;
    updatedQuestions[questionIndex] = { ...question, options };
    setEditingSurvey({ ...editingSurvey, questions: updatedQuestions });
  };

  const removeQuestionOption = (questionIndex: number, optionIndex: number) => {
    if (!editingSurvey.questions) return;
    const updatedQuestions = [...editingSurvey.questions];
    const question = updatedQuestions[questionIndex];
    const options = question.options?.filter((_, i) => i !== optionIndex) || [];
    updatedQuestions[questionIndex] = { ...question, options };
    setEditingSurvey({ ...editingSurvey, questions: updatedQuestions });
  };

  if (isPending || loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  if (fetchError || error) {
    return <Alert severity="error">Failed to load survey data. Please try again.</Alert>;
  }

  if (!surveyData) {
    return <Alert severity="info">No survey data found. Please contact your administrator.</Alert>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Survey Management</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage your customer satisfaction survey including questions, branding, and form settings.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Button
        variant="contained"
        startIcon={<EditIcon />}
        onClick={handleEdit}
        sx={{ mb: 3 }}
      >
        Edit Survey
      </Button>

      <Button
        variant="outlined"
        color="error"
        startIcon={<DeleteIcon />}
        onClick={handleDelete}
        sx={{ mb: 3, ml: 2 }}
      >
        Delete Survey
      </Button>

      {/* Survey Preview */}
      <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>Live Preview - This is how your survey appears to visitors
      </Typography>
      
      <Paper sx={{ p: 3, bgcolor: '#f0fdf4', maxHeight: '600px', overflow: 'auto' }}>
        <div className="w-full max-w-2xl mx-auto px-4 py-8">
          {/* Logo + Company Name */}
          <div className="flex flex-col items-center mb-6">
            <img 
              src={surveyData.logo} 
              alt="Kenya Seed Logo" 
              className="h-16 mb-2"
              onError={(e) => {
                e.currentTarget.src = '/api/images/survey/placeholder.svg';
              }}
            />
            <div className="text-center">
              <h1 className="text-xl font-bold text-[#15803d]">{surveyData.companyName}</h1>
              <p className="text-sm text-gray-600">{surveyData.companySubtitle}</p>
            </div>
          </div>

          {/* Survey Title */}
          <h2 className="text-2xl font-bold mb-6 text-center text-green-800">
            {surveyData.title}
          </h2>

          <form
            action={surveyData.formAction}
            method="POST"
            className="space-y-6"
          >
            {surveyData.questions
              ?.filter(q => q.isActive)
              .sort((a, b) => a.order - b.order)
              .map((question, index) => (
                <div key={question.id || index} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {question.question}
                    {question.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  
                  {question.type === 'text' && (
                    <input
                      type="text"
                      placeholder={question.placeholder}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      required={question.required}
                    />
                  )}
                  
                  {question.type === 'textarea' && (
                    <textarea
                      placeholder={question.placeholder}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      required={question.required}
                    />
                  )}
                  
                  {question.type === 'select' && question.options && (
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      required={question.required}
                    >
                      <option value="">Select an option</option>
                      {question.options.map((option, optIndex) => (
                        <option key={optIndex} value={option}>{option}</option>
                      ))}
                    </select>
                  )}
                  
                  {question.type === 'radio' && question.options && (
                    <div className="space-y-2">
                      {question.options.map((option, optIndex) => (
                        <label key={optIndex} className="flex items-center">
                          <input
                            type="radio"
                            name={`question_${question.id}`}
                            value={option}
                            className="mr-2"
                            required={question.required}
                          />
                          {option}
                        </label>
                      ))}
                    </div>
                  )}
                  
                  {question.type === 'checkbox' && question.options && (
                    <div className="space-y-2">
                      {question.options.map((option, optIndex) => (
                        <label key={optIndex} className="flex items-center">
                          <input
                            type="checkbox"
                            name={`question_${question.id}[]`}
                            value={option}
                            className="mr-2"
                          />
                          {option}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            
            <div className="flex justify-between pt-6">
              <button
                type="button"
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Submit Survey
              </button>
            </div>
          </form>
        </div>
      </Paper>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Edit Survey</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Survey Configuration</Typography>
              <TextField
                fullWidth
                label="Survey Title"
                value={editingSurvey.title || ''}
                onChange={(e) => setEditingSurvey({ ...editingSurvey, title: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Company Name"
                value={editingSurvey.companyName || ''}
                onChange={(e) => setEditingSurvey({ ...editingSurvey, companyName: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Company Subtitle"
                value={editingSurvey.companySubtitle || ''}
                onChange={(e) => setEditingSurvey({ ...editingSurvey, companySubtitle: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Form Action URL"
                value={editingSurvey.formAction || ''}
                onChange={(e) => setEditingSurvey({ ...editingSurvey, formAction: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Next URL"
                value={editingSurvey.nextUrl || ''}
                onChange={(e) => setEditingSurvey({ ...editingSurvey, nextUrl: e.target.value })}
                sx={{ mb: 2 }}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Popup Configuration</Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={editingSurvey.popup?.enabled || false}
                    onChange={(e) => setEditingSurvey({
                      ...editingSurvey,
                      popup: { ...editingSurvey.popup!, enabled: e.target.checked }
                    })}
                  />
                }
                label="Enable Popup"
                sx={{ mb: 2 }}
              />
              {editingSurvey.popup?.enabled && (
                <>
                  <TextField
                    fullWidth
                    label="Popup Title"
                    value={editingSurvey.popup.title || ''}
                    onChange={(e) => setEditingSurvey({
                      ...editingSurvey,
                      popup: { ...editingSurvey.popup!, title: e.target.value }
                    })}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Popup Message"
                    value={editingSurvey.popup.message || ''}
                    onChange={(e) => setEditingSurvey({
                      ...editingSurvey,
                      popup: { ...editingSurvey.popup!, message: e.target.value }
                    })}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Button Text"
                    value={editingSurvey.popup.buttonText || ''}
                    onChange={(e) => setEditingSurvey({
                      ...editingSurvey,
                      popup: { ...editingSurvey.popup!, buttonText: e.target.value }
                    })}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Dismiss Text"
                    value={editingSurvey.popup.dismissText || ''}
                    onChange={(e) => setEditingSurvey({
                      ...editingSurvey,
                      popup: { ...editingSurvey.popup!, dismissText: e.target.value }
                    })}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Delay (milliseconds)"
                    type="number"
                    value={editingSurvey.popup.delay || 2000}
                    onChange={(e) => setEditingSurvey({
                      ...editingSurvey,
                      popup: { ...editingSurvey.popup!, delay: parseInt(e.target.value) || 2000 }
                    })}
                    sx={{ mb: 2 }}
                  />
                </>
              )}
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Survey Questions</Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => setIsAddingQuestion(true)}
                sx={{ mb: 2 }}
              >
                Add Question
              </Button>

              {isAddingQuestion && (
                <Card sx={{ mb: 2, p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>Add New Question</Typography>
                  <TextField
                    fullWidth
                    label="Question"
                    value={newQuestion.question || ''}
                    onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                    sx={{ mb: 2 }}
                  />
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Question Type</InputLabel>
                    <Select
                      value={newQuestion.type || 'text'}
                      onChange={(e) => setNewQuestion({ ...newQuestion, type: e.target.value as any })}
                    >
                      <MenuItem value="text">Text Input</MenuItem>
                      <MenuItem value="textarea">Textarea</MenuItem>
                      <MenuItem value="select">Select Dropdown</MenuItem>
                      <MenuItem value="radio">Radio Buttons</MenuItem>
                      <MenuItem value="checkbox">Checkboxes</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    fullWidth
                    label="Placeholder"
                    value={newQuestion.placeholder || ''}
                    onChange={(e) => setNewQuestion({ ...newQuestion, placeholder: e.target.value })}
                    sx={{ mb: 2 }}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={newQuestion.required || false}
                        onChange={(e) => setNewQuestion({ ...newQuestion, required: e.target.checked })}
                      />
                    }
                    label="Required"
                    sx={{ mb: 2 }}
                  />
                  <div>
                    <Button onClick={addQuestion} variant="contained" sx={{ mr: 1 }}>
                      Add Question
                    </Button>
                    <Button onClick={() => setIsAddingQuestion(false)}>
                      Cancel
                    </Button>
                  </div>
                </Card>
              )}

              {editingSurvey.questions?.map((question, index) => (
                <Accordion key={question.id || index} sx={{ mb: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1">
                      {question.question || `Question ${index + 1}`}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Question"
                          value={question.question}
                          onChange={(e) => updateQuestion(index, 'question', e.target.value)}
                          sx={{ mb: 2 }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <FormControl fullWidth sx={{ mb: 2 }}>
                          <InputLabel>Type</InputLabel>
                          <Select
                            value={question.type}
                            onChange={(e) => updateQuestion(index, 'type', e.target.value)}
                          >
                            <MenuItem value="text">Text Input</MenuItem>
                            <MenuItem value="textarea">Textarea</MenuItem>
                            <MenuItem value="select">Select Dropdown</MenuItem>
                            <MenuItem value="radio">Radio Buttons</MenuItem>
                            <MenuItem value="checkbox">Checkboxes</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Order"
                          type="number"
                          value={question.order}
                          onChange={(e) => updateQuestion(index, 'order', parseInt(e.target.value) || 0)}
                          sx={{ mb: 2 }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Placeholder"
                          value={question.placeholder || ''}
                          onChange={(e) => updateQuestion(index, 'placeholder', e.target.value)}
                          sx={{ mb: 2 }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={question.required}
                              onChange={(e) => updateQuestion(index, 'required', e.target.checked)}
                            />
                          }
                          label="Required"
                          sx={{ mb: 2 }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={question.isActive}
                              onChange={(e) => updateQuestion(index, 'isActive', e.target.checked)}
                            />
                          }
                          label="Active"
                          sx={{ mb: 2 }}
                        />
                      </Grid>
                      {(question.type === 'select' || question.type === 'radio' || question.type === 'checkbox') && (
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" gutterBottom>Options</Typography>
                          {question.options?.map((option, optIndex) => (
                            <div key={optIndex} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                              <TextField
                                fullWidth
                                value={option}
                                onChange={(e) => updateQuestionOption(index, optIndex, e.target.value)}
                                size="small"
                              />
                              <IconButton
                                onClick={() => removeQuestionOption(index, optIndex)}
                                color="error"
                                size="small"
                              >
                                <RemoveIcon />
                              </IconButton>
                            </div>
                          ))}
                          <Button
                            onClick={() => addQuestionOption(index)}
                            startIcon={<AddIcon />}
                            size="small"
                          >
                            Add Option
                          </Button>
                        </Grid>
                      )}
                      <Grid item xs={12}>
                        <Button
                          onClick={() => deleteQuestion(index)}
                          color="error"
                          startIcon={<DeleteIcon />}
                        >
                          Delete Question
                        </Button>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            disabled={saveSurveyMutation.isPending}
            startIcon={<SaveIcon />}
          >
            {saveSurveyMutation.isPending ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SurveyManagement;
