"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/contexts/AuthContext";
import { teachers } from "@/lib/data";

interface RoleOption {
  id: string;
  name: string;
  color: string;
  isDefault?: boolean;
}

export default function TeacherRoleManagementPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  
  // Initial role options with the required defaults
  const [roleOptions, setRoleOptions] = useState<RoleOption[]>([
    { id: "administrator", name: "Administrator", color: "#3B82F6", isDefault: true },
    { id: "super_user", name: "Super User", color: "#10B981", isDefault: true },
    { id: "user", name: "User", color: "#6B7280", isDefault: true }
  ]);

  const [newRole, setNewRole] = useState<Omit<RoleOption, "id">>({
    name: "",
    color: "#8B5CF6"
  });

  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [tempEdits, setTempEdits] = useState<{name: string, color: string}>({name: "", color: ""});
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Redirect if not admin
  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  const handleAddRole = () => {
    if (!newRole.name.trim()) {
      setError("Role name is required");
      return;
    }

    // Check for duplicate names
    if (roleOptions.some(option => option.name.toLowerCase() === newRole.name.toLowerCase())) {
      setError("A role with this name already exists");
      return;
    }

    // Generate a unique ID (in a real app, this would come from the backend)
    const id = `role_${Date.now()}`;
    
    setRoleOptions([...roleOptions, { id, ...newRole }]);
    setNewRole({ name: "", color: "#8B5CF6" });
    setError("");
    setSuccessMessage("New role added successfully");
  };

  const startEditing = (role: RoleOption) => {
    setTempEdits({name: role.name, color: role.color});
    setEditingRole(role.id);
    setSuccessMessage("");
    setError("");
  };

  const handleUpdateRole = (id: string) => {
    // Check for duplicate names except the current role
    if (roleOptions.some(option => 
      option.id !== id && 
      option.name.toLowerCase() === tempEdits.name.toLowerCase()
    )) {
      setError("A role with this name already exists");
      return;
    }

    // Clear any previous errors
    setError("");
    
    // Update the role with the temp edits
    setRoleOptions(options => 
      options.map(option => 
        option.id === id 
          ? { ...option, name: tempEdits.name, color: tempEdits.color } 
          : option
      )
    );
    setEditingRole(null);
    setSuccessMessage("Role updated successfully");
  };

  const cancelEditing = () => {
    setEditingRole(null);
    setError("");
  };

  const handleDeleteRole = (id: string) => {
    // Don't allow deleting default roles
    const roleToDelete = roleOptions.find(option => option.id === id);
    if (roleToDelete?.isDefault) {
      setError("Default roles cannot be deleted");
      return;
    }

    // Check if any teachers are using the role
    const teachersUsingRole = teachers.filter(teacher => 
      teacher.role.toLowerCase() === roleToDelete?.name.toLowerCase()
    );

    if (teachersUsingRole.length > 0) {
      setError(`Cannot delete role. ${teachersUsingRole.length} teacher(s) are currently assigned this role. Please update those teachers to a different role first.`);
      return;
    }

    setRoleOptions(options => options.filter(option => option.id !== id));
    setSuccessMessage("Role deleted successfully");
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Teacher Role Management</h1>
          <p className="text-gray-600 mt-1">Customize teacher role options</p>
        </div>
      </div>

      {/* Role List */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="font-semibold">Current Role Options</h2>
        </div>
        <div className="p-4">
          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-md text-sm">
              {successMessage}
            </div>
          )}
          {roleOptions.length > 0 ? (
            <div className="grid gap-4">
              {roleOptions.map((role) => (
                <div 
                  key={role.id} 
                  className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    <span 
                      className="w-4 h-4 rounded-full inline-block"
                      style={{ backgroundColor: role.color }}
                    ></span>
                    <span className="font-medium">{role.name}</span>
                    {role.isDefault && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Default</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {editingRole === role.id ? (
                      <>
                        <input 
                          type="text"
                          value={tempEdits.name}
                          onChange={(e) => setTempEdits({...tempEdits, name: e.target.value})}
                          className="border rounded px-2 py-1 text-sm w-32"
                        />
                        <input 
                          type="color"
                          value={tempEdits.color}
                          onChange={(e) => setTempEdits({...tempEdits, color: e.target.value})}
                          className="w-8 h-8 rounded cursor-pointer"
                        />
                        <button 
                          onClick={() => handleUpdateRole(role.id)}
                          className="px-2 py-1 bg-green-600 text-white rounded-md text-xs font-medium hover:bg-green-700"
                        >
                          Save
                        </button>
                        <button 
                          onClick={cancelEditing}
                          className="px-2 py-1 border border-gray-300 text-gray-600 rounded-md text-xs hover:bg-gray-100"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => startEditing(role)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Edit
                        </button>
                        {!role.isDefault && (
                          <button 
                            onClick={() => handleDeleteRole(role.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Delete
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No role options available</p>
          )}
        </div>
      </div>

      {/* Add New Role */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="font-semibold">Add New Role</h2>
        </div>
        <div className="p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-md text-sm">
              {successMessage}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="roleName" className="block text-sm font-medium text-gray-700 mb-1">
                Role Name
              </label>
              <input 
                type="text"
                id="roleName"
                value={newRole.name}
                onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="e.g., Team Leader"
              />
            </div>
            <div>
              <label htmlFor="roleColor" className="block text-sm font-medium text-gray-700 mb-1">
                Role Color
              </label>
              <input 
                type="color"
                id="roleColor"
                value={newRole.color}
                onChange={(e) => setNewRole({ ...newRole, color: e.target.value })}
                className="w-full h-10 cursor-pointer border border-gray-300 rounded-md"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleAddRole}
                className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
              >
                Add Role
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Note */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mb-6">
        <h3 className="font-medium text-blue-800 mb-2">Notes on Teacher Role Management</h3>
        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
          <li>Default role options can be edited but cannot be deleted</li>
          <li>Teacher roles determine access permissions in the system</li>
          <li>For this demo, changes are not permanent and will reset on page refresh</li>
        </ul>
      </div>

      {/* Back to admin dashboard */}
      <div>
        <Link 
          href="/admin" 
          className="text-green-600 hover:text-green-800 text-sm flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          Back to Admin Dashboard
        </Link>
      </div>
    </div>
  );
} 