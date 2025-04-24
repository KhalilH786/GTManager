// Sample data for the School Task Management Web Application

// Teacher Data
export const teachers = [
  { id: "1", name: "John Smith", email: "john.smith@school.edu", role: "Math Teacher" },
  { id: "2", name: "Sarah Johnson", email: "sarah.johnson@school.edu", role: "Science Teacher" },
  { id: "3", name: "Michael Davis", email: "michael.davis@school.edu", role: "English Teacher" },
  { id: "4", name: "Emily Wilson", email: "emily.wilson@school.edu", role: "History Teacher" },
  { id: "5", name: "Robert Brown", email: "robert.brown@school.edu", role: "Physical Education" },
];

// Student Data
export const students = [
  { 
    id: "s1", 
    name: "Alex Johnson", 
    email: "alex.johnson@student.school.edu", 
    grade: 10, 
    homeroom: "10A",
    guardian: "Mary Johnson",
    guardianEmail: "mary.johnson@example.com",
    guardianPhone: "555-123-4567",
    enrollmentDate: "2023-09-05",
    gpa: 3.8,
    attendance: 96.5
  },
  { 
    id: "s2", 
    name: "Emma Williams", 
    email: "emma.williams@student.school.edu", 
    grade: 11, 
    homeroom: "11B",
    guardian: "David Williams",
    guardianEmail: "david.williams@example.com",
    guardianPhone: "555-234-5678",
    enrollmentDate: "2022-09-03",
    gpa: 4.0,
    attendance: 98.2
  },
  { 
    id: "s3", 
    name: "Noah Brown", 
    email: "noah.brown@student.school.edu", 
    grade: 9, 
    homeroom: "9C",
    guardian: "Jennifer Brown",
    guardianEmail: "jennifer.brown@example.com",
    guardianPhone: "555-345-6789",
    enrollmentDate: "2024-01-15",
    gpa: 3.5,
    attendance: 92.7
  },
  { 
    id: "s4", 
    name: "Olivia Davis", 
    email: "olivia.davis@student.school.edu", 
    grade: 12, 
    homeroom: "12A",
    guardian: "Michael Davis",
    guardianEmail: "michael.davis@example.com",
    guardianPhone: "555-456-7890",
    enrollmentDate: "2021-09-06",
    gpa: 3.9,
    attendance: 97.8
  },
  { 
    id: "s5", 
    name: "Liam Martinez", 
    email: "liam.martinez@student.school.edu", 
    grade: 10, 
    homeroom: "10B",
    guardian: "Sophia Martinez",
    guardianEmail: "sophia.martinez@example.com",
    guardianPhone: "555-567-8901",
    enrollmentDate: "2023-09-05",
    gpa: 3.2,
    attendance: 94.5
  },
];

// Function to get all students
export const getAllStudents = () => {
  return [...students];
};

// Staff Data (for management roles)
export const staff = [
  { id: "m1", name: "Admin User", email: "admin@school.edu", role: "Principal" },
];

// Groups Data
export const groups = [
  { id: "1", name: "Math Department", members: ["1"] },
  { id: "2", name: "Science Department", members: ["2"] },
  { id: "3", name: "Humanities", members: ["3", "4"] },
  { id: "4", name: "All Teachers", members: ["1", "2", "3", "4", "5"] },
];

// School Event Target Types
export type EventTargetType = "class" | "grade" | "phase" | "school";

export const eventTargetTypeLabels: Record<EventTargetType, string> = {
  class: "Class",
  grade: "Grade",
  phase: "Phase",
  school: "Whole School"
};

// School phases (e.g., elementary, middle, high school)
export const schoolPhases = [
  { id: "1", name: "Elementary School", grades: [1, 2, 3, 4, 5] },
  { id: "2", name: "Middle School", grades: [6, 7, 8] },
  { id: "3", name: "High School", grades: [9, 10, 11, 12] }
];

// Function to get all unique grades from students
export const getAllGrades = (): number[] => {
  return Array.from(new Set(students.map(student => student.grade))).sort((a, b) => a - b);
};

// Function to get all unique homerooms (classes) from students
export const getAllClasses = (): string[] => {
  return Array.from(new Set(students.map(student => student.homeroom))).sort();
};

// Function to get all phases
export const getAllPhases = (): typeof schoolPhases => {
  return [...schoolPhases];
};

// Function to add a new phase
export const addPhase = (name: string, grades: (number | string)[]): void => {
  const newId = `${schoolPhases.length + 1}`;
  schoolPhases.push({
    id: newId,
    name,
    // @ts-ignore - Allow mixed types for backwards compatibility
    grades
  });
};

// Function to update an existing phase
export const updatePhase = (id: string, name: string, grades: (number | string)[]): boolean => {
  const phaseIndex = schoolPhases.findIndex(phase => phase.id === id);
  if (phaseIndex === -1) return false;
  
  schoolPhases[phaseIndex] = {
    id,
    name,
    // @ts-ignore - Allow mixed types for backwards compatibility
    grades
  };
  
  return true;
};

// Function to delete a phase
export const deletePhase = (id: string): boolean => {
  const initialLength = schoolPhases.length;
  const filteredPhases = schoolPhases.filter(phase => phase.id !== id);
  
  if (filteredPhases.length === initialLength) return false;
  
  // Replace the array contents
  schoolPhases.length = 0;
  schoolPhases.push(...filteredPhases);
  
  return true;
};

