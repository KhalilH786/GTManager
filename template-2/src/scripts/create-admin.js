// Script to create or update a user as administrator
const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc, collection, query, where, getDocs } = require('firebase/firestore');

// Firebase configuration - replace with your actual config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const email = 'khalil.hendricks@gmail.com';
const password = 'admin123'; // Temporary password
const displayName = 'Khalil Hendricks';
const role = 'admin';

async function createOrUpdateAdmin() {
  try {
    // Check if user exists in Firestore
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      // User exists, update role to admin
      const userDoc = querySnapshot.docs[0];
      await setDoc(doc(db, "users", userDoc.id), {
        ...userDoc.data(),
        role: role,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      console.log(`User ${email} updated to administrator role successfully!`);
    } else {
      // Create new user with admin role
      try {
        // First try to create auth user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Then store in Firestore
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: email,
          displayName: displayName,
          role: role,
          createdAt: new Date().toISOString()
        });
        
        console.log(`Administrator ${email} created successfully!`);
      } catch (error) {
        // Handle if auth user already exists but not in Firestore
        if (error.code === 'auth/email-already-in-use') {
          console.log(`User exists in Auth but not Firestore. Please check the database.`);
        } else {
          throw error;
        }
      }
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

createOrUpdateAdmin(); 