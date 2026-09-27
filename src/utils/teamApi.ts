import { withAuthFetch as fetch } from './authFetch';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5001';
const API_BASE_URL = `${API_BASE}/api`;

export interface TeamMember {
  id?: number;
  name: string;
  position: string;
  image: string;
  bio: string;
  order_index?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export const getTeamMembers = async (): Promise<TeamMember[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/team`);
    if (!response.ok) {
      throw new Error(`Failed to fetch team members: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching team members:', error);
    throw error;
  }
};

export const getTeamMemberById = async (id: number): Promise<TeamMember> => {
  try {
    const response = await fetch(`${API_BASE_URL}/team/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch team member: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching team member:', error);
    throw error;
  }
};

export const createOrUpdateTeamMember = async (member: Partial<TeamMember>): Promise<TeamMember> => {
  try {
    const response = await fetch(`${API_BASE_URL}/team`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(member),
    });

    if (!response.ok) {
      throw new Error(`Failed to save team member: ${response.status}`);
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error saving team member:', error);
    throw error;
  }
};

export const updateTeamMember = async (id: number, member: Partial<TeamMember>): Promise<TeamMember> => {
  try {
    const response = await fetch(`${API_BASE_URL}/team/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(member),
    });

    if (!response.ok) {
      throw new Error(`Failed to update team member: ${response.status}`);
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error updating team member:', error);
    throw error;
  }
};

export const deleteTeamMember = async (id: number): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/team/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete team member: ${response.status}`);
    }
  } catch (error) {
    console.error('Error deleting team member:', error);
    throw error;
  }
};

export const uploadTeamMemberImage = async (id: number, file: File): Promise<{ success: boolean; imageUrl: string }> => {
  try {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${API_BASE_URL}/team-members/${id}/image`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload image: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error uploading team member image:', error);
    throw error;
  }
};
