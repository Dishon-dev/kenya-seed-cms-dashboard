import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5001';

export interface HeadOffice {
  id?: number;
  title?: string;
  address?: string;
  phone?: string;
  email?: string;
  working_hours?: string;
  is_active?: boolean;
}

export interface Subsidiary {
  id?: number;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  order_index?: number;
  is_active?: boolean;
}

export interface ContactSettings {
  id?: number;
  form_title?: string;
  form_subtitle?: string;
  email_recipient?: string;
  show_branches?: boolean;
  show_subsidiaries?: boolean;
  is_active?: boolean;
}

export interface ContactPayload {
  headOffice: HeadOffice | null;
  subsidiaries: Subsidiary[];
  settings: ContactSettings | null;
}

export async function getContact(): Promise<ContactPayload> {
  const res = await axios.get(`${API_BASE}/api/contact`);
  return res.data;
}

export async function updateHeadOffice(data: Partial<HeadOffice>) {
  const res = await axios.put(`${API_BASE}/api/contact/head-office`, data);
  return res.data;
}

export async function createSubsidiary(data: Subsidiary) {
  const res = await axios.post(`${API_BASE}/api/contact/subsidiaries`, data);
  return res.data;
}

export async function updateSubsidiary(id: number, data: Partial<Subsidiary>) {
  const res = await axios.put(`${API_BASE}/api/contact/subsidiaries/${id}`, data);
  return res.data;
}

export async function deleteSubsidiary(id: number) {
  const res = await axios.delete(`${API_BASE}/api/contact/subsidiaries/${id}`);
  return res.data;
}

export async function updateContactSettings(data: Partial<ContactSettings>) {
  const res = await axios.put(`${API_BASE}/api/contact/settings`, data);
  return res.data;
}





