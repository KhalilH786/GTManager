"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/contexts/AuthContext";
import { 
  CampusLocation, 
  getAllCampusLocations, 
  addCampusLocation, 
  updateCampusLocation, 
  toggleCampusLocationStatus, 
  deleteCampusLocation,
  getAllIncidents
} from "@/lib/data";

export default function CampusLocationManagementPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  
  const [locations, setLocations] = useState<CampusLocation[]>([]);
  const [newLocation, setNewLocation] = useState({
    name: "",
    address: ""
  });
  
  const [editingLocation, setEditingLocation] = useState<string | null>(null);
  const [tempEdits, setTempEdits] = useState<{name: string, address: string}>({name: "", address: ""});
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Initialize locations
  useEffect(() => {
    setLocations(getAllCampusLocations());
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

  const handleAddLocation = () => {
    if (!newLocation.name.trim()) {
      setError("Campus location name is required");
      return;
    }

    // Check for duplicate names
    if (locations.some(location => location.name.toLowerCase() === newLocation.name.toLowerCase())) {
      setError("A campus location with this name already exists");
      return;
    }

    try {
      const addedLocation = addCampusLocation(newLocation.name, newLocation.address);
      setLocations([...locations, addedLocation]);
      setNewLocation({ name: "", address: "" });
      setError("");
      setSuccessMessage("New campus location added successfully");
    } catch (err) {
      setError("Failed to add campus location");
    }
  };

  const startEditing = (location: CampusLocation) => {
    setTempEdits({name: location.name, address: location.address || ""});
    setEditingLocation(location.id);
    setSuccessMessage("");
    setError("");
  };

  const handleUpdateLocation = (id: string) => {
    if (!tempEdits.name.trim()) {
      setError("Campus location name is required");
      return;
    }
    
    // Check for duplicate names except the current location
    if (locations.some(location => 
      location.id !== id && 
      location.name.toLowerCase() === tempEdits.name.toLowerCase()
    )) {
      setError("A campus location with this name already exists");
      return;
    }

    // Clear any previous errors
    setError("");
    
    try {
      const success = updateCampusLocation(id, {
        name: tempEdits.name,
        address: tempEdits.address || undefined
      });
      
      if (success) {
        setLocations(locations.map(location => 
          location.id === id 
            ? {...location, name: tempEdits.name, address: tempEdits.address || undefined, updatedAt: new Date()} 
            : location
        ));
        setEditingLocation(null);
        setSuccessMessage("Campus location updated successfully");
      } else {
        setError("Failed to update campus location");
      }
    } catch (err) {
      setError("Failed to update campus location");
    }
  };

  const cancelEditing = () => {
    setEditingLocation(null);
    setError("");
  };

  const handleToggleStatus = (id: string) => {
    try {
      const success = toggleCampusLocationStatus(id);
      if (success) {
        setLocations(locations.map(location => 
          location.id === id 
            ? {...location, isActive: !location.isActive, updatedAt: new Date()} 
            : location
        ));
        setSuccessMessage("Campus location status updated successfully");
      } else {
        setError("Failed to update campus location status");
      }
    } catch (err) {
      setError("Failed to update campus location status");
    }
  };

  const handleDeleteLocation = (id: string) => {
    // Check if any incidents are using the location
    const incidentsUsingLocation = getAllIncidents().filter(incident => 
      incident.location.includes(locations.find(loc => loc.id === id)?.name || "")
    );

    if (incidentsUsingLocation.length > 0) {
      setError(`Cannot delete campus location. ${incidentsUsingLocation.length} incident(s) are currently associated with this location. Please update those incidents to a different location first.`);
      return;
    }

    try {
      const success = deleteCampusLocation(id);
      if (success) {
        setLocations(locations.filter(location => location.id !== id));
        setSuccessMessage("Campus location deleted successfully");
      } else {
        setError("Failed to delete campus location");
      }
    } catch (err) {
      setError("Failed to delete campus location");
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
          <h1 className="text-2xl font-bold">Campus Location Management</h1>
          <p className="text-gray-600 mt-1">Configure available campus locations for incident reporting</p>
        </div>
      </div>

      {/* Location List */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="font-semibold">Current Campus Locations</h2>
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
          {locations.length > 0 ? (
            <div className="grid gap-4">
              {locations.map((location) => (
                <div 
                  key={location.id} 
                  className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50"
                >
                  <div className="flex flex-col">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{location.name}</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        location.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {location.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {location.address && (
                      <span className="text-sm text-gray-500">{location.address}</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {editingLocation === location.id ? (
                      <>
                        <div className="flex flex-col space-y-2 mr-2">
                          <input 
                            type="text"
                            value={tempEdits.name}
                            onChange={(e) => setTempEdits({...tempEdits, name: e.target.value})}
                            className="border rounded px-2 py-1 text-sm w-48"
                            placeholder="Campus name"
                          />
                          <input 
                            type="text"
                            value={tempEdits.address}
                            onChange={(e) => setTempEdits({...tempEdits, address: e.target.value})}
                            className="border rounded px-2 py-1 text-sm w-48"
                            placeholder="Address (optional)"
                          />
                        </div>
                        <button 
                          onClick={() => handleUpdateLocation(location.id)}
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
                          onClick={() => startEditing(location)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleToggleStatus(location.id)}
                          className={`text-sm ${
                            location.isActive 
                              ? 'text-yellow-600 hover:text-yellow-800' 
                              : 'text-green-600 hover:text-green-800'
                          }`}
                        >
                          {location.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button 
                          onClick={() => handleDeleteLocation(location.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No campus locations available</p>
          )}
        </div>
      </div>

      {/* Add New Campus Location */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="font-semibold">Add New Campus Location</h2>
        </div>
        <div className="p-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="locationName" className="block text-sm font-medium text-gray-700 mb-1">
                Campus Name
              </label>
              <input 
                type="text"
                id="locationName"
                value={newLocation.name}
                onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="e.g., North Campus"
              />
            </div>
            <div>
              <label htmlFor="locationAddress" className="block text-sm font-medium text-gray-700 mb-1">
                Address (Optional)
              </label>
              <input 
                type="text"
                id="locationAddress"
                value={newLocation.address}
                onChange={(e) => setNewLocation({ ...newLocation, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="e.g., 123 School Street"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleAddLocation}
                className="px-4 py-2 bg-teal-600 text-white rounded-md text-sm font-medium hover:bg-teal-700"
              >
                Add Campus Location
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Note */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mb-6">
        <h3 className="font-medium text-blue-800 mb-2">Notes on Campus Location Management</h3>
        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
          <li>Only active campus locations will be available for selection in the incident reporting form</li>
          <li>Inactive locations are still stored in the system but won't appear in dropdown menus</li>
          <li>Campus locations cannot be deleted if they are associated with existing incidents</li>
        </ul>
      </div>

      {/* Back to admin dashboard */}
      <div>
        <Link 
          href="/admin" 
          className="text-teal-600 hover:text-teal-800 text-sm flex items-center"
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