//cms-dashboard/src/components/HeaderEditorWithRealPreview.tsx
import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  Tabs,
  Tab,
} from '@mui/material';
import ConfirmDialog from './ConfirmDialog';
import {
  Add as AddIcon,
  Save as SaveIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../utils/AuthContext';
import MediaPickerModal from './MediaPickerModal';
import NavTreeEditor from './NavTreeEditor';
import {
  NavId,
  NavItem,
  HeaderConfig,
  ConfirmDialogState,
  NavBulkResponse,
  ConfigUpdateResponse,
  LogoUploadResponse,
  RealHeaderPreviewProps,
  Direction,
  TemplateType,
  MessageSetter,
} from '../types/header';

const makeTempId = () => `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`;

// URL validation helper
const isSafeUrl = (url: string): boolean => {
  if (!url) return true; // Empty URLs are allowed
  // Allow relative paths starting with /
  if (/^\/[A-Za-z0-9\-/]*$/.test(url)) return true;
  // Allow http/https URLs
  if (/^https?:\/\/[A-Za-z0-9\-._~:/?#[\]@!$&'()*+,;=%]+$/.test(url)) return true;
  // Allow mailto: and tel: protocols
  if (/^(mailto:|tel:)[A-Za-z0-9\-._~:/?#[\]@!$&'()*+,;=%]+$/.test(url)) return true;
  return false;
};

// Helper to check nesting depth
const getMaxDepth = (items: NavItem[], currentDepth = 0): number => {
  let maxDepth = currentDepth;
  items.forEach(item => {
    if (item.children && item.children.length > 0) {
      const childDepth = getMaxDepth(item.children, currentDepth + 1);
      maxDepth = Math.max(maxDepth, childDepth);
    }
  });
  return maxDepth;
};

// Real Header Preview Component that mimics your actual Header structure
const RealHeaderPreview: React.FC<RealHeaderPreviewProps> = ({ config, nav }) => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [hoveredChild, setHoveredChild] = useState<string | null>(null);
  
  const languages = Array.isArray(config.languages) ? config.languages : [];
  const logoSrc = config.logoUrl
    ? (config.logoUrl.startsWith('http') ? config.logoUrl : `${window.location.origin}${config.logoUrl}`)
    : null;

  // Helper to render nested navigation items
  const renderNavItem = (item: NavItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isHovered = hoveredItem === String(item.id);
    const isChildHovered = hoveredChild === String(item.id);

    return (
      <Box 
        key={String(item.id)} 
        sx={{ 
          position: 'relative',
          display: 'inline-block'
        }}
        onMouseEnter={() => setHoveredItem(String(item.id))}
        onMouseLeave={() => {
          setHoveredItem(null);
          setHoveredChild(null);
        }}
      >
        <Typography 
          variant="body2" 
          sx={{ 
            color: level === 0 ? 'white' : '#ccc', 
            cursor: 'pointer',
            fontWeight: level === 0 ? 'bold' : 'normal',
            fontSize: level === 0 ? '0.9rem' : '0.8rem',
            '&:hover': { color: '#22c55e' },
            display: 'flex',
            alignItems: 'center',
            gap: 0.5
          }}
        >
          {item.title}
          {hasChildren && level === 0 && (
            <span style={{ 
              fontSize: '0.7rem', 
              marginLeft: '4px',
              transition: 'transform 0.2s ease',
              transform: isHovered ? 'rotate(180deg)' : 'rotate(0deg)'
            }}>
              ▼
            </span>
          )}
        </Typography>
        
        {/* Dropdown for top-level items with children */}
        {hasChildren && level === 0 && isHovered && (
          <Box sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            backgroundColor: 'rgba(0,0,0,0.9)',
            border: '1px solid #444',
            borderRadius: 1,
            minWidth: 200,
            zIndex: 1000,
            mt: 0.5,
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            py: 1
          }}>
            {item.children!.map((child) => (
              <Box
                key={String(child.id)}
                sx={{
                  position: 'relative',
                  '&:hover': { backgroundColor: 'rgba(34, 197, 94, 0.1)' }
                }}
                onMouseEnter={() => setHoveredChild(String(child.id))}
                onMouseLeave={() => setHoveredChild(null)}
              >
                <Box sx={{ px: 2, py: 1 }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#ccc',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      '&:hover': { color: '#22c55e' }
                    }}
                  >
                    {child.title}
                    {child.children && child.children.length > 0 && (
                      <span style={{ 
                        fontSize: '0.6rem', 
                        marginLeft: '4px',
                        transition: 'transform 0.2s ease',
                        transform: isChildHovered ? 'rotate(90deg)' : 'rotate(0deg)'
                      }}>
                        ▶
                      </span>
                    )}
                  </Typography>
                  
                  {/* Third-level dropdown */}
                  {child.children && child.children.length > 0 && isChildHovered && (
                    <Box sx={{
                      position: 'absolute',
                      top: 0,
                      left: '100%',
                      backgroundColor: 'rgba(0,0,0,0.95)',
                      border: '1px solid #555',
                      borderRadius: 1,
                      minWidth: 180,
                      zIndex: 1001,
                      ml: 0.5,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.7)',
                      py: 1
                    }}>
                      {child.children.map((grandChild) => (
                        <Box
                          key={String(grandChild.id)}
                          sx={{
                            px: 2,
                            py: 1,
                            '&:hover': { 
                              backgroundColor: 'rgba(34, 197, 94, 0.1)',
                              '& .MuiTypography-root': { color: '#22c55e' }
                            },
                            cursor: 'pointer'
                          }}
                        >
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: '#ccc',
                              fontSize: '0.75rem',
                              '&:hover': { color: '#22c55e' }
                            }}
                          >
                            {grandChild.title}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ 
      border: '1px solid #e5e7eb', 
      borderRadius: 1, 
      backgroundColor: '#1a1a1a',
      color: 'white',
      minHeight: 300,
      position: 'relative',
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Top Bar */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        py: 1,
        px: 2,
        fontSize: '0.75rem',
        backgroundColor: 'rgba(0,0,0,0.3)'
      }}>
        <Box sx={{ display: 'flex', gap: 3 }}>
          {config.topPhone && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <span>📞</span>
              <span>{config.topPhone}</span>
            </Box>
          )}
          {config.topEmail && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <span>✉️</span>
              <span>{config.topEmail}</span>
            </Box>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField
            size="small"
            placeholder="Search..."
            sx={{ 
              '& .MuiInputBase-root': { 
                backgroundColor: 'rgba(255,255,255,0.1)',
                color: 'white',
                '& input': { color: 'white' }
              }
            }}
          />
          <select style={{ 
            backgroundColor: 'transparent', 
            color: 'white', 
            border: 'none',
            fontSize: '0.75rem'
          }}>
            {languages.map(lang => (
              <option key={lang} value={lang} style={{ backgroundColor: '#1a1a1a' }}>
                {lang === 'en' ? 'English' : lang === 'sw' ? 'Swahili' : 'French'}
              </option>
            ))}
          </select>
        </Box>
      </Box>

      {/* Main Navigation */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        py: 2,
        px: 2,
        flex: 1
      }}>
        {/* Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {logoSrc && (
            <img src={logoSrc} alt="Logo" style={{ height: 32, width: 32 }} />
          )}
          <Box>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', lineHeight: 1 }}>
              Kenya Seed
            </Typography>
            <Typography variant="caption" sx={{ color: '#ccc', fontSize: '0.7rem' }}>
              Company Limited
            </Typography>
          </Box>
        </Box>

        {/* Navigation Links */}
        <Box sx={{ 
          display: 'flex', 
          gap: 3, 
          alignItems: 'center',
          flex: 1,
          justifyContent: 'center',
          px: 2
        }}>
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'white', 
              fontWeight: 'bold',
              cursor: 'pointer',
              '&:hover': { color: '#22c55e' }
            }}
          >
            Home
          </Typography>
          {nav.slice(0, 6).map((item) => renderNavItem(item, 0))}
          {nav.length > 6 && (
            <Typography variant="body2" sx={{ color: '#ccc' }}>
              +{nav.length - 6} more
            </Typography>
          )}
        </Box>

        {/* Contact Button */}
        <Button 
          variant="contained" 
          sx={{ 
            backgroundColor: '#15803d',
            '&:hover': { backgroundColor: '#16692c' },
            textTransform: 'none',
            fontWeight: 'bold'
          }}
        >
          Contact Us
        </Button>
      </Box>
    </Box>
  );
};

const HeaderEditorWithRealPreview: React.FC = () => {
  const [config, setConfig] = useState<HeaderConfig>({});
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [unsaved, setUnsaved] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  const queryClient = useQueryClient();
  const { token } = useAuth();
  const mountedRef = useRef(true);

  // Track component mount state
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Safe message setter that checks if component is still mounted
  const setSafeMessage: MessageSetter = useCallback((msg: string | null): void => {
    if (mountedRef.current) {
      setMessage(msg);
    }
  }, []);

  // Fetch header data
  const { data: headerData, isPending } = useQuery({
    queryKey: ['header'],
    queryFn: async () => {
      const response = await axios.get('/api/header');
      return response.data;
    },
    refetchOnWindowFocus: false,
  });

  // Function to build nested navigation from flat structure
  const buildNestedNav = useCallback((flatItems: any[]): NavItem[] => {
    const itemMap = new Map();
    const rootItems: NavItem[] = [];

    // First pass: create all items
    flatItems.forEach((item: any) => {
      const navItem: NavItem = {
        id: item.id ?? makeTempId(),
        title: item.title ?? '',
        href: item.href ?? '',
        children: [],
        order: item.order ?? 0,
        parentId: item.parentId ?? null,
      };
      itemMap.set(navItem.id, navItem);
    });

    // Second pass: build hierarchy
    flatItems.forEach((item: any) => {
      const navItem = itemMap.get(item.id);
      if (item.parentId) {
        const parent = itemMap.get(item.parentId);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(navItem);
        }
      } else {
        rootItems.push(navItem);
      }
    });

    // Sort children by order
    const sortByOrder = (items: NavItem[]): NavItem[] => {
      return items
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map(item => ({
          ...item,
          children: item.children ? sortByOrder(item.children) : []
        }));
    };

    return sortByOrder(rootItems);
  }, []);

  useEffect(() => {
    if (headerData) {
      setConfig(headerData.config || {});
      const nestedNav = buildNestedNav(headerData.nav || []);
      setNavItems(nestedNav);
      setUnsaved(false);
    }
  }, [headerData, buildNestedNav]);

  // Prevent navigation away with unsaved changes
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (unsaved) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [unsaved]);

  // Mutations
  const updateConfigMutation = useMutation<ConfigUpdateResponse, Error, HeaderConfig>({
    mutationFn: async (newConfig: HeaderConfig): Promise<ConfigUpdateResponse> => {
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const response = await axios.put('/api/header/config', newConfig, { headers });
      return response.data;
    },
    onSuccess: () => {
      setSafeMessage('Configuration saved');
      setTimeout(() => setSafeMessage(null), 3000);
    },
  });

  const updateNavMutation = useMutation<NavBulkResponse, Error, NavItem[]>({
    mutationFn: async (nav: NavItem[]): Promise<NavBulkResponse> => {
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const response = await axios.post('/api/header/nav/bulk', { nav }, { headers });
      return response.data;
    },
    onSuccess: (data: any) => {
      if (data?.nav) {
        const normalize = (items: any[]): NavItem[] =>
          items.map((it: any) => ({
            id: it.id ?? makeTempId(),
            title: it.title ?? '',
            href: it.href ?? '',
            children: Array.isArray(it.children) ? normalize(it.children) : [],
            order: it.order ?? 0,
            parentId: it.parentId ?? null,
          }));
        setNavItems(normalize(data.nav));
      }
      setUnsaved(false);
      queryClient.invalidateQueries({ queryKey: ['header'] });
      setSafeMessage('Navigation saved');
      setTimeout(() => setSafeMessage(null), 3000);
    },
    onError: () => {
      setSafeMessage('Failed to save navigation');
      setTimeout(() => setSafeMessage(null), 3000);
    },
  });

  const uploadLogoMutation = useMutation<LogoUploadResponse, Error, File>({
    mutationFn: async (file: File): Promise<LogoUploadResponse> => {
      const formData = new FormData();
      formData.append('logo', file);
      const headers: any = { 'Content-Type': 'multipart/form-data' };
      if (token) headers.Authorization = `Bearer ${token}`;
      const response = await axios.post('/api/header/upload/logo', formData, { headers });
      return response.data;
    },
    onSuccess: async (data) => {
      setConfig(prev => ({ ...prev, logoUrl: data.url }));
      setLogoFile(null);
      setLogoPreviewUrl(null);
      try {
        await axios.get('/api/header/logo', { responseType: 'blob' });
        setSafeMessage('Logo uploaded and saved');
      } catch {
        setSafeMessage('Logo uploaded, but verification failed');
      }
      setTimeout(() => setSafeMessage(null), 3000);
      queryClient.invalidateQueries({ queryKey: ['header'] });
    },
    onError: () => {
      setSafeMessage('Logo upload failed');
      setTimeout(() => setSafeMessage(null), 3000);
    },
  });

  // Derive isSaving from React Query mutations (single source of truth)
  const isSaving = updateConfigMutation.isPending || updateNavMutation.isPending || uploadLogoMutation.isPending;

  // Tree manipulation functions
  const addTopLevelItem = useCallback(() => {
    setNavItems(prev => {
      const newItem: NavItem = {
        id: makeTempId(),
        title: 'New Link',
        href: '/',
        children: [],
        order: prev.length,
        parentId: null,
      };
      setUnsaved(true);
      return [...prev, newItem];
    });
  }, []);

  const addChild = useCallback((parentId: NavId) => {
    // Check if adding a child would exceed max depth (maxAllowedDepth = 2 yields 3-level menu)
    const currentMaxDepth = getMaxDepth(navItems);
    const maxAllowedDepth = 2; // root=0, child=1, grandchild=2
    if (currentMaxDepth >= maxAllowedDepth) {
      setSafeMessage(`Maximum nesting depth (${maxAllowedDepth + 1} levels) reached. Cannot add more children.`);
      setTimeout(() => setSafeMessage(null), 3000);
      return;
    }

    const newItem: NavItem = {
      id: makeTempId(),
      title: 'New Link',
      href: '/',
      children: [],
      order: 0,
      parentId,
    };

    const addChildToTree = (items: NavItem[]): NavItem[] =>
      items.map(it => {
        if (it.id === parentId) {
          return { ...it, children: [...(it.children || []), newItem] };
        }
        if (it.children && it.children.length) {
          return { ...it, children: addChildToTree(it.children) };
        }
        return it;
      });

    setNavItems(prev => {
      const updated = addChildToTree(prev);
      setUnsaved(true);
      return updated;
    });
  }, [navItems, setSafeMessage]);

  const updateItem = useCallback((id: NavId, updates: Partial<NavItem>) => {
    const updateTree = (items: NavItem[]): NavItem[] =>
      items.map(it => {
        if (it.id === id) return { ...it, ...updates };
        if (it.children && it.children.length) return { ...it, children: updateTree(it.children) };
        return it;
      });

    setNavItems(prev => {
      const updated = updateTree(prev);
      setUnsaved(true);
      return updated;
    });
  }, []);

  const deleteItem = useCallback((id: NavId) => {
    // Find the item to get its title for the confirmation dialog
    const findItem = (items: NavItem[]): NavItem | null => {
      for (const item of items) {
        if (item.id === id) return item;
        if (item.children && item.children.length) {
          const found = findItem(item.children);
          if (found) return found;
        }
      }
      return null;
    };

    const itemToDelete = findItem(navItems);
    const itemTitle = itemToDelete?.title || 'this item';

    setConfirmDialog({
      open: true,
      title: 'Delete Navigation Item',
      message: `Are you sure you want to delete "${itemTitle}" and all its children? This action cannot be undone.`,
      onConfirm: () => {
        const deleteFromTree = (items: NavItem[]): NavItem[] => {
          return items
            .map(it => {
              if (it.id === id) return null;
              if (it.children && it.children.length) {
                return { ...it, children: deleteFromTree(it.children) };
              }
              return it;
            })
            .filter(Boolean) as NavItem[];
        };

        setNavItems(prev => {
          const updated = deleteFromTree(prev);
          setUnsaved(true);
          return updated;
        });

        setConfirmDialog(prev => ({ ...prev, open: false }));
      },
    });
  }, [navItems]);

  const moveItem = useCallback((id: NavId, direction: Direction): void => {
    const findAndMove = (items: NavItem[]): NavItem[] => {
      for (let i = 0; i < items.length; i++) {
        if (items[i].id === id) {
          const newItems = [...items];
          if (direction === 'up' && i > 0) {
            [newItems[i - 1], newItems[i]] = [newItems[i], newItems[i - 1]];
          } else if (direction === 'down' && i < items.length - 1) {
            [newItems[i], newItems[i + 1]] = [newItems[i + 1], newItems[i]];
          }
          return newItems;
        }
        const children = items[i].children;
        if (children && children.length > 0) {
          const updatedChildren = findAndMove(children);
          if (updatedChildren !== children) {
            return items.map((item, idx) => 
              idx === i ? { ...item, children: updatedChildren } : item
            );
          }
        }
      }
      return items;
    };

    setNavItems(prev => {
      const updated = findAndMove(prev);
      setUnsaved(true);
      return updated;
    });
  }, []);

  const indentItem = useCallback((id: NavId) => {
    // Check if indenting would exceed max depth (maxAllowedDepth = 2 yields 3-level menu)
    const currentMaxDepth = getMaxDepth(navItems);
    const maxAllowedDepth = 2; // root=0, child=1, grandchild=2
    if (currentMaxDepth >= maxAllowedDepth) {
      setSafeMessage(`Maximum nesting depth (${maxAllowedDepth + 1} levels) reached. Cannot indent further.`);
      setTimeout(() => setSafeMessage(null), 3000);
      return;
    }

    const findAndIndent = (items: NavItem[], parentId: NavId | null = null): NavItem[] => {
      for (let i = 0; i < items.length; i++) {
        if (items[i].id === id) {
          if (i > 0) {
            // Move this item as a child of the previous item
            const newItems = [...items];
            const itemToMove = newItems.splice(i, 1)[0];
            const targetParent = newItems[i - 1];
            newItems[i - 1] = {
              ...targetParent,
              children: [...(targetParent.children || []), { ...itemToMove, parentId: targetParent.id }]
            };
            return newItems;
          }
          return items; // Can't indent first item
        }
        const children = items[i].children;
        if (children && children.length > 0) {
          const updatedChildren = findAndIndent(children, items[i].id);
          if (updatedChildren !== children) {
            return items.map((item, idx) => 
              idx === i ? { ...item, children: updatedChildren } : item
            );
          }
        }
      }
      return items;
    };

    setNavItems(prev => {
      const updated = findAndIndent(prev);
      setUnsaved(true);
      return updated;
    });
  }, [navItems, setSafeMessage]);

  const outdentItem = useCallback((id: NavId) => {
    const findAndOutdent = (items: NavItem[]): NavItem[] => {
      for (let i = 0; i < items.length; i++) {
        const children = items[i].children;
        if (children && children.length > 0) {
          for (let j = 0; j < children.length; j++) {
            if (children[j].id === id) {
              // Move this child to the same level as its parent
              const newItems = [...items];
              const childToMove = newItems[i].children!.splice(j, 1)[0];
              newItems.splice(i + 1, 0, { ...childToMove, parentId: null });
              return newItems;
            }
          }
          const updatedChildren = findAndOutdent(children);
          if (updatedChildren !== children) {
            return items.map((item, idx) => 
              idx === i ? { ...item, children: updatedChildren } : item
            );
          }
        }
      }
      return items;
    };

    setNavItems(prev => {
      const updated = findAndOutdent(prev);
      setUnsaved(true);
      return updated;
    });
  }, []);

  const handleLogoUpload = useCallback(() => {
    if (!logoFile) return;
    uploadLogoMutation.mutate(logoFile);
  }, [logoFile, uploadLogoMutation]);

  useEffect(() => {
    if (!logoFile) {
      setLogoPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(logoFile);
    setLogoPreviewUrl(objectUrl);
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [logoFile]);

  const handleMediaSelect = useCallback((url: string) => {
    setConfig(prev => ({ ...prev, logoUrl: url }));
    setUnsaved(true);
    setSafeMessage('Logo selected from media library');
    setTimeout(() => setSafeMessage(null), 3000);
  }, [setSafeMessage]);

  const saveAll = useCallback(async () => {
    if (isSaving) return; // Prevent multiple saves
    
    // Validate URLs and flatten navigation for API
    const validateAndCleanNav = (items: NavItem[]): NavItem[] => {
      return items.map((it, idx) => ({
        ...it,
        order: idx,
        href: it.href && isSafeUrl(it.href) ? it.href : (it.href || '#'),
        children: it.children && it.children.length ? validateAndCleanNav(it.children) : []
      }));
    };

    // Flatten navigation data for API (similar to server-side flattenNav function)
    const flattenNav = (items: NavItem[], parentId: string | null = null): any[] => {
      const result: any[] = [];
      items.forEach((item, index) => {
        const flatItem = {
          id: String(item.id) || `nav-${Date.now()}-${Math.random()}`,
          title: item.title || '',
          href: item.href || '',
          order: item.order !== undefined ? item.order : index,
          parentId: parentId
        };
        result.push(flatItem);
        
        if (item.children && item.children.length > 0) {
          result.push(...flattenNav(item.children, flatItem.id));
        }
      });
      return result;
    };

    const validatedNav = validateAndCleanNav(navItems);
    const flattenedNav = flattenNav(validatedNav);

    console.log('Saving navigation:', {
      originalCount: navItems.length,
      flattenedCount: flattenedNav.length,
      flattenedData: flattenedNav
    });

    try {
      // Chain mutations: save config first, then navigation
      await updateConfigMutation.mutateAsync(config);
      await updateNavMutation.mutateAsync(flattenedNav);
      
      if (mountedRef.current) {
        setSafeMessage('All changes saved successfully');
        setTimeout(() => setSafeMessage(null), 3000);
      }
    } catch (error) {
      console.error('Error saving navigation:', error);
      if (mountedRef.current) {
        setSafeMessage('Failed to save changes');
        setTimeout(() => setSafeMessage(null), 3000);
      }
    }
  }, [config, navItems, updateConfigMutation, updateNavMutation, isSaving, setSafeMessage]);

  const revert = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['header'] });
    setSafeMessage('Reverted to last saved state');
    setTimeout(() => setSafeMessage(null), 1500);
  }, [queryClient, setSafeMessage]);

  // Templates
  const applyTemplate = useCallback((template: TemplateType): void => {
    if (template === 'simple') {
      setNavItems([
        { id: makeTempId(), title: 'About Us', href: '/about', children: [], order: 0, parentId: null },
        { id: makeTempId(), title: 'Products', href: '/products', children: [], order: 1, parentId: null },
        { id: makeTempId(), title: 'Contact', href: '/contact', children: [], order: 2, parentId: null },
      ]);
    } else if (template === 'with-contact') {
      setConfig(prev => ({
        ...prev,
        topPhone: '+254 722 205 144',
        topEmail: 'info@kenyaseed.co.ke',
        languages: ['en', 'sw']
      }));
      setNavItems([
        { id: makeTempId(), title: 'About Us', href: '/about', children: [], order: 0, parentId: null },
        { id: makeTempId(), title: 'Products', href: '/products', children: [], order: 1, parentId: null },
        { id: makeTempId(), title: 'News', href: '/news', children: [], order: 2, parentId: null },
        { id: makeTempId(), title: 'Contact', href: '/contact', children: [], order: 3, parentId: null },
      ]);
    }
    setUnsaved(true);
  }, []);

  // Handle navigation tree updates from drag & drop
  const handleNavUpdate = useCallback((updatedItems: NavItem[]): void => {
    setNavItems(updatedItems);
    setUnsaved(true);
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (isPending) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>Header Editor — Real Preview</Typography>
      
      {/* Help guide for non-technical users */}
      <Alert severity="info" sx={{ mb: 2 }}>
        <Typography variant="body2">
          <strong>Quick Guide:</strong> Use "Add Link" to create top-level menu items. 
          Use "Add child" to create sub-menus. Use "Indent/Outdent" to change nesting levels. 
          Use "Move Up/Down" to reorder items. Changes are saved when you click "Save All".
        </Typography>
      </Alert>

      {message && <Alert severity="info" sx={{ mb: 2 }}>{message}</Alert>}
      {unsaved && <Alert severity="warning" sx={{ mb: 2 }}>You have unsaved changes</Alert>}

      <Grid container spacing={{ xs: 1, md: 2 }}>
        <Grid item xs={12} lg={7}>
          <Typography variant="subtitle1" gutterBottom>Live Preview (Matches Your Site)</Typography>
          <Card sx={{ minHeight: 300, display: 'flex', flexDirection: 'column', boxShadow: 3 }}>
            <CardContent sx={{ flex: '1 1 auto', p: 0 }}>
              <RealHeaderPreview config={config} nav={navItems} />
            </CardContent>
          </Card>

          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2">Quick Templates</Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
              <Button 
                variant="outlined" 
                onClick={() => applyTemplate('simple')} 
                disabled={isSaving}
                aria-label="Apply simple navigation template"
              >
                Simple
              </Button>
              <Button 
                variant="outlined" 
                onClick={() => applyTemplate('with-contact')} 
                disabled={isSaving}
                aria-label="Apply navigation template with contact info"
              >
                With Contact
              </Button>
            </Box>
            <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
              Templates give new users a sensible starting point.
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Box sx={{ 
            width: '100%', 
            maxWidth: 480, 
            bgcolor: 'background.paper', 
            position: 'sticky', 
            top: 0, 
            height: 'calc(100vh - 64px)', 
            overflowY: 'auto', 
            p: 2,
            borderLeft: { lg: 1 },
            borderColor: { lg: 'divider' }
          }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="header editor tabs">
              <Tab label="Config" />
              <Tab label="Logo" />
              <Tab label="Navigation" />
            </Tabs>

            <Divider />

            <Box role="tabpanel" hidden={tabValue !== 0} sx={{ mt: 2 }}>
              {tabValue === 0 && (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>Header Configuration</Typography>
                  <TextField 
                    label="Phone" 
                    fullWidth
                    size="small" 
                    value={config?.topPhone || ''} 
                    onChange={(e) => { 
                      setConfig((p) => ({ ...p, topPhone: e.target.value })); 
                      setUnsaved(true); 
                    }}
                    disabled={isSaving}
                    inputProps={{ 'aria-label': 'Edit header phone number' }}
                    helperText="Displayed in top bar"
                    sx={{ mb: 2 }}
                  />
                  <TextField 
                    label="Email" 
                    fullWidth
                    size="small" 
                    value={config?.topEmail || ''} 
                    onChange={(e) => { 
                      setConfig((p) => ({ ...p, topEmail: e.target.value })); 
                      setUnsaved(true); 
                    }}
                    disabled={isSaving}
                    inputProps={{ 'aria-label': 'Edit header email address' }}
                    helperText="Displayed in top bar"
                  />
                </Box>
              )}
            </Box>

            <Box role="tabpanel" hidden={tabValue !== 1} sx={{ mt: 2 }}>
              {tabValue === 1 && (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>Logo & Media</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      {logoPreviewUrl ? (
                        <img src={logoPreviewUrl} alt="Logo preview" style={{ width: 64, height: 64, objectFit: 'contain', borderRadius: 4, border: '1px solid #e5e7eb' }} />
                      ) : config.logoUrl ? (
                        <img src={config.logoUrl.startsWith('http') ? config.logoUrl : `${window.location.origin}${config.logoUrl}`} alt="Current logo" style={{ width: 64, height: 64, objectFit: 'contain', borderRadius: 4, border: '1px solid #e5e7eb' }} />
                      ) : (
                        <Box sx={{ width: 64, height: 64, borderRadius: 1, border: '1px dashed #cfcfcf', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.secondary', fontSize: '0.75rem' }}>
                          No logo
                        </Box>
                      )}
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {logoPreviewUrl ? 'Selected logo' : config.logoUrl ? 'Current logo' : 'No logo selected'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {logoPreviewUrl ? 'Preview before upload' : 'Logo stored in database'}
                        </Typography>
                      </Box>
                    </Box>
                    <input 
                      id="logo-file" 
                      type="file" 
                      accept="image/*" 
                      style={{ display: 'none' }} 
                      onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                      aria-label="Upload logo file"
                    />
                    <Button component="label" htmlFor="logo-file" variant="outlined" startIcon={<UploadIcon />} disabled={isSaving} fullWidth>
                      Upload New Logo
                    </Button>
                    <Button 
                      variant="outlined" 
                      onClick={() => setMediaPickerOpen(true)}
                      disabled={isSaving}
                      fullWidth
                    >
                      Choose from Library
                    </Button>
                    {logoFile && (
                      <Button 
                        variant="contained" 
                        onClick={handleLogoUpload} 
                        disabled={uploadLogoMutation.isPending || isSaving} 
                        startIcon={uploadLogoMutation.isPending ? <CircularProgress size={16} /> : <UploadIcon />}
                        fullWidth
                      >
                        Upload
                      </Button>
                    )}
                    {config.logoUrl && <Chip label="Logo set" color="success" />}
                  </Box>
                </Box>
              )}
            </Box>

            <Box role="tabpanel" hidden={tabValue !== 2} sx={{ mt: 2 }}>
              {tabValue === 2 && (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>Navigation Items</Typography>
                  <Button 
                    variant="contained" 
                    startIcon={<AddIcon />} 
                    onClick={addTopLevelItem} 
                    disabled={isSaving}
                    fullWidth
                    sx={{ mb: 2 }}
                  >
                    Add Top-Level Link
                  </Button>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <NavTreeEditor
                      items={navItems}
                      onUpdate={handleNavUpdate}
                      isSaving={isSaving}
                      onAddChild={addChild}
                      onUpdateItem={updateItem}
                      onDeleteItem={deleteItem}
                      onMoveItem={moveItem}
                      onIndentItem={indentItem}
                      onOutdentItem={outdentItem}
                    />
                  </Box>
                </Box>
              )}
            </Box>

            {/* Sticky Save Bar */}
            <Box sx={{ 
              position: 'sticky', 
              bottom: 0, 
              bgcolor: 'background.paper', 
              p: 2, 
              borderTop: 1, 
              borderColor: 'divider', 
              display: 'flex', 
              gap: 1, 
              justifyContent: 'flex-end', 
              zIndex: 1 
            }}>
              <Button 
                variant="outlined" 
                onClick={revert}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button 
                variant="contained" 
                startIcon={<SaveIcon />} 
                onClick={saveAll} 
                disabled={isSaving}
              >
                {isSaving ? <CircularProgress size={16} /> : 'Save All'}
              </Button>
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="Delete"
        cancelText="Cancel"
        severity="error"
      />

      {/* Media Picker Modal */}
      <MediaPickerModal
        open={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={handleMediaSelect}
        title="Select Logo from Media Library"
        acceptTypes={['image/*']}
      />
    </Box>
  );
};

export default HeaderEditorWithRealPreview;
