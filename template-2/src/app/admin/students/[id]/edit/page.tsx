"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter, notFound } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/contexts/AuthContext";
import { getStudentById, updateStudent, getAllGradesFromFirestore } from "@/lib/firebase/firebaseUtils";
import { getAllClasses } from "@/lib/data";

export default function EditStudentPage({ params }: { params: { id: string } }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [student, setStudent] = useState<any>(null);
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);
  const [availableGrades, setAvailableGrades] = useState<any[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingGrades, setIsLoadingGrades] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    grade: "",
    homeroom: "",
    guardian: "",
    guardianEmail: "",
    guardianPhone: "",
    gpa: 0,
    attendance: 0,
  });

  // Redirect if not admin
  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  // Load student data, available classes and grades
  useEffect(() => {
    const loadData = async () => {
      try {
        // Get student data
        const studentData = await getStudentById(params.id);
        if (studentData) {
          setStudent(studentData);
          setFormData({
            firstName: studentData.firstName || "",
            lastName: studentData.lastName || "",
            email: studentData.email || "",
            grade: studentData.grade?.toString() || "",
            homeroom: studentData.homeroom || "",
            guardian: studentData.guardian || "",
            guardianEmail: studentData.guardianEmail || "",
            guardianPhone: studentData.guardianPhone || "",
            gpa: studentData.gpa || 0,
            attendance: studentData.attendance || 0,
          });
        }

        // Get available classes (you might want to replace this with a Firestore query)
        setAvailableClasses(['9A', '9B', '10A', '10B', '11A', '11B', '12A', '12B']);
        
        // Get grades from Firestore
        setIsLoadingGrades(true);
        const gradesData = await getAllGradesFromFirestore();
        setAvailableGrades(gradesData);
        setIsLoadingGrades(false);
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };

    if (user && user.role === "admin") {
      loadData();
    }
  }, [params.id, user]);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "gpa" || name === "attendance" ? parseFloat(value) : value
    }));
  };

  // Validate form data
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.grade) {
      newErrors.grade = "Grade level is required";
    }

    if (!formData.homeroom.trim()) {
      newErrors.homeroom = "Homeroom is required";
    }

    if (!formData.guardian.trim()) {
      newErrors.guardian = "Guardian name is required";
    }

    if (!formData.guardianEmail.trim()) {
      newErrors.guardianEmail = "Guardian email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(formData.guardianEmail)) {
      newErrors.guardianEmail = "Please enter a valid email address";
    }

    if (!formData.guardianPhone.trim()) {
      newErrors.guardianPhone = "Guardian phone is required";
    }

    if (isNaN(formData.gpa) || formData.gpa < 0 || formData.gpa > 4) {
      newErrors.gpa = "GPA must be between 0 and 4";
    }

    if (isNaN(formData.attendance) || formData.attendance < 0 || formData.attendance > 100) {
      newErrors.attendance = "Attendance must be between 0 and 100";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      await updateStudent(params.id, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        grade: formData.grade,
        homeroom: formData.homeroom,
        guardian: formData.guardian,
        guardianEmail: formData.guardianEmail,
        guardianPhone: formData.guardianPhone,
        gpa: formData.gpa,
        attendance: formData.attendance,
      });
      
      setMessage({ 
        type: "success", 
        text: "Student information updated successfully." 
      });
      
      // Redirect to student details page after a short delay
      setTimeout(() => {
        router.push(`/admin/students/${params.id}/details`);
      }, 1500);
    } catch (error) {
      setMessage({
        type: "error",
        text: "An error occurred while updating the student information."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }
  
  if (!student) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href={`/admin/students/${params.id}`} className="text-teal-600 hover:text-teal-800 text-sm flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          Back to Student Profile
        </Link>
      </div>

      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold">Edit Student</h1>
          <p className="text-gray-600">Update information for {student.firstName} {student.lastName}</p>
        </div>
      </div>

      {message.text && (
        <div className={`mb-6 p-4 rounded-md ${message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Student Information */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Student Information</h2>
              
              <div className="mb-4">
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded-md ${errors.firstName ? "border-red-500" : "border-gray-300"}`}
                />
                {errors.firstName && <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>}
              </div>
              
              <div className="mb-4">
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded-md ${errors.lastName ? "border-red-500" : "border-gray-300"}`}
                />
                {errors.lastName && <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>}
              </div>
              
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded-md ${errors.email ? "border-red-500" : "border-gray-300"}`}
                />
                {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-1">
                    Grade Level *
                  </label>
                  <select
                    id="grade"
                    name="grade"
                    value={formData.grade}
                    onChange={handleChange}
                    className={`w-full p-2 border rounded-md ${errors.grade ? "border-red-500" : "border-gray-300"}`}
                  >
                    <option value="">Select Grade</option>
                    {isLoadingGrades ? (
                      <option disabled>Loading grades...</option>
                    ) : availableGrades.length > 0 ? (
                      availableGrades.map((grade) => (
                        <option key={grade.id} value={grade.name}>
                          {grade.name}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="K">Kindergarten</option>
                        <option value="PK">Pre-Kindergarten</option>
                        <option value="1">Grade 1</option>
                        <option value="2">Grade 2</option>
                        <option value="3">Grade 3</option>
                        <option value="4">Grade 4</option>
                        <option value="5">Grade 5</option>
                        <option value="6">Grade 6</option>
                        <option value="7">Grade 7</option>
                        <option value="8">Grade 8</option>
                        <option value="9">Grade 9</option>
                        <option value="10">Grade 10</option>
                        <option value="11">Grade 11</option>
                        <option value="12">Grade 12</option>
                      </>
                    )}
                  </select>
                  {errors.grade && <p className="mt-1 text-sm text-red-500">{errors.grade}</p>}
                </div>
                
                <div>
                  <label htmlFor="homeroom" className="block text-sm font-medium text-gray-700 mb-1">
                    Homeroom Class *
                  </label>
                  <select
                    id="homeroom"
                    name="homeroom"
                    value={formData.homeroom}
                    onChange={handleChange}
                    className={`w-full p-2 border rounded-md ${errors.homeroom ? "border-red-500" : "border-gray-300"}`}
                  >
                    <option value="">Select Homeroom</option>
                    {availableClasses.map(className => (
                      <option key={className} value={className}>
                        {className}
                      </option>
                    ))}
                  </select>
                  {errors.homeroom && <p className="mt-1 text-sm text-red-500">{errors.homeroom}</p>}
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="gpa" className="block text-sm font-medium text-gray-700 mb-1">
                    GPA (0-4) *
                  </label>
                  <input
                    type="number"
                    id="gpa"
                    name="gpa"
                    value={formData.gpa}
                    onChange={handleChange}
                    min="0"
                    max="4"
                    step="0.1"
                    className={`w-full p-2 border rounded-md ${errors.gpa ? "border-red-500" : "border-gray-300"}`}
                  />
                  {errors.gpa && <p className="mt-1 text-sm text-red-500">{errors.gpa}</p>}
                </div>
                
                <div>
                  <label htmlFor="attendance" className="block text-sm font-medium text-gray-700 mb-1">
                    Attendance (%) *
                  </label>
                  <input
                    type="number"
                    id="attendance"
                    name="attendance"
                    value={formData.attendance}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    step="0.1"
                    className={`w-full p-2 border rounded-md ${errors.attendance ? "border-red-500" : "border-gray-300"}`}
                  />
                  {errors.attendance && <p className="mt-1 text-sm text-red-500">{errors.attendance}</p>}
                </div>
              </div>
            </div>
            
            {/* Guardian Information */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Guardian Information</h2>
              
              <div className="mb-4">
                <label htmlFor="guardian" className="block text-sm font-medium text-gray-700 mb-1">
                  Guardian Name *
                </label>
                <input
                  type="text"
                  id="guardian"
                  name="guardian"
                  value={formData.guardian}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded-md ${errors.guardian ? "border-red-500" : "border-gray-300"}`}
                />
                {errors.guardian && <p className="mt-1 text-sm text-red-500">{errors.guardian}</p>}
              </div>
              
              <div className="mb-4">
                <label htmlFor="guardianEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  Guardian Email *
                </label>
                <input
                  type="email"
                  id="guardianEmail"
                  name="guardianEmail"
                  value={formData.guardianEmail}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded-md ${errors.guardianEmail ? "border-red-500" : "border-gray-300"}`}
                />
                {errors.guardianEmail && <p className="mt-1 text-sm text-red-500">{errors.guardianEmail}</p>}
              </div>
              
              <div className="mb-4">
                <label htmlFor="guardianPhone" className="block text-sm font-medium text-gray-700 mb-1">
                  Guardian Phone *
                </label>
                <input
                  type="text"
                  id="guardianPhone"
                  name="guardianPhone"
                  value={formData.guardianPhone}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded-md ${errors.guardianPhone ? "border-red-500" : "border-gray-300"}`}
                />
                {errors.guardianPhone && <p className="mt-1 text-sm text-red-500">{errors.guardianPhone}</p>}
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <Link
              href={`/admin/students/${params.id}`}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-md"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`bg-teal-600 hover:bg-teal-700 text-white py-2 px-4 rounded-md ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 