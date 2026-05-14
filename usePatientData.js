import { useEffect, useState } from "react";
import { ref, onValue, off } from "firebase/database";
import { realtimeDb, auth } from "./firebaseConfig";

export default function usePatientData() {
  const [data, setData] = useState({
    heartRate: 0,
    spo2: 0,
    fingerDetected: false,
    fallDetected: false,
    motionDetected: false,
    sosPressed: false,
    abnormalHeartRate: false,
    alert: "NONE",
  });

  useEffect(() => {
    const uid = auth.currentUser?.uid;

if (!uid) return;

const patientRef = ref(realtimeDb, `patients/${uid}`);

    const unsubscribe = onValue(patientRef, (snapshot) => {
      const d = snapshot.val();
      if (d) {
        setData({
          heartRate: d.heartRate ?? 0,
          spo2: d.spo2 ?? 0,
          fingerDetected: d.fingerDetected ?? false,
          fallDetected: d.fallDetected ?? false,
          motionDetected: d.motionDetected ?? false,
          sosPressed: d.sosPressed ?? false,
          abnormalHeartRate: d.abnormalHeartRate ?? false,
          alert: d.alert ?? "NONE",
        });
      }
    });

    return () => off(patientRef);
  }, []);

  return data;
}