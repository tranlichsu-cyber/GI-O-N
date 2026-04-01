import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyCtWXx81QYrNtINq3xuQD8AD1Q9uFuhZ1s",
  authDomain: "tran-lich-su.firebaseapp.com",
  databaseURL: "https://tran-lich-su-default-rtdb.firebaseio.com",
  projectId: "tran-lich-su"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
