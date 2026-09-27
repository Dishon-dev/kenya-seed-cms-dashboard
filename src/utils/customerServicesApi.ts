import { withAuthFetch } from './authFetch';

const API_BASE_URL = `${process.env.REACT_APP_API_BASE || 'http://localhost:5001'}/api`;

export interface CustomerService {
  id: string;
  title: string;
  description: string;
  image?: string;
  imageId?: number | string;
  link?: string;
  order: number;
  isActive: boolean;
}

export interface ServiceImageUploadResponse {
  success: boolean;
  imageId: number | string;
  imageUrl: string;
}

export const getCustomerServices = async (): Promise<CustomerService[]> => {
  const response = await fetch(`${API_BASE_URL}/services`);
  if (!response.ok) throw new Error('Failed to fetch customer services');
  const data = await response.json();
  return data.services || [];
};

export const getCustomerService = async (id: number): Promise<CustomerService> => {
  const response = await fetch(`${API_BASE_URL}/services`);
  if (!response.ok) throw new Error('Failed to fetch customer services');
  const data = await response.json();
  const service = data.services?.find((s: any) => s.id === id);
  if (!service) throw new Error('Customer service not found');
  return service;
};

export const createOrUpdateCustomerService = async (serviceData: Partial<CustomerService>): Promise<CustomerService> => {
  const isUpdate = !!serviceData.id;
  const url = isUpdate ? `${API_BASE_URL}/services/${serviceData.id}` : `${API_BASE_URL}/services`;
  const response = await withAuthFetch(url, {
    method: isUpdate ? 'PUT' : 'POST',
    headers: { 
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(serviceData),
  });
  if (!response.ok) throw new Error('Failed to create/update customer service');
  return response.json();
};

export const deleteCustomerService = async (id: string): Promise<void> => {
  const response = await withAuthFetch(`${API_BASE_URL}/services/${id}`, { method: 'DELETE' });
  if (!response.ok) throw new Error('Failed to delete customer service');
};

export const uploadCustomerServiceImage = async (id: string, imageFile: File): Promise<ServiceImageUploadResponse> => {
  const formData = new FormData();
  formData.append('image', imageFile);
  
  const response = await withAuthFetch(`${API_BASE_URL}/services/${id}/image`, {
    method: 'POST',
    body: formData
  });
  if (!response.ok) throw new Error('Failed to upload image');
  return response.json();
};
