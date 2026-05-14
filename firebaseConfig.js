import { initializeApp, getApps, getApp } from "firebase/app";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
} from "firebase/auth";

import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCQrrxqGJWwHZ-4l_onn3yNToip_rJlH7E",
  authDomain: "smartcare-79bac.firebaseapp.com",
  databaseURL: "https://smartcare-79bac-default-rtdb.firebaseio.com/",
  projectId: "smartcare-79bac",
  storageBucket: "smartcare-79bac.appspot.com",
  messagingSenderId: "818526503003",
  appId: "1:818526503003:web:e5c1eefb328baeeb527f7e",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

let auth;

try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (error) {
  auth = getAuth(app);
}

const db = getFirestore(app);
const realtimeDb = getDatabase(app);

export { auth, db, realtimeDb };