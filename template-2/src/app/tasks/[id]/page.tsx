"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Task } from '../types';
import { getTaskById, getDocumentById, updateTaskStatus } from '@/lib/firebase/firebaseUtils';
import Image from 'next/image';
import { CalendarDays, Calendar, RefreshCw, Users, UserCircle, User } from 'lucide-react';
import LoadingSpinner from '../../../components/LoadingSpinner';

// Helper function to get status color
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'outstanding':
      return 'bg-blue-100 text-blue-800';
    case 'in_progress':
      return 'bg-yellow-100 text-yellow-800';
    case 'complete_for_approval':
      return 'bg-purple-100 text-purple-800';
    case 'approved':
      return 'bg-green-100 text-green-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function TaskDetailPage({ params }: { params: { id: string } }) {
  console.log("TaskDetailPage - loading for ID:", params.id);
  const { user } = useAuth();
  console.log("TaskDetailPage - user role:", user?.role);
  
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  
  const [assignedTeachers, setAssignedTeachers] = useState<any[]>([]);
  const [assignedGroups, setAssignedGroups] = useState<any[]>([]);
  const [creator, setCreator] = useState<any>(null);
  const [assigner, setAssigner] = useState<any>(null);
  const userRole = user?.role || 'teacher';
  
  // Check if the current user is the one who assigned this task
  const isTaskAssigner = user && task && task.assignedBy === user.id;
  
  // Function to format dates safely with a fallback
  const formatDateSafe = (date: any) => {
    if (!date) return "N/A";
    try {
      // Check if date is a Firebase Timestamp or Date object
      if (date.seconds && date.nanoseconds) {
        // Firebase Timestamp
        return format(new Date(date.seconds * 1000), "MMM dd, yyyy");
      } else if (date.toDate && typeof date.toDate === 'function') {
        // Firebase Timestamp with toDate method
        return format(date.toDate(), "MMM dd, yyyy");
      } else if (date instanceof Date) {
        // JavaScript Date object
        return format(date, "MMM dd, yyyy");
      } else if (typeof date === 'string') {
        // Try parsing string to date
        return format(new Date(date), "MMM dd, yyyy");
      } else {
        console.error("Unknown date format:", date);
        return "Invalid date";
      }
    } catch (error) {
      console.error("Error formatting date:", error, date);
      return "Invalid date";
    }
  };

  // Fetch task data from Firestore
  useEffect(() => {
    const fetchTaskData = async () => {
      setLoading(true);
      try {
        const taskData = await getTaskById(params.id);
        
        if (!taskData) {
          console.error("Task not found:", params.id);
          setError("Task not found");
          setLoading(false);
          return;
        }
        
        // Convert to proper task type with all expected properties
        const typedTaskData: Task = {
          id: params.id,
          ...taskData
        };
        
        console.log("Task found:", typedTaskData.id, typedTaskData.title, "Status:", typedTaskData.status);
        setTask(typedTaskData);
        
        // Fetch assigned teachers
        if (typedTaskData.assignedTo && typedTaskData.assignedTo.length > 0) {
          const teacherPromises = typedTaskData.assignedTo.map((id: string) => getDocumentById("users", id));
          const teacherResults = await Promise.all(teacherPromises);
          setAssignedTeachers(teacherResults.filter(Boolean));
        }
        
        // Fetch assigned groups
        if (typedTaskData.assignedToGroups && typedTaskData.assignedToGroups.length > 0) {
          const groupPromises = typedTaskData.assignedToGroups.map((id: string) => getDocumentById("groups", id));
          const groupResults = await Promise.all(groupPromises);
          setAssignedGroups(groupResults.filter(Boolean));
        }
        
        // Fetch creator
        if (typedTaskData.createdBy) {
          const creatorData = await getDocumentById("users", typedTaskData.createdBy);
          setCreator(creatorData);
          console.log("Creator data:", creatorData);
        }
        
        // Use assignerData property that comes from getTaskById or fetch if not available
        if (typedTaskData.assignerData) {
          console.log("Using assignerData:", typedTaskData.assignerData);
          setAssigner(typedTaskData.assignerData);
        } else if (typedTaskData.assignedBy) {
          console.log("Fetching assigner data manually");
          const assignerData = await getDocumentById("users", typedTaskData.assignedBy);
          if (assignerData) {
            setAssigner(assignerData);
          } else {
            console.warn(`Could not find user data for assigner ID: ${typedTaskData.assignedBy}`);
            // Create a minimal placeholder to avoid "Unknown" display
            setAssigner({ 
              id: typedTaskData.assignedBy,
              displayName: `User ${typedTaskData.assignedBy.substring(0, 4)}`,
              email: null 
            });
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching task:", error);
        setError("Error fetching task details");
        setLoading(false);
      }
    };
    
    fetchTaskData();
  }, [params.id]);
  
  // Handle task approval
  const handleApproveTask = async () => {
    if (!task) return;
    
    setProcessingAction(true);
    setActionMessage(null);
    
    try {
    console.log("Approving task:", task.id);
      await updateTaskStatus(task.id, 'approved');
      console.log("Task status updated to approved");
      setActionMessage("Task approved successfully!");
      
      // Refetch the task data to update the UI
      const updatedTask = await getTaskById(params.id);
      if (updatedTask) {
        setTask({
          id: params.id,
          ...updatedTask
        });
      }
    } catch (error) {
      console.error("Error approving task:", error);
      setError("Failed to approve task. Please try again.");
    } finally {
      setProcessingAction(false);
    }
  };
  
  // Handle task rejection (send back to in_progress)
  const handleRejectTask = async () => {
    if (!task) return;
    
    setProcessingAction(true);
    setActionMessage(null);
    
    try {
    console.log("Rejecting task:", task.id);
      await updateTaskStatus(task.id, 'in_progress');
      console.log("Task status updated to in_progress");
      setActionMessage("Task rejected and returned to assignee's active tasks list.");
      
      // Refetch the task data to update the UI
      const updatedTask = await getTaskById(params.id);
      if (updatedTask) {
        setTask({
          id: params.id,
          ...updatedTask
        });
      }
    } catch (error) {
      console.error("Error rejecting task:", error);
      setError("Failed to reject task. Please try again.");
    } finally {
      setProcessingAction(false);
    }
  };

  // Helper function to safely get user display name
  const getUserDisplayName = (userData: any) => {
    if (!userData) return "Unknown User";
    return userData.displayName || userData.email || `User ${userData.id?.substring(0, 4) || 'ID'}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-8 text-center">
        <LoadingSpinner size="lg" text="Loading task details..." color="blue-500" />
      </div>
    );
    }

  if (error || !task) {
    return (
      <div className="container mx-auto p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{error || "Task not found"}</span>
        </div>
        <div className="mt-4">
          <Link href="/tasks" className="text-blue-600 hover:text-blue-800 underline">
            <span className="inline-block mr-1">←</span> Back to Tasks
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      {actionMessage && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {actionMessage}
        </div>
      )}
      
      <div className="mb-6">
        <Link href="/tasks" className="text-blue-600 hover:text-blue-800 text-sm flex items-center">
          <span className="inline-block mr-1">←</span> Back to Tasks
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold mb-2">{task.title}</h1>
              <div className="flex flex-wrap gap-3 mb-4">
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                  {task.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </div>
                <div className="px-3 py-1 rounded-full bg-gray-100 text-gray-800 text-xs font-medium">
                  Priority: {task.priority || "Medium"}
                </div>
                {task.dueDate && (
                  <div className="px-3 py-1 rounded-full bg-gray-100 text-gray-800 text-xs font-medium">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDateSafe(task.dueDate)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {user?.role === "teacher" && (task.status === "outstanding" || task.status === "in_progress") && (
                <Link
                  href={`/tasks/${task.id}/submit`}
                  className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
                >
                  Submit Task
                </Link>
              )}
              {/* Show approve/reject buttons if the task is waiting for approval and current user is the assigner */}
              {isTaskAssigner && task.status === "complete_for_approval" && (
                <>
                  <button
                    onClick={handleApproveTask}
                    disabled={processingAction}
                    className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={handleRejectTask}
                    disabled={processingAction}
                    className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                  >
                    Return to Assignee
                  </button>
                </>
              )}
              {user?.role === "manager" && (
                <Link
                  href={`/tasks/${task.id}/edit`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  Edit Task
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-8">
            <h2 className="text-lg font-medium mb-3">Description</h2>
            <p className="text-gray-700 whitespace-pre-line">{task.description}</p>
          </div>

          {task.status === "complete_for_approval" && task.resolution && (
            <div className="mb-8">
              <h2 className="text-lg font-medium mb-3">Completion Notes</h2>
              <div className="p-4 bg-yellow-50 rounded-md border border-yellow-100">
                <p className="text-gray-700 whitespace-pre-line">{task.resolution}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div>
              <h2 className="text-lg font-medium mb-3">Assigned To</h2>
              {assignedTeachers.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {assignedTeachers.map((teacher: any) => (
                    <div key={teacher.id} className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1">
                      <div className="h-6 w-6 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                        {teacher.photoURL ? (
                          <Image
                            src={teacher.photoURL}
                            alt={teacher.displayName || teacher.name || 'Teacher'}
                            width={24}
                            height={24}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <span>{(teacher.displayName || teacher.name || 'T').charAt(0)}</span>
                        )}
                        </div>
                      <span className="text-sm font-medium">{teacher.displayName || teacher.name}</span>
                        </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No teachers assigned directly</p>
              )}
            </div>

            <div>
              <h2 className="text-lg font-medium mb-3">Assigned Groups</h2>
              {assignedGroups.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {assignedGroups.map((group: any) => (
                    <div key={group.id} className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1">
                      <span className="text-sm font-medium">{group.name}</span>
                        </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No groups assigned</p>
              )}
            </div>

            <div>
              <h2 className="text-lg font-medium mb-3">Task Info</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-1">Created By</h3>
              {creator ? (
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                    <span className="text-xs font-medium text-gray-800">
                          {creator.displayName?.split(' ').map((n: string) => n[0]).join('') || "??"}
                    </span>
                  </div>
                  <div>
                        <p className="text-sm font-medium">{creator.displayName || creator.email || "Unknown"}</p>
                        <p className="text-xs text-gray-500">{creator.role || "Staff"}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Unknown</p>
              )}
                </div>
                
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-100 rounded-full">
                    <UserCircle className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Assigned By</p>
                    <div className="flex items-center gap-2">
                      {assigner ? (
                        <>
                          <div className="w-6 h-6 rounded-full overflow-hidden border border-gray-200">
                            {assigner.photoURL ? (
                              <Image
                                src={assigner.photoURL}
                                alt={getUserDisplayName(assigner)}
                                width={24}
                                height={24}
                                className="object-cover w-full h-full"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                <span className="text-xs text-gray-600">{getUserDisplayName(assigner).charAt(0)}</span>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-700">
                            {getUserDisplayName(assigner)}
                          </p>
                        </>
                      ) : task.assignedBy ? (
                        <p className="text-xs text-gray-700">ID: {task.assignedBy}</p>
                      ) : (
                        <p className="text-xs text-gray-500">System Assigned</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-indigo-100 rounded-full">
                    <Users className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Assigned To</p>
                    <div className="mt-1">
                      {assignedTeachers && assignedTeachers.length > 0 && (
                        <div className="mb-1">
                          <p className="text-xs text-gray-500 font-medium">Teachers:</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {assignedTeachers.map((teacher) => (
                              <div key={teacher.id} className="flex items-center gap-1 bg-gray-100 rounded-full px-2 py-0.5">
                                <div className="w-4 h-4 rounded-full overflow-hidden border border-gray-200">
                                  {teacher.photoURL ? (
                                    <Image
                                      src={teacher.photoURL}
                                      alt={teacher.displayName || "Teacher"}
                                      width={16}
                                      height={16}
                                      className="object-cover w-full h-full"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                      <User className="h-2 w-2 text-gray-500" />
                                    </div>
                                  )}
                                </div>
                                <span className="text-xs">{teacher.displayName || teacher.email || "Unknown"}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {task.assignedToGroups && task.assignedToGroups.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Groups:</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {task.assignedToGroups.map((group: any) => (
                              <div key={group.id} className="bg-gray-100 rounded-full px-2 py-0.5">
                                <span className="text-xs">{group.name || "Unknown Group"}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {(!assignedTeachers || assignedTeachers.length === 0) && 
                       (!task.assignedToGroups || task.assignedToGroups.length === 0) && (
                        <p className="text-xs text-gray-500">No assignments</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {task.attachments && task.attachments.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-medium mb-3">Attachments</h2>
              <ul className="space-y-2">
                {task.attachments.map((attachment: any, index: number) => (
                  <li key={index} className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
                      </svg>
                    </div>
                    <div>
                      <Link href={attachment.url} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                        {attachment.name}
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mb-8">
            <h2 className="text-lg font-medium mb-3">Document Links</h2>
            {task.documentLinks && task.documentLinks.length > 0 ? (
              <ul className="space-y-2">
                {task.documentLinks.map((link: any, index: number) => (
                  <li key={index} className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
                      </svg>
                    </div>
                    <div>
                      <a 
                        href={link.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        {link.title}
                      </a>
                      {link.description && (
                        <p className="text-xs text-gray-500">{link.description}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No document links available</p>
            )}
          </div>

          <div>
            <h2 className="text-lg font-medium mb-3">Task History</h2>
            <div className="border-l-2 border-gray-200 pl-4 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-full">
                  <CalendarDays className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Created On</p>
                <p className="text-xs text-gray-500">
                    {formatDateSafe(task.createdAt)}
                </p>
                </div>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-100 rounded-full">
                  <RefreshCw className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Last Updated</p>
                <p className="text-xs text-gray-500">
                    {formatDateSafe(task.updatedAt)}
                </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 