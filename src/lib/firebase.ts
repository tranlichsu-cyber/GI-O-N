import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCtWXx81QYrNtINq3xuQD8AD1Q9uFuhZ1s",
  authDomain: "tran-lich-su.firebaseapp.com",
  databaseURL: "https://tran-lich-su-default-rtdb.firebaseio.com",
  projectId: "tran-lich-su",
  storageBucket: "tran-lich-su.firebasestorage.app",
  messagingSenderId: "1059341238849",
  appId: "1:1059341238849:web:b757c4da780eca3a3d7cc0",
  measurementId: "G-JGCENSS781"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

// Initialize Analytics if supported
isSupported().then(yes => {
  if (yes) getAnalytics(app);
});
