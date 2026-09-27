import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadProductImages, saveImageToDatabase, deleteImage } from '../utils/imageStorage';
import { getCategories, createOrUpdateCategory, deleteCategory, getProduct, uploadCategoryImage, deleteCategoryImage, getCategoryImageUrl } from '../utils/databaseApi';
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
  Breadcrumbs,
  Link,
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
  Visibility as ViewIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  PhotoCamera as CameraIcon,
  Delete as DeleteImageIcon,
  CloudUpload as UploadIcon,
} from '@mui/icons-material';

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  imagePath: string;
  imageData?: string;
  imageFile?: File;
  totalVarieties: number;
  regions: string[];
  color: string;
  lastUpdated: string;
  status: 'active' | 'inactive';
}

// Sample data for different product categories
const productCategoriesData: Record<string, ProductCategory[]> = {
  maize: [
  {
    id: 'highland-varieties',
    name: 'Highland Varieties',
    slug: 'highland-varieties',
    description: 'These varieties do well in high rainfall areas with well drained good soils where rainfall distribution lasts about 150-180 days and not less than 800mm in the season.',
    imagePath: '',
    totalVarieties: 5,
    regions: ['Kakamega', 'Transnzoia', 'Uasin Gishu', 'Nandi', 'Kericho', 'Nakuru', 'Molo', 'Nyeri', 'Murang\'a'],
    color: '#4CAF50',
    lastUpdated: '2024-01-15',
    status: 'active'
  },
  {
    id: 'transitional-zone-varieties',
    name: 'Transitional Zone Varieties',
    slug: 'transitional-zone-varieties',
    description: 'Varieties suitable for transitional zones with altitude range of 1000-1800m.',
    imagePath: '',
    totalVarieties: 2,
    regions: ['Transitional regions between highlands and lowlands'],
    color: '#8BC34A',
    lastUpdated: '2024-01-14',
    status: 'active'
  },
  {
    id: 'medium-maturity-varieties',
    name: 'Medium Maturity Varieties',
    slug: 'medium-maturity-varieties',
    description: 'Recommended for medium altitude regions with altitude range of 900-1500m above sea level.',
    imagePath: '',
    totalVarieties: 3,
    regions: ['Medium altitude regions'],
    color: '#FFC107',
    lastUpdated: '2024-01-13',
    status: 'active'
  },
  {
    id: 'lowland-varieties',
    name: 'Lowland Varieties (Pwani Hybrids)',
    slug: 'lowland-varieties',
    description: 'Recommended for warm and humid lowlands with an altitude range of 0-1250m above sea level with 400mm of rainfall.',
    imagePath: '',
    totalVarieties: 2,
    regions: ['Coastal strip: Malindi', 'Mtwapa', 'Mombasa', 'South Coast', 'Lake Basin regions'],
    color: '#FF9800',
    lastUpdated: '2024-01-12',
    status: 'active'
  },
  {
    id: 'dryland-varieties',
    name: 'Dryland Varieties',
    slug: 'dryland-varieties',
    description: 'Recommended for arid and marginal areas with 200-500mm of rainfall and altitude range of 500-1000m above sea level.',
    imagePath: '',
    totalVarieties: 4,
    regions: ['West Pokot', 'Kerio Valley', 'Nyanza', 'Early to medium transitional zones', 'Lowland areas'],
    color: '#795548',
    lastUpdated: '2024-01-11',
    status: 'active'
  },
  ],
  horticulture: [
    {
      id: 'cabbages',
      name: 'Cabbages',
      slug: 'cabbages',
      description: 'Premium cabbage varieties for fresh markets and export.',
      imagePath: '',
      totalVarieties: 7,
      regions: ['Nairobi', 'Nakuru', 'Uasin Gishu', 'Trans Nzoia'],
      color: '#4CAF50',
      lastUpdated: '2024-01-15',
      status: 'active'
    },
    {
      id: 'brassicas',
      name: 'Brassicas',
      slug: 'brassicas',
      description: 'Varieties including cauliflower, broccoli, collards, and kale for nutritional and culinary use.',
      imagePath: '',
      totalVarieties: 6,
      regions: ['Nairobi', 'Nakuru', 'Uasin Gishu', 'Trans Nzoia'],
      color: '#FF9800',
      lastUpdated: '2024-01-15',
      status: 'active'
    },
    {
      id: 'tomatoes',
      name: 'Tomatoes',
      slug: 'tomatoes',
      description: 'Premium tomato varieties for fresh markets and processing.',
      imagePath: '',
      totalVarieties: 5,
      regions: ['Nairobi', 'Nakuru', 'Uasin Gishu', 'Trans Nzoia'],
      color: '#F44336',
      lastUpdated: '2024-01-15',
      status: 'active'
    },
    {
      id: 'root-crops',
      name: 'Root Crops',
      slug: 'root-crops',
      description: 'Durable root crops for storage and varied soil conditions.',
      imagePath: '',
      totalVarieties: 5,
      regions: ['Nairobi', 'Nakuru', 'Uasin Gishu', 'Trans Nzoia'],
      color: '#795548',
      lastUpdated: '2024-01-15',
      status: 'active'
    },
    {
      id: 'onions-leeks',
      name: 'Onions/Leeks',
      slug: 'onions-leeks',
      description: 'Onion and leek varieties for flavor and storage.',
      imagePath: '',
      totalVarieties: 5,
      regions: ['Nairobi', 'Nakuru', 'Uasin Gishu', 'Trans Nzoia'],
      color: '#9C27B0',
      lastUpdated: '2024-01-15',
      status: 'active'
    },
    {
      id: 'watermelon-melons',
      name: 'Watermelon/Melons',
      slug: 'watermelon-melons',
      description: 'Sweet and juicy watermelon and melon varieties.',
      imagePath: '',
      totalVarieties: 4,
      regions: ['Nairobi', 'Nakuru', 'Uasin Gishu', 'Trans Nzoia'],
      color: '#E91E63',
      lastUpdated: '2024-01-15',
      status: 'active'
    },
    {
      id: 'cucurbits',
      name: 'Cucurbits',
      slug: 'cucurbits',
      description: 'Varieties of squash, pumpkin, cucumber, and related crops.',
      imagePath: '',
      totalVarieties: 5,
      regions: ['Nairobi', 'Nakuru', 'Uasin Gishu', 'Trans Nzoia'],
      color: '#8BC34A',
      lastUpdated: '2024-01-15',
      status: 'active'
    },
    {
      id: 'capsicums',
      name: 'Capsicums',
      slug: 'capsicums',
      description: 'Sweet and hot pepper varieties for fresh markets and export.',
      imagePath: '',
      totalVarieties: 4,
      regions: ['Nairobi', 'Nakuru', 'Uasin Gishu', 'Trans Nzoia'],
      color: '#FF5722',
      lastUpdated: '2024-01-15',
      status: 'active'
    },
    {
      id: 'herbs-others',
      name: 'Herbs & Others',
      slug: 'herbs-others',
      description: 'Herbs and other specialty crops for culinary and medicinal use.',
      imagePath: '',
      totalVarieties: 7,
      regions: ['Nairobi', 'Nakuru', 'Uasin Gishu', 'Trans Nzoia'],
      color: '#607D8B',
      lastUpdated: '2024-01-15',
      status: 'active'
    }
  ],
  legumes: [
    {
      id: 'beans',
      name: 'Beans',
      slug: 'beans',
      description: 'High-quality bean varieties for diverse climates and uses.',
      imagePath: '',
      totalVarieties: 4,
      regions: ['Medium altitude zones', 'Highland areas', 'Medium and dryland areas'],
      color: '#4CAF50',
      lastUpdated: '2024-01-15',
      status: 'active'
    },
    {
      id: 'greengrams',
      name: 'Greengrams',
      slug: 'greengrams',
      description: 'Drought-tolerant greengram varieties for arid areas.',
      imagePath: '',
      totalVarieties: 1,
      regions: ['Arid and semi-arid areas'],
      color: '#8BC34A',
      lastUpdated: '2024-01-15',
      status: 'active'
    },
    {
      id: 'peas',
      name: 'Peas',
      slug: 'peas',
      description: 'Dual-purpose pea varieties for fresh and dry use.',
      imagePath: '',
      totalVarieties: 3,
      regions: ['Medium and high altitude areas', 'Highland altitude'],
      color: '#FFC107',
      lastUpdated: '2024-01-15',
      status: 'active'
    },
    {
      id: 'cowpeas',
      name: 'Cowpeas',
      slug: 'cowpeas',
      description: 'Dual-purpose cowpea varieties for grain and leaf.',
      imagePath: '',
      totalVarieties: 1,
      regions: ['Arid and semi-arid areas'],
      color: '#FF9800',
      lastUpdated: '2024-01-15',
      status: 'active'
    }
  ],
  millet: [
    {
      id: 'finger-millet-seed-varieties',
      name: 'Finger Millet Seed Varieties',
      slug: 'finger-millet-seed-varieties',
      description: 'Finger millet varieties suitable for uplands in lowland and medium altitudes, offering tolerance to lodging, blast, and drought, with excellent milling quality.',
      imagePath: '',
      totalVarieties: 2,
      regions: ['Lowland areas', 'Medium altitudes'],
      color: '#8BC34A',
      lastUpdated: '2024-01-15',
      status: 'active'
    }
  ],
  pasture: [
    {
      id: 'pasture-seed-varieties',
      name: 'Pasture Seed Varieties',
      slug: 'pasture-seed-varieties',
      description: 'These varieties perform well at various altitudes and are suited for diverse farming conditions.',
      imagePath: '',
      totalVarieties: 10,
      regions: ['Various altitudes', 'Diverse farming conditions'],
      color: '#795548',
      lastUpdated: '2024-01-15',
      status: 'active'
    }
  ],
  rice: [
    {
      id: 'nerica-rice-seed-varieties',
      name: 'NERICA Rice Seed Varieties',
      slug: 'nerica-rice-seed-varieties',
      description: 'Upland rice varieties developed for African conditions, offering high yields, disease tolerance, and adaptability to rainfed environments.',
      imagePath: '',
      totalVarieties: 4,
      regions: ['Western Kenya', 'Central Kenya', 'Coastal regions', 'Medium altitude areas'],
      color: '#2196F3',
      lastUpdated: '2024-01-15',
      status: 'active'
    }
  ],
  sorghum: [
    {
      id: 'sorghum-seed-varieties',
      name: 'Sorghum Seed Varieties',
      slug: 'sorghum-seed-varieties',
      description: 'Sorghum varieties that perform well in mid-altitude regions, semi-arid lowlands, coastal strips, and widely adaptable areas, suitable for food, malting, milling, and dual-purpose use.',
      imagePath: '',
      totalVarieties: 4,
      regions: ['Mid altitude regions', 'Semi-arid lowlands', 'Coastal strip'],
      color: '#9C27B0',
      lastUpdated: '2024-01-15',
      status: 'active'
    }
  ],
  sunflower: [
    {
      id: 'sunflower-seed-varieties',
      name: 'Sunflower Seed Varieties',
      slug: 'sunflower-seed-varieties',
      description: 'High-yielding sunflower varieties optimized for oil production and adaptability to medium and high altitude regions, with excellent disease tolerance.',
      imagePath: '',
      totalVarieties: 3,
      regions: ['Medium to high altitude areas'],
      color: '#FFC107',
      lastUpdated: '2024-01-15',
      status: 'active'
    }
  ],
  wheat: [
    {
      id: 'hybrid-wheat-varieties',
      name: 'Hybrid Wheat Varieties',
      slug: 'hybrid-wheat-varieties',
      description: 'Premium hybrid wheat varieties optimized for Kenya\'s diverse agro-ecological zones, ensuring high yields, disease resistance, and excellent baking qualities.',
      imagePath: '',
      totalVarieties: 9,
      regions: ['Mount Kenya', 'Samburu', 'Laikipia West', 'Narok', 'Subukia', 'Rongai', 'Nyandarua', 'Nakuru', 'Trans Nzoia', 'Kericho', 'Bomet', 'Uasin Gishu'],
      color: '#8D6E63',
      lastUpdated: '2024-01-15',
      status: 'active'
    }
  ]
};

