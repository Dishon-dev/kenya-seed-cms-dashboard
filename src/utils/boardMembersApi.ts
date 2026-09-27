import { withAuthFetch as fetch } from './authFetch';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5001';
const API_BASE_URL = `${API_BASE}/api`;

export interface BoardMember {
  id: number;
  name: string;
  position: string;
  image: string;
  bio: string;
  is_chairperson?: boolean;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const getBoardMembers = async (): Promise<BoardMember[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/board-members`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch board members: ${response.status}`);
    }
    
    const data = await response.json();
    // The API returns {members: [...]}, so we need to extract the members array
    return data.members || [];
  } catch (error) {
    console.error('Error fetching board members:', error);
    throw error;
  }
};

export const getBoardMember = async (id: number): Promise<BoardMember> => {
  try {
    const response = await fetch(`${API_BASE_URL}/board-members/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch board member: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Error fetching board member:', error);
    throw error;
  }
};

export const createOrUpdateBoardMember = async (memberData: Partial<BoardMember>): Promise<BoardMember> => {
  try {
    const response = await fetch(`${API_BASE_URL}/board-members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(memberData),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create/update board member: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Error saving board member:', error);
    throw error;
  }
};

export const updateBoardMember = async (id: number, memberData: Partial<BoardMember>): Promise<BoardMember> => {
  try {
    const response = await fetch(`${API_BASE_URL}/board-members/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(memberData),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update board member: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Error updating board member:', error);
    throw error;
  }
};

export const deleteBoardMember = async (id: number): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/board-members/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete board member: ${response.status}`);
    }
  } catch (error) {
    console.error('Error deleting board member:', error);
    throw error;
  }
};

export const reorderBoardMembers = async (memberIds: number[]): Promise<BoardMember[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/board-members/reorder`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberIds }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to reorder board members: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Error reordering board members:', error);
    throw error;
  }
};

export const uploadBoardMemberImage = async (id: number, file: File): Promise<{ success: boolean; imageUrl: string }> => {
  try {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await fetch(`${API_BASE_URL}/board-members/${id}/image`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`Failed to upload image: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Error uploading board member image:', error);
    throw error;
  }
};
