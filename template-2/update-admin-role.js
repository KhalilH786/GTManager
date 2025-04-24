const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs } = require('firebase/firestore');

// Firebase configuration
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
const auth = getAuth(app);
const db = getFirestore(app);

const email = 'khalil.hendricks@gmail.com';
const password = 'admin123';

async function updateUserToAdmin() {
  try {
    console.log(`Looking for user with email: ${email}`);
    
    // Find user by email
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('User not found in Firestore. Please create the user first.');
      return;
    }
    
    // Get the first matching user doc
    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    const uid = userDoc.id;
    
    console.log('Found user:', userData);
    console.log(`Current role: ${userData.role || 'none'}`);
    
    // Update the user role to admin
    await setDoc(doc(db, "users", uid), {
      role: "admin",
      updatedAt: new Date().toISOString()
    }, { merge: true });
    
    console.log(`Updated user ${email} role to admin successfully!`);
    
    // Verify the update
    const updatedDoc = await getDoc(doc(db, "users", uid));
    console.log('Updated user data:', updatedDoc.data());
    
  } catch (error) {
    console.error('Error updating user role:', error);
  }
}

updateUserToAdmin()
  .then(() => console.log('Operation completed'))
  .catch(err => console.error('Operation failed:', err))
  .finally(() => process.exit()); 