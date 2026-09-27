import { withAuthFetch as fetch } from './authFetch';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5001';
const API_BASE_URL = `${API_BASE}/api`;

export interface CoreValue {
  title: string;
  description: string;
}

export interface OverviewData {
  id?: string;
  companyHistory: string;
  vision: string;
  mission: string;
  coreValues: CoreValue[];
  subsidiaries: string[];
  isActive?: boolean;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
}

export const getOverview = async (): Promise<OverviewData> => {
  try {
    const response = await fetch(`${API_BASE_URL}/overview`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch overview: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Error fetching overview:', error);
    throw error;
  }
};

export const createOrUpdateOverview = async (data: Partial<OverviewData>): Promise<OverviewData> => {
  try {
    const response = await fetch(`${API_BASE_URL}/overview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create/update overview: ${response.status}`);
    }
    
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error creating/updating overview:', error);
    throw error;
  }
};

export const updateOverview = async (id: string, data: Partial<OverviewData>): Promise<OverviewData> => {
  try {
    const response = await fetch(`${API_BASE_URL}/overview/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update overview: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Error updating overview:', error);
    throw error;
  }
};

export const deleteOverview = async (id: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/overview/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete overview: ${response.status}`);
    }
  } catch (error) {
    console.error('Error deleting overview:', error);
    throw error;
  }
};
