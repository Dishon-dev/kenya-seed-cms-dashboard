import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  IconButton,
  Switch,
  FormControlLabel,
  Divider,
  Stack,
  Alert
} from '@mui/material';
import {
  Save as SaveIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Map as MapIcon,
  Business as OfficeIcon,
  GroupWork as SubsIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import {
  getContact,
  updateHeadOffice,
  createSubsidiary,
  updateSubsidiary,
  deleteSubsidiary,
  updateContactSettings,
  HeadOffice,
  Subsidiary,
  ContactSettings
} from '../utils/contactApi';
import BranchesEditor from '../components/BranchesEditor';

const ContactManagement: React.FC = () => {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [headOffice, setHeadOffice] = useState<HeadOffice>({
    title: '',
    address: '',
    phone: '',
    email: '',
    working_hours: '',
    is_active: true,
  });
  const [subsidiaries, setSubsidiaries] = useState<Subsidiary[]>([]);
  const [settings, setSettings] = useState<ContactSettings>({
    form_title: '',
    form_subtitle: '',
    email_recipient: '',
    show_branches: true,
    show_subsidiaries: true,
    is_active: true,
  });

  const [newSubsidiary, setNewSubsidiary] = useState<Subsidiary>({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    order_index: (subsidiaries[subscribersLengthIndex()]?.order_index ?? 0) + 1,
    is_active: true,
  } as Subsidiary);

  function subscribersLengthIndex() {
    return Math.max(0, subsidiaries.length - 1);
  }

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getContact();
        if (data.headOffice) setHeadOffice(data.headOffice);
        if (Array.isArray(data.subsidiaries)) setSubsidiaries(data.subsidiaries);
        if (data.settings) setSettings(data.settings);
        setError(null);
      } catch (e) {
        console.error(e);
        setError('Failed to load contact data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSaveHeadOffice = async () => {
    await updateHeadOffice(headOffice);
  };

  const handleAddSubsidiary = async () => {
    if (!newSubsidiary.name?.trim()) return;
    const res = await createSubsidiary(newSubsidiary);
    const created = res.subsidiary as Subsidiary;
    setSubsidiaries(prev => [...prev, created]);
    setNewSubsidiary({
      name: '',
      description: '',
      address: '',
      phone: '',
      email: '',
      website: '',
      order_index: (created.order_index ?? 0) + 1,
      is_active: true,
    });
  };

  const handleUpdateSubsidiary = async (id?: number, patch?: Partial<Subsidiary>) => {
    if (!id) return;
    const existing = subsidiaries.find(s => s.id === id);
    if (!existing) return;
    const updated = { ...existing, ...patch };
    await updateSubsidiary(id, patch || {});
    setSubsidiaries(prev => prev.map(s => s.id === id ? updated : s));
  };

  const handleDeleteSubsidiary = async (id?: number) => {
    if (!id) return;
    await deleteSubsidiary(id);
    setSubsidiaries(prev => prev.filter(s => s.id !== id));
  };

  const handleSaveSettings = async () => {
    await updateContactSettings(settings);
  };

  if (loading) {
    return (
      <Box p={3}>
        <Typography variant="h6">Loading contact management...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>Contact Management</Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Manage head office information, subsidiaries, and whether to show the branches map on the Contact page.
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tab} onChange={(e, v) => setTab(v)}>
          <Tab icon={<OfficeIcon />} iconPosition="start" label="Head Office" />
          <Tab icon={<SubsIcon />} iconPosition="start" label="Subsidiaries" />
          <Tab icon={<SettingsIcon />} iconPosition="start" label="Settings" />
          <Tab icon={<MapIcon />} iconPosition="start" label="Map (Branches)" />
        </Tabs>
      </Box>

      {tab === 0 && (
        <Card>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Title" value={headOffice.title || ''} onChange={(e) => setHeadOffice({ ...headOffice, title: e.target.value })} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Email" value={headOffice.email || ''} onChange={(e) => setHeadOffice({ ...headOffice, email: e.target.value })} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Phone" value={headOffice.phone || ''} onChange={(e) => setHeadOffice({ ...headOffice, phone: e.target.value })} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Working Hours" value={headOffice.working_hours || ''} onChange={(e) => setHeadOffice({ ...headOffice, working_hours: e.target.value })} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth multiline minRows={3} label="Address" value={headOffice.address || ''} onChange={(e) => setHeadOffice({ ...headOffice, address: e.target.value })} />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel control={<Switch checked={!!headOffice.is_active} onChange={(e) => setHeadOffice({ ...headOffice, is_active: e.target.checked })} />} label="Active" />
              </Grid>
            </Grid>
            <Box mt={2}>
              <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveHeadOffice}>
                Save Head Office
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {tab === 1 && (
        <Box>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Add Subsidiary</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField fullWidth label="Name" value={newSubsidiary.name || ''} onChange={(e) => setNewSubsidiary({ ...newSubsidiary, name: e.target.value })} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField fullWidth label="Email" value={newSubsidiary.email || ''} onChange={(e) => setNewSubsidiary({ ...newSubsidiary, email: e.target.value })} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField fullWidth label="Phone" value={newSubsidiary.phone || ''} onChange={(e) => setNewSubsidiary({ ...newSubsidiary, phone: e.target.value })} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Website" value={newSubsidiary.website || ''} onChange={(e) => setNewSubsidiary({ ...newSubsidiary, website: e.target.value })} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Order Index" type="number" value={newSubsidiary.order_index ?? 0} onChange={(e) => setNewSubsidiary({ ...newSubsidiary, order_index: Number(e.target.value) })} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth multiline minRows={2} label="Address" value={newSubsidiary.address || ''} onChange={(e) => setNewSubsidiary({ ...newSubsidiary, address: e.target.value })} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth multiline minRows={2} label="Description" value={newSubsidiary.description || ''} onChange={(e) => setNewSubsidiary({ ...newSubsidiary, description: e.target.value })} />
                </Grid>
              </Grid>
              <Box mt={2}>
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddSubsidiary}>
                  Add Subsidiary
                </Button>
              </Box>
            </CardContent>
          </Card>

          <Stack spacing={2}>
            {subsidiaries.map((s) => (
              <Card key={s.id}>
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <TextField fullWidth label="Name" value={s.name || ''} onChange={(e) => handleUpdateSubsidiary(s.id, { name: e.target.value })} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField fullWidth label="Email" value={s.email || ''} onChange={(e) => handleUpdateSubsidiary(s.id, { email: e.target.value })} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField fullWidth label="Phone" value={s.phone || ''} onChange={(e) => handleUpdateSubsidiary(s.id, { phone: e.target.value })} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth label="Website" value={s.website || ''} onChange={(e) => handleUpdateSubsidiary(s.id, { website: e.target.value })} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth label="Order Index" type="number" value={s.order_index ?? 0} onChange={(e) => handleUpdateSubsidiary(s.id, { order_index: Number(e.target.value) })} />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField fullWidth multiline minRows={2} label="Address" value={s.address || ''} onChange={(e) => handleUpdateSubsidiary(s.id, { address: e.target.value })} />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField fullWidth multiline minRows={2} label="Description" value={s.description || ''} onChange={(e) => handleUpdateSubsidiary(s.id, { description: e.target.value })} />
                    </Grid>
                  </Grid>
                  <Box mt={1} display="flex" justifyContent="space-between" alignItems="center">
                    <FormControlLabel control={<Switch checked={!!s.is_active} onChange={(e) => handleUpdateSubsidiary(s.id, { is_active: e.target.checked })} />} label="Active" />
                    <IconButton color="error" onClick={() => handleDeleteSubsidiary(s.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Box>
      )}

      {tab === 2 && (
        <Card>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Form Title" value={settings.form_title || ''} onChange={(e) => setSettings({ ...settings, form_title: e.target.value })} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Recipient Email" value={settings.email_recipient || ''} onChange={(e) => setSettings({ ...settings, email_recipient: e.target.value })} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth multiline minRows={2} label="Form Subtitle" value={settings.form_subtitle || ''} onChange={(e) => setSettings({ ...settings, form_subtitle: e.target.value })} />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel control={<Switch checked={!!settings.show_branches} onChange={(e) => setSettings({ ...settings, show_branches: e.target.checked })} />} label="Show Branches Map on Contact page" />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel control={<Switch checked={!!settings.show_subsidiaries} onChange={(e) => setSettings({ ...settings, show_subsidiaries: e.target.checked })} />} label="Show Subsidiaries on Contact page" />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel control={<Switch checked={!!settings.is_active} onChange={(e) => setSettings({ ...settings, is_active: e.target.checked })} />} label="Active" />
              </Grid>
            </Grid>
            <Box mt={2}>
              <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveSettings}>
                Save Settings
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {tab === 3 && (
        <Box>
          <Alert severity="info" sx={{ mb: 2 }}>
            This uses the same Branches editor as Branch Network. Add or edit branch locations which will appear on the Contact page map when enabled.
          </Alert>
          <BranchesEditor />
        </Box>
      )}
    </Box>
  );
};

export default ContactManagement;



