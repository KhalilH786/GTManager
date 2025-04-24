"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { 
  getAllIncidents, 
  incidentTypeLabels, 
  incidentSeverityLabels, 
  getStudentById,
  getTeacherById,
  students,
  type Incident,
  type IncidentType,
  type IncidentSeverity
} from "@/lib/data";
import { useAuth } from "@/lib/contexts/AuthContext";

// Incident Status Badge Component
const IncidentStatusBadge = ({ status }: { status: Incident['status'] }) => {
  const getStatusStyles = () => {
    switch (status) {
      case "open":
        return "bg-red-100 text-red-800";
      case "under_investigation":
        return "bg-yellow-100 text-yellow-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case "open":
        return "Open";
      case "under_investigation":
        return "Under Investigation";
      case "resolved":
        return "Resolved";
      default:
        return status;
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyles()}`}
    >
      {getStatusLabel()}
    </span>
  );
};

// Incident Severity Badge Component
const IncidentSeverityBadge = ({ severity }: { severity: IncidentSeverity }) => {
  const getSeverityStyles = () => {
    switch (severity) {
      case "minor":
        return "bg-blue-100 text-blue-800";
      case "moderate":
        return "bg-yellow-100 text-yellow-800";
      case "major":
        return "bg-orange-100 text-orange-800";
      case "critical":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityStyles()}`}
    >
      {incidentSeverityLabels[severity]}
    </span>
  );
};

