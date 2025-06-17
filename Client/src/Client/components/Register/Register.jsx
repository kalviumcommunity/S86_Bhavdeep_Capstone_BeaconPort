/* eslint-disable no-unused-vars */
import * as React from 'react';
import axios from 'axios';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import { useFormik } from 'formik';
import { registerSchema } from '../../../yupSchema/registerSchema';
import { Button, CardMedia, Typography, Alert, CircularProgress } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import BookIcon from '@mui/icons-material/MenuBook';
import { styled } from '@mui/material/styles';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useNavigate } from 'react-router-dom';
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
            '& fieldset': {
              borderColor: '#444444',
            },
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
          background: 'linear-gradient(45deg, #FF9800 30%, #FF5722 90%)',
          boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)',
        },
      },
    },
  },
});

export default function Register() {
  const navigate = useNavigate();
  const [file, setFile] = React.useState(null);
  const [imageUrl, setImageUrl] = React.useState(null);
  const [loading, setLoading] = React.useState(false);  
  const [error, setError] = React.useState(null);
  const [success, setSuccess] = React.useState(null);
  const [termsAccepted, setTermsAccepted] = React.useState(false);
  const [oauthData, setOauthData] = React.useState(null);
  const [showOauthForm, setShowOauthForm] = React.useState(false);

  // Improved image validation
  const isValidImageFile = (file) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
      return false;
    }
    
    if (file.size > maxSize) {
      setError('Image size should be less than 10MB');
      return false;
    }
    
    return true;
  };

  const addImage = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      if (isValidImageFile(selectedFile)) {
        setImageUrl(URL.createObjectURL(selectedFile));
        setFile(selectedFile);
        setError(null);
      } else {
        // Clear the file input if validation fails
        event.target.value = '';
      }
    }
  };

  const fileInputRef = React.useRef(null);
  const hiddenFileInputRef = React.useRef(null);
  const oauthFileInputRef = React.useRef(null);

  const handleClearFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (hiddenFileInputRef.current) {
      hiddenFileInputRef.current.value = '';
    }
    if (oauthFileInputRef.current) {
      oauthFileInputRef.current.value = '';
    }
    setFile(null);
    setImageUrl(null);
  };

  const handleUploadClick = () => {
    if (showOauthForm && oauthFileInputRef.current) {
      oauthFileInputRef.current.click();
    } else if (hiddenFileInputRef.current) {
      hiddenFileInputRef.current.click();
    }
  };

  const initialValues = {
    schoolName: "",
    email: "",
    ownerName: "",
    password: "",
    confirmPassword: ""
  };

  const oauthFormValues = {
    schoolName: "",
    ownerName: ""
  };

  // Load Google OAuth script
  React.useEffect(() => {
    const loadGoogleScript = () => {
      if (window.google) return;
      
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    };

    loadGoogleScript();
  }, []);


  // Traditional form submission with proper FormData handling for Cloudinary
  const formik = useFormik({
    initialValues,
    validationSchema: registerSchema,
    onSubmit: async (values) => {
      setLoading(true);
      setError(null);
      setSuccess(null);

      try {
        if (!file) {
          setError("School image is required");
          setLoading(false);
          return;
        }

        if (!termsAccepted) {
          setError("Please accept the Terms and Conditions");
          setLoading(false);
          return;
        }

        // Create FormData for traditional registration with image for Cloudinary
        const formData = new FormData();
        formData.append("image", file); // This will be uploaded to Cloudinary by the backend
        formData.append("schoolName", values.schoolName.trim());
        formData.append("email", values.email.trim().toLowerCase());
        formData.append("ownerName", values.ownerName.trim());
        formData.append("password", values.password);

        console.log('Sending registration request with image to Cloudinary...');

        const response = await axios.post(
          `${baseApi}/school/register`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            },
            timeout: 30000 // 30 second timeout for Cloudinary upload
          }
        );

        if (response?.data?.success) {
          setSuccess("School registered successfully! Image saved to Cloudinary. Redirecting to login...");
          
          formik.resetForm();
          handleClearFile();
          setTermsAccepted(false);
          
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        }

      } catch (error) {
        console.error("Registration error:", error);
        
        if (error.response?.data?.message) {
          setError(error.response.data.message);
        } else if (error.code === 'ECONNABORTED') {
          setError('Upload timeout. Please try again with a smaller image.');
        } else if (error.response) {
          setError("Registration failed. Please try again.");
        } else if (error.request) {
          setError("Network error. Please check your connection and try again.");
        } else {
          setError("Registration failed. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <ThemeProvider theme={darkTheme}>
      <div className="min-h-screen bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
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
            maxWidth: '600px',
            padding: '30px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
            bgcolor: 'background.paper',
          }}
          className="bg-gray-800 border border-gray-700"
          noValidate
          autoComplete="off"
          onSubmit={showOauthForm ? oauthFormik.handleSubmit : formik.handleSubmit}
        >
          <div className="flex items-center justify-center mb-4">
            <BookIcon sx={{ color: '#FF9800', fontSize: 40, mr: 1 }} />
            <Typography variant="h5" gutterBottom sx={{ color: 'text.primary', m: 0 }}>
              {showOauthForm ? `Complete Google Registration` : 'Signup to your account'}
            </Typography>
          </div>
          <Typography variant="body2" className="text-gray-400 text-center mb-6">
            Join our School Management System - Images automatically saved to Cloudinary
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          {showOauthForm ? (
            // OAuth completion form
            <>
              {oauthData?.email && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Registering with email: {oauthData.email}
                </Alert>
              )}
              
              <TextField
                name="schoolName"
                label="Institute Name"
                value={oauthFormik.values.schoolName}
                onChange={oauthFormik.handleChange}
                onBlur={oauthFormik.handleBlur}
                required
                sx={{ mb: 2 }}
              />

              <TextField
                name="ownerName"
                label="Owner Name"
                value={oauthFormik.values.ownerName}
                onChange={oauthFormik.handleChange}
                onBlur={oauthFormik.handleBlur}
                required
                sx={{ mb: 3 }}
              />

              {/* Image upload for OAuth form - will be saved to Cloudinary */}
              <Typography className="text-gray-300 mb-1">Institute Image * (will be saved to Cloudinary)</Typography>
              <input
                type="file"
                ref={oauthFileInputRef}
                onChange={addImage}
                accept="image/jpeg,image/png,image/gif,image/webp"
                style={{ display: 'none' }}
              />
              <div className="mb-4 flex items-center">
                <Button
                  variant="outlined"
                  onClick={handleUploadClick}
                  className="bg-amber-500 flex justify-center items-center h-10 gap-5"
                >
                  <CloudUploadIcon />
                  Upload School Image
                </Button>
                {file && (
                  <Typography variant="body2" className="ml-2 text-gray-300">
                    {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </Typography>
                )}
              </div>

              {imageUrl && (
                <Box sx={{ maxWidth: '300px', marginTop: '10px', marginBottom: '20px' }}>
                  <CardMedia
                    component={'img'}
                    image={imageUrl}
                    alt="School preview"
                    sx={{
                      borderRadius: '8px',
                      border: '1px solid #444',
                      maxHeight: '200px',
                      objectFit: 'contain'
                    }}
                  />
                  <Typography variant="caption" className="text-gray-400 mt-1 block">
                    This image will be uploaded to Cloudinary
                  </Typography>
                  <Button
                    size="small"
                    color="error"
                    onClick={handleClearFile}
                    sx={{ mt: 1 }}
                  >
                    Clear Image
                  </Button>
                </Box>
              )}

              <div className="flex items-center gap-3 mb-4">
                <input
                  id="oauth-terms-checkbox"
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="w-4 h-4 text-orange-500 bg-gray-700 border-gray-600 rounded focus:ring-orange-500"
                />
                <label htmlFor="oauth-terms-checkbox" className="ml-2 text-sm text-gray-300">
                  I agree to the Terms and Conditions and Privacy Policy
                </label>
              </div>

              <Button
                type='submit'
                variant="contained"
                disabled={loading}
                sx={{
                  mt: 1,
                  py: 1.5,
                  textTransform: 'uppercase',
                  fontWeight: 'bold'
                }}
                className="bg-gradient-to-r from-amber-500 to-orange-600"
              >
                {loading ? <CircularProgress size={24} /> : `Complete Google Registration`}
              </Button>

              <Button
                onClick={() => {
                  setShowOauthForm(false);
                  setOauthData(null);
                  setTermsAccepted(false);
                  handleClearFile();
                }}
                sx={{ mt: 2 }}
                variant="outlined"
              >
                Back to Registration Options
              </Button>
            </>
          ) : (
            // Traditional registration form
            <>
              <TextField
                name="schoolName"
                label="Institute Name"
                value={formik.values.schoolName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.schoolName && Boolean(formik.errors.schoolName)}
                helperText={formik.touched.schoolName && formik.errors.schoolName}
                sx={{ mb: 2 }}
              />

              <TextField
                name="ownerName"
                label="Owner Name"
                value={formik.values.ownerName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.ownerName && Boolean(formik.errors.ownerName)}
                helperText={formik.touched.ownerName && formik.errors.ownerName}
                sx={{ mb: 2 }}
              />

              <TextField
                name="email"
                label="Email address"
                type="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
                sx={{ mb: 2 }}
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
                sx={{ mb: 2 }}
              />

              <TextField
                type='password'
                name="confirmPassword"
                label="Confirm password"
                value={formik.values.confirmPassword}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
                helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
                sx={{ mb: 3 }}
              />

              <Typography className="text-gray-300 mb-1">Institute Image * (will be saved to Cloudinary)</Typography>
              <input
                type="file"
                ref={hiddenFileInputRef}
                onChange={addImage}
                accept="image/jpeg,image/png,image/gif,image/webp"
                style={{ display: 'none' }}
              />
              <div className="mb-4 flex items-center">
                <Button
                  variant="outlined"
                  onClick={handleUploadClick}
                  className="bg-amber-500 flex justify-center items-center h-10 gap-5"
                >
                  <CloudUploadIcon />
                  Upload Image
                </Button>
                {file && (
                  <Typography variant="body2" className="ml-2 text-gray-300">
                    {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </Typography>
                )}
              </div>

              {imageUrl && (
                <Box sx={{ maxWidth: '300px', marginTop: '10px', marginBottom: '20px' }}>
                  <CardMedia
                    component={'img'}
                    image={imageUrl}
                    alt="School preview"
                    sx={{
                      borderRadius: '8px',
                      border: '1px solid #444',
                      maxHeight: '200px',
                      objectFit: 'contain'
                    }}
                  />
                  <Typography variant="caption" className="text-gray-400 mt-1 block">
                    This image will be uploaded to Cloudinary when you register
                  </Typography>
                  <Button
                    size="small"
                    color="error"
                    onClick={handleClearFile}
                    sx={{ mt: 1 }}
                  >
                    Clear Image
                  </Button>
                </Box>
              )}

              <div className="flex items-center gap-3 mb-4">
                <input
                  id="terms-checkbox"
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="w-4 h-4 text-orange-500 bg-gray-700 border-gray-600 rounded focus:ring-orange-500"
                />
                <label htmlFor="terms-checkbox" className="ml-2 text-sm text-gray-300">
                  I agree to the Terms and Conditions and Privacy Policy
                </label>
              </div>

              <Button
                type='submit'
                variant="contained"
                disabled={loading}
                sx={{
                  mt: 1,
                  py: 1.5,
                  textTransform: 'uppercase',
                  fontWeight: 'bold'
                }}
                className="bg-gradient-to-r from-amber-500 to-orange-600"
              >
                {loading ? <CircularProgress size={24} /> : 'Sign Up'}
              </Button>

              <div className="mt-4 text-center">
                <Typography variant="body2" className="text-gray-400">
                  Already have an account?
                  <span onClick={() => navigate('/login')} className="text-orange-500 ml-1 cursor-pointer hover:underline">
                    Login
                  </span>
                </Typography>
              </div>

            </>
          )}
        </Box>
      </div>
    </ThemeProvider>
  );
}