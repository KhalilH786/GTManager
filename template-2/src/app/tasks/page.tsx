"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { 
  tasks as initialTasks, 
  teachers, 
  groups, 
  getTeacherById, 
  getStaffById, 
  staff, 
  getTasksCreatedByTeacher,
  getTasksForGroup,
  getCreatorById,
  TaskStatus,
  PriorityLevel
} from "@/lib/data";
// Import Task interface instead of defining it here
import { Task } from "./types";
import TaskStatusBadge from "../../components/TaskStatusBadge";
import { format, addDays, isAfter, isBefore, parseISO } from "date-fns";
import { useAuth } from "@/lib/contexts/AuthContext";
import { 
  getAllTasks, 
  getTasksForTeacher, 
  getTasksCreatedByTeacher as getTasksCreatedByTeacherFromFirestore,
  getAllTaskStatuses,
  getDocuments
} from "@/lib/firebase/firebaseUtils";
import { getDocumentById } from "@/lib/firebase/firebaseUtils";

export default function TasksPage() {
  const auth = useAuth();
  const user = auth?.user;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<"active" | "submitted" | "completed" | "created" | "to_review" | "groups" | "teacher_groups">("active");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [teacherFilter, setTeacherFilter] = useState<string>("all");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [assignedByFilter, setAssignedByFilter] = useState<string>("all");
  const [dueNext7DaysFilter, setDueNext7DaysFilter] = useState<boolean>(false);
  const [dueNext30DaysFilter, setDueNext30DaysFilter] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [tasks, setTasks] = useState<typeof initialTasks>([]);
  const [userTasks, setUserTasks] = useState<typeof initialTasks>([]);
  const [sortColumn, setSortColumn] = useState<string>("dueDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [pageLoadCount, setPageLoadCount] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedTaskVisible, setSelectedTaskVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignerCache, setAssignerCache] = useState<Record<string, any>>({});
  const [assigneeCache, setAssigneeCache] = useState<Record<string, any>>({});
  const [taskStatuses, setTaskStatuses] = useState<any[]>([]);
  const [teacherGroups, setTeacherGroups] = useState<any[]>([]);

  // Set active tab based on URL parameter on component mount
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && (
      tabParam === "active" || 
      tabParam === "submitted" || 
      tabParam === "completed" || 
      tabParam === "created" || 
      tabParam === "to_review" || 
      tabParam === "groups" ||
      tabParam === "teacher_groups"
    )) {
      setActiveTab(tabParam as any);
    }
  }, [searchParams]);

  // Update URL when tab changes
  const handleTabChange = (tab: "active" | "submitted" | "completed" | "created" | "to_review" | "groups" | "teacher_groups") => {
    setActiveTab(tab);
    
    // Create new URL with the tab parameter
    const params = new URLSearchParams(searchParams);
    params.set('tab', tab);
    router.push(`${pathname}?${params.toString()}`);
  };

  // Refresh task list when component mounts or when pathname changes
  useEffect(() => {
    console.log("Tasks page mounted or path changed. Refreshing task data...");
    fetchTasksData();
    fetchTaskStatuses();
    fetchTeacherGroups();
  }, [pathname, user]);

  // Fetch tasks from Firestore, no fallback to initialTasks
  const fetchTasksData = async () => {
    setLoading(true);
    try {
      let fetchedTasks = [];
      
      // Fetch data based on user role
      if (user && user.role === "teacher") {
        // For teachers, fetch tasks assigned to them and tasks created by them
        const assignedTasks = await getTasksForTeacher(user.id);
        const createdTasks = await getTasksCreatedByTeacherFromFirestore(user.id);
        
        // Get groups the teacher belongs to
        const teacherGroups = await getDocuments("groups");
        const userGroupIds = teacherGroups
          .filter(group => group.members && Array.isArray(group.members) && group.members.includes(user.id))
          .map(group => group.id);
        
        // Fetch tasks assigned to those groups
        let groupTasks: any[] = [];
        for (const groupId of userGroupIds) {
          const tasksForGroup = await getTasksForGroup(groupId);
          groupTasks = [...groupTasks, ...tasksForGroup];
        }
        
        // Combine the three sets of tasks, avoiding duplicates
        const taskMap = new Map();
        [...assignedTasks, ...createdTasks, ...groupTasks].forEach(task => {
          taskMap.set(task.id, task);
        });
        
        fetchedTasks = Array.from(taskMap.values());
      } else {
        // For managers and admins, fetch all tasks
        fetchedTasks = await getAllTasks();
      }
      
      console.log(`Fetched ${fetchedTasks.length} tasks from Firestore`);
      if (fetchedTasks.length === 0) {
        console.log("No tasks found in Firestore, you may need to create some tasks");
      } else {
        console.log("Task statuses:", fetchedTasks.map(t => t.status).join(", "));
      }
      
      // Always use Firestore data, never fall back to initialTasks
      setTasks(fetchedTasks);
      
      // Pre-fetch assigner data for efficiency
      const assignerIds = fetchedTasks
        .map(task => task.assignedBy)
        .filter(Boolean) as string[];
      
      // Create unique list without using Set iteration
      const uniqueAssignerIds: string[] = [];
      assignerIds.forEach((id: string) => {
        if (!uniqueAssignerIds.includes(id)) {
          uniqueAssignerIds.push(id);
        }
      });
      
      if (uniqueAssignerIds.length > 0) {
        const assignerMap: Record<string, any> = {};
        for (let i = 0; i < uniqueAssignerIds.length; i++) {
          const id = uniqueAssignerIds[i];
          try {
            const assignerData = await getDocumentById("users", id);
            if (assignerData) {
              assignerMap[id] = assignerData;
            }
          } catch (error) {
            console.error(`Error fetching assigner data for ${id}:`, error);
          }
        }
        setAssignerCache(assignerMap);
      }
      
      // Pre-fetch assignee data for efficiency
      const allAssigneeIds: string[] = [];
      fetchedTasks.forEach(task => {
        if (task.assignedTo && Array.isArray(task.assignedTo)) {
          task.assignedTo.forEach(id => allAssigneeIds.push(id));
        }
      });
      
      // Create unique list without using Set iteration
      const uniqueAssigneeIds: string[] = [];
      allAssigneeIds.forEach((id: string) => {
        if (!uniqueAssigneeIds.includes(id)) {
          uniqueAssigneeIds.push(id);
        }
      });
      
      if (uniqueAssigneeIds.length > 0) {
        const assigneeMap: Record<string, any> = {};
        for (let i = 0; i < uniqueAssigneeIds.length; i++) {
          const id = uniqueAssigneeIds[i];
          try {
            const assigneeData = await getDocumentById("users", id);
            if (assigneeData) {
              assigneeMap[id] = assigneeData;
            }
          } catch (error) {
            console.error(`Error fetching assignee data for ${id}:`, error);
          }
        }
        setAssigneeCache(assigneeMap);
      }
    } catch (error) {
      console.error("Error fetching tasks from Firestore:", error);
      // Show an error state instead of falling back to initialTasks
      setError("Failed to load tasks from database. Please try again later.");
      setTasks([]);
    } finally {
      setLoading(false);
    setPageLoadCount(prev => prev + 1);
    }
  };

  // Fetch task statuses from Firestore
  const fetchTaskStatuses = async () => {
    try {
      const statuses = await getAllTaskStatuses();
      console.log("Fetched task statuses:", statuses);
      setTaskStatuses(statuses);
    } catch (error) {
      console.error("Error fetching task statuses:", error);
    }
  };

  // Fetch teacher groups from Firestore
  const fetchTeacherGroups = async () => {
    try {
      const fetchedGroups = await getDocuments("groups");
      console.log("Fetched teacher groups:", fetchedGroups);
      setTeacherGroups(fetchedGroups);
      
      // Get all unique teacher IDs from all groups
      const teacherIds: string[] = [];
      fetchedGroups.forEach(group => {
        if (group.members && Array.isArray(group.members)) {
          group.members.forEach((memberId: string) => {
            if (!teacherIds.includes(memberId)) {
              teacherIds.push(memberId);
            }
          });
        }
      });
      
      // Fetch data for each teacher and update the cache
      const teacherCache: Record<string, any> = { ...assigneeCache };
      for (const teacherId of teacherIds) {
        try {
          // Skip if we already have this teacher in the cache
          if (teacherCache[teacherId]) continue;
          
          const teacherData = await getDocumentById("users", teacherId);
          if (teacherData) {
            teacherCache[teacherId] = teacherData;
          }
        } catch (error) {
          console.error(`Error fetching teacher data for ${teacherId}:`, error);
        }
      }
      
      // Update the cache with all the teacher data
      setAssigneeCache(teacherCache);
    } catch (error) {
      console.error("Error fetching teacher groups:", error);
    }
  };

  // Determine which tasks to show based on user and active tab
  useEffect(() => {
    if (user) {
      if (user.role === "teacher") {
        if (activeTab === "created") {
          // Show tasks created by this teacher
          setUserTasks(tasks.filter(task => task.createdBy === user.id));
        } else if (activeTab === "to_review") {
          // Show tasks to review for this teacher (assigned by this teacher and complete_for_approval)
          const reviewTasks = tasks.filter(task => 
            task.assignedBy === user.id && 
            task.status === "complete_for_approval"
          );
          console.log(`Setting userTasks for to_review tab - found ${reviewTasks.length} tasks`);
          setUserTasks(reviewTasks);
        } else {
          // Show tasks assigned to this teacher
          setUserTasks(tasks.filter(task => task.assignedTo.includes(user.id)));
        }
        // Reset filters that don't apply to teachers
        setTeacherFilter("all");
        setGroupFilter("all");
      } else {
        // Manager sees all tasks
        setUserTasks(tasks);
      }
    }
  }, [user, tasks, activeTab]);

  // Handle task completion
  const handleTaskCompletion = (taskId: string, completed: boolean) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId 
          ? { ...task, status: completed ? "complete_for_approval" : "in_progress" } 
          : task
      )
    );
  };

  // Handle task archiving
  const handleArchiveTask = (taskId: string, archive: boolean) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId 
          ? { ...task, status: archive ? "archived" : "complete_for_approval" } 
          : task
      )
    );
  };

  // Apply filters to tasks
  const filteredTasks = userTasks.filter(task => {
    // Skip archived tasks unless specifically viewing the archived tab
    if (task.status === "archived" && activeTab !== "archived") return false;

    // Status filter
    if (statusFilter !== "all" && task.status !== statusFilter) return false;

    // Teacher filter (for managers)
    if (teacherFilter !== "all" && (!task.assignedTo || !task.assignedTo.includes(teacherFilter))) return false;

    // Group filter (for managers)
    if (groupFilter !== "all") {
      // Check if the task is assigned to the selected group
      if (!task.assignedToGroups || !task.assignedToGroups.includes(groupFilter)) return false;
    }

    // Due date filter
    if (dueNext7DaysFilter || dueNext30DaysFilter) {
      const dueDate = new Date(task.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const next7Days = new Date(today);
      next7Days.setDate(next7Days.getDate() + 7);
      
      const next30Days = new Date(today);
      next30Days.setDate(next30Days.getDate() + 30);
      
      if (dueNext7DaysFilter && !(dueDate >= today && dueDate <= next7Days)) {
        return false;
      }
      
      if (dueNext30DaysFilter && !(dueDate >= today && dueDate <= next30Days)) {
        return false;
      }
    }

    // Apply tab-specific filters
    if (activeTab === "active") {
      // Show only outstanding and in_progress tasks
      return task.status === "outstanding" || task.status === "in_progress" || task.status === "late";
    } else if (activeTab === "submitted") {
      // Show only complete_for_approval tasks
      return task.status === "complete_for_approval";
    } else if (activeTab === "completed") {
      // Show only completed tasks
      return task.status === "approved" || task.status === "completed";
    } else if (activeTab === "groups" && user) {
      // Show only tasks assigned to groups for managers
      return task.assignedToGroups && task.assignedToGroups.length > 0;
    }
    
    return true;
  });
  
  // Log whenever tasks are filtered
  useEffect(() => {
    if (tasks.length > 0) {
      console.log(`Filtered ${filteredTasks.length} tasks out of ${userTasks.length} user tasks (${tasks.length} total tasks)`);
      console.log("Active tab:", activeTab);
      console.log("Status filter:", statusFilter);
      console.log("Due next 7 days:", dueNext7DaysFilter);
      console.log("Due next 30 days:", dueNext30DaysFilter);
      console.log("Page load count:", pageLoadCount);
      console.log("Current user role:", user?.role);
      
      // Log the status of each task to debug
      filteredTasks.forEach(task => {
        console.log(`Task ${task.id}: ${task.title} - Status: ${task.status}`);
      });

      // TEMP DEBUG: If we're on "to_review" tab and user is John Smith (ID: "1"), log tasks eligible for review
      if (activeTab === "to_review" && user?.id === "1") {
        console.log("SPECIFIC DEBUG FOR JOHN SMITH TASKS TO REVIEW:");
        const johnSmithReviewTasks = tasks.filter(task => 
          task.assignedBy === "1" && task.status === "complete_for_approval"
        );
        console.log(`Found ${johnSmithReviewTasks.length} tasks assigned by John Smith with complete_for_approval status:`);
        johnSmithReviewTasks.forEach(task => {
          console.log(`Task ID: ${task.id}, Title: ${task.title}, Assigned To: ${task.assignedTo.join(', ')}, Status: ${task.status}`);
        });
      }
    }
  }, [filteredTasks.length, tasks.length, userTasks.length, activeTab, statusFilter, dueNext7DaysFilter, dueNext30DaysFilter, pageLoadCount, user?.role]);

  // Sort tasks by due date (closest first)
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const multiplier = sortDirection === "asc" ? 1 : -1;
    
    switch (sortColumn) {
      case "title":
        return multiplier * a.title.localeCompare(b.title);
      case "assignedTo":
        // Sort by first assignee's name for simplicity
        const aTeacher = getTeacherById(a.assignedTo[0])?.name || "";
        const bTeacher = getTeacherById(b.assignedTo[0])?.name || "";
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
      case "description":
        return multiplier * a.description.localeCompare(b.description);
      default:
        return multiplier * (new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    }
  });

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

  const getAssigneeNames = (assignedToIds: string[]) => {
    if (!assignedToIds || assignedToIds.length === 0) {
      return 'None assigned';
    }
    
    return assignedToIds.map(id => {
      // First check our pre-fetched cache
      if (assigneeCache[id]) {
        const teacher = assigneeCache[id];
        return user && teacher.id === user.id 
          ? `${teacher.displayName || teacher.email} (You)` 
          : teacher.displayName || teacher.email;
      }
      
      // Fallback to old method if not in cache
      const teacher = getTeacherById(id);
      return teacher ? (
        user && teacher.id === user.id 
          ? `${teacher.name} (You)` 
          : teacher.name
      ) : 'Unknown';
    }).join(', ');
  };

  const getAssignerName = (task: any) => {
    // If the task has assignerData directly, use that first
    if (task.assignerData) {
      return task.assignerData.displayName || task.assignerData.email || "Unknown";
    }
    
    const assignerId = task.assignedBy;
    if (!assignerId) {
      return 'Unknown';
    }
    
    // Check our pre-fetched cache
    if (assignerCache[assignerId]) {
      const assigner = assignerCache[assignerId];
      return assigner.displayName || assigner.email || 'Unknown';
    }
    
    // Otherwise fall back to existing method
    const staff = getStaffById(assignerId);
    const teacher = getTeacherById(assignerId);
    return staff?.name || teacher?.name || 'Unknown';
  };

  // Teacher Groups tab content
  if (activeTab === "teacher_groups") {
  return (
      <div className="container min-h-screen mx-auto px-4 py-8">
        {/* Header and tabs (same as before) */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div className="mb-4 md:mb-0">
            <h1 className="text-2xl font-bold">Task Management</h1>
            <p className="text-gray-600 mt-1">
            {user?.role === "teacher" 
                ? "Manage your tasks and assignments" 
                : "Manage all staff tasks and assignments"}
          </p>
        </div>
          <div className="flex space-x-2">
              <Link
                href="/tasks/create-teacher-task"
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
              >
                Create Task
              </Link>
          </div>
      </div>

        {/* Task tabs */}
        <div className="mb-6 overflow-x-auto">
          <div className="flex space-x-1 border-b">
          <button
              className={`px-6 py-4 text-sm font-medium ${
              activeTab === "active"
                  ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
              onClick={() => handleTabChange("active")}
          >
              Active
          </button>
          <button
              className={`px-6 py-4 text-sm font-medium ${
              activeTab === "submitted"
                  ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
              onClick={() => handleTabChange("submitted")}
          >
              Submitted
          </button>
          <button
              className={`px-6 py-4 text-sm font-medium ${
              activeTab === "completed"
                  ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
              onClick={() => handleTabChange("completed")}
          >
              Completed
          </button>
          <button
              className={`px-6 py-4 text-sm font-medium ${
              activeTab === "created"
                  ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
              onClick={() => handleTabChange("created")}
          >
              Created By Me
          </button>
          <button
              className={`px-6 py-4 text-sm font-medium ${
              activeTab === "to_review"
                  ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
              onClick={() => handleTabChange("to_review")}
          >
              To Review
          </button>
          <button
              className={`px-6 py-4 text-sm font-medium ${
                activeTab === "teacher_groups"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => handleTabChange("teacher_groups")}
            >
              Teacher Groups
            </button>
            {user?.role === "manager" && (
              <button
                className={`px-6 py-4 text-sm font-medium ${
              activeTab === "groups"
                    ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
                onClick={() => handleTabChange("groups")}
          >
                Group Tasks
          </button>
            )}
        </div>
        </div>

        {/* Teacher Groups content */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Teacher Groups</h2>
            <p className="text-gray-600 mb-6">
              View all teacher groups and their members for quick reference when assigning tasks.
            </p>
            
            {loading ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
                <p className="text-gray-500">Loading teacher groups...</p>
              </div>
            ) : teacherGroups.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teacherGroups.map(group => (
                  <div 
                    key={group.id} 
                    className="border border-gray-200 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
                  >
                    <h3 className="text-lg font-semibold text-gray-800">{group.name}</h3>
                    <p className="text-sm text-gray-500 mb-3">{group.members?.length || 0} members</p>
                    
                    <div className="space-y-2 mt-3">
                      {group.members && group.members.length > 0 ? (
                        <ul className="space-y-2">
                          {group.members.map((memberId: string) => {
                            // Check if we have the teacher in the assignee cache
                            const teacher = assigneeCache[memberId];
                            const displayName = teacher 
                              ? (teacher.displayName || teacher.email) 
                              : "Unknown Teacher";
                              
                            return (
                              <li key={memberId} className="flex items-center">
                                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 mr-2">
                                  {displayName.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-sm">{displayName}</span>
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">No members in this group</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <p className="text-gray-600">No teacher groups found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container min-h-screen mx-auto px-4 py-8">
      {/* Header and tabs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div className="mb-4 md:mb-0">
          <h1 className="text-2xl font-bold">Task Management</h1>
          <p className="text-gray-600 mt-1">
            {user?.role === "teacher" 
              ? "Manage your tasks and assignments" 
              : "Manage all staff tasks and assignments"}
          </p>
        </div>
        <div className="flex space-x-2">
          <Link
            href="/tasks/create-teacher-task"
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
          >
            Create Task
          </Link>
        </div>
      </div>

      {/* Task tabs and content */}
      <div className="mb-6 overflow-x-auto">
        <div className="flex space-x-1 border-b">
          <button
            className={`px-6 py-4 text-sm font-medium ${
              activeTab === "active"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => handleTabChange("active")}
          >
            Active
          </button>
          <button
            className={`px-6 py-4 text-sm font-medium ${
              activeTab === "submitted"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => handleTabChange("submitted")}
          >
            Submitted
          </button>
          <button
            className={`px-6 py-4 text-sm font-medium ${
              activeTab === "completed"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => handleTabChange("completed")}
          >
            Completed
          </button>
          <button
            className={`px-6 py-4 text-sm font-medium ${
              activeTab === "created"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => handleTabChange("created")}
          >
            Created By Me
          </button>
          <button
            className={`px-6 py-4 text-sm font-medium ${
              activeTab === "to_review"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => handleTabChange("to_review")}
          >
            To Review
          </button>
          <button
            className={`px-6 py-4 text-sm font-medium ${
              activeTab === "teacher_groups"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => handleTabChange("teacher_groups")}
          >
            Teacher Groups
          </button>
          {user?.role === "manager" && (
            <button
              className={`px-6 py-4 text-sm font-medium ${
                activeTab === "groups"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => handleTabChange("groups")}
            >
              Group Tasks
            </button>
          )}
        </div>
      </div>

      {/* Error message display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Filter and search */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
                {taskStatuses.length > 0 ? (
                  taskStatuses.map(status => (
                    <option key={status.id} value={status.id}>
                      {status.name}
                    </option>
                  ))
                ) : (
                  <>
                  <option value="outstanding">Outstanding</option>
                  <option value="in_progress">In Progress</option>
                  <option value="complete_for_approval">Complete for approval</option>
                  <option value="late">Late</option>
                  <option value="archived">Archived</option>
                  </>
                )}
                </select>
              </div>
              
              <div>
                <label htmlFor="assignedBy" className="block text-sm font-medium text-gray-700 mb-1">
                  Assigned By
                </label>
                <select
                  id="assignedBy"
                  value={teacherFilter}
                  onChange={(e) => setTeacherFilter(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
                >
                  <option value="all">All Teachers</option>
                  {teachers.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="dueNext7Days" className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date Filters
                </label>
                <div className="mt-1 flex items-center">
                  <input
                    type="checkbox"
                    id="dueNext7Days"
                    checked={dueNext7DaysFilter}
                    onChange={() => {
                      setDueNext7DaysFilter(!dueNext7DaysFilter);
                      if (!dueNext7DaysFilter) setDueNext30DaysFilter(false); // If enabling 7 days, disable 30 days
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  />
                  <label htmlFor="dueNext7Days" className="ml-2 text-sm text-gray-700">
                    Due next 7 days
                  </label>
                </div>
                <div className="mt-1 flex items-center">
                  <input
                    type="checkbox"
                    id="dueNext30Days"
                    checked={dueNext30DaysFilter}
                    onChange={() => {
                      setDueNext30DaysFilter(!dueNext30DaysFilter);
                      if (!dueNext30DaysFilter) setDueNext7DaysFilter(false); // If enabling 30 days, disable 7 days
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  />
                  <label htmlFor="dueNext30Days" className="ml-2 text-sm text-gray-700">
                    Due next 30 days
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      
      {/* Tasks list */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
            <p className="text-gray-500">Loading tasks...</p>
          </div>
        ) : filteredTasks.length > 0 ? (
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
                    {(user?.role === "manager" || activeTab === "created") && (
                      <th 
                        className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("assignedTo")}
                      >
                        Assigned To {renderSortIndicator("assignedTo")}
                      </th>
                    )}
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
                    {user?.role === "teacher" && activeTab === "active" && (
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Archive
                      </th>
                    )}
                    <th className="px-6 py-3 bg-gray-50"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedTasks.map((task) => (
                    <tr key={task.id}>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{task.title}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {task.description.length > 100
                            ? `${task.description.substring(0, 100)}...`
                            : task.description}
                        </div>
                      </td>
                      {(user?.role === "manager" || activeTab === "created") && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {getAssigneeNames(task.assignedTo)}
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                        {getAssignerName(task)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                        {task.dueDate && typeof task.dueDate === 'object' && 'seconds' in task.dueDate
                          ? format(new Date((task.dueDate as any).seconds * 1000), "MMM d, yyyy")
                          : task.dueDate && typeof task.dueDate === 'string' && !isNaN(new Date(task.dueDate).getTime())
                            ? format(new Date(task.dueDate), "MMM d, yyyy")
                            : task.dueDate && typeof task.dueDate === 'object'
                              ? format(task.dueDate as unknown as Date, "MMM d, yyyy")
                              : "No date set"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <TaskStatusBadge status={task.status} />
                      </td>
                      {user?.role === "manager" && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {task.status === "outstanding" ? (
                            <Link 
                              href={`/tasks/${task.id}/submit`} 
                              className="text-teal-600 hover:text-teal-900 font-medium"
                            >
                              Submit task
                            </Link>
                          ) : activeTab === "submitted" ? (
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={task.status === "complete_for_approval"}
                                  onChange={(e) => handleTaskCompletion(task.id, e.target.checked)}
                                  className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                                />
                                <span className="ml-2 text-sm text-gray-600">Approve</span>
                              </div>
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  onChange={(e) => handleArchiveTask(task.id, e.target.checked)}
                                  className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                                />
                                <span className="ml-2 text-sm text-gray-600">Archive</span>
                              </div>
                            </div>
                          ) : (
                            <input
                              type="checkbox"
                              checked={task.status === "complete_for_approval"}
                              onChange={(e) => handleTaskCompletion(task.id, e.target.checked)}
                              className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                            />
                          )}
                        </td>
                      )}
                      {user?.role === "teacher" && activeTab === "submitted" && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              onChange={(e) => handleArchiveTask(task.id, e.target.checked)}
                              className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-600">Archive</span>
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link href={`/tasks/${task.id}`} className="text-teal-600 hover:text-teal-900 mr-4">
                          View
                        </Link>
                        {user?.role === "manager" && (
                          <Link href={`/tasks/${task.id}/edit`} className="text-teal-600 hover:text-teal-900">
                            Edit
                          </Link>
                        )}
                        {user?.role === "teacher" && activeTab === "completed" && (
                          <button
                            onClick={() => handleArchiveTask(task.id, false)}
                            className="text-teal-600 hover:text-teal-900"
                          >
                            Unarchive
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
          <div className="p-8 text-center">
            <p className="text-gray-500 mb-2">
              {searchQuery
                ? "No tasks found matching your search criteria."
                : "No tasks found. Tasks will appear here once they have been assigned."}
            </p>
            {user?.role !== "teacher" && (
              <Link
                href="/tasks/create-teacher-task"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Create your first task
              </Link>
          )}
        </div>
      )}
      </div>
    </div>
  );
} 