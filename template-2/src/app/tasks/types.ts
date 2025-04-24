import { DocumentLink, PriorityLevel } from '@/lib/data';

// Common Task interface to be used across all task-related components
export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string[];
  assignedToGroups: string[];
  assignedBy: string;
  createdBy: string;
  dueDate: string;
  status: string; // Changed from TaskStatus to string to support dynamic statuses
  priority: PriorityLevel;
  createdAt: string;
  updatedAt?: string | any; // Add updatedAt property as optional
  attachments: { name: string; url: string }[];
  documentLinks: DocumentLink[];
  resolution?: string; // Resolution or completion notes
  assignerData?: any; // Information about the user who assigned the task
} 