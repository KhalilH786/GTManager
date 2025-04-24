"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/contexts/AuthContext";
import { 
  getAllSchoolEvents, 
  SchoolEvent, 
  schoolPhases,
  teachers,
  staff,
  getStaffById,
  getTeacherById
} from "@/lib/data";

export default function EventDetailPage({ params }: { params: { id: string } }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [event, setEvent] = useState<SchoolEvent | null>(null);
  const [loading, setLoading] = useState(true);

  // Redirect if not admin
  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  // Load event data
  useEffect(() => {
    if (params.id) {
      const events = getAllSchoolEvents();
      const foundEvent = events.find(e => e.id === params.id);
      
      if (foundEvent) {
        setEvent(foundEvent);
      }
      
      setLoading(false);
    }
  }, [params.id]);

  // Format date for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
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

  // Get creator name
  const getCreatorName = (creatorId: string) => {
    const teacherCreator = getTeacherById(creatorId);
    if (teacherCreator) return teacherCreator.name;
    
    const staffCreator = getStaffById(creatorId);
    if (staffCreator) return staffCreator.name;
    
    return "Unknown";
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
      <div className="min-h-screen flex items-center justify-center flex-col">
        <p className="text-gray-500 mb-4">Event not found</p>
        <Link href="/admin/events" className="text-amber-600 hover:text-amber-800">
          Back to Events
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold">{event.title}</h1>
        <div className="space-x-4">
          <Link
            href={`/admin/events/${event.id}/edit`}
            className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700"
          >
            Edit Event
          </Link>
          <Link
            href="/admin/events"
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Back to Events
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Event Details */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Event Details</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Description</p>
                <p className="text-gray-800">{event.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Start Date</p>
                  <p className="text-gray-800">{formatDate(event.startDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Start Time</p>
                  <p className="text-gray-800">{formatTime(event.startDate)}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">End Date</p>
                  <p className="text-gray-800">{formatDate(event.endDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">End Time</p>
                  <p className="text-gray-800">{formatTime(event.endDate)}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="text-gray-800">{event.location}</p>
              </div>
            </div>
          </div>

          {/* Event Metadata */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Event Information</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Target Audience</p>
                <p className="text-gray-800">{getTargetDisplay(event)}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Created By</p>
                <p className="text-gray-800">{getCreatorName(event.createdBy)}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Created On</p>
                  <p className="text-gray-800">{formatDate(event.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Last Updated</p>
                  <p className="text-gray-800">{formatDate(event.updatedAt)}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Event ID</p>
                <p className="text-gray-800">{event.id}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 