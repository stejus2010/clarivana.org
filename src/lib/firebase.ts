import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// Unchanged project configuration from the original Clarivana app.
const firebaseConfig = {
  apiKey: "AIzaSyAMpv1EQCg-W7Fr_MXyfmLlO5zAGLAWXMo",
  authDomain: "stai-437917.firebaseapp.com",
  projectId: "stai-437917",
  storageBucket: "stai-437917.firebasestorage.app",
  messagingSenderId: "481645199693",
  appId: "1:481645199693:web:8f522c13003be9c4843704",
  measurementId: "G-RL21GL8Y0L",
};

let cached: { app: FirebaseApp; auth: Auth; db: Firestore } | null = null;

/** Browser-only Firebase accessor. Returns null during SSR. */
export function getFirebase() {
  if (typeof window === "undefined") return null;
  if (!cached) {
    const app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);
    cached = { app, auth: getAuth(app), db: getFirestore(app) };
  }
  return cached;
}
