import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Paper, TextField, Button, Typography, Alert, InputAdornment, IconButton } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../utils/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: { xs: 'center', md: 'flex-end' },
        bgcolor: '#032610',
        backgroundImage: 'radial-gradient(circle at 15% 15%, rgba(250,200,0,0.08), transparent 45%)',
        px: { xs: 3, md: 8 },
        py: 6,
      }}
    >
      {/* Left side - brand and context, sits directly on the green, no boxed column */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 5,
          color: '#ffffff',
          maxWidth: 420,
          mr: 8,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box component="img" src="/images/ksc_logo.png" alt="Kenya Seed Company" sx={{ width: 40, height: 40, borderRadius: '50%' }} />
          <Typography variant="subtitle1" fontWeight={700} sx={{ fontSize: '1rem' }}>
            Kenya Seed CMS
          </Typography>
        </Box>

        <Box>
          <Box sx={{ width: 40, height: 3, bgcolor: 'secondary.main', borderRadius: 2, mb: 3 }} />
          <Typography variant="h2" sx={{ fontSize: '1.75rem', fontWeight: 700, mb: 2 }}>
            Manage every part of the Kenya Seed website from one place
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.72)', fontSize: '0.9375rem', lineHeight: 1.6 }}>
            Content, products, applications, and site settings, all in one dashboard.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 5 }}>
          <Box>
            <Typography sx={{ fontSize: '1.375rem', fontWeight: 700 }}>70 Years</Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8125rem' }}>Trusted since inception</Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: '1.375rem', fontWeight: 700 }}>Role-based</Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8125rem' }}>Granular access control</Typography>
          </Box>
        </Box>

        <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
          Kenya Seed Company Limited
        </Typography>
      </Box>

      {/* Right side - the login form as a floating card, matching the reference's structure */}
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 400,
          p: { xs: 3.5, sm: 5 },
          borderRadius: 3,
          boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
        }}
      >
        <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1.25, mb: 4 }}>
          <Box component="img" src="/images/ksc_logo.png" alt="Kenya Seed Company" sx={{ width: 32, height: 32, borderRadius: '50%' }} />
          <Typography variant="subtitle1" fontWeight={700}>Kenya Seed CMS</Typography>
        </Box>

        <Typography variant="h4" sx={{ mb: 0.5 }}>Sign in</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Enter your credentials to access the dashboard.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Typography variant="body2" fontWeight={500} sx={{ mb: 0.75 }}>Email address</Typography>
          <TextField
            fullWidth
            required
            autoFocus
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            sx={{ mb: 2.5 }}
          />

          <Typography variant="body2" fontWeight={500} sx={{ mb: 0.75 }}>Password</Typography>
          <TextField
            fullWidth
            required
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton aria-label="toggle password visibility" onClick={() => setShowPassword((v) => !v)} edge="end" size="small">
                    {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button type="submit" fullWidth variant="contained" size="large" sx={{ mt: 3, py: 1.1 }} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default Login;
