import { withAuthFetch as fetch } from './authFetch';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5001';
const API_BASE_URL = `${API_BASE}/api/database`;

// Product API calls
export const getProducts = async () => {
  const response = await fetch(`${API_BASE_URL}/products`);
  if (!response.ok) throw new Error('Failed to fetch products');
  return response.json();
};

export const getProduct = async (productType: string) => {
  const response = await fetch(`${API_BASE_URL}/products/${productType}`);
  if (!response.ok) throw new Error('Failed to fetch product');
  return response.json();
};

export const createOrUpdateProduct = async (productData: any) => {
  const response = await fetch(`${API_BASE_URL}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(productData)
  });
  if (!response.ok) throw new Error('Failed to save product');
  return response.json();
};

// Category API calls
export const getCategories = async (productType: string) => {
  const response = await fetch(`${API_BASE_URL}/products/${productType}/categories`);
  if (!response.ok) throw new Error('Failed to fetch categories');
  return response.json();
};

export const getCategory = async (productType: string, categorySlug: string) => {
  const response = await fetch(`${API_BASE_URL}/products/${productType}/categories/${categorySlug}`);
  if (!response.ok) throw new Error('Failed to fetch category');
  return response.json();
};

export const createOrUpdateCategory = async (categoryData: any) => {
  const response = await fetch(`${API_BASE_URL}/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(categoryData)
  });
  if (!response.ok) throw new Error('Failed to save category');
  return response.json();
};

// Variety API calls
export const getVarieties = async (productType: string, categorySlug: string) => {
  const response = await fetch(`${API_BASE_URL}/products/${productType}/categories/${categorySlug}/varieties`);
  if (!response.ok) throw new Error('Failed to fetch varieties');
  return response.json();
};

export const getVariety = async (productType: string, categorySlug: string, varietySlug: string) => {
  const response = await fetch(`${API_BASE_URL}/products/${productType}/categories/${categorySlug}/varieties/${varietySlug}`);
  if (!response.ok) throw new Error('Failed to fetch variety');
  return response.json();
};

export const createOrUpdateVariety = async (varietyData: any) => {
  const response = await fetch(`${API_BASE_URL}/varieties`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(varietyData)
  });
  if (!response.ok) throw new Error('Failed to save variety');
  return response.json();
};

// Delete API calls
export const deleteProduct = async (id: number) => {
  const response = await fetch(`${API_BASE_URL}/products/${id}`, {
    method: 'DELETE'
  });
  if (!response.ok) throw new Error('Failed to delete product');
  return response.json();
};

export const deleteCategory = async (id: number) => {
  const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
    method: 'DELETE'
  });
  if (!response.ok) throw new Error('Failed to delete category');
  return response.json();
};

export const deleteVariety = async (id: number) => {
  const response = await fetch(`${API_BASE_URL}/varieties/${id}`, {
    method: 'DELETE'
  });
  if (!response.ok) throw new Error('Failed to delete variety');
  return response.json();
};

// Category Image API calls
export const uploadCategoryImage = async (categoryId: string, imageFile: File) => {
  console.log('[API UTIL] uploadCategoryImage called');
  console.log('🆔 [API UTIL] Category ID:', categoryId);
  console.log('[API UTIL] Image file:', {
    name: imageFile.name,
    size: imageFile.size,
    type: imageFile.type
  });
  
  const formData = new FormData();
  formData.append('image', imageFile);
  console.log('[API UTIL] FormData created');

  const url = `${API_BASE_URL}/categories/${categoryId}/image`;
  console.log('[API UTIL] Request URL:', url);
  console.log('[API UTIL] Sending POST request...');
  
  const response = await fetch(url, {
    method: 'POST',
    body: formData
  });
  
  console.log('[API UTIL] Response status:', response.status, response.statusText);
  console.log('[API UTIL] Response ok:', response.ok);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('[API UTIL] Upload failed:', errorText);
    throw new Error('Failed to upload category image');
  }
  
  const result = await response.json();
  console.log('[API UTIL] Upload successful:', result);
  return result;
};

export const getCategoryImageUrl = (categoryId: string) => {
  return `${API_BASE_URL}/categories/${categoryId}/image`;
};

export const deleteCategoryImage = async (categoryId: string) => {
  const response = await fetch(`${API_BASE_URL}/categories/${categoryId}/image`, {
    method: 'DELETE'
  });
  if (!response.ok) throw new Error('Failed to delete category image');
  return response.json();
};
