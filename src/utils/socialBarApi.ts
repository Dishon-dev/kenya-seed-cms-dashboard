import { withAuthFetch as fetch } from './authFetch';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5001';
const API_BASE_URL = `${API_BASE}/api`;

// Simple cache to prevent rapid API calls
let lastCallTime = 0;
const CACHE_DURATION = 1000; // 1 second cache
let cachedData: SocialBar | null = null;

export interface SocialLink {
  id: string;
  name: string;
  url: string;
  icon: string;
  color: string;
  hoverColor: string;
  order: number;
  isActive: boolean;
}

export interface SocialBarConfig {
  position: string;
  location: string;
  top: string;
  transform: string;
  zIndex: number;
  gap: string;
}

export interface SocialBar {
  id: number;
  title: string;
  description: string;
  config: SocialBarConfig;
  socials: SocialLink[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const getSocialBar = async (): Promise<SocialBar> => {
  const now = Date.now();
  
  // Return cached data if it's still fresh
  if (cachedData && (now - lastCallTime) < CACHE_DURATION) {
    return cachedData;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/social-bar`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      if (response.status === 429) {
        // Too many requests - wait and retry once
        await new Promise(resolve => setTimeout(resolve, 1000));
        const retryResponse = await fetch(`${API_BASE_URL}/social-bar`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (!retryResponse.ok) {
          throw new Error(`Failed to fetch social bar: ${retryResponse.status}`);
        }
        const data = await retryResponse.json();
        cachedData = data;
        lastCallTime = now;
        return data;
      }
      throw new Error(`Failed to fetch social bar: ${response.status}`);
    }
    
    const data = await response.json();
    cachedData = data;
    lastCallTime = now;
    return data;
  } catch (error) {
    console.error('Error fetching social bar:', error);
    throw error;
  }
};

export const createOrUpdateSocialBar = async (socialBarData: Partial<SocialBar>): Promise<SocialBar> => {
  const response = await fetch(`${API_BASE_URL}/social-bar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(socialBarData),
  });
  if (!response.ok) throw new Error('Failed to create/update social bar');
  return response.json();
};

export const updateSocialBarField = async (field: string, value: any): Promise<SocialBar> => {
  const response = await fetch(`${API_BASE_URL}/social-bar/${field}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value }),
  });
  if (!response.ok) throw new Error('Failed to update social bar field');
  return response.json();
};

export const addSocialLink = async (socialLink: Omit<SocialLink, 'id'>): Promise<SocialBar> => {
  const response = await fetch(`${API_BASE_URL}/social-bar/socials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(socialLink),
  });
  if (!response.ok) throw new Error('Failed to add social link');
  return response.json();
};

export const updateSocialLink = async (id: string, socialLink: Partial<SocialLink>): Promise<SocialBar> => {
  const response = await fetch(`${API_BASE_URL}/social-bar/socials/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(socialLink),
  });
  if (!response.ok) throw new Error('Failed to update social link');
  return response.json();
};

export const deleteSocialLink = async (id: string): Promise<SocialBar> => {
  const response = await fetch(`${API_BASE_URL}/social-bar/socials/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete social link');
  return response.json();
};
