import { setupDefaultGrades } from "../lib/firebase/firebaseUtils";

// Execute the setup process
(async () => {
  try {
    console.log("Setting up default grades in Firestore...");
    await setupDefaultGrades();
    console.log("Default grades setup completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error setting up default grades:", error);
    process.exit(1);
  }
})(); 