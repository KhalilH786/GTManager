"use client"

import { useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { setupDefaultGrades } from '@/lib/firebase/firebaseUtils';

export default function AddGradesPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error' | null}>({
    text: '',
    type: null
  });

  const handleAddGrades = async () => {
    if (!user || user.role !== 'admin') {
      setMessage({
        text: 'You must be an admin to perform this action',
        type: 'error'
      });
      return;
    }

    try {
      setIsLoading(true);
      setMessage({ text: '', type: null });
      
      await setupDefaultGrades();
      
      setMessage({
        text: 'Grades have been successfully added to Firestore!',
        type: 'success'
      });
    } catch (error) {
      console.error('Error adding grades:', error);
      setMessage({
        text: 'An error occurred while adding grades',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Add Default Grades to Firestore</h1>
      
      <div className="mb-6">
        <p className="text-gray-600 mb-4">
          Click the button below to add the following grades to Firestore:
        </p>
        
        <ul className="list-disc list-inside mb-6 bg-gray-50 p-4 rounded-md">
          <li>BC</li>
          <li>M1</li>
          <li>M2</li>
          <li>M3</li>
          <li>Grade 1</li>
          <li>Grade 2</li>
          <li>Grade 3</li>
          <li>Grade 4</li>
          <li>Grade 5</li>
          <li>Grade 6</li>
          <li>Grade 7</li>
          <li>Grade 8</li>
          <li>Grade 9</li>
          <li>Grade 10</li>
          <li>Grade 11</li>
          <li>Grade 12</li>
        </ul>
      </div>
      
      <button
        onClick={handleAddGrades}
        disabled={isLoading}
        className={`px-4 py-2 rounded-md ${
          isLoading 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-teal-600 hover:bg-teal-700 text-white'
        }`}
      >
        {isLoading ? 'Adding Grades...' : 'Add Grades to Firestore'}
      </button>
      
      {message.text && (
        <div className={`mt-4 p-3 rounded-md ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-700' 
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message.text}
        </div>
      )}
    </div>
  );
} 