// Function to get categories for a product type
const getCategoriesForProduct = (productType: string): ProductCategory[] => {
  return productCategoriesData[productType] || [];
};

const ProductCategories: React.FC = () => {
  const { productType } = useParams<{ productType: string }>();
  const navigate = useNavigate();
  const [openEditDialog, setOpenEditDialog] = React.useState(false);
  const [editingCategory, setEditingCategory] = React.useState<ProductCategory | null>(null);
  const [categories, setCategories] = React.useState<ProductCategory[]>([]);
  
  // Image management state
  const [openImageDialog, setOpenImageDialog] = React.useState(false);
  const [editingImageCategory, setEditingImageCategory] = React.useState<ProductCategory | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = React.useState<File | null>(null);

  const handleEditCategory = (categorySlug: string) => {
    const category = categories.find(c => c.slug === categorySlug);
    if (category) {
      setEditingCategory(category);
      setOpenEditDialog(true);
    }
  };

  const handleManageCategory = (categorySlug: string) => {
    navigate(`/products/${productType}/categories/${categorySlug}/varieties`);
  };

  const handleViewCategory = (categorySlug: string) => {
    const category = categories.find(c => c.slug === categorySlug);
    if (category) {
      alert(`Viewing ${category.name}: ${category.description}`);
    }
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    setOpenEditDialog(true);
  };

  const handleDeleteCategory = async (categorySlug: string) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        const category = categories.find(c => c.slug === categorySlug);
        if (category) {
          // Delete from database
          await deleteCategory(parseInt(category.id));
          
          // Remove from local state
          setCategories(prev => prev.filter(c => c.slug !== categorySlug));
          
          alert('Category deleted successfully from database!');
        }
      } catch (error) {
        console.error('Error deleting category from database:', error);
        alert('Error deleting category from database. Please try again.');
      }
    }
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setEditingCategory(null);
  };

  const handleSaveCategory = async () => {
    if (editingCategory && productType) {
      try {
        // Get the product ID from database
        const product = await getProduct(productType);
        if (!product) {
          alert('Product not found');
          return;
        }
        const productId = product.id;

        const categoryData = {
          product_id: parseInt(productId),
          name: editingCategory.name,
          slug: editingCategory.slug,
          description: editingCategory.description,
          total_varieties: editingCategory.totalVarieties || 0,
          regions: editingCategory.regions || [],
          color: editingCategory.color,
          last_updated: new Date().toISOString().split('T')[0],
          status: 'active'
        };

        // Save to database
        const savedCategory = await createOrUpdateCategory(categoryData);
        
        if (editingCategory.id) {
          // Update existing category in local state
          setCategories(prev => prev.map(c => c.id === editingCategory.id ? { ...editingCategory, ...savedCategory } : c));
        } else {
          // Add new category to local state
          const newCategory = {
            ...editingCategory,
            id: savedCategory.id.toString(),
            lastUpdated: new Date().toISOString().split('T')[0],
            status: 'active' as const
          };
          setCategories(prev => [...prev, newCategory]);
        }
        
        alert('Category saved successfully to database!');
        handleCloseEditDialog();
      } catch (error) {
        console.error('Error saving category to database:', error);
        alert('Error saving category to database. Please try again.');
      }
    }
  };

  // Image management functions
  const handleEditImage = (categorySlug: string) => {
    const category = categories.find(c => c.slug === categorySlug);
    if (category) {
      setEditingImageCategory(category);
      // Set preview to the API URL with a timestamp to avoid caching
      setImagePreview(category.id ? `${getCategoryImageUrl(category.id)}?t=${Date.now()}` : null);
      setSelectedImageFile(null);
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
    console.log('[FRONTEND] handleSaveImage called');
    console.log('[FRONTEND] Category:', editingImageCategory);
    console.log('[FRONTEND] Selected file:', selectedImageFile);
    
    if (!editingImageCategory || !selectedImageFile) {
      console.warn('[FRONTEND] Missing category or file');
      return;
    }

    try {
      console.log('[FRONTEND] Starting image upload...');
      console.log('🆔 [FRONTEND] Category ID:', editingImageCategory.id);
      console.log('[FRONTEND] File details:', {
        name: selectedImageFile.name,
        size: selectedImageFile.size,
        type: selectedImageFile.type
      });
      
      // Upload image to database via API
      const uploadResult = await uploadCategoryImage(editingImageCategory.id, selectedImageFile);
      console.log('[FRONTEND] Upload API response:', uploadResult);
      
      // Generate a cache-busting timestamp
      const timestamp = Date.now();
      const imageUrlWithTimestamp = `${getCategoryImageUrl(editingImageCategory.id)}?t=${timestamp}`;
      console.log('[FRONTEND] Generated image URL:', imageUrlWithTimestamp);
      
      // Update local state to show the new image immediately
      console.log('[FRONTEND] Updating local state...');
      setCategories(prev => prev.map(c => 
        c.id === editingImageCategory.id 
          ? { ...c, imageData: imageUrlWithTimestamp, imagePath: imageUrlWithTimestamp, imageFile: selectedImageFile }
          : c
      ));
      console.log('[FRONTEND] Local state updated');

      // Show success message
      alert('Image uploaded successfully!');
      setOpenImageDialog(false);
      setEditingImageCategory(null);
      setImagePreview(null);
      setSelectedImageFile(null);
      
      // Reload categories to get fresh data with cache-busting
      console.log('[FRONTEND] Reloading categories from database...');
      if (productType) {
        const dbCategories = await getCategories(productType);
        console.log('[FRONTEND] Categories loaded:', dbCategories.length);
        
        const reloadTimestamp = Date.now();
        const formattedCategories = dbCategories.map((category: any) => ({
          id: category.id.toString(),
          name: category.name,
          slug: category.slug,
          description: category.description || '',
          totalVarieties: category.totalVarieties || 0,
          regions: category.regions || [],
          color: category.color || '#4CAF50',
          lastUpdated: category.lastUpdated || new Date().toISOString().split('T')[0],
          status: category.status || 'active',
          imageData: category.id ? `${getCategoryImageUrl(category.id)}?t=${reloadTimestamp}` : undefined,
          imagePath: category.id ? `${getCategoryImageUrl(category.id)}?t=${reloadTimestamp}` : ''
        }));
        setCategories(formattedCategories);
        console.log('[FRONTEND] Categories state refreshed');
      }
    } catch (error) {
      console.error('[FRONTEND] Error uploading image:', error);
      alert('Error uploading image. Please try again.');
    }
  };

  const handleDeleteImage = async () => {
    if (!editingImageCategory) return;

    try {
      // Delete from database via API
      await deleteCategoryImage(editingImageCategory.id);
      
      // Update local state to reflect database changes
      setCategories(prev => prev.map(c => 
        c.id === editingImageCategory.id 
          ? { ...c, imageData: undefined, imageFile: undefined, imagePath: '' }
          : c
      ));

      // Show success message
      alert('Image deleted successfully!');
      setOpenImageDialog(false);
      setEditingImageCategory(null);
      setImagePreview(null);
      setSelectedImageFile(null);
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Error deleting image. Please try again.');
    }
  };

  const handleCloseImageDialog = () => {
    setOpenImageDialog(false);
    setEditingImageCategory(null);
    setImagePreview(null);
    setSelectedImageFile(null);
  };

  // Load categories from database
  React.useEffect(() => {
    const loadCategoriesFromDatabase = async () => {
      if (productType) {
        try {
          console.log('Loading categories from database for:', productType);
          const dbCategories = await getCategories(productType);
          console.log('Found categories from database:', dbCategories);
          
          // Generate timestamp for cache-busting
          const timestamp = Date.now();
          
          // Convert database format to frontend format
          const formattedCategories = dbCategories.map((category: any) => ({
            id: category.id.toString(),
            name: category.name,
            slug: category.slug,
            description: category.description || '',
            totalVarieties: category.totalVarieties || 0,
            regions: category.regions || [],
            color: category.color || '#4CAF50',
            lastUpdated: category.lastUpdated || new Date().toISOString().split('T')[0],
            status: category.status || 'active',
            imageData: category.id ? `${getCategoryImageUrl(category.id)}?t=${timestamp}` : undefined,
            imagePath: category.id ? `${getCategoryImageUrl(category.id)}?t=${timestamp}` : ''
          }));
          
          setCategories(formattedCategories);
        } catch (error) {
          console.error('Error loading categories from database:', error);
          // Fallback to static data if database fails
          const productCategories = getCategoriesForProduct(productType);
          setCategories(productCategories);
        }
      }
    };

    loadCategoriesFromDatabase();
  }, [productType]);

  // Load images from database as primary source when component mounts
  React.useEffect(() => {
    const loadImagesFromDatabase = async () => {
      try {
        const categoryIds = categories.map(c => c.id);
        const imageMap = await loadProductImages(categoryIds);
        
        // Update categories with database image data (primary source)
        setCategories(prev => prev.map(category => {
          const dbImageData = imageMap.get(category.id);
          if (dbImageData) {
            // Database is primary source - use database image data
            return {
              ...category,
              imageData: dbImageData.imageData,
              imagePath: dbImageData.localPath || category.imagePath
            };
          }
          // No database image - keep original category data
          return category;
        }));
      } catch (error) {
        console.error('Error loading images from database:', error);
        // Fallback: continue with original category data if database fails
      }
    };
    loadImagesFromDatabase();
  }, []); // Only run on mount

  const handleBack = () => {
    navigate('/products');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link
          component="button"
          variant="body1"
          onClick={handleBack}
          sx={{ textDecoration: 'none' }}
        >
          Products
        </Link>
        <Typography color="text.primary" sx={{ textTransform: 'capitalize' }}>
          {productType} Categories
        </Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            {productType?.charAt(0).toUpperCase()}{productType?.slice(1)} Categories
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage categories and varieties for {productType} products. Click "Edit" to modify category details or "Manage" to edit varieties.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddCategory}
        >
          Add Category
        </Button>
      </Box>

      <Grid container spacing={3}>
        {categories.map((category) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={category.id}>
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
              {/* Category Image */}
              <Box
                sx={{
                  height: 180,
                  backgroundImage: category.imageData ? `url(${category.imageData})` : (category.imagePath && category.imagePath !== '') ? `url(${category.imagePath})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  position: 'relative',
                  backgroundColor: category.color + '20', // Fallback color with opacity
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
                {/* Category Status Badge */}
                <Chip
                  label={category.status}
                  color={category.status === 'active' ? 'success' : 'default'}
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    backgroundColor: category.status === 'active' ? 'rgba(76, 175, 80, 0.9)' : 'rgba(158, 158, 158, 0.9)',
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                />

                {/* Image Edit Button */}
                <IconButton
                  onClick={() => handleEditImage(category.slug)}
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
                {!category.imageData && (!category.imagePath || category.imagePath === '') && (
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
                      bgcolor: category.color,
                      width: 48,
                      height: 48,
                      mr: 2,
                    }}
                  >
                    {category.name.charAt(0)}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="h2" gutterBottom>
                      {category.name}
                    </Typography>
                  <Chip 
                    label={category.status} 
                      color={category.status === 'active' ? 'success' : 'default'}
                    size="small" 
                  />
                </Box>
              </Box>

                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ mb: 2, minHeight: 60 }}
                >
                  {category.description}
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Varieties:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {category.totalVarieties}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Regions:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {category.regions.length}
                  </Typography>
                </Box>

                <Typography variant="caption" color="text.secondary">
                  Last updated: {category.lastUpdated}
                </Typography>
              </CardContent>

              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => handleEditCategory(category.slug)}
                  size="small"
                  sx={{ flexGrow: 1 }}
                >
                  Edit
                </Button>
                  <Button
                    variant="contained"
                  startIcon={<ManageIcon />}
                  onClick={() => handleManageCategory(category.slug)}
                  size="small"
                  sx={{ flexGrow: 1, ml: 1 }}
                >
                  Manage
                </Button>
                <Tooltip title="View Category">
                  <IconButton
                    onClick={() => handleViewCategory(category.slug)}
                    size="small"
                  >
                    <ViewIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete Category">
                    <IconButton
                    onClick={() => handleDeleteCategory(category.slug)}
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

      {/* Edit/Add Category Dialog */}
      <Dialog open={openEditDialog} onClose={handleCloseEditDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingCategory ? 'Edit Category' : 'Add New Category'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
          <TextField
                fullWidth
            label="Category Name"
                value={editingCategory?.name || ''}
                onChange={(e) => setEditingCategory({
                  ...editingCategory!,
                  name: e.target.value,
                  slug: e.target.value.toLowerCase().replace(/\s+/g, '-')
                })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
            fullWidth
                label="Slug"
                value={editingCategory?.slug || ''}
                onChange={(e) => setEditingCategory({
                  ...editingCategory!,
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
                value={editingCategory?.description || ''}
                onChange={(e) => setEditingCategory({
                  ...editingCategory!,
                  description: e.target.value
                })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Image Path"
                value={editingCategory?.imagePath || ''}
                onChange={(e) => setEditingCategory({
                  ...editingCategory!,
                  imagePath: e.target.value
                })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Color (Hex)"
                value={editingCategory?.color || ''}
                onChange={(e) => setEditingCategory({
                  ...editingCategory!,
                  color: e.target.value
                })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Total Varieties"
                type="number"
                value={editingCategory?.totalVarieties || 0}
                onChange={(e) => setEditingCategory({
                  ...editingCategory!,
                  totalVarieties: parseInt(e.target.value) || 0
                })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Regions (comma-separated)"
                value={editingCategory?.regions.join(', ') || ''}
                onChange={(e) => setEditingCategory({
                  ...editingCategory!,
                  regions: e.target.value.split(',').map(r => r.trim()).filter(r => r)
                })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={editingCategory?.status || 'active'}
                  label="Status"
                  onChange={(e) => setEditingCategory({
                    ...editingCategory!,
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
          <Button onClick={handleSaveCategory} variant="contained">
            {editingCategory ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image Management Dialog */}
      <Dialog 
        open={openImageDialog} 
        onClose={handleCloseImageDialog} 
        maxWidth="sm" 
        fullWidth 
        disableEnforceFocus
        disableAutoFocus
        disableRestoreFocus
      >
        <DialogTitle>
          Manage Image - {editingImageCategory?.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {/* Image Preview */}
            {imagePreview && (
              <Box sx={{ mb: 3, textAlign: 'center' }}>
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '300px',
                    objectFit: 'contain',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}
                />
              </Box>
            )}

            {/* File Upload */}
            <Box sx={{ mb: 2 }}>
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
          >
                  Choose Image
          </Button>
              </label>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
              Select an image to upload for this category
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseImageDialog}>Cancel</Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteImageIcon />}
            onClick={handleDeleteImage}
            disabled={!editingImageCategory?.imageData && (!editingImageCategory?.imagePath || editingImageCategory?.imagePath === '')}
          >
            Delete Image
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSaveImage}
            disabled={!selectedImageFile}
          >
            Save Image
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProductCategories;
