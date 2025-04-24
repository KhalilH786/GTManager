"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/contexts/AuthContext";
import { 
  getAllTaskStatuses, 
  createTaskStatus, 
  updateTaskStatusItem, 
  deleteTaskStatus 
} from "@/lib/firebase/firebaseUtils";

interface StatusOption {
  id: string;
  name: string;
  color: string;
  isDefault?: boolean;
  order?: number;
}

export default function TaskStatusManagementPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  
  // Status options will now come from Firestore
  const [statusOptions, setStatusOptions] = useState<StatusOption[]>([]);
  const [loadingStatuses, setLoadingStatuses] = useState(true);

  const [newStatus, setNewStatus] = useState<Omit<StatusOption, "id">>({
    name: "",
    color: "#6366F1"
  });

  const [editingStatus, setEditingStatus] = useState<string | null>(null);
  const [tempEdits, setTempEdits] = useState<{name: string, color: string}>({name: "", color: ""});
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Load task statuses from Firestore
  useEffect(() => {
    const fetchTaskStatuses = async () => {
      try {
        setLoadingStatuses(true);
        const statuses = await getAllTaskStatuses();
        setStatusOptions(statuses as StatusOption[]);
      } catch (error) {
        console.error("Error fetching task statuses:", error);
        setError("Failed to load task statuses. Please try again.");
      } finally {
        setLoadingStatuses(false);
      }
    };
    
    fetchTaskStatuses();
  }, []);

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

  const handleAddStatus = async () => {
    try {
    if (!newStatus.name.trim()) {
      setError("Status name is required");
      return;
    }

    // Check for duplicate names
    if (statusOptions.some(option => option.name.toLowerCase() === newStatus.name.toLowerCase())) {
      setError("A status with this name already exists");
      return;
    }

      // Create new status in Firestore
      await createTaskStatus({
        name: newStatus.name,
        color: newStatus.color
      });
      
      // Refresh the status list
      const updatedStatuses = await getAllTaskStatuses();
      setStatusOptions(updatedStatuses as StatusOption[]);
      
      // Reset form
    setNewStatus({ name: "", color: "#6366F1" });
    setError("");
    setSuccessMessage("New status added successfully");
    } catch (error) {
      console.error("Error adding status:", error);
      setError("Failed to add status. Please try again.");
    }
  };

  const startEditing = (status: StatusOption) => {
    setTempEdits({name: status.name, color: status.color});
    setEditingStatus(status.id);
    setSuccessMessage("");
    setError("");
  };

  const handleUpdateStatus = async (id: string) => {
    try {
    // Check for duplicate names except the current status
    if (statusOptions.some(option => 
      option.id !== id && 
      option.name.toLowerCase() === tempEdits.name.toLowerCase()
    )) {
      setError("A status with this name already exists");
      return;
    }

    // Clear any previous errors
    setError("");
    
      // Update status in Firestore
      await updateTaskStatusItem(id, {
        name: tempEdits.name,
        color: tempEdits.color
      });
      
      // Refresh the status list
      const updatedStatuses = await getAllTaskStatuses();
      setStatusOptions(updatedStatuses as StatusOption[]);
      
    setEditingStatus(null);
    setSuccessMessage("Status updated successfully");
    } catch (error) {
      console.error("Error updating status:", error);
      setError("Failed to update status. Please try again.");
    }
  };

  const cancelEditing = () => {
    setEditingStatus(null);
    setError("");
  };

  const handleDeleteStatus = async (id: string) => {
    try {
    // Don't allow deleting default statuses
    const statusToDelete = statusOptions.find(option => option.id === id);
    if (statusToDelete?.isDefault) {
      setError("Default statuses cannot be deleted");
      return;
    }

      // Delete from Firestore (the function already checks if tasks are using it)
      await deleteTaskStatus(id);
      
      // Update local state
    setStatusOptions(options => options.filter(option => option.id !== id));
    setSuccessMessage("Status deleted successfully");
    } catch (error: any) {
      console.error("Error deleting status:", error);
      setError(error.message || "Failed to delete status. Please try again.");
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Task Status Management</h1>
          <p className="text-gray-600 mt-1">Customize task status options</p>
        </div>
      </div>

      {/* Status List */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="font-semibold">Current Status Options</h2>
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
          {loadingStatuses ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : statusOptions.length > 0 ? (
            <div className="grid gap-4">
              {statusOptions.map((status) => (
                <div 
                  key={status.id} 
                  className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    <span 
                      className="w-4 h-4 rounded-full inline-block"
                      style={{ backgroundColor: status.color }}
                    ></span>
                    <span className="font-medium">{status.name}</span>
                    {status.isDefault && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Default</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {editingStatus === status.id ? (
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
                          onClick={() => handleUpdateStatus(status.id)}
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
                          onClick={() => startEditing(status)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Edit
                        </button>
                        {!status.isDefault && (
                          <button 
                            onClick={() => handleDeleteStatus(status.id)}
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
            <p className="text-gray-500 text-center py-4">No status options available</p>
          )}
        </div>
      </div>

      {/* Add New Status */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="font-semibold">Add New Status</h2>
        </div>
        <div className="p-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="statusName" className="block text-sm font-medium text-gray-700 mb-1">
                Status Name
              </label>
              <input 
                type="text"
                id="statusName"
                value={newStatus.name}
                onChange={(e) => setNewStatus({ ...newStatus, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="e.g., In Review"
              />
            </div>
            <div>
              <label htmlFor="statusColor" className="block text-sm font-medium text-gray-700 mb-1">
                Color
              </label>
              <input 
                type="color"
                id="statusColor"
                value={newStatus.color}
                onChange={(e) => setNewStatus({ ...newStatus, color: e.target.value })}
                className="w-full h-10 cursor-pointer border border-gray-300 rounded-md"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleAddStatus}
                className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700"
              >
                Add Status
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Note */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mb-6">
        <h3 className="font-medium text-blue-800 mb-2">Notes on Task Status Management</h3>
        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
          <li>Default status options can be edited but cannot be deleted</li>
          <li>Changes will affect all existing and new tasks in the system</li>
          <li>Only statuses that appear here will be available in the task status filter</li>
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