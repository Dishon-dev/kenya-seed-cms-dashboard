import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './utils/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import HeroEditor from './components/HeroEditor';
import ServiceEditor from './components/ServiceEditor';
import BoardEditor from './components/BoardEditor';
import BranchNetworkEditor from './components/BranchNetworkEditor';
import OverviewEditor from './components/OverviewEditor';
import PartnersEditor from './components/PartnersEditor';
import NoticesEditor from './components/NoticesEditor';
import VideoGalleryEditor from './components/VideoGalleryEditor';
import InnovationsEditor from './components/InnovationsEditor';
import CalendarEventsEditor from './components/CalendarEventsEditor';
import ResourcesEditor from './components/ResourcesEditor';
import UserManagement from './pages/UserManagement';
import RoleManagement from './pages/RoleManagement';
import Profile from './pages/Profile';
import BranchLocationsEditor from './components/BranchLocationsEditor';
import StoryEditor from './components/StoryEditor';
import SubsidiariesEditor from './components/SubsidiariesEditor';
import SurveyManagement from './pages/SurveyManagement';
import TenderEditor from './components/TenderEditor';
import CSIEditor from './components/CSIEditor';
import GalleryEditor from './components/GalleryEditor';
import FAQsEditor from './components/FAQsEditor';
import NewsEditor from './components/NewsEditor';
import SeedFeaturesEditor from './components/SeedFeaturesEditor';
import AccountFormEditor from './components/AccountFormEditor';
import ServiceCharterEditor from './components/ServiceCharterEditor';
import CareersEditor from './components/CareersEditor';
import AgentsStockistsEditor from './components/AgentsStockistsEditor';
import WeatherWidgetEditor from './components/WeatherWidgetEditor';
import AccessibilityEditor from './components/AccessibilityEditor';
import TwitterFeedEditor from './components/TwitterFeedEditor';
import SocialBarEditor from './components/SocialBarEditor';
import FooterEditor from './components/FooterEditor';
import HeaderEditor from './components/HeaderEditor';
import ContactManagement from './pages/ContactManagement';
import MediaEditor from './components/MediaEditor';
import ProductManagement from './pages/ProductManagement';
import ProductCategories from './pages/ProductCategories';
import ProductVarieties from './pages/ProductVarieties';
import CustomerServicesManagement from './pages/CustomerServicesManagement';
import SocialBarManagement from './pages/SocialBarManagement';
import BoardMembersManagement from './pages/BoardMembersManagement';
import BranchNetworkManagement from './pages/BranchNetworkManagement';
import OverviewManagement from './pages/OverviewManagement';
import SubsidiariesManagement from './pages/SubsidiariesManagement';
import TeamManagement from './pages/TeamManagement';
import FarmersHubManagement from './pages/FarmersHubManagement';
import GrowersPortal from './components/GrowersPortal';
import ApplicationFormsManagement from './components/ApplicationFormsManagement';
import FormEditor from './components/FormEditor';
import FormSubmissions from './components/FormSubmissions';
import PlantingGuidesEditor from './components/PlantingGuidesEditor';
import ProducerPricesEditor from './components/ProducerPricesEditor';
import UndertakingFormsEditor from './components/UndertakingFormsEditor';
import FingerMilletApplicationsEditor from './components/FingerMilletApplicationsEditor';
import FingerMilletFormEditor from './components/FingerMilletFormEditor';
import ForageSorghumFormEditor from './components/ForageSorghumFormEditor';
import MaizeSeedFormEditor from './components/MaizeSeedFormEditor';
import SunflowerSeedFormEditor from './components/SunflowerSeedFormEditor';
import OatsSeedFormEditor from './components/OatsSeedFormEditor';
import PastureSeedFormEditor from './components/PastureSeedFormEditor';
import RiceSeedFormEditor from './components/RiceSeedFormEditor';
import WheatSeedFormEditor from './components/WheatSeedFormEditor';
import SoyaBeanFormEditor from './components/SoyaBeanFormEditor';


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const theme = createTheme({
  palette: {
    primary: { main: '#05471d', light: '#0a6b2e', dark: '#032610', contrastText: '#ffffff' },
    secondary: { main: '#fac800', light: '#ffd429', dark: '#c99f00', contrastText: '#032610' },
    error: { main: '#dc2626' },
    warning: { main: '#d97706' },
    info: { main: '#2563eb' },
    success: { main: '#15803d' },
    background: { default: '#f7f8fa', paper: '#ffffff' },
    divider: '#e5e7eb',
    text: { primary: '#111827', secondary: '#6b7280' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: 14,
    h1: { fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontSize: '1.625rem', fontWeight: 700, letterSpacing: '-0.01em' },
    h3: { fontSize: '1.375rem', fontWeight: 600 },
    h4: { fontSize: '1.125rem', fontWeight: 600 },
    h5: { fontSize: '1rem', fontWeight: 600 },
    h6: { fontSize: '0.9375rem', fontWeight: 600 },
    subtitle1: { fontSize: '0.9375rem', fontWeight: 500 },
    subtitle2: { fontSize: '0.8125rem', fontWeight: 500, color: '#6b7280' },
    body1: { fontSize: '0.9375rem' },
    body2: { fontSize: '0.8125rem' },
    caption: { fontSize: '0.75rem' },
    button: { fontWeight: 600, fontSize: '0.875rem' },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: '#f7f8fa' },
        '*::-webkit-scrollbar': { width: 8, height: 8 },
        '*::-webkit-scrollbar-thumb': { backgroundColor: '#d1d5db', borderRadius: 8 },
        '*::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600, borderRadius: 8, paddingInline: 16 },
        containedPrimary: {
          boxShadow: 'none',
          '&:hover': { boxShadow: '0 1px 2px 0 rgb(21 128 61 / 0.25)' },
        },
        outlined: { borderColor: '#d1d5db' },
        sizeSmall: { paddingInline: 12 },
      },
    },
    MuiIconButton: {
      styleOverrides: { root: { borderRadius: 8 } },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          border: '1px solid #e5e7eb',
          borderRadius: 12,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
        rounded: { borderRadius: 12 },
        elevation0: { boxShadow: 'none', border: '1px solid #e5e7eb' },
        elevation1: { boxShadow: 'none', border: '1px solid #e5e7eb' },
        elevation8: { boxShadow: '0 12px 32px -8px rgb(0 0 0 / 0.18)' },
      },
    },
    MuiTextField: { defaultProps: { size: 'small' } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: '#ffffff',
          '& fieldset': { borderColor: '#d1d5db' },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 6, fontWeight: 600, fontSize: '0.75rem' },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: '#e5e7eb', fontSize: '0.8125rem' },
        head: {
          fontWeight: 600,
          fontSize: '0.75rem',
          color: '#6b7280',
          backgroundColor: '#f7f8fa',
          textTransform: 'none',
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: { root: { border: '1px solid #e5e7eb', borderRadius: 12, boxShadow: 'none' } },
    },
    MuiTab: {
      styleOverrides: { root: { textTransform: 'none', fontWeight: 600, minHeight: 44 } },
    },
    MuiDialog: {
      styleOverrides: { paper: { borderRadius: 16, boxShadow: '0 20px 48px -12px rgb(0 0 0 / 0.25)' } },
    },
    MuiDialogTitle: {
      styleOverrides: { root: { fontWeight: 700, fontSize: '1.125rem', padding: '20px 24px' } },
    },
    MuiDialogContent: {
      styleOverrides: { root: { padding: '4px 24px' } },
    },
    MuiDialogActions: {
      styleOverrides: { root: { padding: '16px 24px' } },
    },
    MuiAlert: {
      styleOverrides: { root: { borderRadius: 8 }, standardSuccess: { backgroundColor: '#f0fdf4' } },
    },
    MuiTooltip: {
      styleOverrides: { tooltip: { backgroundColor: '#111827', fontSize: '0.75rem', borderRadius: 6 } },
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout>
                    <Navigate to="/dashboard" replace />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/users" element={
                <ProtectedRoute>
                  <Layout>
                    <UserManagement />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/roles" element={
                <ProtectedRoute>
                  <Layout>
                    <RoleManagement />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Layout>
                    <Profile />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/hero-editor" element={
                <ProtectedRoute>
                  <Layout>
                    <HeroEditor />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/services" element={
                <ProtectedRoute>
                  <Layout>
                    <CustomerServicesManagement />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/board" element={
                <ProtectedRoute>
                  <Layout>
                    <BoardEditor />
                  </Layout>
                </ProtectedRoute>
              } />
            <Route path="/board-members" element={
              <ProtectedRoute>
                <Layout>
                  <BoardMembersManagement />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/branch-network" element={
              <ProtectedRoute>
                <Layout>
                  <BranchNetworkManagement />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/contact" element={
              <ProtectedRoute>
                <Layout>
                  <ContactManagement />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/farmers-hub" element={
              <ProtectedRoute>
                <Layout>
                  <FarmersHubManagement />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/overview" element={
              <ProtectedRoute>
                <Layout>
                  <OverviewManagement />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/subsidiaries" element={
              <ProtectedRoute>
                <Layout>
                  <SubsidiariesManagement />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/team-management" element={
              <ProtectedRoute>
                <Layout>
                  <TeamManagement />
                </Layout>
              </ProtectedRoute>
            } />
              <Route path="/partners" element={
                <ProtectedRoute>
                  <Layout>
                    <PartnersEditor />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/notices" element={
                <ProtectedRoute>
                  <Layout>
                    <NoticesEditor />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/video-gallery" element={
                <ProtectedRoute>
                  <Layout>
                    <VideoGalleryEditor />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/innovations" element={
                <ProtectedRoute>
                  <Layout>
                    <InnovationsEditor />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/calendar-of-events" element={
                <ProtectedRoute>
                  <Layout>
                    <CalendarEventsEditor />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/resources" element={
                <ProtectedRoute>
                  <Layout>
                    <ResourcesEditor />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/branch-locations" element={
                <ProtectedRoute>
                  <Layout>
                    <BranchLocationsEditor />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/story" element={
                <ProtectedRoute>
                  <Layout>
                    <StoryEditor />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/team" element={
                <ProtectedRoute>
                  <Layout>
                    <TeamManagement />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/survey" element={
                <ProtectedRoute>
                  <Layout>
                    <SurveyManagement />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/tenders" element={
                <ProtectedRoute>
                  <Layout>
                    <TenderEditor />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/csi" element={
                <ProtectedRoute>
                  <Layout>
                    <CSIEditor />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/gallery" element={
                <ProtectedRoute>
                  <Layout>
                    <GalleryEditor />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/faqs" element={
                <ProtectedRoute>
                  <Layout>
                    <FAQsEditor />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/news" element={
                <ProtectedRoute>
                  <Layout>
                    <NewsEditor />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/seed-features" element={
                <ProtectedRoute>
                  <Layout>
                    <SeedFeaturesEditor />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/growers-portal" element={
                <ProtectedRoute>
                  <Layout>
                    <GrowersPortal />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/application-forms-management" element={
                <ProtectedRoute>
                  <Layout>
                    <ApplicationFormsManagement />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/edit-form/:id" element={
                <ProtectedRoute>
                  <Layout>
                    <FormEditor />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/form-submissions/:id" element={
                <ProtectedRoute>
                  <Layout>
                    <FormSubmissions />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/planting-guides" element={
                <ProtectedRoute>
                  <Layout>
                    <PlantingGuidesEditor />
                  </Layout>
                </ProtectedRoute>
              } />
  <Route path="/producer-prices" element={
    <ProtectedRoute>
      <Layout>
        <ProducerPricesEditor />
      </Layout>
    </ProtectedRoute>
  } />
  <Route path="/undertaking-forms" element={
    <ProtectedRoute>
      <Layout>
        <UndertakingFormsEditor />
      </Layout>
    </ProtectedRoute>
  } />
  <Route path="/finger-millet-applications" element={
    <ProtectedRoute>
      <Layout>
        <FingerMilletApplicationsEditor />
      </Layout>
    </ProtectedRoute>
  } />
  <Route path="/finger-millet-form-fields" element={
    <ProtectedRoute>
      <Layout>
        <FingerMilletFormEditor />
      </Layout>
    </ProtectedRoute>
  } />
              <Route path="/forage-sorghum-form-fields" element={
                <ProtectedRoute>
                  <Layout>
                    <ForageSorghumFormEditor />
                  </Layout>
                </ProtectedRoute>
              } />
        <Route path="/maize-seed-form-fields" element={
          <ProtectedRoute>
            <Layout>
              <MaizeSeedFormEditor />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/sunflower-seed-form-fields" element={
          <ProtectedRoute>
            <Layout>
              <SunflowerSeedFormEditor />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/oats-seed-form-fields" element={
          <ProtectedRoute>
            <Layout>
              <OatsSeedFormEditor />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/pasture-seed-form-fields" element={
          <ProtectedRoute>
            <Layout>
              <PastureSeedFormEditor />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/rice-seed-form-fields" element={
          <ProtectedRoute>
            <Layout>
              <RiceSeedFormEditor />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/wheat-seed-form-fields" element={
          <ProtectedRoute>
            <Layout>
              <WheatSeedFormEditor />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/soya-bean-form-fields" element={
          <ProtectedRoute>
            <Layout>
              <SoyaBeanFormEditor />
            </Layout>
          </ProtectedRoute>
        } />
  <Route path="/account-form" element={
    <ProtectedRoute>
      <Layout>
        <AccountFormEditor />
      </Layout>
    </ProtectedRoute>
  } />
              <Route path="/service-charter" element={
                <ProtectedRoute>
                  <Layout>
                    <ServiceCharterEditor />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/careers" element={
                <ProtectedRoute>
                  <Layout>
                    <CareersEditor />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/agents-stockists" element={
                <ProtectedRoute>
                  <Layout>
                    <AgentsStockistsEditor />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/weather-widget" element={
                <ProtectedRoute>
                  <Layout>
                    <WeatherWidgetEditor />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/accessibility" element={
                <ProtectedRoute>
                  <Layout>
                    <AccessibilityEditor />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/twitter-feed" element={
                <ProtectedRoute>
                  <Layout>
                    <TwitterFeedEditor />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/social-bar" element={
                <ProtectedRoute>
                  <Layout>
                    <SocialBarManagement />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/footer" element={
                <ProtectedRoute>
                  <Layout>
                    <FooterEditor />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/header" element={
                <ProtectedRoute>
                  <Layout>
                    <HeaderEditor />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/media" element={
                <ProtectedRoute>
                  <Layout>
                    <MediaEditor />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/products" element={
                <ProtectedRoute>
                  <Layout>
                    <ProductManagement />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/products/:productType/categories" element={
                <ProtectedRoute>
                  <Layout>
                    <ProductCategories />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/products/:productType/categories/:categorySlug/varieties" element={
                <ProtectedRoute>
                  <Layout>
                    <ProductVarieties />
                  </Layout>
                </ProtectedRoute>
              } />
            </Routes>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
