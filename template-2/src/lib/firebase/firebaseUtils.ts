import { auth, db, storage } from "./firebase";
import {
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  User as FirebaseUser
} from "firebase/auth";
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  serverTimestamp,
  Timestamp,
  orderBy,
  limit,
  DocumentData,
  writeBatch
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { LeaveRequest, LeaveType, LeaveStatus } from "@/lib/data";

// Auth functions
export const logoutUser = () => signOut(auth);

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const checkUserExists = async (email: string) => {
  try {
    const q = query(collection(db, "users"), where("email", "==", email));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error("Error checking if user exists:", error);
    return false;
  }
};

export const createUser = async (
  email: string,
  password: string,
  displayName: string,
  role: string,
  additionalData?: {
    subject?: string;
    specialization?: string;
    department?: string;
  }
) => {
  try {
    // Create auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Store user in Firestore with additional data if provided
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: displayName,
      role: role,
      subject: additionalData?.subject || '',
      specialization: additionalData?.specialization || '',
      department: additionalData?.department || '',
      createdAt: serverTimestamp(),
    });

    return user;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

export const loginWithEmailAndPassword = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Error logging in:", error);
    throw error;
  }
};

// Firestore functions
export const addDocument = (collectionName: string, data: any) =>
  addDoc(collection(db, collectionName), data);

export const getDocuments = async (collectionName: string) => {
  const querySnapshot = await getDocs(collection(db, collectionName));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

export const getDocumentById = async (collectionName: string, id: string) => {
  const docRef = doc(db, collectionName, id);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...docSnap.data()
    };
  } else {
    return null;
  }
};

export const updateDocument = (collectionName: string, id: string, data: any) =>
  updateDoc(doc(db, collectionName, id), data);

export const deleteDocument = (collectionName: string, id: string) =>
  deleteDoc(doc(db, collectionName, id));

// Storage functions
export const uploadFile = async (file: File, path: string) => {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};

// Teacher specific functions
export const getAllTeachers = async () => {
  try {
    console.log("Fetching all teachers from Firestore...");
    
    // Get users with explicit teacher role from Firestore only
    const usersRef = collection(db, "users");
    const teacherQuery = query(usersRef, where("role", "==", "teacher"));
    const teacherSnapshot = await getDocs(teacherQuery);
    
    console.log(`Found ${teacherSnapshot.size} teachers in Firestore`);
    
    // Map documents to required format with null checks
    return teacherSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.displayName || (data.email ? data.email.split("@")[0] : "Unknown Teacher"),
        email: data.email || "",
        role: data.subject ? `${data.subject} Teacher` : 'Teacher',
        subject: data.subject || '',
        specialization: data.specialization || '',
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
      };
    });
  } catch (error) {
    console.error("Error fetching teachers from Firestore:", error);
    return [];
  }
};

export const getTeacherById = async (id: string) => {
  return getDocumentById("users", id);
};

