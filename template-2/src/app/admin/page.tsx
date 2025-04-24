"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/contexts/AuthContext";
import { teachers, groups, students } from "@/lib/data";
import { createUser, checkUserExists } from "@/lib/firebase/firebaseUtils";

export default function AdminDashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  const [adminActionMessage, setAdminActionMessage] = useState("");
  const [adminActionError, setAdminActionError] = useState("");

  // Redirect if not admin
  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  // Function to create Khalil as admin
  const createKhalilAdmin = async () => {
    setAdminActionMessage("");
    setAdminActionError("");
    setIsCreatingAdmin(true);
    
    try {
      // Check if user already exists
      const emailExists = await checkUserExists("khalil.hendricks@gmail.com");
      
      if (emailExists) {
        setAdminActionMessage("Admin account for khalil.hendricks@gmail.com already exists!");
        setIsCreatingAdmin(false);
        return;
      }
      
      // Create admin user
      await createUser(
        "khalil.hendricks@gmail.com",
        "admin123",
        "Khalil Hendricks",
        "admin",
        {
          subject: "Administration",
          specialization: "System Administration"
        }
      );
      
      setAdminActionMessage("Admin account for khalil.hendricks@gmail.com created successfully!");
    } catch (error: any) {
      console.error("Error creating admin:", error);
      setAdminActionError(error.message || "Failed to create admin account");
    } finally {
      setIsCreatingAdmin(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">System Administrator Dashboard</h1>
      
      {/* Quick Admin Creation Card */}
      <div className="mb-6 bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 bg-blue-50 border-b border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-blue-800">Admin Account Creation</h2>
              <p className="text-sm text-blue-600">Quick action: Create admin account for khalil.hendricks@gmail.com</p>
            </div>
            <button
              type="button"
              onClick={createKhalilAdmin}
              disabled={isCreatingAdmin}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isCreatingAdmin ? "Creating..." : "Create Admin Account"}
            </button>
          </div>
          {adminActionMessage && (
            <div className="mt-2 p-2 bg-green-50 text-green-700 rounded-md text-sm">
              {adminActionMessage}
            </div>
          )}
          {adminActionError && (
            <div className="mt-2 p-2 bg-red-50 text-red-700 rounded-md text-sm">
              {adminActionError}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Admin Modules */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {/* Teacher Management */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b bg-blue-50">
              <h2 className="text-xl font-semibold text-blue-800">Teacher Management</h2>
              <p className="mt-1 text-sm text-gray-600">Create, edit and delete teachers</p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex flex-col space-y-2">
                  <Link 
                    href="/admin/teachers" 
                    className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                    </svg>
                    View All Teachers
                  </Link>
                  <Link 
                    href="/admin/teachers/create" 
                    className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    Add New Teacher
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Student Management */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b bg-teal-50">
              <h2 className="text-xl font-semibold text-teal-800">Student Management</h2>
              <p className="mt-1 text-sm text-gray-600">Create, edit and manage students</p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex flex-col space-y-2">
                  <Link 
                    href="/admin/students" 
                    className="text-teal-600 hover:text-teal-800 font-medium flex items-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    View All Students
                  </Link>
                  <Link 
                    href="/admin/students/create" 
                    className="text-teal-600 hover:text-teal-800 font-medium flex items-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    Add New Student
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Group Management */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b bg-indigo-50">
              <h2 className="text-xl font-semibold text-indigo-800">Group Management</h2>
              <p className="mt-1 text-sm text-gray-600">Create, edit and delete groups</p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex flex-col space-y-2">
                  <Link 
                    href="/admin/groups" 
                    className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    </svg>
                    View All Groups
                  </Link>
                  <Link 
                    href="/admin/groups/create" 
                    className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    Create New Group
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* School Structure Management */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b bg-amber-50">
              <h2 className="text-xl font-semibold text-amber-800">School Structure</h2>
              <p className="mt-1 text-sm text-gray-600">Manage grades, classes and phases</p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex flex-col space-y-2">
                  <Link 
                    href="/admin/school-structure/phases" 
                    className="text-amber-600 hover:text-amber-800 font-medium flex items-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                    </svg>
                    Manage School Phases
                  </Link>
                  <Link 
                    href="/admin/school-structure/classes" 
                    className="text-amber-600 hover:text-amber-800 font-medium flex items-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                    </svg>
                    Manage Classes
                  </Link>
                  <Link 
                    href="/admin/school-structure/grades" 
                    className="text-amber-600 hover:text-amber-800 font-medium flex items-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path>
                    </svg>
                    Manage Grade Levels
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* School Events Management */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b bg-amber-50">
              <h2 className="text-xl font-semibold text-amber-800">School Events</h2>
              <p className="mt-1 text-sm text-gray-600">Manage events for classes, grades, phases, or the whole school</p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex flex-col space-y-2">
                  <Link 
                    href="/admin/events" 
                    className="text-amber-600 hover:text-amber-800 font-medium flex items-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    View All Events
                  </Link>
                  <Link 
                    href="/admin/events/create" 
                    className="text-amber-600 hover:text-amber-800 font-medium flex items-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    Add New Event
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Task Status Management */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b bg-purple-50">
              <h2 className="text-xl font-semibold text-purple-800">Task Status Management</h2>
              <p className="mt-1 text-sm text-gray-600">Customize task status options</p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <Link 
                  href="/admin/task-status" 
                  className="text-purple-600 hover:text-purple-800 font-medium flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
                  </svg>
                  Manage Task Status Options
                </Link>
              </div>
            </div>
          </div>
          
          {/* Incident Types Management */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b bg-rose-50">
              <h2 className="text-xl font-semibold text-rose-800">Incident Types Management</h2>
              <p className="mt-1 text-sm text-gray-600">Customize incident type options</p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <Link 
                  href="/admin/incident-types" 
                  className="text-rose-600 hover:text-rose-800 font-medium flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                  </svg>
                  Manage Incident Type Options
                </Link>
              </div>
            </div>
          </div>
          
          {/* Campus Locations Management */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b bg-teal-50">
              <h2 className="text-xl font-semibold text-teal-800">Campus Locations</h2>
              <p className="mt-1 text-sm text-gray-600">Manage campus locations for incident reporting</p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <Link 
                  href="/admin/campus-locations" 
                  className="text-teal-600 hover:text-teal-800 font-medium flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                  Manage Campus Locations
                </Link>
              </div>
            </div>
          </div>

          {/* Teacher Role Management */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b bg-green-50">
              <h2 className="text-xl font-semibold text-green-800">Teacher Role Management</h2>
              <p className="mt-1 text-sm text-gray-600">Customize teacher role options</p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <Link 
                  href="/admin/teacher-roles" 
                  className="text-green-600 hover:text-green-800 font-medium flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"></path>
                  </svg>
                  Manage Teacher Role Options
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 mr-4">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Total Teachers</p>
              <p className="text-2xl font-semibold">5</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-teal-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-teal-100 mr-4">
              <svg className="w-6 h-6 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Total Students</p>
              <p className="text-2xl font-semibold">5</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-indigo-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-indigo-100 mr-4">
              <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Total Groups</p>
              <p className="text-2xl font-semibold">4</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 mr-4">
              <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Task Status Options</p>
              <p className="text-2xl font-semibold">4</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 