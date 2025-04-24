"use client";

import Link from "next/link";
import { groups, teachers, getTeacherById, getTasksForGroup } from "@/lib/data";
import { useAuth } from "@/lib/hooks/useAuth";

export default function GroupsPage() {
  const auth = useAuth();
  const isManager = auth?.user?.role === "manager";
  const isAdmin = auth?.user?.role === "admin";
  
  return (
    <div className="container mx-auto">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Teacher Groups</h1>
          <p className="text-gray-600">Manage and organize teachers into functional groups</p>
        </div>
        {isAdmin && (
          <Link
            href="/groups/create"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Create New Group
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((group) => {
          const memberDetails = group.members.map(id => getTeacherById(id));
          const tasksForGroup = getTasksForGroup(group.id);
          const pendingTasks = tasksForGroup.filter(task => task.status === "pending" || task.status === "in_progress").length;
          
          return (
            <div key={group.id} className="bg-white rounded-lg shadow overflow-hidden cursor-default">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold mb-1">{group.name}</h2>
                <p className="text-sm text-gray-500">{group.members.length} members</p>
              </div>
              
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Members</h3>
                  <div className="flex flex-wrap gap-2">
                    {memberDetails.map(teacher => (
                      teacher && (
                        <span 
                          key={teacher.id} 
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {teacher.name}
                        </span>
                      )
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Tasks:</span>{" "}
                    <span>{tasksForGroup.length} total</span>
                    {pendingTasks > 0 && (
                      <span className="ml-2 text-yellow-600">({pendingTasks} pending)</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {groups.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No groups yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first teacher group.
          </p>
          {isAdmin && (
            <div className="mt-6">
              <Link
                href="/groups/create"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Create a Group
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 