// Task specific functions
export const createTask = async (taskData: any) => {
  try {
    // If there are assigned groups, fetch all members and add them to assignedTo
    if (taskData.assignedToGroups && taskData.assignedToGroups.length > 0) {
      // Start with the directly assigned teachers
      let allAssignedTeachers = [...(taskData.assignedTo || [])];
      
      // For each group, get its members and add them to assignedTo
      for (const groupId of taskData.assignedToGroups) {
        const groupData = await getGroupById(groupId);
        if (groupData && groupData.members && Array.isArray(groupData.members)) {
          // Add each group member to the assigned teachers if not already included
          groupData.members.forEach((memberId: string) => {
            if (!allAssignedTeachers.includes(memberId)) {
              allAssignedTeachers.push(memberId);
            }
          });
        }
      }
      
      // Update the taskData with the complete list of teachers
      taskData.assignedTo = allAssignedTeachers;
      console.log(`Task assigned to ${allAssignedTeachers.length} teachers (including group members)`);
    }
    
    // Create the task in Firestore
    return addDoc(collection(db, "tasks"), {
      ...taskData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error creating task:", error);
    throw error;
  }
};

export const getTasksForTeacher = async (teacherId: string) => {
  const tasksRef = collection(db, "tasks");
  const q = query(tasksRef, where("assignedTo", "array-contains", teacherId));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

export const getTasksCreatedByTeacher = async (teacherId: string) => {
  const tasksRef = collection(db, "tasks");
  const q = query(tasksRef, where("createdBy", "==", teacherId));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

export const updateTaskStatus = async (taskId: string, status: string) => {
  const taskRef = doc(db, "tasks", taskId);
  return updateDoc(taskRef, { 
    status: status,
    updatedAt: serverTimestamp()
  });
};

// Leave request specific functions
export const createLeaveRequest = async (
  teacherId: string,
  type: LeaveType,
  startDate: Date,
  endDate: Date,
  reason: string,
  documents?: string[]
) => {
  return addDoc(collection(db, "leaveRequests"), {
    teacherId,
    type,
    startDate: Timestamp.fromDate(startDate),
    endDate: Timestamp.fromDate(endDate),
    reason,
    status: "pending" as LeaveStatus,
    documents: documents || [],
    createdAt: serverTimestamp()
  });
};

export const getAllLeaveRequests = async () => {
  const leaveRef = collection(db, "leaveRequests");
  const q = query(leaveRef, orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    // Convert Firestore Timestamps to JavaScript Dates
    return {
      id: doc.id,
      ...data,
      startDate: data.startDate.toDate(),
      endDate: data.endDate.toDate(),
      createdAt: data.createdAt?.toDate(),
      reviewedAt: data.reviewedAt?.toDate()
    };
  }) as LeaveRequest[];
};

export const getLeaveRequestsByTeacher = async (teacherId: string) => {
  const leaveRef = collection(db, "leaveRequests");
  const q = query(
    leaveRef, 
    where("teacherId", "==", teacherId),
    orderBy("createdAt", "desc")
  );
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    // Convert Firestore Timestamps to JavaScript Dates
    return {
      id: doc.id,
      ...data,
      startDate: data.startDate.toDate(),
      endDate: data.endDate.toDate(),
      createdAt: data.createdAt?.toDate(),
      reviewedAt: data.reviewedAt?.toDate()
    };
  }) as LeaveRequest[];
};

export const getLeaveRequestsByStatus = async (status: LeaveStatus) => {
  const leaveRef = collection(db, "leaveRequests");
  const q = query(
    leaveRef, 
    where("status", "==", status),
    orderBy("createdAt", "desc")
  );
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    // Convert Firestore Timestamps to JavaScript Dates
    return {
      id: doc.id,
      ...data,
      startDate: data.startDate.toDate(),
      endDate: data.endDate.toDate(),
      createdAt: data.createdAt?.toDate(),
      reviewedAt: data.reviewedAt?.toDate()
    };
  }) as LeaveRequest[];
};

export const updateLeaveRequestStatus = async (
  id: string, 
  status: LeaveStatus, 
  reviewedBy: string,
  reviewNotes?: string
) => {
  const leaveRef = doc(db, "leaveRequests", id);
  return updateDoc(leaveRef, { 
    status,
    reviewedBy,
    reviewedAt: serverTimestamp(),
    reviewNotes,
    updatedAt: serverTimestamp()
  });
};

// Incident specific functions
export const createIncident = async (incidentData: any) => {
  return addDoc(collection(db, "incidents"), {
    ...incidentData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
};

export const getAllIncidents = async () => {
  const incidentsRef = collection(db, "incidents");
  const q = query(incidentsRef, orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      date: data.date?.toDate(),
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate()
    };
  });
};

// Initialize Firestore with sample data if empty
export const initializeFirestoreData = async () => {
  try {
    // Check if users collection is empty
    const usersRef = collection(db, "users");
    const userSnapshot = await getDocs(usersRef);
    
    // Check specifically for teachers
    const teacherQuery = query(usersRef, where("role", "==", "teacher"));
    const teacherSnapshot = await getDocs(teacherQuery);
    
    if (userSnapshot.empty || teacherSnapshot.empty) {
      console.log("Initializing Firestore with sample data");
      
      // Add sample users
      const sampleUsers = [
        {
          uid: "admin1",
          email: "sysadmin@school.edu",
          displayName: "System Administrator",
          role: "admin",
          createdAt: serverTimestamp()
        },
        {
          uid: "m1",
          email: "admin@school.edu",
          displayName: "Admin User",
          role: "manager",
          createdAt: serverTimestamp()
        },
        {
          uid: "t1",
          email: "john.smith@school.edu",
          displayName: "John Smith",
          role: "teacher",
          subject: "Mathematics",
          specialization: "Algebra",
          createdAt: serverTimestamp()
        },
        {
          uid: "t2",
          email: "sarah.johnson@school.edu",
          displayName: "Sarah Johnson",
          role: "teacher",
          subject: "English",
          specialization: "Literature",
          createdAt: serverTimestamp()
        },
        {
          uid: "t3",
          email: "michael.williams@school.edu",
          displayName: "Michael Williams",
          role: "teacher",
          subject: "Science",
          specialization: "Biology",
          createdAt: serverTimestamp()
        }
      ];
      
      // Batch add users
      for (const user of sampleUsers) {
        await setDoc(doc(db, "users", user.uid), user);
      }
      
      console.log("Sample data initialization complete");
    }
  } catch (error) {
    console.error("Error initializing data:", error);
  }
};

