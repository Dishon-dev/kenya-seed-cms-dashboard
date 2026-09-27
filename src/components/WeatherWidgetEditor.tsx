import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Switch,
  FormControlLabel,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Snackbar,
  Alert,
  CircularProgress,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Slider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  Cloud as CloudIcon,
  LocationOn as LocationIcon,
  Settings as SettingsIcon,
  Palette as PaletteIcon,
  WbSunny as SunIcon,
  AcUnit as SnowIcon,
  Thunderstorm as StormIcon,
  Water as RainIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE = `${process.env.REACT_APP_API_BASE || 'http://localhost:5001'}/api`;

// Types
interface City {
  id: string;
  name: string;
  country: string;
  isDefault: boolean;
  order: number;
}

interface WeatherWidgetConfig {
  title: string;
  placeholder: string;
  buttonText: string;
  autoDetectLocation: boolean;
  units: string;
  showWindSpeed: boolean;
  showDate: boolean;
  showCountry: boolean;
}

interface WeatherWidgetStyling {
  backgroundColor: string;
  widgetBackgroundColor: string;
  primaryColor: string;
  textColor: string;
  borderRadius: string;
  padding: string;
  maxWidth: string;
  boxShadow: string;
}

interface WeatherWidgetApiSettings {
  provider: string;
  apiKey: string;
  baseUrl: string;
  iconBaseUrl: string;
  timeout: number;
}

