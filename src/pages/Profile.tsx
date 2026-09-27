import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Alert,
  Avatar,
  Chip,
  Divider,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../utils/AuthContext';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5001';

interface ProfileData {
  id: number;
  email: string;
  name: string;
  role_name: string;
  created_at: string;
}

const Profile: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => { const res = await axios.get(`${API_BASE}/api/auth/me`); return res.data.user as ProfileData; },
  });

  useEffect(() => {
    if (profile) setName(profile.name || '');
  }, [profile]);

  const updateNameMutation = useMutation({
    mutationFn: () => axios.put(`${API_BASE}/api/auth/profile`, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setNotice({ type: 'success', message: 'Profile updated.' });
    },
    onError: () => setNotice({ type: 'error', message: 'Failed to update profile.' }),
  });

  const updatePasswordMutation = useMutation({
    mutationFn: () => axios.put(`${API_BASE}/api/auth/profile`, { currentPassword, newPassword }),
    onSuccess: () => {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setNotice({ type: 'success', message: 'Password changed.' });
    },
    onError: (error: any) => {
      setNotice({ type: 'error', message: error.response?.data?.error || 'Failed to change password.' });
    },
  });

  const canChangePassword = currentPassword && newPassword.length >= 8 && newPassword === confirmPassword;
  const passwordMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  return (
    <Box sx={{ px: 3, maxWidth: 640 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>Your profile</Typography>

      {notice && (
        <Alert severity={notice.type} sx={{ mb: 3 }} onClose={() => setNotice(null)}>
          {notice.message}
        </Alert>
      )}

      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main', fontSize: '1.25rem', fontWeight: 600 }}>
            {(profile?.name || profile?.email || '?').charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight={600}>{profile?.name || 'Unnamed user'}</Typography>
            <Typography variant="body2" color="text.secondary">{profile?.email}</Typography>
          </Box>
          <Chip size="small" label={profile?.role_name || user?.role} sx={{ ml: 'auto' }} />
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Display name</Typography>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <TextField fullWidth value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          <Button
            variant="contained"
            disabled={!name || name === profile?.name || updateNameMutation.isPending}
            onClick={() => updateNameMutation.mutate()}
            sx={{ flexShrink: 0 }}
          >
            Save
          </Button>
        </Box>
      </Paper>

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 0.5 }}>Change password</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          Enter your current password to set a new one.
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Current password"
            type={showPasswords ? 'text' : 'password'}
            fullWidth
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <TextField
            label="New password"
            type={showPasswords ? 'text' : 'password'}
            fullWidth
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            helperText="Minimum 8 characters"
          />
          <TextField
            label="Confirm new password"
            type={showPasswords ? 'text' : 'password'}
            fullWidth
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={passwordMismatch}
            helperText={passwordMismatch ? 'Passwords do not match' : ' '}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setShowPasswords((v) => !v)}>
                    {showPasswords ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            disabled={!canChangePassword || updatePasswordMutation.isPending}
            onClick={() => updatePasswordMutation.mutate()}
            sx={{ alignSelf: 'flex-start' }}
          >
            {updatePasswordMutation.isPending ? 'Updating…' : 'Update password'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default Profile;
