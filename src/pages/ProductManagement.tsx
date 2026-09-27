import React from 'react';
import { useNavigate } from 'react-router-dom';
import { updateProductImage, deleteImage, loadProductImages } from '../utils/imageStorage';
import { getProducts, createOrUpdateProduct, deleteProduct } from '../utils/databaseApi';
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
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Edit as EditIcon,
  Settings as ManageIcon,
  Agriculture as MaizeIcon,
  LocalFlorist as HorticultureIcon,
  Spa as LegumesIcon,
  Grass as PastureIcon,
  Nature as MilletIcon,
  Park as RiceIcon,
  Grain as SorghumIcon,
  WbSunny as SunflowerIcon,
  LocalDining as WheatIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  PhotoCamera as CameraIcon,
  Delete as DeleteImageIcon,
  CloudUpload as UploadIcon,
} from '@mui/icons-material';

export interface ProductType {
  id: string;
  name: string;
  slug: string;
  description: string;
  imagePath: string;
  imageData?: string; // Base64 encoded image data
  imageFile?: File; // File object for uploads
  totalVarieties: number;
  totalCategories: number;
  color: string;
  icon: React.ReactElement;
  lastUpdated: string;
  status: 'active' | 'inactive';
}

const mainProducts: ProductType[] = [
  {
    id: 'maize',
    name: 'Maize',
    slug: 'maize',
    description: 'High-yielding maize varieties for different agro-ecological zones',
    imagePath: '', // No default image - will show placeholder
    totalVarieties: 12,
    totalCategories: 5,
    color: '#FFD700',
    icon: <MaizeIcon />,
    lastUpdated: '2024-01-15',
    status: 'active'
  },
  {
    id: 'horticulture',
    name: 'Horticulture',
    slug: 'horticulture',
    description: 'Premium vegetable and fruit varieties for fresh markets and export',
    imagePath: '', // No default image - will show placeholder
    totalVarieties: 45,
    totalCategories: 9,
    color: '#4CAF50',
    icon: <HorticultureIcon />,
    lastUpdated: '2024-01-20',
    status: 'active'
  },
  {
    id: 'legumes',
    name: 'Legumes',
    slug: 'legumes',
    description: 'Nutritious legume varieties for food security and soil improvement',
    imagePath: '', // No default image - will show placeholder
    totalVarieties: 18,
    totalCategories: 4,
    color: '#8BC34A',
    icon: <LegumesIcon />,
    lastUpdated: '2024-01-18',
    status: 'active'
  },
  {
    id: 'pasture',
    name: 'Pasture & Forage',
    slug: 'pasture',
    description: 'High-quality pasture and forage crops for livestock',
    imagePath: '', // No default image - will show placeholder
    totalVarieties: 8,
    totalCategories: 2,
    color: '#795548',
    icon: <PastureIcon />,
    lastUpdated: '2024-01-12',
    status: 'active'
  },
  {
    id: 'millet',
    name: 'Millet',
    slug: 'millet',
    description: 'Drought-resistant millet varieties for arid and semi-arid regions',
    imagePath: '', // No default image - will show placeholder
    totalVarieties: 6,
    totalCategories: 1,
    color: '#FF9800',
    icon: <MilletIcon />,
    lastUpdated: '2024-01-10',
    status: 'active'
  },
  {
    id: 'rice',
    name: 'Rice',
    slug: 'rice',
    description: 'High-quality rice varieties for different growing conditions',
    imagePath: '', // No default image - will show placeholder
    totalVarieties: 4,
    totalCategories: 2,
    color: '#2196F3',
    icon: <RiceIcon />,
    lastUpdated: '2024-01-08',
    status: 'active'
  },
  {
    id: 'sorghum',
    name: 'Sorghum',
    slug: 'sorghum',
    description: 'High-quality sorghum varieties for diverse farming conditions',
    imagePath: '', // No default image - will show placeholder
    totalVarieties: 4,
    totalCategories: 1,
    color: '#9C27B0',
    icon: <SorghumIcon />,
    lastUpdated: '2024-01-15',
    status: 'active'
  },
  {
    id: 'sunflower',
    name: 'Sunflower',
    slug: 'sunflower',
    description: 'High-quality sunflower varieties for oil production and diverse farming conditions',
    imagePath: '', // No default image - will show placeholder
    totalVarieties: 3,
    totalCategories: 1,
    color: '#FFC107',
    icon: <SunflowerIcon />,
    lastUpdated: '2024-01-15',
    status: 'active'
  },
  {
    id: 'wheat',
    name: 'Wheat',
    slug: 'wheat',
    description: 'Premium wheat varieties for Kenya\'s diverse agro-ecological zones',
    imagePath: '', // No default image - will show placeholder
    totalVarieties: 9,
    totalCategories: 1,
    color: '#8D6E63',
    icon: <WheatIcon />,
    lastUpdated: '2024-01-15',
    status: 'active'
  },
];

