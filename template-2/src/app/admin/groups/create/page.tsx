"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/contexts/AuthContext";
import { createGroup, getAllTeachers, getAllGroups } from "@/lib/firebase/firebaseUtils";

// Define Teacher interface
interface Teacher {
  id: string;
  name: string;
  email: string;
  role: string;
  subject?: string;
  specialization?: string;
  createdAt?: any;
}

// Define Group interface
interface Group {
  id: string;
  name: string;
  description?: string;
  members: string[];
  createdAt?: any;
  updatedAt?: any;
}

export default function CreateGroupPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    members: [] as string[]
  });
  const [errors, setErrors] = useState({
    name: "",
    members: ""
  });
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [existingGroups, setExistingGroups] = useState<Group[]>([]);

  // Redirect if not admin
  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  // Fetch teachers and groups from Firestore
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch teachers from Firestore
        const fetchedTeachers = await getAllTeachers();
        setTeachers(fetchedTeachers);
        
        // Fetch existing groups to check for duplicates
        const fetchedGroups = await getAllGroups() as Group[];
        setExistingGroups(fetchedGroups);
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  const handleMemberSelect = (teacherId: string) => {
    setFormData(prev => {
      const members = prev.members.includes(teacherId)
        ? prev.members.filter(id => id !== teacherId)
        : [...prev.members, teacherId];
      
      // Clear members error if any members selected
      if (members.length > 0 && errors.members) {
        setErrors(prev => ({ ...prev, members: "" }));
      }
      
      return { ...prev, members };
    });
  };

  const validateForm = () => {
    const newErrors = {
      name: "",
      members: ""
    };
    let isValid = true;

    if (!formData.name.trim()) {
      newErrors.name = "Group name is required";
      isValid = false;
    }

    if (formData.members.length === 0) {
      newErrors.members = "Please select at least one member";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    // Check for existing group with same name
    const groupExists = existingGroups.some(
      group => group.name.toLowerCase() === formData.name.toLowerCase()
    );
    
    if (groupExists) {
      setErrors({
        ...errors,
        name: "A group with this name already exists"
      });
      setIsSubmitting(false);
      return;
    }
    
    try {
      setLoading(true);
      
      // Create group in Firestore
      await createGroup({
        name: formData.name,
        description: formData.description,
        members: formData.members
      });
      
      // Redirect to groups management page
      router.push("/admin/groups");
    } catch (error) {
      console.error("Error creating group:", error);
      // Show an error message to the user
      alert("Failed to create group. Please try again.");
    } finally {
      setLoading(false);
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Create New Group</h1>
            <p className="text-gray-600 mt-1">Add a new group for teachers</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          {loading && (
            <div className="mb-4 p-3 bg-blue-50 rounded-md text-blue-700">
              Loading data, please wait...
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Group Name*
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                disabled={loading || isSubmitting}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.name ? "border-red-500" : "border-gray-300"
                } ${(loading || isSubmitting) ? "bg-gray-100" : ""}`}
                placeholder="Enter group name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>
            
            <div className="mb-4">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                disabled={loading || isSubmitting}
                rows={3}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${(loading || isSubmitting) ? "bg-gray-100" : ""}`}
                placeholder="Enter group description (optional)"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Group Members*
              </label>
              {errors.members && (
                <p className="my-1 text-sm text-red-600">{errors.members}</p>
              )}
              <div className="mt-2 border border-gray-300 rounded-md p-3 max-h-60 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {teachers.map((teacher) => (
                    <div key={teacher.id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`teacher-${teacher.id}`}
                        checked={formData.members.includes(teacher.id)}
                        onChange={() => handleMemberSelect(teacher.id)}
                        disabled={loading || isSubmitting}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor={`teacher-${teacher.id}`}
                        className="ml-2 block text-sm text-gray-900"
                      >
                        {teacher.name} {teacher.subject ? `(${teacher.subject})` : ''}
                      </label>
                    </div>
                  ))}
                </div>
                {teachers.length === 0 && (
                  <p className="text-sm text-gray-500">No teachers available</p>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Selected: {formData.members.length} members
              </p>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Link
                href="/admin/groups"
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting || loading}
                className={`px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 ${
                  (isSubmitting || loading) && "opacity-70 cursor-not-allowed"
                }`}
              >
                {isSubmitting ? "Creating..." : "Create Group"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 