// Task functions
export const getAllTasks = async () => {
  const tasksRef = collection(db, "tasks");
  const q = query(tasksRef, orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
      dueDate: data.dueDate?.toDate()
    };
  });
};

export const getTaskById = async (taskId: string) => {
  try {
    const taskDoc = await getDocumentById("tasks", taskId) as any;
    
    if (!taskDoc) return null;
    
    // Fetch assigner data if available
    if (taskDoc.assignedBy) {
      const assignerDoc = await getDocumentById("users", taskDoc.assignedBy);
      if (assignerDoc) {
        taskDoc.assignerData = assignerDoc;
      }
    }
    
    return taskDoc;
  } catch (error) {
    console.error("Error getting task by ID:", error);
    return null;
  }
};

export const getTasksForGroup = async (groupId: string) => {
  const tasksRef = collection(db, "tasks");
  const q = query(tasksRef, where("groupId", "==", groupId), orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
      dueDate: data.dueDate?.toDate()
    };
  });
};

// Student/Learner functions
export const createStudent = async (studentData: any) => {
  return addDoc(collection(db, "students"), {
    ...studentData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
};

/**
 * Imports multiple students at once (batch import)
 * @param studentsData Array of student data objects
 */
export const batchImportStudents = async (studentsData: any[]) => {
  if (!studentsData || !studentsData.length) {
    throw new Error("No students data provided for import");
  }

  // Firebase batch write has a limit of 500 operations
  const batchSize = 450;
  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[]
  };

  try {
    // Split the data into batches to avoid exceeding Firebase limits
    for (let i = 0; i < studentsData.length; i += batchSize) {
      const batch = writeBatch(db);
      const currentBatch = studentsData.slice(i, i + batchSize);

      // Add each student to the batch
      currentBatch.forEach(studentData => {
        const studentRef = doc(collection(db, "students"));
        batch.set(studentRef, {
          ...studentData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });

      // Commit the batch
      await batch.commit();
      results.success += currentBatch.length;
    }

    return results;
  } catch (error: any) {
    console.error("Error in batch import of students:", error);
    results.failed = studentsData.length - results.success;
    results.errors.push(error.message || "Unknown error during import");
    throw { ...results, error };
  }
};

export const getAllStudents = async () => {
  const studentsRef = collection(db, "students");
  const q = query(studentsRef, orderBy("lastName", "asc"));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

export const getStudentById = async (studentId: string) => {
  return getDocumentById("students", studentId);
};

export const updateStudent = async (studentId: string, data: any) => {
  const studentRef = doc(db, "students", studentId);
  return updateDoc(studentRef, { 
    ...data,
    updatedAt: serverTimestamp()
  });
};

// Student Document functions
export const createStudentDocument = async (documentData: any) => {
  return addDoc(collection(db, "studentDocuments"), {
    ...documentData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
};

export const getStudentDocuments = async (studentId: string) => {
  const documentsRef = collection(db, "studentDocuments");
  const q = query(documentsRef, where("studentId", "==", studentId), orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate()
    };
  });
};

export const updateStudentDocument = async (documentId: string, data: any) => {
  const documentRef = doc(db, "studentDocuments", documentId);
  return updateDoc(documentRef, { 
    ...data,
    updatedAt: serverTimestamp()
  });
};

// Campus Location functions
export const createCampusLocation = async (locationData: any) => {
  return addDoc(collection(db, "campusLocations"), {
    ...locationData,
    active: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
};

export const getAllCampusLocations = async () => {
  const locationsRef = collection(db, "campusLocations");
  const q = query(locationsRef, orderBy("name", "asc"));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

export const getActiveCampusLocations = async () => {
  const locationsRef = collection(db, "campusLocations");
  const q = query(locationsRef, where("active", "==", true), orderBy("name", "asc"));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

export const updateCampusLocation = async (locationId: string, data: any) => {
  const locationRef = doc(db, "campusLocations", locationId);
  return updateDoc(locationRef, { 
    ...data,
    updatedAt: serverTimestamp()
  });
};

export const toggleCampusLocationStatus = async (locationId: string, active: boolean) => {
  const locationRef = doc(db, "campusLocations", locationId);
  return updateDoc(locationRef, { 
    active,
    updatedAt: serverTimestamp()
  });
};

// School Event functions
export const createSchoolEvent = async (eventData: any) => {
  return addDoc(collection(db, "schoolEvents"), {
    ...eventData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
};

export const getAllSchoolEvents = async () => {
  const eventsRef = collection(db, "schoolEvents");
  const q = query(eventsRef, orderBy("startDate", "desc"));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      startDate: data.startDate?.toDate(),
      endDate: data.endDate?.toDate(),
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate()
    };
  });
};

export const getSchoolEventsByTargetType = async (targetType: string, targetId: string) => {
  const eventsRef = collection(db, "schoolEvents");
  const q = query(
    eventsRef, 
    where(`targets.${targetType}`, "array-contains", targetId),
    orderBy("startDate", "desc")
  );
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      startDate: data.startDate?.toDate(),
      endDate: data.endDate?.toDate(),
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate()
    };
  });
};

export const updateSchoolEvent = async (eventId: string, data: any) => {
  const eventRef = doc(db, "schoolEvents", eventId);
  return updateDoc(eventRef, { 
    ...data,
    updatedAt: serverTimestamp()
  });
};

// Additional Incident functions
export const getIncidentsByStatus = async (status: string) => {
  const incidentsRef = collection(db, "incidents");
  const q = query(
    incidentsRef, 
    where("status", "==", status),
    orderBy("createdAt", "desc")
  );
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      date: data.date?.toDate(),
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate()
    };
  });
};

export const getIncidentsByType = async (type: string) => {
  const incidentsRef = collection(db, "incidents");
  const q = query(
    incidentsRef, 
    where("type", "==", type),
    orderBy("createdAt", "desc")
  );
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      date: data.date?.toDate(),
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate()
    };
  });
};

