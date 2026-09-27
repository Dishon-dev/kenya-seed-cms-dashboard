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
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  IconButton,
  Chip,
  MenuItem,
  Switch,
  FormControlLabel,
  CircularProgress,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, People as PeopleIcon, Lock as LockIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../utils/AuthContext';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5001';

interface User {
  id: number;
  email: string;
  name: string;
  is_active: boolean;
  role_id: number | null;
  role_name: string | null;
  created_at: string;
}

interface Role {
  id: number;
  name: string;
}

const emptyForm = { email: '', password: '', name: '', roleId: '' };

const UserManagement: React.FC = () => {
  const { user: currentUser, hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  const canView = hasPermission('users.view');
  const canCreate = hasPermission('users.create');
  const canEdit = hasPermission('users.edit');
  const canDelete = hasPermission('users.delete');

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => { const res = await axios.get(`${API_BASE}/api/users`); return res.data.users as User[]; },
    enabled: canView,
  });

  const { data: rolesData } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => { const res = await axios.get(`${API_BASE}/api/roles`); return res.data.roles as Role[]; },
    enabled: canView,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = { name: form.name, roleId: Number(form.roleId) };
      if (!editingId) {
        payload.email = form.email;
        payload.password = form.password;
      } else if (form.password) {
        payload.password = form.password;
      }
      if (editingId) return axios.put(`${API_BASE}/api/users/${editingId}`, payload);
      return axios.post(`${API_BASE}/api/users`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setSnackbar({ open: true, message: `User ${editingId ? 'updated' : 'created'} successfully`, severity: 'success' });
      closeDialog();
    },
    onError: (error: any) => {
      setSnackbar({ open: true, message: error.response?.data?.error || 'Failed to save user', severity: 'error' });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      axios.put(`${API_BASE}/api/users/${id}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      setSnackbar({ open: true, message: error.response?.data?.error || 'Failed to update user', severity: 'error' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => axios.delete(`${API_BASE}/api/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setSnackbar({ open: true, message: 'User deleted', severity: 'success' });
    },
    onError: (error: any) => {
      setSnackbar({ open: true, message: error.response?.data?.error || 'Failed to delete user', severity: 'error' });
    },
  });

  const openCreateDialog = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEditDialog = (u: User) => {
    setEditingId(u.id);
    setForm({ email: u.email, password: '', name: u.name || '', roleId: u.role_id ? String(u.role_id) : '' });
    setDialogOpen(true);
  };
  const closeDialog = () => { setDialogOpen(false); setEditingId(null); };

  if (!canView) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning" icon={<LockIcon />}>
          You do not have permission to manage users.
        </Alert>
      </Box>
    );
  }

  const roles = rolesData || [];
  const userList = users || [];
  const canSave = editingId ? form.name && form.roleId : form.email && form.password && form.roleId;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Users</Typography>
          <Typography variant="body2" color="text.secondary">Manage CMS accounts and their assigned roles</Typography>
        </Box>
        {canCreate && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateDialog}>New User</Button>
        )}
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : userList.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <PeopleIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">No users yet.</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {userList.map((u) => {
                const isSelf = !!currentUser && Number(currentUser.id) === u.id;
                return (
                  <TableRow key={u.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {u.name || '—'} {isSelf && <Chip size="small" label="You" sx={{ ml: 1 }} />}
                      </Typography>
                    </TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell><Chip size="small" label={u.role_name || 'No role'} /></TableCell>
                    <TableCell>
                      <FormControlLabel
                        control={
                          <Switch
                            size="small"
                            checked={u.is_active}
                            disabled={isSelf || !canEdit}
                            onChange={(e) => toggleActiveMutation.mutate({ id: u.id, isActive: e.target.checked })}
                          />
                        }
                        label={u.is_active ? 'Active' : 'Inactive'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      {canEdit && (
                        <IconButton size="small" onClick={() => openEditDialog(u)}><EditIcon fontSize="small" /></IconButton>
                      )}
                      {canDelete && (
                        <IconButton size="small" color="error" disabled={isSelf} onClick={() => deleteMutation.mutate(u.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit User' : 'New User'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Email"
            fullWidth
            required
            disabled={!!editingId}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <TextField label="Name" fullWidth value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <TextField
            label={editingId ? 'New Password (leave blank to keep current)' : 'Password'}
            type="password"
            fullWidth
            required={!editingId}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            helperText="Minimum 8 characters"
          />
          <TextField
            select
            label="Role"
            fullWidth
            required
            value={form.roleId}
            onChange={(e) => setForm({ ...form, roleId: e.target.value })}
          >
            {roles.map((r) => <MenuItem key={r.id} value={String(r.id)}>{r.name}</MenuItem>)}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button variant="contained" disabled={!canSave || saveMutation.isPending} onClick={() => saveMutation.mutate()}>
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

export default UserManagement;
