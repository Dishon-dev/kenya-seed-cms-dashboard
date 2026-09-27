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
  Switch,
  FormControlLabel,
  Slider,
  Divider,
  Snackbar,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  Accessibility as AccessibilityIcon,
  ExpandMore as ExpandMoreIcon,
  Palette as PaletteIcon,
  Settings as SettingsIcon,
  Tune as TuneIcon,
  ColorLens as ColorLensIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE = `${process.env.REACT_APP_API_BASE || 'http://localhost:5001'}/api`;

// Types
interface AccessibilityConfig {
  initialFontSize: number;
  showHighContrast: boolean;
  showDyslexiaOption: boolean;
  showReducedMotion: boolean;
  showCursorOption: boolean;
  showLinkHighlight: boolean;
  position: 'left' | 'right';
  title: string;
  poweredByText: string;
}

interface AccessibilityStyling {
  panelBackground: string;
  panelBorderRadius: string;
  panelShadow: string;
  triggerBackground: string;
  triggerColor: string;
  triggerBorderRadius: string;
  primaryColor: string;
  textColor: string;
  buttonBackground: string;
  buttonHoverBackground: string;
  sliderColor: string;
  toggleActiveColor: string;
  toggleInactiveColor: string;
}

interface AccessibilityFeature {
  enabled: boolean;
  default: boolean | number;
  min?: number;
  max?: number;
  step?: number;
}

interface AccessibilityFeatures {
  fontSize: AccessibilityFeature;
  highContrast: AccessibilityFeature;
  dyslexiaFriendly: AccessibilityFeature;
  reducedMotion: AccessibilityFeature;
  largeCursor: AccessibilityFeature;
  highlightLinks: AccessibilityFeature;
}

