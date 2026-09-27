// cms-dashboard/src/types/footer.ts
export type FooterSectionKey = 'quickLinks' | 'products' | 'services' | 'policies';

export interface ContactItem {
  id: string;
  type: 'address' | 'phone' | 'email' | 'hours' | 'custom';
  label?: string;           // e.g. "Head Office"
  value: string;            // e.g. "Mbegu Plaza, Kitale" or "+254 722 205 144"
  icon?: string;            // icon name (e.g. 'MapPin', 'Phone', 'Mail')
  href?: string;            // optional link (tel:, mailto:, or internal)
  order?: number;
}

export interface FooterLink {
  id: string | number;
  title: string;
  href?: string;
  description?: string;     // optional small description
  icon?: string;            // optional icon name
  order?: number;
}

export interface FooterConfig {
  companyName?: string;
  companyTagline?: string;
  description?: string;     // plain text or markdown
  address?: string;
  phone?: string;
  email?: string;
  workingHours?: string;
  newsletterTitle?: string;
  newsletterDescription?: string;
  googlePlayUrl?: string;
  appStoreUrl?: string;
  logoUrl?: string;
  copyrightText?: string;
  social?: { 
    id: string; 
    provider: string; 
    href: string;
    label?: string;
  }[];
}

export interface FooterData {
  config?: FooterConfig;
  sections?: Record<FooterSectionKey, FooterLink[]>;
  contacts?: ContactItem[];
}

// Default data
export const makeTempId = () => `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const defaultContacts: ContactItem[] = [
  { id: makeTempId(), type: 'address', icon: 'MapPin', value: 'Mbegu Plaza, Industrial Area Wamalwa Street, Kitale' },
  { id: makeTempId(), type: 'phone', icon: 'Phone', value: '+254 722 205 144', href: 'tel:+254722205144' },
  { id: makeTempId(), type: 'email', icon: 'Mail', value: 'info@kenyaseed.co.ke', href: 'mailto:info@kenyaseed.co.ke' },
  { id: makeTempId(), type: 'hours', icon: 'Clock', value: 'Mon - Fri: 8:00 AM - 5:00 PM' },
];

export const defaultSections: Record<FooterSectionKey, FooterLink[]> = {
  quickLinks: [
    { id: makeTempId(), title: 'Home', href: '/', order: 0 },
    { id: makeTempId(), title: 'About Us', href: '/about-overview', order: 1 },
    { id: makeTempId(), title: 'Contact', href: '/contact', order: 2 },
  ],
  products: [
    { id: makeTempId(), title: 'Maize', href: '/products/maize', order: 0 },
    { id: makeTempId(), title: 'Sunflower', href: '/products/sunflower', order: 1 },
  ],
  services: [
    { id: makeTempId(), title: 'Extension Services', href: '/farmers-first/training', order: 0 },
  ],
  policies: [
    { id: makeTempId(), title: 'Privacy', href: '/privacy', order: 0 },
    { id: makeTempId(), title: 'Terms', href: '/terms', order: 1 },
  ],
};

export const defaultFooterConfig: FooterConfig = {
  companyName: 'Kenya Seed',
  companyTagline: 'Company Limited',
  description: 'Leading Kenya\'s agricultural transformation since 1972 with premium quality seeds and comprehensive farmer support.',
  newsletterTitle: 'Subscribe to Seed Feature',
  newsletterDescription: 'Get our exclusive Seed Feature newsletter with the latest agricultural insights.',
  copyrightText: 'Kenya Seed Company Limited.',
  social: [
    { id: makeTempId(), provider: 'facebook', href: 'https://facebook.com/kenyaseed', label: 'Facebook' },
    { id: makeTempId(), provider: 'twitter', href: 'https://twitter.com/kenyaseed', label: 'Twitter' },
  ],
};

// URL validation helper
export const isSafeUrl = (url: string): boolean => {
  if (!url || url.trim() === '') return true;
  
  try {
    // Allow relative URLs (starting with /)
    if (url.startsWith('/')) {
      // Validate relative path format
      return /^\/[A-Za-z0-9\-/]*$/.test(url);
    }
    
    // For absolute URLs, use URL constructor for validation
    const urlObj = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return false;
    }
    
    // Additional security: check for suspicious patterns
    const suspiciousPatterns = [
      /javascript:/i,
      /data:/i,
      /vbscript:/i,
      /file:/i,
    ];
    
    return !suspiciousPatterns.some(pattern => pattern.test(url));
  } catch {
    return false;
  }
};

// Safe URL helper for rendering
export const safeUrl = (url?: string): string => {
  if (!url) return '';
  try {
    const parsed = new URL(url, window.location.origin);
    if (parsed.protocol === 'data:') return ''; // block data URIs
    if (!['http:', 'https:'].includes(parsed.protocol) && !url.startsWith('/')) return '';
    return parsed.href;
  } catch (err) {
    return '';
  }
};
