import { withAuthFetch as fetch } from './authFetch';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5001';
const API_BASE_URL = `${API_BASE}/api`;

export interface BranchNetworkDocument {
  id?: number;
  title: string;
  description: string;
  pdf_url?: string;
  pdf_data?: string; // Base64 encoded PDF
  pdf_mime_type?: string;
  pdf_filename?: string;
  is_active?: boolean;
  order_index?: number;
  created_at?: string;
  updated_at?: string;
}

export const getBranchNetwork = async (): Promise<BranchNetworkDocument> => {
  try {
    const response = await fetch(`${API_BASE_URL}/branch-network`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch branch network: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Error fetching branch network:', error);
    throw error;
  }
};

export const createOrUpdateBranchNetwork = async (data: Partial<BranchNetworkDocument>): Promise<BranchNetworkDocument> => {
  try {
    const response = await fetch(`${API_BASE_URL}/branch-network`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create/update branch network: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Error creating/updating branch network:', error);
    throw error;
  }
};

export const updateBranchNetwork = async (id: number, data: Partial<BranchNetworkDocument>): Promise<BranchNetworkDocument> => {
  try {
    const response = await fetch(`${API_BASE_URL}/branch-network/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update branch network: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Error updating branch network:', error);
    throw error;
  }
};

export const deleteBranchNetwork = async (id: number): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/branch-network/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete branch network: ${response.status}`);
    }
  } catch (error) {
    console.error('Error deleting branch network:', error);
    throw error;
  }
};

export const uploadBranchNetworkPDF = async (id: number, file: File): Promise<{ success: boolean; pdfUrl: string }> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE_URL}/upload/pdf`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`Failed to upload PDF: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Error uploading branch network PDF:', error);
    throw error;
  }
};
