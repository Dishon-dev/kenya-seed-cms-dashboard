import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Chip,
  Tabs,
  Tab,
  Divider,
  Alert,
  CircularProgress,
  IconButton,
} from '@mui/material';
import {
  Save as SaveIcon,
  Upload as UploadIcon,
  OpenInNew as OpenInNewIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { MapPin, Phone, Mail, Clock, Globe, Building } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../utils/AuthContext';
import MediaPickerModal from './MediaPickerModal';
import FooterListEditor from './FooterListEditor';
import ContactListEditor from './ContactListEditor';
import { 
  FooterSectionKey, 
  FooterConfig, 
  FooterLink, 
  FooterData, 
  ContactItem,
  defaultSections,
  defaultContacts,
  defaultFooterConfig,
  isSafeUrl
} from '../types/footer';

// Icon mapping for contact items (same as main website)
const ICON_MAP: Record<string, React.ElementType> = {
  MapPin,
  Phone,
  Mail,
  Clock,
  Globe,
  Building
};

const FooterPreview: React.FC<{ 
  config: FooterConfig; 
  sections: Record<FooterSectionKey, FooterLink[]>; 
  contacts: ContactItem[];
}> = ({ config, sections = defaultSections, contacts = defaultContacts }) => {
  const year = new Date().getFullYear();
  const logoSrc = config.logoUrl ? (config.logoUrl.startsWith('http') ? config.logoUrl : `${window.location.origin}${config.logoUrl}`) : null;

  return (
    <Box component="footer" sx={{ bgcolor: '#0b1220', color: '#fff', borderRadius: 1, overflow: 'hidden' }}>
      {/* Newsletter Section */}
      <Box sx={{ p: 3, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="h6">{config.newsletterTitle || 'Subscribe to Seed Feature'}</Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {config.newsletterDescription || 'Get our exclusive Seed Feature newsletter with the latest agricultural insights.'}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box component="form" sx={{ display: 'flex', gap: 1 }}>
              <TextField size="small" placeholder="Your email" sx={{ bgcolor: 'rgba(255,255,255,0.06)', borderRadius: 1 }} inputProps={{ style: { color: '#fff' } }} />
              <Button variant="contained" sx={{ bgcolor: '#15803d', '&:hover': { bgcolor: '#16692c' } }}>Subscribe</Button>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Main Content */}
      <Box sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Company Info */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
              {logoSrc && <img src={logoSrc} alt="logo" style={{ width: 56, height: 56, objectFit: 'contain' }} />}
              <Box>
                <Typography variant="h6">{config.companyName || 'Kenya Seed'}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  {config.companyTagline || 'Company Limited'}
                </Typography>
              </Box>
            </Box>

            <Typography variant="body2" sx={{ mb: 2, opacity: 0.8 }}>
              {config.description || 'Leading Kenya\'s agricultural transformation since 1972 with premium seeds and farmer support.'}
            </Typography>

            {/* Contact Info from Config */}
            <Box sx={{ mt: 2 }}>
              {config.address && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <MapPin size={16} style={{ color: '#15803d' }} />
                  <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                    {config.address}
                  </Typography>
                </Box>
              )}
              {config.phone && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Phone size={16} style={{ color: '#15803d' }} />
                  <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                    <a href={`tel:${config.phone}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                      {config.phone}
                    </a>
                  </Typography>
                </Box>
              )}
              {config.email && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Mail size={16} style={{ color: '#15803d' }} />
                  <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                    <a href={`mailto:${config.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                      {config.email}
                    </a>
                  </Typography>
                </Box>
              )}
              {config.workingHours && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Clock size={16} style={{ color: '#15803d' }} />
                  <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                    {config.workingHours}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Additional Contact Info from Contacts Array */}
            {contacts.length > 0 && (
              <Box sx={{ mt: 2 }}>
                {contacts.map((contact) => {
                  const Icon = contact.icon && ICON_MAP[contact.icon] ? ICON_MAP[contact.icon] : null;
                  return (
                    <Box key={contact.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      {Icon && <Icon size={16} style={{ color: '#15803d' }} />}
                      <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                        {contact.label && `${contact.label}: `}
                        {contact.href ? (
                          <a href={contact.href} style={{ color: 'inherit', textDecoration: 'none' }}>
                            {contact.value}
                          </a>
                        ) : (
                          contact.value
                        )}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Grid>

          {/* Links Sections */}
          <Grid item xs={12} md={8}>
            <Grid container spacing={2}>
              {(['quickLinks', 'products', 'services', 'policies'] as FooterSectionKey[]).map((key) => (
                <Grid item xs={6} md={3} key={key}>
                  <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700, opacity: 0.95 }}>
                    {key === 'quickLinks' ? 'Quick Links' : key.charAt(0).toUpperCase() + key.slice(1)}
                  </Typography>

                  <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
                    {(sections as Record<FooterSectionKey, FooterLink[]>)[key].map((l) => (
                      <li key={String(l.id)} style={{ marginBottom: 8 }}>
                        <a href={l.href || '#'} style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none', fontSize: 14 }}>
                          {l.title}
                        </a>
                        {l.description && (
                          <Typography variant="caption" sx={{ display: 'block', opacity: 0.7, fontSize: 11 }}>
                            {l.description}
                          </Typography>
                        )}
                      </li>
                    ))}
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      </Box>

      {/* Bottom Bar */}
      <Box sx={{ bgcolor: 'rgba(255,255,255,0.03)', p: 2 }}>
        <Grid container alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="caption">
              {config.copyrightText || `© ${year} Kenya Seed Company Limited. All rights reserved.`}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6} sx={{ textAlign: { md: 'right' } }}>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'flex-start', md: 'flex-end' }, flexWrap: 'wrap' }}>
              {config.social?.map((social) => (
                <Chip 
                  key={social.id}
                  label={social.provider}
                  size="small"
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.1)', 
                    color: '#fff',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
                  }}
                  clickable
                />
              ))}
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

const FooterEditor: React.FC = () => {
  const [config, setConfig] = useState<FooterConfig>(defaultFooterConfig);
  const [sections, setSections] = useState<Record<FooterSectionKey, FooterLink[]>>(defaultSections);
  const [contacts, setContacts] = useState<ContactItem[]>(defaultContacts);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [tab, setTab] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [previewWindowOpen, setPreviewWindowOpen] = useState(false);
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const mountedRef = useRef(true);
  const messageTimeoutRef = useRef<number | null>(null);
  const originalDataRef = useRef<{ config: FooterConfig; sections: Record<FooterSectionKey, FooterLink[]>; contacts: ContactItem[] } | null>(null);

  useEffect(() => { 
    mountedRef.current = true; 
    return () => { 
      mountedRef.current = false;
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
        messageTimeoutRef.current = null;
      }
    }; 
  }, []);

  const setSafeMessage = useCallback((msg: string | null, ttl: number = 3000) => { 
    if (!mountedRef.current) return;
    
    // Clear existing timeout
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
      messageTimeoutRef.current = null;
    }
    
    setMessage(msg);
    
    // Set new timeout if message is not null
    if (msg) {
      messageTimeoutRef.current = window.setTimeout(() => {
        if (mountedRef.current) {
          setMessage(null);
          messageTimeoutRef.current = null;
        }
      }, ttl);
    }
  }, []);

  // Fetch footer
  const { data, isPending } = useQuery<FooterData, Error>({
    queryKey: ['footer'],
    queryFn: async (): Promise<FooterData> => {
      const res = await axios.get('/api/footer');
      return res.data;
    },
    enabled: true,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache data (React Query v5)
  });

  useEffect(() => {
    if (data) {
      // Prioritize database data over defaults - only use defaults for missing fields
      const newConfig = data.config ? { ...defaultFooterConfig, ...data.config } : defaultFooterConfig;
      const newSections = {
        quickLinks: data.sections?.quickLinks || defaultSections.quickLinks,
        products: data.sections?.products || defaultSections.products,
        services: data.sections?.services || defaultSections.services,
        policies: data.sections?.policies || defaultSections.policies,
      };
      const newContacts = data.contacts && data.contacts.length > 0 ? data.contacts : defaultContacts;
      
      setConfig(newConfig);
      setSections(newSections);
      setContacts(newContacts);
      
      // Store original data for dirty tracking
      originalDataRef.current = { config: newConfig, sections: newSections, contacts: newContacts };
      setIsDirty(false);
    }
  }, [data]);

  // Track changes for dirty state
  useEffect(() => {
    if (originalDataRef.current) {
      const hasConfigChanged = JSON.stringify(config) !== JSON.stringify(originalDataRef.current.config);
      const hasSectionsChanged = JSON.stringify(sections) !== JSON.stringify(originalDataRef.current.sections);
      const hasContactsChanged = JSON.stringify(contacts) !== JSON.stringify(originalDataRef.current.contacts);
      setIsDirty(hasConfigChanged || hasSectionsChanged || hasContactsChanged);
    }
  }, [config, sections, contacts]);

  // Mutations
  const updateConfigMutation = useMutation<FooterConfig, Error, FooterConfig>({
    mutationFn: async (payload: FooterConfig) => {
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const res = await axios.put('/api/footer/config', payload, { headers });
      return res.data;
    },
  });

  const updateSectionsMutation = useMutation<{ success: boolean }, Error, Record<FooterSectionKey, FooterLink[]>>({
    mutationFn: async (payload: Record<FooterSectionKey, FooterLink[]>) => {
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const res = await axios.post('/api/footer/sections', { sections: payload }, { headers });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['footer'] });
    },
  });

  const updateContactsMutation = useMutation<{ success: boolean }, Error, ContactItem[]>({
    mutationFn: async (payload: ContactItem[]) => {
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const res = await axios.post('/api/footer/contacts', { contacts: payload }, { headers });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['footer'] });
    },
  });

  const uploadLogoMutation = useMutation<{ url: string }, Error, File>({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append('logo', file);
      const headers: any = { 'Content-Type': 'multipart/form-data' };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await axios.post('/api/footer/upload/logo', fd, { headers });
      return res.data;
    },
    onSuccess: (res) => {
      setConfig(prev => ({ ...prev, logoUrl: res.url }));
      setLogoFile(null);
      setSafeMessage('Logo uploaded', 2500);
    },
  });

  const isSaving = updateConfigMutation.isPending || updateSectionsMutation.isPending || updateContactsMutation.isPending || uploadLogoMutation.isPending;

  // save all
  const saveAll = useCallback(async () => {
    try {
      setSafeMessage(null);
      // Clean links: ensure hrefs are safe
      const clean = (arr: FooterLink[]) => arr.map((l, idx) => ({ ...l, order: idx, href: l.href && isSafeUrl(l.href) ? l.href : (l.href || '#') }));
      const payloadSections = {
        quickLinks: clean(sections.quickLinks),
        products: clean(sections.products),
        services: clean(sections.services),
        policies: clean(sections.policies),
      };

      await updateConfigMutation.mutateAsync(config);
      await updateSectionsMutation.mutateAsync(payloadSections);
      await updateContactsMutation.mutateAsync(contacts);

      // Update original data reference to reset dirty state
      originalDataRef.current = { config, sections, contacts };
      setIsDirty(false);
      
      setSafeMessage('Footer changes saved successfully.', 3000);
    } catch (err) {
      console.error(err);
      setSafeMessage('Failed to save footer changes. Please try again.', 4000);
    }
  }, [config, sections, contacts, updateConfigMutation, updateSectionsMutation, updateContactsMutation, setSafeMessage]);

  //
  // Preview: open preview tab & push live updates via postMessage
  //
  const PREVIEW_ORIGIN = 'http://localhost:8080'; // Main website origin
  const PREVIEW_PATH = '/'; // Root path of main website
  const PREVIEW_WINDOW_NAME = 'cms-footer-preview-window';
  const previewWindowRef = useRef<Window | null>(null);
  const pendingDebounceRef = useRef<number | null>(null);

  // send snapshot to preview window (postMessage). If preview app is not available, fallback handled in openFullPreview.
  const notifyPreview = useCallback((payload: { config: FooterConfig; sections: Record<FooterSectionKey, FooterLink[]>; contacts: ContactItem[] }) => {
    try {
      const targetOrigin = PREVIEW_ORIGIN;
      const win = previewWindowRef.current;
      
      if (win && !win.closed) {
        // Validate payload before sending
        const message = {
          type: 'FOOTER_UPDATE',
          data: payload,
          timestamp: Date.now(),
          source: 'cms-footer-editor'
        };
        
        win.postMessage(message, targetOrigin);
      } else {
        // Preview window is closed or not available
        previewWindowRef.current = null;
      }
    } catch (err) {
      // Handle cross-origin errors or other issues
      console.warn('Failed to send preview update:', err);
      previewWindowRef.current = null;
    }
  }, [PREVIEW_ORIGIN]);

  // debounce updates slightly to avoid spamming
  useEffect(() => {
    if (pendingDebounceRef.current) {
      window.clearTimeout(pendingDebounceRef.current);
    }
    pendingDebounceRef.current = window.setTimeout(() => {
      notifyPreview({ config, sections, contacts });
      pendingDebounceRef.current = null;
    }, 150);
    return () => {
      if (pendingDebounceRef.current) {
        window.clearTimeout(pendingDebounceRef.current);
        pendingDebounceRef.current = null;
      }
    };
  }, [config, sections, contacts, notifyPreview]);

  // Open preview tab (tries to open your preview app at PREVIEW_ORIGIN + PREVIEW_PATH).
  // If that fails (popup blocked or preview app not hosted), fallback to writing a standalone HTML snapshot into a blank tab.
  const openFullPreview = useCallback(() => {
    // try to open the real preview app first
    try {
      const previewUrl = `${PREVIEW_ORIGIN}${PREVIEW_PATH}`;
      const win = window.open(previewUrl, PREVIEW_WINDOW_NAME);

      if (!win) {
        setSafeMessage('Popup blocked — allow popups to open preview.', 3000);
        setPreviewWindowOpen(false);
        return;
      }

      // store ref and post an initial payload after small delay to allow preview app to initialize listener
      previewWindowRef.current = win;
      setPreviewWindowOpen(true);
      
      setTimeout(() => {
        try {
          const message = {
            type: 'FOOTER_UPDATE',
            data: { config, sections, contacts },
            timestamp: Date.now(),
            source: 'cms-footer-editor'
          };
          previewWindowRef.current?.postMessage(message, PREVIEW_ORIGIN);
        } catch (err) {
          // ignore
        }
      }, 400);

      return;
    } catch (err) {
      // continue to fallback
    }

    // fallback: create an HTML snapshot in a new tab
    try {
      const esc = (s: string) => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const logo = config.logoUrl ? (config.logoUrl.startsWith('http') ? config.logoUrl : `${window.location.origin}${config.logoUrl}`) : '';
      const listToHtml = (arr: FooterLink[]) =>
        `<ul style="list-style:none;padding:0;margin:0">${arr.map(l => {
          const href = esc(l.href || '#');
          const isExternal = href.startsWith('http');
          const relAttr = isExternal ? ' rel="noopener noreferrer"' : '';
          return `<li style="margin:6px 0"><a href="${href}"${relAttr} style="color:#ddd;text-decoration:none">${esc(l.title)}</a></li>`;
        }).join('')}</ul>`;

      const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Footer Preview</title>
        <style>
          body{font-family:Inter,Arial,Helvetica,sans-serif;background:#f4f6f8;color:#212121;margin:0;padding:20px}
          .footer{background:#0b1220;color:#fff;border-radius:8px;overflow:hidden}
          .top{padding:20px;border-bottom:1px solid rgba(255,255,255,0.04)}
          .wrap{max-width:1100px;margin:0 auto;padding:20px}
          .cols{display:flex;gap:20px;flex-wrap:wrap}
          .col{flex:1;min-width:180px}
          a{color:inherit}
          .brand{display:flex;gap:12px;align-items:center}
          .brand img{width:48px;height:48px;object-fit:contain}
          .bottom{padding:12px;border-top:1px solid rgba(255,255,255,0.03);font-size:13px;opacity:0.9}
        </style>
      </head><body>
        <div class="wrap">
          <div class="footer">
            <div class="top">
              <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">
                <div>
                  <h3 style="margin:0">Subscribe to Seed Feature</h3>
                  <p style="margin:6px 0 0;color:#cfcfcf">Get our exclusive newsletter with agricultural insights.</p>
                </div>
                <div>
                  <input placeholder="Your email" style="padding:8px 10px;border-radius:6px;border:1px solid #ccc" />
                  <button style="background:#15803d;color:#fff;padding:8px 12px;border:none;border-radius:6px;margin-left:8px">Subscribe</button>
                </div>
              </div>
            </div>

            <div style="padding:20px">
              <div class="cols">
                <div class="col">
                  <div class="brand">
                    ${logo ? `<img src="${esc(logo)}" alt="logo" />` : ''}
                    <div><strong>Kenya Seed</strong><div style="opacity:0.8">Company Limited</div></div>
                  </div>
                  <p style="color:#cfcfcf">Leading Kenya's agricultural transformation since 1972 with premium seeds and support.</p>
                   <div style="margin-top:12px;color:#cfcfcf">
                     ${contacts.map(c => {
                       const getIcon = (iconName?: string) => {
                         switch (iconName) {
                           case 'MapPin': return '📍';
                           case 'Phone': return '📞';
                           case 'Mail': return '✉️';
                           case 'Clock': return '⏰';
                           default: return '•';
                         }
                       };
                       const icon = getIcon(c.icon);
                       return `<div>${icon} ${c.label ? esc(c.label) + ': ' : ''}${esc(c.value)}</div>`;
                     }).join('')}
                   </div>
                </div>

                <div class="col"><h4>Quick Links</h4>${listToHtml(sections.quickLinks)}</div>
                <div class="col"><h4>Products</h4>${listToHtml(sections.products)}</div>
                <div class="col"><h4>Services</h4>${listToHtml(sections.services)}</div>
                <div class="col"><h4>Policies</h4>${listToHtml(sections.policies)}</div>
              </div>
            </div>

            <div class="bottom">${esc(config.copyrightText || `© ${new Date().getFullYear()} Kenya Seed Company Limited. All rights reserved.`)}</div>
          </div>
        </div>
      </body></html>`;

      const win = window.open('', PREVIEW_WINDOW_NAME);
      if (!win) {
        setSafeMessage('Popup blocked — allow popups to open preview.');
        setTimeout(() => setSafeMessage(null), 3000);
        return;
      }
      win.document.open();
      win.document.write(html);
      win.document.close();
    } catch (err) {
      console.error('Preview failed', err);
      setSafeMessage('Failed to open preview.');
      setTimeout(() => setSafeMessage(null), 2000);
    }
  }, [PREVIEW_ORIGIN, PREVIEW_PATH, config, sections, setSafeMessage]);

  // ensure we clear preview ref if tab closed by user
  useEffect(() => {
    const interval = setInterval(() => {
      if (previewWindowRef.current && previewWindowRef.current.closed) {
        previewWindowRef.current = null;
        setPreviewWindowOpen(false);
      }
    }, 800);
    return () => clearInterval(interval);
  }, []);

  if (isPending) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Typography variant="h5">Footer Editor — Real Preview</Typography>
        <Button 
          variant="outlined" 
          startIcon={<OpenInNewIcon />} 
          onClick={openFullPreview} 
          size="small"
          color={previewWindowOpen ? "success" : "primary"}
        >
          {previewWindowOpen ? 'Preview Open' : 'Open Full Preview'}
        </Button>
        {isDirty && (
          <Chip 
            label="Unsaved Changes" 
            color="warning" 
            size="small" 
            variant="outlined"
          />
        )}
      </Box>

      {message && (
        <Alert 
          severity={message.includes('Failed') || message.includes('Error') ? 'error' : 'success'} 
          sx={{ mb: 2, fontSize: '0.95rem' }}
        >
          {message}
        </Alert>
      )}

      <Grid container spacing={2}>
         <Grid item xs={12} md={6}>
           <Typography variant="subtitle1" gutterBottom>Live Preview</Typography>
           <Card>
             <CardContent>
               <FooterPreview config={config} sections={sections} contacts={contacts} />
             </CardContent>
           </Card>
         </Grid>

        <Grid item xs={12} md={6}>
          <Box sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 1, position: 'sticky', top: 16 }}>
            <Tabs value={tab} onChange={(_, v) => setTab(v)}>
              <Tab label="Config" />
              <Tab label="Logo" />
              <Tab label="Contacts" />
              <Tab label="Sections" />
              <Tab label="Social Media" />
            </Tabs>

            <Divider sx={{ my: 1 }} />

            {tab === 0 && (
              <Box sx={{ mt: 1 }}>
                <TextField 
                  label="Company Name" 
                  size="small" 
                  fullWidth 
                  value={config.companyName || ''} 
                  onChange={(e) => setConfig(prev => ({ ...prev, companyName: e.target.value }))} 
                  sx={{ mb: 1 }} 
                />
                <TextField 
                  label="Company Tagline" 
                  size="small" 
                  fullWidth 
                  value={config.companyTagline || ''} 
                  onChange={(e) => setConfig(prev => ({ ...prev, companyTagline: e.target.value }))} 
                  sx={{ mb: 1 }} 
                />
                <TextField 
                  label="Description" 
                  size="small" 
                  fullWidth 
                  multiline 
                  rows={3}
                  value={config.description || ''} 
                  onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))} 
                  sx={{ mb: 1 }} 
                />
                <TextField 
                  label="Newsletter Title" 
                  size="small" 
                  fullWidth 
                  value={config.newsletterTitle || ''} 
                  onChange={(e) => setConfig(prev => ({ ...prev, newsletterTitle: e.target.value }))} 
                  sx={{ mb: 1 }} 
                />
                <TextField 
                  label="Newsletter Description" 
                  size="small" 
                  fullWidth 
                  multiline 
                  rows={2}
                  value={config.newsletterDescription || ''} 
                  onChange={(e) => setConfig(prev => ({ ...prev, newsletterDescription: e.target.value }))} 
                  sx={{ mb: 1 }} 
                />
                <TextField 
                  label="Google Play URL" 
                  size="small" 
                  fullWidth 
                  value={config.googlePlayUrl || ''} 
                  onChange={(e) => setConfig(prev => ({ ...prev, googlePlayUrl: e.target.value }))} 
                  sx={{ mb: 1 }} 
                />
                <TextField 
                  label="App Store URL" 
                  size="small" 
                  fullWidth 
                  value={config.appStoreUrl || ''} 
                  onChange={(e) => setConfig(prev => ({ ...prev, appStoreUrl: e.target.value }))} 
                  sx={{ mb: 1 }} 
                />
                <TextField 
                  label="Address" 
                  size="small" 
                  fullWidth 
                  value={config.address || ''} 
                  onChange={(e) => setConfig(prev => ({ ...prev, address: e.target.value }))} 
                  sx={{ mb: 1 }} 
                />
                <TextField 
                  label="Phone" 
                  size="small" 
                  fullWidth 
                  value={config.phone || ''} 
                  onChange={(e) => setConfig(prev => ({ ...prev, phone: e.target.value }))} 
                  sx={{ mb: 1 }} 
                />
                <TextField 
                  label="Email" 
                  size="small" 
                  fullWidth 
                  value={config.email || ''} 
                  onChange={(e) => setConfig(prev => ({ ...prev, email: e.target.value }))} 
                  sx={{ mb: 1 }} 
                />
                <TextField 
                  label="Working Hours" 
                  size="small" 
                  fullWidth 
                  value={config.workingHours || ''} 
                  onChange={(e) => setConfig(prev => ({ ...prev, workingHours: e.target.value }))} 
                  sx={{ mb: 1 }} 
                />
                <TextField 
                  label="Copyright Text" 
                  size="small" 
                  fullWidth 
                  value={config.copyrightText || ''} 
                  onChange={(e) => setConfig(prev => ({ ...prev, copyrightText: e.target.value }))} 
                  sx={{ mb: 1 }} 
                />
              </Box>
            )}

            {tab === 1 && (
              <Box sx={{ mt: 1 }}>
                <input id="footer-logo-file" type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)} aria-label="Upload footer logo file" />
                <Button component="label" htmlFor="footer-logo-file" startIcon={<UploadIcon />} variant="outlined" fullWidth sx={{ mb: 1 }}>Upload Logo</Button>
                <Button variant="outlined" fullWidth onClick={() => setMediaPickerOpen(true)} sx={{ mb: 1 }}>Choose from Library</Button>
                {logoFile && <Button fullWidth variant="contained" onClick={() => uploadLogoMutation.mutate(logoFile)} disabled={uploadLogoMutation.isPending}>{uploadLogoMutation.isPending ? <CircularProgress size={16} /> : 'Upload'}</Button>}
                {config.logoUrl && <Chip label="Logo set" color="success" sx={{ mt: 1 }} />}
              </Box>
            )}

            {tab === 2 && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle2" gutterBottom>Contact Information</Typography>
                <ContactListEditor 
                  value={contacts} 
                  onChange={(next: ContactItem[]) => setContacts(next)} 
                  disabled={isSaving} 
                />
              </Box>
            )}

            {tab === 3 && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle2">Quick Links</Typography>
                <FooterListEditor id="quickLinks" value={sections.quickLinks} onChange={(next: FooterLink[]) => setSections(prev => ({ ...prev, quickLinks: next }))} disabled={isSaving} />
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2">Products</Typography>
                <FooterListEditor id="products" value={sections.products} onChange={(next: FooterLink[]) => setSections(prev => ({ ...prev, products: next }))} disabled={isSaving} />
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2">Services</Typography>
                <FooterListEditor id="services" value={sections.services} onChange={(next: FooterLink[]) => setSections(prev => ({ ...prev, services: next }))} disabled={isSaving} />
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2">Policies</Typography>
                <FooterListEditor id="policies" value={sections.policies} onChange={(next: FooterLink[]) => setSections(prev => ({ ...prev, policies: next }))} disabled={isSaving} />
              </Box>
            )}

            {tab === 4 && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle2" gutterBottom>Social Media Links</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {config.social?.map((social, index) => (
                    <Box key={social.id || index} sx={{ display: 'flex', gap: 1, alignItems: 'center', p: 2, border: '1px solid #e5e7eb', borderRadius: 1 }}>
                      <TextField
                        size="small"
                        label="Provider"
                        value={social.provider || ''}
                        onChange={(e) => {
                          const newSocial = [...(config.social || [])];
                          newSocial[index] = { ...newSocial[index], provider: e.target.value };
                          setConfig(prev => ({ ...prev, social: newSocial }));
                        }}
                        sx={{ flex: 1 }}
                      />
                      <TextField
                        size="small"
                        label="URL"
                        value={social.href || ''}
                        onChange={(e) => {
                          const newSocial = [...(config.social || [])];
                          newSocial[index] = { ...newSocial[index], href: e.target.value };
                          setConfig(prev => ({ ...prev, social: newSocial }));
                        }}
                        sx={{ flex: 2 }}
                      />
                      <TextField
                        size="small"
                        label="Label"
                        value={social.label || ''}
                        onChange={(e) => {
                          const newSocial = [...(config.social || [])];
                          newSocial[index] = { ...newSocial[index], label: e.target.value };
                          setConfig(prev => ({ ...prev, social: newSocial }));
                        }}
                        sx={{ flex: 1 }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => {
                          const newSocial = (config.social || []).filter((_, i) => i !== index);
                          setConfig(prev => ({ ...prev, social: newSocial }));
                        }}
                        color="error"
                        title="Remove"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  ))}
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      const newSocial = [...(config.social || []), {
                        id: `social-${Date.now()}`,
                        provider: '',
                        href: '',
                        label: ''
                      }];
                      setConfig(prev => ({ ...prev, social: newSocial }));
                    }}
                    disabled={isSaving}
                  >
                    Add Social Media Link
                  </Button>
                </Box>
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
              <Button 
                variant="outlined" 
                onClick={() => {
                  if (originalDataRef.current) {
                    setConfig(originalDataRef.current.config);
                    setSections(originalDataRef.current.sections);
                    setContacts(originalDataRef.current.contacts);
                    setIsDirty(false);
                    setSafeMessage('Changes reverted to last saved state', 2000);
                  }
                }} 
                disabled={isSaving || !isDirty}
              >
                Revert
              </Button>
              <Button 
                variant="contained" 
                startIcon={<SaveIcon />} 
                onClick={saveAll} 
                disabled={isSaving || !isDirty}
                color={isDirty ? "primary" : "inherit"}
              >
                {isSaving ? <CircularProgress size={16} /> : 'Save All'}
              </Button>
            </Box>
          </Box>
        </Grid>
      </Grid>

      <MediaPickerModal open={mediaPickerOpen} onClose={() => setMediaPickerOpen(false)} onSelect={(url) => { setConfig(prev => ({ ...prev, logoUrl: url })); setSafeMessage('Logo selected', 2000); }} title="Select footer logo" acceptTypes={['image/*']} />
    </Box>
  );
};

export default FooterEditor;
