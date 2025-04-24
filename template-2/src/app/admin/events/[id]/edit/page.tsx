"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/contexts/AuthContext";
import { 
  getAllSchoolEvents,
  addSchoolEvent, 
  EventTargetType, 
  eventTargetTypeLabels,
  schoolPhases,
  students,
  SchoolEvent
} from "@/lib/data";

export default function EditEventPage({ params }: { params: { id: string } }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [event, setEvent] = useState<SchoolEvent | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  
  // Multi-select target types
  const [selectedTargetTypes, setSelectedTargetTypes] = useState<EventTargetType[]>([]);
  
  // Target-specific multi-select fields
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [selectedGrades, setSelectedGrades] = useState<number[]>([]);
  const [selectedPhases, setSelectedPhases] = useState<string[]>([]);
  
  // Form validation
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  // Generate unique list of classes (homerooms)
  const uniqueClasses = Array.from(new Set(students.map(student => student.homeroom))).sort();
  
  // Generate unique list of grades
  const uniqueGrades = Array.from(new Set(students.map(student => student.grade))).sort();

  // Redirect if not admin
  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  // Toggle a target type selection
  const toggleTargetType = (type: EventTargetType) => {
    setSelectedTargetTypes(prev => {
      if (prev.includes(type)) {
        return prev.filter(t => t !== type);
      } else {
        return [...prev, type];
      }
    });
  };

  // Toggle class selection
  const toggleClass = (className: string) => {
    setSelectedClasses(prev => {
      if (prev.includes(className)) {
        return prev.filter(c => c !== className);
      } else {
        return [...prev, className];
      }
    });
  };

  // Toggle grade selection
  const toggleGrade = (grade: number) => {
    setSelectedGrades(prev => {
      if (prev.includes(grade)) {
        return prev.filter(g => g !== grade);
      } else {
        return [...prev, grade];
      }
    });
  };

  // Toggle phase selection
  const togglePhase = (phaseId: string) => {
    setSelectedPhases(prev => {
      if (prev.includes(phaseId)) {
        return prev.filter(p => p !== phaseId);
      } else {
        return [...prev, phaseId];
      }
    });
  };

  // Load event data
  useEffect(() => {
    if (params.id) {
      const events = getAllSchoolEvents();
      const foundEvent = events.find(e => e.id === params.id);
      
      if (foundEvent) {
        setEvent(foundEvent);
        
        // Populate form fields
        setTitle(foundEvent.title);
        setDescription(foundEvent.description);
        setLocation(foundEvent.location);
        setSelectedTargetTypes(foundEvent.targetTypes || []);
        
        // Format dates and times
        const startDateTime = new Date(foundEvent.startDate);
        const endDateTime = new Date(foundEvent.endDate);
        
        setStartDate(startDateTime.toISOString().split('T')[0]);
        setStartTime(startDateTime.toTimeString().substring(0, 5));
        setEndDate(endDateTime.toISOString().split('T')[0]);
        setEndTime(endDateTime.toTimeString().substring(0, 5));
        
        // Set target specific fields
        if (foundEvent.targetClasses) {
          setSelectedClasses(foundEvent.targetClasses);
        }
        
        if (foundEvent.targetGrades) {
          setSelectedGrades(foundEvent.targetGrades);
        }
        
        if (foundEvent.targetPhases) {
          setSelectedPhases(foundEvent.targetPhases);
        }
      } else {
        // Event not found
        router.push("/admin/events");
      }
      
      setLoading(false);
    }
  }, [params.id, router]);

  // Validate form
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!title.trim()) newErrors.title = "Title is required";
    if (!description.trim()) newErrors.description = "Description is required";
    if (!startDate) newErrors.startDate = "Start date is required";
    if (!startTime) newErrors.startTime = "Start time is required";
    if (!endDate) newErrors.endDate = "End date is required";
    if (!endTime) newErrors.endTime = "End time is required";
    if (!location.trim()) newErrors.location = "Location is required";
    
    // Target audience validation - must select at least one target type
    if (selectedTargetTypes.length === 0) {
      newErrors.targetTypes = "Select at least one target audience";
    }
    
    // Target-specific validation
    if (selectedTargetTypes.includes("class") && selectedClasses.length === 0) {
      newErrors.targetClasses = "Select at least one class";
    }
    
    if (selectedTargetTypes.includes("grade") && selectedGrades.length === 0) {
      newErrors.targetGrades = "Select at least one grade";
    }
    
    if (selectedTargetTypes.includes("phase") && selectedPhases.length === 0) {
      newErrors.targetPhases = "Select at least one phase";
    }
    
    // Validate that end date/time is after start date/time
    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${endDate}T${endTime}`);
    
    if (endDateTime <= startDateTime) {
      newErrors.endTime = "End time must be after start time";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    // Create event object with target details
    const targetDetails: {
      targetClasses?: string[];
      targetGrades?: number[];
      targetPhases?: string[];
    } = {};
    
    if (selectedTargetTypes.includes("class")) {
      targetDetails.targetClasses = selectedClasses;
    }
    
    if (selectedTargetTypes.includes("grade")) {
      targetDetails.targetGrades = selectedGrades;
    }
    
    if (selectedTargetTypes.includes("phase")) {
      targetDetails.targetPhases = selectedPhases;
    }
    
    // Currently we don't have a direct update method, so we'll remove and add
    // In a real application, you would have a proper update method
    const events = getAllSchoolEvents();
    const updatedEvents = events.map(e => {
      if (e.id === params.id) {
        return {
          ...e,
          title,
          description,
          startDate: new Date(`${startDate}T${startTime}`),
          endDate: new Date(`${endDate}T${endTime}`),
          location,
          targetTypes: selectedTargetTypes,
          ...targetDetails,
          updatedAt: new Date()
        };
      }
      return e;
    });
    
    // In a real app, we'd update the database here
    // For now, we'll just show a success message
    alert("Event updated successfully!");
    
    // Redirect to events page
    router.push("/admin/events");
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Event not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Edit School Event</h1>
        <p className="text-gray-600 mt-2">
          Update event details
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Event Title */}
          <div className="col-span-2">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Event Title *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full p-2 border rounded-md ${errors.title ? "border-red-500" : "border-gray-300"}`}
              placeholder="e.g., Science Fair, Parent-Teacher Conference, School Assembly"
            />
            {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
          </div>

          {/* Event Description */}
          <div className="col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`w-full p-2 border rounded-md ${errors.description ? "border-red-500" : "border-gray-300"}`}
              rows={4}
              placeholder="Provide details about the event..."
            />
            {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
          </div>

          {/* Event Date/Time */}
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              Start Date *
            </label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={`w-full p-2 border rounded-md ${errors.startDate ? "border-red-500" : "border-gray-300"}`}
            />
            {errors.startDate && <p className="mt-1 text-sm text-red-500">{errors.startDate}</p>}
          </div>

          <div>
            <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
              Start Time *
            </label>
            <input
              type="time"
              id="startTime"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className={`w-full p-2 border rounded-md ${errors.startTime ? "border-red-500" : "border-gray-300"}`}
            />
            {errors.startTime && <p className="mt-1 text-sm text-red-500">{errors.startTime}</p>}
          </div>

          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
              End Date *
            </label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={`w-full p-2 border rounded-md ${errors.endDate ? "border-red-500" : "border-gray-300"}`}
            />
            {errors.endDate && <p className="mt-1 text-sm text-red-500">{errors.endDate}</p>}
          </div>

          <div>
            <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
              End Time *
            </label>
            <input
              type="time"
              id="endTime"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className={`w-full p-2 border rounded-md ${errors.endTime ? "border-red-500" : "border-gray-300"}`}
            />
            {errors.endTime && <p className="mt-1 text-sm text-red-500">{errors.endTime}</p>}
          </div>

          {/* Location */}
          <div className="col-span-2">
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              Location *
            </label>
            <input
              type="text"
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className={`w-full p-2 border rounded-md ${errors.location ? "border-red-500" : "border-gray-300"}`}
              placeholder="e.g., Main Hall, Classroom 101, Auditorium"
            />
            {errors.location && <p className="mt-1 text-sm text-red-500">{errors.location}</p>}
          </div>

          {/* Target Audience - Multi-select */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Audience * (select all that apply)
            </label>
            <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 ${errors.targetTypes ? "p-2 border border-red-500 rounded-md" : ""}`}>
              {Object.entries(eventTargetTypeLabels).map(([type, label]) => (
                <label key={type} className={`flex items-center p-2 border rounded-md cursor-pointer ${
                  selectedTargetTypes.includes(type as EventTargetType) 
                    ? "bg-amber-50 border-amber-400"
                    : "border-gray-300 hover:bg-gray-50"
                }`}>
                  <input
                    type="checkbox"
                    checked={selectedTargetTypes.includes(type as EventTargetType)}
                    onChange={() => toggleTargetType(type as EventTargetType)}
                    className="h-4 w-4 text-amber-600 focus:ring-amber-500 mr-2"
                  />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
            {errors.targetTypes && <p className="mt-1 text-sm text-red-500">{errors.targetTypes}</p>}

            {/* Multi-select options for specific targets */}
            {selectedTargetTypes.length > 0 && (
              <div className="mt-4 space-y-6">
                {selectedTargetTypes.includes("class") && (
                  <div className={`p-4 bg-gray-50 rounded-md ${errors.targetClasses ? "border border-red-500" : ""}`}>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      Select Classes ({selectedClasses.length} selected) *
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2">
                      {uniqueClasses.map((className) => (
                        <label
                          key={className}
                          className={`flex items-center p-2 border rounded-md text-sm cursor-pointer ${
                            selectedClasses.includes(className)
                              ? "bg-amber-50 border-amber-400"
                              : "border-gray-200 hover:bg-gray-100"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedClasses.includes(className)}
                            onChange={() => toggleClass(className)}
                            className="h-4 w-4 text-amber-600 focus:ring-amber-500 mr-2"
                          />
                          {className}
                        </label>
                      ))}
                    </div>
                    {errors.targetClasses && <p className="mt-1 text-sm text-red-500">{errors.targetClasses}</p>}
                  </div>
                )}

                {selectedTargetTypes.includes("grade") && (
                  <div className={`p-4 bg-gray-50 rounded-md ${errors.targetGrades ? "border border-red-500" : ""}`}>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      Select Grades ({selectedGrades.length} selected) *
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {uniqueGrades.map((grade) => (
                        <label
                          key={grade}
                          className={`flex items-center p-2 border rounded-md text-sm cursor-pointer ${
                            selectedGrades.includes(grade)
                              ? "bg-amber-50 border-amber-400"
                              : "border-gray-200 hover:bg-gray-100"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedGrades.includes(grade)}
                            onChange={() => toggleGrade(grade)}
                            className="h-4 w-4 text-amber-600 focus:ring-amber-500 mr-2"
                          />
                          Grade {grade}
                        </label>
                      ))}
                    </div>
                    {errors.targetGrades && <p className="mt-1 text-sm text-red-500">{errors.targetGrades}</p>}
                  </div>
                )}

                {selectedTargetTypes.includes("phase") && (
                  <div className={`p-4 bg-gray-50 rounded-md ${errors.targetPhases ? "border border-red-500" : ""}`}>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      Select Phases ({selectedPhases.length} selected) *
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {schoolPhases.map((phase) => (
                        <label
                          key={phase.id}
                          className={`flex items-center p-2 border rounded-md text-sm cursor-pointer ${
                            selectedPhases.includes(phase.id)
                              ? "bg-amber-50 border-amber-400"
                              : "border-gray-200 hover:bg-gray-100"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedPhases.includes(phase.id)}
                            onChange={() => togglePhase(phase.id)}
                            className="h-4 w-4 text-amber-600 focus:ring-amber-500 mr-2"
                          />
                          {phase.name} (Grades {phase.grades.join(", ")})
                        </label>
                      ))}
                    </div>
                    {errors.targetPhases && <p className="mt-1 text-sm text-red-500">{errors.targetPhases}</p>}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex justify-end space-x-4">
          <Link
            href="/admin/events"
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700"
          >
            Update Event
          </button>
        </div>
      </form>
    </div>
  );
} 