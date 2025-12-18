// src/contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import api from "../utils/api";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const res = await api.get("/auth/me");
      // Backend returns: { success: true, data: { user: ... } }
      setUser(res.data.data?.user || res.data.user);
    } catch (err) {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      delete api.defaults.headers.common["Authorization"];
    } finally {
      setLoading(false);
    }
  };

  const login = async (emailOrPhone, password) => {
    try {
      const res = await api.post("/auth/login", { emailOrPhone, password });
      // Backend returns: { success: true, data: { user, token, refreshToken } }
      const { user, token, refreshToken } = res.data.data || res.data;
      
      if (token) {
        localStorage.setItem("token", token);
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      }
      
      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      }
      
      setUser(user);
      toast.success(`Welcome, ${user.firstName || user.name}!`);
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
      return false;
    }
  };

  const register = async (userData) => {
    try {
      const res = await api.post("/auth/register", userData);
      // Backend returns: { success: true, data: { user, token, refreshToken } }
      const { user, token, refreshToken } = res.data.data || res.data;
      
      if (token) {
        localStorage.setItem("token", token);
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      }
      
      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      }
      
      setUser(user);
      toast.success("Registration successful! Please verify your email.");
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
      return false;
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      // Continue with logout even if API call fails
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      delete api.defaults.headers.common["Authorization"];
      setUser(null);
      toast.success("Logged out");
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    isLoading: loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    isOrganizer: user?.role === "organizer",
    isAffiliate: user?.role === "affiliate"
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};