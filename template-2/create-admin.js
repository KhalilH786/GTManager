require('dotenv').config({ path: '.env.local' });
const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc, collection, query, where, getDocs } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

console.log('Using Firebase config:', firebaseConfig);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const email = 'khalil.hendricks@gmail.com';
const password = 'admin123';
const displayName = 'Khalil Hendricks';
const role = 'admin';

async function createOrLoginAdmin() {
  try {
    // First try to log in with the credentials
    try {
      console.log(`Attempting to login with email: ${email}...`);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Login successful!');
      console.log('User info:', userCredential.user);
      
      // Make sure the user has admin role in Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: email,
        displayName: displayName,
        role: role,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      
      console.log('User role updated to admin in Firestore');
      return;
    } catch (loginError) {
      console.log('Login failed, attempting to create user:', loginError.message);
      
      // Check if user exists in Firestore
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // User exists in Firestore but login failed
        console.log('User exists in Firestore but login failed. Please check credentials.');
        return;
      }
      
      // Create new user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      console.log(`User created with UID: ${user.uid}`);
      
      // Add to Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: email,
        displayName: displayName,
        role: role,
        createdAt: new Date().toISOString()
      });
      
      console.log(`Admin user ${email} created successfully in Firebase and Firestore!`);
    }
  } catch (error) {
    console.error('Error creating/updating admin user:', error);
  }
}

createOrLoginAdmin()
  .then(() => console.log('Operation completed'))
  .catch(err => console.error('Operation failed:', err))
  .finally(() => process.exit()); 