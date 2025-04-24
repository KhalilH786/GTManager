import { PriorityLevel } from "@/lib/data";

interface PriorityBadgeProps {
  priority: PriorityLevel;
}

export default function PriorityBadge({ priority }: PriorityBadgeProps) {
  const getPriorityStyles = (priority: PriorityLevel) => {
    switch (priority) {
      case "low":
        return "bg-gray-100 text-gray-700";
      case "medium":
        return "bg-teal-100 text-teal-700";
      case "high":
        return "bg-orange-100 text-orange-700";
      case "urgent":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getPriorityLabel = (priority: PriorityLevel) => {
    switch (priority) {
      case "low":
        return "Low";
      case "medium":
        return "Medium";
      case "high":
        return "High";
      case "urgent":
        return "Urgent";
      default:
        return priority;
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityStyles(
        priority
      )}`}
    >
      {getPriorityLabel(priority)}
    </span>
  );
} 