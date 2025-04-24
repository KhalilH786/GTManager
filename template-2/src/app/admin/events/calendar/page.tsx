"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/contexts/AuthContext";
import { 
  getAllSchoolEvents, 
  SchoolEvent,
  EventTargetType,
  eventTargetTypeLabels,
  schoolPhases,
  getTeacherById,
  getStaffById,
  students
} from "@/lib/data";

type DayEvents = {
  date: Date;
  events: SchoolEvent[];
  isCurrentMonth: boolean;
};

export default function EventsCalendarPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [calendarDays, setCalendarDays] = useState<DayEvents[]>([]);
  const [visibleEvents, setVisibleEvents] = useState<SchoolEvent[]>([]);
  
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

  // Generate calendar days for the current month
  useEffect(() => {
    const generateCalendarDays = () => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      
      // First day of the month
      const firstDay = new Date(year, month, 1);
      // Last day of the month
      const lastDay = new Date(year, month + 1, 0);
      
      // Get the day of the week for the first day (0 = Sunday, 6 = Saturday)
      const firstDayOfWeek = firstDay.getDay();
      
      // Calculate days from previous month to show
      const daysFromPrevMonth = firstDayOfWeek;
      
      // Get the last day of the previous month
      const lastDayOfPrevMonth = new Date(year, month, 0).getDate();
      
      const days: DayEvents[] = [];
      
      // Add days from the previous month
      for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
        const date = new Date(year, month - 1, lastDayOfPrevMonth - i);
        days.push({
          date,
          events: getEventsForDay(date),
          isCurrentMonth: false
        });
      }
      
      // Add days from the current month
      for (let i = 1; i <= lastDay.getDate(); i++) {
        const date = new Date(year, month, i);
        days.push({
          date,
          events: getEventsForDay(date),
          isCurrentMonth: true
        });
      }
      
      // Add days from the next month to complete the grid (6 rows x 7 columns = 42 cells)
      const daysNeeded = 42 - days.length;
      for (let i = 1; i <= daysNeeded; i++) {
        const date = new Date(year, month + 1, i);
        days.push({
          date,
          events: getEventsForDay(date),
          isCurrentMonth: false
        });
      }
      
      setCalendarDays(days);
    };
    
    generateCalendarDays();
  }, [currentDate, selectedTargetTypes, selectedClasses, selectedGrades, selectedPhases]);

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

  // Get events for a specific day, applying filters
  const getEventsForDay = (date: Date): SchoolEvent[] => {
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
    
    // Filter for events occurring on the specific day
    return filteredEvents.filter(event => {
      const startDate = new Date(event.startDate);
      const endDate = new Date(event.endDate);
      
      // Check if the date falls within the event's start and end dates
      return (
        date >= new Date(startDate.setHours(0, 0, 0, 0)) && 
        date <= new Date(endDate.setHours(23, 59, 59, 999))
      );
    });
  };

  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDate(null);
  };

  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDate(null);
  };

  // Handle day click
  const handleDayClick = (day: DayEvents) => {
    setSelectedDate(day.date);
    setVisibleEvents(day.events);
  };

  // Format date for display
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  };

  // Format time for display
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
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

  // Get color based on event target type
  const getTargetTypeColor = (targetType: EventTargetType): string => {
    switch (targetType) {
      case 'school': return 'bg-amber-100 text-amber-800';
      case 'phase': return 'bg-blue-100 text-blue-800';
      case 'grade': return 'bg-green-100 text-green-800';
      case 'class': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get creator name
  const getCreatorName = (creatorId: string) => {
    const teacherCreator = getTeacherById(creatorId);
    if (teacherCreator) return teacherCreator.name;
    
    const staffCreator = getStaffById(creatorId);
    if (staffCreator) return staffCreator.name;
    
    return "Unknown";
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
        <h1 className="text-3xl font-bold">School Events Calendar</h1>
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
          className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 hover:bg-gray-50"
        >
          List View
        </Link>
        <Link
          href="/admin/events/calendar"
          className="px-4 py-2 text-sm font-medium bg-amber-600 text-white rounded-md"
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

      {/* Full-width Calendar */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <button 
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <h2 className="text-xl font-semibold">{formatDate(currentDate)}</h2>
          <button 
            onClick={goToNextMonth}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
        
        <div className="p-4">
          <div className="grid grid-cols-7 gap-1">
            {/* Days of week */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-medium py-2">
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {calendarDays.map((day, index) => {
              // Check if it's today
              const isToday = new Date().toDateString() === day.date.toDateString();
              // Check if it's the selected date
              const isSelected = selectedDate && selectedDate.toDateString() === day.date.toDateString();
              
              return (
                <div
                  key={index}
                  onClick={() => handleDayClick(day)}
                  className={`p-1 min-h-[80px] border ${isSelected ? 'border-amber-500' : 'border-gray-200'} 
                    ${day.isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-500'} 
                    ${isToday ? 'ring-2 ring-amber-400' : ''} 
                    cursor-pointer hover:bg-gray-50 transition`}
                >
                  <div className="text-right px-1 font-medium">{day.date.getDate()}</div>
                  <div className="mt-1">
                    {day.events.length > 0 && (
                      <div className="flex flex-col gap-1">
                        {day.events.slice(0, 2).map(event => (
                          <div 
                            key={event.id} 
                            className={`text-xs p-1 rounded ${getTargetTypeColor(event.targetType)} truncate`}
                          >
                            {event.title}
                          </div>
                        ))}
                        {day.events.length > 2 && (
                          <div className="text-xs text-gray-500 pl-1">
                            +{day.events.length - 2} more events
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Event details for selected day */}
      <div className="mt-6 bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">
            {selectedDate 
              ? selectedDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric'
                }) + " - Events"
              : 'Select a day to view events'}
          </h2>
        </div>
        
        <div className="p-4">
          {selectedDate ? (
            visibleEvents.length > 0 ? (
              <div className="space-y-4">
                {visibleEvents.map((event) => (
                  <div key={event.id} className="border rounded-md p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-lg">{event.title}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${getTargetTypeColor(event.targetType)}`}>
                        {getTargetDisplay(event)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{event.description}</p>
                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div>
                        <span className="font-medium">Start:</span> {formatDate(event.startDate)} at {formatTime(event.startDate)}
                      </div>
                      <div>
                        <span className="font-medium">End:</span> {formatDate(event.endDate)} at {formatTime(event.endDate)}
                      </div>
                      <div>
                        <span className="font-medium">Location:</span> {event.location}
                      </div>
                      <div>
                        <span className="font-medium">Created by:</span> {getCreatorName(event.createdBy)}
                      </div>
                    </div>
                    <div className="flex justify-end mt-2 space-x-2">
                      <Link 
                        href={`/admin/events/${event.id}`} 
                        className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                      >
                        View Details
                      </Link>
                      <Link 
                        href={`/admin/events/${event.id}/edit`} 
                        className="text-amber-600 hover:text-amber-900 text-sm font-medium"
                      >
                        Edit Event
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No events scheduled for this day.</p>
            )
          ) : (
            <p className="text-gray-500 italic">Select a day from the calendar to view events for that day.</p>
          )}
        </div>
      </div>
    </div>
  );
} 