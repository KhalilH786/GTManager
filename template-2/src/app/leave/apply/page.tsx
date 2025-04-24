"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LeaveType, leaveTypeLabels } from "@/lib/data";
import { createLeaveRequest, uploadFile } from "@/lib/firebase/firebaseUtils";
import { useAuth } from "@/lib/contexts/AuthContext";

export default function ApplyForLeavePage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [leaveType, setLeaveType] = useState<LeaveType>("annual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [supportingDocuments, setSupportingDocuments] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<{
    type?: string;
    startDate?: string;
    endDate?: string;
    reason?: string;
    dateRange?: string;
  }>({});
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const errors: typeof formErrors = {};
    
    if (!startDate) {
      errors.startDate = "Start date is required";
    }
    
    if (!endDate) {
      errors.endDate = "End date is required";
    }
    
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      errors.dateRange = "End date must be after start date";
    }
    
    if (!reason.trim()) {
      errors.reason = "Reason is required";
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    // Clear errors
    setFormErrors({});
    
    // Submit the leave request
    if (!user) {
      alert("You must be logged in to apply for leave");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Upload any supporting documents first
      const documentUrls: string[] = [];
      
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const fileName = `leave_documents/${user.id}/${Date.now()}_${file.name}`;
          const url = await uploadFile(file, fileName);
          documentUrls.push(url);
        }
      }
      
      // Create leave request with document URLs
      await createLeaveRequest(
        user.id,
        leaveType,
        new Date(startDate),
        new Date(endDate),
        reason,
        documentUrls.length > 0 ? documentUrls : undefined
      );
      
      // Navigate back to the leave page
      router.push("/leave?tab=my-requests");
    } catch (error) {
      console.error("Error submitting leave request:", error);
      alert("An error occurred while submitting your leave request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Document upload handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileArray = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...fileArray]);
    }
  };

  // Remove document handler
  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-lg text-gray-600">Please log in to apply for leave.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Apply for Leave</h1>
          <p className="text-gray-600 mt-1">
            Complete the form below to submit a leave request.
          </p>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6">
            {/* Leave Type */}
            <div className="mb-6">
              <label htmlFor="leaveType" className="block text-sm font-medium text-gray-700 mb-1">
                Leave Type
              </label>
              <select
                id="leaveType"
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-teal-500 focus:ring-teal-500"
                required
              >
                {Object.entries(leaveTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              {formErrors.type && (
                <p className="mt-1 text-sm text-red-600">{formErrors.type}</p>
              )}
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-teal-500 focus:ring-teal-500"
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
                {formErrors.startDate && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.startDate}</p>
                )}
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-teal-500 focus:ring-teal-500"
                  required
                  min={startDate || new Date().toISOString().split('T')[0]}
                />
                {formErrors.endDate && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.endDate}</p>
                )}
              </div>
            </div>
            {formErrors.dateRange && (
              <p className="mt-1 mb-4 text-sm text-red-600">{formErrors.dateRange}</p>
            )}

            {/* Reason */}
            <div className="mb-6">
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Leave
              </label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-teal-500 focus:ring-teal-500"
                required
                placeholder="Please provide details about your leave request"
              />
              {formErrors.reason && (
                <p className="mt-1 text-sm text-red-600">{formErrors.reason}</p>
              )}
            </div>

            {/* Supporting Documents */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supporting Documents (optional)
              </label>
              <div className="mt-1 flex items-center">
                <label className="cursor-pointer px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500">
                  <span>Upload Document</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    multiple
                  />
                </label>
              </div>
              
              {selectedFiles.length > 0 && (
                <ul className="mt-3 divide-y divide-gray-200 border rounded-md">
                  {selectedFiles.map((file, index) => (
                    <li key={index} className="py-3 px-4 flex justify-between items-center">
                      <div className="truncate text-sm flex-1">
                        {file.name}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        className="ml-3 text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Submit */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 