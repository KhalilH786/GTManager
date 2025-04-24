import { TaskStatus } from "@/lib/data";

interface TaskStatusBadgeProps {
  status: TaskStatus;
}

export default function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
  const statusStr = String(status).toLowerCase();
  
  console.log(`TaskStatusBadge - Received status: ${status}, converted to: ${statusStr}`);
  
  const getStatusStyles = (status: string) => {
    switch (status) {
      case "outstanding":
        return "bg-amber-100 text-amber-700";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "complete_for_approval":
        return "bg-green-100 text-green-700";
      case "late":
        return "bg-red-100 text-red-700";
      case "archived":
        return "bg-gray-200 text-gray-800";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "outstanding":
        return "Outstanding";
      case "in_progress":
        return "In Progress";
      case "complete_for_approval":
        return "Complete for approval";
      case "late":
        return "Late";
      case "archived":
        return "Archived";
      default:
        return status;
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyles(
        statusStr
      )}`}
    >
      {getStatusLabel(statusStr)}
    </span>
  );
} 