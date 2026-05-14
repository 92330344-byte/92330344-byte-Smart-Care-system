import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCQrrxqGJWwHZ-4l_onn3yNToip_rJlH7E",
  authDomain: "smartcare-79bac.firebaseapp.com",
  databaseURL: "https://smartcare-79bac-default-rtdb.firebaseio.com",
  projectId: "smartcare-79bac",
  storageBucket: "smartcare-79bac.appspot.com",
  messagingSenderId: "818526503003",
  appId: "1:818526503003:web:e5c1eefb328baeeb527f7e",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const realtimeDb = getDatabase(app);
export const firestoreDb = getFirestore(app);
export const storage = getStorage(app);

export default app;