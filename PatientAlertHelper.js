import { db } from "./firebaseConfig";
import { collection, addDoc } from "firebase/firestore";

export const createPatientAlert = async (patientId, data) => {
  try {
    await addDoc(collection(db, "users", patientId, "alerts"), {
      type: data.type || "general",
      message: data.message || "New alert",
      priority: data.priority || "normal",
      status: "pending",
      seenByCaregiver: false,
      createdAt: new Date(),
    });
  } catch (error) {
    throw error;
  }
};