"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/contexts/AuthContext";
import { getAllGradesFromFirestore, addGradeToFirestore } from "@/lib/firebase/firebaseUtils";

export default function GradesPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  
  // Grades state
  const [grades, setGrades] = useState<any[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentGrade, setCurrentGrade] = useState<string | null>(null);
  
  // Form state
  const [gradeName, setGradeName] = useState("");
  const [newGradeName, setNewGradeName] = useState("");
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  // Students data for showing counts
  const [students, setStudents] = useState<any[]>([]);
  
  // Loading state for Firestore data
  const [loadingGrades, setLoadingGrades] = useState(true);
  
  // Redirect if not admin
  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      router.push("/login");
    }
  }, [user, isLoading, router]);
  
  // Load grades and students from Firestore
  useEffect(() => {
    const fetchGrades = async () => {
      try {
        setLoadingGrades(true);
        const gradesData = await getAllGradesFromFirestore();
        // Extract grade names for the UI
        const loadedGrades = gradesData.map(grade => grade.name);
        setGrades(loadedGrades);
      } catch (error) {
        console.error("Error fetching grades:", error);
      } finally {
        setLoadingGrades(false);
      }
    };
    
    fetchGrades();
    // We would also fetch students here, but for now using empty array
    setStudents([]);
  }, []);
  
  // Reset form
  const resetForm = () => {
    setGradeName("");
    setNewGradeName("");
    setErrors({});
    setCurrentGrade(null);
  };
  
  // Validate form
  const validateForm = (isEdit = false) => {
    const newErrors: {[key: string]: string} = {};
    
    if (isEdit) {
      if (!newGradeName.trim()) {
        newErrors.newGradeName = "Grade designation is required";
      } else if (grades.includes(newGradeName.trim()) && newGradeName.trim() !== currentGrade) {
        newErrors.newGradeName = "This grade already exists";
      }
    } else {
      if (!gradeName.trim()) {
        newErrors.gradeName = "Grade designation is required";
      } else if (grades.includes(gradeName.trim())) {
        newErrors.gradeName = "This grade already exists";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Get student count for a grade
  const getStudentCountForGrade = (grade: string) => {
    return students.filter(student => student.grade === grade).length;
  };
  
  // Open edit modal
  const openEditModal = (grade: string) => {
    setCurrentGrade(grade);
    setNewGradeName(grade);
    setIsEditModalOpen(true);
  };
  
  // Open delete modal
  const openDeleteModal = (grade: string) => {
    setCurrentGrade(grade);
    setIsDeleteModalOpen(true);
  };
  
  // Handle form submission for new grade
  const handleAddGrade = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      // First add the grade to Firestore
      const newGradeId = await addGradeToFirestore(gradeName.trim());
      
      // If successful, update the local state
      const updatedGrades = [...grades, gradeName.trim()].sort((a, b) => {
        // Special sorting for alphanumeric grades
        if (a === "PK") return -2;
        if (b === "PK") return 2;
        if (a === "K") return -1;
        if (b === "K") return 1;
        
        // For numeric grades, sort numerically
        const numA = parseInt(a);
        const numB = parseInt(b);
        
        if (!isNaN(numA) && !isNaN(numB)) {
          return numA - numB;
        }
        
        // For other non-numeric grades, sort alphabetically
        return a.localeCompare(b);
      });
      
      setGrades(updatedGrades);
      resetForm();
      
    } catch (error) {
      console.error("Error adding grade:", error);
      alert("Failed to add grade. Please try again.");
    }
  };
  
  // Handle update grade
  const handleUpdateGrade = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm(true) || currentGrade === null) return;
    
    try {
      // Here you would implement the update in Firestore
      // For now, just update the local state since the Firestore update function isn't implemented
      // TODO: Add a updateGrade function to firebaseUtils.ts
      
      // Update grade by replacing the old name with the new one
      const updatedGrades = grades.map(g => g === currentGrade ? newGradeName.trim() : g).sort((a, b) => {
        // Special sorting for alphanumeric grades
        if (a === "PK") return -2;
        if (b === "PK") return 2;
        if (a === "K") return -1;
        if (b === "K") return 1;
        
        // For numeric grades, sort numerically
        const numA = parseInt(a);
        const numB = parseInt(b);
        
        if (!isNaN(numA) && !isNaN(numB)) {
          return numA - numB;
        }
        
        // For other non-numeric grades, sort alphabetically
        return a.localeCompare(b);
      });
      
      setGrades(updatedGrades);
      setIsEditModalOpen(false);
      resetForm();
      
    } catch (error) {
      console.error("Error updating grade:", error);
      alert("Failed to update grade. Please try again.");
    }
  };
  
  // Handle delete grade
  const handleDeleteGrade = async () => {
    if (currentGrade === null) return;
    
    const studentsInGrade = getStudentCountForGrade(currentGrade);
    
    if (studentsInGrade > 0) {
      alert(`Cannot delete this grade. ${studentsInGrade} student(s) are still assigned to it.`);
      setIsDeleteModalOpen(false);
      return;
    }
    
    try {
      // Here you would implement the delete from Firestore
      // For now, just update the local state since the Firestore delete function isn't implemented
      // TODO: Add a deleteGrade function to firebaseUtils.ts
      
      // Remove grade from the virtual data
      const updatedGrades = grades.filter(g => g !== currentGrade);
      setGrades(updatedGrades);
      
      setIsDeleteModalOpen(false);
      resetForm();
      
    } catch (error) {
      console.error("Error deleting grade:", error);
      alert("Failed to delete grade. Please try again.");
    }
  };
  
  // Helper to format grade display
  const formatGradeDisplay = (grade: string) => {
    if (grade === "PK") return "Pre-Kindergarten";
    if (grade === "K") return "Kindergarten";
    // If it's a number, add "Grade" prefix
    if (!isNaN(parseInt(grade))) {
      return `Grade ${grade}`;
    }
    // Otherwise, just return the grade as is (for custom grades like "AP", "IB", etc.)
    return grade;
  };
  
  if (isLoading || !user || loadingGrades) {
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
          <h1 className="text-3xl font-bold">Grade Management</h1>
          <p className="text-gray-600 mt-1">
            Manage grade levels for students
          </p>
        </div>
        <div className="flex space-x-3">
          <Link
            href="/admin/school-structure/grades/add-grades"
            className="bg-amber-600 hover:bg-amber-700 text-white py-2 px-4 rounded-md"
          >
            Add Default Grades
          </Link>
          <Link
            href="/admin"
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-md"
          >
            Back to Admin
          </Link>
        </div>
      </div>

      {/* Add New Grade Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Add New Grade Level</h2>
        <form onSubmit={handleAddGrade} className="max-w-md">
          <div>
            <label htmlFor="gradeName" className="block text-sm font-medium text-gray-700 mb-1">
              Grade Number *
            </label>
            <input
              type="text"
              id="gradeName"
              value={gradeName}
              onChange={(e) => setGradeName(e.target.value)}
              className={`w-full p-2 border rounded-md ${errors.gradeName ? "border-red-500" : "border-gray-300"}`}
              placeholder="e.g., 1, 2, K, PK, etc."
            />
            {errors.gradeName && <p className="mt-1 text-sm text-red-500">{errors.gradeName}</p>}
          </div>

          <div className="mt-4">
            <button
              type="submit"
              className="bg-amber-600 hover:bg-amber-700 text-white py-2 px-4 rounded-md"
            >
              Add Grade
            </button>
          </div>
        </form>
      </div>

      {/* Grades List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Current Grade Levels</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grade Level
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
              {grades.length > 0 ? (
                grades.map((grade) => (
                  <tr key={grade}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{formatGradeDisplay(grade)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {getStudentCountForGrade(grade)} students
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openEditModal(grade)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Rename
                      </button>
                      <button
                        onClick={() => openDeleteModal(grade)}
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
                    No grade levels found. Add your first grade level using the form above.
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
              <h3 className="text-lg font-medium">Update Grade Level</h3>
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
            <form onSubmit={handleUpdateGrade}>
              <div className="mb-4">
                <label htmlFor="currentGradeName" className="block text-sm font-medium text-gray-700 mb-1">
                  Current Grade
                </label>
                <input
                  type="text"
                  id="currentGradeName"
                  value={currentGrade !== null ? formatGradeDisplay(currentGrade) : ''}
                  disabled
                  className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="newGradeName" className="block text-sm font-medium text-gray-700 mb-1">
                  New Grade Designation *
                </label>
                <input
                  type="text"
                  id="newGradeName"
                  value={newGradeName}
                  onChange={(e) => setNewGradeName(e.target.value)}
                  className={`w-full p-2 border rounded-md ${errors.newGradeName ? "border-red-500" : "border-gray-300"}`}
                  placeholder="e.g., 1, 2, K, PK, etc."
                />
                {errors.newGradeName && <p className="mt-1 text-sm text-red-500">{errors.newGradeName}</p>}
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
                  Update Grade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && currentGrade !== null && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-6 m-4 max-w-md w-full">
            <div className="mb-4">
              <h3 className="text-lg font-medium">Confirm Deletion</h3>
              <p className="text-gray-600 mt-2">
                Are you sure you want to delete {formatGradeDisplay(currentGrade)}?
              </p>
              {getStudentCountForGrade(currentGrade) > 0 && (
                <p className="mt-2 text-red-500">
                  Warning: This grade has {getStudentCountForGrade(currentGrade)} student(s) assigned to it. 
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
                onClick={handleDeleteGrade}
                className={`${
                  getStudentCountForGrade(currentGrade) > 0
                    ? "bg-red-300 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700"
                } text-white py-2 px-4 rounded-md`}
                disabled={getStudentCountForGrade(currentGrade) > 0}
              >
                Delete Grade
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 