export default function IncidentsPage() {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>([]);
  
  // Filter states
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  
  // Student filter states
  const [initiatorFilter, setInitiatorFilter] = useState<string[]>([]);
  const [affectedStudentFilter, setAffectedStudentFilter] = useState<string[]>([]);
  
  // Boolean filter states
  const [requiresInterventionFilter, setRequiresInterventionFilter] = useState<boolean | null>(null);
  const [parentNotifiedFilter, setParentNotifiedFilter] = useState<boolean | null>(null);
  const [requiresParentNotificationFilter, setRequiresParentNotificationFilter] = useState<boolean | null>(null);
  const [intervenedFilter, setIntervenedFilter] = useState<boolean | null>(null);
  
  // Student search states
  const [studentSearchTerm, setStudentSearchTerm] = useState<string>("");
  const [studentSearchResults, setStudentSearchResults] = useState<typeof students>([]);
  const [activeStudentCategory, setActiveStudentCategory] = useState<"initiator" | "affected">("initiator");
  
  // Sort states
  const [sortField, setSortField] = useState<keyof Incident>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Load incidents on component mount
  useEffect(() => {
    const allIncidents = getAllIncidents();
    setIncidents(allIncidents);
    setFilteredIncidents(allIncidents);
  }, []);

  // Apply filters when any filter changes
  useEffect(() => {
    let result = incidents;

    // Filter by type
    if (typeFilter !== "all") {
      result = result.filter(incident => incident.type === typeFilter);
    }

    // Filter by date range
    if (startDate) {
      const start = new Date(startDate);
      result = result.filter(incident => new Date(incident.date) >= start);
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // End of day
      result = result.filter(incident => new Date(incident.date) <= end);
    }

    // Filter by search query (in title or description)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        incident => 
          incident.title.toLowerCase().includes(query) || 
          incident.description.toLowerCase().includes(query)
      );
    }
    
    // Filter by initiator students
    if (initiatorFilter.length > 0) {
      result = result.filter(incident => 
        initiatorFilter.some(studentId => incident.initiators.includes(studentId))
      );
    }
    
    // Filter by affected students
    if (affectedStudentFilter.length > 0) {
      result = result.filter(incident => 
        affectedStudentFilter.some(studentId => incident.affectedStudents.includes(studentId))
      );
    }
    
    // Filter by requires intervention
    if (requiresInterventionFilter !== null) {
      result = result.filter(incident => incident.requiresIntervention === requiresInterventionFilter);
    }
    
    // Filter by parent notified
    if (parentNotifiedFilter !== null) {
      result = result.filter(incident => incident.parentNotified === parentNotifiedFilter);
    }

    // Filter by requires parent notification
    if (requiresParentNotificationFilter !== null) {
      result = result.filter(incident => incident.requiresParentNotification === requiresParentNotificationFilter);
    }

    // Filter by intervened
    if (intervenedFilter !== null) {
      result = result.filter(incident => incident.intervened === intervenedFilter);
    }

    // Sort results
    result = [...result].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      // Handle date comparison
      if (sortField === "date" || sortField === "createdAt" || sortField === "updatedAt") {
        if (aValue instanceof Date && bValue instanceof Date) {
          return sortDirection === "asc" 
            ? aValue.getTime() - bValue.getTime()
            : bValue.getTime() - aValue.getTime();
        }
        return 0; // Fallback if not comparing dates
      }
      
      // String comparison
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc" 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }
      
      // Number comparison
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" 
          ? aValue - bValue
          : bValue - aValue;
      }
      
      // Default case
      return 0;
    });

    setFilteredIncidents(result);
  }, [incidents, typeFilter, searchQuery, startDate, endDate, sortField, sortDirection, initiatorFilter, affectedStudentFilter, requiresInterventionFilter, parentNotifiedFilter, requiresParentNotificationFilter, intervenedFilter]);

  // Handle student search
  const handleStudentSearch = (term: string) => {
    setStudentSearchTerm(term);
    if (term.trim() === "") {
      setStudentSearchResults([]);
      return;
    }

    const results = students.filter(student => 
      student.name.toLowerCase().includes(term.toLowerCase()) ||
      `${student.grade}-${student.homeroom}`.toLowerCase().includes(term.toLowerCase())
    );
    setStudentSearchResults(results);
  };

  // Add student to selected category
  const addStudentToCategory = (studentId: string) => {
    if (activeStudentCategory === "initiator") {
      if (!initiatorFilter.includes(studentId)) {
        setInitiatorFilter([...initiatorFilter, studentId]);
      }
    } else if (activeStudentCategory === "affected") {
      if (!affectedStudentFilter.includes(studentId)) {
        setAffectedStudentFilter([...affectedStudentFilter, studentId]);
      }
    }
    setStudentSearchTerm("");
    setStudentSearchResults([]);
  };

  // Remove student from category
  const removeStudentFromCategory = (studentId: string, category: "initiator" | "affected") => {
    if (category === "initiator") {
      setInitiatorFilter(initiatorFilter.filter(id => id !== studentId));
    } else if (category === "affected") {
      setAffectedStudentFilter(affectedStudentFilter.filter(id => id !== studentId));
    }
  };

  // Switch the active student category
  const switchStudentCategory = (category: "initiator" | "affected") => {
    setActiveStudentCategory(category);
    setStudentSearchTerm("");
    setStudentSearchResults([]);
  };

  // Handle sort change
  const handleSort = (field: keyof Incident) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Render sort indicator
  const renderSortIndicator = (field: keyof Incident) => {
    if (sortField !== field) {
      return (
        <span className="ml-1 text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </span>
      );
    }
    
    return sortDirection === "asc" ? (
      <span className="ml-1 text-teal-600">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </span>
    ) : (
      <span className="ml-1 text-teal-600">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </span>
    );
  };
  
  // Render selected students for a category
  const renderSelectedStudents = (studentIds: string[], category: "initiator" | "affected") => {
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

  // Helper function to get student names
  const getStudentNames = (studentIds: string[]) => {
    return studentIds.map(id => {
      const student = getStudentById(id);
      return student ? student.name : 'Unknown';
    }).join(", ");
  };

  return (
    <div className="container mx-auto">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Incidents</h1>
          <p className="text-gray-600">
            Manage and track school incidents
          </p>
        </div>
        
        {user && (
          <Link
            href="/incidents/create"
            className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md text-sm font-medium shadow-sm"
          >
            Report Incident
          </Link>
        )}
      </div>

      {/* Filter and search controls */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label htmlFor="typeFilter" className="block text-sm font-medium text-gray-700 mb-1">
                Incident Type
              </label>
              <select
                id="typeFilter"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
              >
                <option value="all">All Types</option>
                {Object.entries(incidentTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="searchQuery" className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                id="searchQuery"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search incidents..."
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setTypeFilter("all");
                  setSearchQuery("");
                  setStartDate("");
                  setEndDate("");
                  setInitiatorFilter([]);
                  setAffectedStudentFilter([]);
                  setRequiresInterventionFilter(null);
                  setParentNotifiedFilter(null);
                  setRequiresParentNotificationFilter(null);
                  setIntervenedFilter(null);
                }}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
              >
                Clear All Filters
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
              />
            </div>
          </div>
          
          {/* Boolean filter options */}
          <div className="flex flex-wrap gap-6 mb-6 border-t border-gray-200 pt-4">
            <div className="flex gap-6">
              <div className="flex items-center">
                <input
                  id="requiresIntervention"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  checked={requiresInterventionFilter === true}
                  onChange={() => {
                    setRequiresInterventionFilter(current => {
                      if (current === true) return null; // toggle off if already true
                      return true; // otherwise set to true
                    });
                  }}
                />
                <label htmlFor="requiresIntervention" className="ml-2 block text-sm text-gray-700">
                  Requires intervention
                </label>
              </div>
            </div>
            
            <div className="flex gap-6">
              <div className="flex items-center">
                <input
                  id="requiresParentNotification"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  checked={requiresParentNotificationFilter === true}
                  onChange={() => {
                    setRequiresParentNotificationFilter(current => {
                      if (current === true) return null;
                      return true;
                    });
                  }}
                />
                <label htmlFor="requiresParentNotification" className="ml-2 block text-sm text-gray-700">
                  Requires parent notification
                </label>
              </div>
            </div>
            
            <div className="flex gap-6">
              <div className="flex items-center">
                <input
                  id="intervened"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  checked={intervenedFilter === true}
                  onChange={() => {
                    setIntervenedFilter(current => {
                      if (current === true) return null;
                      return true;
                    });
                  }}
                />
                <label htmlFor="intervened" className="ml-2 block text-sm text-gray-700">
                  Intervened
                </label>
              </div>
            </div>
            
            <div className="flex gap-6">
              <div className="flex items-center">
                <input
                  id="parentNotified"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  checked={parentNotifiedFilter === true}
                  onChange={() => {
                    setParentNotifiedFilter(current => {
                      if (current === true) return null; // toggle off if already true
                      return true; // otherwise set to true
                    });
                  }}
                />
                <label htmlFor="parentNotified" className="ml-2 block text-sm text-gray-700">
                  Parents notified
                </label>
              </div>
            </div>
          </div>
          
          {/* Student search section */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h3 className="text-lg font-medium mb-4">Search by Students</h3>
            
            {/* Student category tabs */}
            <div className="flex mb-4 border-b">
              <button
                type="button"
                onClick={() => switchStudentCategory("initiator")}
                className={`py-2 px-4 text-sm font-medium ${
                  activeStudentCategory === "initiator" 
                    ? "border-b-2 border-teal-500 text-teal-600" 
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Initiators
              </button>
              <button
                type="button"
                onClick={() => switchStudentCategory("affected")}
                className={`py-2 px-4 text-sm font-medium ${
                  activeStudentCategory === "affected" 
                    ? "border-b-2 border-teal-500 text-teal-600" 
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Affected Students
              </button>
            </div>
            
            {/* Student search input */}
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  value={studentSearchTerm}
                  onChange={(e) => handleStudentSearch(e.target.value)}
                  placeholder={`Search ${
                    activeStudentCategory === "initiator" 
                      ? "initiators" 
                      : "affected students"
                  }...`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                
                {studentSearchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    <ul>
                      {studentSearchResults.map(student => (
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
            
            {/* Selected students display */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Selected Initiators</h4>
                {renderSelectedStudents(initiatorFilter, "initiator")}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Selected Affected Students</h4>
                {renderSelectedStudents(affectedStudentFilter, "affected")}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Incidents list */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredIncidents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th 
                    className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("title")}
                  >
                    Incident {renderSortIndicator("title")}
                  </th>
                  <th 
                    className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("type")}
                  >
                    Type {renderSortIndicator("type")}
                  </th>
                  <th 
                    className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("date")}
                  >
                    Date {renderSortIndicator("date")}
                  </th>
                  <th 
                    className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    Involved Students
                  </th>
                  <th className="px-6 py-3 bg-gray-50"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredIncidents.map((incident) => (
                  <tr key={incident.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{incident.title}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {incident.description.length > 100
                          ? `${incident.description.substring(0, 100)}...`
                          : incident.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {incidentTypeLabels[incident.type as IncidentType]}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {format(new Date(incident.date), "MMM d, yyyy")}
                      </div>
                      <div className="text-sm text-gray-500">
                        {format(new Date(incident.date), "h:mm a")}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="mt-3 text-sm space-y-1">
                        {incident.initiators.length > 0 && (
                          <p>
                            <span className="font-semibold">Initiators:</span> {getStudentNames(incident.initiators)}
                          </p>
                        )}
                        {incident.affectedStudents.length > 0 && (
                          <p>
                            <span className="font-semibold">Affected Students:</span> {getStudentNames(incident.affectedStudents)}
                          </p>
                        )}
                        {incident.witnesses && incident.witnesses.length > 0 && (
                          <p>
                            <span className="font-semibold">Witnesses:</span> {getStudentNames(incident.witnesses)}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-2 mt-2">
                          {incident.requiresIntervention && !incident.intervened && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              Intervention required
                            </span>
                          )}
                          {incident.requiresParentNotification && !incident.parentNotified && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                              Notify parents
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link href={`/incidents/${incident.id}`} className="text-teal-600 hover:text-teal-900 mr-4">
                        View
                      </Link>
                      <Link href={`/incidents/${incident.id}/edit`} className="text-teal-600 hover:text-teal-900">
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No incidents found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery || typeFilter !== "all" || startDate || endDate || initiatorFilter.length > 0 || affectedStudentFilter.length > 0 || requiresInterventionFilter !== null || parentNotifiedFilter !== null || requiresParentNotificationFilter !== null || intervenedFilter !== null
                ? "Try adjusting your filters or search query."
                : "Get started by reporting a new incident."}
            </p>
            {!(searchQuery || typeFilter !== "all" || startDate || endDate || initiatorFilter.length > 0 || affectedStudentFilter.length > 0 || requiresInterventionFilter !== null || parentNotifiedFilter !== null || requiresParentNotificationFilter !== null || intervenedFilter !== null) && (
              <div className="mt-6">
                <Link
                  href="/incidents/create"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                >
                  <svg
                    className="-ml-1 mr-2 h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Report Incident
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 