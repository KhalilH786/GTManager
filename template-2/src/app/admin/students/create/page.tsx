"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/contexts/AuthContext";
import { createStudent, getAllGradesFromFirestore } from "@/lib/firebase/firebaseUtils";

export default function CreateStudentPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [grades, setGrades] = useState<any[]>([]);
  const [isLoadingGrades, setIsLoadingGrades] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  // State for form fields
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    grade: "",
    homeroom: "",
    guardian: "",
    guardianEmail: "",
    guardianPhone: "",
    enrollmentDate: new Date().toISOString().split('T')[0],
    gpa: "0.0",
    attendance: "100"
  });
  
  // Redirect if not admin
  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  // Fetch grades from Firestore
  useEffect(() => {
    const fetchGrades = async () => {
      try {
        setIsLoadingGrades(true);
        const gradesData = await getAllGradesFromFirestore();
        setGrades(gradesData);
      } catch (error) {
        console.error("Error fetching grades:", error);
      } finally {
        setIsLoadingGrades(false);
      }
    };
    
    if (user && user.role === "admin") {
      fetchGrades();
    }
  }, [user]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);
    
    try {
      // Basic validation
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.grade) {
        setFormError("Please fill in all required fields");
        setIsSubmitting(false);
        return;
      }
      
      // Create student in Firestore
      const studentData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        grade: formData.grade,
        homeroom: formData.homeroom,
        guardian: formData.guardian,
        guardianEmail: formData.guardianEmail,
        guardianPhone: formData.guardianPhone,
        enrollmentDate: new Date(formData.enrollmentDate),
        gpa: parseFloat(formData.gpa),
        attendance: parseFloat(formData.attendance)
      };
      
      await createStudent(studentData);
      
      // Redirect to students page
      router.push("/admin/students");
    } catch (error) {
      console.error("Error creating student:", error);
      setFormError("An error occurred while creating the student. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/admin/students" className="text-teal-600 hover:text-teal-800 text-sm flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          Back to Students
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">Add New Student</h1>
        <p className="text-gray-600">Create a new student profile</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information Section */}
            <div className="md:col-span-2">
              <h2 className="text-lg font-medium mb-4 text-gray-700 border-b pb-2">Basic Information</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="enrollmentDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Enrollment Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="enrollmentDate"
                  name="enrollmentDate"
                  value={formData.enrollmentDate}
                  onChange={handleChange}
                  required
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-1">
                  Grade <span className="text-red-500">*</span>
                </label>
                <select
                  id="grade"
                  name="grade"
                  value={formData.grade}
                  onChange={handleChange}
                  required
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
                >
                  <option value="">Select Grade</option>
                  {isLoadingGrades ? (
                    <option disabled>Loading grades...</option>
                  ) : grades.length > 0 ? (
                    grades.map((grade) => (
                      <option key={grade.id} value={grade.name}>
                        {grade.name}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="9">Grade 9</option>
                      <option value="10">Grade 10</option>
                      <option value="11">Grade 11</option>
                      <option value="12">Grade 12</option>
                    </>
                  )}
                </select>
              </div>
              
              <div>
                <label htmlFor="homeroom" className="block text-sm font-medium text-gray-700 mb-1">
                  Homeroom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="homeroom"
                  name="homeroom"
                  value={formData.homeroom}
                  onChange={handleChange}
                  required
                  placeholder="e.g. 10A"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
                />
              </div>
            </div>
            
            {/* Guardian Information Section */}
            <div className="md:col-span-2 mt-4">
              <h2 className="text-lg font-medium mb-4 text-gray-700 border-b pb-2">Guardian Information</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="guardian" className="block text-sm font-medium text-gray-700 mb-1">
                  Guardian Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="guardian"
                  name="guardian"
                  value={formData.guardian}
                  onChange={handleChange}
                  required
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="guardianEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  Guardian Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="guardianEmail"
                  name="guardianEmail"
                  value={formData.guardianEmail}
                  onChange={handleChange}
                  required
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="guardianPhone" className="block text-sm font-medium text-gray-700 mb-1">
                  Guardian Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="guardianPhone"
                  name="guardianPhone"
                  value={formData.guardianPhone}
                  onChange={handleChange}
                  required
                  placeholder="e.g. 555-123-4567"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
                />
              </div>
            </div>
            
            {/* Academic Information Section */}
            <div className="md:col-span-2 mt-4">
              <h2 className="text-lg font-medium mb-4 text-gray-700 border-b pb-2">Academic Information</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="gpa" className="block text-sm font-medium text-gray-700 mb-1">
                  Initial GPA
                </label>
                <input
                  type="number"
                  id="gpa"
                  name="gpa"
                  min="0"
                  max="4.0"
                  step="0.1"
                  value={formData.gpa}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">Enter a value between 0.0 and 4.0</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="attendance" className="block text-sm font-medium text-gray-700 mb-1">
                  Initial Attendance Rate (%)
                </label>
                <input
                  type="number"
                  id="attendance"
                  name="attendance"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.attendance}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">Enter a value between 0 and 100</p>
              </div>
            </div>
            
            {/* Submission Buttons */}
            <div className="md:col-span-2 mt-8 flex justify-end space-x-3">
              <Link
                href="/admin/students"
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
              >
                Create Student
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 