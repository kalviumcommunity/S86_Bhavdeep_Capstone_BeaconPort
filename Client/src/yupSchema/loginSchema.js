import * as yup from 'yup';

export const loginSchema = yup.object({
  email: yup.string()
    .email('Enter a valid email')
    .required('Email is required'),
  password: yup.string()
    .min(6, 'Password should be at least 6 characters')
    .required('Password is required'),
});