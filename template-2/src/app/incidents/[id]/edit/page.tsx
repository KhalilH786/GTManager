"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { 
  getIncidentById, 
  getStudentById,
  updateIncident,
  students, 
  incidentTypeLabels, 
  teachers,
  getTeacherById,
  type Incident,
  type IncidentType,
  type IncidentSeverity,
  getActiveCampusLocations,
  type CampusLocation
} from "@/lib/data";
import { useAuth } from "@/lib/contexts/AuthContext";

export default function EditIncidentPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [title, setTitle] = useState("");
  const [type, setType] = useState<IncidentType>("behavior");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [initiators, setInitiators] = useState<string[]>([]);
  const [affectedStudents, setAffectedStudents] = useState<string[]>([]);
  const [witnesses, setWitnesses] = useState<string[]>([]);
  const [involvedTeachers, setInvolvedTeachers] = useState<string[]>([]);
  const [status, setStatus] = useState<"open" | "under_investigation" | "resolved">("open");
  const [resolution, setResolution] = useState("");
  const [parentNotified, setParentNotified] = useState(false);
  const [requiresParentNotification, setRequiresParentNotification] = useState(false);
  const [requiresIntervention, setRequiresIntervention] = useState(false);
  const [intervened, setIntervened] = useState(false);
  const [postIncidentIntervention, setPostIncidentIntervention] = useState("");

  // Campus locations from data model
  const [campusLocations, setCampusLocations] = useState<CampusLocation[]>([]);

  // Load campus locations on component mount
  useEffect(() => {
    const locations = getActiveCampusLocations();
    setCampusLocations(locations);
  }, []);

  // Student search state
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<typeof students>([]);
  const [activeCategory, setActiveCategory] = useState<"initiator" | "affectedStudent" | "witness" | "teacher">("initiator");
  
  // Teacher search state
  const [teacherSearchTerm, setTeacherSearchTerm] = useState("");
  const [teacherSearchResults, setTeacherSearchResults] = useState<typeof teachers>([]);
  const [showTeacherSearch, setShowTeacherSearch] = useState(false);

  // Handle student search
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (term.trim() === "") {
      setSearchResults([]);
      return;
    }

    const results = students.filter(student => 
      student.name.toLowerCase().includes(term.toLowerCase()) ||
      `${student.grade}-${student.homeroom}`.toLowerCase().includes(term.toLowerCase())
    );
    setSearchResults(results);
  };

  // Add student to selected category
  const addStudentToCategory = (studentId: string) => {
    if (activeCategory === "initiator") {
      if (!initiators.includes(studentId)) {
        setInitiators([...initiators, studentId]);
      }
    } else if (activeCategory === "affectedStudent") {
      if (!affectedStudents.includes(studentId)) {
        setAffectedStudents([...affectedStudents, studentId]);
      }
    } else if (activeCategory === "witness") {
      if (!witnesses.includes(studentId)) {
        setWitnesses([...witnesses, studentId]);
      }
    }
    setSearchTerm("");
    setSearchResults([]);
  };

  // Remove student from category
  const removeStudentFromCategory = (studentId: string, category: "initiator" | "affectedStudent" | "witness") => {
    if (category === "initiator") {
      setInitiators(initiators.filter(id => id !== studentId));
    } else if (category === "affectedStudent") {
      setAffectedStudents(affectedStudents.filter(id => id !== studentId));
    } else if (category === "witness") {
      setWitnesses(witnesses.filter(id => id !== studentId));
    }
  };

  // Switch the active category for selection
  const switchCategory = (category: "initiator" | "affectedStudent" | "witness" | "teacher") => {
    setActiveCategory(category);
    setSearchTerm("");
    setSearchResults([]);
    
    if (category === "teacher") {
      setShowTeacherSearch(true);
    } else {
      setShowTeacherSearch(false);
    }
  };

  // Render selected students for a category
  const renderSelectedStudents = (studentIds: string[], category: "initiator" | "affectedStudent" | "witness") => {
    if (studentIds.length === 0) {
      return (
        <p className="text-gray-500 italic text-sm">No students selected</p>
      );
    }

    return (
      <ul className="mt-2 space-y-1">
        {studentIds.map(id => {
          const student = getStudentById(id);
          return student ? (
            <li key={id} className="flex items-center justify-between py-1 px-2 bg-gray-100 rounded-md">
              <span className="text-sm">{student.name} ({student.grade}-{student.homeroom})</span>
              <button
                type="button"
                onClick={() => removeStudentFromCategory(id, category)}
                className="text-red-500 hover:text-red-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </li>
          ) : null;
        })}
      </ul>
    );
  };

  // Handle teacher search
  const handleTeacherSearch = (term: string) => {
    setTeacherSearchTerm(term);
    if (term.trim() === "") {
      setTeacherSearchResults([]);
      return;
    }

    const results = teachers.filter(teacher => 
      teacher.name.toLowerCase().includes(term.toLowerCase()) ||
      teacher.email.toLowerCase().includes(term.toLowerCase()) ||
      teacher.role.toLowerCase().includes(term.toLowerCase())
    );
    setTeacherSearchResults(results);
  };

  // Add teacher to involved teachers
  const addTeacher = (teacherId: string) => {
    if (!involvedTeachers.includes(teacherId)) {
      setInvolvedTeachers([...involvedTeachers, teacherId]);
    }
    setTeacherSearchTerm("");
    setTeacherSearchResults([]);
  };

  // Remove teacher from involved teachers
  const removeTeacher = (teacherId: string) => {
    setInvolvedTeachers(involvedTeachers.filter(id => id !== teacherId));
  };

  // Render selected teachers
  const renderSelectedTeachers = () => {
    if (involvedTeachers.length === 0) {
      return (
        <p className="text-gray-500 italic text-sm">No teachers selected</p>
      );
    }

    return (
      <ul className="mt-2 space-y-1">
        {involvedTeachers.map(id => {
          const teacher = getTeacherById(id);
          return teacher ? (
            <li key={id} className="flex items-center justify-between py-1 px-2 bg-gray-100 rounded-md">
              <span className="text-sm">{teacher.name} ({teacher.role})</span>
              <button
                type="button"
                onClick={() => removeTeacher(id)}
                className="text-red-500 hover:text-red-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </li>
          ) : null;
        })}
      </ul>
    );
  };

  // Load incident data
  useEffect(() => {
    if (!user) return;
    
    try {
      const incident = getIncidentById(params.id as string);
      if (!incident) {
        router.push("/incidents");
        return;
      }
      
      setIncident(incident);
      setTitle(incident.title);
      setType(incident.type);
      setDescription(incident.description);
      setDate(incident.date ? new Date(incident.date).toISOString().split("T")[0] : "");
      setLocation(incident.location);
      setInitiators(incident.initiators || []);
      setAffectedStudents(incident.affectedStudents || []);
      setWitnesses(incident.witnesses || []);
      setInvolvedTeachers(incident.involvedTeachers || []);
      setStatus(incident.status || "open");
      setResolution(incident.resolution || "");
      setParentNotified(incident.parentNotified || false);
      setRequiresParentNotification(incident.requiresParentNotification || false);
      setRequiresIntervention(incident.requiresIntervention || false);
      setIntervened(incident.intervened || false);
      setPostIncidentIntervention(incident.postIncidentIntervention || "");
      setLoading(false);
    } catch (err) {
      console.error("Error loading incident:", err);
      router.push("/incidents");
    }
  }, [params.id, router, user]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      // Validation
      if (!title) {
        throw new Error("Title is required");
      }
      if (!description) {
        throw new Error("Description is required");
      }
      if (!location) {
        throw new Error("Location is required");
      }
      if (!date) {
        throw new Error("Date is required");
      }
      if (initiators.length === 0 && affectedStudents.length === 0) {
        throw new Error("At least one initiator or affected student must be selected");
      }
      
      if (status === "resolved" && !resolution) {
        throw new Error("Resolution is required when the status is set to Resolved");
      }

      // Create incident date from date (time set to midnight)
      const incidentDateTime = new Date(`${date}T00:00:00`);

      // Update the incident
      const updatedIncident = {
        title,
        type,
        description,
        date: incidentDateTime,
        location,
        initiators,
        affectedStudents,
        witnesses: witnesses.length > 0 ? witnesses : undefined,
        status,
        resolution: resolution ? resolution.trim() || undefined : undefined,
        parentNotified,
        requiresParentNotification,
        requiresIntervention,
        intervened,
        postIncidentIntervention: postIncidentIntervention ? postIncidentIntervention.trim() || undefined : undefined,
        involvedTeachers: involvedTeachers.length > 0 ? involvedTeachers : undefined
      };
      
      updateIncident(params.id as string, updatedIncident as Partial<Omit<Incident, "id" | "createdAt">>);
      
      // Redirect to incident details
      router.push(`/incidents/${params.id as string}`);
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 p-4 rounded-md mb-4">
          <p className="text-red-700">You must be logged in to edit incidents</p>
        </div>
        <Link href="/login" className="text-blue-600 hover:underline">
          Go to Login
        </Link>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
        </div>
      </div>
    );
  }

  // Show not found state
  if (!incident) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 p-4 rounded-md mb-4">
          <p className="text-red-700">Incident not found</p>
        </div>
        <Link href="/incidents" className="text-blue-600 hover:underline">
          Back to Incidents
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <Link href={`/incidents/${incident!.id}`} className="text-blue-600 hover:text-blue-800 text-sm flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          Back to Incident Details
        </Link>
      </div>
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold">Edit Incident</h1>
          <p className="text-gray-600 mt-1">Modify incident details. Fields marked with * are required.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-6 p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Incident Title *
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Brief title of the incident"
                required
              />
            </div>
            
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                Incident Type *
              </label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value as IncidentType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              >
                {Object.entries(incidentTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              rows={4}
              placeholder="Detailed description of what happened"
              required
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <input
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Location *
              </label>
              <select
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              >
                {campusLocations.length > 0 ? (
                  campusLocations.map((campus) => (
                    <option key={campus.id} value={campus.name}>
                      {campus.name}
                    </option>
                  ))
                ) : (
                  <option value="">No campus locations available</option>
                )}
              </select>
              {campusLocations.length === 0 && (
                <p className="mt-1 text-sm text-red-500">
                  No campus locations configured. Please contact an administrator.
                </p>
              )}
              <div className="mt-2 flex flex-wrap gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="requiresParentNotification"
                    checked={requiresParentNotification}
                    onChange={(e) => setRequiresParentNotification(e.target.checked)}
                    className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                  />
                  <label htmlFor="requiresParentNotification" className="ml-2 text-sm text-gray-700">
                    Requires parent notification
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="requiresIntervention"
                    checked={requiresIntervention}
                    onChange={(e) => setRequiresIntervention(e.target.checked)}
                    className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                  />
                  <label htmlFor="requiresIntervention" className="ml-2 text-sm text-gray-700">
                    Requires intervention
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Parties Involved *
            </label>
            <div className="p-4 border border-gray-300 rounded-md bg-gray-50">
              {/* Category selector tabs */}
              <div className="flex mb-4 border-b">
                <button
                  type="button"
                  onClick={() => switchCategory("initiator")}
                  className={`py-2 px-4 text-sm font-medium ${
                    activeCategory === "initiator" 
                      ? "border-b-2 border-teal-500 text-teal-600" 
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Initiators
                </button>
                <button
                  type="button"
                  onClick={() => switchCategory("affectedStudent")}
                  className={`py-2 px-4 text-sm font-medium ${
                    activeCategory === "affectedStudent" 
                      ? "border-b-2 border-teal-500 text-teal-600" 
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Affected Students
                </button>
                <button
                  type="button"
                  onClick={() => switchCategory("witness")}
                  className={`py-2 px-4 text-sm font-medium ${
                    activeCategory === "witness" 
                      ? "border-b-2 border-teal-500 text-teal-600" 
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Witnesses
                </button>
                <button
                  type="button"
                  onClick={() => switchCategory("teacher")}
                  className={`py-2 px-4 text-sm font-medium ${
                    activeCategory === "teacher" 
                      ? "border-b-2 border-teal-500 text-teal-600" 
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Teachers
                </button>
              </div>
              
              {/* Search and result display */}
              {activeCategory !== "teacher" ? (
                <div className="mb-4">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => handleSearch(e.target.value)}
                      placeholder={`Search ${
                        activeCategory === "initiator" 
                          ? "initiators" 
                          : activeCategory === "affectedStudent" 
                            ? "affected students" 
                            : "witnesses"
                      }...`}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    
                    {searchResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        <ul>
                          {searchResults.map(student => (
                            <li 
                              key={student.id} 
                              className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between"
                              onClick={() => addStudentToCategory(student.id)}
                            >
                              <span>{student.name} ({student.grade}-{student.homeroom})</span>
                              <button
                                type="button"
                                className="text-teal-600 hover:text-teal-800"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                                </svg>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mb-4">
                  <div className="relative">
                    <input
                      type="text"
                      value={teacherSearchTerm}
                      onChange={(e) => handleTeacherSearch(e.target.value)}
                      placeholder="Search teachers..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    
                    {teacherSearchResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        <ul>
                          {teacherSearchResults.map(teacher => (
                            <li 
                              key={teacher.id} 
                              className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between"
                              onClick={() => addTeacher(teacher.id)}
                            >
                              <span>{teacher.name} ({teacher.role})</span>
                              <button
                                type="button"
                                className="text-teal-600 hover:text-teal-800"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                                </svg>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Display of selected people for the active category */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  {activeCategory === "initiator" 
                    ? "Selected Initiators" 
                    : activeCategory === "affectedStudent" 
                      ? "Selected Affected Students" 
                      : activeCategory === "witness"
                        ? "Selected Witnesses"
                        : "Selected Teachers"}
                </h3>
                {activeCategory === "initiator" && renderSelectedStudents(initiators, "initiator")}
                {activeCategory === "affectedStudent" && renderSelectedStudents(affectedStudents, "affectedStudent")}
                {activeCategory === "witness" && renderSelectedStudents(witnesses, "witness")}
                {activeCategory === "teacher" && renderSelectedTeachers()}
              </div>
              
              {/* Summary counts */}
              <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between text-sm text-gray-600">
                <span>Initiators: {initiators.length}</span>
                <span>Affected Students: {affectedStudents.length}</span>
                <span>Witnesses: {witnesses.length}</span>
                <span>Teachers: {involvedTeachers.length}</span>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <label htmlFor="postIncidentIntervention" className="block text-sm font-medium text-gray-700 mb-2">
              Post-Incident Intervention
            </label>
            <textarea
              id="postIncidentIntervention"
              value={postIncidentIntervention}
              onChange={(e) => setPostIncidentIntervention(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              rows={3}
              placeholder="Describe any interventions needed after this incident"
            />
          </div>
          
          <div className="mb-6">
            <div className="p-4 border border-gray-300 rounded-md bg-gray-50">
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="parentNotified"
                    checked={parentNotified}
                    onChange={(e) => setParentNotified(e.target.checked)}
                    className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                  />
                  <label htmlFor="parentNotified" className="ml-2 text-sm text-gray-700">
                    Parents notified
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="intervened"
                    checked={intervened}
                    onChange={(e) => setIntervened(e.target.checked)}
                    className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                  />
                  <label htmlFor="intervened" className="ml-2 text-sm text-gray-700">
                    Intervened
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Link
              href={`/incidents/${incident!.id}`}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 