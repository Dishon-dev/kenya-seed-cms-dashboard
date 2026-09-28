import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useAuth } from "../utils/AuthContext";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          "Login failed. Check your email and password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#032610",
        backgroundImage:
          "radial-gradient(circle at 15% 15%, rgba(250,200,0,0.08), transparent 45%)",
        overflowX: "hidden",
        boxSizing: "border-box",
        px: {
          xs: 2,
          sm: 3,
          md: 5,
          lg: 6,
        },
        py: {
          xs: 3,
          sm: 4,
          md: 5,
        },
      }}
    >
      {/* Main responsive content container */}
      <Box
        sx={{
          width: "100%",
          maxWidth: 1120,
          mx: "auto",

          display: {
            xs: "flex",
            lg: "grid",
          },

          flexDirection: "column",

          gridTemplateColumns: {
            lg: "minmax(0, 1fr) 400px",
          },

          alignItems: "center",

          columnGap: {
            lg: 10,
            xl: 14,
          },

          rowGap: 5,

          boxSizing: "border-box",
        }}
      >
        {/* =========================================================
            LEFT / BRAND CONTENT
            ========================================================= */}
        <Box
          sx={{
            display: {
              xs: "none",
              lg: "flex",
            },
            width: "100%",
            maxWidth: 520,
            flexDirection: "column",
            justifyContent: "center",
            color: "#ffffff",
            justifySelf: "start",
            minWidth: 0,
          }}
        >
          {/* Logo / Brand */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              mb: 5,
            }}
          >
            <Box
              component="img"
              src="/images/ksc_logo.png"
              alt="Kenya Seed Company"
              sx={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                objectFit: "cover",
                flexShrink: 0,
              }}
            />

            <Typography
              variant="subtitle1"
              fontWeight={700}
              sx={{
                fontSize: "1rem",
                lineHeight: 1.2,
              }}
            >
              Kenya Seed CMS
            </Typography>
          </Box>

          {/* Main introduction */}
          <Box>
            {/* Accent line */}
            <Box
              sx={{
                width: 40,
                height: 3,
                bgcolor: "secondary.main",
                borderRadius: 2,
                mb: 3,
              }}
            />

            <Typography
              component="h1"
              sx={{
                fontSize: {
                  lg: "2rem",
                  xl: "2.1rem",
                },
                lineHeight: 1.18,
                fontWeight: 700,
                letterSpacing: "-0.02em",
                maxWidth: 500,
                mb: 2,
              }}
            >
              Manage every part of the Kenya Seed website from one place
            </Typography>

            <Typography
              sx={{
                color: "rgba(255,255,255,0.72)",
                fontSize: "0.95rem",
                lineHeight: 1.65,
                maxWidth: 470,
              }}
            >
              Content, products, applications, and site settings, all in one
              dashboard.
            </Typography>
          </Box>

          {/* Feature stats */}
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              gap: {
                lg: 6,
                xl: 8,
              },
              mt: 5,
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontSize: "1.4rem",
                  lineHeight: 1.2,
                  fontWeight: 700,
                  mb: 0.5,
                }}
              >
                70 Years
              </Typography>

              <Typography
                sx={{
                  color: "rgba(255,255,255,0.6)",
                  fontSize: "0.8125rem",
                  lineHeight: 1.4,
                }}
              >
                Trusted since inception
              </Typography>
            </Box>

            <Box>
              <Typography
                sx={{
                  fontSize: "1.4rem",
                  lineHeight: 1.2,
                  fontWeight: 700,
                  mb: 0.5,
                }}
              >
                Role-based
              </Typography>

              <Typography
                sx={{
                  color: "rgba(255,255,255,0.6)",
                  fontSize: "0.8125rem",
                  lineHeight: 1.4,
                }}
              >
                Granular access control
              </Typography>
            </Box>
          </Box>

          {/* Company name */}
          <Typography
            sx={{
              color: "rgba(255,255,255,0.5)",
              fontSize: "0.75rem",
              mt: 5,
            }}
          >
            Kenya Seed Company Limited
          </Typography>
        </Box>

        {/* =========================================================
            LOGIN CARD
            ========================================================= */}
        <Paper
          elevation={0}
          sx={{
            width: "100%",
            maxWidth: 400,
            justifySelf: {
              lg: "end",
            },

            boxSizing: "border-box",

            p: {
              xs: 3,
              sm: 4,
              md: 4.5,
              lg: 5,
            },

            borderRadius: {
              xs: 2.5,
              sm: 3,
            },

            boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
          }}
        >
          {/* Mobile brand */}
          <Box
            sx={{
              display: {
                xs: "flex",
                lg: "none",
              },
              alignItems: "center",
              gap: 1.25,
              mb: 4,
            }}
          >
            <Box
              component="img"
              src="/images/ksc_logo.png"
              alt="Kenya Seed Company"
              sx={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                objectFit: "cover",
                flexShrink: 0,
              }}
            />

            <Typography
              variant="subtitle1"
              fontWeight={700}
              sx={{
                fontSize: "1rem",
              }}
            >
              Kenya Seed CMS
            </Typography>
          </Box>

          {/* Heading */}
          <Typography
            component="h2"
            sx={{
              fontSize: {
                xs: "1.45rem",
                sm: "1.55rem",
              },
              lineHeight: 1.25,
              fontWeight: 700,
              mb: 0.75,
            }}
          >
            Sign in
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              lineHeight: 1.55,
              mb: 3.5,
            }}
          >
            Enter your credentials to access the dashboard.
          </Typography>

          {/* Error */}
          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 3,
              }}
            >
              {error}
            </Alert>
          )}

          {/* Form */}
          <Box component="form" onSubmit={handleSubmit}>
            {/* Email */}
            <Typography
              component="label"
              htmlFor="login-email"
              variant="body2"
              fontWeight={500}
              sx={{
                display: "block",
                mb: 0.75,
              }}
            >
              Email address
            </Typography>

            <TextField
              id="login-email"
              fullWidth
              required
              autoFocus
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              size="medium"
              sx={{
                mb: 2.5,
              }}
            />

            {/* Password */}
            <Typography
              component="label"
              htmlFor="login-password"
              variant="body2"
              fontWeight={500}
              sx={{
                display: "block",
                mb: 0.75,
              }}
            >
              Password
            </Typography>

            <TextField
              id="login-password"
              fullWidth
              required
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              size="medium"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      onClick={() => setShowPassword((value) => !value)}
                      edge="end"
                      size="small"
                    >
                      {showPassword ? (
                        <VisibilityOff fontSize="small" />
                      ) : (
                        <Visibility fontSize="small" />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* Submit */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                mt: 3,
                py: 1.15,
                fontWeight: 600,
                borderRadius: 1.5,
                textTransform: "none",
              }}
            >
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default Login;
