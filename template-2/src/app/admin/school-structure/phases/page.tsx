"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/contexts/AuthContext";
import { 
  getAllPhases,
  addPhase,
  updatePhase,
  deletePhase,
  getAllGrades
} from "@/lib/data";

interface Phase {
  id: string;
  name: string;
  grades: string[];
}

export default function PhasesPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  
  // Phases state
  const [phases, setPhases] = useState<Phase[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<Phase | null>(null);
  
  // Form state
  const [phaseName, setPhaseName] = useState("");
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [customGrade, setCustomGrade] = useState("");
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  // Available grades from the grades management section
  const [availableGrades, setAvailableGrades] = useState<string[]>([]);
  
  // Redirect if not admin
  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      router.push("/login");
    }
  }, [user, isLoading, router]);
  
  // Load phases and available grades
  useEffect(() => {
    // Load phases
    const loadedPhases = getAllPhases();
    // Convert any numeric grades to strings to ensure compatibility
    const phasesWithStringGrades = loadedPhases.map(phase => ({
      ...phase,
      grades: phase.grades.map(grade => grade.toString())
    }));
    setPhases(phasesWithStringGrades);
    
    // Load available grades from the grades management section
    const loadedGrades = getAllGrades().map(grade => grade.toString());
    
    // If no grades have been added yet, provide some defaults
    if (loadedGrades.length === 0) {
      setAvailableGrades(["PK", "K", ...Array.from({ length: 12 }, (_, i) => (i + 1).toString())]);
    } else {
      setAvailableGrades(loadedGrades);
    }
  }, []);
  
  // Reset form
  const resetForm = () => {
    setPhaseName("");
    setSelectedGrades([]);
    setCustomGrade("");
    setErrors({});
    setCurrentPhase(null);
  };
  
  // Toggle grade selection
  const toggleGradeSelection = (grade: string) => {
    setSelectedGrades(prev => {
      if (prev.includes(grade)) {
        return prev.filter(g => g !== grade);
      } else {
        return [...prev, grade].sort((a, b) => {
          // Special sorting that puts PK, K first, then numeric grades
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
      }
    });
  };
  
  // Add custom grade
  const addCustomGrade = () => {
    if (!customGrade.trim()) return;
    
    if (!selectedGrades.includes(customGrade.trim())) {
      setSelectedGrades(prev => [...prev, customGrade.trim()]);
      setCustomGrade("");
    }
  };
  
  // Validate form
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!phaseName.trim()) {
      newErrors.name = "Phase name is required";
    }
    
    if (selectedGrades.length === 0) {
      newErrors.grades = "Please select at least one grade level";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Open edit modal
  const openEditModal = (phase: Phase) => {
    setCurrentPhase(phase);
    setPhaseName(phase.name);
    // Ensure grades are strings
    setSelectedGrades(phase.grades.map(g => g.toString()));
    setIsEditModalOpen(true);
  };
  
  // Open delete modal
  const openDeleteModal = (phase: Phase) => {
    setCurrentPhase(phase);
    setIsDeleteModalOpen(true);
  };
  
  // Handle form submission for new phase
  const handleAddPhase = (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    // Convert string grades to numbers when possible (for backward compatibility)
    const processedGrades = selectedGrades.map(grade => {
      return isNaN(parseInt(grade)) ? grade : parseInt(grade);
    });
    
    addPhase(phaseName, processedGrades);
    
    // Update local state
    const loadedPhases = getAllPhases();
    const phasesWithStringGrades = loadedPhases.map(phase => ({
      ...phase,
      grades: phase.grades.map(grade => grade.toString())
    }));
    setPhases(phasesWithStringGrades);
    resetForm();
  };
  
  // Handle update phase
  const handleUpdatePhase = (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !currentPhase) return;
    
    // Convert string grades to numbers when possible (for backward compatibility)
    const processedGrades = selectedGrades.map(grade => {
      return isNaN(parseInt(grade)) ? grade : parseInt(grade);
    });
    
    const success = updatePhase(currentPhase.id, phaseName, processedGrades);
    
    if (success) {
      // Update local state
      const loadedPhases = getAllPhases();
      const phasesWithStringGrades = loadedPhases.map(phase => ({
        ...phase,
        grades: phase.grades.map(grade => grade.toString())
      }));
      setPhases(phasesWithStringGrades);
      setIsEditModalOpen(false);
      resetForm();
    }
  };
  
  // Handle delete phase
  const handleDeletePhase = () => {
    if (!currentPhase) return;
    
    const success = deletePhase(currentPhase.id);
    
    if (success) {
      // Update local state
      const loadedPhases = getAllPhases();
      const phasesWithStringGrades = loadedPhases.map(phase => ({
        ...phase,
        grades: phase.grades.map(grade => grade.toString())
      }));
      setPhases(phasesWithStringGrades);
      setIsDeleteModalOpen(false);
      resetForm();
    }
  };
  
  // Helper function to format grade display
  const formatGradeDisplay = (grade: string) => {
    if (grade === "PK") return "Pre-K";
    if (grade === "K") return "Kindergarten";
    if (!isNaN(parseInt(grade))) return `Grade ${grade}`;
    return grade; // For custom grades
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
          <h1 className="text-3xl font-bold">School Phases</h1>
          <p className="text-gray-600 mt-1">
            Manage school phases and their associated grade levels
          </p>
        </div>
        <Link
          href="/admin"
          className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-md"
        >
          Back to Admin
        </Link>
      </div>

      {/* Add New Phase Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Add New Phase</h2>
        <form onSubmit={handleAddPhase}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="phaseName" className="block text-sm font-medium text-gray-700 mb-1">
                Phase Name *
              </label>
              <input
                type="text"
                id="phaseName"
                value={phaseName}
                onChange={(e) => setPhaseName(e.target.value)}
                className={`w-full p-2 border rounded-md ${errors.name ? "border-red-500" : "border-gray-300"}`}
                placeholder="e.g., Elementary School, Middle School"
              />
              {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grade Levels *
              </label>
              <div className={`grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 ${errors.grades ? "border border-red-500 p-2 rounded-md" : ""}`}>
                {availableGrades.map((grade) => (
                  <label
                    key={grade}
                    className={`flex items-center p-2 border rounded-md text-sm cursor-pointer ${
                      selectedGrades.includes(grade)
                        ? "bg-amber-50 border-amber-400 text-amber-800"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedGrades.includes(grade)}
                      onChange={() => toggleGradeSelection(grade)}
                      className="h-4 w-4 text-amber-600 focus:ring-amber-500 mr-2"
                    />
                    {formatGradeDisplay(grade)}
                  </label>
                ))}
              </div>
              
              {/* Custom grade input */}
              <div className="mt-4">
                <label htmlFor="customGrade" className="block text-sm font-medium text-gray-700 mb-1">
                  Add Custom Grade
                </label>
                <div className="flex">
                  <input
                    type="text"
                    id="customGrade"
                    value={customGrade}
                    onChange={(e) => setCustomGrade(e.target.value)}
                    className="flex-1 p-2 border rounded-l-md border-gray-300"
                    placeholder="e.g., AP, IB, etc."
                  />
                  <button
                    type="button"
                    onClick={addCustomGrade}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-r-md border border-gray-300 border-l-0"
                  >
                    Add
                  </button>
                </div>
              </div>
              
              {/* Selected custom grades */}
              {selectedGrades.filter(g => !availableGrades.includes(g)).length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-700 mb-1">Custom Grades:</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedGrades.filter(g => !availableGrades.includes(g)).map(grade => (
                      <span
                        key={grade}
                        className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-100 text-amber-800"
                      >
                        {grade}
                        <button
                          type="button"
                          onClick={() => toggleGradeSelection(grade)}
                          className="ml-1 text-amber-600 hover:text-amber-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {errors.grades && <p className="mt-1 text-sm text-red-500">{errors.grades}</p>}
            </div>
          </div>

          <div className="mt-6">
            <button
              type="submit"
              className="bg-amber-600 hover:bg-amber-700 text-white py-2 px-4 rounded-md"
            >
              Add Phase
            </button>
          </div>
        </form>
      </div>

      {/* Phases List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Current Phases</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phase Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grade Levels
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {phases.length > 0 ? (
                phases.map((phase) => (
                  <tr key={phase.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{phase.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {phase.grades.map((grade) => (
                          <span
                            key={grade}
                            className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-100 text-amber-800"
                          >
                            {formatGradeDisplay(grade)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openEditModal(phase)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => openDeleteModal(phase)}
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
                    No phases found. Add your first phase using the form above.
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
          <div className="bg-white rounded-lg shadow-xl p-6 m-4 max-w-xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Edit Phase</h3>
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
            <form onSubmit={handleUpdatePhase}>
              <div className="mb-4">
                <label htmlFor="editPhaseName" className="block text-sm font-medium text-gray-700 mb-1">
                  Phase Name *
                </label>
                <input
                  type="text"
                  id="editPhaseName"
                  value={phaseName}
                  onChange={(e) => setPhaseName(e.target.value)}
                  className={`w-full p-2 border rounded-md ${errors.name ? "border-red-500" : "border-gray-300"}`}
                />
                {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Grade Levels *
                </label>
                <div className={`grid grid-cols-3 sm:grid-cols-4 gap-2 ${errors.grades ? "border border-red-500 p-2 rounded-md" : ""}`}>
                  {availableGrades.map((grade) => (
                    <label
                      key={grade}
                      className={`flex items-center p-2 border rounded-md text-sm cursor-pointer ${
                        selectedGrades.includes(grade)
                          ? "bg-amber-50 border-amber-400 text-amber-800"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedGrades.includes(grade)}
                        onChange={() => toggleGradeSelection(grade)}
                        className="h-4 w-4 text-amber-600 focus:ring-amber-500 mr-2"
                      />
                      {formatGradeDisplay(grade)}
                    </label>
                  ))}
                </div>
                
                {/* Custom grade input */}
                <div className="mt-4">
                  <label htmlFor="editCustomGrade" className="block text-sm font-medium text-gray-700 mb-1">
                    Add Custom Grade
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      id="editCustomGrade"
                      value={customGrade}
                      onChange={(e) => setCustomGrade(e.target.value)}
                      className="flex-1 p-2 border rounded-l-md border-gray-300"
                      placeholder="e.g., AP, IB, etc."
                    />
                    <button
                      type="button"
                      onClick={addCustomGrade}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-r-md border border-gray-300 border-l-0"
                    >
                      Add
                    </button>
                  </div>
                </div>
                
                {/* Selected custom grades */}
                {selectedGrades.filter(g => !availableGrades.includes(g)).length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-gray-700 mb-1">Custom Grades:</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedGrades.filter(g => !availableGrades.includes(g)).map(grade => (
                        <span
                          key={grade}
                          className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-100 text-amber-800"
                        >
                          {grade}
                          <button
                            type="button"
                            onClick={() => toggleGradeSelection(grade)}
                            className="ml-1 text-amber-600 hover:text-amber-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {errors.grades && <p className="mt-1 text-sm text-red-500">{errors.grades}</p>}
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
                  Update Phase
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
                Are you sure you want to delete the phase "{currentPhase?.name}"? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePhase}
                className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md"
              >
                Delete Phase
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 