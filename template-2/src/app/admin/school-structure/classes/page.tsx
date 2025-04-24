"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/contexts/AuthContext";
import { getAllClasses, getAllStudents } from "@/lib/data";

export default function ClassesPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  
  // Classes state
  const [classes, setClasses] = useState<string[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentClass, setCurrentClass] = useState("");
  
  // Form state
  const [className, setClassName] = useState("");
  const [newClassName, setNewClassName] = useState("");
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  // Students data for showing counts
  const [students, setStudents] = useState<any[]>([]);
  
  // Redirect if not admin
  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      router.push("/login");
    }
  }, [user, isLoading, router]);
  
  // Load classes and students
  useEffect(() => {
    setClasses(getAllClasses());
    setStudents(getAllStudents());
  }, []);
  
  // Reset form
  const resetForm = () => {
    setClassName("");
    setNewClassName("");
    setErrors({});
    setCurrentClass("");
  };
  
  // Validate form
  const validateForm = (isEdit = false) => {
    const newErrors: {[key: string]: string} = {};
    
    if (isEdit) {
      if (!newClassName.trim()) {
        newErrors.newClassName = "Class name is required";
      } else if (classes.includes(newClassName) && newClassName !== currentClass) {
        newErrors.newClassName = "This class name already exists";
      }
    } else {
      if (!className.trim()) {
        newErrors.className = "Class name is required";
      } else if (classes.includes(className)) {
        newErrors.className = "This class name already exists";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Get student count for a class
  const getStudentCountForClass = (className: string) => {
    return students.filter(student => student.homeroom === className).length;
  };
  
  // Open edit modal
  const openEditModal = (className: string) => {
    setCurrentClass(className);
    setNewClassName(className);
    setIsEditModalOpen(true);
  };
  
  // Open delete modal
  const openDeleteModal = (className: string) => {
    setCurrentClass(className);
    setIsDeleteModalOpen(true);
  };
  
  // Handle form submission for new class
  const handleAddClass = (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    // Add new class by updating the virtual data
    const updatedClasses = [...classes, className].sort();
    setClasses(updatedClasses);
    resetForm();
  };
  
  // Handle update class
  const handleUpdateClass = (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm(true)) return;
    
    // Update class by replacing the old name with the new one in the virtual data
    const updatedClasses = classes.map(c => c === currentClass ? newClassName : c).sort();
    setClasses(updatedClasses);
    
    // Update associated students (this would require backend integration in a real app)
    // For now, we'll just update our local state for demonstration
    const updatedStudents = students.map(student => {
      if (student.homeroom === currentClass) {
        return { ...student, homeroom: newClassName };
      }
      return student;
    });
    setStudents(updatedStudents);
    
    setIsEditModalOpen(false);
    resetForm();
  };
  
  // Handle delete class
  const handleDeleteClass = () => {
    // Check if students are still assigned to this class
    const studentsInClass = getStudentCountForClass(currentClass);
    
    if (studentsInClass > 0) {
      alert(`Cannot delete this class. ${studentsInClass} student(s) are still assigned to it.`);
      setIsDeleteModalOpen(false);
      return;
    }
    
    // Remove class from the virtual data
    const updatedClasses = classes.filter(c => c !== currentClass);
    setClasses(updatedClasses);
    
    setIsDeleteModalOpen(false);
    resetForm();
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Class Management</h1>
          <p className="text-gray-600 mt-1">
            Manage homeroom classes for students
          </p>
        </div>
        <Link
          href="/admin"
          className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-md"
        >
          Back to Admin
        </Link>
      </div>

      {/* Add New Class Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Add New Class</h2>
        <form onSubmit={handleAddClass} className="max-w-md">
          <div>
            <label htmlFor="className" className="block text-sm font-medium text-gray-700 mb-1">
              Class Name *
            </label>
            <input
              type="text"
              id="className"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              className={`w-full p-2 border rounded-md ${errors.className ? "border-red-500" : "border-gray-300"}`}
              placeholder="e.g., Room 101, Ms. Johnson's Class"
            />
            {errors.className && <p className="mt-1 text-sm text-red-500">{errors.className}</p>}
          </div>

          <div className="mt-4">
            <button
              type="submit"
              className="bg-amber-600 hover:bg-amber-700 text-white py-2 px-4 rounded-md"
            >
              Add Class
            </button>
          </div>
        </form>
      </div>

      {/* Classes List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Current Classes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Class Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Students
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {classes.length > 0 ? (
                classes.map((className) => (
                  <tr key={className}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{className}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {getStudentCountForClass(className)} students
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openEditModal(className)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Rename
                      </button>
                      <button
                        onClick={() => openDeleteModal(className)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                    No classes found. Add your first class using the form above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-6 m-4 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Rename Class</h3>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleUpdateClass}>
              <div className="mb-4">
                <label htmlFor="currentClassName" className="block text-sm font-medium text-gray-700 mb-1">
                  Current Class Name
                </label>
                <input
                  type="text"
                  id="currentClassName"
                  value={currentClass}
                  disabled
                  className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="newClassName" className="block text-sm font-medium text-gray-700 mb-1">
                  New Class Name *
                </label>
                <input
                  type="text"
                  id="newClassName"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className={`w-full p-2 border rounded-md ${errors.newClassName ? "border-red-500" : "border-gray-300"}`}
                />
                {errors.newClassName && <p className="mt-1 text-sm text-red-500">{errors.newClassName}</p>}
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    resetForm();
                  }}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md"
                >
                  Update Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-6 m-4 max-w-md w-full">
            <div className="mb-4">
              <h3 className="text-lg font-medium">Confirm Deletion</h3>
              <p className="text-gray-600 mt-2">
                Are you sure you want to delete the class "{currentClass}"?
              </p>
              {getStudentCountForClass(currentClass) > 0 && (
                <p className="mt-2 text-red-500">
                  Warning: This class has {getStudentCountForClass(currentClass)} student(s) assigned to it. 
                  You cannot delete it until all students are reassigned.
                </p>
              )}
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteClass}
                className={`${
                  getStudentCountForClass(currentClass) > 0
                    ? "bg-red-300 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700"
                } text-white py-2 px-4 rounded-md`}
                disabled={getStudentCountForClass(currentClass) > 0}
              >
                Delete Class
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 