import * as React from 'react';
import axios from 'axios';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import { useFormik } from 'formik';
import { Button, Typography, Alert, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { School, Users, GraduationCap } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { loginSchema } from '../../../yupSchema/loginSchema';
import { AuthContext } from '../../../context/AuthContext';
import { baseApi } from '../../../environment';

// Create a custom dark theme with orange/yellow/red accents
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#FF9800', // Orange
    },
    secondary: {
      main: '#FF5722', // Deep Orange
    },
    background: {
      default: '#121212',
      paper: '#1E1E2E',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#E0E0E0',
    },
    error: {
      main: '#F44336',
    },
    success: {
      main: '#66BB6A',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h5: {
      fontWeight: 600,
    },
  },
  components: {
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '&:hover fieldset': {
              borderColor: '#FF9800',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#FF9800',
            },
          },
          '& .MuiInputLabel-root': {
            color: '#BBBBBB',
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: '#FF9800',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        contained: {
          background: 'linear-gradient(45deg, #FF9800 30%, #FF5722 100%)',
          boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)',
        },
      },
    },
  },
});

export default function Login() {
  const { login } = React.useContext(AuthContext);
  const navigate = useNavigate();
  const { role } = useParams(); // Get role from URL params
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [success, setSuccess] = React.useState(null);
  const [rememberMe, setRememberMe] = React.useState(false);


  // Forgot Password states
  const [forgotPasswordOpen, setForgotPasswordOpen] = React.useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = React.useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = React.useState(false);
  const [forgotPasswordMessage, setForgotPasswordMessage] = React.useState('');
  const [forgotPasswordError, setForgotPasswordError] = React.useState('');

  const initialValues = {
    email: "",
    password: "",
  };

  // Role configuration
  const roleConfig = {
    school: {
      title: 'School Admin',
      icon: <School className="w-12 h-12 text-orange-500" />,
      color: 'from-orange-500 to-red-500',
      description: 'Administrative Dashboard'
    },
    teacher: {
      title: 'Teacher',
      icon: <Users className="w-12 h-12 text-blue-500" />,
      color: 'from-blue-500 to-indigo-500',
      description: 'Teaching Dashboard'
    },
    student: {
      title: 'Student',
      icon: <GraduationCap className="w-12 h-12 text-green-500" />,
      color: 'from-green-500 to-teal-500',
      description: 'Student Portal'
    }
  };

  // Initialize formik with default values
  const formik = useFormik({
    initialValues,
    validationSchema: loginSchema,
    onSubmit: async (values) => {
      // If no role is specified, redirect to role selection
      if (!role || !roleConfig[role]) {
        navigate('/select-role');
        return;
      }

      setLoading(true);
      setError(null);

      let URL;
      if (role === "student") {
        URL = `${baseApi}/student/login`
      } else if (role === "teacher") {
        URL = `${baseApi}/teacher/login`
      } else if (role === 'school') {
        URL = `${baseApi}/school/login`
      }

      try {
        const response = await axios.post(
          URL,
          {
            email: values.email,
            password: values.password
          }
        );

        // Handle remember me functionality (role-specific)
        if (rememberMe) {
          localStorage.setItem(`rememberedEmail_${role}`, values.email);
          localStorage.setItem(`rememberedPassword_${role}`, values.password);
          localStorage.setItem(`rememberMe_${role}`, 'true');
        } else {
          // Clear remembered credentials for this role
          localStorage.removeItem(`rememberedEmail_${role}`);
          localStorage.removeItem(`rememberedPassword_${role}`);
          localStorage.removeItem(`rememberMe_${role}`);
        }

        // Store token in localStorage
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);

          // Store user data if needed
          if (response.data.user) {
            localStorage.setItem('user', JSON.stringify(response.data.user));
            login({
              token: response.data.token,
              user: response.data.user
            });
          }
        }

        setSuccess("Login successful!");

        // Handle successful login (redirect to dashboard)
        setTimeout(() => {
          navigate(`/${role}`);
        }, 1000);
      } catch (error) {
        console.error("Login error:", error);
        setError(
          error.response?.data?.message ||
          "Invalid email or password"
        );
      } finally {
        setLoading(false);
      }
    }
  });

  // Redirect if no role or invalid role
  React.useEffect(() => {
    if (!role || !roleConfig[role]) {
      navigate('/select-role');
      return;
    }
  }, [role, navigate]);

  // Load remembered credentials on component mount (role-specific)
  React.useEffect(() => {
    if (role && roleConfig[role]) {
      const rememberedEmail = localStorage.getItem(`rememberedEmail_${role}`);
      const rememberedPassword = localStorage.getItem(`rememberedPassword_${role}`);
      const isRemembered = localStorage.getItem(`rememberMe_${role}`) === 'true';

      if (isRemembered && rememberedEmail) {
        formik.setFieldValue('email', rememberedEmail);
        if (rememberedPassword) {
          formik.setFieldValue('password', rememberedPassword);
        }
        setRememberMe(true);
      }
    }
  }, [role]);

  const handleRememberMeChange = () => {
    setRememberMe(!rememberMe);
  };