export const getIncidentsByStudent = async (studentId: string) => {
  const incidentsRef = collection(db, "incidents");
  const q = query(
    incidentsRef, 
    where("studentId", "==", studentId),
    orderBy("createdAt", "desc")
  );
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      date: data.date?.toDate(),
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate()
    };
  });
};

export const getIncidentsByReporter = async (reporterId: string) => {
  const incidentsRef = collection(db, "incidents");
  const q = query(
    incidentsRef, 
    where("reportedBy", "==", reporterId),
    orderBy("createdAt", "desc")
  );
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      date: data.date?.toDate(),
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate()
    };
  });
};

export const updateIncident = async (incidentId: string, data: any) => {
  const incidentRef = doc(db, "incidents", incidentId);
  return updateDoc(incidentRef, { 
    ...data,
    updatedAt: serverTimestamp()
  });
};

// Convert user to a teacher role
export const convertUserToTeacher = async (uid: string, teacherData: {
  displayName: string;
  subject?: string;
  specialization?: string;
}) => {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      ...teacherData,
      role: "teacher",
      updatedAt: serverTimestamp()
    });
    console.log(`User ${uid} converted to teacher role successfully`);
    return true;
  } catch (error) {
    console.error("Error converting user to teacher:", error);
    throw error;
  }
};