interface WeatherWidgetData {
  id: string;
  config: WeatherWidgetConfig;
  styling: WeatherWidgetStyling;
  defaultCities: City[];
  apiSettings: WeatherWidgetApiSettings;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

const WeatherWidgetEditor: React.FC = () => {
  const [weatherWidgetData, setWeatherWidgetData] = useState<WeatherWidgetData | null>(null);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [isCityDialogOpen, setIsCityDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'city', id: string } | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [newCity, setNewCity] = useState({ name: '', country: 'Kenya' });

  const queryClient = useQueryClient();

  // Local storage functions
  const saveWeatherWidgetToStorage = useCallback((data: WeatherWidgetData) => {
    try {
      localStorage.setItem('weatherWidgetData', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving weather widget to storage:', error);
    }
  }, []);

  const loadWeatherWidgetFromStorage = useCallback((): WeatherWidgetData | null => {
    try {
      const stored = localStorage.getItem('weatherWidgetData');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error loading weather widget from storage:', error);
      return null;
    }
  }, []);

  // Fetch weather widget data
  const { data: fetchedData, isLoading, error } = useQuery({
    queryKey: ['weather-widget'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/weather-widget`);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update weather widget data mutation
  const updateWeatherWidgetMutation = useMutation({
    mutationFn: async (data: Partial<WeatherWidgetData>) => {
      const response = await axios.post(`${API_BASE}/weather-widget`, data);
      return response.data;
    },
    onSuccess: (data) => {
      setWeatherWidgetData(data.data);
      saveWeatherWidgetToStorage(data.data);
      queryClient.invalidateQueries({ queryKey: ['weather-widget'] });
      setMessage({ type: 'success', text: 'Weather Widget updated successfully!' });
    },
    onError: (error: any) => {
      console.error('Error updating weather widget:', error);
      setMessage({ type: 'error', text: 'Failed to update weather widget. Please try again.' });
    }
  });

  // Add city mutation
  const addCityMutation = useMutation({
    mutationFn: async (city: Omit<City, 'id' | 'order'>) => {
      const response = await axios.post(`${API_BASE}/weather-widget/cities`, city);
      return response.data;
    },
    onSuccess: (data) => {
      setWeatherWidgetData(data.data);
      saveWeatherWidgetToStorage(data.data);
      queryClient.invalidateQueries({ queryKey: ['weather-widget'] });
      setMessage({ type: 'success', text: 'City added successfully!' });
      setIsCityDialogOpen(false);
      setEditingCity(null);
      setNewCity({ name: '', country: 'Kenya' });
    },
    onError: (error: any) => {
      console.error('Error adding city:', error);
      setMessage({ type: 'error', text: 'Failed to add city. Please try again.' });
    }
  });

  // Update city mutation
  const updateCityMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: Partial<City> }) => {
      const response = await axios.put(`${API_BASE}/weather-widget/cities/${id}`, updates);
      return response.data;
    },
    onSuccess: (data) => {
      setWeatherWidgetData(data.data);
      saveWeatherWidgetToStorage(data.data);
      queryClient.invalidateQueries({ queryKey: ['weather-widget'] });
      setMessage({ type: 'success', text: 'City updated successfully!' });
      setIsCityDialogOpen(false);
      setEditingCity(null);
    },
    onError: (error: any) => {
      console.error('Error updating city:', error);
      setMessage({ type: 'error', text: 'Failed to update city. Please try again.' });
    }
  });

  // Delete city mutation
  const deleteCityMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.delete(`${API_BASE}/weather-widget/cities/${id}`);
      return response.data;
    },
    onSuccess: (data) => {
      setWeatherWidgetData(data.data);
      saveWeatherWidgetToStorage(data.data);
      queryClient.invalidateQueries({ queryKey: ['weather-widget'] });
      setMessage({ type: 'success', text: 'City deleted successfully!' });
      setDeleteConfirm(null);
    },
    onError: (error: any) => {
      console.error('Error deleting city:', error);
      setMessage({ type: 'error', text: 'Failed to delete city. Please try again.' });
    }
  });

  // Set weather widget data from fetched data
  useEffect(() => {
    if (fetchedData) {
      setWeatherWidgetData(fetchedData);
      saveWeatherWidgetToStorage(fetchedData);
    } else {
      // Try to load from local storage as fallback
      const storedData = loadWeatherWidgetFromStorage();
      if (storedData) {
        setWeatherWidgetData(storedData);
      }
    }
  }, [fetchedData, saveWeatherWidgetToStorage, loadWeatherWidgetFromStorage]);

  // Handle save
  const handleSave = () => {
    if (weatherWidgetData) {
      updateWeatherWidgetMutation.mutate(weatherWidgetData);
    }
  };

  // Handle add city
  const handleAddCity = () => {
    setEditingCity({
      id: '',
      name: '',
      country: 'Kenya',
      isDefault: false,
      order: 0
    });
    setIsCityDialogOpen(true);
  };

  // Handle edit city
  const handleEditCity = (city: City) => {
    setEditingCity({ ...city });
    setIsCityDialogOpen(true);
  };

  // Handle save city
  const handleSaveCity = () => {
    if (editingCity) {
      if (editingCity.id) {
        updateCityMutation.mutate({ id: editingCity.id, updates: editingCity });
      } else {
        addCityMutation.mutate(editingCity);
      }
    }
  };

  // Handle add new city from form
  const handleAddNewCity = () => {
    if (newCity.name.trim()) {
      addCityMutation.mutate({
        name: newCity.name.trim(),
        country: newCity.country.trim() || 'Kenya',
        isDefault: false
      });
    }
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
          Failed to load weather widget data. Please try again later.
        </Alert>
      </Box>
    );
  }

  if (!weatherWidgetData) {
    return (
      <Box p={3}>
        <Alert severity="info">
          No weather widget data available.
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, color: 'primary.main', fontWeight: 'bold' }}>Weather Widget Management
      </Typography>

      {/* Live Preview */}
      <Paper sx={{ p: 3, mb: 4, bgcolor: '#f7f8fa' }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 3, color: 'primary.main', fontWeight: 'bold' }}>
          Live Preview - This is how your weather widget appears to visitors
        </Typography>
        
        <div 
          style={{ 
            backgroundColor: weatherWidgetData.styling.backgroundColor,
            minHeight: '400px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '1rem'
          }}
        >
          <div
            style={{
              backgroundColor: weatherWidgetData.styling.widgetBackgroundColor,
              borderRadius: weatherWidgetData.styling.borderRadius,
              padding: weatherWidgetData.styling.padding,
              width: '100%',
              maxWidth: weatherWidgetData.styling.maxWidth,
              boxShadow: weatherWidgetData.styling.boxShadow,
              textAlign: 'center',
              fontFamily: 'Segoe UI, sans-serif'
            }}
          >
            <h2 style={{ 
              fontSize: '1.2rem', 
              fontWeight: 'bold', 
              color: weatherWidgetData.styling.primaryColor, 
              marginBottom: '0.75rem' 
            }}>
              {weatherWidgetData.config.title}
            </h2>
            
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <input
                type="text"
                placeholder={weatherWidgetData.config.placeholder}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  border: `2px solid ${weatherWidgetData.styling.primaryColor}`,
                  borderRadius: '8px',
                  fontSize: '1rem',
                  backgroundColor: '#fff'
                }}
              />
              <button
                style={{
                  backgroundColor: weatherWidgetData.styling.primaryColor,
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                {weatherWidgetData.config.buttonText}
              </button>
            </div>

            {/* Mock weather display */}
            <div style={{ marginTop: '1rem' }}>
              <h3 style={{ 
                fontSize: '1.1rem', 
                fontWeight: 'bold', 
                color: weatherWidgetData.styling.primaryColor, 
                marginBottom: '0.25rem' 
              }}>
                Nairobi, Kenya
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#555', marginBottom: '0.75rem' }}>
                {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  backgroundColor: '#87CEEB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem'
                }}></div>
              </div>
              
              <div style={{ 
                fontSize: '2rem', 
                fontWeight: 'bold', 
                color: weatherWidgetData.styling.textColor,
                marginBottom: '0.5rem'
              }}>
                25<span style={{ fontSize: '1.2rem', verticalAlign: 'super' }}>°C</span>
              </div>
              
              <p style={{ 
                fontSize: '0.9rem', 
                fontWeight: '600', 
                color: '#444', 
                textTransform: 'uppercase',
                marginBottom: '0.5rem'
              }}>
                Sunny
              </p>
              
              {weatherWidgetData.config.showWindSpeed && (
                <p style={{ fontSize: '0.85rem', color: '#666' }}>
                  Wind Speed: 5.2 m/s
                </p>
              )}
            </div>
          </div>
        </div>
      </Paper>

      {/* Management Controls */}
      <Grid container spacing={3}>
        {/* Configuration Management */}
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Widget Configuration" />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Title"
                    value={weatherWidgetData.config.title}
                    onChange={(e) => setWeatherWidgetData({
                      ...weatherWidgetData,
                      config: { ...weatherWidgetData.config, title: e.target.value }
                    })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Placeholder Text"
                    value={weatherWidgetData.config.placeholder}
                    onChange={(e) => setWeatherWidgetData({
                      ...weatherWidgetData,
                      config: { ...weatherWidgetData.config, placeholder: e.target.value }
                    })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Button Text"
                    value={weatherWidgetData.config.buttonText}
                    onChange={(e) => setWeatherWidgetData({
                      ...weatherWidgetData,
                      config: { ...weatherWidgetData.config, buttonText: e.target.value }
                    })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Units</InputLabel>
                    <Select
                      value={weatherWidgetData.config.units}
                      onChange={(e) => setWeatherWidgetData({
                        ...weatherWidgetData,
                        config: { ...weatherWidgetData.config, units: e.target.value }
                      })}
                    >
                      <MenuItem value="metric">Metric (°C)</MenuItem>
                      <MenuItem value="imperial">Imperial (°F)</MenuItem>
                      <MenuItem value="kelvin">Kelvin (K)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Display Options
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={weatherWidgetData.config.autoDetectLocation}
                            onChange={(e) => setWeatherWidgetData({
                              ...weatherWidgetData,
                              config: { ...weatherWidgetData.config, autoDetectLocation: e.target.checked }
                            })}
                          />
                        }
                        label="Auto-detect Location"
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={weatherWidgetData.config.showWindSpeed}
                            onChange={(e) => setWeatherWidgetData({
                              ...weatherWidgetData,
                              config: { ...weatherWidgetData.config, showWindSpeed: e.target.checked }
                            })}
                          />
                        }
                        label="Show Wind Speed"
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={weatherWidgetData.config.showDate}
                            onChange={(e) => setWeatherWidgetData({
                              ...weatherWidgetData,
                              config: { ...weatherWidgetData.config, showDate: e.target.checked }
                            })}
                          />
                        }
                        label="Show Date"
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={weatherWidgetData.config.showCountry}
                            onChange={(e) => setWeatherWidgetData({
                              ...weatherWidgetData,
                              config: { ...weatherWidgetData.config, showCountry: e.target.checked }
                            })}
                          />
                        }
                        label="Show Country"
                      />
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Styling Management */}
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Widget Styling" />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Background Color"
                    type="color"
                    value={weatherWidgetData.styling.backgroundColor}
                    onChange={(e) => setWeatherWidgetData({
                      ...weatherWidgetData,
                      styling: { ...weatherWidgetData.styling, backgroundColor: e.target.value }
                    })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Widget Background Color"
                    type="color"
                    value={weatherWidgetData.styling.widgetBackgroundColor}
                    onChange={(e) => setWeatherWidgetData({
                      ...weatherWidgetData,
                      styling: { ...weatherWidgetData.styling, widgetBackgroundColor: e.target.value }
                    })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Primary Color"
                    type="color"
                    value={weatherWidgetData.styling.primaryColor}
                    onChange={(e) => setWeatherWidgetData({
                      ...weatherWidgetData,
                      styling: { ...weatherWidgetData.styling, primaryColor: e.target.value }
                    })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Text Color"
                    type="color"
                    value={weatherWidgetData.styling.textColor}
                    onChange={(e) => setWeatherWidgetData({
                      ...weatherWidgetData,
                      styling: { ...weatherWidgetData.styling, textColor: e.target.value }
                    })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Border Radius"
                    value={weatherWidgetData.styling.borderRadius}
                    onChange={(e) => setWeatherWidgetData({
                      ...weatherWidgetData,
                      styling: { ...weatherWidgetData.styling, borderRadius: e.target.value }
                    })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Max Width"
                    value={weatherWidgetData.styling.maxWidth}
                    onChange={(e) => setWeatherWidgetData({
                      ...weatherWidgetData,
                      styling: { ...weatherWidgetData.styling, maxWidth: e.target.value }
                    })}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* API Settings Management */}
        <Grid item xs={12}>
          <Card>
            <CardHeader title="API Settings" />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Weather Provider</InputLabel>
                    <Select
                      value={weatherWidgetData.apiSettings.provider}
                      onChange={(e) => setWeatherWidgetData({
                        ...weatherWidgetData,
                        apiSettings: { ...weatherWidgetData.apiSettings, provider: e.target.value }
                      })}
                    >
                      <MenuItem value="openweathermap">OpenWeatherMap</MenuItem>
                      <MenuItem value="weatherapi">WeatherAPI</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="API Key"
                    type="password"
                    value={weatherWidgetData.apiSettings.apiKey}
                    onChange={(e) => setWeatherWidgetData({
                      ...weatherWidgetData,
                      apiSettings: { ...weatherWidgetData.apiSettings, apiKey: e.target.value }
                    })}
                    helperText="Enter your weather API key"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Base URL"
                    value={weatherWidgetData.apiSettings.baseUrl}
                    onChange={(e) => setWeatherWidgetData({
                      ...weatherWidgetData,
                      apiSettings: { ...weatherWidgetData.apiSettings, baseUrl: e.target.value }
                    })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Icon Base URL"
                    value={weatherWidgetData.apiSettings.iconBaseUrl}
                    onChange={(e) => setWeatherWidgetData({
                      ...weatherWidgetData,
                      apiSettings: { ...weatherWidgetData.apiSettings, iconBaseUrl: e.target.value }
                    })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Timeout (ms)"
                    type="number"
                    value={weatherWidgetData.apiSettings.timeout}
                    onChange={(e) => setWeatherWidgetData({
                      ...weatherWidgetData,
                      apiSettings: { ...weatherWidgetData.apiSettings, timeout: parseInt(e.target.value) }
                    })}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Default Cities Management */}
        <Grid item xs={12}>
          <Card>
            <CardHeader 
              title="Default Cities" 
              action={
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddCity}
                >
                  Add City
                </Button>
              }
            />
            <CardContent>
              {/* Quick Add Form */}
              <Box display="flex" gap={1} mb={2}>
                <TextField
                  fullWidth
                  label="City Name"
                  value={newCity.name}
                  onChange={(e) => setNewCity({ ...newCity, name: e.target.value })}
                />
                <TextField
                  fullWidth
                  label="Country"
                  value={newCity.country}
                  onChange={(e) => setNewCity({ ...newCity, country: e.target.value })}
                />
                <Button
                  variant="contained"
                  onClick={handleAddNewCity}
                  disabled={!newCity.name.trim()}
                >
                  Quick Add
                </Button>
              </Box>

              <Grid container spacing={2}>
                {weatherWidgetData.defaultCities.map((city, index) => (
                  <Grid item xs={12} md={6} key={city.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                          <Box>
                            <Typography variant="h6">{city.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {city.country}
                            </Typography>
                            {city.isDefault && (
                              <Chip label="Default" size="small" color="primary" />
                            )}
                          </Box>
                          <Box display="flex" gap={1}>
                            <IconButton
                              size="small"
                              onClick={() => handleEditCity(city)}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setDeleteConfirm({ type: 'city', id: city.id })}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Save Button */}
        <Grid item xs={12}>
          <Box display="flex" justifyContent="center" mt={3}>
            <Button
              variant="contained"
              size="large"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={updateWeatherWidgetMutation.isPending}
            >
              {updateWeatherWidgetMutation.isPending ? 'Saving...' : 'Save All Changes'}
            </Button>
          </Box>
        </Grid>
      </Grid>

      {/* City Dialog */}
      <Dialog open={isCityDialogOpen} onClose={() => setIsCityDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCity?.id ? 'Edit City' : 'Add City'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="City Name"
                value={editingCity?.name || ''}
                onChange={(e) => setEditingCity({
                  ...editingCity!,
                  name: e.target.value
                })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Country"
                value={editingCity?.country || ''}
                onChange={(e) => setEditingCity({
                  ...editingCity!,
                  country: e.target.value
                })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={editingCity?.isDefault || false}
                    onChange={(e) => setEditingCity({
                      ...editingCity!,
                      isDefault: e.target.checked
                    })}
                  />
                }
                label="Default City"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsCityDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSaveCity}
            variant="contained"
            disabled={addCityMutation.isPending || updateCityMutation.isPending}
          >
            {addCityMutation.isPending || updateCityMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this city? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button
            onClick={() => {
              if (deleteConfirm) {
                deleteCityMutation.mutate(deleteConfirm.id);
              }
            }}
            color="error"
            variant="contained"
            disabled={deleteCityMutation.isPending}
          >
            {deleteCityMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for messages */}
      <Snackbar
        open={!!message}
        autoHideDuration={6000}
        onClose={() => setMessage(null)}
      >
        <Alert
          onClose={() => setMessage(null)}
          severity={message?.type || 'success'}
          sx={{ width: '100%' }}
        >
          {message?.text}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default WeatherWidgetEditor;
