"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/contexts/AuthContext";
import { getAllGroups, deleteGroup, getTeacherById } from "@/lib/firebase/firebaseUtils";

// Define Group interface
interface Group {
  id: string;
  name: string;
  description?: string;
  members: string[];
  createdAt?: any;
  updatedAt?: any;
}

export default function GroupsManagementPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [teacherCache, setTeacherCache] = useState<Record<string, any>>({});

  // Redirect if not admin
  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  // Fetch groups from Firestore
  useEffect(() => {
    const fetchGroups = async () => {
      setLoading(true);
      try {
        const fetchedGroups = await getAllGroups() as Group[];
        setGroups(fetchedGroups);
        
        // Prefetch teacher data for all groups
        const teacherIds: string[] = [];
        fetchedGroups.forEach(group => {
          if (group.members && Array.isArray(group.members)) {
            group.members.forEach((id: string) => {
              if (!teacherIds.includes(id)) {
                teacherIds.push(id);
              }
            });
          }
        });
        
        // Fetch teacher data in parallel
        const cache: Record<string, any> = {};
        const promises = teacherIds.map(async (id) => {
          try {
            const teacherData = await getTeacherById(id);
            if (teacherData) {
              cache[id] = teacherData;
            }
          } catch (error) {
            console.error(`Error fetching teacher ${id}:`, error);
          }
        });
        
        await Promise.all(promises);
        setTeacherCache(cache);
        
        setError(null);
      } catch (error) {
        console.error("Error fetching groups:", error);
        setError("Failed to load groups. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  // Get member names from IDs
  const getMemberNames = (members: string[]) => {
    if (!Array.isArray(members) || members.length === 0) {
      return "No members";
    }
    
    return members.map(id => {
      const teacher = teacherCache[id];
      return teacher ? teacher.displayName || teacher.name || `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() : "Unknown";
    }).join(", ");
  };

  // Filter groups based on search query
  const filteredGroups = searchQuery
    ? groups.filter(group => 
        group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (group.description && group.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        getMemberNames(group.members).toLowerCase().includes(searchQuery.toLowerCase())
      )
    : groups;

  // Delete group function
  const handleDeleteGroup = async (groupId: string) => {
    if (confirmDelete !== groupId) {
      setConfirmDelete(groupId);
      return;
    }

    setDeleteLoading(true);
    try {
      await deleteGroup(groupId);
      // Remove the deleted group from the state
      setGroups(groups.filter(group => group.id !== groupId));
    setConfirmDelete(null);
    } catch (error) {
      console.error("Error deleting group:", error);
      setError("Failed to delete group. Please try again.");
    } finally {
      setDeleteLoading(false);
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
      <h1 className="text-3xl font-bold mb-6">Group Management</h1>
      
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="Search groups..."
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="absolute right-3 top-2.5 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        
        <Link
          href="/admin/groups/create"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Create New Group
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-2 text-gray-600">Loading groups...</p>
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600">No groups found.</p>
      </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Members</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredGroups.map((group) => (
                  <tr key={group.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{group.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{group.description || "—"}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{getMemberNames(group.members)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                      <Link 
                          href={`/admin/groups/edit/${group.id}`}
                          className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </Link>
                        
                          <button 
                            onClick={() => handleDeleteGroup(group.id)} 
                          className={`${confirmDelete === group.id ? 'text-red-600' : 'text-gray-600'} hover:text-red-900`}
                          disabled={deleteLoading}
                        >
                          {confirmDelete === group.id ? "Confirm" : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 