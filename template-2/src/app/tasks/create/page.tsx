"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { teachers, groups, TaskStatus, PriorityLevel, tasks } from "@/lib/data";
import { useAuth } from "@/lib/contexts/AuthContext";
import { createTask } from "@/lib/firebase/firebaseUtils";

export default function CreateTaskPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  // Add debug info for authentication
  console.log('Create task page - User role:', user?.role);
  
  // Check if the user is a manager, redirect back to tasks if not
  useEffect(() => {
    if (user && user.role !== "manager") {
      console.log('User role check failed:', user.role);
      router.push("/tasks");
    }
  }, [user, router]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignedTo: [] as string[],
    assignedToGroups: [] as string[],
    dueDate: "",
    status: "outstanding" as TaskStatus,
    priority: "medium" as PriorityLevel,
  });
  
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [documentLinks, setDocumentLinks] = useState<string[]>([]);
  const [newDocumentLink, setNewDocumentLink] = useState("");

  // Check for selfAssign parameter and auto-assign to self if present
  useEffect(() => {
    const selfAssign = searchParams.get('selfAssign');
    
    if (selfAssign === 'true' && user && !formData.assignedTo.includes(user.id)) {
      setFormData(prevData => ({
        ...prevData,
        assignedTo: [...prevData.assignedTo, user.id]
      }));
    }
  }, [searchParams, user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>, type: "teachers" | "groups") => {
    const { value, checked } = e.target;
    
    if (type === "teachers") {
      if (checked) {
        setFormData({
          ...formData,
          assignedTo: [...formData.assignedTo, value],
        });
      } else {
        setFormData({
          ...formData,
          assignedTo: formData.assignedTo.filter(id => id !== value),
        });
      }
    } else {
      if (checked) {
        setFormData({
          ...formData,
          assignedToGroups: [...formData.assignedToGroups, value],
        });
      } else {
        setFormData({
          ...formData,
          assignedToGroups: formData.assignedToGroups.filter(id => id !== value),
        });
      }
    }
  };

  const handleAssignToMyself = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (user) {
      if (e.target.checked) {
        // Add current user ID to assignedTo if not already included
        if (!formData.assignedTo.includes(user.id)) {
          setFormData({
            ...formData,
            assignedTo: [...formData.assignedTo, user.id],
          });
        }
      } else {
        // Remove current user ID from assignedTo
        setFormData({
          ...formData,
          assignedTo: formData.assignedTo.filter(id => id !== user.id),
        });
      }
    }
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      const newFiles = Array.from(e.target.files);
      setAttachments([...attachments, ...newFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  // Add document link function
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
    setIsSubmitting(true);
    
    try {
      // Validation
      if (!formData.title || !formData.description || !formData.dueDate) {
        throw new Error("Please fill in all required fields");
      }

      if (formData.assignedTo.length === 0 && formData.assignedToGroups.length === 0) {
        throw new Error("Please assign to at least one teacher or group");
      }

      if (!user) {
        throw new Error("You must be logged in to create a task");
      }
      
      // Prepare task data for Firestore
      const taskData = {
        title: formData.title,
        description: formData.description,
        assignedTo: formData.assignedTo,
        assignedToGroups: formData.assignedToGroups,
        dueDate: new Date(formData.dueDate),
        status: "outstanding" as TaskStatus,
        priority: formData.priority,
        assignedBy: user.id,
        createdBy: user.id,
        documentLinks: documentLinks.map(url => ({ title: url, url })),
        attachments: attachments.map(file => ({ name: file.name, url: "#" })),
      };
      
      console.log("Creating new task:", JSON.stringify(taskData, null, 2));
      
      // Save to Firestore
      const taskRef = await createTask(taskData);
      console.log(`Task created with ID: ${taskRef.id}`);
      
      // Navigate to the tasks page
      router.push("/tasks");
    } catch (error) {
      console.error("Error submitting task:", error);
      setIsSubmitting(false);
    }
  };

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

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold">Create New Task</h1>
          <p className="text-gray-600 text-sm mt-1">Fill in the details to create a new task</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Task Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Task Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                placeholder="Enter task title"
                value={formData.title}
                onChange={handleInputChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            {/* Task Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                required
                placeholder="Enter task description"
                value={formData.description}
                onChange={handleInputChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Due Date */}
              <div>
                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  id="dueDate"
                  name="dueDate"
                  required
                  value={formData.dueDate}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              {/* Status and Priority */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="outstanding">Outstanding</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="delayed">Delayed</option>
                </select>
              </div>
            </div>

            {/* Assign Teachers */}
            <div>
              <fieldset>
                <legend className="block text-sm font-medium text-gray-700 mb-1">
                  Assign Teachers
                </legend>
                
                {/* Assign to Myself checkbox */}
                {user && (
                  <div className="mb-3 p-2 bg-blue-50 rounded-md">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="assign-to-myself"
                        checked={formData.assignedTo.includes(user.id)}
                        onChange={handleAssignToMyself}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="assign-to-myself" className="ml-2 text-sm font-medium text-blue-800">
                        Assign to myself
                      </label>
                    </div>
                  </div>
                )}
                
                <div className="mt-1 border rounded-md p-4 max-h-60 overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {teachers.map(teacher => (
                      <div key={teacher.id} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`teacher-${teacher.id}`}
                          name="assignedTo"
                          value={teacher.id}
                          checked={formData.assignedTo.includes(teacher.id)}
                          onChange={(e) => handleCheckboxChange(e, "teachers")}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor={`teacher-${teacher.id}`} className="ml-2 text-sm text-gray-700">
                          {teacher.name} <span className="text-xs text-gray-500">({teacher.role})</span>
                          {user && teacher.id === user.id && (
                            <span className="ml-1 text-xs text-blue-600 font-medium">(You)</span>
                          )}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </fieldset>
            </div>

            {/* Assign Groups */}
            <div>
              <fieldset>
                <legend className="block text-sm font-medium text-gray-700 mb-1">
                  Assign Groups
                </legend>
                <div className="mt-1 border rounded-md p-4 max-h-60 overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {groups.map(group => (
                      <div key={group.id} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`group-${group.id}`}
                          name="assignedToGroups"
                          value={group.id}
                          checked={formData.assignedToGroups.includes(group.id)}
                          onChange={(e) => handleCheckboxChange(e, "groups")}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor={`group-${group.id}`} className="ml-2 text-sm text-gray-700">
                          {group.name} <span className="text-xs text-gray-500">({group.members.length} members)</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </fieldset>
            </div>

            {/* Document Links */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Document Links
              </label>
              <div className="flex items-center mb-2">
                <input
                  type="text"
                  value={newDocumentLink}
                  onChange={(e) => setNewDocumentLink(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Enter document URL"
                />
                <button
                  type="button"
                  onClick={addDocumentLink}
                  className="ml-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  Add
                </button>
              </div>
              
              {documentLinks.length > 0 && (
                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto p-2 border border-gray-200 rounded-md">
                  {documentLinks.map((link, index) => (
                    <div key={index} className="flex items-center text-sm">
                      <a 
                        href={link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 truncate flex-1"
                      >
                        {link}
                      </a>
                      <button
                        type="button"
                        onClick={() => removeDocumentLink(index)}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">Add links to relevant documents or resources</p>
            </div>

            {/* File Attachments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Attachments
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <svg 
                    className="mx-auto h-12 w-12 text-gray-400" 
                    stroke="currentColor" 
                    fill="none" 
                    viewBox="0 0 48 48"
                  >
                    <path 
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                    />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                      <span>Upload files</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        multiple
                        className="sr-only"
                        onChange={handleAttachmentChange}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    PDF, DOC, DOCX, XLS, XLSX, etc. up to 10MB
                  </p>
                </div>
              </div>
              
              {attachments.length > 0 && (
                <ul className="mt-3 divide-y divide-gray-200 border rounded-md">
                  {attachments.map((file, index) => (
                    <li key={index} className="px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center">
                        <svg className="h-5 w-5 text-gray-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm text-gray-900">{file.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <Link
                href="/tasks"
                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : 'Create Task'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 