interface AccessibilityData {
  id: string;
  config: AccessibilityConfig;
  styling: AccessibilityStyling;
  features: AccessibilityFeatures;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

const AccessibilityEditor: React.FC = () => {
  const [accessibilityData, setAccessibilityData] = useState<AccessibilityData | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const queryClient = useQueryClient();

  // Local storage functions
  const saveAccessibilityToStorage = useCallback((data: AccessibilityData) => {
    try {
      localStorage.setItem('accessibilityData', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving accessibility to storage:', error);
    }
  }, []);

  const loadAccessibilityFromStorage = useCallback((): AccessibilityData | null => {
    try {
      const stored = localStorage.getItem('accessibilityData');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error loading accessibility from storage:', error);
      return null;
    }
  }, []);

  // Fetch accessibility data
  const { data: fetchedData, isLoading, error } = useQuery({
    queryKey: ['accessibility'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/accessibility`);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update accessibility data mutation
  const updateAccessibilityMutation = useMutation({
    mutationFn: async (data: Partial<AccessibilityData>) => {
      const response = await axios.post(`${API_BASE}/accessibility`, data);
      return response.data;
    },
    onSuccess: (data) => {
      setAccessibilityData(data.data);
      saveAccessibilityToStorage(data.data);
      queryClient.invalidateQueries({ queryKey: ['accessibility'] });
      setMessage({ type: 'success', text: 'Accessibility settings updated successfully!' });
    },
    onError: (error: any) => {
      console.error('Error updating accessibility:', error);
      setMessage({ type: 'error', text: 'Failed to update accessibility settings. Please try again.' });
    }
  });

  // Update feature mutation
  const updateFeatureMutation = useMutation({
    mutationFn: async ({ feature, updates }: { feature: string, updates: Partial<AccessibilityFeature> }) => {
      const response = await axios.put(`${API_BASE}/accessibility/features/${feature}`, updates);
      return response.data;
    },
    onSuccess: (data) => {
      setAccessibilityData(data.data);
      saveAccessibilityToStorage(data.data);
      queryClient.invalidateQueries({ queryKey: ['accessibility'] });
      setMessage({ type: 'success', text: 'Feature updated successfully!' });
    },
    onError: (error: any) => {
      console.error('Error updating feature:', error);
      setMessage({ type: 'error', text: 'Failed to update feature. Please try again.' });
    }
  });

  // Set accessibility data from fetched data
  useEffect(() => {
    if (fetchedData) {
      setAccessibilityData(fetchedData);
      saveAccessibilityToStorage(fetchedData);
    } else {
      // Try to load from local storage as fallback
      const storedData = loadAccessibilityFromStorage();
      if (storedData) {
        setAccessibilityData(storedData);
      }
    }
  }, [fetchedData, saveAccessibilityToStorage, loadAccessibilityFromStorage]);

  // Handle save
  const handleSave = () => {
    if (accessibilityData) {
      updateAccessibilityMutation.mutate(accessibilityData);
    }
  };

  // Handle feature toggle
  const handleFeatureToggle = (feature: keyof AccessibilityFeatures) => {
    if (accessibilityData) {
      const newFeatures = {
        ...accessibilityData.features,
        [feature]: {
          ...accessibilityData.features[feature],
          enabled: !accessibilityData.features[feature].enabled
        }
      };
      setAccessibilityData({
        ...accessibilityData,
        features: newFeatures
      });
    }
  };

  // Handle feature update
  const handleFeatureUpdate = (feature: keyof AccessibilityFeatures, updates: Partial<AccessibilityFeature>) => {
    if (accessibilityData) {
      const newFeatures = {
        ...accessibilityData.features,
        [feature]: {
          ...accessibilityData.features[feature],
          ...updates
        }
      };
      setAccessibilityData({
        ...accessibilityData,
        features: newFeatures
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
          Failed to load accessibility data. Please try again later.
        </Alert>
      </Box>
    );
  }

  if (!accessibilityData) {
    return (
      <Box p={3}>
        <Alert severity="info">
          No accessibility data available.
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, color: 'primary.main', fontWeight: 'bold' }}>Accessibility Settings Management
      </Typography>

      {/* Live Preview */}
      <Paper sx={{ p: 3, mb: 4, bgcolor: '#f7f8fa' }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 3, color: 'primary.main', fontWeight: 'bold' }}>
          Live Preview - This is how your accessibility widget appears to visitors
        </Typography>
        
        <div style={{ 
          position: 'relative',
          height: '400px',
          backgroundColor: '#f7f8fa',
          border: '2px dashed #ccc',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {/* Mock Accessibility Widget */}
          <div
            style={{
              position: 'absolute',
              [accessibilityData.config.position]: '0',
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: accessibilityData.styling.panelBackground,
              borderRadius: accessibilityData.styling.panelBorderRadius,
              boxShadow: accessibilityData.styling.panelShadow,
              padding: '20px',
              width: '300px',
              zIndex: 10000
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
              <AccessibilityIcon sx={{ color: accessibilityData.styling.primaryColor, mr: 1 }} />
              <Typography variant="h6" sx={{ color: accessibilityData.styling.textColor }}>
                {accessibilityData.config.title}
              </Typography>
            </div>

            {/* Font Size Slider */}
            {accessibilityData.features.fontSize.enabled && (
              <Box mb={2}>
                <Typography variant="body2" sx={{ color: accessibilityData.styling.textColor, mb: 1 }}>
                  Font Size: {accessibilityData.config.initialFontSize}%
                </Typography>
                <Slider
                  value={accessibilityData.config.initialFontSize}
                  min={accessibilityData.features.fontSize.min || 80}
                  max={accessibilityData.features.fontSize.max || 150}
                  step={accessibilityData.features.fontSize.step || 5}
                  sx={{
                    color: accessibilityData.styling.sliderColor,
                    '& .MuiSlider-thumb': {
                      backgroundColor: accessibilityData.styling.sliderColor
                    }
                  }}
                />
              </Box>
            )}

            {/* Feature Toggles */}
            {Object.entries(accessibilityData.features).map(([key, feature]) => {
              if (key === 'fontSize' || !feature.enabled) return null;
              
              const featureLabels: { [key: string]: string } = {
                highContrast: 'High Contrast Mode',
                dyslexiaFriendly: 'Dyslexia-Friendly Font',
                reducedMotion: 'Reduced Motion',
                largeCursor: 'Large Cursor',
                highlightLinks: 'Highlight Links'
              };

              return (
                <Box key={key} display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2" sx={{ color: accessibilityData.styling.textColor }}>
                    {featureLabels[key]}
                  </Typography>
                  <Switch
                    checked={feature.default}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: accessibilityData.styling.toggleActiveColor
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: accessibilityData.styling.toggleActiveColor
                      }
                    }}
                  />
                </Box>
              );
            })}

            <Button
              variant="contained"
              sx={{
                backgroundColor: accessibilityData.styling.buttonBackground,
                color: 'white',
                width: '100%',
                mt: 2,
                '&:hover': {
                  backgroundColor: accessibilityData.styling.buttonHoverBackground
                }
              }}
            >
              Reset Settings
            </Button>

            <Typography variant="caption" sx={{ 
              display: 'block', 
              textAlign: 'center', 
              mt: 1, 
              color: accessibilityData.styling.textColor,
              opacity: 0.7
            }}>
              {accessibilityData.config.poweredByText}
            </Typography>
          </div>

          {/* Trigger Button */}
          <div
            style={{
              position: 'absolute',
              [accessibilityData.config.position]: '-40px',
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: accessibilityData.styling.triggerBackground,
              color: accessibilityData.styling.triggerColor,
              borderRadius: accessibilityData.styling.triggerBorderRadius,
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '1.2rem'
            }}
          >
            <AccessibilityIcon />
          </div>
        </div>
      </Paper>

      {/* Management Controls */}
      <Grid container spacing={3}>
        {/* Configuration Management */}
        <Grid item xs={12}>
          <Card>
            <CardHeader 
              title="Widget Configuration" 
              avatar={<SettingsIcon color="primary" />}
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Widget Title"
                    value={accessibilityData.config.title}
                    onChange={(e) => setAccessibilityData({
                      ...accessibilityData,
                      config: { ...accessibilityData.config, title: e.target.value }
                    })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Powered By Text"
                    value={accessibilityData.config.poweredByText}
                    onChange={(e) => setAccessibilityData({
                      ...accessibilityData,
                      config: { ...accessibilityData.config, poweredByText: e.target.value }
                    })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Position</InputLabel>
                    <Select
                      value={accessibilityData.config.position}
                      onChange={(e) => setAccessibilityData({
                        ...accessibilityData,
                        config: { ...accessibilityData.config, position: e.target.value as 'left' | 'right' }
                      })}
                    >
                      <MenuItem value="right">Right Side</MenuItem>
                      <MenuItem value="left">Left Side</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Initial Font Size (%)"
                    type="number"
                    value={accessibilityData.config.initialFontSize}
                    onChange={(e) => setAccessibilityData({
                      ...accessibilityData,
                      config: { ...accessibilityData.config, initialFontSize: parseInt(e.target.value) }
                    })}
                    inputProps={{ min: 50, max: 200 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Display Options
                  </Typography>
                  <Grid container spacing={2}>
                    {Object.entries(accessibilityData.config).map(([key, value]) => {
                      if (typeof value !== 'boolean' || key === 'initialFontSize' || key === 'position' || key === 'title' || key === 'poweredByText') return null;
                      
                      const labels: { [key: string]: string } = {
                        showHighContrast: 'Show High Contrast Option',
                        showDyslexiaOption: 'Show Dyslexia-Friendly Option',
                        showReducedMotion: 'Show Reduced Motion Option',
                        showCursorOption: 'Show Large Cursor Option',
                        showLinkHighlight: 'Show Link Highlight Option'
                      };

                      return (
                        <Grid item xs={12} md={6} key={key}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={value as boolean}
                                onChange={(e) => setAccessibilityData({
                                  ...accessibilityData,
                                  config: { ...accessibilityData.config, [key]: e.target.checked }
                                })}
                              />
                            }
                            label={labels[key]}
                          />
                        </Grid>
                      );
                    })}
                  </Grid>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Styling Management */}
        <Grid item xs={12}>
          <Card>
            <CardHeader 
              title="Widget Styling" 
              avatar={<PaletteIcon color="primary" />}
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Panel Background Color"
                    type="color"
                    value={accessibilityData.styling.panelBackground}
                    onChange={(e) => setAccessibilityData({
                      ...accessibilityData,
                      styling: { ...accessibilityData.styling, panelBackground: e.target.value }
                    })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Trigger Background Color"
                    type="color"
                    value={accessibilityData.styling.triggerBackground}
                    onChange={(e) => setAccessibilityData({
                      ...accessibilityData,
                      styling: { ...accessibilityData.styling, triggerBackground: e.target.value }
                    })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Primary Color"
                    type="color"
                    value={accessibilityData.styling.primaryColor}
                    onChange={(e) => setAccessibilityData({
                      ...accessibilityData,
                      styling: { ...accessibilityData.styling, primaryColor: e.target.value }
                    })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Text Color"
                    type="color"
                    value={accessibilityData.styling.textColor}
                    onChange={(e) => setAccessibilityData({
                      ...accessibilityData,
                      styling: { ...accessibilityData.styling, textColor: e.target.value }
                    })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Button Background Color"
                    type="color"
                    value={accessibilityData.styling.buttonBackground}
                    onChange={(e) => setAccessibilityData({
                      ...accessibilityData,
                      styling: { ...accessibilityData.styling, buttonBackground: e.target.value }
                    })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Button Hover Color"
                    type="color"
                    value={accessibilityData.styling.buttonHoverBackground}
                    onChange={(e) => setAccessibilityData({
                      ...accessibilityData,
                      styling: { ...accessibilityData.styling, buttonHoverBackground: e.target.value }
                    })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Border Radius"
                    value={accessibilityData.styling.panelBorderRadius}
                    onChange={(e) => setAccessibilityData({
                      ...accessibilityData,
                      styling: { ...accessibilityData.styling, panelBorderRadius: e.target.value }
                    })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Box Shadow"
                    value={accessibilityData.styling.panelShadow}
                    onChange={(e) => setAccessibilityData({
                      ...accessibilityData,
                      styling: { ...accessibilityData.styling, panelShadow: e.target.value }
                    })}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Features Management */}
        <Grid item xs={12}>
          <Card>
            <CardHeader 
              title="Accessibility Features" 
              avatar={<TuneIcon color="primary" />}
            />
            <CardContent>
              <Grid container spacing={3}>
                {Object.entries(accessibilityData.features).map(([key, feature]) => {
                  const featureLabels: { [key: string]: string } = {
                    fontSize: 'Font Size Control',
                    highContrast: 'High Contrast Mode',
                    dyslexiaFriendly: 'Dyslexia-Friendly Font',
                    reducedMotion: 'Reduced Motion',
                    largeCursor: 'Large Cursor',
                    highlightLinks: 'Highlight Links'
                  };

                  const featureDescriptions: { [key: string]: string } = {
                    fontSize: 'Allow users to adjust font size from 80% to 150%',
                    highContrast: 'Enable high contrast mode for better visibility',
                    dyslexiaFriendly: 'Switch to dyslexia-friendly fonts',
                    reducedMotion: 'Reduce animations and motion effects',
                    largeCursor: 'Increase cursor size for better visibility',
                    highlightLinks: 'Highlight all links on the page'
                  };

                  return (
                    <Grid item xs={12} md={6} key={key}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                            <Typography variant="h6">{featureLabels[key]}</Typography>
                            <Switch
                              checked={feature.enabled}
                              onChange={() => handleFeatureToggle(key as keyof AccessibilityFeatures)}
                            />
                          </Box>
                          <Typography variant="body2" color="text.secondary" mb={2}>
                            {featureDescriptions[key]}
                          </Typography>
                          
                          {feature.enabled && (
                            <Box>
                              {key === 'fontSize' && (
                                <Box>
                                  <Typography variant="body2" gutterBottom>
                                    Range: {feature.min}% - {feature.max}%
                                  </Typography>
                                  <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                      <TextField
                                        fullWidth
                                        label="Min Size (%)"
                                        type="number"
                                        value={feature.min}
                                        onChange={(e) => handleFeatureUpdate(key as keyof AccessibilityFeatures, {
                                          min: parseInt(e.target.value)
                                        })}
                                        size="small"
                                      />
                                    </Grid>
                                    <Grid item xs={6}>
                                      <TextField
                                        fullWidth
                                        label="Max Size (%)"
                                        type="number"
                                        value={feature.max}
                                        onChange={(e) => handleFeatureUpdate(key as keyof AccessibilityFeatures, {
                                          max: parseInt(e.target.value)
                                        })}
                                        size="small"
                                      />
                                    </Grid>
                                    <Grid item xs={6}>
                                      <TextField
                                        fullWidth
                                        label="Step"
                                        type="number"
                                        value={feature.step}
                                        onChange={(e) => handleFeatureUpdate(key as keyof AccessibilityFeatures, {
                                          step: parseInt(e.target.value)
                                        })}
                                        size="small"
                                      />
                                    </Grid>
                                    <Grid item xs={6}>
                                      <TextField
                                        fullWidth
                                        label="Default (%)"
                                        type="number"
                                        value={feature.default}
                                        onChange={(e) => handleFeatureUpdate(key as keyof AccessibilityFeatures, {
                                          default: parseInt(e.target.value)
                                        })}
                                        size="small"
                                      />
                                    </Grid>
                                  </Grid>
                                </Box>
                              )}
                              
                              {key !== 'fontSize' && (
                                <FormControlLabel
                                  control={
                                    <Switch
                                      checked={feature.default}
                                      onChange={(e) => handleFeatureUpdate(key as keyof AccessibilityFeatures, {
                                        default: e.target.checked
                                      })}
                                    />
                                  }
                                  label="Default Enabled"
                                />
                              )}
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
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
              disabled={updateAccessibilityMutation.isPending}
            >
              {updateAccessibilityMutation.isPending ? 'Saving...' : 'Save All Changes'}
            </Button>
          </Box>
        </Grid>
      </Grid>

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

export default AccessibilityEditor;
