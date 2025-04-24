"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { teachers } from "@/lib/data";
import { useAuth } from "@/lib/contexts/AuthContext";

// Default role options that match the teacher roles management page
const DEFAULT_ROLES = [
  { id: "administrator", name: "Administrator", color: "#3B82F6" },
  { id: "super_user", name: "Super User", color: "#10B981" },
  { id: "user", name: "User", color: "#6B7280" }
];

export default function EditTeacherPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const teacherId = params.id;
  const { user, isLoading } = useAuth();
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "", // This will store the role ID
    subject: "", // Subject field for specialization
    password: "teacher123" // Default password field
  });
  
  // State for available roles
  const [availableRoles, setAvailableRoles] = useState(DEFAULT_ROLES);
  
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    role: "",
    subject: ""
  });
  
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  // In a real app, we would fetch the available roles from an API
  useEffect(() => {
    // This would be replaced with an API call in a real app
    // Example: fetch('/api/teacher-roles').then(res => res.json()).then(setAvailableRoles);
    setAvailableRoles(DEFAULT_ROLES);
  }, []);

  // Fetch teacher data
  useEffect(() => {
    if (teacherId) {
      const teacherToEdit = teachers.find(teacher => teacher.id === teacherId);
      
      if (teacherToEdit) {
        // Parse the current role to extract subject and role
        // The userRole might not exist on older records
        let roleId = "user"; // Default to "user" if not set
        let subject = "";
        
        // Check if userRole exists using optional chaining
        if ((teacherToEdit as any).userRole) {
          roleId = (teacherToEdit as any).userRole;
        }
        
        if (teacherToEdit.role && teacherToEdit.role.includes(" Teacher")) {
          subject = teacherToEdit.role.replace(" Teacher", "");
        } else {
          subject = teacherToEdit.role || "";
        }

        setFormData({
          name: teacherToEdit.name,
          email: teacherToEdit.email,
          role: roleId,
          subject,
          password: "teacher123" // Default password for edit form
        });
      } else {
        setNotFound(true);
      }
      
      setLoading(false);
    }
  }, [teacherId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors({
        ...errors,
        [name]: ""
      });
    }
  };

  const validateForm = () => {
    const newErrors = {
      name: "",
      email: "",
      role: "",
      subject: ""
    };
    let isValid = true;

    if (!formData.name.trim()) {
      newErrors.name = "Teacher name is required";
      isValid = false;
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!formData.email.includes('@')) {
      newErrors.email = "Please enter a valid email address";
      isValid = false;
    }

    if (!formData.role.trim()) {
      newErrors.role = "Teaching role is required";
      isValid = false;
    }

    if (!formData.subject.trim()) {
      newErrors.subject = "Subject is required";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    // Check for existing teacher with same email (excluding current teacher)
    const emailExists = teachers.some(
      teacher => teacher.id !== teacherId && 
      teacher.email.toLowerCase() === formData.email.toLowerCase()
    );
    
    if (emailExists) {
      setErrors({
        ...errors,
        email: "A teacher with this email already exists"
      });
      setIsSubmitting(false);
      return;
    }
    
    try {
      // In a real application, this would be an API call
      // Simulate API call with timeout
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get the role name from the selected role ID
      const selectedRole = availableRoles.find(role => role.id === formData.role);
      
      if (!selectedRole) {
        throw new Error("Invalid role selected");
      }
      
      // Update teacher in local state (simulating database update)
      const teacherIndex = teachers.findIndex(teacher => teacher.id === teacherId);
      
      if (teacherIndex !== -1) {
        teachers[teacherIndex] = {
          ...teachers[teacherIndex],
          name: formData.name,
          email: formData.email,
          role: `${formData.subject} Teacher`, // Combine subject with "Teacher" for the display role
          userRole: formData.role // Store the actual role ID separately
        } as any; // Use type assertion to avoid TypeScript errors
      }
      
      // Redirect to teachers management page
      router.push("/admin/teachers");
    } catch (error) {
      console.error("Error updating teacher:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="container mx-auto flex items-center justify-center h-screen">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-red-600">Teacher Not Found</h1>
          <p className="mt-2 text-gray-600">The teacher you are trying to edit does not exist.</p>
          <Link 
            href="/admin/teachers"
            className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
          >
            Return to Teachers
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto flex items-center justify-center h-screen">
        <p className="text-gray-500">Loading teacher data...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Edit Teacher</h1>
            <p className="text-gray-600 mt-1">Update teacher information</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name*
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter teacher's full name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>
            
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address*
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.email ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter teacher's email address"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>
            
            <div className="mb-4">
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                System Role*
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.role ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Select a role</option>
                {availableRoles.map(role => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
              {errors.role && (
                <p className="mt-1 text-sm text-red-600">{errors.role}</p>
              )}
            </div>

            <div className="mb-4">
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.subject ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter subject specialization"
              />
              {errors.subject && (
                <p className="mt-1 text-sm text-red-600">{errors.subject}</p>
              )}
            </div>

            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="text"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                placeholder="Password will not be changed unless specified"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave as is to keep the current password. Change to set a new password.
              </p>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Link
                href="/admin/teachers"
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 ${
                  isSubmitting && "opacity-70 cursor-not-allowed"
                }`}
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 