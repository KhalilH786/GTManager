"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import Link from "next/link";
import { tasks } from "@/lib/data";

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  // Redirect based on auth state
  useEffect(() => {
    if (!isLoading) {
      if (user) {
        // Redirect to dashboard or tasks based on role
        if (user.role === "manager") {
          router.push("/dashboard");
        } else {
          router.push("/tasks");
        }
      } else {
        // Non-authenticated users will see the homepage (with login button)
        // The middleware will handle redirection if needed
      }
    }
  }, [user, isLoading, router]);

  // Get stats from our sample data
  const totalTasks = tasks.length;
  const pendingTasks = tasks.filter(task => task.status === "pending").length;
  const completedTasks = tasks.filter(task => task.status === "completed").length;
  const urgentTasks = tasks.filter(task => task.priority === "urgent").length;

  return (
    <div className="container mx-auto">
      <section className="py-10 md:py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">GT Staff Hub</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Streamline task assignment and tracking for your school. Keep teachers organized and improve communication.
          </p>
          <div className="mt-8">
            <Link 
              href="/login" 
              className="bg-teal-600 text-white px-6 py-3 rounded-md font-medium shadow-md hover:bg-teal-700 transition-colors"
            >
              Login
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-medium text-gray-500">Total Tasks</h3>
            <p className="text-3xl font-bold">{totalTasks}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-medium text-gray-500">Pending Tasks</h3>
            <p className="text-3xl font-bold text-yellow-500">{pendingTasks}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-medium text-gray-500">Completed Tasks</h3>
            <p className="text-3xl font-bold text-green-500">{completedTasks}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-medium text-gray-500">Urgent Tasks</h3>
            <p className="text-3xl font-bold text-red-500">{urgentTasks}</p>
          </div>
        </div>
      </section>

      <section className="pb-12">
        <h2 className="text-2xl font-bold mb-6">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Task Assignment</h3>
            <p className="text-gray-600">
              Easily assign tasks to individual teachers or entire groups with clear instructions and deadlines.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Progress Tracking</h3>
            <p className="text-gray-600">
              Track task completion status in real-time with visual indicators and filter options.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Group Management</h3>
            <p className="text-gray-600">
              Organize teachers into departments or teams for efficient task assignment and coordination.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
