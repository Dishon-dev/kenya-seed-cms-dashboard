import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Paper,
  Grid,
  Switch,
  FormControlLabel,
  Divider
} from '@mui/material';
import {
  Close as CloseIcon,
  RotateLeft as RotateLeftIcon,
  RotateRight as RotateRightIcon,
  Flip as FlipIcon,
  Crop as CropIcon,
  Brightness4 as BrightnessIcon,
  Contrast as ContrastIcon,
  Palette as PaletteIcon,
  BlurOn as BlurIcon,
  FilterHdr as FilterIcon,
  InvertColors as InvertIcon,
  Save as SaveIcon,
  Undo as UndoIcon,
  Redo as RedoIcon
} from '@mui/icons-material';

interface ImageEditorProps {
  open: boolean;
  onClose: () => void;
  imageUrl: string;
  onSave: (editedImage: string) => void;
  title?: string;
}

const ImageEditor: React.FC<ImageEditorProps> = ({
  open,
  onClose,
  imageUrl,
  onSave,
  title = 'Edit Image'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Image adjustments
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [hue, setHue] = useState(0);
  const [blur, setBlur] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(100);
  const [flipHorizontal, setFlipHorizontal] = useState(false);
  const [flipVertical, setFlipVertical] = useState(false);
  const [grayscale, setGrayscale] = useState(false);
  const [sepia, setSepia] = useState(false);
  const [invert, setInvert] = useState(false);

  // Load image when component opens
  useEffect(() => {
    if (open && imageUrl) {
      loadImage();
    }
  }, [open, imageUrl]);

  const loadImage = () => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setOriginalImage(img);
      setBrightness(100);
      setContrast(100);
      setSaturation(100);
      setHue(0);
      setBlur(0);
      setRotation(0);
      setScale(100);
      setFlipHorizontal(false);
      setFlipVertical(false);
      setGrayscale(false);
      setSepia(false);
      setInvert(false);
      setHistory([]);
      setHistoryIndex(-1);
      setTimeout(() => {
        applyFilters();
        saveToHistory();
      }, 100);
    };
    img.src = imageUrl;
  };

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const dataURL = canvas.toDataURL('image/jpeg', 0.9);
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(dataURL);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const img = new Image();
          img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          };
          img.src = history[historyIndex - 1];
        }
      }
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const img = new Image();
          img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          };
          img.src = history[historyIndex + 1];
        }
      }
    }
  };

  const applyFilters = () => {
    const canvas = canvasRef.current;
    if (!canvas || !originalImage) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const maxWidth = 800;
    const maxHeight = 600;
    let { width, height } = originalImage;
    
    if (width > maxWidth || height > maxHeight) {
      const ratio = Math.min(maxWidth / width, maxHeight / height);
      width *= ratio;
      height *= ratio;
    }

    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Apply transformations
    ctx.save();
    
    // Move to center
    ctx.translate(width / 2, height / 2);
    
    // Apply rotation
    if (rotation !== 0) {
      ctx.rotate((rotation * Math.PI) / 180);
    }
    
    // Apply scale
    const scaleFactor = scale / 100;
    ctx.scale(scaleFactor, scaleFactor);
    
    // Apply flips
    if (flipHorizontal) {
      ctx.scale(-1, 1);
    }
    if (flipVertical) {
      ctx.scale(1, -1);
    }
    
    // Draw image
    ctx.drawImage(originalImage, -width / 2, -height / 2, width, height);
    
    ctx.restore();

    // Apply filters
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Brightness
      r = Math.max(0, Math.min(255, r * (brightness / 100)));
      g = Math.max(0, Math.min(255, g * (brightness / 100)));
      b = Math.max(0, Math.min(255, b * (brightness / 100)));

      // Contrast
      const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
      r = Math.max(0, Math.min(255, contrastFactor * (r - 128) + 128));
      g = Math.max(0, Math.min(255, contrastFactor * (g - 128) + 128));
      b = Math.max(0, Math.min(255, contrastFactor * (b - 128) + 128));

      // Saturation
      if (saturation !== 100) {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        const satFactor = saturation / 100;
        r = gray + satFactor * (r - gray);
        g = gray + satFactor * (g - gray);
        b = gray + satFactor * (b - gray);
      }

      // Hue rotation
      if (hue !== 0) {
        const cos = Math.cos((hue * Math.PI) / 180);
        const sin = Math.sin((hue * Math.PI) / 180);
        const newR = r * cos - g * sin;
        const newG = r * sin + g * cos;
        r = newR;
        g = newG;
      }

      // Grayscale
      if (grayscale) {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        r = g = b = gray;
      }

      // Sepia
      if (sepia) {
        const newR = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
        const newG = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
        const newB = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
        r = newR;
        g = newG;
        b = newB;
      }

      // Invert
      if (invert) {
        r = 255 - r;
        g = 255 - g;
        b = 255 - b;
      }

      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }

    ctx.putImageData(imageData, 0, 0);

    // Apply blur
    if (blur > 0) {
      ctx.filter = `blur(${blur}px)`;
      ctx.drawImage(canvas, 0, 0);
      ctx.filter = 'none';
    }
  };

  // Apply filters when any adjustment changes
  useEffect(() => {
    if (originalImage) {
      applyFilters();
    }
  }, [
    brightness, contrast, saturation, hue, blur, rotation, scale,
    flipHorizontal, flipVertical, grayscale, sepia, invert, originalImage
  ]);

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const dataURL = canvas.toDataURL('image/jpeg', 0.9);
      onSave(dataURL);
    }
  };

  const resetFilters = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setHue(0);
    setBlur(0);
    setRotation(0);
    setScale(100);
    setFlipHorizontal(false);
    setFlipVertical(false);
    setGrayscale(false);
    setSepia(false);
    setInvert(false);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: '90vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{title}</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Image Canvas */}
          <Grid item xs={12} md={8}>
            <Paper
              elevation={2}
              sx={{
                p: 2,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '400px',
                backgroundColor: '#f7f8fa'
              }}
            >
              <canvas
                ref={canvasRef}
                style={{
                  maxWidth: '100%',
                  maxHeight: '400px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </Paper>
          </Grid>

          {/* Controls */}
          <Grid item xs={12} md={4}>
            <Box sx={{ maxHeight: '500px', overflowY: 'auto' }}>
              {/* History Controls */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  History
                </Typography>
                <Box display="flex" gap={1}>
                  <Button
                    size="small"
                    startIcon={<UndoIcon />}
                    onClick={undo}
                    disabled={historyIndex <= 0}
                  >
                    Undo
                  </Button>
                  <Button
                    size="small"
                    startIcon={<RedoIcon />}
                    onClick={redo}
                    disabled={historyIndex >= history.length - 1}
                  >
                    Redo
                  </Button>
                  <Button
                    size="small"
                    onClick={resetFilters}
                    color="secondary"
                  >
                    Reset
                  </Button>
                </Box>
              </Box>

              <Divider sx={{ mb: 3 }} />

              {/* Basic Adjustments */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Basic Adjustments
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography gutterBottom>Brightness: {brightness}%</Typography>
                  <Slider
                    value={brightness}
                    onChange={(_, value) => setBrightness(value as number)}
                    min={0}
                    max={200}
                    step={1}
                    marks={[
                      { value: 0, label: '0%' },
                      { value: 100, label: '100%' },
                      { value: 200, label: '200%' }
                    ]}
                  />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography gutterBottom>Contrast: {contrast}%</Typography>
                  <Slider
                    value={contrast}
                    onChange={(_, value) => setContrast(value as number)}
                    min={0}
                    max={200}
                    step={1}
                    marks={[
                      { value: 0, label: '0%' },
                      { value: 100, label: '100%' },
                      { value: 200, label: '200%' }
                    ]}
                  />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography gutterBottom>Saturation: {saturation}%</Typography>
                  <Slider
                    value={saturation}
                    onChange={(_, value) => setSaturation(value as number)}
                    min={0}
                    max={200}
                    step={1}
                    marks={[
                      { value: 0, label: '0%' },
                      { value: 100, label: '100%' },
                      { value: 200, label: '200%' }
                    ]}
                  />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography gutterBottom>Hue: {hue}°</Typography>
                  <Slider
                    value={hue}
                    onChange={(_, value) => setHue(value as number)}
                    min={-180}
                    max={180}
                    step={1}
                    marks={[
                      { value: -180, label: '-180°' },
                      { value: 0, label: '0°' },
                      { value: 180, label: '180°' }
                    ]}
                  />
                </Box>
              </Box>

              <Divider sx={{ mb: 3 }} />

              {/* Transformations */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Transformations
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography gutterBottom>Rotation: {rotation}°</Typography>
                  <Slider
                    value={rotation}
                    onChange={(_, value) => setRotation(value as number)}
                    min={-180}
                    max={180}
                    step={1}
                    marks={[
                      { value: -180, label: '-180°' },
                      { value: 0, label: '0°' },
                      { value: 180, label: '180°' }
                    ]}
                  />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography gutterBottom>Scale: {scale}%</Typography>
                  <Slider
                    value={scale}
                    onChange={(_, value) => setScale(value as number)}
                    min={25}
                    max={200}
                    step={5}
                    marks={[
                      { value: 25, label: '25%' },
                      { value: 100, label: '100%' },
                      { value: 200, label: '200%' }
                    ]}
                  />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={flipHorizontal}
                        onChange={(e) => setFlipHorizontal(e.target.checked)}
                      />
                    }
                    label="Flip Horizontal"
                  />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={flipVertical}
                        onChange={(e) => setFlipVertical(e.target.checked)}
                      />
                    }
                    label="Flip Vertical"
                  />
                </Box>
              </Box>

              <Divider sx={{ mb: 3 }} />

              {/* Effects */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Effects
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography gutterBottom>Blur: {blur}px</Typography>
                  <Slider
                    value={blur}
                    onChange={(_, value) => setBlur(value as number)}
                    min={0}
                    max={10}
                    step={0.5}
                    marks={[
                      { value: 0, label: '0px' },
                      { value: 5, label: '5px' },
                      { value: 10, label: '10px' }
                    ]}
                  />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={grayscale}
                        onChange={(e) => setGrayscale(e.target.checked)}
                      />
                    }
                    label="Grayscale"
                  />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={sepia}
                        onChange={(e) => setSepia(e.target.checked)}
                      />
                    }
                    label="Sepia"
                  />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={invert}
                        onChange={(e) => setInvert(e.target.checked)}
                      />
                    }
                    label="Invert Colors"
                  />
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          startIcon={<SaveIcon />}
          color="primary"
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImageEditor;
