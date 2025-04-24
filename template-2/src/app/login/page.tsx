"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, UserRole } from "@/lib/contexts/AuthContext";
import { tasks } from "@/lib/data";
import { loginWithEmailAndPassword, checkUserExists } from "@/lib/firebase/firebaseUtils";

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<UserRole>("manager");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loginStatus, setLoginStatus] = useState("");
  
  const router = useRouter();
  const { user, isLoading: authLoading, login, loginWithGoogle } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (user.role === "admin") {
        router.push("/admin");
      } else if (user.role === "manager") {
        router.push("/dashboard");
      } else {
        router.push("/tasks");
      }
    }
  }, [user, router]);

  // TEMP DEBUG: Log tasks assigned by John Smith with complete_for_approval status
  console.log("CHECKING FOR JOHN SMITH REVIEW TASKS:");
  const johnSmithReviewTasks = tasks.filter(task => 
    task.assignedBy === "1" && task.status === "complete_for_approval"
  );
  console.log(`Found ${johnSmithReviewTasks.length} tasks assigned by John Smith with complete_for_approval status:`);
  johnSmithReviewTasks.forEach(task => {
    console.log(`Task ID: ${task.id}, Title: ${task.title}, Status: ${task.status}`);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setLoginStatus("Starting login process...");

    if (!email || !password) {
      setError("Please enter both email and password");
      setIsLoading(false);
      setLoginStatus("");
      return;
    }

    // Add a small delay to ensure Firebase is ready
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      console.log(`Attempting to login with email: ${email}`);
      setLoginStatus("Authenticating with Firebase...");
      
      // Special case for admin email
      if (email === "khalil.hendricks@gmail.com") {
        console.log("Using admin specific login path");
      }
      
      // Check if user exists first
      const userExists = await checkUserExists(email);
      if (!userExists) {
        console.error("User does not exist in Firestore");
        setError(`User with email ${email} does not exist. Please check your credentials.`);
        setIsLoading(false);
        setLoginStatus("");
        return;
      }
      
      setLoginStatus("User found, authenticating...");
      
      // Only use Firebase authentication
      const userCredential = await loginWithEmailAndPassword(email, password);
      console.log("Firebase login successful:", userCredential.uid);
      setLoginStatus("Login successful! Redirecting...");
      
      // The auth state listener in AuthContext will handle the rest
      // Wait a moment for the auth state to update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error: any) {
      console.error("Login failed:", error.message);
      setError(`Login failed: ${error.message || "Unknown error"}`);
      setLoginStatus("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setIsLoading(true);
    setLoginStatus("Starting Google Sign-In...");

    try {
      const success = await loginWithGoogle();
      if (!success) {
        setError("Google sign-in failed. Please try again.");
        setLoginStatus("");
      } else {
        setLoginStatus("Google Sign-In successful! Redirecting...");
      }
    } catch (error) {
      setError("An error occurred during Google sign-in. Please try again.");
      console.error("Google sign-in error:", error);
      setLoginStatus("");
    }
    
    setIsLoading(false);
  };

  const setDemoCredentials = () => {
    if (activeTab === "admin") {
      setEmail("khalil.hendricks@gmail.com");
      setPassword("admin123");
    } else if (activeTab === "manager") {
      setEmail("admin@school.edu");
      setPassword("admin123");
    } else {
      setEmail("john.smith@school.edu");
      setPassword("teacher123");
    }
  };

  // If auth is loading, show loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">GT Staff Hub</h2>
          <p className="mt-2 text-sm text-gray-600">Sign in to your account</p>
        </div>

        {/* Tab selector */}
        <div className="flex border-b">
          <button
            className={`flex-1 py-3 font-medium text-center ${
              activeTab === "admin"
                ? "text-teal-600 border-b-2 border-teal-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("admin")}
          >
            System Admin
          </button>
          <button
            className={`flex-1 py-3 font-medium text-center ${
              activeTab === "manager"
                ? "text-teal-600 border-b-2 border-teal-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("manager")}
          >
            Manager
          </button>
          <button
            className={`flex-1 py-3 font-medium text-center ${
              activeTab === "teacher"
                ? "text-teal-600 border-b-2 border-teal-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("teacher")}
          >
            Teacher
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
            {error}
          </div>
        )}
        
        {loginStatus && (
          <div className="bg-blue-50 text-blue-600 p-3 rounded-md text-sm">
            {loginStatus}
          </div>
        )}

        {/* Google Sign In */}
        <div>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50"
          >
            <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" width="24" height="24">
              <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"></path>
                <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"></path>
                <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"></path>
                <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"></path>
              </g>
            </svg>
            Sign in with Google
          </button>
          
          <div className="mt-4 text-center text-sm">
            <span className="text-gray-500">
              For testing use these Google emails:<br />
              admin@goodtree.school | manager@goodtree.school | teacher@goodtree.school
            </span>
          </div>
          
          <div className="my-4 flex items-center">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="px-4 text-gray-500 text-sm">OR</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md -space-y-px">
            <div className="mb-4">
              <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="text-center text-xs text-gray-500">
            <button 
              type="button" 
              onClick={setDemoCredentials}
              className="text-teal-600 hover:text-teal-800 font-medium"
            >
              Use demo credentials
            </button>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50"
            >
              {isLoading ? "Signing in..." : `Sign in as ${activeTab === "admin" ? "System Administrator" : activeTab === "manager" ? "Manager" : "Teacher"}`}
            </button>
          </div>
        </form>

        <div className="text-center text-sm text-gray-500 mt-4">
          <p>
            Demo credentials available for testing. Click "Use demo credentials" to populate the form.
          </p>
        </div>
      </div>
    </div>
  );
} 