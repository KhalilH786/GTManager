"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  students, 
  getStudentDocuments, 
  StudentDocumentType, 
  studentDocumentTypeLabels,
  StudentDocument,
  teachers
} from "@/lib/data";
import { useAuth } from "@/lib/contexts/AuthContext";

export default function StudentDevelopmentDetailPage({ params }: { params: { id: string } }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<StudentDocumentType | "all">("all");
  const [documents, setDocuments] = useState<StudentDocument[]>([]);
  const studentId = params.id;
  
  // Find the student
  const student = students.find(s => s.id === studentId);
  
  // Redirect if not authorized
  useEffect(() => {
    if (!isLoading && (!user || user.role !== "teacher")) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  // Fetch documents based on selected tab
  useEffect(() => {
    if (activeTab === "all") {
      setDocuments(getStudentDocuments(studentId));
    } else {
      const filteredDocs = getStudentDocuments(studentId).filter(doc => doc.type === activeTab);
      setDocuments(filteredDocs);
    }
  }, [activeTab, studentId]);

  // Get teacher name from ID
  const getTeacherName = (teacherId: string) => {
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher ? teacher.name : "Unknown Teacher";
  };

  // Format date nicely
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800">Student Not Found</h2>
          <p className="mt-2 text-gray-600">The student you're looking for doesn't exist.</p>
          <Link href="/learner-development" className="mt-4 inline-block text-blue-600 hover:text-blue-800">
            Back to All Students
          </Link>
        </div>
      </div>
    );
  }

  // Get array of document types for tabs
  const documentTypes: StudentDocumentType[] = ["wellbeing", "academic_intervention", "parent_meeting"];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/learner-development" className="text-blue-600 hover:text-blue-800 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="mr-1">
            <path fillRule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
          </svg>
          Back to Students
        </Link>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{student.name}</h1>
          <p className="text-gray-600">Grade {student.grade} • {student.homeroom}</p>
        </div>
        <Link
          href={`/learner-development/${student.id}/add-document`}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          Add Document
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Student Information</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
          <div>
            <p className="text-sm font-medium text-gray-500">Email</p>
            <p className="mt-1">{student.email}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Guardian</p>
            <p className="mt-1">{student.guardian}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Guardian Contact</p>
            <p className="mt-1">{student.guardianPhone}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">GPA</p>
            <p className="mt-1">{student.gpa.toFixed(1)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Attendance</p>
            <p className="mt-1">{student.attendance.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Development Records</h2>
        </div>
        
        <div className="border-b">
          <nav className="flex flex-wrap">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === "all"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-blue-600"
              }`}
            >
              All Documents
            </button>
            {documentTypes.map((type) => (
              <button
                key={type}
                onClick={() => setActiveTab(type)}
                className={`px-4 py-3 text-sm font-medium ${
                  activeTab === type
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-blue-600"
                }`}
              >
                {studentDocumentTypeLabels[type]}
              </button>
            ))}
          </nav>
        </div>
        
        <div className="p-6">
          {documents.length > 0 ? (
            <div className="divide-y">
              {documents.map((doc) => (
                <div key={doc.id} className="py-6 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-medium">{doc.title}</h3>
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          {studentDocumentTypeLabels[doc.type]}
                        </span>
                        <span className="mx-2">•</span>
                        <span>{formatDate(doc.createdAt)}</span>
                        <span className="mx-2">•</span>
                        <span>By {getTeacherName(doc.createdBy)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {doc.type === "wellbeing" ? (
                    <div className="mt-4 space-y-4">
                      {doc.observation && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700">Observation</h4>
                          <p className="mt-1 text-gray-700 whitespace-pre-line">{doc.observation}</p>
                        </div>
                      )}
                      
                      {doc.reflections && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700">Reflections</h4>
                          <p className="mt-1 text-gray-700 whitespace-pre-line">{doc.reflections}</p>
                        </div>
                      )}
                      
                      {doc.content && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700">Additional Notes</h4>
                          <p className="mt-1 text-gray-700 whitespace-pre-line">{doc.content}</p>
                        </div>
                      )}
                    </div>
                  ) : doc.type === "academic_intervention" ? (
                    <div className="mt-4 space-y-4">
                      {doc.subjects && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700">Subject(s)</h4>
                          <p className="mt-1 text-gray-700 whitespace-pre-line">{doc.subjects}</p>
                        </div>
                      )}
                      
                      {doc.academicConcerns && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700">Academic concerns</h4>
                          <p className="mt-1 text-gray-700 whitespace-pre-line">{doc.academicConcerns}</p>
                        </div>
                      )}
                      
                      {doc.proposedInterventions && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700">Proposed interventions</h4>
                          <p className="mt-1 text-gray-700 whitespace-pre-line">{doc.proposedInterventions}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-3 text-gray-700 whitespace-pre-line">
                      {doc.content}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500">No documents found for this student</p>
              <Link
                href={`/learner-development/${student.id}/add-document`}
                className="mt-2 inline-block text-blue-600 hover:text-blue-800"
              >
                Add the first document
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 