const ProductManagement: React.FC = () => {
  const navigate = useNavigate();
  const [openEditDialog, setOpenEditDialog] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<ProductType | null>(null);
  const [products, setProducts] = React.useState<ProductType[]>(mainProducts);
  const [openImageDialog, setOpenImageDialog] = React.useState(false);
  const [editingImageProduct, setEditingImageProduct] = React.useState<ProductType | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = React.useState<File | null>(null);

  const handleEditProduct = (productSlug: string) => {
    const product = products.find(p => p.slug === productSlug);
    if (product) {
      setEditingProduct(product);
      setOpenEditDialog(true);
    }
  };

  const handleManageProduct = (productSlug: string) => {
    navigate(`/products/${productSlug}/categories`);
  };

  const handleViewProduct = (productSlug: string) => {
    // For now, we'll just show an alert. In a real app, this would navigate to a view page
    const product = products.find(p => p.slug === productSlug);
    if (product) {
      alert(`Viewing ${product.name}: ${product.description}`);
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setOpenEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setEditingProduct(null);
  };

  const handleSaveProduct = async () => {
    if (editingProduct) {
      try {
        const productData = {
          product_type: editingProduct.slug,
          name: editingProduct.name,
          slug: editingProduct.slug,
          description: editingProduct.description,
          total_varieties: editingProduct.totalVarieties || 0,
          total_categories: editingProduct.totalCategories || 0,
          color: editingProduct.color,
          icon: editingProduct.icon,
          last_updated: new Date().toISOString().split('T')[0],
          status: 'active'
        };

        // Save to database
        const savedProduct = await createOrUpdateProduct(productData);
        
        if (editingProduct.id) {
          // Update existing product in local state
          setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...editingProduct, ...savedProduct } : p));
        } else {
          // Add new product to local state
          const newProduct = {
            ...editingProduct,
            id: savedProduct.id.toString(),
            lastUpdated: new Date().toISOString().split('T')[0],
            status: 'active' as const
          };
          setProducts(prev => [...prev, newProduct]);
        }
        
        alert('Product saved successfully to database!');
        handleCloseEditDialog();
      } catch (error) {
        console.error('Error saving product to database:', error);
        alert('Error saving product to database. Please try again.');
      }
    }
  };

  const handleDeleteProduct = async (productSlug: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const product = products.find(p => p.slug === productSlug);
        if (product) {
          // Delete from database
          await deleteProduct(parseInt(product.id));
          
          // Remove from local state
          setProducts(prev => prev.filter(p => p.slug !== productSlug));
          
          alert('Product deleted successfully from database!');
        }
      } catch (error) {
        console.error('Error deleting product from database:', error);
        alert('Error deleting product from database. Please try again.');
      }
    }
  };

  // Image management functions
  const handleEditImage = (productSlug: string) => {
    const product = products.find(p => p.slug === productSlug);
    if (product) {
      setEditingImageProduct(product);
      setImagePreview(product.imageData || null);
      setOpenImageDialog(true);
    }
  };

  const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveImage = async () => {
    if (editingImageProduct && selectedImageFile) {
      try {
        // Convert file to base64
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(selectedImageFile);
        });

        // Save image to both local storage and database
        const { localPath } = await updateProductImage(
          editingImageProduct.id,
          base64,
          selectedImageFile.name,
          editingImageProduct.slug
        );

        // Update product with new image data
        const updatedProduct = {
          ...editingImageProduct,
          imageData: base64,
          imageFile: selectedImageFile,
          imagePath: localPath,
          lastUpdated: new Date().toISOString().split('T')[0]
        };

        setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
        
        console.log('Image saved successfully for product:', updatedProduct.name);
        alert('Image saved successfully!');
        
        handleCloseImageDialog();
      } catch (error) {
        console.error('Error saving image:', error);
        alert('Error saving image. Please try again.');
      }
    }
  };

  const handleDeleteImage = async () => {
    if (editingImageProduct && window.confirm('Are you sure you want to delete this image?')) {
      try {
        // Delete from both local storage and database
        await deleteImage(editingImageProduct.id, editingImageProduct.imagePath);
        
        const updatedProduct = {
          ...editingImageProduct,
          imageData: undefined,
          imageFile: undefined,
          imagePath: '', // Clear the path as well
          lastUpdated: new Date().toISOString().split('T')[0]
        };

        setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
        
        console.log('Image deleted successfully for product:', updatedProduct.name);
        alert('Image deleted successfully!');
        
        handleCloseImageDialog();
      } catch (error) {
        console.error('Error deleting image:', error);
        alert('Error deleting image. Please try again.');
      }
    }
  };

  const handleCloseImageDialog = () => {
    setOpenImageDialog(false);
    setEditingImageProduct(null);
    setImagePreview(null);
    setSelectedImageFile(null);
  };

  // Load products from database on component mount
  React.useEffect(() => {
    const loadProductsFromDatabase = async () => {
      try {
        console.log('Loading products from database...');
        const dbProducts = await getProducts();
        console.log('Found products from database:', dbProducts);
        
        // Convert database format to frontend format
        const formattedProducts = dbProducts.map((product: any) => ({
          id: product.id.toString(),
          name: product.name,
          slug: product.slug,
          description: product.description || '',
          totalVarieties: product.total_varieties || 0,
          totalCategories: product.total_categories || 0,
          color: product.color || '#4CAF50',
          icon: product.icon || 'Sprout',
          lastUpdated: product.last_updated || new Date().toISOString().split('T')[0],
          status: product.status || 'active',
          imageData: product.image_data ? `data:${product.image_mime_type};base64,${Buffer.from(product.image_data).toString('base64')}` : undefined
        }));
        
        setProducts(formattedProducts);
      } catch (error) {
        console.error('Error loading products from database:', error);
        // Fallback to static data if database fails
        console.log('Using static product data as fallback');
      }
    };

    loadProductsFromDatabase();
  }, []); // Only run on mount

  // Load images from database as primary source on component mount
  React.useEffect(() => {
    const loadImagesFromDatabase = async () => {
      try {
        const productIds = products.map(p => p.id);
        const imageMap = await loadProductImages(productIds);
        
        // Update products with database image data (primary source)
        setProducts(prev => prev.map(product => {
          const dbImageData = imageMap.get(product.id);
          if (dbImageData) {
            // Database is primary source - use database image data
            return {
              ...product,
              imageData: dbImageData.imageData,
              imagePath: dbImageData.localPath || product.imagePath
            };
          }
          // No database image - keep original product data
          return product;
        }));
      } catch (error) {
        console.error('Error loading images from database:', error);
        // Fallback: continue with original product data if database fails
      }
    };

    loadImagesFromDatabase();
  }, []); // Only run on mount

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Product Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your seed product categories and varieties. Click "Edit" to modify product details or "Manage" to edit categories and varieties.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddProduct}
        >
          Add Product
        </Button>
      </Box>

      <Grid container spacing={3}>
        {products.map((product) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
              }}
            >
              {/* Product Image */}
              <Box
                sx={{
                  height: 200,
                  backgroundImage: product.imageData ? `url(${product.imageData})` : (product.imagePath && product.imagePath !== '') ? `url(${product.imagePath})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  position: 'relative',
                  backgroundColor: product.color + '20', // Fallback color with opacity
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.3))',
                  }
                }}
              >
                {/* Product Status Badge */}
                <Chip
                  label={product.status}
                  color={product.status === 'active' ? 'success' : 'default'}
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    backgroundColor: product.status === 'active' ? 'rgba(76, 175, 80, 0.9)' : 'rgba(158, 158, 158, 0.9)',
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                />

                {/* Image Edit Button */}
                <IconButton
                  onClick={() => handleEditImage(product.slug)}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    left: 8,
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    }
                  }}
                  size="small"
                >
                  <CameraIcon />
                </IconButton>

                {/* No Image Placeholder */}
                {!product.imageData && (!product.imagePath || product.imagePath === '') && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      textAlign: 'center',
                      color: 'white',
                      zIndex: 1
                    }}
                  >
                    <CameraIcon sx={{ fontSize: 48, mb: 1, opacity: 0.7 }} />
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      No Image
                    </Typography>
                  </Box>
                )}
              </Box>

              <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: product.color,
                      width: 48,
                      height: 48,
                      mr: 2,
                    }}
                  >
                    {product.icon}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="h2" gutterBottom>
                      {product.name}
                    </Typography>
                    <Chip
                      label={product.status}
                      color={product.status === 'active' ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>
                </Box>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2, minHeight: 40 }}
                >
                  {product.description}
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Categories:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {product.totalCategories}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Varieties:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {product.totalVarieties}
                  </Typography>
                </Box>

                <Typography variant="caption" color="text.secondary">
                  Last updated: {product.lastUpdated}
                </Typography>
              </CardContent>

              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => handleEditProduct(product.slug)}
                  size="small"
                  sx={{ flexGrow: 1 }}
                >
                  Edit
                </Button>
                <Button
                  variant="contained"
                  startIcon={<ManageIcon />}
                  onClick={() => handleManageProduct(product.slug)}
                  size="small"
                  sx={{ flexGrow: 1, ml: 1 }}
                >
                  Manage
                </Button>
                <Tooltip title="View Product">
                  <IconButton
                    onClick={() => handleViewProduct(product.slug)}
                    size="small"
                  >
                    <ViewIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete Product">
                  <IconButton
                    onClick={() => handleDeleteProduct(product.slug)}
                    size="small"
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Edit/Add Product Dialog */}
      <Dialog open={openEditDialog} onClose={handleCloseEditDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingProduct ? 'Edit Product' : 'Add New Product'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Product Name"
                value={editingProduct?.name || ''}
                onChange={(e) => setEditingProduct({
                  ...editingProduct!,
                  name: e.target.value,
                  slug: e.target.value.toLowerCase().replace(/\s+/g, '-')
                })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Slug"
                value={editingProduct?.slug || ''}
                onChange={(e) => setEditingProduct({
                  ...editingProduct!,
                  slug: e.target.value
                })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={editingProduct?.description || ''}
                onChange={(e) => setEditingProduct({
                  ...editingProduct!,
                  description: e.target.value
                })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Image Path"
                value={editingProduct?.imagePath || ''}
                onChange={(e) => setEditingProduct({
                  ...editingProduct!,
                  imagePath: e.target.value
                })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Color (Hex)"
                value={editingProduct?.color || ''}
                onChange={(e) => setEditingProduct({
                  ...editingProduct!,
                  color: e.target.value
                })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Total Categories"
                type="number"
                value={editingProduct?.totalCategories || 0}
                onChange={(e) => setEditingProduct({
                  ...editingProduct!,
                  totalCategories: parseInt(e.target.value) || 0
                })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Total Varieties"
                type="number"
                value={editingProduct?.totalVarieties || 0}
                onChange={(e) => setEditingProduct({
                  ...editingProduct!,
                  totalVarieties: parseInt(e.target.value) || 0
                })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={editingProduct?.status || 'active'}
                  label="Status"
                  onChange={(e) => setEditingProduct({
                    ...editingProduct!,
                    status: e.target.value as 'active' | 'inactive'
                  })}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Cancel</Button>
          <Button onClick={handleSaveProduct} variant="contained">
            {editingProduct ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image Management Dialog */}
      <Dialog open={openImageDialog} onClose={handleCloseImageDialog} maxWidth="sm" fullWidth disableEnforceFocus>
        <DialogTitle>
          Manage Image - {editingImageProduct?.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {/* Current Image Preview */}
            {imagePreview && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Current Image:
                </Typography>
                <Box
                  sx={{
                    width: '100%',
                    height: 200,
                    backgroundImage: `url(${imagePreview})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    borderRadius: 1,
                    border: '1px solid #e5e7eb'
                  }}
                />
              </Box>
            )}

            {/* File Upload */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Upload New Image:
              </Typography>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="image-upload"
                type="file"
                onChange={handleImageFileChange}
              />
              <label htmlFor="image-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<UploadIcon />}
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  Choose Image File
                </Button>
              </label>
              {selectedImageFile && (
                <Typography variant="body2" color="text.secondary">
                  Selected: {selectedImageFile.name}
                </Typography>
              )}
            </Box>

            {/* Image Actions */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteImageIcon />}
                onClick={handleDeleteImage}
                disabled={!editingImageProduct?.imageData && (!editingImageProduct?.imagePath || editingImageProduct?.imagePath === '')}
              >
                Delete Image
              </Button>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseImageDialog}>Cancel</Button>
          <Button 
            onClick={handleSaveImage} 
            variant="contained"
            disabled={!selectedImageFile}
          >
            Save Image
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProductManagement;
