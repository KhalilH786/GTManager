"use client";

import { useState, useEffect } from "react";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useAuth } from '@/lib/contexts/AuthContext';
import { 
  getStudentById, 
  getStudentDocuments,
  getIncidentsByStudent 
} from '@/lib/firebase/firebaseUtils';

// Define types for student documents
type StudentDocumentType = 'wellbeing' | 'academic_intervention' | 'parent_meeting';

const studentDocumentTypeLabels: Record<StudentDocumentType, string> = {
  'wellbeing': 'Student Wellbeing',
  'academic_intervention': 'Academic Interventions',
  'parent_meeting': 'Parent Meetings'
};

export default function StudentDetailPage({ params }: { params: { id: string } }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [student, setStudent] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<StudentDocumentType | "overview" | "incidents">("overview");
  const [documents, setDocuments] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Redirect if not admin
  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  // Fetch student data when component loads
  useEffect(() => {
    async function fetchData() {
      if (!params.id) return;
      
      try {
        setIsLoadingData(true);
        setError(null);
        
        // Get student data
        const studentData = await getStudentById(params.id);
        if (studentData) {
          setStudent(studentData);
        } else {
          setError("Student not found");
        }
      } catch (err) {
        console.error("Error fetching student:", err);
        setError("Failed to load student data");
      } finally {
        setIsLoadingData(false);
      }
    }
    
    if (user && user.role === "admin") {
      fetchData();
    }
  }, [params.id, user]);

  // Fetch documents and incidents when tab changes
  useEffect(() => {
    async function fetchTabData() {
      if (!student) return;
      
      try {
        if (activeTab !== "overview" && activeTab !== "incidents") {
          // Fetch documents for the selected tab
          const docs = await getStudentDocuments(student.id);
          // Filter by document type
          const filteredDocs = docs.filter(doc => doc.type === activeTab);
          // Sort by most recent first
          filteredDocs.sort((a, b) => {
            const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
            const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
            return dateB.getTime() - dateA.getTime();
          });
          setDocuments(filteredDocs);
        } else if (activeTab === "incidents") {
          // Fetch incidents
          const fetchedIncidents = await getIncidentsByStudent(student.id);
          setIncidents(fetchedIncidents);
        }
      } catch (err) {
        console.error(`Error fetching ${activeTab} data:`, err);
      }
    }
    
    fetchTabData();
  }, [student, activeTab]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (isLoadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading student data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
          <Link href="/admin/students" className="block mt-3 underline">Return to Students List</Link>
        </div>
      </div>
    );
  }
  
  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Not Found: </strong>
          <span className="block sm:inline">The requested student could not be found.</span>
          <Link href="/admin/students" className="block mt-3 underline">Return to Students List</Link>
        </div>
      </div>
    );
  }

  // Format the date for display
  const formatDate = (dateString: string | Date) => {
    const date = dateString instanceof Date ? dateString : new Date(dateString);
    return format(date, 'MMM d, yyyy h:mm a');
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

      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            {student.firstName} {student.lastName}
          </h1>
          <p className="text-gray-600">Student Profile</p>
        </div>
        <div className="space-x-2">
          <Link
            href={`/admin/students/${student.id}/edit`}
            className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md text-sm font-medium inline-flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
            </svg>
            Edit Student
          </Link>
          <Link
            href={`/admin/students/${student.id}/add-document`}
            className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md text-sm font-medium inline-flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            Add Document
          </Link>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex flex-wrap space-x-8">
          <button
            onClick={() => setActiveTab("overview")}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "overview"
                ? "border-teal-500 text-teal-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("wellbeing")}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "wellbeing"
                ? "border-teal-500 text-teal-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Student Wellbeing
          </button>
          <button
            onClick={() => setActiveTab("academic_intervention")}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "academic_intervention"
                ? "border-teal-500 text-teal-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Academic Interventions
          </button>
          <button
            onClick={() => setActiveTab("parent_meeting")}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "parent_meeting"
                ? "border-teal-500 text-teal-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Parent Meetings
          </button>
          <button
            onClick={() => setActiveTab("incidents")}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "incidents"
                ? "border-teal-500 text-teal-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Incidents
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" ? (
        // Student overview content
        <>
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200">
              {/* Basic Info */}
              <div className="p-6">
                <div className="flex items-center mb-6">
                  <div className="h-16 w-16 rounded-full bg-teal-100 flex items-center justify-center text-teal-800 text-xl font-bold mr-4">
                    {student.firstName && student.lastName 
                      ? `${student.firstName[0]}${student.lastName[0]}`
                      : '??'}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">
                      {student.firstName} {student.lastName}
                    </h2>
                    <p className="text-sm text-gray-600">Grade {student.grade} • {student.homeroom || 'N/A'}</p>
                    <p className="text-sm text-gray-600">ID: {student.id}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Email Address</h3>
                    <p className="mt-1">{student.email || 'Not provided'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Enrollment Date</h3>
                    <p className="mt-1">
                      {student.enrollmentDate 
                        ? format(new Date(student.enrollmentDate), 'MMMM d, yyyy')
                        : 'Not recorded'}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Academic Info */}
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Academic Information</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Current GPA</h3>
                    <div className="mt-1 flex items-center">
                      <span className="text-2xl font-bold">
                        {student.gpa !== undefined 
                          ? parseFloat(student.gpa).toFixed(1)
                          : 'N/A'}
                      </span>
                      <span className="ml-2 text-sm text-gray-500">/ 4.0</span>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Attendance Rate</h3>
                    <div className="mt-1 flex items-center">
                      <span className="text-2xl font-bold">
                        {student.attendance !== undefined 
                          ? parseFloat(student.attendance).toFixed(1) + '%'
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Homeroom</h3>
                    <p className="mt-1">{student.homeroom || 'Not assigned'}</p>
                  </div>
                </div>
              </div>
              
              {/* Guardian Info */}
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Guardian Information</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Guardian Name</h3>
                    <p className="mt-1">{student.guardian || 'Not provided'}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Guardian Email</h3>
                    <p className="mt-1">{student.guardianEmail || 'Not provided'}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Guardian Phone</h3>
                    <p className="mt-1">{student.guardianPhone || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Academic Progress Section */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Academic Progress</h2>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* GPA Chart (Placeholder) */}
                <div>
                  <h3 className="text-lg font-medium mb-2">GPA History</h3>
                  <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">GPA Chart Placeholder</p>
                  </div>
                </div>
                
                {/* Attendance Chart (Placeholder) */}
                <div>
                  <h3 className="text-lg font-medium mb-2">Attendance History</h3>
                  <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">Attendance Chart Placeholder</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : activeTab === "incidents" ? (
        // Incidents tab
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Incidents</h2>
            <Link
              href={`/admin/incidents/create?studentId=${student.id}`}
              className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-1 rounded-md text-sm font-medium inline-flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              Report New Incident
            </Link>
          </div>

          {incidents.length > 0 ? (
            <div className="space-y-6">
              {incidents.map((incident) => (
                <div key={incident.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium">{incident.title}</h3>
                      <span className={`inline-block mt-1 px-2 py-1 text-xs font-semibold rounded-full ${
                        incident.status === 'resolved' ? 'bg-green-100 text-green-800' :
                        incident.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {incident.status === 'resolved' ? 'Resolved' :
                         incident.status === 'in_progress' ? 'In Progress' :
                         'Pending'}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {incident.date ? formatDate(incident.date) : 'No date'}
                    </span>
                  </div>
                  
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Type</p>
                      <p>{incident.type || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Location</p>
                      <p>{incident.location || 'Not specified'}</p>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-500">Description</p>
                    <p className="mt-1 whitespace-pre-line">{incident.description || 'No description provided'}</p>
                  </div>
                  
                  <div className="mt-4 text-right">
                    <Link 
                      href={`/admin/incidents/${incident.id}`}
                      className="text-teal-600 hover:text-teal-800 text-sm"
                    >
                      View details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No incidents recorded for this student.</p>
              <Link
                href={`/admin/incidents/create?studentId=${student.id}`}
                className="mt-4 inline-flex items-center text-teal-600 hover:text-teal-800"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Report an Incident
              </Link>
            </div>
          )}
        </div>
      ) : (
        // Document listing for selected tab (wellbeing, academic_intervention, parent_meeting)
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">{studentDocumentTypeLabels[activeTab as StudentDocumentType]}</h2>
            <Link
              href={`/admin/students/${student.id}/add-document?type=${activeTab}`}
              className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-1 rounded-md text-sm font-medium inline-flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              Add New
            </Link>
          </div>

          {documents.length > 0 ? (
            <div className="space-y-6">
              {documents.map((doc) => (
                <div key={doc.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-medium">{doc.title}</h3>
                    <span className="text-sm text-gray-500">
                      {doc.createdAt ? formatDate(doc.createdAt) : 'No date'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Reported by: {doc.createdByName || doc.createdBy || 'Unknown'}
                  </p>
                  
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
                    <p className="mt-2 whitespace-pre-wrap">{doc.content || 'No content provided'}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No {studentDocumentTypeLabels[activeTab as StudentDocumentType].toLowerCase()} found for this student.</p>
              <Link
                href={`/admin/students/${student.id}/add-document?type=${activeTab}`}
                className="mt-4 inline-flex items-center text-teal-600 hover:text-teal-800"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Add {studentDocumentTypeLabels[activeTab as StudentDocumentType]}
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 