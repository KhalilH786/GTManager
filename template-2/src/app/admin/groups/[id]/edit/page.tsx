"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/contexts/AuthContext";
import { getGroupById, updateGroup, getAllTeachers, getAllGroups } from "@/lib/firebase/firebaseUtils";

// Define Group interface
interface Group {
  id: string;
  name: string;
  description?: string;
  members: string[];
  createdAt?: any;
  updatedAt?: any;
}

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

export default function EditGroupPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const groupId = params.id;
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
  
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [existingGroups, setExistingGroups] = useState<Group[]>([]);

  // Redirect if not admin
  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  // Fetch group data and teachers from Firestore
  useEffect(() => {
    const fetchData = async () => {
      if (!groupId) return;
      
      try {
        setLoading(true);
        
        // Fetch the group to edit
        const groupToEdit = await getGroupById(groupId) as Group | null;
        
        // Fetch all teachers for member selection
        const fetchedTeachers = await getAllTeachers();
        setTeachers(fetchedTeachers);
        
        // Fetch existing groups to check for duplicates
        const fetchedGroups = await getAllGroups() as Group[];
        setExistingGroups(fetchedGroups);
      
      if (groupToEdit) {
        setFormData({
            name: groupToEdit.name || "",
          description: groupToEdit.description || "",
            members: groupToEdit.members || []
        });
      } else {
        setNotFound(true);
      }
      } catch (error) {
        console.error("Error fetching data:", error);
        setNotFound(true);
      } finally {
      setLoading(false);
    }
    };
    
    fetchData();
  }, [groupId]);

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
    
    // Check for existing group with same name (excluding current group)
    const groupExists = existingGroups.some(
      group => group.id !== groupId && 
      group.name.toLowerCase() === formData.name.toLowerCase()
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
      // Update group in Firestore
      await updateGroup(groupId, {
          name: formData.name,
          description: formData.description,
          members: formData.members
      });
      
      // Redirect to groups management page
      router.push("/admin/groups");
    } catch (error) {
      console.error("Error updating group:", error);
      alert("Failed to update group. Please try again.");
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
          <h1 className="text-2xl font-bold text-red-600">Group Not Found</h1>
          <p className="mt-2 text-gray-600">The group you are trying to edit does not exist.</p>
          <Link 
            href="/admin/groups"
            className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
          >
            Return to Groups
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto flex items-center justify-center h-screen">
        <p className="text-gray-500">Loading group data...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Edit Group</h1>
            <p className="text-gray-600 mt-1">Update group information and members</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
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
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.name ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter group name"
                disabled={isSubmitting}
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
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter group description (optional)"
                disabled={isSubmitting}
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
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        disabled={isSubmitting}
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
                disabled={isSubmitting}
                className={`px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 ${
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