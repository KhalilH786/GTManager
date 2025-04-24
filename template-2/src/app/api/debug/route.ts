import { tasks } from "@/lib/data";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Get tasks assigned by John Smith (ID: "1") with status "complete_for_approval"
    const johnSmithReviewTasks = tasks.filter(task => 
      task.assignedBy === "1" && task.status === "complete_for_approval"
    );
    
    return NextResponse.json({
      success: true,
      totalTasks: tasks.length,
      johnSmithTasksCount: tasks.filter(task => task.assignedBy === "1").length,
      completeForApprovalCount: tasks.filter(task => task.status === "complete_for_approval").length,
      reviewTasksCount: johnSmithReviewTasks.length,
      reviewTasks: johnSmithReviewTasks.map(task => ({
        id: task.id,
        title: task.title,
        assignedTo: task.assignedTo,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate
      }))
    });
  } catch (error) {
    console.error("Debug API error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch debug data" }, { status: 500 });
  }
} 