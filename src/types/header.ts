// Strict TypeScript types for Header Editor

export type NavId = number | string;

export interface NavItem {
  id: NavId;
  title: string;
  href?: string;
  children?: NavItem[];
  order?: number;
  parentId?: NavId | null;
  // Admin-only props for future use
  meta?: Record<string, any>;
  archived?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface HeaderConfig {
  id?: number;
  logoUrl?: string;
  topPhone?: string;
  topEmail?: string;
  languages?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ConfirmDialogState {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

export interface MediaFile {
  id: string;
  filename: string;
  url: string;
  size: number;
  uploadedAt: string;
  type: string;
}

// API Response types
export interface HeaderApiResponse {
  config: HeaderConfig | null;
  nav: NavItem[];
}

export interface NavBulkResponse {
  success: boolean;
  nav: NavItem[];
}

export interface ConfigUpdateResponse extends HeaderConfig {}

export interface LogoUploadResponse {
  url: string;
}

// Component Props types
export interface HeaderEditorProps {
  // Future props can be added here
}

export interface RealHeaderPreviewProps {
  config: HeaderConfig;
  nav: NavItem[];
}

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  severity?: 'warning' | 'error' | 'info';
  loading?: boolean;
}

export interface MediaPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  title?: string;
  acceptTypes?: string[];
}

// Utility types
export type Direction = 'up' | 'down';
export type TemplateType = 'simple' | 'with-contact';
export type Severity = 'warning' | 'error' | 'info';

// Function return types
export type TreeManipulationResult = NavItem[];
export type MessageSetter = (msg: string | null) => void;
