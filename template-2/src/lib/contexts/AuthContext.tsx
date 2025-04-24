"use client";

import React, { createContext, useState, useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { auth, db } from "@/lib/firebase/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { signInWithGoogle, logoutUser, checkUserExists } from "@/lib/firebase/firebaseUtils";
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { initializeFirestoreData } from "@/lib/firebase/firebaseUtils";

// Define user types and authentication state
export type UserRole = "admin" | "manager" | "teacher" | "principal" | null;

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  photoURL?: string; // Add for Google profile images
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  logout: () => void;
}

// Create auth context
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Sample users for testing
const SAMPLE_USERS = [
  {
    id: "admin1",
    name: "System Administrator",
    email: "sysadmin@school.edu",
    password: "admin123",
    role: "admin" as UserRole,
  },
  {
    id: "m1",
    name: "Admin User",
    email: "admin@school.edu",
    password: "admin123",
    role: "manager" as UserRole,
  },
  {
    id: "1", // matches teacher id in data.ts
    name: "John Smith",
    email: "john.smith@school.edu",
    password: "teacher123",
    role: "teacher" as UserRole,
  },
  {
    id: "2", // matches teacher id in data.ts
    name: "Sarah Johnson",
    email: "sarah.johnson@school.edu",
    password: "teacher123",
    role: "teacher" as UserRole,
  }
];

// Map of test emails to roles for Google Sign-in testing
const GOOGLE_EMAIL_TO_ROLE: Record<string, { id: string, role: UserRole }> = {
  "admin@goodtree.school": { id: "admin1", role: "admin" },
  "manager@goodtree.school": { id: "m1", role: "manager" },
  "teacher@goodtree.school": { id: "1", role: "teacher" },
};

// Map specific email to roles
const emailRoleMapping: Record<string, UserRole> = {
  "admin@example.com": "admin",
  "teacher@example.com": "teacher",
  "principal@example.com": "principal",
  "khalil.hendricks@gmail.com": "admin"
};

// Cookie options
const COOKIE_OPTIONS = {
  expires: 7, // 7 days
  path: '/',
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Initialize Firestore with sample data when the app starts
  useEffect(() => {
    const initializeData = async () => {
      try {
        await initializeFirestoreData();
      } catch (error) {
        console.error("Error initializing Firestore data:", error);
      }
    };
    
    initializeData();
  }, []);

  // Auth state change listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in
        try {
          console.log("User authenticated with Firebase:", user.email, user.uid);
          
          // Special case for admin user with known UID
          if (user.uid === "mH5yrjER2oPEBU7dRd9qh76qa3L2" && user.email === "khalil.hendricks@gmail.com") {
            console.log("Admin user detected with known UID, skipping Firestore lookup");
            
            const adminUser: User = {
              id: user.uid,
              name: "Khalil Hendricks",
              email: user.email || "khalil.hendricks@gmail.com",
              role: "admin",
              photoURL: user.photoURL || undefined
            };
            
            setUser(adminUser);
            
            // Store user in cookies for persistent login
            Cookies.set(
              "schoolTaskUser", 
              JSON.stringify(adminUser),
              COOKIE_OPTIONS
            );
            
            setIsLoading(false);
            return;
          }
          
          // Get user data from Firestore with added timeout
          let timeoutId: NodeJS.Timeout | undefined;
          const timeoutPromise = new Promise<null>((_, reject) => {
            timeoutId = setTimeout(() => {
              reject(new Error("Firestore lookup timed out after 5 seconds"));
            }, 5000);
          });
          
          try {
            // Fetch user document with timeout
            const userDocPromise = getDoc(doc(db, "users", user.uid));
            const userDoc = await Promise.race([userDocPromise, timeoutPromise]);
            
            clearTimeout(timeoutId);
            
            if (userDoc && 'exists' in userDoc && userDoc.exists()) {
              const userData = userDoc.data();
              console.log("User data from Firestore:", userData);
              
              const authenticatedUser: User = {
                id: user.uid,
                name: userData.displayName || user.displayName || user.email?.split("@")[0] || "",
                email: user.email || "",
                role: userData.role as UserRole,
                photoURL: user.photoURL || undefined
              };
              
              setUser(authenticatedUser);
              
              // Store user in cookies for persistent login
              Cookies.set(
                "schoolTaskUser", 
                JSON.stringify(authenticatedUser),
                COOKIE_OPTIONS
              );
            } else {
              console.error("User document not found in Firestore");
              // Fallback for known admin email
              if (user.email === "khalil.hendricks@gmail.com") {
                console.log("Fallback for admin email");
                const adminUser: User = {
                  id: user.uid,
                  name: "Khalil Hendricks",
                  email: user.email,
                  role: "admin",
                  photoURL: user.photoURL || undefined
                };
                
                setUser(adminUser);
                
                // Store user in cookies for persistent login
                Cookies.set(
                  "schoolTaskUser", 
                  JSON.stringify(adminUser),
                  COOKIE_OPTIONS
                );
              } else {
                setUser(null);
              }
            }
          } catch (lookupError) {
            console.error("Firestore lookup error:", lookupError);
            
            // Fallback for known admin email
            if (user.email === "khalil.hendricks@gmail.com") {
              console.log("Firestore error, using fallback for admin email");
              const adminUser: User = {
                id: user.uid,
                name: "Khalil Hendricks",
                email: user.email || "",
                role: "admin",
                photoURL: user.photoURL || undefined
              };
              
              setUser(adminUser);
              
              // Store user in cookies for persistent login
              Cookies.set(
                "schoolTaskUser", 
                JSON.stringify(adminUser),
                COOKIE_OPTIONS
              );
            } else {
              setUser(null);
            }
          }
        } catch (error) {
          console.error("Error setting up user:", error);
          setUser(null);
        } finally {
          setIsLoading(false);
        }
      } else {
        // User is signed out
        setUser(null);
        Cookies.remove("schoolTaskUser");
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Login with Google
  const loginWithGoogle = async (): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      await signInWithGoogle();
      // Auth state listener will handle the rest
      return true;
    } catch (error) {
      console.error("Google login error:", error);
      setIsLoading(false);
      return false;
    }
  };

  // Login function for traditional login
  const login = async (email: string, password: string, role: UserRole): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Simulate API call with timeout
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Find matching user
      const matchedUser = SAMPLE_USERS.find(
        u => u.email === email && u.password === password && u.role === role
      );
      
      if (matchedUser) {
        // Create user object without password
        const { password, ...userWithoutPassword } = matchedUser;
        setUser(userWithoutPassword);
        
        // Store in cookie
        Cookies.set(
          "schoolTaskUser", 
          JSON.stringify(userWithoutPassword),
          COOKIE_OPTIONS
        );
        
        setIsLoading(false);
        return true;
      }
      
      setIsLoading(false);
      return false;
    } catch (error) {
      console.error("Login error:", error);
      setIsLoading(false);
      return false;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Sign out from Firebase
      await logoutUser();
      // Also clear the cookie
      setUser(null);
      Cookies.remove("schoolTaskUser");
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook for using auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