// Task Status functions
export const getAllTaskStatuses = async () => {
  try {
    const statusesRef = collection(db, "taskStatuses");
    const q = query(statusesRef, orderBy("order", "asc"));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      // Initialize with default statuses if none exist
      const defaultStatuses = [
        { id: "outstanding", name: "Outstanding", color: "#FCD34D", isDefault: true, order: 0 },
        { id: "in_progress", name: "In Progress", color: "#60A5FA", isDefault: true, order: 1 },
        { id: "complete_for_approval", name: "Complete for approval", color: "#34D399", isDefault: true, order: 2 },
        { id: "late", name: "Late", color: "#F87171", isDefault: true, order: 3 },
        { id: "archived", name: "Archived", color: "#9CA3AF", isDefault: true, order: 4 }
      ];
      
      for (const status of defaultStatuses) {
        await setDoc(doc(db, "taskStatuses", status.id), {
          ...status,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      
      return defaultStatuses;
    }
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting task statuses:", error);
    return [];
  }
};

export const createTaskStatus = async (statusData: { 
  name: string; 
  color: string; 
  isDefault?: boolean;
}) => {
  try {
    // Generate ID based on lowercase name with underscores
    const id = statusData.name.toLowerCase().replace(/\s+/g, '_');
    
    // Get current count for order
    const statusesRef = collection(db, "taskStatuses");
    const snapshot = await getDocs(statusesRef);
    const order = snapshot.size;
    
    // Create the new status
    await setDoc(doc(db, "taskStatuses", id), {
      ...statusData,
      id,
      order,
      isDefault: statusData.isDefault || false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return { id, ...statusData, order };
  } catch (error) {
    console.error("Error creating task status:", error);
    throw error;
  }
};

export const updateTaskStatusItem = async (id: string, statusData: { 
  name?: string; 
  color?: string;
}) => {
  try {
    const statusRef = doc(db, "taskStatuses", id);
    
    await updateDoc(statusRef, {
      ...statusData,
      updatedAt: serverTimestamp()
    });
    
    return { id, ...statusData };
  } catch (error) {
    console.error("Error updating task status:", error);
    throw error;
  }
};

export const deleteTaskStatus = async (id: string) => {
  try {
    // Check if any tasks are using this status
    const tasksRef = collection(db, "tasks");
    const q = query(tasksRef, where("status", "==", id));
    const tasksSnapshot = await getDocs(q);
    
    if (!tasksSnapshot.empty) {
      throw new Error(`Cannot delete status. ${tasksSnapshot.size} task(s) are currently using this status.`);
    }
    
    // Delete the status
    await deleteDoc(doc(db, "taskStatuses", id));
    
    return true;
  } catch (error) {
    console.error("Error deleting task status:", error);
    throw error;
  }
};

// Group specific functions
export const createGroup = async (groupData: { 
  name: string; 
  description?: string; 
  members: string[];
}) => {
  try {
    return addDoc(collection(db, "groups"), {
      ...groupData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error creating group:", error);
    throw error;
  }
};

export const getAllGroups = async () => {
  try {
    const groupsRef = collection(db, "groups");
    const q = query(groupsRef, orderBy("name", "asc"));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching groups from Firestore:", error);
    return [];
  }
};

export const getGroupById = async (groupId: string) => {
  try {
    return getDocumentById("groups", groupId);
  } catch (error) {
    console.error(`Error fetching group ${groupId}:`, error);
    return null;
  }
};

export const updateGroup = async (groupId: string, groupData: {
  name?: string;
  description?: string;
  members?: string[];
}) => {
  try {
    const groupRef = doc(db, "groups", groupId);
    await updateDoc(groupRef, { 
      ...groupData,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error(`Error updating group ${groupId}:`, error);
    throw error;
  }
};

export const deleteGroup = async (groupId: string) => {
  try {
    await deleteDoc(doc(db, "groups", groupId));
    return true;
  } catch (error) {
    console.error(`Error deleting group ${groupId}:`, error);
    throw error;
  }
};

// Grade Management functions
export const addGradeToFirestore = async (gradeName: string): Promise<string> => {
  try {
    const gradeRef = collection(db, 'grades');
    const docRef = await addDoc(gradeRef, {
      name: gradeName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding grade to Firestore:', error);
    throw error;
  }
};

export const getAllGradesFromFirestore = async () => {
  try {
    const gradesRef = collection(db, 'grades');
    const gradesSnapshot = await getDocs(gradesRef);
    
    return gradesSnapshot.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().name,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching grades from Firestore:', error);
    throw error;
  }
};

export const setupDefaultGrades = async () => {
  const defaultGrades = [
    'BC',
    'M1',
    'M2',
    'M3',
    'Grade 1',
    'Grade 2',
    'Grade 3',
    'Grade 4',
    'Grade 5',
    'Grade 6',
    'Grade 7',
    'Grade 8',
    'Grade 9',
    'Grade 10',
    'Grade 11',
    'Grade 12'
  ];

  try {
    // Check if grades already exist
    const existingGrades = await getAllGradesFromFirestore();
    const existingGradeNames = existingGrades.map(grade => grade.name);
    
    // Only add grades that don't already exist
    const gradesToAdd = defaultGrades.filter(
      gradeName => !existingGradeNames.includes(gradeName)
    );
    
    if (gradesToAdd.length === 0) {
      console.log('All default grades already exist in Firestore');
      return;
    }
    
    // Add new grades
    const addPromises = gradesToAdd.map(gradeName => 
      addGradeToFirestore(gradeName)
    );
    
    await Promise.all(addPromises);
    console.log(`Added ${gradesToAdd.length} new grades to Firestore`);
  } catch (error) {
    console.error('Error setting up default grades:', error);
    throw error;
  }
};
