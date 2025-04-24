"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';
import { tasks, TaskStatus } from '@/lib/data';
import TaskStatusBadge from '@/components/TaskStatusBadge';

export default function DebugPage() {
  const { user } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus>("outstanding");
  
  // Filter tasks with the selected status
  const filteredTasks = tasks.filter(task => task.status === selectedStatus);
  
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Task Submission</h1>
      
      <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-6">
        <p className="text-yellow-700">
          Current user: {user ? `${user.name} (${user.role})` : 'Not logged in'}
        </p>
        <p className="text-yellow-700 mt-2">
          This page tests the rendering of the "Submit task" button for different task statuses.
        </p>
      </div>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Task Status
        </label>
        <select 
          className="border rounded-md p-2"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value as TaskStatus)}
        >
          <option value="outstanding">Outstanding</option>
          <option value="in_progress">In Progress</option>
          <option value="complete_for_approval">Complete for Approval</option>
          <option value="late">Late</option>
        </select>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Task
              </th>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredTasks.length > 0 ? (
              filteredTasks.map((task) => (
                <tr key={task.id}>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{task.title}</div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">
                      {task.description.length > 100
                        ? `${task.description.substring(0, 100)}...`
                        : task.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <TaskStatusBadge status={task.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {/* Manually render the test button */}
                    {task.status === "outstanding" ? (
                      <Link href={`/tasks/${task.id}/submit`} className="text-teal-600 hover:text-teal-900 font-medium">
                        Submit task
                      </Link>
                    ) : (
                      <input
                        type="checkbox"
                        checked={task.status === "complete_for_approval"}
                        className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                        readOnly
                      />
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                  No tasks with the selected status.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="mt-8">
        <Link href="/tasks" className="text-blue-600 hover:text-blue-800">
          Back to Tasks
        </Link>
      </div>
    </div>
  );
} 