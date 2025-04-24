"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/contexts/AuthContext";
import { getAllTeachers } from "@/lib/firebase/firebaseUtils";

// Define teacher interface
interface Teacher {
  id: string;
  name: string;
  email: string;
  role: string;
  subject?: string;
  specialization?: string;
  createdAt?: Date;
}

export default function TeachersManagementPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Fetch teachers from Firestore
  useEffect(() => {
    const fetchTeachers = async () => {
      setIsLoading(true);
      setError("");
      
      try {
        console.log("Fetching teachers from admin panel...");
        const teacherData = await getAllTeachers();
        console.log("Teachers fetched:", teacherData);
        
        if (teacherData.length === 0) {
          console.log("No teachers returned from API");
          setError("No teachers found. Please create a teacher using the 'Add New Teacher' button.");
        } else {
          setTeachers(teacherData);
        }
      } catch (err) {
        console.error("Error fetching teachers:", err);
        setError("Failed to load teachers. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    if (user && user.role === "admin") {
      fetchTeachers();
    }
  }, [user]);

  // Filter teachers based on search query
  const filteredTeachers = teachers.filter(
    (teacher) =>
      teacher.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <h1 className="text-2xl font-bold">Teacher Management</h1>
          <p className="text-gray-600 mt-1">View, add, edit, and delete teachers</p>
        </div>
        <Link
          href="/admin/teachers/create"
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
        >
          Add New Teacher
        </Link>
      </div>

      {/* Search and filters */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="flex">
          <input
            type="text"
            placeholder="Search teachers by name, email, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Error message if any */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Teachers list */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading teachers...</p>
          </div>
        ) : filteredTeachers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Name
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Email
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Role
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTeachers.map((teacher) => (
                  <tr key={teacher.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{teacher.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{teacher.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{teacher.role}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link 
                        href={`/admin/teachers/${teacher.id}/edit`} 
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Edit
                      </Link>
                          <button 
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete ${teacher.name}?`)) {
                            // Delete logic would go here
                            console.log(`Delete ${teacher.name}`);
                          }
                        }}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center">
            <p className="text-gray-500">
              {searchQuery
                ? "No teachers found matching your search criteria."
                : "No teachers have been added yet."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 