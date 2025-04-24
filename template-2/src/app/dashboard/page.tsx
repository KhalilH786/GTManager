"use client";

import Link from "next/link";
import { tasks, teachers, groups, getStaffById } from "@/lib/data";
import TaskStatusBadge from "../../components/TaskStatusBadge";
import PriorityBadge from "../../components/PriorityBadge";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { getTasksForTeacher, getAllTasks } from "@/lib/firebase/firebaseUtils";
import { useAuth } from "@/lib/contexts/AuthContext";

export default function Dashboard() {
  // Sort state
  const [sortColumn, setSortColumn] = useState<string>("dueDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Replace the teacher data loading to use Firestore
  const { user } = useAuth();
  const [teacherTasks, setTeacherTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Sort tasks by due date (closest first)
  const sortedTasks = [...tasks].sort((a, b) => {
    const multiplier = sortDirection === "asc" ? 1 : -1;
    
    switch (sortColumn) {
      case "title":
        return multiplier * a.title.localeCompare(b.title);
      case "assignedTo":
        // Sort by first assignee's name
        const aTeacher = teachers.find(t => a.assignedTo[0] === t.id)?.name || "";
        const bTeacher = teachers.find(t => b.assignedTo[0] === t.id)?.name || "";
        return multiplier * aTeacher.localeCompare(bTeacher);
      case "assignedBy":
        // Sort by who assigned the task
        const aStaff = getStaffById(a.assignedBy)?.name || "";
        const bStaff = getStaffById(b.assignedBy)?.name || "";
        return multiplier * aStaff.localeCompare(bStaff);
      case "dueDate":
        return multiplier * (new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
      case "status":
        return multiplier * a.status.localeCompare(b.status);
      case "priority":
        // Custom priority order
        const priorityOrder = { low: 0, medium: 1, high: 2, urgent: 3 };
        return multiplier * (priorityOrder[a.priority] - priorityOrder[b.priority]);
      default:
        return multiplier * (new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    }
  });

  // Get upcoming tasks (due in the next 7 days)
  const now = new Date();
  const in7Days = new Date();
  in7Days.setDate(now.getDate() + 7);
  
  const upcomingTasks = sortedTasks.filter(task => {
    const dueDate = new Date(task.dueDate);
    return dueDate > now && dueDate <= in7Days && task.status !== "complete_for_approval";
  });

  // Get task counts by status
  const outstandingTasks = tasks.filter(task => task.status === "outstanding").length;
  const inProgressTasks = tasks.filter(task => task.status === "in_progress").length;
  const completedTasks = tasks.filter(task => task.status === "complete_for_approval").length;
  const lateTasks = tasks.filter(task => task.status === "late").length;

  // Handle sort click
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new column and default to ascending
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Render sort indicator
  const renderSortIndicator = (column: string) => {
    if (sortColumn !== column) {
      return (
        <span className="ml-1 text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </span>
      );
    }
    
    return sortDirection === "asc" ? (
      <span className="ml-1 text-blue-600">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </span>
    ) : (
      <span className="ml-1 text-blue-600">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </span>
    );
  };

  // Replace the teacher data loading to use Firestore
  useEffect(() => {
    const fetchTeacherData = async () => {
      if (user && user.id) {
        try {
          // Load teacher tasks from Firestore only
          setIsLoading(true);
          let fetchedTasks;
          
          if (user.role === 'teacher') {
            // Get tasks assigned to this teacher from Firestore
            fetchedTasks = await getTasksForTeacher(user.id);
            console.log(`Loaded ${fetchedTasks.length} tasks for teacher from Firestore`);
          } else if (user.role === 'principal' || user.role === 'admin') {
            // Admins and principals see all tasks
            fetchedTasks = await getAllTasks();
            console.log(`Loaded ${fetchedTasks.length} total tasks for admin from Firestore`);
          }
          
          setTeacherTasks(fetchedTasks || []);
          setIsLoading(false);
        } catch (error) {
          console.error("Error loading teacher data from Firestore:", error);
          setIsLoading(false);
        }
      }
    };
    
    fetchTeacherData();
  }, [user]);

  return (
    <div className="container mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-600">Overview of school tasks and activities</p>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Outstanding</h3>
            <span className="text-yellow-500 bg-yellow-100 rounded-full px-3 py-1 text-sm font-medium">
              {outstandingTasks}
            </span>
          </div>
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Tasks awaiting action</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">In Progress</h3>
            <span className="text-blue-500 bg-blue-100 rounded-full px-3 py-1 text-sm font-medium">
              {inProgressTasks}
            </span>
          </div>
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Tasks currently being worked on</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Complete for approval</h3>
            <span className="text-green-500 bg-green-100 rounded-full px-3 py-1 text-sm font-medium">
              {completedTasks}
            </span>
          </div>
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Tasks awaiting approval</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Late</h3>
            <span className="text-red-500 bg-red-100 rounded-full px-3 py-1 text-sm font-medium">
              {lateTasks}
            </span>
          </div>
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Tasks past their deadline</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming tasks */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Upcoming Tasks</h2>
          <p className="text-gray-600 text-sm">Tasks due in the next 7 days</p>
        </div>
        <div className="p-6">
          {upcomingTasks.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th 
                      className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("title")}
                    >
                      Task {renderSortIndicator("title")}
                    </th>
                    <th 
                      className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("assignedTo")}
                    >
                      Assigned To {renderSortIndicator("assignedTo")}
                    </th>
                    <th 
                      className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("assignedBy")}
                    >
                      Assigned By {renderSortIndicator("assignedBy")}
                    </th>
                    <th 
                      className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("dueDate")}
                    >
                      Due Date {renderSortIndicator("dueDate")}
                    </th>
                    <th 
                      className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("status")}
                    >
                      Status {renderSortIndicator("status")}
                    </th>
                    <th 
                      className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("priority")}
                    >
                      Priority {renderSortIndicator("priority")}
                    </th>
                    <th className="px-6 py-3 bg-gray-50"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {upcomingTasks.map((task) => (
                    <tr key={task.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{task.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {task.assignedTo.map(id => {
                            const teacher = teachers.find(t => t.id === id);
                            return teacher ? teacher.name : '';
                          }).filter(Boolean).join(', ')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {getStaffById(task.assignedBy)?.name || 'Unknown'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {format(new Date(task.dueDate), "MMM d, yyyy")}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <TaskStatusBadge status={task.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <PriorityBadge priority={task.priority} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link href={`/tasks/${task.id}`} className="text-blue-600 hover:text-blue-900">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No upcoming tasks in the next 7 days.</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Teacher Stats</h2>
          </div>
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm font-medium text-gray-900">Total Teachers</div>
              <div className="text-sm font-semibold">{teachers.length}</div>
            </div>
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm font-medium text-gray-900">Teacher Groups</div>
              <div className="text-sm font-semibold">{groups.length}</div>
            </div>
            <div className="mt-4">
              <Link href="/teachers" className="text-blue-600 hover:text-blue-900 text-sm font-medium">
                View All Teachers →
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Task Stats</h2>
          </div>
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm font-medium text-gray-900">Total Tasks</div>
              <div className="text-sm font-semibold">{tasks.length}</div>
            </div>
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm font-medium text-gray-900">Completion Rate</div>
              <div className="text-sm font-semibold">
                {Math.round((completedTasks / tasks.length) * 100)}%
              </div>
            </div>
            <div className="mt-4">
              <Link href="/tasks" className="text-blue-600 hover:text-blue-900 text-sm font-medium">
                View All Tasks →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 