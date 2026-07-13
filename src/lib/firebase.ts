import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBJpOX8vHOqE37eZik0VlyLTIENh_TY1N8",
  authDomain: "theta-zepplin-c1wkv.firebaseapp.com",
  projectId: "theta-zepplin-c1wkv",
  storageBucket: "theta-zepplin-c1wkv.firebasestorage.app",
  messagingSenderId: "711972437",
  appId: "1:711972437:web:7a1fc179629e11cbcc66dc"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with custom databaseId
const db = getFirestore(app, "ai-studio-googlesigninapp-389c183c-b03e-48fe-bd10-cd50530df126");

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Custom parameters to always ask for Google accounts
googleProvider.setCustomParameters({
  prompt: "select_account"
});

export { app, db, auth, googleProvider };
