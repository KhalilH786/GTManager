"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import { getAllStudents, batchImportStudents } from "@/lib/firebase/firebaseUtils";
import * as XLSX from 'xlsx';

export default function ImportExportStudentsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<{
    message: string;
    type: 'success' | 'error' | 'info' | null;
    details?: any;
  }>({ message: '', type: null });
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  // Excel template structure for students
  const sampleStudentData = [
    {
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@school.edu",
      grade: 9,
      homeroom: "9A",
      guardian: "Jane Doe",
      guardianEmail: "jane.doe@example.com",
      guardianPhone: "555-123-4567",
      enrollmentDate: "2023-09-01",
      gpa: 3.8,
      attendance: 98
    }
  ];

  // Redirect if not admin
  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  // Function to export students to Excel
  const handleExportStudents = async () => {
    try {
      setIsExporting(true);
      
      // Fetch all students from Firebase
      const students = await getAllStudents();
      
      if (!students || students.length === 0) {
        setImportStatus({
          message: "No students found to export",
          type: "info"
        });
        setIsExporting(false);
        return;
      }
      
      // Format the data for Excel
      const formattedData = students.map(student => ({
        firstName: student.firstName || '',
        lastName: student.lastName || '',
        email: student.email || '',
        grade: student.grade || '',
        homeroom: student.homeroom || '',
        guardian: student.guardian || '',
        guardianEmail: student.guardianEmail || '',
        guardianPhone: student.guardianPhone || '',
        enrollmentDate: student.enrollmentDate ? new Date(student.enrollmentDate).toISOString().split('T')[0] : '',
        gpa: student.gpa || '',
        attendance: student.attendance || ''
      }));
      
      // Create workbook and add the data
      const worksheet = XLSX.utils.json_to_sheet(formattedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
      
      // Generate Excel file and trigger download
      const today = new Date().toISOString().split('T')[0];
      XLSX.writeFile(workbook, `students_export_${today}.xlsx`);
      
      setImportStatus({
        message: `Successfully exported ${students.length} students`,
        type: "success"
      });
    } catch (error: any) {
      console.error("Error exporting students:", error);
      setImportStatus({
        message: `Error exporting students: ${error.message || 'Unknown error'}`,
        type: "error"
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  // Function to generate an Excel template
  const handleGenerateTemplate = () => {
    try {
      // Create workbook with sample data
      const worksheet = XLSX.utils.json_to_sheet(sampleStudentData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
      
      // Download the template
      XLSX.writeFile(workbook, "student_import_template.xlsx");
      
      setImportStatus({
        message: "Template downloaded successfully",
        type: "success"
      });
    } catch (error: any) {
      console.error("Error generating template:", error);
      setImportStatus({
        message: `Error generating template: ${error.message || 'Unknown error'}`,
        type: "error"
      });
    }
  };
  
  // Handle file selection for import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    setImportFile(file);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // Basic validation
        const errors = validateImportData(jsonData);
        setValidationErrors(errors);
        
        // Show preview of first 5 rows
        setImportPreview(jsonData.slice(0, 5));
        
        if (errors.length > 0) {
          setImportStatus({
            message: `Validation errors found. Please fix them before importing.`,
            type: "error"
          });
        } else {
          setImportStatus({
            message: `Ready to import ${jsonData.length} students`,
            type: "info"
          });
        }
      } catch (error: any) {
        console.error("Error reading Excel file:", error);
        setImportStatus({
          message: `Error reading file: ${error.message || 'Invalid file format'}`,
          type: "error"
        });
        setImportPreview([]);
      }
    };
    
    reader.onerror = () => {
      setImportStatus({
        message: "Error reading file",
        type: "error"
      });
    };
    
    reader.readAsBinaryString(file);
  };
  
  // Validate import data
  const validateImportData = (data: any[]): string[] => {
    const errors: string[] = [];
    
    if (!data || data.length === 0) {
      errors.push("No data found in the file");
      return errors;
    }
    
    // Check required fields
    data.forEach((row, index) => {
      if (!row.firstName) errors.push(`Row ${index + 1}: Missing firstName`);
      if (!row.lastName) errors.push(`Row ${index + 1}: Missing lastName`);
      if (!row.email) errors.push(`Row ${index + 1}: Missing email`);
      
      // Check email format
      if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
        errors.push(`Row ${index + 1}: Invalid email format for ${row.email}`);
      }
      
      // Check grade is a number
      if (row.grade && isNaN(Number(row.grade))) {
        errors.push(`Row ${index + 1}: Grade must be a number`);
      }
      
      // Check GPA is a valid number
      if (row.gpa && (isNaN(Number(row.gpa)) || Number(row.gpa) < 0 || Number(row.gpa) > 4)) {
        errors.push(`Row ${index + 1}: GPA must be a number between 0 and 4`);
      }
      
      // Check attendance is a valid percentage
      if (row.attendance && (isNaN(Number(row.attendance)) || Number(row.attendance) < 0 || Number(row.attendance) > 100)) {
        errors.push(`Row ${index + 1}: Attendance must be a percentage between 0 and 100`);
      }
    });
    
    // Limit the number of displayed errors
    if (errors.length > 10) {
      const countRest = errors.length - 10;
      return [...errors.slice(0, 10), `...and ${countRest} more errors`];
    }
    
    return errors;
  };
  
  // Process the import
  const handleImportStudents = async () => {
    if (!importFile || validationErrors.length > 0) return;
    
    try {
      setIsImporting(true);
      setImportStatus({
        message: "Importing students...",
        type: "info"
      });
      
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = event.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          // Process data for import
          const processedData = jsonData.map(row => ({
            firstName: row.firstName,
            lastName: row.lastName,
            email: row.email,
            grade: Number(row.grade) || 0,
            homeroom: row.homeroom || '',
            guardian: row.guardian || '',
            guardianEmail: row.guardianEmail || '',
            guardianPhone: row.guardianPhone || '',
            enrollmentDate: row.enrollmentDate ? new Date(row.enrollmentDate) : new Date(),
            gpa: Number(row.gpa) || 0,
            attendance: Number(row.attendance) || 0,
          }));
          
          // Import to Firebase
          const result = await batchImportStudents(processedData);
          
          setImportStatus({
            message: `Successfully imported ${result.success} students`,
            type: "success",
            details: result
          });
          
          // Reset import state
          setImportPreview([]);
          setImportFile(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (error: any) {
          console.error("Error importing students:", error);
          setImportStatus({
            message: `Error importing students: ${error.message || 'Unknown error'}`,
            type: "error",
            details: error
          });
        } finally {
          setIsImporting(false);
        }
      };
      
      reader.onerror = () => {
        setImportStatus({
          message: "Error reading file during import",
          type: "error"
        });
        setIsImporting(false);
      };
      
      reader.readAsBinaryString(importFile);
    } catch (error: any) {
      console.error("Error in import process:", error);
      setImportStatus({
        message: `Error in import process: ${error.message || 'Unknown error'}`,
        type: "error"
      });
      setIsImporting(false);
    }
  };
  
  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Import & Export Students</h1>
          <p className="text-gray-600">Manage student data via Excel spreadsheets</p>
        </div>
        <Link
          href="/admin/students"
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium shadow-sm"
        >
          Back to Students
        </Link>
      </div>

      {/* Status Message */}
      {importStatus.message && (
        <div className={`p-4 mb-6 rounded-md ${
          importStatus.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
          importStatus.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
          'bg-blue-50 text-blue-700 border border-blue-200'
        }`}>
          <p className="font-medium">{importStatus.message}</p>
          {validationErrors.length > 0 && (
            <div className="mt-2">
              <p className="font-medium">Validation Errors:</p>
              <ul className="list-disc list-inside text-sm mt-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Export Students</h2>
          <p className="text-gray-600 mb-4">
            Export all students to an Excel file for backup or offline editing.
          </p>
          
          <button
            onClick={handleExportStudents}
            disabled={isExporting}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Exporting...
              </span>
            ) : "Export All Students"}
          </button>
        </div>
        
        {/* Import Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Import Students</h2>
          <p className="text-gray-600 mb-4">
            Import students from an Excel file. Make sure your data follows the required format.
          </p>
          
          <div className="flex flex-col space-y-4">
            <button
              onClick={handleGenerateTemplate}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium shadow-sm"
            >
              Download Template
            </button>
            
            <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
              <input
                type="file"
                ref={fileInputRef}
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                <div className="flex flex-col items-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="mt-1">Click to select an Excel file</p>
                  <p className="text-xs text-gray-500 mt-1">or drag and drop</p>
                </div>
              </label>
              {importFile && (
                <div className="mt-3 text-sm text-gray-600">
                  Selected: {importFile.name}
                </div>
              )}
            </div>
            
            <button
              onClick={handleImportStudents}
              disabled={!importFile || validationErrors.length > 0 || isImporting}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isImporting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Importing...
                </span>
              ) : "Import Students"}
            </button>
          </div>
        </div>
      </div>
      
      {/* Preview Section */}
      {importPreview.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Import Preview</h2>
          <p className="text-gray-600 mb-4">
            Preview of the first {importPreview.length} records in the import file:
          </p>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {Object.keys(importPreview[0]).map((key) => (
                    <th
                      key={key}
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {importPreview.map((row, index) => (
                  <tr key={index}>
                    {Object.values(row).map((value, cellIndex) => (
                      <td key={cellIndex} className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        {value?.toString() || ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
} 