// Fixed Forgot Password Handler in Login Component
const handleForgotPassword = async () => {
  if (!forgotPasswordEmail) {
    setForgotPasswordError('Please enter your email address');
    setForgotPasswordMessage('');
    return;
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(forgotPasswordEmail)) {
    setForgotPasswordError('Please enter a valid email address');
    setForgotPasswordMessage('');
    return;
  }

  setForgotPasswordLoading(true);
  setForgotPasswordMessage('');
  setForgotPasswordError('');

  try {
    // Fixed API endpoint - removed extra space and ensured correct URL
    const response = await axios.post(`${baseApi}/school/forgot-password`, {
      email: forgotPasswordEmail.trim()
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    });

    setForgotPasswordMessage(response.data.message || 'Password reset link sent to your email');
    setForgotPasswordError('');

    // Clear the email field and close dialog after successful request
    setTimeout(() => {
      setForgotPasswordEmail('');
      setForgotPasswordOpen(false);
      setForgotPasswordMessage('');
      setForgotPasswordError('');
    }, 4000); // Increased time to read the message

  } catch (error) {
    console.error("Forgot password error:", error);
    
    let errorMessage = 'Failed to send reset email. Please try again.';
    
    if (error.response) {
      // Server responded with error status
      errorMessage = error.response.data?.message || errorMessage;
    } else if (error.request) {
      // Request was made but no response received
      errorMessage = 'Network error. Please check your connection and try again.';
    } else if (error.code === 'ECONNABORTED') {
      // Request timeout
      errorMessage = 'Request timeout. Please try again.';
    }
    
    setForgotPasswordError(errorMessage);
    setForgotPasswordMessage('');
  } finally {
    setForgotPasswordLoading(false);
  }
};

  // Open forgot password dialog and pre-fill email if available
  const openForgotPasswordDialog = () => {
    setForgotPasswordEmail(formik.values.email || '');
    setForgotPasswordMessage('');
    setForgotPasswordError('');
    setForgotPasswordOpen(true);
  };



  // Return loading if role is invalid (will redirect)
  if (!role || !roleConfig[role]) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Redirecting...</div>
      </div>
    );
  }

  const currentRole = roleConfig[role];

  return (
    <ThemeProvider theme={darkTheme}>
      <div className="min-h-screen bg-gray-900 flex items-center justify-center py-5 px-4 sm:px-6 lg:px-8">
        <Box
          component="form"
          sx={{
            '& > :not(style)': { m: 1 },
            display: "flex",
            flexDirection: "column",
            margin: "50px",
            justifyContent: "center",
            width: "80vw",
            minWidth: '320px',
            maxWidth: '500px',
            borderRadius: { xs: '5px', lg: '12px' },
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
            bgcolor: 'background.paper',
          }}
          className="bg-gray-800 p-2 lg:p-8 border border-gray-700"
          noValidate
          autoComplete="off"
          onSubmit={formik.handleSubmit}
        >
          {/* Role Header */}
          <div className="flex flex-col gap-5 items-center justify-center">
            {currentRole.icon}
            <Typography variant="h5" gutterBottom sx={{ color: 'text.primary', m: 0, ml: 2 }}>
              {currentRole.title} Login
            </Typography>
          </div>
          <Typography variant="body2" className="text-gray-400 text-center mb-4">
            {currentRole.description}
          </Typography>

          {/* Role Selection Link */}
          <div className="text-center mb-6">
            <button
              type="button"
              onClick={() => navigate('/select-role')}
              className="text-orange-500 hover:text-orange-400 text-sm underline"
            >
              Switch to different role
            </button>
          </div>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          <TextField
            name="email"
            label="Email address"
            type="email"
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.email && Boolean(formik.errors.email)}
            helperText={formik.touched.email && formik.errors.email}
            sx={{ mb: 3 }}
          />

          <TextField
            type='password'
            name="password"
            label="Password"
            value={formik.values.password}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.password && Boolean(formik.errors.password)}
            helperText={formik.touched.password && formik.errors.password}
            sx={{ mb: 3 }}
          />

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={handleRememberMeChange}
                className="h-4 w-4 text-orange-500  accent-amber-500 rounded focus:ring-orange-500"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
                Remember me
              </label>
            </div>
            <div className="text-sm">
              {role === 'school' && (
                <button
                  type="button"
                  onClick={openForgotPasswordDialog}
                  className="text-orange-500 hover:text-orange-400 bg-transparent border-none cursor-pointer"
                >
                  Forgot your password?
                </button>
              )}
            </div>
          </div>
          {role === 'school' && (
            <div className="mt-4 text-center">
              <Typography variant="body2" className="text-gray-400">
                Don't have an account?{' '}
                <span onClick={() => navigate('/register')} className="text-orange-500 cursor-pointer hover:underline">
                  Register
                </span>
              </Typography>
            </div>
          )}

          {/* Only show Google OAuth section when School Admin is selected */}
          {role === 'school' }
        </Box>

        {/* Forgot Password Dialog */}
        <Dialog
          open={forgotPasswordOpen}
          onClose={() => {
            setForgotPasswordOpen(false);
            setForgotPasswordMessage('');
            setForgotPasswordError('');
          }}
          PaperProps={{
            sx: {
              bgcolor: 'background.paper',
              color: 'text.primary',
              minWidth: { xs: '90vw', sm: '400px' }
            }
          }}
        >
          <DialogTitle sx={{ color: 'text.primary' }}>
            Reset Your Password
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
              Enter your email address and we'll send you a link to reset your password.
            </Typography>
            <TextField
              autoFocus
              margin="dense"
              label="Email Address"
              type="email"
              fullWidth
              variant="outlined"
              value={forgotPasswordEmail}
              onChange={(e) => setForgotPasswordEmail(e.target.value)}
              sx={{ mt: 2 }}
              error={Boolean(forgotPasswordError)}
            />
            {forgotPasswordMessage && (
              <Alert severity="success" sx={{ mt: 2 }}>
                {forgotPasswordMessage}
              </Alert>
            )}
            {forgotPasswordError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {forgotPasswordError}
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setForgotPasswordOpen(false);
                setForgotPasswordMessage('');
                setForgotPasswordError('');
              }}
              sx={{ color: 'text.secondary' }}
              disabled={forgotPasswordLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleForgotPassword}
              disabled={forgotPasswordLoading}
              variant="contained"
            >
              {forgotPasswordLoading ? <CircularProgress size={20} /> : 'Send Reset Link'}
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </ThemeProvider>
  );
}