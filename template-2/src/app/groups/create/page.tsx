"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { teachers } from "@/lib/data";
import { useAuth } from "@/lib/hooks/useAuth";

export default function CreateGroupPage() {
  const router = useRouter();
  const auth = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    members: [] as string[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if user is admin, redirect if not
  useEffect(() => {
    if (auth?.user && auth.user.role !== "admin") {
      router.push("/groups");
    }
  }, [auth?.user, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    
    if (checked) {
      setFormData({
        ...formData,
        members: [...formData.members, value],
      });
    } else {
      setFormData({
        ...formData,
        members: formData.members.filter(id => id !== value),
      });
    }
  };

  const handleSelectAll = () => {
    setFormData({
      ...formData,
      members: teachers.map(teacher => teacher.id),
    });
  };

  const handleDeselectAll = () => {
    setFormData({
      ...formData,
      members: [],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // In a real app, this would be an API call to save the group
      // For now, we'll just simulate a submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, we would use the API response to navigate to the new group
      router.push("/groups");
    } catch (error) {
      console.error("Error submitting group:", error);
      setIsSubmitting(false);
    }
  };

  // If still loading auth or not authenticated as admin, show loading state
  if (!auth?.user || auth.user.role !== "admin") {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p>Checking authorization...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <Link href="/groups" className="text-blue-600 hover:text-blue-800 text-sm flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          Back to Groups
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold">Create New Group</h1>
          <p className="text-gray-600 text-sm mt-1">Create a new teacher group and assign members</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Group Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Group Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                placeholder="Enter group name (e.g., Math Department, First Grade Team)"
                value={formData.name}
                onChange={handleInputChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            {/* Group Members */}
            <div>
              <fieldset>
                <div className="flex justify-between items-center mb-1">
                  <legend className="text-sm font-medium text-gray-700">
                    Group Members <span className="text-red-500">*</span>
                  </legend>
                  <div className="space-x-2">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Select All
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      type="button"
                      onClick={handleDeselectAll}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>
                
                <div className="mt-1 border rounded-md p-4 max-h-80 overflow-y-auto">
                  {teachers.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No teachers available. Please add teachers first.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {teachers.map(teacher => (
                        <div key={teacher.id} className="flex items-center p-2 border rounded hover:bg-gray-50">
                          <input
                            type="checkbox"
                            id={`member-${teacher.id}`}
                            name="members"
                            value={teacher.id}
                            checked={formData.members.includes(teacher.id)}
                            onChange={handleCheckboxChange}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label htmlFor={`member-${teacher.id}`} className="ml-2 flex-1">
                            <div className="text-sm font-medium text-gray-700">{teacher.name}</div>
                            <div className="text-xs text-gray-500">{teacher.role}</div>
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {formData.members.length > 0 && (
                  <div className="mt-2 text-sm text-gray-500">
                    {formData.members.length} teacher{formData.members.length > 1 ? 's' : ''} selected
                  </div>
                )}
              </fieldset>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <Link
                href="/groups"
                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting || formData.members.length === 0}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : 'Create Group'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 