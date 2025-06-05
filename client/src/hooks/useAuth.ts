import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

interface AuthUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  barangayId: number;
  barangay?: {
    id: number;
    name: string;
    municipality: string;
    province: string;
  };
}

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const storedUser = localStorage.getItem("user");
    
    if (token && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
      }
    }
    setIsLoading(false);
  }, []);

  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    setUser(null);
    setIsAuthenticated(false);
    window.location.href = "/login";
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    logout,
  };
}

export function useAuthToken() {
  return localStorage.getItem("authToken");
}