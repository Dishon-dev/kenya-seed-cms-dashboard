import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Grid,
  Card,
  CardContent,
  IconButton,
  Chip,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Divider,
  Tooltip,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Security as SecurityIcon, Lock as LockIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../utils/AuthContext';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5001';

interface Permission {
  id: number;
  key: string;
  label: string;
  category: string;
  description: string;
}

interface Role {
  id: number;
  name: string;
  description: string;
  is_system: boolean;
  user_count: number;
  permissions: Permission[];
}

const emptyForm = { name: '', description: '', permissionIds: [] as number[] };

const RoleManagement: React.FC = () => {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  const canView = hasPermission('roles.view');
  const canCreate = hasPermission('roles.create');
  const canEdit = hasPermission('roles.edit');
  const canDelete = hasPermission('roles.delete');

  const { data: roles, isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => { const res = await axios.get(`${API_BASE}/api/roles`); return res.data.roles as Role[]; },
    enabled: canView,
  });

  const { data: permissionsData } = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => { const res = await axios.get(`${API_BASE}/api/permissions`); return res.data.permissions as Permission[]; },
    enabled: canView,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { name: form.name, description: form.description, permissionIds: form.permissionIds };
      if (editingId) return axios.put(`${API_BASE}/api/roles/${editingId}`, payload);
      return axios.post(`${API_BASE}/api/roles`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setSnackbar({ open: true, message: `Role ${editingId ? 'updated' : 'created'} successfully`, severity: 'success' });
      closeDialog();
    },
    onError: (error: any) => {
      setSnackbar({ open: true, message: error.response?.data?.error || 'Failed to save role', severity: 'error' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => axios.delete(`${API_BASE}/api/roles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setSnackbar({ open: true, message: 'Role deleted', severity: 'success' });
    },
    onError: (error: any) => {
      setSnackbar({ open: true, message: error.response?.data?.error || 'Failed to delete role', severity: 'error' });
    },
  });

  const openCreateDialog = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEditDialog = (role: Role) => {
    setEditingId(role.id);
    setForm({ name: role.name, description: role.description || '', permissionIds: role.permissions.map((p) => p.id) });
    setDialogOpen(true);
  };
  const closeDialog = () => { setDialogOpen(false); setEditingId(null); };

  const togglePermission = (id: number) => {
    setForm((prev) => ({
      ...prev,
      permissionIds: prev.permissionIds.includes(id)
        ? prev.permissionIds.filter((p) => p !== id)
        : [...prev.permissionIds, id]
    }));
  };

  if (!canView) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning" icon={<LockIcon />}>
          You do not have permission to manage roles.
        </Alert>
      </Box>
    );
  }

  const permissions = permissionsData || [];
  const permissionsByCategory = permissions.reduce<Record<string, Permission[]>>((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {});

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Roles & Permissions</Typography>
          <Typography variant="body2" color="text.secondary">Create roles and control what each one can access</Typography>
        </Box>
        {canCreate && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateDialog}>New Role</Button>
        )}
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : (
        <Grid container spacing={3}>
          {(roles || []).map((role) => (
            <Grid item xs={12} sm={6} md={4} key={role.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <SecurityIcon color="primary" fontSize="small" />
                      <Typography variant="subtitle1" fontWeight={600}>{role.name}</Typography>
                    </Box>
                    {role.is_system && <Chip size="small" label="System" />}
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                    {role.description || 'No description'}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip size="small" label={`${role.permissions.length} permissions`} variant="outlined" />
                    <Chip size="small" label={`${role.user_count} user${role.user_count === 1 ? '' : 's'}`} variant="outlined" />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                    {canEdit && (
                      <IconButton size="small" onClick={() => openEditDialog(role)}><EditIcon fontSize="small" /></IconButton>
                    )}
                    {canDelete && (
                      <Tooltip title={role.is_system ? 'System roles cannot be deleted' : role.user_count > 0 ? 'Reassign users before deleting' : 'Delete role'}>
                        <span>
                          <IconButton
                            size="small"
                            color="error"
                            disabled={role.is_system || role.user_count > 0}
                            onClick={() => deleteMutation.mutate(role.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit Role' : 'New Role'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField label="Role Name" fullWidth required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <TextField label="Description" fullWidth multiline rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

          <Typography variant="subtitle2" sx={{ mt: 1 }}>Permissions</Typography>
          {Object.entries(permissionsByCategory).map(([category, perms]) => (
            <Box key={category}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>{category}</Typography>
              <FormGroup>
                {perms.map((perm) => (
                  <FormControlLabel
                    key={perm.id}
                    control={
                      <Checkbox
                        size="small"
                        checked={form.permissionIds.includes(perm.id)}
                        onChange={() => togglePermission(perm.id)}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2">{perm.label}</Typography>
                        {perm.description && (
                          <Typography variant="caption" color="text.secondary">{perm.description}</Typography>
                        )}
                      </Box>
                    }
                  />
                ))}
              </FormGroup>
              <Divider sx={{ my: 1 }} />
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button variant="contained" disabled={!form.name || saveMutation.isPending} onClick={() => saveMutation.mutate()}>
            {saveMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default RoleManagement;