// School Event Interface
export interface SchoolEvent {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location: string;
  targetTypes: EventTargetType[];
  targetClasses?: string[];
  targetGrades?: number[];
  targetPhases?: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Mock data for school events
const schoolEvents: SchoolEvent[] = [
  {
    id: "e1",
    title: "Science Fair",
    description: "Annual science fair for all high school students",
    startDate: new Date("2024-05-15T09:00:00"),
    endDate: new Date("2024-05-15T15:00:00"),
    location: "Main Hall",
    targetTypes: ["phase"],
    targetPhases: ["3"], // High School
    createdBy: "m1",
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-10")
  },
  {
    id: "e2",
    title: "Parent-Teacher Conference",
    description: "End of year parent-teacher conference for 10th grade",
    startDate: new Date("2024-06-10T13:00:00"),
    endDate: new Date("2024-06-10T19:00:00"),
    location: "Classrooms",
    targetTypes: ["grade"],
    targetGrades: [10],
    createdBy: "m1",
    createdAt: new Date("2024-03-15"),
    updatedAt: new Date("2024-03-15")
  },
  {
    id: "e3",
    title: "Math Quiz",
    description: "Monthly math quiz for class 10A",
    startDate: new Date("2024-04-20T10:00:00"),
    endDate: new Date("2024-04-20T11:30:00"),
    location: "Room 201",
    targetTypes: ["class"],
    targetClasses: ["10A"],
    createdBy: "1", // Math teacher
    createdAt: new Date("2024-04-01"),
    updatedAt: new Date("2024-04-01")
  },
  {
    id: "e4",
    title: "School Assembly",
    description: "End of month school-wide assembly",
    startDate: new Date("2024-04-30T08:30:00"),
    endDate: new Date("2024-04-30T09:30:00"),
    location: "Auditorium",
    targetTypes: ["school"],
    createdBy: "m1",
    createdAt: new Date("2024-04-15"),
    updatedAt: new Date("2024-04-15")
  }
];

// Function to get all school events
export const getAllSchoolEvents = (): SchoolEvent[] => {
  return [...schoolEvents];
};

// Function to get events by target type
export const getEventsByTargetType = (targetType: EventTargetType): SchoolEvent[] => {
  return schoolEvents.filter(event => event.targetTypes.includes(targetType));
};

// Function to get events for a specific class
export const getEventsForClass = (className: string): SchoolEvent[] => {
  return schoolEvents.filter(event => 
    (event.targetTypes.includes("class") && event.targetClasses?.includes(className)) ||
    (event.targetTypes.includes("school")) ||
    (event.targetTypes.includes("grade") && students.some(student => 
      student.homeroom === className && event.targetGrades?.some(grade => grade === student.grade)
    )) ||
    (event.targetTypes.includes("phase") && students.some(student => {
      return student.homeroom === className && event.targetPhases?.some(phaseId => {
        const phase = schoolPhases.find(p => p.id === phaseId);
        return phase?.grades.includes(student.grade);
      });
    }))
  );
};

// Function to get events for a specific grade
export const getEventsForGrade = (grade: number): SchoolEvent[] => {
  return schoolEvents.filter(event => 
    (event.targetTypes.includes("grade") && event.targetGrades?.includes(grade)) || 
    (event.targetTypes.includes("school")) ||
    (event.targetTypes.includes("phase") && event.targetPhases?.some(phaseId => {
      const phase = schoolPhases.find(p => p.id === phaseId);
      return phase?.grades.includes(grade);
    }))
  );
};

// Function to get events for a specific phase
export const getEventsForPhase = (phaseId: string): SchoolEvent[] => {
  return schoolEvents.filter(event => 
    (event.targetTypes.includes("phase") && event.targetPhases?.includes(phaseId)) || 
    (event.targetTypes.includes("school"))
  );
};

// Function to add a new school event
export const addSchoolEvent = (
  title: string,
  description: string,
  startDate: Date,
  endDate: Date,
  location: string,
  targetTypes: EventTargetType[],
  createdBy: string,
  targetDetails: {
    targetClasses?: string[];
    targetGrades?: number[];
    targetPhases?: string[];
  }
): SchoolEvent => {
  const now = new Date();
  const newId = `e${schoolEvents.length + 1}`;
  
  const newEvent: SchoolEvent = {
    id: newId,
    title,
    description,
    startDate,
    endDate,
    location,
    targetTypes,
    createdBy,
    createdAt: now,
    updatedAt: now,
    ...targetDetails
  };
  
  schoolEvents.push(newEvent);
  return newEvent;
};

// Task Status Types
export type TaskStatus = "outstanding" | "in_progress" | "complete_for_approval" | "late" | "archived";

// These are the display names for the statuses above
export const taskStatusDisplayNames = {
  "outstanding": "Outstanding",
  "in_progress": "In Progress",
  "complete_for_approval": "Complete for approval",
  "late": "Late",
  "archived": "Archived"
};

// Priority Levels
export type PriorityLevel = "low" | "medium" | "high" | "urgent";

// Document Link Type
export type DocumentLink = {
  title: string;
  url: string;
  description?: string;
};

// Student Document Types
export type StudentDocumentType = "parent_meeting" | "wellbeing" | "academic_intervention";

export const studentDocumentTypeLabels: Record<StudentDocumentType, string> = {
  parent_meeting: "Parent Meeting Notes",
  wellbeing: "Wellbeing Entry",
  academic_intervention: "Academic Intervention"
};

export interface StudentDocument {
  id: string;
  studentId: string;
  type: StudentDocumentType;
  title: string;
  content: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  // Additional fields for different document types
  observation?: string;
  reflections?: string;
  subjects?: string;
  academicConcerns?: string;
  proposedInterventions?: string;
  // Parent meeting specific fields
  staffAttendees?: string[]; // Array of teacher IDs that attended the meeting
  parentGuardians?: string; // Names of parents/guardians that attended
  concerns?: string; // Issues or concerns discussed in the meeting
  agreedNextSteps?: string; // Action items agreed upon by all parties
}

// Mock data for student documents
const studentDocuments: StudentDocument[] = [
  {
    id: '1',
    studentId: 's1',
    type: 'wellbeing',
    title: 'Classroom Behavior Assessment',
    content: 'Overall assessment of student behavior and wellbeing.',
    observation: 'Student was disruptive during math class by repeatedly talking out of turn.',
    reflections: 'May need additional support with focus or could benefit from more engaging activities.',
    createdBy: '1', // Teacher ID
    createdAt: new Date('2023-04-15'),
    updatedAt: new Date('2023-04-15')
  },
  {
    id: '2',
    studentId: 's1',
    type: 'academic_intervention',
    title: 'Reading Support',
    content: 'Student is receiving additional reading support with Ms. Johnson twice weekly.',
    subjects: 'English, Reading',
    academicConcerns: 'Difficulty with reading comprehension and vocabulary retention.',
    proposedInterventions: 'Twice weekly one-on-one sessions with reading specialist. Daily practice with vocabulary app.',
    createdBy: '1',
    createdAt: new Date('2023-03-10'),
    updatedAt: new Date('2023-03-10')
  },
  {
    id: '3',
    studentId: 's2',
    type: 'parent_meeting',
    title: 'Quarterly Progress Discussion',
    content: 'Met with parents to discuss progress in science class. Parents will help with science fair project.',
    createdBy: '2',
    createdAt: new Date('2023-04-05'),
    updatedAt: new Date('2023-04-05'),
    staffAttendees: ['Mary Johnson', 'David Williams'],
    parentGuardians: 'Mary Johnson, David Williams',
    concerns: 'Science fair project progress',
    agreedNextSteps: 'Complete project by May 15'
  },
  {
    id: '4',
    studentId: 's3',
    type: 'wellbeing',
    title: 'Counselor Referral',
    content: 'Student seems withdrawn lately. Referred to school counselor for check-in.',
    createdBy: '1',
    createdAt: new Date('2023-04-12'),
    updatedAt: new Date('2023-04-12')
  }
];

// Function to retrieve student documents
export const getStudentDocuments = (studentId: string, type?: StudentDocumentType): StudentDocument[] => {
  if (type) {
    return studentDocuments.filter(doc => doc.studentId === studentId && doc.type === type);
  }
  return studentDocuments.filter(doc => doc.studentId === studentId);
};

// Function to add a new student document
export function addStudentDocument(
  studentId: string,
  type: StudentDocumentType,
  title: string,
  content: string,
  createdBy: string,
  additionalFields?: {
    observation?: string;
    reflections?: string;
    subjects?: string;
    academicConcerns?: string;
    proposedInterventions?: string;
    staffAttendees?: string[];
    parentGuardians?: string;
    concerns?: string;
    agreedNextSteps?: string;
  }
): StudentDocument {
  const now = new Date();
  const newId = `doc${studentDocuments.length + 1}`;
  
  // Create new document with base fields
  const newDocument: StudentDocument = {
    id: newId,
    studentId,
    type,
    title,
    content,
    createdBy,
    createdAt: now,
    updatedAt: now,
  };
  
  // Add additional fields based on document type
  if (additionalFields) {
    Object.assign(newDocument, additionalFields);
  }
  
  // Add to documents array
  studentDocuments.push(newDocument);
  
  return newDocument;
}

// Task Data
export const tasks = [
  {
    id: "1",
    title: "Submit Quarterly Grades",
    description: "Enter all student grades for the quarter into the system by the deadline.",
    assignedTo: ["1", "2", "3", "4", "5"], // All teachers
    assignedToGroups: ["4"],
    assignedBy: "m1", // Admin assigned
    createdBy: "m1", // Track who created the task (default to admin for existing tasks)
    dueDate: "2025-05-15T23:59:59",
    status: "outstanding" as TaskStatus,
    priority: "high" as PriorityLevel,
    createdAt: "2025-04-20T09:00:00",
    attachments: [
      { name: "Grading Guidelines.pdf", url: "#" }
    ],
    documentLinks: [
      { 
        title: "School Grading Policy",
        url: "https://example.com/grading-policy",
        description: "Official grading policy document for reference"
      },
      {
        title: "Student Information System",
        url: "https://sis.school.edu",
        description: "Link to the SIS where grades should be entered"
      }
    ]
  },
  {
    id: "2",
    title: "Prepare for Science Fair",
    description: "Select student projects and prepare displays for the upcoming science fair.",
    assignedTo: ["2"], // Sarah Johnson
    assignedToGroups: ["2"],
    assignedBy: "m1", // Admin assigned
    createdBy: "m1", 
    dueDate: "2025-05-20T15:00:00",
    status: "in_progress" as TaskStatus,
    priority: "medium" as PriorityLevel,
    createdAt: "2025-04-18T11:30:00",
    attachments: [
      { name: "Science Fair Guidelines.docx", url: "#" },
      { name: "Project Rubric.pdf", url: "#" }
    ],
    documentLinks: [
      {
        title: "Previous Science Fair Photos",
        url: "https://photos.school.edu/science-fair-2024",
        description: "Photos from last year's event for reference"
      }
    ]
  },
  {
    id: "3",
    title: "Curriculum Planning Meeting",
    description: "Attend the curriculum planning meeting to discuss next semester's materials and objectives.",
    assignedTo: ["1", "2", "3", "4"], // All except PE teacher
    assignedToGroups: ["1", "2", "3"],
    assignedBy: "m1", // Admin assigned
    createdBy: "m1",
    dueDate: "2025-04-30T13:00:00",
    status: "outstanding" as TaskStatus,
    priority: "high" as PriorityLevel,
    createdAt: "2025-04-15T10:15:00",
    attachments: [],
    documentLinks: [
      {
        title: "Meeting Agenda",
        url: "https://docs.school.edu/curriculum-meeting-agenda",
        description: "Agenda for the upcoming planning meeting"
      },
      {
        title: "Curriculum Framework Document",
        url: "https://docs.school.edu/curriculum-framework"
      }
    ]
  },
  {
    id: "4",
    title: "Submit Field Trip Proposal",
    description: "Complete and submit proposal for end-of-year field trip including budget and itinerary.",
    assignedTo: ["3", "4"], // English and History teachers
    assignedToGroups: ["3"],
    assignedBy: "m1", // Admin assigned
    createdBy: "m1",
    dueDate: "2025-05-10T17:00:00",
    status: "complete_for_approval" as TaskStatus,
    priority: "medium" as PriorityLevel,
    createdAt: "2025-04-05T14:20:00",
    attachments: [
      { name: "Field Trip Form.pdf", url: "#" },
      { name: "Budget Template.xlsx", url: "#" }
    ],
    documentLinks: [
      {
        title: "Field Trip Policy",
        url: "https://example.com/field-trip-policy"
      }
    ]
  },
  {
    id: "5",
    title: "Sports Day Planning",
    description: "Organize activities and equipment for the annual school sports day.",
    assignedTo: ["5"], // PE teacher
    assignedToGroups: [],
    assignedBy: "m1", // Admin assigned
    createdBy: "m1",
    dueDate: "2025-05-25T12:00:00",
    status: "late" as TaskStatus,
    priority: "urgent" as PriorityLevel,
    createdAt: "2025-04-10T08:45:00",
    attachments: [
      { name: "Last Year's Schedule.pdf", url: "#" }
    ],
    documentLinks: [
      {
        title: "School Athletic Field Map",
        url: "https://maps.school.edu/athletic-fields",
        description: "Map of available areas for sports activities"
      }
    ]
  },
  // Teacher-created tasks examples
  {
    id: "6",
    title: "Math Department Collaboration",
    description: "Share teaching resources and lesson plans for the upcoming algebra unit.",
    assignedTo: ["2"], // Assigned to Sarah Johnson
    assignedToGroups: [],
    assignedBy: "1", // Assigned by John Smith
    createdBy: "1", // Created by John Smith
    dueDate: "2025-05-05T16:00:00",
    status: "outstanding" as TaskStatus,
    priority: "medium" as PriorityLevel,
    createdAt: "2025-04-22T14:30:00",
    attachments: [],
    documentLinks: [
      {
        title: "Shared Math Resources Folder",
        url: "https://drive.school.edu/math-resources"
      }
    ]
  },
  {
    id: "7",
    title: "Science Lab Equipment Check",
    description: "Please verify all lab equipment is working for next week's experiments.",
    assignedTo: ["3"], // Assigned to Michael Davis
    assignedToGroups: [],
    assignedBy: "2", // Assigned by Sarah Johnson
    createdBy: "2", // Created by Sarah Johnson
    dueDate: "2025-04-28T15:00:00",
    status: "in_progress" as TaskStatus,
    priority: "high" as PriorityLevel,
    createdAt: "2025-04-21T09:45:00",
    attachments: [],
    documentLinks: [
      {
        title: "Lab Equipment Inventory",
        url: "https://drive.school.edu/science-inventory",
        description: "Current inventory of all lab equipment"
      },
      {
        title: "Equipment Maintenance Guidelines",
        url: "https://docs.school.edu/lab-maintenance"
      }
    ]
  },
  // Additional tasks for different tabs
  {
    id: "8",
    title: "Update Classroom Reading List",
    description: "Review and update the classroom reading list for next semester.",
    assignedTo: ["4"], // Assigned to English teacher
    assignedToGroups: [],
    assignedBy: "1", // Assigned by John Smith (Math teacher)
    createdBy: "1",
    dueDate: "2025-05-12T16:00:00",
    status: "complete_for_approval" as TaskStatus, // For "Tasks to Review" tab for John Smith
    priority: "medium" as PriorityLevel,
    createdAt: "2025-04-15T11:30:00",
    attachments: [
      { name: "Current Reading List.docx", url: "#" }
    ],
    documentLinks: [
      {
        title: "Literature Curriculum Guidelines",
        url: "https://docs.school.edu/literature-guidelines"
      }
    ]
  },
  {
    id: "9",
    title: "Staff Meeting Presentation",
    description: "Prepare a 10-minute presentation on your classroom technology integration for the next staff meeting.",
    assignedTo: ["3"], // Assigned to Michael Davis
    assignedToGroups: [],
    assignedBy: "m1", // Admin assigned
    createdBy: "m1",
    dueDate: "2025-05-08T15:00:00",
    status: "complete_for_approval" as TaskStatus, // For "Submitted Tasks" tab
    priority: "high" as PriorityLevel,
    createdAt: "2025-04-10T09:45:00",
    attachments: [
      { name: "Presentation Template.pptx", url: "#" }
    ],
    documentLinks: [
      {
        title: "Meeting Schedule",
        url: "https://calendar.school.edu/staff-meetings"
      }
    ]
  },
  {
    id: "10",
    title: "Annual Inventory Check",
    description: "Complete the annual inventory check for your classroom supplies and equipment.",
    assignedTo: ["2"], // Assigned to Sarah Johnson
    assignedToGroups: [],
    assignedBy: "m1", // Admin assigned
    createdBy: "m1",
    dueDate: "2025-04-22T16:00:00",
    status: "archived" as TaskStatus, // For "Archived Tasks" tab
    priority: "medium" as PriorityLevel,
    createdAt: "2025-04-01T11:00:00",
    attachments: [
      { name: "Inventory Checklist.pdf", url: "#" }
    ],
    documentLinks: [
      {
        title: "Supply Request Form",
        url: "https://forms.school.edu/supply-request"
      }
    ]
  },
  {
    id: "11",
    title: "Parent-Teacher Conference Preparation",
    description: "Prepare student progress reports and materials for upcoming parent-teacher conferences.",
    assignedTo: ["1", "2", "3", "4", "5"], // All teachers
    assignedToGroups: [],
    assignedBy: "m1", // Admin assigned
    createdBy: "m1",
    dueDate: "2025-05-15T16:00:00",
    status: "archived" as TaskStatus, // For "Archived Tasks" tab
    priority: "high" as PriorityLevel,
    createdAt: "2025-04-15T08:30:00",
    attachments: [
      { name: "Report Template.docx", url: "#" }
    ],
    documentLinks: [
      {
        title: "Conference Schedule",
        url: "https://calendar.school.edu/parent-conferences"
      }
    ]
  },
  {
    id: "12",
    title: "Classroom Decoration for Spring",
    description: "Decorate your classroom with spring-themed materials to create an engaging learning environment.",
    assignedTo: ["3"], // Michael Davis
    assignedToGroups: [],
    assignedBy: "2", // Assigned by Sarah Johnson
    createdBy: "2",
    dueDate: "2025-04-25T16:00:00",
    status: "complete_for_approval" as TaskStatus, // For "Tasks to Review" tab for Sarah Johnson
    priority: "low" as PriorityLevel,
    createdAt: "2025-04-18T10:15:00",
    attachments: [],
    documentLinks: [
      {
        title: "Decoration Ideas",
        url: "https://pinterest.com/school/spring-classroom"
      }
    ]
  },
  {
    id: "13",
    title: "Professional Development Plan",
    description: "Complete your annual professional development plan for the upcoming academic year.",
    assignedTo: ["1", "2", "3", "4", "5"], // All teachers
    assignedToGroups: [],
    assignedBy: "m1", // Admin assigned
    createdBy: "m1",
    dueDate: "2025-05-30T17:00:00",
    status: "outstanding" as TaskStatus, // For "Active Tasks" tab
    priority: "medium" as PriorityLevel,
    createdAt: "2025-04-20T08:00:00",
    attachments: [
      { name: "PD Plan Template.docx", url: "#" }
    ],
    documentLinks: [
      {
        title: "Professional Development Opportunities",
        url: "https://pd.school.edu/opportunities"
      }
    ]
  },
  {
    id: "14",
    title: "End-of-Year Student Awards Nominations",
    description: "Submit nominations for student achievement awards for the end-of-year ceremony.",
    assignedTo: ["1"], // John Smith
    assignedToGroups: [],
    assignedBy: "5", // Assigned by Robert Brown
    createdBy: "5",
    dueDate: "2025-05-18T16:00:00",
    status: "complete_for_approval" as TaskStatus, // For "Tasks to Review" tab for Robert Brown
    priority: "medium" as PriorityLevel,
    createdAt: "2025-04-12T14:00:00",
    attachments: [
      { name: "Nomination Form.pdf", url: "#" }
    ],
    documentLinks: [
      {
        title: "Award Categories",
        url: "https://docs.school.edu/award-categories"
      }
    ]
  },
  {
    id: "15",
    title: "Summer School Planning",
    description: "Submit your availability and preferred subjects for summer school teaching.",
    assignedTo: ["1", "2", "3", "4", "5"], // All teachers
    assignedToGroups: [],
    assignedBy: "m1", // Admin assigned
    createdBy: "m1",
    dueDate: "2025-05-25T16:00:00",
    status: "outstanding" as TaskStatus, // For "Active Tasks" tab
    priority: "medium" as PriorityLevel,
    createdAt: "2025-04-20T09:30:00",
    attachments: [
      { name: "Summer School Schedule.pdf", url: "#" }
    ],
    documentLinks: [
      {
        title: "Summer School Course Descriptions",
        url: "https://docs.school.edu/summer-courses"
      }
    ]
  },
  // New tasks for John Smith to review
  {
    id: "16",
    title: "Classroom Homework Analysis",
    description: "Complete analysis of homework completion rates for the semester.",
    assignedTo: ["2"], // Assigned to Sarah Johnson
    assignedToGroups: [],
    assignedBy: "1", // Assigned by John Smith (Math teacher)
    createdBy: "1",
    dueDate: "2025-05-05T16:00:00",
    status: "complete_for_approval" as TaskStatus, // For "Tasks to Review" tab for John Smith
    priority: "high" as PriorityLevel,
    createdAt: "2025-04-10T14:30:00",
    attachments: [
      { name: "Homework Data Template.xlsx", url: "#" }
    ],
    documentLinks: [
      {
        title: "Data Analysis Guidelines",
        url: "https://docs.school.edu/data-analysis-guidelines"
      }
    ]
  },
  {
    id: "17",
    title: "Math Curriculum Review",
    description: "Review and provide feedback on the new math curriculum materials for next year.",
    assignedTo: ["3"], // Assigned to Michael Davis
    assignedToGroups: [],
    assignedBy: "1", // Assigned by John Smith (Math teacher)
    createdBy: "1",
    dueDate: "2025-05-12T15:30:00",
    status: "complete_for_approval" as TaskStatus, // For "Tasks to Review" tab for John Smith
    priority: "medium" as PriorityLevel,
    createdAt: "2025-04-15T09:15:00",
    attachments: [
      { name: "New Curriculum Guide.pdf", url: "#" }
    ],
    documentLinks: [
      {
        title: "Curriculum Standards Reference",
        url: "https://docs.school.edu/math-standards"
      }
    ]
  },
  {
    id: "18",
    title: "STEM Project Coordination",
    description: "Finalize the interdisciplinary STEM project details including timelines and resource requirements.",
    assignedTo: ["5"], // Assigned to Robert Brown
    assignedToGroups: [],
    assignedBy: "1", // Assigned by John Smith (Math teacher)
    createdBy: "1",
    dueDate: "2025-05-18T17:00:00",
    status: "complete_for_approval" as TaskStatus, // For "Tasks to Review" tab for John Smith
    priority: "high" as PriorityLevel,
    createdAt: "2025-04-20T11:45:00",
    attachments: [
      { name: "STEM Project Outline.docx", url: "#" }
    ],
    documentLinks: [
      {
        title: "Project-Based Learning Resources",
        url: "https://docs.school.edu/project-based-learning"
      }
    ]
  }
];

// Helper function to get tasks for a specific teacher
export const getTasksForTeacher = (teacherId: string) => {
  return tasks.filter(task => task.assignedTo.includes(teacherId));
};

// Helper function to get tasks created by a specific teacher
export const getTasksCreatedByTeacher = (teacherId: string) => {
  return tasks.filter(task => task.createdBy === teacherId);
};

// Helper function to get tasks for a specific group
export const getTasksForGroup = (groupId: string) => {
  return tasks.filter(task => task.assignedToGroups.includes(groupId));
};

// Helper function to get teacher by ID
export const getTeacherById = (teacherId: string) => {
  return teachers.find(teacher => teacher.id === teacherId);
};

// Helper function to get group by ID
export const getGroupById = (groupId: string) => {
  return groups.find(group => group.id === groupId);
};

// Helper function to get staff member by ID
export const getStaffById = (staffId: string) => {
  return staff.find(member => member.id === staffId);
};

// Helper function to get creator info (teacher or staff)
export const getCreatorById = (creatorId: string) => {
  return getTeacherById(creatorId) || getStaffById(creatorId);
};

// Helper function to get student by ID
export const getStudentById = (studentId: string) => {
  return students.find(student => student.id === studentId);
};

// Helper function to update student information
export const updateStudent = (
  studentId: string,
  updatedInfo: {
    name?: string;
    email?: string;
    grade?: number | string;
    homeroom?: string;
    guardian?: string;
    guardianEmail?: string;
    guardianPhone?: string;
    gpa?: number;
    attendance?: number;
  }
): boolean => {
  const studentIndex = students.findIndex(student => student.id === studentId);
  
  if (studentIndex === -1) return false;
  
  // Make a copy of the updated info to avoid modifying the original object
  const processedInfo: Partial<typeof students[0]> = {};
  
  // Copy all properties except grade first
  if (updatedInfo.name !== undefined) processedInfo.name = updatedInfo.name;
  if (updatedInfo.email !== undefined) processedInfo.email = updatedInfo.email;
  if (updatedInfo.homeroom !== undefined) processedInfo.homeroom = updatedInfo.homeroom;
  if (updatedInfo.guardian !== undefined) processedInfo.guardian = updatedInfo.guardian;
  if (updatedInfo.guardianEmail !== undefined) processedInfo.guardianEmail = updatedInfo.guardianEmail;
  if (updatedInfo.guardianPhone !== undefined) processedInfo.guardianPhone = updatedInfo.guardianPhone;
  if (updatedInfo.gpa !== undefined) processedInfo.gpa = updatedInfo.gpa;
  if (updatedInfo.attendance !== undefined) processedInfo.attendance = updatedInfo.attendance;
  
  // Handle grade conversion separately to ensure type safety
  if (updatedInfo.grade !== undefined) {
    // If it's already a number, use it directly
    if (typeof updatedInfo.grade === 'number') {
      processedInfo.grade = updatedInfo.grade;
    } else {
      // Try to convert string to number
      const gradeNum = parseInt(updatedInfo.grade);
      if (!isNaN(gradeNum)) {
        processedInfo.grade = gradeNum;
      }
      // If conversion fails, we don't add grade to processedInfo
    }
  }
  
  // Update student information
  students[studentIndex] = {
    ...students[studentIndex],
    ...processedInfo
  };
  
  return true;
};

// Incident Types
export type IncidentType = "bullying" | "fighting" | "property_damage" | "behavior" | "medical" | "other";

export const incidentTypeLabels: Record<IncidentType, string> = {
  "bullying": "Bullying",
  "fighting": "Fighting",
  "property_damage": "Property Damage",
  "behavior": "Disruptive Behavior",
  "medical": "Medical Incident",
  "other": "Other"
};

// Incident Severity Levels
export type IncidentSeverity = "minor" | "moderate" | "major" | "critical";

export const incidentSeverityLabels: Record<IncidentSeverity, string> = {
  "minor": "Minor",
  "moderate": "Moderate",
  "major": "Major",
  "critical": "Critical"
};

// Incident status labels
export const incidentStatusLabels: Record<"open" | "under_investigation" | "resolved", string> = {
  "open": "Open",
  "under_investigation": "Under Investigation",
  "resolved": "Resolved"
};

// Incident Interface
export interface Incident {
  id: string;
  title: string;
  type: IncidentType;
  description: string;
  date: Date;
  location: string;
  initiators: string[];
  affectedStudents: string[];
  witnesses?: string[];
  involvedTeachers?: string[];
  severity: IncidentSeverity;
  reportedBy: string;
  status: "open" | "under_investigation" | "resolved";
  resolution?: string;
  parentNotified?: boolean;
  requiresParentNotification?: boolean;
  requiresIntervention?: boolean;
  intervened?: boolean;
  postIncidentIntervention?: string;
  followUpActions?: string[];
  createdAt: Date;
  updatedAt?: Date;
}

// Mock data for incidents
const incidents: Incident[] = [
  {
    id: "i1",
    title: "Verbal altercation in cafeteria",
    type: "behavior",
    description: "Students engaged in a heated verbal exchange during lunch period that almost escalated to physical confrontation.",
    date: new Date("2024-05-02T12:15:00"),
    location: "Cafeteria",
    initiators: ["s1", "s3"],
    affectedStudents: [],
    witnesses: ["s2", "s5"],
    severity: "moderate",
    reportedBy: "4", // Emily Wilson (History Teacher)
    status: "resolved",
    resolution: "Students were separated and counseled. Both received lunch detention for 3 days.",
    createdAt: new Date("2024-05-02T13:30:00"),
    updatedAt: new Date("2024-05-03T10:15:00"),
    parentNotified: true,
    requiresIntervention: true,
    followUpActions: ["Check-in with guidance counselor", "Separate seating assignments"]
  },
  {
    id: "i2",
    title: "Bullying incident on playground",
    type: "bullying",
    description: "Student reported ongoing harassment and exclusion from group activities during recess.",
    date: new Date("2024-04-28T10:30:00"),
    location: "Playground",
    initiators: ["s5"],
    affectedStudents: ["s2"],
    witnesses: ["s4"],
    severity: "major",
    reportedBy: "5", // Robert Brown (PE Teacher)
    status: "under_investigation",
    createdAt: new Date("2024-04-28T11:45:00"),
    updatedAt: new Date("2024-04-29T09:20:00"),
    parentNotified: true,
    requiresIntervention: false,
    followUpActions: ["Meeting with school counselor", "Anti-bullying workshop for class"]
  },
  {
    id: "i3",
    title: "Property damage in science lab",
    type: "property_damage",
    description: "Science equipment was deliberately damaged during class experiment.",
    date: new Date("2024-05-01T14:20:00"),
    location: "Science Lab",
    initiators: ["s3"],
    affectedStudents: [],
    severity: "moderate",
    reportedBy: "2", // Sarah Johnson (Science Teacher)
    status: "open",
    createdAt: new Date("2024-05-01T15:10:00"),
    updatedAt: new Date("2024-05-01T15:10:00"),
    parentNotified: false
  },
];

// Function to get all incidents
export const getAllIncidents = (): Incident[] => {
  return [...incidents];
};

// Function to get incidents by status
export const getIncidentsByStatus = (status: Incident['status']): Incident[] => {
  return incidents.filter(incident => incident.status === status);
};

// Function to get incidents by type
export const getIncidentsByType = (type: IncidentType): Incident[] => {
  return incidents.filter(incident => incident.type === type);
};

// Function to get incidents by student (either as initiator or affected student)
export const getIncidentsByStudent = (studentId: string): Incident[] => {
  return incidents.filter(incident => 
    incident.initiators.includes(studentId) || 
    incident.affectedStudents.includes(studentId) || 
    (incident.witnesses && incident.witnesses.includes(studentId))
  );
};

// Function to get incidents by reporter (teacher)
export const getIncidentsByReporter = (teacherId: string): Incident[] => {
  return incidents.filter(incident => incident.reportedBy === teacherId);
};

// Function to get incident by ID
export const getIncidentById = (id: string): Incident | undefined => {
  return incidents.find(incident => incident.id === id);
};

// Function to add a new incident
export const addIncident = (incidentData: Omit<Incident, 'id' | 'createdAt' | 'updatedAt'>): Incident => {
  const now = new Date();
  const newId = `i${incidents.length + 1}`;
  
  const newIncident: Incident = {
    id: newId,
    ...incidentData,
    createdAt: now,
    updatedAt: now
  };
  
  incidents.push(newIncident);
  return newIncident;
};

// Function to update an incident
export const updateIncident = (id: string, updates: Partial<Omit<Incident, 'id' | 'createdAt'>>): boolean => {
  const incidentIndex = incidents.findIndex(incident => incident.id === id);
  if (incidentIndex === -1) return false;
  
  incidents[incidentIndex] = {
    ...incidents[incidentIndex],
    ...updates,
    updatedAt: new Date()
  };
  
  return true;
};

// Function to delete an incident
export const deleteIncident = (id: string): boolean => {
  const initialLength = incidents.length;
  const filteredIncidents = incidents.filter(incident => incident.id !== id);
  
  if (filteredIncidents.length === initialLength) return false;
  
  // Replace the array contents
  incidents.length = 0;
  incidents.push(...filteredIncidents);
  
  return true;
};

// Campus Locations
export interface CampusLocation {
  id: string;
  name: string;
  address?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

// Mock data for campus locations
const campusLocations: CampusLocation[] = [
  {
    id: "cl1",
    name: "Barnstaple Campus",
    address: "123 Barnstaple Road",
    isActive: true,
    createdAt: new Date("2023-01-01")
  },
  {
    id: "cl2",
    name: "Wesbury Campus",
    address: "456 Wesbury Avenue",
    isActive: true,
    createdAt: new Date("2023-01-01")
  },
  {
    id: "cl3",
    name: "Rosmead Campus",
    address: "789 Rosmead Street",
    isActive: true,
    createdAt: new Date("2023-01-01")
  }
];

// Function to get all campus locations
export const getAllCampusLocations = (): CampusLocation[] => {
  return [...campusLocations];
};

// Function to get active campus locations
export const getActiveCampusLocations = (): CampusLocation[] => {
  return campusLocations.filter(location => location.isActive);
};

// Function to get campus location by ID
export const getCampusLocationById = (id: string): CampusLocation | undefined => {
  return campusLocations.find(location => location.id === id);
};

// Function to add a new campus location
export const addCampusLocation = (name: string, address?: string): CampusLocation => {
  const now = new Date();
  const newId = `cl${campusLocations.length + 1}`;
  
  const newLocation: CampusLocation = {
    id: newId,
    name,
    address,
    isActive: true,
    createdAt: now,
    updatedAt: now
  };
  
  campusLocations.push(newLocation);
  return newLocation;
};

// Function to update a campus location
export const updateCampusLocation = (id: string, updates: Partial<Omit<CampusLocation, 'id' | 'createdAt'>>): boolean => {
  const locationIndex = campusLocations.findIndex(location => location.id === id);
  if (locationIndex === -1) return false;
  
  campusLocations[locationIndex] = {
    ...campusLocations[locationIndex],
    ...updates,
    updatedAt: new Date()
  };
  
  return true;
};

// Function to toggle campus location active status
export const toggleCampusLocationStatus = (id: string): boolean => {
  const locationIndex = campusLocations.findIndex(location => location.id === id);
  if (locationIndex === -1) return false;
  
  campusLocations[locationIndex] = {
    ...campusLocations[locationIndex],
    isActive: !campusLocations[locationIndex].isActive,
    updatedAt: new Date()
  };
  
  return true;
};

// Function to delete a campus location
export const deleteCampusLocation = (id: string): boolean => {
  const initialLength = campusLocations.length;
  const filteredLocations = campusLocations.filter(location => location.id !== id);
  
  if (filteredLocations.length === initialLength) return false;
  
  // Replace the array contents
  campusLocations.length = 0;
  campusLocations.push(...filteredLocations);
  
  return true;
}; 

// Leave types
export type LeaveType = "sick" | "annual" | "compassionate" | "study" | "other";

export const leaveTypeLabels: Record<LeaveType, string> = {
  sick: "Sick Leave",
  annual: "Annual Leave",
  compassionate: "Compassionate Leave",
  study: "Study Leave",
  other: "Other Leave"
};

// Leave status
export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";

export const leaveStatusLabels: Record<LeaveStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled"
};

// Leave request interface
export interface LeaveRequest {
  id: string;
  teacherId: string;
  type: LeaveType;
  startDate: Date;
  endDate: Date;
  reason: string;
  status: LeaveStatus;
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
  documents?: string[]; // URLs to supporting documents
  createdAt: Date;
  updatedAt?: Date;
}

// Mock data for leave requests
const leaveRequests: LeaveRequest[] = [
  {
    id: "l1",
    teacherId: "1", // John Smith
    type: "sick",
    startDate: new Date("2024-05-10"),
    endDate: new Date("2024-05-12"),
    reason: "Flu symptoms",
    status: "approved",
    reviewedBy: "m1",
    reviewedAt: new Date("2024-05-09"),
    reviewNotes: "Supporting medical certificate provided",
    createdAt: new Date("2024-05-08")
  },
  {
    id: "l2",
    teacherId: "2", // Sarah Johnson
    type: "annual",
    startDate: new Date("2024-06-15"),
    endDate: new Date("2024-06-25"),
    reason: "Family vacation",
    status: "pending",
    createdAt: new Date("2024-05-01")
  },
  {
    id: "l3",
    teacherId: "3", // Michael Davis
    type: "study",
    startDate: new Date("2024-07-05"),
    endDate: new Date("2024-07-07"),
    reason: "Professional development workshop",
    status: "approved",
    reviewedBy: "m1",
    reviewedAt: new Date("2024-05-20"),
    createdAt: new Date("2024-05-15")
  },
  {
    id: "l4",
    teacherId: "4", // Emily Wilson
    type: "compassionate",
    startDate: new Date("2024-05-20"),
    endDate: new Date("2024-05-22"),
    reason: "Family emergency",
    status: "approved",
    reviewedBy: "m1",
    reviewedAt: new Date("2024-05-19"),
    createdAt: new Date("2024-05-18")
  },
  {
    id: "l5",
    teacherId: "1", // John Smith
    type: "other",
    startDate: new Date("2024-08-10"),
    endDate: new Date("2024-08-11"),
    reason: "Personal matters",
    status: "rejected",
    reviewedBy: "m1",
    reviewedAt: new Date("2024-05-25"),
    reviewNotes: "Insufficient notice period",
    createdAt: new Date("2024-05-24")
  }
];

// Function to get all leave requests
export const getAllLeaveRequests = (): LeaveRequest[] => {
  return [...leaveRequests];
};

// Function to get leave requests by teacher
export const getLeaveRequestsByTeacher = (teacherId: string): LeaveRequest[] => {
  return leaveRequests.filter(leave => leave.teacherId === teacherId);
};

// Function to get leave requests by status
export const getLeaveRequestsByStatus = (status: LeaveStatus): LeaveRequest[] => {
  return leaveRequests.filter(leave => leave.status === status);
};

// Function to add a new leave request
export const addLeaveRequest = (
  teacherId: string,
  type: LeaveType,
  startDate: Date,
  endDate: Date,
  reason: string,
  documents?: string[]
): LeaveRequest => {
  const newLeaveRequest: LeaveRequest = {
    id: `l${leaveRequests.length + 1}`,
    teacherId,
    type,
    startDate,
    endDate,
    reason,
    status: "pending",
    documents,
    createdAt: new Date()
  };
  
  leaveRequests.push(newLeaveRequest);
  return newLeaveRequest;
};

// Function to update leave request status
export const updateLeaveRequestStatus = (
  id: string, 
  status: LeaveStatus, 
  reviewedBy: string,
  reviewNotes?: string
): boolean => {
  const leaveIndex = leaveRequests.findIndex(leave => leave.id === id);
  if (leaveIndex === -1) return false;
  
  leaveRequests[leaveIndex] = {
    ...leaveRequests[leaveIndex],
    status,
    reviewedBy,
    reviewedAt: new Date(),
    reviewNotes,
    updatedAt: new Date()
  };
  
  return true;
};

// Function to cancel a leave request
export const cancelLeaveRequest = (id: string): boolean => {
  const leaveIndex = leaveRequests.findIndex(leave => leave.id === id);
  if (leaveIndex === -1) return false;
  
  // Only allow cancellation if status is pending
  if (leaveRequests[leaveIndex].status !== "pending") return false;
  
  leaveRequests[leaveIndex] = {
    ...leaveRequests[leaveIndex],
    status: "cancelled",
    updatedAt: new Date()
  };
  
  return true;
};

// Function to get a leave request by ID
export const getLeaveRequestById = (id: string): LeaveRequest | undefined => {
  return leaveRequests.find(leave => leave.id === id);
}; 