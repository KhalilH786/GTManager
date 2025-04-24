const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

// Firebase configuration - using the one from .env.local
const firebaseConfig = {
  apiKey: "AIzaSyAKVwzmaS3toFkSK6CHVpPMwN0Rcqd15Ns",
  authDomain: "gtmanager-57a85.firebaseapp.com",
  projectId: "gtmanager-57a85",
  storageBucket: "gtmanager-57a85.firebasestorage.app",
  messagingSenderId: "741437889109",
  appId: "1:741437889109:web:579fcf8aede2c372f252dc"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Create a sample teacher
async function createSampleTeacher() {
  try {
    console.log("Creating sample teacher in Firestore...");
    
    // Unique ID for the user
    const teacherId = `teacher-${Date.now()}`;
    
    // Teacher data
    const teacherData = {
      uid: teacherId,
      email: "jane.doe@school.edu",
      displayName: "Jane Doe",
      role: "teacher",
      subject: "English",
      specialization: "Literature",
      createdAt: new Date().toISOString()
    };
    
    // Add teacher to Firestore
    await setDoc(doc(db, "users", teacherId), teacherData);
    
    console.log(`Sample teacher created successfully with ID: ${teacherId}`);
    console.log("Teacher data:", teacherData);
    
    // Create another sample teacher
    const teacherId2 = `teacher-${Date.now() + 1}`;
    const teacherData2 = {
      uid: teacherId2,
      email: "michael.brown@school.edu",
      displayName: "Michael Brown",
      role: "teacher",
      subject: "Science",
      specialization: "Physics",
      createdAt: new Date().toISOString()
    };
    
    await setDoc(doc(db, "users", teacherId2), teacherData2);
    
    console.log(`Second sample teacher created successfully with ID: ${teacherId2}`);
    console.log("Teacher data:", teacherData2);
    
  } catch (error) {
    console.error("Error creating sample teacher:", error);
  }
}

createSampleTeacher()
  .then(() => console.log("Operation completed"))
  .catch(err => console.error("Operation failed:", err))
  .finally(() => process.exit()); 