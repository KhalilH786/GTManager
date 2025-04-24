'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { setupDefaultGrades } from '@/lib/firebase/firebaseUtils';
import { useAuth } from '@/lib/contexts/AuthContext';

export default function AddGradesPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    // Check if user has admin or manager role
    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      setMessage({
        type: 'error',
        text: 'You do not have permission to access this page'
      });
    }
  }, [user]);

  const handleAddGrades = async () => {
    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      setMessage({
        type: 'error',
        text: 'You do not have permission to perform this action'
      });
      return;
    }

    setIsLoading(true);
    setMessage(null);
    
    try {
      await setupDefaultGrades();
      setMessage({
        type: 'success',
        text: 'Default grades have been successfully added to Firestore'
      });
    } catch (error) {
      console.error('Error adding grades:', error);
      setMessage({
        type: 'error',
        text: `Failed to add grades: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="border-b border-gray-200 p-6">
          <h1 className="text-xl font-semibold">Add Default Grades</h1>
          <p className="text-gray-500 mt-1">
            This will add the following grades to the database if they don't already exist:
            BC, M1, M2, M3, Grade 1-12
          </p>
        </div>
        <div className="p-6">
          <div className="flex flex-col gap-4">
            {message && (
              <div className={`p-4 rounded-md ${
                message.type === 'success' 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {message.text}
              </div>
            )}
            
            <div className="flex justify-between">
              <button
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                onClick={() => router.back()}
              >
                Go Back
              </button>
              <button 
                className={`px-4 py-2 rounded-md ${
                  isLoading || !user || (user.role !== 'admin' && user.role !== 'manager')
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-teal-600 hover:bg-teal-700 text-white'
                }`}
                onClick={handleAddGrades} 
                disabled={isLoading || !user || (user.role !== 'admin' && user.role !== 'manager')}
              >
                {isLoading ? 'Adding Grades...' : 'Add Default Grades'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 