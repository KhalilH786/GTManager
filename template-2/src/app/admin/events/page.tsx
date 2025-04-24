"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/contexts/AuthContext";
import { 
  getAllSchoolEvents, 
  eventTargetTypeLabels, 
  SchoolEvent, 
  EventTargetType,
  schoolPhases,
  students
} from "@/lib/data";

export default function EventsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  
  // Change filter types from single values to arrays for multi-select
  const [selectedTargetTypes, setSelectedTargetTypes] = useState<EventTargetType[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [selectedGrades, setSelectedGrades] = useState<number[]>([]);
  const [selectedPhases, setSelectedPhases] = useState<string[]>([]);

  // Unique lists for filter options
  const uniqueClasses = Array.from(new Set(students.map(student => student.homeroom))).sort();
  const uniqueGrades = Array.from(new Set(students.map(student => student.grade))).sort();

  // Redirect if not admin
  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  // Filter events based on selected filters
  useEffect(() => {
    const allEvents = getAllSchoolEvents();
    
    // Apply filters
    let filteredEvents = allEvents;
    
    // If at least one filter type is selected, apply type filter
    if (selectedTargetTypes.length > 0) {
      filteredEvents = filteredEvents.filter(event => 
        selectedTargetTypes.includes(event.targetType)
      );
    }
    
    // Apply class filter if any classes are selected
    if (selectedClasses.length > 0) {
      const classEvents = filteredEvents.filter(event => 
        event.targetType === "class" && event.targetClass && selectedClasses.includes(event.targetClass)
      );
      
      // Keep events that aren't class-specific plus the matching class events
      filteredEvents = filteredEvents.filter(event => event.targetType !== "class").concat(classEvents);
    }
    
    // Apply grade filter if any grades are selected
    if (selectedGrades.length > 0) {
      const gradeEvents = filteredEvents.filter(event => 
        event.targetType === "grade" && event.targetGrade && selectedGrades.includes(event.targetGrade)
      );
      
      // Keep events that aren't grade-specific plus the matching grade events
      filteredEvents = filteredEvents.filter(event => event.targetType !== "grade").concat(gradeEvents);
    }
    
    // Apply phase filter if any phases are selected
    if (selectedPhases.length > 0) {
      const phaseEvents = filteredEvents.filter(event => 
        event.targetType === "phase" && event.targetPhase && selectedPhases.includes(event.targetPhase)
      );
      
      // Keep events that aren't phase-specific plus the matching phase events
      filteredEvents = filteredEvents.filter(event => event.targetType !== "phase").concat(phaseEvents);
    }
    
    // If no filters are applied (all empty), show all events
    const areFiltersEmpty = 
      selectedTargetTypes.length === 0 && 
      selectedClasses.length === 0 && 
      selectedGrades.length === 0 && 
      selectedPhases.length === 0;
    
    if (areFiltersEmpty) {
      filteredEvents = allEvents;
    }
    
    setEvents(filteredEvents);
  }, [selectedTargetTypes, selectedClasses, selectedGrades, selectedPhases]);

  // Toggle selection of a target type
  const toggleTargetType = (type: EventTargetType) => {
    setSelectedTargetTypes(prev => {
      if (prev.includes(type)) {
        return prev.filter(t => t !== type);
      } else {
        return [...prev, type];
      }
    });
  };

  // Toggle selection of a class
  const toggleClass = (className: string) => {
    setSelectedClasses(prev => {
      if (prev.includes(className)) {
        return prev.filter(c => c !== className);
      } else {
        return [...prev, className];
      }
    });
  };

  // Toggle selection of a grade
  const toggleGrade = (grade: number) => {
    setSelectedGrades(prev => {
      if (prev.includes(grade)) {
        return prev.filter(g => g !== grade);
      } else {
        return [...prev, grade];
      }
    });
  };

  // Toggle selection of a phase
  const togglePhase = (phaseId: string) => {
    setSelectedPhases(prev => {
      if (prev.includes(phaseId)) {
        return prev.filter(p => p !== phaseId);
      } else {
        return [...prev, phaseId];
      }
    });
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedTargetTypes([]);
    setSelectedClasses([]);
    setSelectedGrades([]);
    setSelectedPhases([]);
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Format time for display
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get target audience display text
  const getTargetDisplay = (event: SchoolEvent) => {
    switch (event.targetType) {
      case "class":
        return `Class ${event.targetClass}`;
      case "grade":
        return `Grade ${event.targetGrade}`;
      case "phase":
        const phase = schoolPhases.find(p => p.id === event.targetPhase);
        return phase ? phase.name : "Unknown Phase";
      case "school":
        return "Whole School";
      default:
        return "Unknown";
    }
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
        <h1 className="text-3xl font-bold">School Events</h1>
        <Link
          href="/admin/events/create"
          className="bg-amber-600 hover:bg-amber-700 text-white py-2 px-4 rounded-md flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          Add New Event
        </Link>
      </div>

      {/* View options */}
      <div className="mb-6 flex items-center space-x-4">
        <Link
          href="/admin/events"
          className="px-4 py-2 text-sm font-medium bg-amber-600 text-white rounded-md"
        >
          List View
        </Link>
        <Link
          href="/admin/events/calendar"
          className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 hover:bg-gray-50"
        >
          Calendar View
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="space-y-5">
          <div className="flex justify-between items-center">
            <h3 className="text-md font-medium text-gray-800">Filter Events</h3>
            {(selectedTargetTypes.length > 0 || selectedClasses.length > 0 || 
              selectedGrades.length > 0 || selectedPhases.length > 0) && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-red-600 hover:text-red-800 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear Filters
              </button>
            )}
          </div>
          
          {/* Target Type Filters */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Event Type:</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(eventTargetTypeLabels).map(([type, label]) => (
                <label
                  key={type}
                  className={`flex items-center px-3 py-1.5 rounded border ${
                    selectedTargetTypes.includes(type as EventTargetType)
                      ? "bg-amber-50 border-amber-300 text-amber-800"
                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  } cursor-pointer transition-colors`}
                >
                  <input
                    type="checkbox"
                    checked={selectedTargetTypes.includes(type as EventTargetType)}
                    onChange={() => toggleTargetType(type as EventTargetType)}
                    className="h-4 w-4 text-amber-600 focus:ring-amber-500 mr-2 rounded"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
          
          {/* Specific Filter Sections */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Class Filter */}
            <div className="bg-gray-50 p-3 rounded-md">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Classes ({selectedClasses.length} selected):
              </h4>
              <div className="max-h-40 overflow-y-auto p-1 space-y-1">
                {uniqueClasses.map((className) => (
                  <label
                    key={className}
                    className="flex items-center text-sm hover:bg-gray-100 p-1 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={selectedClasses.includes(className)}
                      onChange={() => toggleClass(className)}
                      className="h-4 w-4 text-amber-600 focus:ring-amber-500 mr-2 rounded"
                    />
                    {className}
                  </label>
                ))}
              </div>
            </div>
            
            {/* Grade Filter */}
            <div className="bg-gray-50 p-3 rounded-md">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Grades ({selectedGrades.length} selected):
              </h4>
              <div className="max-h-40 overflow-y-auto p-1 space-y-1">
                {uniqueGrades.map((grade) => (
                  <label
                    key={grade}
                    className="flex items-center text-sm hover:bg-gray-100 p-1 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={selectedGrades.includes(grade)}
                      onChange={() => toggleGrade(grade)}
                      className="h-4 w-4 text-amber-600 focus:ring-amber-500 mr-2 rounded"
                    />
                    Grade {grade}
                  </label>
                ))}
              </div>
            </div>
            
            {/* Phase Filter */}
            <div className="bg-gray-50 p-3 rounded-md">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Phases ({selectedPhases.length} selected):
              </h4>
              <div className="max-h-40 overflow-y-auto p-1 space-y-1">
                {schoolPhases.map((phase) => (
                  <label
                    key={phase.id}
                    className="flex items-center text-sm hover:bg-gray-100 p-1 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPhases.includes(phase.id)}
                      onChange={() => togglePhase(phase.id)}
                      className="h-4 w-4 text-amber-600 focus:ring-amber-500 mr-2 rounded"
                    />
                    {phase.name} (Grades {phase.grades.join(", ")})
                  </label>
                ))}
              </div>
            </div>
          </div>
          
          {/* Active Filters Display */}
          {(selectedTargetTypes.length > 0 || selectedClasses.length > 0 || 
            selectedGrades.length > 0 || selectedPhases.length > 0) && (
            <div className="mt-4 p-3 bg-blue-50 rounded-md">
              <h4 className="text-sm font-medium text-blue-700 mb-2">Active Filters:</h4>
              <div className="flex flex-wrap gap-2">
                {selectedTargetTypes.map(type => (
                  <div key={type} className="bg-white px-2 py-1 rounded-full text-xs border border-blue-200 flex items-center">
                    {eventTargetTypeLabels[type]}
                    <button
                      onClick={() => toggleTargetType(type)}
                      className="ml-1 text-blue-500 hover:text-blue-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                {selectedClasses.map(className => (
                  <div key={className} className="bg-white px-2 py-1 rounded-full text-xs border border-blue-200 flex items-center">
                    Class: {className}
                    <button
                      onClick={() => toggleClass(className)}
                      className="ml-1 text-blue-500 hover:text-blue-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                {selectedGrades.map(grade => (
                  <div key={grade} className="bg-white px-2 py-1 rounded-full text-xs border border-blue-200 flex items-center">
                    Grade: {grade}
                    <button
                      onClick={() => toggleGrade(grade)}
                      className="ml-1 text-blue-500 hover:text-blue-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                {selectedPhases.map(phaseId => {
                  const phase = schoolPhases.find(p => p.id === phaseId);
                  return (
                    <div key={phaseId} className="bg-white px-2 py-1 rounded-full text-xs border border-blue-200 flex items-center">
                      Phase: {phase?.name || phaseId}
                      <button
                        onClick={() => togglePhase(phaseId)}
                        className="ml-1 text-blue-500 hover:text-blue-700"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Events List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Target
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {events.length > 0 ? (
                events.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{event.title}</div>
                      <div className="text-sm text-gray-500 truncate max-w-md">{event.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(event.startDate)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatTime(event.startDate)} - {formatTime(event.endDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {event.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        event.targetType === "school" ? "bg-amber-100 text-amber-800" :
                        event.targetType === "phase" ? "bg-blue-100 text-blue-800" :
                        event.targetType === "grade" ? "bg-green-100 text-green-800" :
                        "bg-purple-100 text-purple-800"
                      }`}>
                        {getTargetDisplay(event)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <Link 
                        href={`/admin/events/${event.id}`}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        View
                      </Link>
                      <Link 
                        href={`/admin/events/${event.id}/edit`}
                        className="text-amber-600 hover:text-amber-900 mr-3"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No events found. Create your first event!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 