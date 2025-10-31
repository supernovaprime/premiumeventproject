import { createContext, useContext, useReducer, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import api from '../services/api';

// Initial state
const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  refreshToken: localStorage.getItem('refreshToken'),
  isAuthenticated: false,
  isLoading: true,
  error: null
};

// Action types
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGOUT: 'LOGOUT',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  UPDATE_USER: 'UPDATE_USER'
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };
    
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        refreshToken: action.payload.refreshToken,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };
    
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      };
    
    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };
    
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
    
    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };
    
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const queryClient = useQueryClient();

  // Set up axios interceptor for token
  useEffect(() => {
    if (state.token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
      localStorage.setItem('token', state.token);
    } else {
      delete api.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  }, [state.token]);

  // Set up axios interceptor for refresh token
  useEffect(() => {
    if (state.refreshToken) {
      localStorage.setItem('refreshToken', state.refreshToken);
    } else {
      localStorage.removeItem('refreshToken');
    }
  }, [state.refreshToken]);

  // Get current user query
  const { data: userData, isLoading: userLoading } = useQuery(
    'currentUser',
    async () => {
      if (!state.token) return null;
      const response = await api.get('/auth/me');
      return response.data.data.user;
    },
    {
      enabled: !!state.token,
      retry: false,
      onError: (error) => {
        if (error.response?.status === 401) {
          dispatch({ type: AUTH_ACTIONS.LOGOUT });
        }
      }
    }
  );

  // Update user in state when query data changes
  useEffect(() => {
    if (userData && state.token) {
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: {
          user: userData,
          token: state.token,
          refreshToken: state.refreshToken
        }
      });
    } else if (!userLoading && !state.token) {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    }
  }, [userData, userLoading, state.token, state.refreshToken]);

  // Login mutation
  const loginMutation = useMutation(
    async (credentials) => {
      const response = await api.post('/auth/login', credentials);
      return response.data.data;
    },
    {
      onSuccess: (data) => {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: data
        });
        toast.success('Login successful!');
        queryClient.invalidateQueries('currentUser');
      },
      onError: (error) => {
        const message = error.response?.data?.message || 'Login failed';
        dispatch({
          type: AUTH_ACTIONS.SET_ERROR,
          payload: message
        });
        toast.error(message);
      }
    }
  );

  // Register mutation
  const registerMutation = useMutation(
    async (userData) => {
      const response = await api.post('/auth/register', userData);
      return response.data.data;
    },
    {
      onSuccess: (data) => {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: data
        });
        toast.success('Registration successful! Please verify your email.');
        queryClient.invalidateQueries('currentUser');
      },
      onError: (error) => {
        const message = error.response?.data?.message || 'Registration failed';
        dispatch({
          type: AUTH_ACTIONS.SET_ERROR,
          payload: message
        });
        toast.error(message);
      }
    }
  );

  // Logout mutation
  const logoutMutation = useMutation(
    async () => {
      await api.post('/auth/logout');
    },
    {
      onSuccess: () => {
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
        queryClient.clear();
        toast.success('Logged out successfully');
      },
      onError: () => {
        // Even if logout fails on server, clear local state
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
        queryClient.clear();
      }
    }
  );

  // Update profile mutation
  const updateProfileMutation = useMutation(
    async (profileData) => {
      const response = await api.put('/auth/profile', profileData);
      return response.data.data.user;
    },
    {
      onSuccess: (user) => {
        dispatch({
          type: AUTH_ACTIONS.UPDATE_USER,
          payload: user
        });
        toast.success('Profile updated successfully');
        queryClient.invalidateQueries('currentUser');
      },
      onError: (error) => {
        const message = error.response?.data?.message || 'Profile update failed';
        toast.error(message);
      }
    }
  );

  // Change password mutation
  const changePasswordMutation = useMutation(
    async (passwordData) => {
      await api.put('/auth/change-password', passwordData);
    },
    {
      onSuccess: () => {
        toast.success('Password changed successfully');
      },
      onError: (error) => {
        const message = error.response?.data?.message || 'Password change failed';
        toast.error(message);
      }
    }
  );

  // Forgot password mutation
  const forgotPasswordMutation = useMutation(
    async (email) => {
      await api.post('/auth/forgot-password', { email });
    },
    {
      onSuccess: () => {
        toast.success('Password reset email sent');
      },
      onError: (error) => {
        const message = error.response?.data?.message || 'Failed to send reset email';
        toast.error(message);
      }
    }
  );

  // Reset password mutation
  const resetPasswordMutation = useMutation(
    async ({ token, password }) => {
      await api.post(`/auth/reset-password/${token}`, { password });
    },
    {
      onSuccess: () => {
        toast.success('Password reset successfully');
      },
      onError: (error) => {
        const message = error.response?.data?.message || 'Password reset failed';
        toast.error(message);
      }
    }
  );

  // Verify email mutation
  const verifyEmailMutation = useMutation(
    async (token) => {
      await api.post(`/auth/verify-email/${token}`);
    },
    {
      onSuccess: () => {
        toast.success('Email verified successfully');
        queryClient.invalidateQueries('currentUser');
      },
      onError: (error) => {
        const message = error.response?.data?.message || 'Email verification failed';
        toast.error(message);
      }
    }
  );

  // Verify phone mutation
  const verifyPhoneMutation = useMutation(
    async (code) => {
      await api.post('/auth/verify-phone', { code });
    },
    {
      onSuccess: () => {
        toast.success('Phone verified successfully');
        queryClient.invalidateQueries('currentUser');
      },
      onError: (error) => {
        const message = error.response?.data?.message || 'Phone verification failed';
        toast.error(message);
      }
    }
  );

  // Resend verification mutation
  const resendVerificationMutation = useMutation(
    async () => {
      await api.post('/auth/resend-verification');
    },
    {
      onSuccess: () => {
        toast.success('Verification email sent');
      },
      onError: (error) => {
        const message = error.response?.data?.message || 'Failed to send verification email';
        toast.error(message);
      }
    }
  );

  // Refresh token mutation
  const refreshTokenMutation = useMutation(
    async () => {
      const response = await api.post('/auth/refresh-token', {
        refreshToken: state.refreshToken
      });
      return response.data.data;
    },
    {
      onSuccess: (data) => {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: {
            user: state.user,
            token: data.token,
            refreshToken: data.refreshToken
          }
        });
      },
      onError: () => {
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
      }
    }
  );

  // Context value
  const value = {
    // State
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    
    // Actions
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout: logoutMutation.mutate,
    updateProfile: updateProfileMutation.mutate,
    changePassword: changePasswordMutation.mutate,
    forgotPassword: forgotPasswordMutation.mutate,
    resetPassword: resetPasswordMutation.mutate,
    verifyEmail: verifyEmailMutation.mutate,
    verifyPhone: verifyPhoneMutation.mutate,
    resendVerification: resendVerificationMutation.mutate,
    refreshToken: refreshTokenMutation.mutate,
    clearError: () => dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR }),
    
    // Mutation states
    isLoggingIn: loginMutation.isLoading,
    isRegistering: registerMutation.isLoading,
    isLoggingOut: logoutMutation.isLoading,
    isUpdatingProfile: updateProfileMutation.isLoading,
    isChangingPassword: changePasswordMutation.isLoading,
    isSendingForgotPassword: forgotPasswordMutation.isLoading,
    isResettingPassword: resetPasswordMutation.isLoading,
    isVerifyingEmail: verifyEmailMutation.isLoading,
    isVerifyingPhone: verifyPhoneMutation.isLoading,
    isResendingVerification: resendVerificationMutation.isLoading,
    isRefreshingToken: refreshTokenMutation.isLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
