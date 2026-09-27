//cms-dashboard/src/components/Layout.tsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar, Box, CssBaseline, Drawer, IconButton, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, Toolbar, Typography, Avatar, Menu, MenuItem, Divider, Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon, ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon,
  Dashboard as DashboardIcon, Inventory as ProductsIcon, PhotoLibrary as MediaIcon,
  MenuBook as HeaderIcon, ViewList as FooterIcon, Image as HeroIcon, Business as ServiceIcon,
  Groups as BoardIcon, AccountTree as BranchIcon, Info as OverviewIcon, Handshake as PartnersIcon,
  History as StoryIcon, BusinessCenter as SubsidiariesIcon, Group as TeamIcon, Gavel as TenderIcon,
  Quiz as SurveyIcon, VolunteerActivism as CSIIcon, Help as FAQIcon, PhotoLibrary as GalleryIcon,
  Article as NewsIcon, Science as SeedFeatureIcon, Agriculture as GrowerIcon, Assignment as FormIcon,
  AccountCircle, Logout, Description as ServiceCharterIcon, Work as CareersIcon,
  Store as AgentsStockistsIcon, Cloud as WeatherWidgetIcon, Accessibility as AccessibilityIcon,
  Twitter as TwitterFeedIcon, Share as SocialBarIcon, ContactMail as ContactMailIcon,
  Agriculture as FarmersHubIcon, Campaign as NoticeBoardIcon,
  LocationOn as BranchLocationsIcon, Lightbulb as InnovationsIcon, Event as CalendarEventsIcon,
  VideoLibrary as VideoGalleryIcon, LibraryBooks as ResourcesIcon,
  People as UsersIcon, Security as RolesIcon,
} from '@mui/icons-material';
import { useAuth } from '../utils/AuthContext';

const drawerWidth = 260;
const collapsedWidth = 64;

interface NavItem { text: string; icon: React.ReactElement; path: string; requiresPermission?: string; }
interface NavGroup { label: string; items: NavItem[]; }

const navGroups: NavGroup[] = [
  { label: 'Overview', items: [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  ]},
  { label: 'Site Content', items: [
    { text: 'Hero Section', icon: <HeroIcon />, path: '/hero-editor' },
    { text: 'Header', icon: <HeaderIcon />, path: '/header' },
    { text: 'Footer', icon: <FooterIcon />, path: '/footer' },
    { text: 'Services', icon: <ServiceIcon />, path: '/services' },
    { text: 'Overview Page', icon: <OverviewIcon />, path: '/overview' },
    { text: 'Our Story', icon: <StoryIcon />, path: '/story' },
    { text: 'News & Updates', icon: <NewsIcon />, path: '/news' },
    { text: 'FAQs', icon: <FAQIcon />, path: '/faqs' },
    { text: 'Gallery', icon: <GalleryIcon />, path: '/gallery' },
    { text: 'Video Gallery', icon: <VideoGalleryIcon />, path: '/video-gallery' },
    { text: 'Media Library', icon: <MediaIcon />, path: '/media' },
    { text: 'Seed Features', icon: <SeedFeatureIcon />, path: '/seed-features' },
    { text: 'Innovations', icon: <InnovationsIcon />, path: '/innovations' },
    { text: 'Calendar of Events', icon: <CalendarEventsIcon />, path: '/calendar-of-events' },
    { text: 'Resources', icon: <ResourcesIcon />, path: '/resources' },
  ]},
  { label: 'Products', items: [
    { text: 'Products', icon: <ProductsIcon />, path: '/products' },
  ]},
  { label: 'Company', items: [
    { text: 'Board Members', icon: <BoardIcon />, path: '/board-members' },
    { text: 'Team', icon: <TeamIcon />, path: '/team-management' },
    { text: 'Subsidiaries', icon: <SubsidiariesIcon />, path: '/subsidiaries' },
    { text: 'Partners', icon: <PartnersIcon />, path: '/partners' },
    { text: 'Branch Network', icon: <BranchIcon />, path: '/branch-network' },
    { text: 'Branch Locations', icon: <BranchLocationsIcon />, path: '/branch-locations' },
    { text: 'CSI', icon: <CSIIcon />, path: '/csi' },
    { text: 'Careers', icon: <CareersIcon />, path: '/careers' },
    { text: 'Service Charter', icon: <ServiceCharterIcon />, path: '/service-charter' },
  ]},
  { label: 'Growers & Forms', items: [
    { text: 'Growers Portal', icon: <GrowerIcon />, path: '/growers-portal' },
    { text: 'Application Forms', icon: <FormIcon />, path: '/application-forms-management' },
    { text: 'Finger Millet Form', icon: <FormIcon />, path: '/finger-millet-form-fields' },
    { text: 'Forage Sorghum Form', icon: <FormIcon />, path: '/forage-sorghum-form-fields' },
    { text: 'Agents & Stockists', icon: <AgentsStockistsIcon />, path: '/agents-stockists' },
    { text: 'Farmers Hub', icon: <FarmersHubIcon />, path: '/farmers-hub' },
  ]},
  { label: 'Communications', items: [
    { text: 'Contact', icon: <ContactMailIcon />, path: '/contact' },
    { text: 'Tenders', icon: <TenderIcon />, path: '/tenders' },
    { text: 'Notice Board', icon: <NoticeBoardIcon />, path: '/notices' },
    { text: 'Survey', icon: <SurveyIcon />, path: '/survey' },
    { text: 'Twitter Feed', icon: <TwitterFeedIcon />, path: '/twitter-feed' },
    { text: 'Social Bar', icon: <SocialBarIcon />, path: '/social-bar' },
    { text: 'Weather Widget', icon: <WeatherWidgetIcon />, path: '/weather-widget' },
  ]},
  { label: 'Settings', items: [
    { text: 'Accessibility', icon: <AccessibilityIcon />, path: '/accessibility' },
  ]},
  { label: 'Administration', items: [
    { text: 'Users', icon: <UsersIcon />, path: '/users', requiresPermission: 'users.view' },
    { text: 'Roles & Permissions', icon: <RolesIcon />, path: '/roles', requiresPermission: 'roles.view' },
  ]},
];

