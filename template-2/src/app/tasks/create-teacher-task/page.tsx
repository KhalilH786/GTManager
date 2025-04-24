"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PriorityLevel } from "@/lib/data";
import { useAuth } from "@/lib/contexts/AuthContext";
import { createTask, getAllTeachers, getAllGroups } from "@/lib/firebase/firebaseUtils";

export default function CreateTeacherTaskPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  // Debug info for authentication
  console.log('Create teacher task page - User role:', user?.role);
  console.log('Create teacher task page - User details:', user ? JSON.stringify({
    id: user.id, 
    role: user.role,
    isAuthenticated: !!user
  }) : 'Not authenticated yet');
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedToTeachers, setAssignedToTeachers] = useState<string[]>([]);
  const [assignedToGroups, setAssignedToGroups] = useState<string[]>([]);
  const [assignToSelf, setAssignToSelf] = useState(false);
  const [dueDate, setDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [documentLinks, setDocumentLinks] = useState<string[]>([]);
  const [newDocumentLink, setNewDocumentLink] = useState("");
  const [teachers, setTeachers] = useState<Array<{id: string, name: string, role: string}>>([]);
  const [groups, setGroups] = useState<Array<{id: string, name: string, description?: string, members: string[]}>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  
  // Fetch teachers from Firestore
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setIsLoading(true);
        const teachersData = await getAllTeachers();
        console.log("Fetched teachers from Firestore:", teachersData);
        setTeachers(teachersData);
      } catch (error) {
        console.error("Error fetching teachers:", error);
        setError("Failed to load teachers. Using local data as fallback.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTeachers();
  }, []);
  
  // Fetch groups from Firestore
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setIsLoadingGroups(true);
        const groupsData = await getAllGroups() as Array<{id: string, name: string, description?: string, members: string[]}>;
        console.log("Fetched groups from Firestore:", groupsData);
        setGroups(groupsData);
      } catch (error) {
        console.error("Error fetching groups:", error);
        setError("Failed to load groups. Please try again or assign to individual teachers.");
      } finally {
        setIsLoadingGroups(false);
      }
    };
    
    fetchGroups();
  }, []);
  
  // Redirect if not a teacher - with updated logic
  useEffect(() => {
    // Wait for authentication to be fully loaded
    if (isLoading) {
      console.log('Authentication still loading...');
      return;
    }
    
    // Only redirect after auth is loaded and user is present
    if (user) {
      console.log('Checking user role for redirect:', user.role);
      const userRole = user.role?.toLowerCase() || '';
      
      // Check if role is NOT "teacher"
      if (userRole !== 'teacher') {
        console.log('User role check failed, redirecting:', user.role);
      router.push("/tasks");
      } else {
        console.log('User is a teacher, allowing access');
      }
    } else if (!isLoading) {
      // User not authenticated after loading completed
      console.log('User not authenticated, redirecting to login');
      router.push("/login");
    }
  }, [user, isLoading, router]);

  // Handle teacher selection
  const handleTeacherChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    
    // Allow selecting current user if assignToSelf is true
    if (user && !assignToSelf) {
      setAssignedToTeachers(selectedOptions.filter(id => id !== user.id));
    } else {
      setAssignedToTeachers(selectedOptions);
    }
  };

  // Handle assign to self checkbox
  const handleAssignToSelfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setAssignToSelf(isChecked);
    
    if (isChecked && user) {
      // Add self to assigned teachers if not already there
      if (!assignedToTeachers.includes(user.id)) {
        setAssignedToTeachers([...assignedToTeachers, user.id]);
      }
    } else if (user) {
      // Remove self from assigned teachers
      setAssignedToTeachers(assignedToTeachers.filter(id => id !== user.id));
    }
  };

  // Handle group selection
  const handleGroupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setAssignedToGroups(selectedOptions);
  };

  // Add document link
  const addDocumentLink = () => {
    if (!newDocumentLink.trim()) return;
    
    // Basic URL validation
    let urlToAdd = newDocumentLink;
    if (!/^https?:\/\//i.test(urlToAdd)) {
      urlToAdd = `https://${urlToAdd}`;
    }
    
    setDocumentLinks([...documentLinks, urlToAdd]);
    setNewDocumentLink("");
  };

  // Remove document link
  const removeDocumentLink = (index: number) => {
    const updatedLinks = [...documentLinks];
    updatedLinks.splice(index, 1);
    setDocumentLinks(updatedLinks);
  };

  // Handle keydown for document link input
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addDocumentLink();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (!title || !description || !dueDate) {
        throw new Error("Please fill in all required fields");
      }

      if (assignedToTeachers.length === 0 && assignedToGroups.length === 0) {
        throw new Error("Please assign to at least one teacher or group");
      }

      if (!user) {
        throw new Error("You must be logged in to create a task");
      }
      
      // Prepare task data for Firestore
      const taskData = {
        title,
        description,
        assignedTo: assignedToTeachers,
        assignedToGroups,
        assignedBy: user.id,
        createdBy: user.id,
        dueDate: new Date(dueDate),
        status: "outstanding",
        priority: "medium" as PriorityLevel,
        documentLinks: documentLinks.map(url => ({ title: url, url })),
        attachments: []
      };
      
      console.log("Creating new task:", JSON.stringify(taskData, null, 2));
      
      // Save to Firestore
      const taskRef = await createTask(taskData);
      console.log(`Task created with ID: ${taskRef.id}`);
      
      // Redirect back to tasks page
      router.push("/tasks");
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return <div className="container mx-auto p-4">Loading...</div>;
  }

  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <Link href="/tasks" className="text-blue-600 hover:text-blue-800 text-sm flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          Back to Tasks
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold">Create Task for Teachers</h1>
          <p className="text-gray-600 text-sm">Assign a task to other teachers or yourself</p>
        </div>

        <form className="p-6" onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Task Title *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter task title"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter task description"
              required
            />
          </div>

          <div className="mb-4">
            <div className="flex items-center mb-3">
              <input
                type="checkbox"
                id="assignToSelf"
                checked={assignToSelf}
                onChange={handleAssignToSelfChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="assignToSelf" className="ml-2 block text-sm text-gray-700">
                Assign to myself
              </label>
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="assignedToTeachers" className="block text-sm font-medium text-gray-700 mb-1">
              Assign To Teachers (Optional if group is selected)
            </label>
            <div className="bg-gray-50 p-3 mb-2 rounded border-l-4 border-amber-500">
              <p className="text-sm text-gray-700">
                {assignToSelf 
                  ? "You've selected to assign this task to yourself. You can also select additional teachers." 
                  : "Select teachers to assign this task to, or check 'Assign to myself' above."}
              </p>
            </div>
            
            {isLoading ? (
              <div className="flex items-center justify-center p-4 border rounded">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-blue-500 border-r-transparent"></div>
                <span className="ml-2 text-gray-600">Loading teachers...</span>
              </div>
            ) : (
            <select
              id="assignedToTeachers"
              multiple
              value={assignedToTeachers}
              onChange={handleTeacherChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 h-32"
            >
                {teachers.map(teacher => (
                <option 
                  key={teacher.id} 
                  value={teacher.id}
                    disabled={teacher.id === user?.id && !assignToSelf} // Only disable self if not checked
                >
                    {teacher.name} ({teacher.role}) {teacher.id === user?.id ? "(You)" : ""}
                </option>
              ))}
            </select>
            )}
            <p className="mt-1 text-xs text-gray-500">Hold Ctrl/Cmd key to select multiple teachers</p>
          </div>

          <div className="mb-4">
            <label htmlFor="assignedToGroups" className="block text-sm font-medium text-gray-700 mb-1">
              Assign To Groups (Optional)
            </label>
            <div className="bg-gray-50 p-3 mb-2 rounded border-l-4 border-blue-500">
              <p className="text-sm text-gray-700">
                Assigning to a group will send the task to all teachers in that group. This is useful for department-wide tasks.
              </p>
            </div>
            
            {isLoadingGroups ? (
              <div className="flex items-center justify-center p-4 border rounded">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-blue-500 border-r-transparent"></div>
                <span className="ml-2 text-gray-600">Loading groups...</span>
              </div>
            ) : groups.length === 0 ? (
              <div className="p-4 border rounded text-gray-500">
                No teacher groups available. Please create groups in the admin panel first.
              </div>
            ) : (
            <select
              id="assignedToGroups"
              multiple
              value={assignedToGroups}
              onChange={handleGroupChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 h-32"
            >
              {groups.map(group => (
                <option key={group.id} value={group.id}>
                    {group.name} ({group.members?.length || 0} members)
                </option>
              ))}
            </select>
            )}
            <p className="mt-1 text-xs text-gray-500">Hold Ctrl/Cmd key to select multiple groups</p>
          </div>

          <div className="mb-4">
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
              Due Date *
            </label>
            <input
              type="date"
              id="dueDate"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Document Links
            </label>
            <div className="flex">
              <input
                type="text"
                value={newDocumentLink}
                onChange={(e) => setNewDocumentLink(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter URL to document or resource"
                className="flex-1 rounded-l-md border-r-0 border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={addDocumentLink}
                className="rounded-r-md bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Add
              </button>
            </div>
            
            {documentLinks.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium text-gray-700 mb-1">Added Links:</p>
                <ul className="text-sm text-gray-600 space-y-1">
                {documentLinks.map((link, index) => (
                    <li key={index} className="flex items-center">
                      <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline mr-2 truncate">
                      {link}
                    </a>
                    <button
                      type="button"
                      onClick={() => removeDocumentLink(index)}
                        className="text-red-500 hover:text-red-700"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </button>
                    </li>
                ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Link
              href="/tasks"
              className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 