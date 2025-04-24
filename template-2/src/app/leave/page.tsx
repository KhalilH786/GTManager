"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { 
  LeaveRequest,
  LeaveType,
  LeaveStatus,
  leaveTypeLabels,
  leaveStatusLabels,
  getTeacherById,
  getStaffById
} from "@/lib/data";
import { 
  getAllLeaveRequests, 
  getLeaveRequestsByTeacher, 
  getLeaveRequestsByStatus, 
  updateLeaveRequestStatus as firebaseUpdateLeaveStatus,
  getTeacherById as firebaseGetTeacherById,
  getDocumentById
} from "@/lib/firebase/firebaseUtils";
import { useAuth } from "@/lib/contexts/AuthContext";
import { format } from "date-fns";

export default function LeavePage() {
  const auth = useAuth();
  const user = auth?.user;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [activeTab, setActiveTab] = useState<"my-requests" | "pending-approval" | "all-requests">("my-requests");
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<LeaveStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<LeaveType | "all">("all");
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);

  // Set active tab based on URL parameter on component mount
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && (
      tabParam === "my-requests" || 
      tabParam === "pending-approval" || 
      tabParam === "all-requests"
    )) {
      setActiveTab(tabParam as any);
    }
  }, [searchParams]);

  // Update URL when tab changes
  const handleTabChange = (tab: "my-requests" | "pending-approval" | "all-requests") => {
    setActiveTab(tab);
    
    // Create new URL with the tab parameter
    const params = new URLSearchParams(searchParams);
    params.set('tab', tab);
    router.push(`${pathname}?${params.toString()}`);
  };

  // Load leave requests based on active tab and user role
  useEffect(() => {
    if (!user) return;

    const fetchLeaveRequests = async () => {
      setLoading(true);
      try {
        if (user.role === "teacher") {
          // Teachers can only see their own requests
          const requests = await getLeaveRequestsByTeacher(user.id);
          setLeaveRequests(requests);
          setActiveTab("my-requests");
        } else if (user.role === "admin" || user.role === "manager") {
          // Admins and managers can see all requests
          if (activeTab === "my-requests") {
            const requests = await getLeaveRequestsByTeacher(user.id);
            setLeaveRequests(requests);
          } else if (activeTab === "pending-approval") {
            const requests = await getLeaveRequestsByStatus("pending");
            setLeaveRequests(requests);
          } else {
            const requests = await getAllLeaveRequests();
            setLeaveRequests(requests);
          }
        }
      } catch (error) {
        console.error("Error fetching leave requests:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaveRequests();
  }, [user, activeTab]);

  // Get teacher or staff name by ID
  const getNameById = async (id: string) => {
    try {
      // Try to get from Firestore first
      const userDoc = await getDocumentById("users", id);
      if (userDoc) {
        return (userDoc as any).displayName || (userDoc as any).name || "Unknown";
      }
      
      // Fall back to in-memory data if not found in Firestore
      const teacher = getTeacherById(id);
      if (teacher) return teacher.name;
      
      const admin = getStaffById(id);
      if (admin) return admin.name;
      
      return "Unknown";
    } catch (error) {
      console.error("Error getting name by ID:", error);
      
      // Fall back to in-memory data if there's an error
      const teacher = getTeacherById(id);
      if (teacher) return teacher.name;
      
      const admin = getStaffById(id);
      if (admin) return admin.name;
      
      return "Unknown";
    }
  };

  // Handle leave request status change
  const handleStatusChange = async (leaveId: string, newStatus: LeaveStatus) => {
    if (!user) return;
    
    try {
      await firebaseUpdateLeaveStatus(leaveId, newStatus, user.id);
      
      // Refresh the leave requests list
      if (user.role === "teacher") {
        const requests = await getLeaveRequestsByTeacher(user.id);
        setLeaveRequests(requests);
      } else if (activeTab === "my-requests") {
        const requests = await getLeaveRequestsByTeacher(user.id);
        setLeaveRequests(requests);
      } else if (activeTab === "pending-approval") {
        const requests = await getLeaveRequestsByStatus("pending");
        setLeaveRequests(requests);
      } else {
        const requests = await getAllLeaveRequests();
        setLeaveRequests(requests);
      }
    } catch (error) {
      console.error("Error updating leave request status:", error);
    }
  };

  // Apply filters
  const filteredLeaveRequests = leaveRequests.filter(leave => {
    if (statusFilter !== "all" && leave.status !== statusFilter) {
      return false;
    }
    
    if (typeFilter !== "all" && leave.type !== typeFilter) {
      return false;
    }
    
    return true;
  });

  return (
    <div className="container mx-auto px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Leave Management</h1>
        
        {/* Action buttons */}
        <div className="flex space-x-2">
          <Link 
            href="/leave/apply" 
            className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition"
          >
            Apply for Leave
          </Link>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
          >
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>
        </div>
      </div>

      {/* Tabs for different views */}
      {(user?.role === "admin" || user?.role === "manager") && (
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => handleTabChange("my-requests")}
                className={`py-4 px-1 ${
                  activeTab === "my-requests"
                    ? "border-b-2 border-teal-500 text-teal-600"
                    : "border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } font-medium text-sm`}
              >
                My Leave Requests
              </button>
              <button
                onClick={() => handleTabChange("pending-approval")}
                className={`py-4 px-1 ${
                  activeTab === "pending-approval"
                    ? "border-b-2 border-teal-500 text-teal-600"
                    : "border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } font-medium text-sm`}
              >
                Pending Approval
              </button>
              <button
                onClick={() => handleTabChange("all-requests")}
                className={`py-4 px-1 ${
                  activeTab === "all-requests"
                    ? "border-b-2 border-teal-500 text-teal-600"
                    : "border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } font-medium text-sm`}
              >
                All Leave Requests
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-md mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as LeaveStatus | "all")}
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-teal-500 focus:ring-teal-500"
              >
                <option value="all">All Statuses</option>
                {Object.entries(leaveStatusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as LeaveType | "all")}
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-teal-500 focus:ring-teal-500"
              >
                <option value="all">All Types</option>
                {Object.entries(leaveTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full"></div>
          <p className="mt-2 text-gray-600">Loading leave requests...</p>
        </div>
      )}

      {/* Leave Requests Table */}
      {!loading && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Staff
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dates
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLeaveRequests.length > 0 ? (
                filteredLeaveRequests.map((leave) => {
                  // Use an immediately-invoked function to handle the async name retrieval
                  const [teacherName, setTeacherName] = useState<string>("Loading...");
                  
                  useEffect(() => {
                    const loadTeacherName = async () => {
                      const name = await getNameById(leave.teacherId);
                      setTeacherName(name);
                    };
                    
                    loadTeacherName();
                  }, [leave.teacherId]);
                  
                  return (
                    <tr key={leave.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{teacherName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{leaveTypeLabels[leave.type]}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {format(new Date(leave.startDate), "MMM d, yyyy")} - {format(new Date(leave.endDate), "MMM d, yyyy")}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${leave.status === "approved" ? "bg-green-100 text-green-800" : 
                            leave.status === "rejected" ? "bg-red-100 text-red-800" : 
                            leave.status === "pending" ? "bg-yellow-100 text-yellow-800" : 
                            "bg-gray-100 text-gray-800"}`}>
                          {leaveStatusLabels[leave.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Link
                            href={`/leave/${leave.id}`}
                            className="text-teal-600 hover:text-teal-900"
                          >
                            View
                          </Link>
                          
                          {/* Show approve/reject buttons for pending requests if user is admin/manager */}
                          {leave.status === "pending" && (user?.role === "admin" || user?.role === "manager") && (
                            <>
                              <button
                                onClick={() => handleStatusChange(leave.id, "approved")}
                                className="text-green-600 hover:text-green-900"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleStatusChange(leave.id, "rejected")}
                                className="text-red-600 hover:text-red-900"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          
                          {/* Show cancel button for own pending requests */}
                          {leave.status === "pending" && leave.teacherId === user?.id && (
                            <button
                              onClick={() => handleStatusChange(leave.id, "cancelled")}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    No leave requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 