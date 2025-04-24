"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { tasks, getTasksForTeacher, getTasksCreatedByTeacher, TaskStatus, PriorityLevel, staff, getTeacherById, getStaffById } from "@/lib/data";
import Link from "next/link";

type CalendarTask = {
  id: string;
  title: string;
  dueDate: string;
  status: TaskStatus;
  priority: PriorityLevel;
  assignedTo: string[];
  assignedBy: string;
  createdBy: string;
};

type DayTasks = {
  date: Date;
  tasks: CalendarTask[];
  isCurrentMonth: boolean;
};

export default function CalendarPage() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [calendarDays, setCalendarDays] = useState<DayTasks[]>([]);
  const [visibleTasks, setVisibleTasks] = useState<CalendarTask[]>([]);
  
  // Filters (from task view)
  const [activeTab, setActiveTab] = useState<"active" | "completed" | "created">("active");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [assignedByFilter, setAssignedByFilter] = useState<string>("all");

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
      
      const days: DayTasks[] = [];
      
      // Add days from the previous month
      for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
        const date = new Date(year, month - 1, lastDayOfPrevMonth - i);
        days.push({
          date,
          tasks: getTasksForDay(date),
          isCurrentMonth: false
        });
      }
      
      // Add days from the current month
      for (let i = 1; i <= lastDay.getDate(); i++) {
        const date = new Date(year, month, i);
        days.push({
          date,
          tasks: getTasksForDay(date),
          isCurrentMonth: true
        });
      }
      
      // Add days from the next month to complete the grid (6 rows x 7 columns = 42 cells)
      const daysNeeded = 42 - days.length;
      for (let i = 1; i <= daysNeeded; i++) {
        const date = new Date(year, month + 1, i);
        days.push({
          date,
          tasks: getTasksForDay(date),
          isCurrentMonth: false
        });
      }
      
      setCalendarDays(days);
    };
    
    generateCalendarDays();
  }, [currentDate, user, activeTab, statusFilter, assignedByFilter]);

  // Get tasks for a specific day, applying all filters
  const getTasksForDay = (date: Date): CalendarTask[] => {
    if (!user) return [];
    
    // Get tasks based on role and active tab
    let userTasks = [];
    
    if (user.role === "teacher") {
      if (activeTab === "created") {
        // Show tasks created by this teacher
        userTasks = getTasksCreatedByTeacher(user.id);
      } else {
        // Show tasks assigned to this teacher
        userTasks = getTasksForTeacher(user.id);
      }
    } else {
      // Managers see all tasks
      userTasks = tasks;
    }
    
    // Apply filters
    userTasks = userTasks.filter(task => {
      // Filter by active/completed tab for assigned tasks
      if (activeTab !== "created" && user.role === "teacher") {
        const matchesTab = activeTab === "active"
          ? task.status !== "completed"
          : task.status === "completed";
        
        if (!matchesTab) return false;
      }
      
      // Status filter
      const matchesStatus = statusFilter === "all" || task.status === statusFilter;
      
      // Assigned By filter
      const matchesAssignedBy = assignedByFilter === "all" || task.assignedBy === assignedByFilter;
      
      return matchesStatus && matchesAssignedBy;
    });
    
    // Filter for the specific day
    return userTasks
      .filter(task => {
        const taskDate = new Date(task.dueDate);
        return (
          taskDate.getFullYear() === date.getFullYear() &&
          taskDate.getMonth() === date.getMonth() &&
          taskDate.getDate() === date.getDate()
        );
      })
      .map(task => ({
        id: task.id,
        title: task.title,
        dueDate: task.dueDate,
        status: task.status,
        priority: task.priority,
        assignedTo: task.assignedTo,
        assignedBy: task.assignedBy,
        createdBy: task.createdBy
      }));
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
  const handleDayClick = (day: DayTasks) => {
    setSelectedDate(day.date);
    setVisibleTasks(day.tasks);
  };

  // Format date for display
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  };

  // Get task status color
  const getStatusColor = (status: TaskStatus): string => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'delayed': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  // Get priority color
  const getPriorityColor = (priority: PriorityLevel): string => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Task Calendar</h1>
          <p className="text-gray-600">View your tasks organized by due date</p>
        </div>
        
        {user && (
          <div>
            {user.role === "teacher" && (
              <Link
                href="/tasks/create-teacher-task"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium shadow-sm"
              >
                Create Task
              </Link>
            )}
            
            {user.role === "manager" && (
              <Link 
                href="/tasks/create" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium shadow-sm"
              >
                Create Task
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Teacher tabs */}
      {user?.role === "teacher" && (
        <div className="flex border-b mb-6">
          <button
            onClick={() => setActiveTab("active")}
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === "active"
                ? "border-b-2 border-teal-500 text-teal-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Active Tasks
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === "completed"
                ? "border-b-2 border-teal-500 text-teal-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Completed Tasks
          </button>
          <button
            onClick={() => setActiveTab("created")}
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === "created"
                ? "border-b-2 border-teal-500 text-teal-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Assigned by Me
          </button>
        </div>
      )}

      {/* Filter controls */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="delayed">Delayed</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="assignedBy" className="block text-sm font-medium text-gray-700 mb-1">
                Assigned By
              </label>
              <select
                id="assignedBy"
                value={assignedByFilter}
                onChange={(e) => setAssignedByFilter(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
              >
                <option value="all">All Staff</option>
                {staff.map(member => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Calendar */}
        <div className="w-full bg-white rounded-lg shadow">
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
                    className={`p-1 min-h-[80px] border ${isSelected ? 'border-teal-500' : 'border-gray-200'} 
                      ${day.isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-500'} 
                      ${isToday ? 'ring-2 ring-teal-400' : ''} 
                      cursor-pointer hover:bg-gray-50 transition`}
                  >
                    <div className="text-right px-1 font-medium">{day.date.getDate()}</div>
                    <div className="mt-1">
                      {day.tasks.length > 0 && (
                        <div className="flex flex-col gap-1">
                          {day.tasks.slice(0, 2).map(task => (
                            <div 
                              key={task.id} 
                              className={`text-xs p-1 rounded ${getStatusColor(task.status)} truncate`}
                            >
                              {task.title}
                            </div>
                          ))}
                          {day.tasks.length > 2 && (
                            <div className="text-xs text-gray-500 pl-1">
                              +{day.tasks.length - 2} more
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
        
        {/* Task details for selected day */}
        <div className="w-full bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">
              {selectedDate 
                ? selectedDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric'
                  })
                : 'Select a day to view tasks'}
            </h2>
          </div>
          
          <div className="p-4">
            {selectedDate ? (
              visibleTasks.length > 0 ? (
                <div className="space-y-4">
                  {visibleTasks.map((task) => (
                    <div key={task.id} className="border rounded-md p-3">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium">{task.title}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        <div>Assigned by: {getStaffById(task.assignedBy)?.name || getTeacherById(task.assignedBy)?.name || 'Unknown'}</div>
                      </div>
                      <div className="flex justify-end mt-2">
                        <a href={`/tasks/${task.id}`} className="text-teal-600 hover:text-teal-800 text-sm font-medium">
                          View Details
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-6">No tasks for this day</p>
              )
            ) : (
              <p className="text-gray-500 text-center py-6">Select a day to view tasks</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 