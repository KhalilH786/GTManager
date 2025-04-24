"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import { getAllStudents, getAllGradesFromFirestore } from "@/lib/firebase/firebaseUtils";

export default function StudentsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGrade, setFilterGrade] = useState("all");
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [students, setStudents] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [isLoadingGrades, setIsLoadingGrades] = useState(true);

  // Redirect if not admin
  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      router.push("/login");
    }
  }, [user, isLoading, router]);
  
  // Fetch students from Firestore
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingStudents(true);
        setIsLoadingGrades(true);
        
        // Fetch students
        const studentsData = await getAllStudents();
        setStudents(studentsData);
        
        // Fetch grades
        const gradesData = await getAllGradesFromFirestore();
        setGrades(gradesData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoadingStudents(false);
        setIsLoadingGrades(false);
      }
    };
    
    if (user && user.role === "admin") {
      fetchData();
    }
  }, [user]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  // Filter students by search term and grade
  const filteredStudents = students.filter((student) => {
    const fullName = `${student.firstName || ''} ${student.lastName || ''}`.trim();
    const matchesSearch = 
      fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.guardian || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesGrade = filterGrade === "all" || 
      (student.grade && student.grade.toString() === filterGrade);
    
    return matchesSearch && matchesGrade;
  });

  // Sort students
  const sortedStudents = [...filteredStudents].sort((a, b) => {
    const multiplier = sortDirection === "asc" ? 1 : -1;
    
    switch (sortField) {
      case "name":
        const nameA = `${a.lastName || ''}, ${a.firstName || ''}`;
        const nameB = `${b.lastName || ''}, ${b.firstName || ''}`;
        return multiplier * nameA.localeCompare(nameB);
      case "grade":
        return multiplier * ((a.grade || 0) - (b.grade || 0));
      case "gpa":
        return multiplier * ((a.gpa || 0) - (b.gpa || 0));
      case "attendance":
        return multiplier * ((a.attendance || 0) - (b.attendance || 0));
      default:
        return multiplier * (a.lastName || '').localeCompare(b.lastName || '');
    }
  });

  // Handle sort toggle
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Render sort indicator
  const renderSortIndicator = (field: string) => {
    if (sortField !== field) {
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Student Management</h1>
          <p className="text-gray-600">Manage student profiles and information</p>
        </div>
        <div className="flex space-x-3">
          <Link
            href="/admin/students/import-export"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium shadow-sm"
          >
            Import/Export
          </Link>
          <Link
            href="/admin/students/create"
            className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md text-sm font-medium shadow-sm"
          >
            Add New Student
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search Students
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, or guardian..."
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
            />
          </div>
          <div className="w-full md:w-48">
            <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Grade
            </label>
            <select
              id="grade"
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
            >
              <option value="all">All Grades</option>
              {isLoadingGrades ? (
                <option disabled>Loading grades...</option>
              ) : grades.length > 0 ? (
                grades.map((grade) => (
                  <option key={grade.id} value={grade.name}>
                    {grade.name}
                  </option>
                ))
              ) : (
                <>
                  <option value="9">Grade 9</option>
                  <option value="10">Grade 10</option>
                  <option value="11">Grade 11</option>
                  <option value="12">Grade 12</option>
                </>
              )}
            </select>
          </div>
        </div>

        {isLoadingStudents ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading students...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("name")}
                  >
                    Student Name {renderSortIndicator("name")}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("grade")}
                  >
                    Grade {renderSortIndicator("grade")}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Homeroom
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("gpa")}
                  >
                    GPA {renderSortIndicator("gpa")}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("attendance")}
                  >
                    Attendance % {renderSortIndicator("attendance")}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Guardian
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center mr-3">
                          <span className="text-sm font-medium text-teal-800">
                            {student.firstName && student.lastName 
                              ? `${student.firstName[0]}${student.lastName[0]}`
                              : '??'}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {student.firstName && student.lastName 
                              ? `${student.firstName} ${student.lastName}`
                              : 'Unknown Name'}
                          </div>
                          <div className="text-sm text-gray-500">{student.email || 'No email'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{student.grade || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{student.homeroom || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {student.gpa !== undefined ? parseFloat(student.gpa).toFixed(1) : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {student.attendance !== undefined ? parseFloat(student.attendance).toFixed(1) + '%' : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{student.guardian || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{student.guardianPhone || 'No contact'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/admin/students/${student.id}/details`}
                        className="text-teal-600 hover:text-teal-900 mr-4"
                      >
                        View
                      </Link>
                      <Link
                        href={`/admin/students/${student.id}/edit`}
                        className="text-teal-600 hover:text-teal-900"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {sortedStudents.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No students found matching your criteria</p>
              </div>
            )}
          </div>
        )}
      </div>
      
      <Link href="/admin" className="text-teal-600 hover:text-teal-800 flex items-center">
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
        </svg>
        Back to Admin Dashboard
      </Link>
    </div>
  );
} 