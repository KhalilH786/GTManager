"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { 
  getIncidentById, 
  getStudentById,
  getCreatorById,
  getTeacherById,
  incidentTypeLabels,
  incidentSeverityLabels,
  type Incident
} from "@/lib/data";
import { useAuth } from "@/lib/contexts/AuthContext";

// Component for displaying incident status
function IncidentStatusBadge({ status }: { status: string }) {
  let bgColor = "";
  let textColor = "";
  let statusText = "";

  switch (status) {
    case "open":
      bgColor = "bg-yellow-100";
      textColor = "text-yellow-800";
      statusText = "Open";
      break;
    case "under_investigation":
      bgColor = "bg-blue-100";
      textColor = "text-blue-800";
      statusText = "Under Investigation";
      break;
    case "resolved":
      bgColor = "bg-green-100";
      textColor = "text-green-800";
      statusText = "Resolved";
      break;
    default:
      bgColor = "bg-gray-100";
      textColor = "text-gray-800";
      statusText = status;
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium ${bgColor} ${textColor}`}>
      {statusText}
    </span>
  );
}

// Component for displaying incident severity
function IncidentSeverityBadge({ severity }: { severity: string }) {
  let bgColor = "";
  let textColor = "";
  let severityLabel = incidentSeverityLabels[severity as keyof typeof incidentSeverityLabels] || severity;

  switch (severity) {
    case "minor":
      bgColor = "bg-blue-100";
      textColor = "text-blue-800";
      break;
    case "moderate":
      bgColor = "bg-yellow-100";
      textColor = "text-yellow-800";
      break;
    case "major":
      bgColor = "bg-orange-100";
      textColor = "text-orange-800";
      break;
    case "critical":
      bgColor = "bg-red-100";
      textColor = "text-red-800";
      break;
    default:
      bgColor = "bg-gray-100";
      textColor = "text-gray-800";
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium ${bgColor} ${textColor}`}>
      {severityLabel}
    </span>
  );
}

// Student list component
interface StudentListProps {
  studentIds: string[];
  role: "initiator" | "affectedStudent" | "witness";
}

function StudentList({ studentIds, role }: StudentListProps) {
  if (!studentIds || studentIds.length === 0) {
    return <p className="text-gray-500 italic">None</p>;
  }

  return (
    <ul className="space-y-1">
      {studentIds.map(id => {
        const student = getStudentById(id);
        return student ? (
          <li key={id} className="text-sm">
            <Link 
              href={`/students/${id}`} 
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              {student.name} ({student.grade}-{student.homeroom})
            </Link>
          </li>
        ) : (
          <li key={id} className="text-sm text-gray-500">Unknown Student (ID: {id})</li>
        );
      })}
    </ul>
  );
}

export default function IncidentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch incident data
  useEffect(() => {
    if (!params.id) {
      setError("Incident ID is missing");
      setLoading(false);
      return;
    }

    try {
      const foundIncident = getIncidentById(params.id as string);
      if (!foundIncident) {
        setError("Incident not found");
      } else {
        setIncident(foundIncident);
      }
    } catch (err) {
      setError("Failed to load incident details");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 p-4 rounded-md mb-4">
          <p className="text-red-700">You must be logged in to view incident details</p>
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

  // Show error state
  if (error || !incident) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 p-4 rounded-md mb-4">
          <p className="text-red-700">{error || "Failed to load incident"}</p>
        </div>
        <Link href="/incidents" className="text-blue-600 hover:underline flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          Back to Incidents
        </Link>
      </div>
    );
  }

  // Get reporter name
  const reporter = getCreatorById(incident.reportedBy);
  const reporterName = reporter ? reporter.name : "Unknown";

  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <Link href="/incidents" className="text-blue-600 hover:text-blue-800 text-sm flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          Back to Incidents
        </Link>
      </div>
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold mb-2">{incident.title}</h1>
              <div className="flex flex-wrap gap-2 mt-2">
                <IncidentStatusBadge status={incident.status} />
                <IncidentSeverityBadge severity={incident.severity} />
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-gray-100 text-gray-800">
                  {incidentTypeLabels[incident.type as keyof typeof incidentTypeLabels] || incident.type}
                </span>
              </div>
            </div>
            <Link
              href={`/incidents/${incident.id}/edit`}
              className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
            >
              Edit Incident
            </Link>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-lg font-semibold mb-4">Incident Details</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">When</h3>
                  <p>{incident.date ? format(new Date(incident.date), "PPp") : "Date not specified"}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Location</h3>
                  <p>{incident.location || "Not specified"}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Reported By</h3>
                  <p>{reporterName}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Created</h3>
                  <p>{incident.createdAt ? format(new Date(incident.createdAt), "PPp") : "Not available"}</p>
                </div>
                
                {incident.updatedAt && incident.updatedAt !== incident.createdAt && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
                    <p>{format(new Date(incident.updatedAt), "PPp")}</p>
                  </div>
                )}
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Parent/Guardian Notified</h3>
                  <p>{incident.parentNotified ? "Yes" : "No"}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Requires Intervention</h3>
                  <p>{incident.requiresIntervention ? "Yes" : "No"}</p>
                </div>
                
                {incident.requiresIntervention && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Intervention Status</h3>
                    <p>{incident.postIncidentIntervention ? "Completed" : "Pending"}</p>
                  </div>
                )}
                
                {incident.requiresIntervention && incident.postIncidentIntervention && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Intervention Details</h3>
                    <div className="p-3 bg-gray-50 rounded-md mt-1">
                      <p className="whitespace-pre-wrap text-sm">{incident.postIncidentIntervention}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h2 className="text-lg font-semibold mb-4">Students Involved</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Initiators</h3>
                  <StudentList studentIds={incident.initiators} role="initiator" />
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Affected Students</h3>
                  <StudentList studentIds={incident.affectedStudents} role="affectedStudent" />
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Witnesses</h3>
                  <StudentList studentIds={incident.witnesses || []} role="witness" />
                </div>
                
                {incident.involvedTeachers && incident.involvedTeachers.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Teachers Involved</h3>
                    <ul className="space-y-1">
                      {incident.involvedTeachers.map(id => {
                        const teacher = getTeacherById(id);
                        return teacher ? (
                          <li key={id} className="text-sm">
                            <Link 
                              href={`/admin/teachers/${id}`} 
                              className="text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              {teacher.name}
                            </Link>
                          </li>
                        ) : (
                          <li key={id} className="text-sm text-gray-500">Unknown Teacher (ID: {id})</li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-2">Description</h2>
            <div className="p-4 bg-gray-50 rounded-md">
              <p className="whitespace-pre-wrap">{incident.description}</p>
            </div>
          </div>
          
          {incident.status === "resolved" && incident.resolution && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold mb-2">Resolution</h2>
              <div className="p-4 bg-gray-50 rounded-md">
                <p className="whitespace-pre-wrap">{incident.resolution}</p>
              </div>
            </div>
          )}
          
          {incident.followUpActions && incident.followUpActions.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold mb-2">Follow-up Actions</h2>
              <ul className="list-disc pl-5 space-y-1">
                {incident.followUpActions.map((action, index) => (
                  <li key={index}>{action}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 