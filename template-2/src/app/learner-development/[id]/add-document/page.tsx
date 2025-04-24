"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  students, 
  StudentDocumentType, 
  studentDocumentTypeLabels,
  addStudentDocument,
  teachers
} from "@/lib/data";
import { useAuth } from "@/lib/contexts/AuthContext";

export default function AddStudentDocumentPage({ params }: { params: { id: string } }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const studentId = params.id;
  
  // Form state
  const [documentType, setDocumentType] = useState<StudentDocumentType>("wellbeing");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  // Wellbeing fields
  const [observation, setObservation] = useState("");
  const [reflections, setReflections] = useState("");
  // Academic intervention fields
  const [subjects, setSubjects] = useState("");
  const [academicConcerns, setAcademicConcerns] = useState("");
  const [proposedInterventions, setProposedInterventions] = useState("");
  // Parent meeting fields
  const [staffAttendees, setStaffAttendees] = useState<string[]>([]);
  const [parentGuardians, setParentGuardians] = useState("");
  const [concerns, setConcerns] = useState("");
  const [parentProposedInterventions, setParentProposedInterventions] = useState("");
  const [agreedNextSteps, setAgreedNextSteps] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    title?: string;
    content?: string;
    observation?: string;
    reflections?: string;
    subjects?: string;
    academicConcerns?: string;
    proposedInterventions?: string;
    staffAttendees?: string;
    parentGuardians?: string;
    concerns?: string;
    parentProposedInterventions?: string;
    agreedNextSteps?: string;
  }>({});
  
  // Find the student
  const student = students.find(s => s.id === studentId);
  
  // Redirect if not authorized
  useEffect(() => {
    if (!isLoading && (!user || user.role !== "teacher")) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const newErrors: {
      title?: string; 
      content?: string;
      observation?: string;
      reflections?: string;
      subjects?: string;
      academicConcerns?: string;
      proposedInterventions?: string;
      staffAttendees?: string;
      parentGuardians?: string;
      concerns?: string;
      parentProposedInterventions?: string;
      agreedNextSteps?: string;
    } = {};
    
    if (!title.trim()) {
      newErrors.title = "Title is required";
    }
    
    if (documentType === "wellbeing") {
      if (!observation.trim()) {
        newErrors.observation = "Observation is required for wellbeing entries";
      }
      if (!reflections.trim()) {
        newErrors.reflections = "Reflections are required for wellbeing entries";
      }
    } else if (documentType === "academic_intervention") {
      if (!subjects.trim()) {
        newErrors.subjects = "Subject(s) is required for academic interventions";
      }
      if (!academicConcerns.trim()) {
        newErrors.academicConcerns = "Academic concerns are required for academic interventions";
      }
      if (!proposedInterventions.trim()) {
        newErrors.proposedInterventions = "Proposed interventions are required for academic interventions";
      }
    } else if (documentType === "parent_meeting") {
      if (staffAttendees.length === 0) {
        newErrors.staffAttendees = "At least one staff attendee is required";
      }
      if (!parentGuardians.trim()) {
        newErrors.parentGuardians = "Parent/guardians is required";
      }
      if (!concerns.trim()) {
        newErrors.concerns = "Concerns is required";
      }
      if (!parentProposedInterventions.trim()) {
        newErrors.parentProposedInterventions = "Proposed interventions is required";
      }
      if (!agreedNextSteps.trim()) {
        newErrors.agreedNextSteps = "Agreed next steps is required";
      }
    } else if (!content.trim()) {
      newErrors.content = "Content is required";
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create document content based on type
      let finalContent = content;
      
      // Add the document with the appropriate additional fields
      if (documentType === "wellbeing") {
        addStudentDocument(
          studentId,
          documentType,
          title,
          finalContent,
          user.id,
          { observation, reflections }
        );
      } else if (documentType === "academic_intervention") {
        addStudentDocument(
          studentId,
          documentType,
          title,
          finalContent,
          user.id,
          { subjects, academicConcerns, proposedInterventions }
        );
      } else if (documentType === "parent_meeting") {
        addStudentDocument(
          studentId,
          documentType,
          title,
          finalContent,
          user.id,
          { 
            staffAttendees, 
            parentGuardians, 
            concerns, 
            proposedInterventions: parentProposedInterventions,
            agreedNextSteps 
          }
        );
      } else {
        addStudentDocument(
          studentId,
          documentType,
          title,
          finalContent,
          user.id
        );
      }
      
      // Redirect back to student detail page
      router.push(`/learner-development/${studentId}`);
    } catch (error) {
      console.error("Error adding document:", error);
      setIsSubmitting(false);
    }
  };

  // Toggle staff selection for attendees
  const toggleStaffSelection = (teacherId: string) => {
    if (staffAttendees.includes(teacherId)) {
      setStaffAttendees(staffAttendees.filter(id => id !== teacherId));
    } else {
      setStaffAttendees([...staffAttendees, teacherId]);
    }
  };

  const documentTypes: StudentDocumentType[] = ["wellbeing", "academic_intervention", "parent_meeting"];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link 
          href={`/learner-development/${studentId}`} 
          className="text-blue-600 hover:text-blue-800 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="mr-1">
            <path fillRule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
          </svg>
          Back to Student
        </Link>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Add Document for {student.name}</h1>
          <p className="text-gray-600">Grade {student.grade} • {student.homeroom}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="document-type" className="block text-sm font-medium text-gray-700 mb-1">
                Document Type
              </label>
              <select
                id="document-type"
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value as StudentDocumentType)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                {documentTypes.map((type) => (
                  <option key={type} value={type}>
                    {studentDocumentTypeLabels[type]}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="mb-4">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`block w-full rounded-md shadow-sm sm:text-sm ${
                  errors.title ? "border-red-300 focus:border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                }`}
                placeholder="Enter document title"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>
            
            {documentType === "wellbeing" ? (
              <>
                <div className="mb-4">
                  <label htmlFor="observation" className="block text-sm font-medium text-gray-700 mb-1">
                    Observation <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="observation"
                    value={observation}
                    onChange={(e) => setObservation(e.target.value)}
                    rows={3}
                    className={`block w-full rounded-md shadow-sm sm:text-sm ${
                      errors.observation ? "border-red-300 focus:border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    }`}
                    placeholder="Enter your observations of the student"
                  />
                  {errors.observation && (
                    <p className="mt-1 text-sm text-red-600">{errors.observation}</p>
                  )}
                </div>
                
                <div className="mb-6">
                  <label htmlFor="reflections" className="block text-sm font-medium text-gray-700 mb-1">
                    Reflections <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="reflections"
                    value={reflections}
                    onChange={(e) => setReflections(e.target.value)}
                    rows={3}
                    className={`block w-full rounded-md shadow-sm sm:text-sm ${
                      errors.reflections ? "border-red-300 focus:border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    }`}
                    placeholder="Enter your reflections and recommendations"
                  />
                  {errors.reflections && (
                    <p className="mt-1 text-sm text-red-600">{errors.reflections}</p>
                  )}
                </div>
                
                <div className="mb-6">
                  <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Notes
                  </label>
                  <textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={2}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="Enter any additional notes (optional)"
                  />
                </div>
              </>
            ) : documentType === "academic_intervention" ? (
              <>
                <div className="mb-4">
                  <label htmlFor="subjects" className="block text-sm font-medium text-gray-700 mb-1">
                    Subject(s) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="subjects"
                    value={subjects}
                    onChange={(e) => setSubjects(e.target.value)}
                    className={`block w-full rounded-md shadow-sm sm:text-sm ${
                      errors.subjects ? "border-red-300 focus:border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    }`}
                    placeholder="E.g., Math, Science, English"
                  />
                  {errors.subjects && (
                    <p className="mt-1 text-sm text-red-600">{errors.subjects}</p>
                  )}
                </div>
                
                <div className="mb-4">
                  <label htmlFor="academicConcerns" className="block text-sm font-medium text-gray-700 mb-1">
                    Academic concerns <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="academicConcerns"
                    value={academicConcerns}
                    onChange={(e) => setAcademicConcerns(e.target.value)}
                    rows={3}
                    className={`block w-full rounded-md shadow-sm sm:text-sm ${
                      errors.academicConcerns ? "border-red-300 focus:border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    }`}
                    placeholder="Describe the academic concerns or challenges"
                  />
                  {errors.academicConcerns && (
                    <p className="mt-1 text-sm text-red-600">{errors.academicConcerns}</p>
                  )}
                </div>
                
                <div className="mb-6">
                  <label htmlFor="proposedInterventions" className="block text-sm font-medium text-gray-700 mb-1">
                    Proposed interventions <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="proposedInterventions"
                    value={proposedInterventions}
                    onChange={(e) => setProposedInterventions(e.target.value)}
                    rows={3}
                    className={`block w-full rounded-md shadow-sm sm:text-sm ${
                      errors.proposedInterventions ? "border-red-300 focus:border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    }`}
                    placeholder="Describe the interventions to be implemented"
                  />
                  {errors.proposedInterventions && (
                    <p className="mt-1 text-sm text-red-600">{errors.proposedInterventions}</p>
                  )}
                </div>
              </>
            ) : documentType === "parent_meeting" ? (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Staff attendees <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-2 space-y-2">
                    {teachers.map((teacher) => (
                      <div key={teacher.id} className="flex items-center">
                        <input
                          id={`teacher-${teacher.id}`}
                          type="checkbox"
                          checked={staffAttendees.includes(teacher.id)}
                          onChange={() => toggleStaffSelection(teacher.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`teacher-${teacher.id}`} className="ml-2 text-sm text-gray-700">
                          {teacher.name} ({teacher.role})
                        </label>
                      </div>
                    ))}
                  </div>
                  {errors.staffAttendees && (
                    <p className="mt-1 text-sm text-red-600">{errors.staffAttendees}</p>
                  )}
                </div>
                
                <div className="mb-4">
                  <label htmlFor="parentGuardians" className="block text-sm font-medium text-gray-700 mb-1">
                    Parent/guardians <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="parentGuardians"
                    value={parentGuardians}
                    onChange={(e) => setParentGuardians(e.target.value)}
                    className={`block w-full rounded-md shadow-sm sm:text-sm ${
                      errors.parentGuardians ? "border-red-300 focus:border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    }`}
                    placeholder="Names of parents or guardians present"
                  />
                  {errors.parentGuardians && (
                    <p className="mt-1 text-sm text-red-600">{errors.parentGuardians}</p>
                  )}
                </div>
                
                <div className="mb-4">
                  <label htmlFor="concerns" className="block text-sm font-medium text-gray-700 mb-1">
                    Concerns <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="concerns"
                    value={concerns}
                    onChange={(e) => setConcerns(e.target.value)}
                    rows={3}
                    className={`block w-full rounded-md shadow-sm sm:text-sm ${
                      errors.concerns ? "border-red-300 focus:border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    }`}
                    placeholder="Describe concerns discussed in the meeting"
                  />
                  {errors.concerns && (
                    <p className="mt-1 text-sm text-red-600">{errors.concerns}</p>
                  )}
                </div>
                
                <div className="mb-4">
                  <label htmlFor="parentProposedInterventions" className="block text-sm font-medium text-gray-700 mb-1">
                    Proposed interventions <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="parentProposedInterventions"
                    value={parentProposedInterventions}
                    onChange={(e) => setParentProposedInterventions(e.target.value)}
                    rows={3}
                    className={`block w-full rounded-md shadow-sm sm:text-sm ${
                      errors.parentProposedInterventions ? "border-red-300 focus:border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    }`}
                    placeholder="Describe interventions proposed during the meeting"
                  />
                  {errors.parentProposedInterventions && (
                    <p className="mt-1 text-sm text-red-600">{errors.parentProposedInterventions}</p>
                  )}
                </div>
                
                <div className="mb-4">
                  <label htmlFor="agreedNextSteps" className="block text-sm font-medium text-gray-700 mb-1">
                    Agreed next steps <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="agreedNextSteps"
                    value={agreedNextSteps}
                    onChange={(e) => setAgreedNextSteps(e.target.value)}
                    rows={3}
                    className={`block w-full rounded-md shadow-sm sm:text-sm ${
                      errors.agreedNextSteps ? "border-red-300 focus:border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    }`}
                    placeholder="Document the action plan and next steps agreed upon"
                  />
                  {errors.agreedNextSteps && (
                    <p className="mt-1 text-sm text-red-600">{errors.agreedNextSteps}</p>
                  )}
                </div>
                
                <div className="mb-4">
                  <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Notes
                  </label>
                  <textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={2}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="Any additional notes (optional)"
                  />
                </div>
              </>
            ) : (
              <div className="mb-6">
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                  Content <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={6}
                  className={`block w-full rounded-md shadow-sm sm:text-sm ${
                    errors.content ? "border-red-300 focus:border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  }`}
                  placeholder="Enter document content"
                />
                {errors.content && (
                  <p className="mt-1 text-sm text-red-600">{errors.content}</p>
                )}
              </div>
            )}
            
            <div className="flex justify-end">
              <Link
                href={`/learner-development/${studentId}`}
                className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2 rounded-md text-sm font-medium mr-2"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Save Document"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 