const allNavItems = navGroups.flatMap((g) => g.items);

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const visibleNavGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.requiresPermission || hasPermission(item.requiresPermission))
    }))
    .filter((group) => group.items.length > 0);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const handleCollapseToggle = () => setCollapsed(!collapsed);
  const handleMenu = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const handleLogout = () => { logout(); handleClose(); navigate('/login'); };

  const drawer = (
    <div>
      <Toolbar sx={{ justifyContent: collapsed ? 'center' : 'space-between', px: 2.5, minHeight: '64px !important' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, overflow: 'hidden' }}>
          <Box
            component="img"
            src="/images/ksc_logo.png"
            alt="Kenya Seed Company"
            sx={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0 }}
          />
          <Typography variant="subtitle1" noWrap component="div" sx={{ color: 'text.primary', fontWeight: 700, fontSize: '0.9375rem', display: collapsed ? 'none' : 'block' }}>
            Kenya Seed CMS
          </Typography>
        </Box>
        <IconButton onClick={handleCollapseToggle} size="small" sx={{ display: { xs: 'none', sm: collapsed ? 'none' : 'flex' }, color: 'text.secondary' }}>
          <ChevronLeftIcon fontSize="small" />
        </IconButton>
      </Toolbar>
      <Divider />
      <Box sx={{ overflowY: 'auto', overflowX: 'hidden', height: 'calc(100vh - 64px)', pb: 2 }}>
        {collapsed && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
            <IconButton onClick={handleCollapseToggle} size="small" sx={{ color: 'text.secondary' }}>
              <ChevronRightIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
        {visibleNavGroups.map((group) => (
          <List key={group.label} subheader={
            !collapsed ? (
              <Typography variant="overline" sx={{ px: 3, pt: 2.5, pb: 0.75, display: 'block', color: '#9ca3af', fontWeight: 600, fontSize: '0.6875rem', letterSpacing: '0.04em' }}>
                {group.label}
              </Typography>
            ) : ( <Divider sx={{ my: 1 }} /> )
          } sx={{ py: 0 }}>
            {group.items.map((item) => {
              const selected = location.pathname === item.path;
              const button = (
                <ListItemButton selected={selected} onClick={() => navigate(item.path)} sx={{
                  minHeight: 40, mx: 1, borderRadius: 1.5, justifyContent: collapsed ? 'center' : 'initial', px: collapsed ? 1.5 : 1.75,
                  position: 'relative',
                  transition: 'background-color 0.12s ease-in-out',
                  '&.Mui-selected': {
                    backgroundColor: '#eef6f0',
                    color: 'primary.dark',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      left: -8,
                      top: 6,
                      bottom: 6,
                      width: 3,
                      borderRadius: 4,
                      backgroundColor: 'primary.main',
                    },
                    '&:hover': { backgroundColor: '#e4f1e7' },
                    '& .MuiListItemIcon-root': { color: 'primary.main' },
                  },
                  '&:not(.Mui-selected):hover': { backgroundColor: '#f0f1f3' },
                }}>
                  <ListItemIcon sx={{ minWidth: 0, mr: collapsed ? 0 : 1.5, justifyContent: 'center', color: selected ? 'primary.main' : 'text.secondary' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: '0.8125rem', fontWeight: selected ? 600 : 500 }} sx={{ opacity: collapsed ? 0 : 1, display: collapsed ? 'none' : 'block' }} />
                </ListItemButton>
              );
              return (
                <ListItem key={item.text} disablePadding sx={{ mb: 0.25 }}>
                  {collapsed ? ( <Tooltip title={item.text} placement="right"><Box sx={{ width: '100%' }}>{button}</Box></Tooltip> ) : button}
                </ListItem>
              );
            })}
          </List>
        ))}
      </Box>
    </div>
  );

  const currentDrawerWidth = collapsed ? collapsedWidth : drawerWidth;

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" elevation={0} sx={{ width: { sm: `calc(100% - ${currentDrawerWidth}px)` }, ml: { sm: `${currentDrawerWidth}px` }, backgroundColor: 'background.paper', color: 'text.primary', borderBottom: '1px solid', borderColor: 'divider', transition: 'width 0.2s ease-in-out, margin-left 0.2s ease-in-out' }}>
        <Toolbar>
          <IconButton color="inherit" aria-label="open drawer" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2, display: { sm: 'none' } }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 600, fontSize: '1rem' }}>
            {location.pathname === '/profile' ? 'Profile' : allNavItems.find((item) => item.path === location.pathname)?.text || 'Dashboard'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', md: 'block' }, fontSize: '0.8125rem' }}>
              {user?.email}
            </Typography>
            <IconButton size="small" aria-label="account of current user" aria-controls="menu-appbar" aria-haspopup="true" onClick={handleMenu} color="inherit">
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.8125rem', fontWeight: 600 }}>
                {user?.email?.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
            <Menu id="menu-appbar" anchorEl={anchorEl} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} keepMounted transformOrigin={{ vertical: 'top', horizontal: 'right' }} open={Boolean(anchorEl)} onClose={handleClose} PaperProps={{ elevation: 8, sx: { mt: 1, minWidth: 200 } }}>
              <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="body2" fontWeight={600} noWrap>{user?.email}</Typography>
                <Typography variant="caption" color="text.secondary">Signed in</Typography>
              </Box>
              <Divider />
              <MenuItem onClick={() => { handleClose(); navigate('/profile'); }}><ListItemIcon><AccountCircle fontSize="small" /></ListItemIcon>Profile</MenuItem>
              <MenuItem onClick={handleLogout}><ListItemIcon><Logout fontSize="small" /></ListItemIcon>Logout</MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      <Box component="nav" sx={{ width: { sm: currentDrawerWidth }, flexShrink: { sm: 0 } }} aria-label="main navigation">
        <Drawer variant="temporary" open={mobileOpen} onClose={handleDrawerToggle} ModalProps={{ keepMounted: true }} sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }}>
          {drawer}
        </Drawer>
        <Drawer variant="permanent" sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: currentDrawerWidth, transition: 'width 0.2s ease-in-out', overflowX: 'hidden', borderRight: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper' } }}>
          {drawer}
        </Drawer>
      </Box>
      <Box component="main" sx={{ flexGrow: 1, py: 3, px: 0, width: { sm: `calc(100% - ${currentDrawerWidth}px)` }, minHeight: '100vh', backgroundColor: 'background.default', transition: 'width 0.2s ease-in-out' }}>
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
