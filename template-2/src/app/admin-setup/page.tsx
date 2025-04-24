"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword, getAuth } from "firebase/auth";
import { doc, setDoc, getFirestore } from "firebase/firestore";
import { app } from "@/lib/firebase/firebase";

export default function AdminSetupPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const auth = getAuth(app);
  const db = getFirestore(app);

  const createAdminUser = async () => {
    setLoading(true);
    setMessage("");
    setError("");

    try {
      // Create the user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        "khalil.hendricks@gmail.com",
        "admin123"
      );

      // Add the user to Firestore with admin role
      await setDoc(doc(db, "users", userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: "khalil.hendricks@gmail.com",
        displayName: "Khalil Hendricks",
        role: "admin",
        createdAt: new Date().toISOString()
      });

      setMessage("Admin user created successfully!");
    } catch (err: any) {
      console.error("Error creating admin:", err);
      
      if (err.code === "auth/email-already-in-use") {
        setMessage("Admin user already exists. You can log in with the credentials.");
      } else {
        setError(`Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Admin Setup</h2>
          <p className="mt-2 text-sm text-gray-600">Create the initial admin account</p>
        </div>

        <div className="mt-8 space-y-6">
          <div className="p-4 border rounded-md">
            <h3 className="text-lg font-medium">Admin Account Details</h3>
            <p className="mt-1 text-sm text-gray-500">Email: khalil.hendricks@gmail.com</p>
            <p className="text-sm text-gray-500">Password: admin123</p>
          </div>

          {message && (
            <div className="p-4 bg-green-50 text-green-700 rounded-md text-sm">
              {message}
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          <div>
            <button
              onClick={createAdminUser}
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Admin User"}
            </button>
          </div>

          <div className="text-center mt-4">
            <a href="/login" className="text-sm text-blue-600 hover:text-blue-500">
              Go to Login Page
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 