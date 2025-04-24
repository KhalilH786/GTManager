"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { teachers } from "@/lib/data";
import { useAuth } from "@/lib/contexts/AuthContext";
import { createUser, checkUserExists, convertUserToTeacher } from "@/lib/firebase/firebaseUtils";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";

// Default role options that match the teacher roles management page
const availableRoles = [
  { id: "teacher", name: "Teacher" },
  { id: "head_teacher", name: "Head Teacher" },
  { id: "administrator", name: "Administrator" },
  { id: "super_user", name: "Super User" }
];

// Default subject options
const availableSubjects = [
  "Mathematics",
  "English",
  "Science",
  "History",
  "Geography",
  "Art",
  "Music",
  "Physical Education",
  "Computing",
  "Languages",
  "Other"
];

export default function CreateTeacherPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "teacher",
    subject: "",
    specialization: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    
    try {
      // Check if user already exists
      const userExists = await checkUserExists(formData.email);

      if (userExists) {
        // Find the user by email in Firestore
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", formData.email));
        const querySnapshot = await getDocs(q);
      
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          const userId = userDoc.id;
          
          // Convert existing user to a teacher
          await convertUserToTeacher(userId, {
            displayName: formData.name,
            subject: formData.subject,
            specialization: formData.specialization
          });
          
          setSuccess(`User ${formData.email} has been updated to a teacher role.`);
          router.push("/admin/teachers");
          return;
        }
        
        setError("A user with this email already exists, but couldn't be updated. Please try again.");
        setIsSubmitting(false);
        return;
      }
      
      // Create new teacher
      await createUser(
        formData.email,
        formData.password,
        formData.name,
        "teacher",
        {
          subject: formData.subject,
          specialization: formData.specialization
        }
      );
      
      setSuccess("Teacher created successfully!");
      router.push("/admin/teachers");
    } catch (err: any) {
      console.error("Error creating teacher:", err);
      setError(err.message || "An error occurred while creating the teacher.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Add New Teacher</h1>
          <p className="text-gray-600 mt-1">Create a new teacher account</p>
        </div>
        <Link 
          href="/admin/teachers" 
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-300"
        >
          Back to Teachers
        </Link>
      </div>

          {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
          {success}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

            <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                minLength={6}
              />
              <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
            </div>

            <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Role <span className="text-red-500">*</span>
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
                {availableRoles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
              ))}
            </select>
          </div>

            <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                Subject <span className="text-red-500">*</span>
            </label>
              <select
              id="subject"
              name="subject"
              value={formData.subject}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              >
                <option value="" disabled>
                  Select a subject
                </option>
                {availableSubjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
          </div>

            <div>
              <label htmlFor="specialization" className="block text-sm font-medium text-gray-700 mb-1">
                Specialization
            </label>
            <input
              type="text"
                id="specialization"
                name="specialization"
                value={formData.specialization}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Link
              href="/admin/teachers"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-300"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Create Teacher"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 