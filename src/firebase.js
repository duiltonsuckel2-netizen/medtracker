import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDcKbbDD2Anw9Il6XoOK96afftRSdRday0",
  authDomain: "medtracker-ce055.firebaseapp.com",
  projectId: "medtracker-ce055",
  storageBucket: "medtracker-ce055.firebasestorage.app",
  messagingSenderId: "292292223003",
  appId: "1:292292223003:web:c6d1408a0b8cb486d618be",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
