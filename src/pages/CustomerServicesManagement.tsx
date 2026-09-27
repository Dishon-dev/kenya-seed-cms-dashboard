import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
  Avatar,
  Chip,
  Alert,
  Snackbar,
  CircularProgress,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  PhotoCamera as CameraIcon,
  CloudUpload as UploadIcon,
  Visibility as ViewIcon,
} from "@mui/icons-material";
import {
  getCustomerServices,
  createOrUpdateCustomerService,
  deleteCustomerService,
  uploadCustomerServiceImage,
  CustomerService,
} from "../utils/customerServicesApi";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5001";
const resolveImageUrl = (path?: string) => {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("//")) return path;
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
};

const CustomerServicesManagement: React.FC = () => {
  const [services, setServices] = useState<CustomerService[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editingService, setEditingService] = useState<CustomerService | null>(
    null
  );
  const [openImageDialog, setOpenImageDialog] = useState(false);
  const [selectedService, setSelectedService] =
    useState<CustomerService | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Load services from database
  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoading(true);
        const data = await getCustomerServices();
        setServices(data);
      } catch (err) {
        console.error("Error loading customer services:", err);
        setError("Failed to load customer services");
      } finally {
        setLoading(false);
      }
    };

    loadServices();
  }, []);

  const handleOpenEditDialog = (service?: CustomerService) => {
    if (service) {
      setEditingService(service);
    } else {
      setEditingService({
        id: "",
        title: "",
        description: "",
        image: "",
        link: "",
        order: 0,
        isActive: true,
      });
    }
    setOpenEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setEditingService(null);
  };

  const handleSaveService = async () => {
    if (editingService) {
      try {
        const savedService = await createOrUpdateCustomerService(
          editingService
        );

        if (editingService.id === "") {
          // Add new service
          setServices((prev) => [...prev, savedService]);
        } else {
          // Update existing service
          setServices((prev) =>
            prev.map((s) => (s.id === editingService.id ? savedService : s))
          );
        }

        setMessage({ type: "success", text: "Service saved successfully." });
        handleCloseEditDialog();
      } catch (error) {
        console.error("Error saving service:", error);
        setMessage({
          type: "error",
          text: "Error saving service. Please try again.",
        });
      }
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (window.confirm("Are you sure you want to delete this service?")) {
      try {
        await deleteCustomerService(serviceId);
        setServices((prev) => prev.filter((s) => s.id !== serviceId));
        setMessage({ type: "success", text: "Service deleted successfully." });
      } catch (error) {
        console.error("Error deleting service:", error);
        setMessage({
          type: "error",
          text: "Error deleting service. Please try again.",
        });
      }
    }
  };

  const handleOpenImageDialog = (service: CustomerService) => {
    setSelectedService(service);
    setOpenImageDialog(true);
  };

  const handleCloseImageDialog = () => {
    setOpenImageDialog(false);
    setSelectedService(null);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadImage = async () => {
    if (selectedService && imageFile) {
      try {
        const uploadResult = await uploadCustomerServiceImage(
          selectedService.id,
          imageFile
        );
        setServices((prev) =>
          prev.map((s) =>
            s.id === selectedService.id
              ? {
                  ...s,
                  imageId: uploadResult.imageId,
                  image: uploadResult.imageUrl,
                }
              : s
          )
        );
        setMessage({ type: "success", text: "Image uploaded successfully." });
        handleCloseImageDialog();
      } catch (error) {
        console.error("Error uploading image:", error);
        setMessage({
          type: "error",
          text: "Error uploading image. Please try again.",
        });
      }
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4" component="h1">
          Customer Services Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenEditDialog()}
        >
          Add Service
        </Button>
      </Box>

      <Grid container spacing={3}>
        {services.map((service) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={service.id}>
            <Card>
              <Box
                sx={{
                  height: 200,
                  backgroundImage: service.image
                    ? `url(${resolveImageUrl(service.image)})`
                    : "linear-gradient(45deg, #f0f0f0 30%, #e5e7eb 90%)",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  position: "relative",
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    display: "flex",
                    gap: 1,
                  }}
                >
                  <Tooltip title="Edit Image">
                    <IconButton
                      size="small"
                      sx={{ bgcolor: "rgba(255,255,255,0.8)" }}
                      onClick={() => handleOpenImageDialog(service)}
                    >
                      <CameraIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              <CardContent>
                <Typography variant="h6" component="h2" gutterBottom>
                  {service.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {service.description}
                </Typography>
                <Box mt={1}>
                  <Chip
                    label={`Order: ${service.order}`}
                    size="small"
                    color="primary"
                  />
                </Box>
              </CardContent>

              <CardActions>
                <Button
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => handleOpenEditDialog(service)}
                >
                  Edit
                </Button>
                <Button
                  size="small"
                  startIcon={<DeleteIcon />}
                  color="error"
                  onClick={() => handleDeleteService(service.id)}
                >
                  Delete
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Edit Service Dialog */}
      <Dialog
        open={openEditDialog}
        onClose={handleCloseEditDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingService?.id === "" ? "Add Service" : "Edit Service"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Title"
              value={editingService?.title || ""}
              onChange={(e) =>
                setEditingService((prev) =>
                  prev ? { ...prev, title: e.target.value } : null
                )
              }
              margin="normal"
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={4}
              value={editingService?.description || ""}
              onChange={(e) =>
                setEditingService((prev) =>
                  prev ? { ...prev, description: e.target.value } : null
                )
              }
              margin="normal"
            />
            <TextField
              fullWidth
              label="Image Path"
              value={editingService?.image || ""}
              onChange={(e) =>
                setEditingService((prev) =>
                  prev ? { ...prev, image: e.target.value } : null
                )
              }
              margin="normal"
            />
            <TextField
              fullWidth
              label="Link Text"
              value={editingService?.link || ""}
              onChange={(e) =>
                setEditingService((prev) =>
                  prev ? { ...prev, link: e.target.value } : null
                )
              }
              margin="normal"
            />
            <TextField
              fullWidth
              label="Link URL"
              value={editingService?.link || ""}
              onChange={(e) =>
                setEditingService((prev) =>
                  prev ? { ...prev, link: e.target.value } : null
                )
              }
              margin="normal"
            />
            <TextField
              fullWidth
              label="Order Index"
              type="number"
              value={editingService?.order || 0}
              onChange={(e) =>
                setEditingService((prev) =>
                  prev
                    ? { ...prev, order: parseInt(e.target.value) || 0 }
                    : null
                )
              }
              margin="normal"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Cancel</Button>
          <Button onClick={handleSaveService} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image Upload Dialog */}
      <Dialog
        open={openImageDialog}
        onClose={handleCloseImageDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Upload Image for {selectedService?.title}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{ marginBottom: 16 }}
            />
            {imagePreview && (
              <Box mt={2}>
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{
                    maxWidth: "100%",
                    maxHeight: 300,
                    objectFit: "contain",
                  }}
                />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseImageDialog}>Cancel</Button>
          <Button
            onClick={handleUploadImage}
            variant="contained"
            disabled={!imageFile}
            startIcon={<UploadIcon />}
          >
            Upload
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={!!message}
        autoHideDuration={4000}
        onClose={() => setMessage(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setMessage(null)}
          severity={message?.type}
          sx={{ width: "100%" }}
        >
          {message?.text}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CustomerServicesManagement;
