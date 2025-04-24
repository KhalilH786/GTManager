"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DocumentLink } from '@/lib/data';
import { Task } from '../../types';
import { getTaskById, updateDocument } from '@/lib/firebase/firebaseUtils';
import { useAuth } from '@/lib/contexts/AuthContext';
import LoadingSpinner from '../../../../components/LoadingSpinner';

interface DocumentLinkInput {
  title: string;
  url: string;
  description?: string;
}

export default function TaskSubmitPage({ params }: { params: { id: string } }) {
  console.log("TaskSubmitPage - loading for ID:", params.id);
  
  const [resolution, setResolution] = useState('');
  const [documentLinks, setDocumentLinks] = useState<DocumentLinkInput[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user } = useAuth();
  
  // Fetch the task data from Firestore
  useEffect(() => {
    const fetchTask = async () => {
      setLoading(true);
      try {
        const taskData = await getTaskById(params.id);
        if (!taskData) {
          setError('Task not found');
        } else {
          setTask(taskData);
        }
      } catch (err) {
        console.error('Error fetching task:', err);
        setError('Failed to load task data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTask();
  }, [params.id]);
  
  const handleAddDocumentLink = () => {
    setDocumentLinks([...documentLinks, { title: '', url: '', description: '' }]);
  };

  const handleRemoveDocumentLink = (index: number) => {
    const updatedLinks = [...documentLinks];
    updatedLinks.splice(index, 1);
    setDocumentLinks(updatedLinks);
  };

  const handleDocumentLinkChange = (index: number, field: keyof DocumentLinkInput, value: string) => {
    const updatedLinks = [...documentLinks];
    updatedLinks[index] = { ...updatedLinks[index], [field]: value };
    setDocumentLinks(updatedLinks);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!task) {
      setError('Cannot submit: Task not found');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    // Validate document links
    const invalidLinks = documentLinks.filter(link => link.title.trim() === '' || link.url.trim() === '');
    if (invalidLinks.length > 0) {
      setError('Please provide both title and URL for all document links');
      setIsSubmitting(false);
      return;
    }
    
    try {
      console.log(`Submitting task ${task.id} with resolution: ${resolution}`);
      console.log(`Document links: ${JSON.stringify(documentLinks)}`);
      
        // Filter out empty document links and create valid links
        const validDocumentLinks = documentLinks
          .filter(link => link.title.trim() !== '' && link.url.trim() !== '')
          .map(link => ({
            title: link.title.trim(),
            url: link.url.trim(),
            description: link.description && link.description.trim() !== '' ? link.description.trim() : undefined
          }));

      // Update the task in Firestore
      const existingLinks = task.documentLinks || [];
      
      await updateDocument("tasks", params.id, {
        status: "complete_for_approval",
        resolution: resolution,
        documentLinks: [...existingLinks, ...validDocumentLinks],
        updatedAt: new Date()
      });
        
        console.log(`Task ${task.id} updated successfully to status: complete_for_approval`);
        router.push('/tasks');
    } catch (err) {
      console.error('Error submitting task:', err);
      setError('Failed to submit task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto p-4 text-center">
        <LoadingSpinner size="lg" text="Loading task details..." color="blue-500" />
      </div>
    );
  }
  
  if (error && !task) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 p-4 rounded-md mb-4">
          <p className="text-red-700">{error}</p>
        </div>
        <Link href="/tasks" className="text-blue-600 hover:underline">
          Back to Tasks
        </Link>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4">
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
          <h1 className="text-2xl font-bold mb-2">Submit Task: {task?.title}</h1>
        </div>
        
        <div className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="resolution" className="block text-sm font-medium text-gray-700 mb-2">
                Resolution / Completion Notes
              </label>
              <textarea
                id="resolution"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={5}
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="Describe how you completed this task..."
                required
              />
            </div>
            
            {/* Document Links Section */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Document Links (Optional)
                </label>
                <button
                  type="button"
                  onClick={handleAddDocumentLink}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm rounded-md text-indigo-600 bg-indigo-50 hover:bg-indigo-100 focus:outline-none"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                  Add Link
                </button>
              </div>
              
              {documentLinks.length === 0 && (
                <p className="text-sm text-gray-500 italic mb-2">
                  Add links to documents or resources related to your task completion.
                </p>
              )}
              
              {documentLinks.map((link, index) => (
                <div key={index} className="mb-4 p-4 border border-gray-200 rounded-md">
                  <div className="flex justify-between">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Link #{index + 1}</h3>
                    <button
                      type="button"
                      onClick={() => handleRemoveDocumentLink(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label htmlFor={`link-title-${index}`} className="block text-xs font-medium text-gray-700 mb-1">
                        Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        id={`link-title-${index}`}
                        type="text"
                        value={link.title}
                        onChange={(e) => handleDocumentLinkChange(index, 'title', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="Link title"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor={`link-url-${index}`} className="block text-xs font-medium text-gray-700 mb-1">
                        URL <span className="text-red-500">*</span>
                      </label>
                      <input
                        id={`link-url-${index}`}
                        type="url"
                        value={link.url}
                        onChange={(e) => handleDocumentLinkChange(index, 'url', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="https://example.com/document"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor={`link-description-${index}`} className="block text-xs font-medium text-gray-700 mb-1">
                        Description (Optional)
                      </label>
                      <input
                        id={`link-description-${index}`}
                        type="text"
                        value={link.description}
                        onChange={(e) => handleDocumentLinkChange(index, 'description', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="Brief description of the link"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                {error}
              </div>
            )}
            
            <div className="flex justify-end">
              <Link
                href="/tasks"
                className="px-4 py-2 border border-gray-300 rounded-md mr-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Task'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 