"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/contexts/AuthContext";
import { 
  getStudentById, 
  studentDocumentTypeLabels, 
  StudentDocumentType, 
  addStudentDocument 
} from "@/lib/data";

export default function AddStudentDocumentPage({ params }: { params: { id: string } }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [observation, setObservation] = useState("");
  const [reflections, setReflections] = useState("");
  // Academic intervention fields
  const [subjects, setSubjects] = useState("");
  const [academicConcerns, setAcademicConcerns] = useState("");
  const [proposedInterventions, setProposedInterventions] = useState("");
  const [documentType, setDocumentType] = useState<StudentDocumentType>("wellbeing");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  // Redirect if not admin
  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      router.push("/login");
    }
  }, [user, isLoading, router]);
  
  // Fetch student data and set initial document type from URL
  useEffect(() => {
    if (user) {
      const studentData = getStudentById(params.id);
      setStudent(studentData);
      
      // Check if type is specified in URL
      const typeParam = searchParams.get('type') as StudentDocumentType;
      if (typeParam && Object.keys(studentDocumentTypeLabels).includes(typeParam)) {
        setDocumentType(typeParam);
      }
      
      setLoading(false);
    }
  }, [params.id, user, searchParams]);
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!title.trim()) {
      setError("Please enter a title");
      return;
    }
    
    if (documentType === "wellbeing") {
      if (!observation.trim()) {
        setError("Please enter observations for wellbeing entry");
        return;
      }
      if (!reflections.trim()) {
        setError("Please enter reflections for wellbeing entry");
        return;
      }
    } else if (documentType === "academic_intervention") {
      if (!subjects.trim()) {
        setError("Please enter subject(s) for academic intervention");
        return;
      }
      if (!academicConcerns.trim()) {
        setError("Please enter academic concerns for academic intervention");
        return;
      }
      if (!proposedInterventions.trim()) {
        setError("Please enter proposed interventions for academic intervention");
        return;
      }
    } else if (!content.trim()) {
      setError("Please enter content");
      return;
    }
    
    setIsSubmitting(true);
    setError("");
    
    try {
      // Add the document to our data store using the addStudentDocument function
      if (user) {
        // Create document with the appropriate fields based on type
        if (documentType === "wellbeing") {
          addStudentDocument(
            params.id,
            documentType,
            title,
            content || "",
            user.id,
            { observation, reflections }
          );
        } else if (documentType === "academic_intervention") {
          addStudentDocument(
            params.id,
            documentType,
            title,
            content || "",
            user.id,
            { subjects, academicConcerns, proposedInterventions }
          );
        } else {
          addStudentDocument(
            params.id,
            documentType,
            title,
            content,
            user.id
          );
        }
      }
      
      // Redirect back to student detail page with the active tab set to the document type
      router.push(`/admin/students/${params.id}?tab=${documentType}`);
    } catch (err) {
      setError("An error occurred while saving the document");
      setIsSubmitting(false);
    }
  };
  
  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }
  
  if (!student) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-red-500">Student not found</p>
        <Link href="/admin/students" className="text-teal-600 hover:text-teal-800 mt-4 inline-block">
          Back to Students
        </Link>
      </div>
    );
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
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Add Document for {student.name}</h1>
        <p className="text-gray-600">Create a new document in the student's record</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <form onSubmit={handleSubmit}>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          
          <div className="mb-6">
            <label htmlFor="documentType" className="block text-sm font-medium text-gray-700 mb-1">
              Document Type
            </label>
            <select
              id="documentType"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value as StudentDocumentType)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
              required
            >
              {Object.entries(studentDocumentTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="mb-6">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
              placeholder="Enter document title"
              required
            />
          </div>
          
          {documentType === "wellbeing" ? (
            <>
              <div className="mb-6">
                <label htmlFor="observation" className="block text-sm font-medium text-gray-700 mb-1">
                  Observation
                </label>
                <textarea
                  id="observation"
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm h-32"
                  placeholder="Enter your observations of the student"
                  required
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="reflections" className="block text-sm font-medium text-gray-700 mb-1">
                  Reflections
                </label>
                <textarea
                  id="reflections"
                  value={reflections}
                  onChange={(e) => setReflections(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm h-32"
                  placeholder="Enter your reflections and recommendations"
                  required
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Notes
                </label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm h-24"
                  placeholder="Any additional notes (optional)"
                />
              </div>
            </>
          ) : documentType === "academic_intervention" ? (
            <>
              <div className="mb-6">
                <label htmlFor="subjects" className="block text-sm font-medium text-gray-700 mb-1">
                  Subject(s)
                </label>
                <input
                  type="text"
                  id="subjects"
                  value={subjects}
                  onChange={(e) => setSubjects(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
                  placeholder="E.g., Math, Science, English"
                  required
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="academicConcerns" className="block text-sm font-medium text-gray-700 mb-1">
                  Academic concerns
                </label>
                <textarea
                  id="academicConcerns"
                  value={academicConcerns}
                  onChange={(e) => setAcademicConcerns(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm h-32"
                  placeholder="Describe the academic concerns or challenges"
                  required
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="proposedInterventions" className="block text-sm font-medium text-gray-700 mb-1">
                  Proposed interventions
                </label>
                <textarea
                  id="proposedInterventions"
                  value={proposedInterventions}
                  onChange={(e) => setProposedInterventions(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm h-32"
                  placeholder="Describe the interventions to be implemented"
                  required
                />
              </div>
            </>
          ) : (
            <div className="mb-6">
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                Content
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm h-40"
                placeholder="Enter document content"
                required
              />
            </div>
          )}
          
          <div className="flex items-center justify-end">
            <Link
              href={`/admin/students/${params.id}`}
              className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium shadow-sm hover:bg-gray-50 mr-2"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`bg-teal-600 text-white px-4 py-2 rounded-md text-sm font-medium shadow-sm ${
                isSubmitting ? "opacity-75 cursor-not-allowed" : "hover:bg-teal-700"
              }`}
            >
              {isSubmitting ? "Saving..." : "Save Document"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 