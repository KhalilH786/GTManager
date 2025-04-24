"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { tasks, teachers, groups, TaskStatus, PriorityLevel, getTeacherById } from "@/lib/data";
import { useAuth } from "@/lib/contexts/AuthContext";

export default function EditTaskPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  
  // Debug information
  console.log('Edit task page - Task ID:', params.id);
  console.log('Available task IDs:', tasks.map(t => t.id));
  
  const task = tasks.find(t => t.id === params.id);
  
  if (!task) {
    console.error(`Task with ID ${params.id} not found`);
    // Return a helpful error message instead of not found
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Task not found</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>The task with ID "{params.id}" could not be found. It may have been deleted or the ID is incorrect.</p>
              </div>
              <div className="mt-4">
                <Link href="/tasks" className="text-sm font-medium text-red-800 hover:text-red-900">
                  Return to Tasks
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // User authorization check
  useEffect(() => {
    if (user && user.role !== "manager") {
      console.log('User role check failed:', user.role);
      router.push('/tasks');
    }
  }, [user, router]);
  
  // Initialize form data with the task values
  const [formData, setFormData] = useState({
    title: task.title,
    description: task.description,
    assignedTo: [...task.assignedTo],
    assignedToGroups: [...task.assignedToGroups],
    dueDate: new Date(task.dueDate).toISOString().slice(0, 16), // Format for datetime-local input
    status: task.status as TaskStatus,
    priority: task.priority as PriorityLevel,
  });
  
  // Initialize documentLinks state
  const [documentLinks, setDocumentLinks] = useState<string[]>([]);
  
  // Initialize other state variables
  const [existingAttachments, setExistingAttachments] = useState(task.attachments || []);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [newDocumentLink, setNewDocumentLink] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      const newFiles = Array.from(e.target.files);
      setAttachments([...attachments, ...newFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const removeExistingAttachment = (index: number) => {
    setExistingAttachments(existingAttachments.filter((_, i) => i !== index));
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
      // In a real app, this would be an API call to update the task
      const updatedTaskData = {
        ...task,
        ...formData,
        documentLinks: documentLinks || [],
        attachments: [
          ...existingAttachments,
          ...attachments.map(file => ({ name: file.name, url: "#" })),
        ],
        updatedAt: new Date().toISOString(),
      };
      
      console.log("Updating task:", updatedTaskData);
      
      // For now, we'll just simulate a submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update the task in the local array (in a real app, this would be an API call)
      const taskIndex = tasks.findIndex(t => t.id === task.id);
      if (taskIndex !== -1) {
        tasks[taskIndex] = updatedTaskData;
      }
      
      // Navigate back to the task detail page
      router.push(`/tasks/${task.id}`);
    } catch (error) {
      console.error("Error updating task:", error);
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return <div className="container mx-auto p-4 text-center">Loading...</div>;
  }

  if (user.role !== "manager") {
    return (
      <div className="container mx-auto p-4 text-center">
        <p>You don't have permission to edit tasks.</p>
        <Link href="/tasks" className="text-blue-600 hover:underline mt-2 inline-block">
          Return to Tasks
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <Link href={`/tasks/${task.id}`} className="text-blue-600 hover:text-blue-800 text-sm flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          Back to Task Details
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold">Edit Task</h1>
          <p className="text-gray-600 text-sm mt-1">Update task details</p>
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
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="delayed">Delayed</option>
                </select>
              </div>
            </div>

            {/* Priority */}
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            {/* Assign Teachers */}
            <div>
              <fieldset>
                <legend className="block text-sm font-medium text-gray-700 mb-1">
                  Assign Teachers
                </legend>
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
                  className="ml-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add
                </button>
              </div>

              {documentLinks.length > 0 && (
                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto p-2 border border-gray-200 rounded-md">
                  {documentLinks.map((link, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
                        {link}
                      </a>
                      <button
                        type="button"
                        onClick={() => removeDocumentLink(index)}
                        className="ml-2 text-red-600 hover:text-red-800"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Existing Attachments */}
            {existingAttachments.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Existing Attachments
                </label>
                <div className="mt-1 space-y-2 max-h-40 overflow-y-auto p-2 border border-gray-200 rounded-md">
                  {existingAttachments.map((attachment, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
                        {attachment.name}
                      </a>
                      <button
                        type="button"
                        onClick={() => removeExistingAttachment(index)}
                        className="ml-2 text-red-600 hover:text-red-800"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Attachments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Add New Attachments
              </label>
              <input
                type="file"
                multiple
                onChange={handleAttachmentChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {attachments.length > 0 && (
                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto p-2 border border-gray-200 rounded-md">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span className="truncate">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="ml-2 text-red-600 hover:text-red-800"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <Link
                href={`/tasks/${task.id}`}
                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Task'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 