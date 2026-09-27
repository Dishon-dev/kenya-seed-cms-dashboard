import { withAuthFetch as fetch } from './authFetch';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5001';
const API_BASE_URL = `${API_BASE}/api`;

export interface SubsidiaryMember {
  id?: string;
  name: string;
  position: string;
  image: string;
  bio: string;
  order?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SubsidiariesData {
  id?: string;
  hero: {
    title: string;
    subtitle: string;
  };
  section: {
    title: string;
    subtitle: string;
  };
  members: SubsidiaryMember[];
  isActive?: boolean;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
}

export const getSubsidiaries = async (): Promise<SubsidiariesData> => {
  try {
    const response = await fetch(`${API_BASE_URL}/subsidiaries`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch subsidiaries: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Error fetching subsidiaries:', error);
    throw error;
  }
};

export const createOrUpdateSubsidiaries = async (data: Partial<SubsidiariesData>): Promise<SubsidiariesData> => {
  try {
    const response = await fetch(`${API_BASE_URL}/subsidiaries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create/update subsidiaries: ${response.status}`);
    }
    
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error creating/updating subsidiaries:', error);
    throw error;
  }
};

export const updateSubsidiaries = async (id: string, data: Partial<SubsidiariesData>): Promise<SubsidiariesData> => {
  return createOrUpdateSubsidiaries(data);
};

export const deleteSubsidiaries = async (id: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/subsidiaries`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete subsidiaries: ${response.status}`);
    }
  } catch (error) {
    console.error('Error deleting subsidiaries:', error);
    throw error;
  }
};

export const uploadSubsidiaryMemberImage = async (id: number, file: File): Promise<{ success: boolean; imageUrl: string }> => {
  try {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${API_BASE_URL}/subsidiaries-members/${id}/image`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload image: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error uploading subsidiary member image:', error);
    throw error;
  }
};
