"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
  getLeaveRequestById, 
  getTeacherById, 
  getStaffById,
  updateLeaveRequestStatus,
  leaveTypeLabels,
  leaveStatusLabels,
  LeaveStatus,
  LeaveType,
  LeaveRequest
} from "@/lib/data";
import { useAuth } from "@/lib/contexts/AuthContext";
import { format } from "date-fns";
import Link from "next/link";

export default function LeaveDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const leaveId = params?.id as string;
  
  const [leave, setLeave] = useState<LeaveRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewNotes, setReviewNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load leave request details
  useEffect(() => {
    if (leaveId) {
      const leaveRequest = getLeaveRequestById(leaveId);
      setLeave(leaveRequest || null);
      setIsLoading(false);
      
      if (leaveRequest?.reviewNotes) {
        setReviewNotes(leaveRequest.reviewNotes);
      }
    }
  }, [leaveId]);

  // Get name of person by ID
  const getNameById = (id: string) => {
    const teacher = getTeacherById(id);
    if (teacher) return teacher.name;
    
    const admin = getStaffById(id);
    if (admin) return admin.name;
    
    return "Unknown";
  };

  // Handle review form submission
  const handleReviewSubmit = (newStatus: LeaveStatus) => {
    if (!user || !leave) return;
    
    setIsSubmitting(true);
    
    try {
      if (updateLeaveRequestStatus(leave.id, newStatus, user.id, reviewNotes)) {
        // Refresh the leave request data
        const updatedLeave = getLeaveRequestById(leaveId);
        setLeave(updatedLeave || null);
      }
    } catch (error) {
      console.error("Error updating leave request:", error);
      alert("An error occurred while updating the leave request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if user has permission to see this leave request
  const hasViewPermission = () => {
    if (!user || !leave) return false;
    
    // Admin and manager can view all leave requests
    if (user.role === "admin" || user.role === "manager") return true;
    
    // Teachers can only view their own leave requests
    return user.id === leave.teacherId;
  };

  // Check if user can approve/reject leave requests
  const canReviewLeave = () => {
    if (!user || !leave) return false;
    
    // Only admin and manager can review leave requests
    if (user.role === "admin" || user.role === "manager") {
      // Can only review pending requests
      return leave.status === "pending";
    }
    
    return false;
  };
  
  // Check if user can cancel this leave request
  const canCancelLeave = () => {
    if (!user || !leave) return false;
    
    // Only teacher who owns the request can cancel it
    return user.id === leave.teacherId && leave.status === "pending";
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  if (!leave) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-xl font-bold mb-4">Leave Request Not Found</h1>
          <p className="text-gray-600 mb-4">
            The leave request you are looking for does not exist or you don't have permission to view it.
          </p>
          <Link 
            href="/leave"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
          >
            Return to Leave Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!hasViewPermission()) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">
            You don't have permission to view this leave request.
          </p>
          <Link 
            href="/leave"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
          >
            Return to Leave Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Leave Request Details</h1>
          <Link
            href="/leave"
            className="text-teal-600 hover:text-teal-800"
          >
            Back to Leave Dashboard
          </Link>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div className="p-6">
            <div className="mb-6 flex justify-between items-start">
              <div>
                <h2 className="text-lg font-medium text-gray-900">
                  {leaveTypeLabels[leave.type]} Request
                </h2>
                <div className="mt-1 text-sm text-gray-500">
                  Submitted on {format(new Date(leave.createdAt), "MMMM d, yyyy")}
                </div>
              </div>
              <div>
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                  ${leave.status === "approved" ? "bg-green-100 text-green-800" : 
                    leave.status === "rejected" ? "bg-red-100 text-red-800" : 
                    leave.status === "pending" ? "bg-yellow-100 text-yellow-800" : 
                    "bg-gray-100 text-gray-800"}`}>
                  {leaveStatusLabels[leave.status]}
                </span>
              </div>
            </div>

            <div className="border-t border-gray-200 py-4">
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                <div className="col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Staff Member</dt>
                  <dd className="mt-1 text-sm text-gray-900">{getNameById(leave.teacherId)}</dd>
                </div>
                
                <div className="col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Leave Type</dt>
                  <dd className="mt-1 text-sm text-gray-900">{leaveTypeLabels[leave.type]}</dd>
                </div>
                
                <div className="col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Start Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">{format(new Date(leave.startDate), "MMMM d, yyyy")}</dd>
                </div>
                
                <div className="col-span-1">
                  <dt className="text-sm font-medium text-gray-500">End Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">{format(new Date(leave.endDate), "MMMM d, yyyy")}</dd>
                </div>
                
                <div className="col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Reason</dt>
                  <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line">{leave.reason}</dd>
                </div>
                
                {leave.documents && leave.documents.length > 0 && (
                  <div className="col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Supporting Documents</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      <ul className="border rounded-md divide-y divide-gray-200">
                        {leave.documents.map((doc: string, index: number) => (
                          <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                            <div className="w-0 flex-1 flex items-center">
                              <span className="ml-2 flex-1 w-0 truncate">Document {index + 1}</span>
                            </div>
                            <div className="ml-4 flex-shrink-0">
                              <a href={doc} target="_blank" rel="noopener noreferrer" className="font-medium text-teal-600 hover:text-teal-500">
                                Download
                              </a>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                )}
                
                {(leave.status === "approved" || leave.status === "rejected") && (
                  <>
                    <div className="col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Reviewed By</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {leave.reviewedBy ? getNameById(leave.reviewedBy) : "N/A"}
                      </dd>
                    </div>
                    
                    <div className="col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Reviewed On</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {leave.reviewedAt ? format(new Date(leave.reviewedAt), "MMMM d, yyyy") : "N/A"}
                      </dd>
                    </div>
                    
                    {leave.reviewNotes && (
                      <div className="col-span-2">
                        <dt className="text-sm font-medium text-gray-500">Review Notes</dt>
                        <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line">{leave.reviewNotes}</dd>
                      </div>
                    )}
                  </>
                )}
              </dl>
            </div>
            
            {/* Action buttons based on user permission */}
            <div className="flex justify-end space-x-3 mt-6">
              {canCancelLeave() && (
                <button
                  onClick={() => handleReviewSubmit("cancelled")}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                >
                  {isSubmitting ? "Processing..." : "Cancel Request"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Review Form for Managers/Admins */}
        {canReviewLeave() && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Review Leave Request</h2>
              
              <div className="mb-4">
                <label htmlFor="reviewNotes" className="block text-sm font-medium text-gray-700 mb-1">
                  Review Notes (optional)
                </label>
                <textarea
                  id="reviewNotes"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={3}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-teal-500 focus:ring-teal-500"
                  placeholder="Add notes about your decision"
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => handleReviewSubmit("rejected")}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {isSubmitting ? "Processing..." : "Reject Leave"}
                </button>
                <button
                  onClick={() => handleReviewSubmit("approved")}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {isSubmitting ? "Processing..." : "Approve Leave"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 