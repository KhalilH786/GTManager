"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/contexts/AuthContext";
import { IncidentType, incidentTypeLabels, Incident, getAllIncidents } from "@/lib/data";

interface IncidentTypeOption {
  id: string;
  name: string;
  color: string;
  isDefault?: boolean;
}

export default function IncidentTypeManagementPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  
  // Initial incident type options based on the IncidentType type
  const [typeOptions, setTypeOptions] = useState<IncidentTypeOption[]>([
    { id: "bullying", name: "Bullying", color: "#F87171", isDefault: true },
    { id: "fighting", name: "Fighting", color: "#EF4444", isDefault: true },
    { id: "property_damage", name: "Property Damage", color: "#FB923C", isDefault: true },
    { id: "behavior", name: "Disruptive Behavior", color: "#FBBF24", isDefault: true },
    { id: "medical", name: "Medical Incident", color: "#60A5FA", isDefault: true },
    { id: "other", name: "Other", color: "#A3A3A3", isDefault: true }
  ]);

  const [newType, setNewType] = useState<Omit<IncidentTypeOption, "id">>({
    name: "",
    color: "#6366F1"
  });

  const [editingType, setEditingType] = useState<string | null>(null);
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

  const handleAddType = () => {
    if (!newType.name.trim()) {
      setError("Incident type name is required");
      return;
    }

    // Check for duplicate names
    if (typeOptions.some(option => option.name.toLowerCase() === newType.name.toLowerCase())) {
      setError("An incident type with this name already exists");
      return;
    }

    // Generate a unique ID (in a real app, this would come from the backend)
    const id = `type_${Date.now()}`;
    
    setTypeOptions([...typeOptions, { id, ...newType }]);
    setNewType({ name: "", color: "#6366F1" });
    setError("");
    setSuccessMessage("New incident type added successfully");
  };

  const startEditing = (type: IncidentTypeOption) => {
    setTempEdits({name: type.name, color: type.color});
    setEditingType(type.id);
    setSuccessMessage("");
    setError("");
  };

  const handleUpdateType = (id: string) => {
    if (!tempEdits.name.trim()) {
      setError("Incident type name is required");
      return;
    }
    
    // Check for duplicate names except the current type
    if (typeOptions.some(option => 
      option.id !== id && 
      option.name.toLowerCase() === tempEdits.name.toLowerCase()
    )) {
      setError("An incident type with this name already exists");
      return;
    }

    // Clear any previous errors
    setError("");
    
    // Update the type with the temp edits
    setTypeOptions(options => 
      options.map(option => 
        option.id === id 
          ? { ...option, name: tempEdits.name, color: tempEdits.color } 
          : option
      )
    );
    setEditingType(null);
    setSuccessMessage("Incident type updated successfully");
  };

  const cancelEditing = () => {
    setEditingType(null);
    setError("");
  };

  const handleDeleteType = (id: string) => {
    // Don't allow deleting default types
    const typeToDelete = typeOptions.find(option => option.id === id);
    if (typeToDelete?.isDefault) {
      setError("Default incident types cannot be deleted");
      return;
    }

    // Check if any incidents are using the type
    const incidentsUsingType = getAllIncidents().filter((incident: Incident) => incident.type === id);
    if (incidentsUsingType.length > 0) {
      setError(`Cannot delete incident type. ${incidentsUsingType.length} incident(s) are currently using this type. Please update those incidents to a different type first.`);
      return;
    }

    setTypeOptions(options => options.filter(option => option.id !== id));
    setSuccessMessage("Incident type deleted successfully");
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
          <h1 className="text-2xl font-bold">Incident Type Management</h1>
          <p className="text-gray-600 mt-1">Customize incident type options</p>
        </div>
      </div>

      {/* Type List */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="font-semibold">Current Incident Types</h2>
        </div>
        <div className="p-4">
          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-md text-sm">
              {successMessage}
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
              {error}
            </div>
          )}
          {typeOptions.length > 0 ? (
            <div className="grid gap-4">
              {typeOptions.map((type) => (
                <div 
                  key={type.id} 
                  className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    <span 
                      className="w-4 h-4 rounded-full inline-block"
                      style={{ backgroundColor: type.color }}
                    ></span>
                    <span className="font-medium">{type.name}</span>
                    {type.isDefault && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Default</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {editingType === type.id ? (
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
                          onClick={() => handleUpdateType(type.id)}
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
                          onClick={() => startEditing(type)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Edit
                        </button>
                        {!type.isDefault && (
                          <button 
                            onClick={() => handleDeleteType(type.id)}
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
            <p className="text-gray-500 text-center py-4">No incident types available</p>
          )}
        </div>
      </div>

      {/* Add New Incident Type */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="font-semibold">Add New Incident Type</h2>
        </div>
        <div className="p-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="typeName" className="block text-sm font-medium text-gray-700 mb-1">
                Type Name
              </label>
              <input 
                type="text"
                id="typeName"
                value={newType.name}
                onChange={(e) => setNewType({ ...newType, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="e.g., Verbal Altercation"
              />
            </div>
            <div>
              <label htmlFor="typeColor" className="block text-sm font-medium text-gray-700 mb-1">
                Color
              </label>
              <input 
                type="color"
                id="typeColor"
                value={newType.color}
                onChange={(e) => setNewType({ ...newType, color: e.target.value })}
                className="w-full h-10 cursor-pointer border border-gray-300 rounded-md"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleAddType}
                className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700"
              >
                Add Incident Type
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Note */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mb-6">
        <h3 className="font-medium text-blue-800 mb-2">Notes on Incident Type Management</h3>
        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
          <li>Default incident types can be edited but cannot be deleted</li>
          <li>In a production environment, changes will affect all existing incidents</li>
          <li>For this demo, changes are not permanent and will reset on page refresh</li>
        </ul>
      </div>

      {/* Back to admin dashboard */}
      <div>
        <Link 
          href="/admin" 
          className="text-purple-600 hover:text-purple-800 text-sm flex items-center"
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