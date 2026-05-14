import "./App.css";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { useEffect, useMemo, useRef, useState } from "react";

import { auth, realtimeDb, firestoreDb, storage } from "./firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updatePassword,
} from "firebase/auth";
import {
  ref,
  set,
  get,
  onValue,
  update,
  push,
} from "firebase/database";
const buildAuthPassword = (code) => `${code}00`;

function MedicalLogo() {
  return (
    <svg
      className="medical-logo"
      viewBox="0 0 220 220"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M110 30 L110 178" />
        <circle cx="110" cy="20" r="10" fill="currentColor" stroke="none" />
        <path d="M110 54 C92 50, 76 58, 74 72 C72 86, 83 94, 96 98 C110 102, 124 108, 124 122 C124 138, 112 148, 96 150" />
        <path d="M110 54 C128 50, 144 58, 146 72 C148 86, 137 94, 124 98 C110 102, 96 108, 96 122 C96 138, 108 148, 124 150" />
        <path d="M110 150 C100 154, 96 162, 100 170 C103 176, 108 180, 110 186" />
        <path d="M110 150 C120 154, 124 162, 120 170 C117 176, 112 180, 110 186" />
        <path d="M110 38 C96 26, 74 20, 48 22 C30 24, 18 30, 10 40 C26 38, 40 40, 54 46 C72 54, 90 54, 110 44" />
        <path d="M110 38 C124 26, 146 20, 172 22 C190 24, 202 30, 210 40 C194 38, 180 40, 166 46 C148 54, 130 54, 110 44" />
      </g>
    </svg>
  );
}
function SplashSnakeLogo() {
  return (
    <svg
      className="medical-logo splash-snake-logo"
      viewBox="0 0 399 1209"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M170,1084L149,1093L151,1200L153,1206L157,1209L164,1209L169,1203L171,1153Z M194,893L192,893L192,932L195,937L209,947L225,964L230,974L230,990L228,995L215,1011L201,1021L143,1049L108,1072L94,1086L86,1098L81,1111L80,1123L82,1134L98,1111L115,1096L139,1083L191,1063L217,1051L234,1040L249,1025L257,1011L262,997L263,973L260,959L254,945L247,934L234,920L215,905Z M178,764L142,781L148,1032L170,1023L173,1018L174,1011L176,868L179,795Z M204,515L202,516L200,577L216,591L235,612L238,622L238,633L232,653L217,670L192,688L120,723L76,751L56,774L49,788L44,805L43,821L46,838L51,850L59,862L73,876L87,886L115,901L126,905L128,904L128,863L124,857L101,842L92,832L89,824L89,817L95,801L107,788L132,772L209,737L246,714L269,692L275,684L285,666L292,640L292,612L287,593L278,575L264,557L244,539Z M361,348L364,358L371,365L377,368L392,370L396,373L399,372L396,365L379,359Z M184,333L154,336L133,341L130,344L137,585L137,638L140,700L180,681L182,678L190,334Z M324,276L300,256L279,248L255,247L236,250L203,248L155,251L106,261L80,271L54,286L42,298L24,318L12,339L4,361L0,383L0,406L5,432L15,456L29,476L47,491L64,500L89,509L91,508L91,462L86,454L75,445L67,434L63,421L63,389L69,370L81,354L97,342L116,335L146,330L204,328L223,328L241,344L256,352L276,357L296,359L328,359L352,354L369,344L378,329L378,320L371,303L361,290L345,280Z M306,290A9,9 0 1,0 306,308A9,9 0 1,0 306,290Z M177,182L154,182L148,190L142,204L141,223L146,245L153,250L214,248L215,204L211,192L200,185Z M252,125L232,137L205,144L172,145L143,140L112,128L127,148L148,162L182,170L215,167L238,157L254,140Z M180,0L158,4L140,14L128,29L122,49L124,66L134,87L151,101L170,108L194,109L215,101L231,85L239,65L239,40L230,19L211,5Z"
      />
    </svg>
  );
}

function getConversationId(id1, id2) {
  return [id1, id2].sort().join("_");
}

function formatMessageTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
}

function App() {
  const [page, setPage] = useState("splash");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [fullName, setFullName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [dob, setDob] = useState("");
  const [role, setRole] = useState("patient");
  const [specialty, setSpecialty] = useState("");
  const [signupError, setSignupError] = useState("");
  const [signupSuccess, setSignupSuccess] = useState("");

  const [currentUserId, setCurrentUserId] = useState("");
  const [currentUserName, setCurrentUserName] = useState("");
  const [currentUserRole, setCurrentUserRole] = useState("");
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [currentUserDob, setCurrentUserDob] = useState("");
  const [currentUserSpecialty, setCurrentUserSpecialty] = useState("");

  const [patientTab, setPatientTab] = useState("doctors");
  const [doctorTab, setDoctorTab] = useState("reports");

  const [doctorSearch, setDoctorSearch] = useState("");
const [doctors, setDoctors] = useState([]);
const [reports, setReports] = useState([]);
const [alerts, setAlerts] = useState([]);
const [liveVitals, setLiveVitals] = useState(null);
const lastSavedAlertRef = useRef({
  type: "",
  time: 0,
});
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [doctorRequestStatus, setDoctorRequestStatus] = useState("");
const [pendingDoctorId, setPendingDoctorId] = useState("");
const [pendingDoctorName, setPendingDoctorName] = useState("");
const [doctorRequests, setDoctorRequests] = useState([]);
  const [selectedDoctorName, setSelectedDoctorName] = useState("");
  const [selectMsg, setSelectMsg] = useState("");
  const [selectError, setSelectError] = useState("");
  const [doctorCvLink, setDoctorCvLink] = useState("");

  const [patients, setPatients] = useState([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [selectedPatientName, setSelectedPatientName] = useState("");
  const [selectedPatientData, setSelectedPatientData] = useState(null);
  const [selectedPatientLiveVitals, setSelectedPatientLiveVitals] = useState(null);
  const [selectedPatientAlerts, setSelectedPatientAlerts] = useState([]);
  const [selectedPatientReports, setSelectedPatientReports] = useState([]);

  const [reportText, setReportText] = useState("");
  const [heartNote, setHeartNote] = useState("");
  const [oxygenNote, setOxygenNote] = useState("");
  const [recommendationNote, setRecommendationNote] = useState("");
  const [doctorMsg, setDoctorMsg] = useState("");
  const [doctorError, setDoctorError] = useState("");
  const [doctorAllReportsCount, setDoctorAllReportsCount] = useState(0);

  const [chatMessages, setChatMessages] = useState([]);
  const [patientMessageText, setPatientMessageText] = useState("");
  const [doctorMessageText, setDoctorMessageText] = useState("");
  const [chatError, setChatError] = useState("");
  const [chatInfo, setChatInfo] = useState("");
const [doctorCvFile, setDoctorCvFile] = useState(null);
  const [settingsName, setSettingsName] = useState("");
  const [settingsDob, setSettingsDob] = useState("");
  const [settingsNewPassword, setSettingsNewPassword] = useState("");
  const [settingsMsg, setSettingsMsg] = useState("");
  const [settingsError, setSettingsError] = useState("");

  const [doctorSettingsName, setDoctorSettingsName] = useState("");
  const [doctorSettingsDob, setDoctorSettingsDob] = useState("");
  const [doctorSettingsSpecialty, setDoctorSettingsSpecialty] = useState("");
  const [doctorSettingsNewPassword, setDoctorSettingsNewPassword] = useState("");
  const [doctorSettingsMsg, setDoctorSettingsMsg] = useState("");
  const [doctorSettingsError, setDoctorSettingsError] = useState("");
useEffect(() => {
  if (page !== "doctorDashboard" || !selectedPatientId) {
    setSelectedPatientLiveVitals(null);
    return;
  }

  const patientVitalsRef = ref(
    realtimeDb,
    `patients/${selectedPatientId}`
  );

  const unsubscribe = onValue(patientVitalsRef, (snapshot) => {
    if (!snapshot.exists()) {
      setSelectedPatientLiveVitals(null);
      return;
    }

    setSelectedPatientLiveVitals(snapshot.val());
  });

  return () => unsubscribe();
}, [page, selectedPatientId]);
  const filteredDoctors = useMemo(() => {
    const text = doctorSearch.trim().toLowerCase();
    if (!text) return doctors;

    return doctors.filter((doctor) => {
      const name = (doctor.fullName || "").toLowerCase();
      const doctorSpecialty = (doctor.specialty || "").toLowerCase();
      return name.includes(text) || doctorSpecialty.includes(text);
    });
  }, [doctorSearch, doctors]);
const filteredPatients = useMemo(() => {
  const text = patientSearch.trim().toLowerCase();
  if (!text) return patients;

  return patients.filter((patient) => {
    const name = (patient.fullName || "").toLowerCase();
    const email = (patient.email || "").toLowerCase();

    return name.includes(text) || email.includes(text);
  });
}, [patientSearch, patients]);
  const latestAlert = useMemo(() => {
    if (!alerts.length) return null;
    return alerts[0];
  }, [alerts]);
const dashboardHeartRate =
  liveVitals?.heartRate ?? latestAlert?.heartRate ?? "--";

const dashboardSpo2 =
  liveVitals?.spo2 ?? latestAlert?.spo2 ?? "--";

const dashboardMotion =
  liveVitals?.fallDetected
    ? "fall detected"
    : liveVitals?.motionDetected
    ? "motion detected"
    : liveVitals?.motion
    ? liveVitals.motion
    : latestAlert?.motion ?? "No data";

const dashboardLastUpdate =
  liveVitals?.time
    ? formatMessageTime(liveVitals.time)
    : latestAlert?.time
    ? formatMessageTime(latestAlert.time)
    : "No updates yet";

const dashboardStatus = useMemo(() => {
  const hr = Number(liveVitals?.heartRate || 0);
  const oxygen = Number(liveVitals?.spo2 || 0);

  if (
    liveVitals?.sosPressed ||
    liveVitals?.fallDetected ||
    liveVitals?.alert === "SOS" ||
    latestAlert?.status === "emergency"
  ) {
    return "Emergency";
  }

  if (
    liveVitals?.abnormalHeartRate ||
    latestAlert?.status === "warning" ||
    hr > 100 ||
    (hr > 0 && hr < 50) ||
    (oxygen > 0 && oxygen < 95)
  ) {
    return "Warning";
  }

  return "Stable";
}, [liveVitals, latestAlert]);

  const recentDashboardAlerts = useMemo(() => {
    return alerts.slice(0, 2);
  }, [alerts]);

  const latestSelectedPatientAlert = useMemo(() => {
    if (!selectedPatientAlerts.length) return null;
    return selectedPatientAlerts[0];
  }, [selectedPatientAlerts]);

  const doctorNewAlertsCount = useMemo(() => {
    return patients.reduce((count, patient) => {
      return count + (patient.selectedDoctorId === currentUserId ? 1 : 0);
    }, 0);
  }, [patients, currentUserId]);

  const selectedPatientSummary = useMemo(() => {
    if (!selectedPatientId) {
      return {
        name: "No patient selected",
        doctor: "-",
        status: "No data",
        heartRate: "--",
        spo2: "--",
      };
    }

    return {
      name: selectedPatientData?.fullName || selectedPatientName || "Patient",
      doctor: selectedPatientData?.selectedDoctorName || currentUserName || "-",
      status: latestSelectedPatientAlert?.status || "No data",
     heartRate:
  selectedPatientLiveVitals?.heartRate ??
  latestSelectedPatientAlert?.heartRate ??
  "--",

spo2:
  selectedPatientLiveVitals?.spo2 ??
  latestSelectedPatientAlert?.spo2 ??
  "--",
    };
  }, [
    selectedPatientId,
    selectedPatientData,
    selectedPatientName,
    currentUserName,
    latestSelectedPatientAlert,
  ]);

  const patientConversationId =
    currentUserId && selectedDoctorId
      ? getConversationId(currentUserId, selectedDoctorId)
      : "";

  const doctorConversationId =
    currentUserId && selectedPatientId
      ? getConversationId(currentUserId, selectedPatientId)
      : "";

 useEffect(() => {
    if (!selectMsg) return;
    const timer = setTimeout(() => setSelectMsg(""), 2500);
    return () => clearTimeout(timer);
  }, [selectMsg]);

  useEffect(() => {
    if (!doctorMsg) return;
    const timer = setTimeout(() => setDoctorMsg(""), 2500);
    return () => clearTimeout(timer);
  }, [doctorMsg]);

  useEffect(() => {
    if (!chatInfo) return;
    const timer = setTimeout(() => setChatInfo(""), 2500);
    return () => clearTimeout(timer);
  }, [chatInfo]);

  useEffect(() => {
    if (!settingsMsg) return;
    const timer = setTimeout(() => setSettingsMsg(""), 2500);
    return () => clearTimeout(timer);
  }, [settingsMsg]);
useEffect(() => {
  if (page !== "patientDashboard" || !currentUserId) return;

  const userRef = ref(realtimeDb, `users/${currentUserId}`);

  const unsubscribe = onValue(userRef, (snapshot) => {
    if (!snapshot.exists()) return;

    const data = snapshot.val();

    setSelectedDoctorId(data.selectedDoctorId || "");
    setSelectedDoctorName(data.selectedDoctorName || "");
    setPendingDoctorId(data.pendingDoctorId || "");
    setPendingDoctorName(data.pendingDoctorName || "");
    setDoctorRequestStatus(data.doctorRequestStatus || "");
  });

  return () => unsubscribe();
}, [page, currentUserId]);
useEffect(() => {
  if (page !== "doctorDashboard" || !currentUserId) {
    setDoctorRequests([]);
    return;
  }

  const requestsRef = ref(realtimeDb, `doctorRequests/${currentUserId}`);

  const unsubscribe = onValue(requestsRef, (snapshot) => {
    if (!snapshot.exists()) {
      setDoctorRequests([]);
      return;
    }

    const data = snapshot.val();

    const requestsArray = Object.keys(data)
      .map((key) => ({
        id: key,
        ...data[key],
      }))
      .filter((request) => request.status === "pending")
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

    setDoctorRequests(requestsArray);
  });

  return () => unsubscribe();
}, [page, currentUserId]);
  useEffect(() => {
    if (!doctorSettingsMsg) return;
    const timer = setTimeout(() => setDoctorSettingsMsg(""), 2500);
    return () => clearTimeout(timer);
  }, [doctorSettingsMsg]);

  useEffect(() => {
    if (page !== "patientDashboard") return;

    const doctorsRef = ref(realtimeDb, "doctors");
    const unsubscribe = onValue(doctorsRef, (snapshot) => {
      if (!snapshot.exists()) {
        setDoctors([]);
        return;
      }

      const data = snapshot.val();
      const doctorsArray = Object.keys(data).map((key) => ({
        id: key,
        ...data[key],
      }));
      setDoctors(doctorsArray);
    });

    return () => unsubscribe();
  }, [page]);
useEffect(() => {
  if (page !== "patientDashboard" || !currentUserId || !liveVitals) return;

  const heartRate = Number(liveVitals.heartRate || 0);
  const spo2 = Number(liveVitals.spo2 || 0);

  let alertData = null;

  if (liveVitals.sosPressed || liveVitals.alert === "SOS") {
    alertData = {
      type: "sos",
      message: "Patient pressed SOS button",
      status: "emergency",
      priority: "critical",
    };
  } else if (liveVitals.fallDetected) {
    alertData = {
      type: "fall",
      message: "Possible fall detected",
      status: "emergency",
      priority: "critical",
    };
  } else if (
    liveVitals.abnormalHeartRate ||
    heartRate > 100 ||
    (heartRate > 0 && heartRate < 50)
  ) {
    alertData = {
      type: "heart_rate",
      message: "Abnormal heart rate detected",
      status: "warning",
      priority: "high",
    };
  } else if (spo2 > 0 && spo2 < 95) {
    alertData = {
      type: "oxygen",
      message: "Low oxygen level detected",
      status: "warning",
      priority: "high",
    };
  }

  if (!alertData) return;

  const now = Date.now();
  const alertKey = alertData.type;

  // يمنع تكرار نفس alert كل ثانية
  if (
    lastSavedAlertRef.current.type === alertKey &&
    now - lastSavedAlertRef.current.time < 30000
  ) {
    return;
  }

  lastSavedAlertRef.current = {
    type: alertKey,
    time: now,
  };

  const newAlertRef = push(ref(realtimeDb, `alerts/${currentUserId}`));

  set(newAlertRef, {
    ...alertData,
    heartRate,
    spo2,
    motion: liveVitals.fallDetected
      ? "fall detected"
      : liveVitals.motionDetected
      ? "motion detected"
      : "normal",
    source: "hardware",
    time: new Date().toISOString(),
  });
}, [page, currentUserId, liveVitals]);
  useEffect(() => {
    if (page !== "patientDashboard" || !currentUserId) return;

    const reportsRef = ref(realtimeDb, `reports/${currentUserId}`);
    const unsubscribe = onValue(reportsRef, (snapshot) => {
      if (!snapshot.exists()) {
        setReports([]);
        return;
      }

      const data = snapshot.val();

      const reportsArray = Object.keys(data)
        .map((key) => ({
          id: key,
          ...data[key],
        }))
        .filter((report) =>
          selectedDoctorId ? report.doctorId === selectedDoctorId : true
        )
        .sort((a, b) =>
          (b.createdAt || b.date || "").localeCompare(a.createdAt || a.date || "")
        );

      setReports(reportsArray);
    });

    return () => unsubscribe();
  }, [page, currentUserId, selectedDoctorId]);
useEffect(() => {
  if (page !== "patientDashboard" || !currentUserId) {
    setAlerts([]);
    return;
  }

  const alertsRef = ref(realtimeDb, `alerts/${currentUserId}`);

  const unsubscribe = onValue(alertsRef, (snapshot) => {
    if (!snapshot.exists()) {
      setAlerts([]);
      return;
    }

    const data = snapshot.val();

    const alertsArray = Object.keys(data)
      .map((key) => ({
        id: key,
        ...data[key],
      }))
      .sort((a, b) => (b.time || "").localeCompare(a.time || ""));

    setAlerts(alertsArray);
  });

  return () => unsubscribe();
}, [page, currentUserId]);
   useEffect(() => {
  if (page !== "patientDashboard") return;

  const patientRef = ref(
  realtimeDb,
  `patients/${currentUserId}`
);

  const unsubscribe = onValue(patientRef, (snapshot) => {
    if (!snapshot.exists()) {
      setLiveVitals(null);
      return;
    }

    setLiveVitals(snapshot.val());
  });

  return () => unsubscribe();
}, [page]);

  useEffect(() => {
    if (page !== "doctorDashboard" || !currentUserId) return;

    const usersRef = ref(realtimeDb, "users");
    const unsubscribe = onValue(usersRef, (snapshot) => {
      if (!snapshot.exists()) {
        setPatients([]);
        return;
      }

      const data = snapshot.val();

      const patientsArray = Object.keys(data)
  .map((key) => ({
    id: key,
    ...data[key],
  }))
  .filter((user) => {
    const userRole = (user.role || "").toLowerCase();

    return (
      userRole === "patient" &&
      user.selectedDoctorId === currentUserId
    );
  });

setPatients(patientsArray);
    });

    return () => unsubscribe();
  }, [page, currentUserId]);

  useEffect(() => {
    if (page !== "doctorDashboard" || !selectedPatientId) {
      setSelectedPatientAlerts([]);
      return;
    }

    const alertsRef = ref(realtimeDb, `alerts/${selectedPatientId}`);
    const unsubscribe = onValue(alertsRef, (snapshot) => {
      if (!snapshot.exists()) {
        setSelectedPatientAlerts([]);
        return;
      }

      const data = snapshot.val();
      const alertsArray = Object.keys(data)
        .map((key) => ({
          id: key,
          ...data[key],
        }))
        .sort((a, b) => (b.time || "").localeCompare(a.time || ""));

      setSelectedPatientAlerts(alertsArray);
    });

    return () => unsubscribe();
  }, [page, selectedPatientId]);

  useEffect(() => {
    if (page !== "doctorDashboard" || !selectedPatientId) {
      setSelectedPatientReports([]);
      return;
    }

    const reportsRef = ref(realtimeDb, `reports/${selectedPatientId}`);
    const unsubscribe = onValue(reportsRef, (snapshot) => {
      if (!snapshot.exists()) {
        setSelectedPatientReports([]);
        return;
      }

      const data = snapshot.val();
      const reportsArray = Object.keys(data)
        .map((key) => ({
          id: key,
          ...data[key],
        }))
        .sort((a, b) =>
          (b.createdAt || b.date || "").localeCompare(a.createdAt || a.date || "")
        );

      setSelectedPatientReports(reportsArray);
    });

    return () => unsubscribe();
  }, [page, selectedPatientId]);

  useEffect(() => {
    if (page !== "doctorDashboard" || !selectedPatientId) {
      setSelectedPatientData(null);
      return;
    }

    const patientRef = ref(realtimeDb, `users/${selectedPatientId}`);
    const unsubscribe = onValue(patientRef, (snapshot) => {
      if (!snapshot.exists()) {
        setSelectedPatientData(null);
        return;
      }

      setSelectedPatientData(snapshot.val());
    });

    return () => unsubscribe();
  }, [page, selectedPatientId]);

  useEffect(() => {
    if (page !== "doctorDashboard" || !currentUserId) {
      setDoctorAllReportsCount(0);
      return;
    }

    const reportsRef = ref(realtimeDb, "reports");
    const unsubscribe = onValue(reportsRef, (snapshot) => {
      if (!snapshot.exists()) {
        setDoctorAllReportsCount(0);
        return;
      }

      const data = snapshot.val();
      let count = 0;

      Object.keys(data).forEach((patientId) => {
        const patientReports = data[patientId] || {};
        Object.keys(patientReports).forEach((reportId) => {
          if (patientReports[reportId]?.doctorId === currentUserId) {
            count += 1;
          }
        });
      });

      setDoctorAllReportsCount(count);
    });

    return () => unsubscribe();
  }, [page, currentUserId]);

  useEffect(() => {
    if (page !== "patientDashboard" || !patientConversationId) {
      setChatMessages([]);
      return;
    }

    const messagesRef = ref(realtimeDb, `chats/${patientConversationId}/messages`);
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      if (!snapshot.exists()) {
        setChatMessages([]);
        return;
      }

      const data = snapshot.val();
      const list = Object.keys(data)
        .map((key) => ({
          id: key,
          ...data[key],
        }))
        .sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));

      setChatMessages(list);
    });

    return () => unsubscribe();
  }, [page, patientConversationId]);

  useEffect(() => {
    if (page !== "doctorDashboard" || !doctorConversationId) {
      setChatMessages([]);
      return;
    }

    const messagesRef = ref(realtimeDb, `chats/${doctorConversationId}/messages`);
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      if (!snapshot.exists()) {
        setChatMessages([]);
        return;
      }

      const data = snapshot.val();
      const list = Object.keys(data)
        .map((key) => ({
          id: key,
          ...data[key],
        }))
        .sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));

      setChatMessages(list);
    });

    return () => unsubscribe();
  }, [page, doctorConversationId]);

  useEffect(() => {
    setSettingsName(currentUserName || "");
    setSettingsDob(currentUserDob || "");
  }, [currentUserName, currentUserDob]);

  useEffect(() => {
    setDoctorSettingsName(currentUserName || "");
    setDoctorSettingsDob(currentUserDob || "");
    setDoctorSettingsSpecialty(currentUserSpecialty || "");
  }, [currentUserName, currentUserDob, currentUserSpecialty]);

  const loadUserDataAndRoute = async (user) => {
    const snapshot = await get(ref(realtimeDb, "users/" + user.uid));

    if (!snapshot.exists()) {
      setErrorMsg("User data not found in database.");
      return;
    }

    const userData = snapshot.val();

    setCurrentUserId(user.uid);
    setCurrentUserName(userData.fullName || "");
    setCurrentUserRole(userData.role || "");
    setCurrentUserEmail(userData.email || "");
    setCurrentUserDob(userData.dateOfBirth || "");
    setCurrentUserSpecialty(userData.specialty || "");
    setSelectedDoctorId(userData.selectedDoctorId || "");
    setSelectedDoctorName(userData.selectedDoctorName || "");
    setDoctorRequestStatus(userData.doctorRequestStatus || "");
setPendingDoctorId(userData.pendingDoctorId || "");
setPendingDoctorName(userData.pendingDoctorName || "");
    setPatientTab("doctors");
    setDoctorTab("reports");
const userRole = (userData.role || "").toLowerCase();

if (userRole === "patient") {
  setPage("patientDashboard");
} else if (userRole === "doctor") {
  setPage("doctorDashboard");
} else {
  setErrorMsg("User role not found.");
}
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    try {
    const userCredential = await signInWithEmailAndPassword(
  auth,
  email,
  password
);
      await loadUserDataAndRoute(userCredential.user);
    } catch (error) {
      setErrorMsg(error.message);
    }
  };

  const handleSignUp = async (e) => {
  e.preventDefault();
  setSignupError("");
  setSignupSuccess("");

  if (!fullName || !signupEmail || !signupPassword || !dob || !role) {
    setSignupError("Please fill in all fields.");
    return;
  }

  if (role === "doctor" && !specialty.trim()) {
    setSignupError("Please enter doctor specialty.");
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      signupEmail,
      signupPassword
    );

    const user = userCredential.user;

    const userData = {
      uid: user.uid,
      fullName,
      email: signupEmail,
      dateOfBirth: dob,
      role,
      specialty: role === "doctor" ? specialty.trim() : "",
      cvUrl: role === "doctor" ? doctorCvLink.trim() : "",
      selectedDoctorId: "",
      selectedDoctorName: "",
      pendingDoctorId: "",
      pendingDoctorName: "",
      doctorRequestStatus: "",
      createdAt: new Date().toISOString(),
    };

    await set(ref(realtimeDb, "users/" + user.uid), userData);

    if (role === "doctor") {
      await set(ref(realtimeDb, "doctors/" + user.uid), {
        fullName,
        specialty: specialty.trim(),
        imageUrl: "",
        email: signupEmail,
       cvUrl: doctorCvLink.trim(),
      });

      if (doctorCvFile) {
        const fileRef = storageRef(
          storage,
          `doctorCVs/${user.uid}/${doctorCvFile.name}`
        );

        await uploadBytes(fileRef, doctorCvFile);
        const cvUrl = await getDownloadURL(fileRef);

        await update(ref(realtimeDb, "users/" + user.uid), { cvUrl });
        await update(ref(realtimeDb, "doctors/" + user.uid), { cvUrl });
      }
    }

    setSignupSuccess("Account created successfully.");
    setFullName("");
    setSignupEmail("");
    setSignupPassword("");
    setDob("");
    setRole("patient");
    setSpecialty("");
    setDoctorCvLink("");
  } catch (error) {
    setSignupError(error.message);
  }
};

 const handleSelectDoctor = async (doctor) => {
  setSelectMsg("");
  setSelectError("");

  if (!currentUserId) {
    setSelectError("Please login again.");
    return;
  }

  try {
    const requestData = {
      patientId: currentUserId,
      patientName: currentUserName,
      patientEmail: currentUserEmail,
      doctorId: doctor.id,
      doctorName: doctor.fullName,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    await set(
      ref(realtimeDb, `doctorRequests/${doctor.id}/${currentUserId}`),
      requestData
    );

    await update(ref(realtimeDb, `users/${currentUserId}`), {
      pendingDoctorId: doctor.id,
      pendingDoctorName: doctor.fullName,
      doctorRequestStatus: "pending",
    });

    setPendingDoctorId(doctor.id);
    setPendingDoctorName(doctor.fullName);
    setDoctorRequestStatus("pending");

    setSelectMsg(`Request sent to Dr. ${doctor.fullName}. Waiting for approval.`);
  } catch (error) {
    setSelectError(error.message);
  }
};

const handleAcceptDoctorRequest = async (request) => {
  setDoctorMsg("");
  setDoctorError("");

  try {
    const updates = {};

    updates[`doctorRequests/${currentUserId}/${request.patientId}/status`] =
      "accepted";
    updates[`doctorRequests/${currentUserId}/${request.patientId}/respondedAt`] =
      new Date().toISOString();

    updates[`users/${request.patientId}/selectedDoctorId`] = currentUserId;
    updates[`users/${request.patientId}/selectedDoctorName`] = currentUserName;

    updates[`users/${request.patientId}/pendingDoctorId`] = "";
    updates[`users/${request.patientId}/pendingDoctorName`] = "";
    updates[`users/${request.patientId}/doctorRequestStatus`] = "accepted";

    await update(ref(realtimeDb), updates);

    setDoctorMsg(`${request.patientName} accepted successfully.`);
  } catch (error) {
    setDoctorError(error.message);
  }
};

const handleRejectDoctorRequest = async (request) => {
  setDoctorMsg("");
  setDoctorError("");

  try {
    const updates = {};

    updates[`doctorRequests/${currentUserId}/${request.patientId}/status`] =
      "rejected";
    updates[`doctorRequests/${currentUserId}/${request.patientId}/respondedAt`] =
      new Date().toISOString();

    updates[`users/${request.patientId}/pendingDoctorId`] = "";
    updates[`users/${request.patientId}/pendingDoctorName`] = "";
    updates[`users/${request.patientId}/doctorRequestStatus`] = "rejected";

    await update(ref(realtimeDb), updates);

    setDoctorMsg(`${request.patientName} request rejected.`);
  } catch (error) {
    setDoctorError(error.message);
  }
};
  const handleAddReport = async () => {
    setDoctorMsg("");
    setDoctorError("");

    if (!selectedPatientId || !reportText.trim()) {
      setDoctorError("Please select a patient and write the report summary.");
      return;
    }

    try {
      const reportId = `r${Date.now()}`;
      const newReportRef = ref(realtimeDb, `reports/${selectedPatientId}/${reportId}`);

      await set(newReportRef, {
        doctorId: currentUserId,
        doctorName: currentUserName,
        date: new Date().toISOString().split("T")[0],
        createdAt: new Date().toISOString(),
        summary: reportText.trim(),
        heartRateNote: heartNote.trim(),
        oxygenNote: oxygenNote.trim(),
        recommendationNote: recommendationNote.trim(),
      });

      setDoctorMsg("Report added successfully.");
      setReportText("");
      setHeartNote("");
      setOxygenNote("");
      setRecommendationNote("");
    } catch (error) {
      setDoctorError(error.message);
    }
  };

  const sendPatientMessage = async () => {
    setChatError("");
    setChatInfo("");

    if (!selectedDoctorId) {
      setChatError("Please select a doctor first.");
      return;
    }

    if (!patientMessageText.trim()) {
      setChatError("Write a message first.");
      return;
    }

    try {
      const conversationId = getConversationId(currentUserId, selectedDoctorId);
      const messagesRef = ref(realtimeDb, `chats/${conversationId}/messages`);
      const messageRef = push(messagesRef);

      await set(messageRef, {
        senderId: currentUserId,
        senderName: currentUserName,
        senderRole: "patient",
        receiverId: selectedDoctorId,
        text: patientMessageText.trim(),
        createdAt: new Date().toISOString(),
      });

      await update(ref(realtimeDb, `chats/${conversationId}`), {
        patientId: currentUserId,
        patientName: currentUserName,
        doctorId: selectedDoctorId,
        doctorName: selectedDoctorName || "Doctor",
        updatedAt: new Date().toISOString(),
      });

      setPatientMessageText("");
      setChatInfo("Message sent.");
    } catch (error) {
      setChatError(error.message);
    }
  };

  const sendDoctorMessage = async () => {
    setChatError("");
    setChatInfo("");

    if (!selectedPatientId) {
      setChatError("Please select a patient first.");
      return;
    }

    if (!doctorMessageText.trim()) {
      setChatError("Write a message first.");
      return;
    }

    try {
      const patient = patients.find((p) => p.id === selectedPatientId);
      const conversationId = getConversationId(currentUserId, selectedPatientId);
      const messagesRef = ref(realtimeDb, `chats/${conversationId}/messages`);
      const messageRef = push(messagesRef);

      await set(messageRef, {
        senderId: currentUserId,
        senderName: currentUserName,
        senderRole: "doctor",
        receiverId: selectedPatientId,
        text: doctorMessageText.trim(),
        createdAt: new Date().toISOString(),
      });

      await update(ref(realtimeDb, `chats/${conversationId}`), {
        patientId: selectedPatientId,
        patientName: patient?.fullName || "Patient",
        doctorId: currentUserId,
        doctorName: currentUserName,
        updatedAt: new Date().toISOString(),
      });

      setDoctorMessageText("");
      setChatInfo("Message sent.");
    } catch (error) {
      setChatError(error.message);
    }
  };

  const handleSaveSettings = async () => {
    setSettingsMsg("");
    setSettingsError("");

    if (!settingsName.trim() || !settingsDob) {
      setSettingsError("Name and date of birth are required.");
      return;
    }

    try {
      await update(ref(realtimeDb, `users/${currentUserId}`), {
        fullName: settingsName.trim(),
        dateOfBirth: settingsDob,
      });

      setCurrentUserName(settingsName.trim());
      setCurrentUserDob(settingsDob);

      if (currentUserRole === "doctor") {
        await update(ref(realtimeDb, `doctors/${currentUserId}`), {
          fullName: settingsName.trim(),
        });
      }

      if (settingsNewPassword.trim()) {
        if (settingsNewPassword.trim().length < 6) {
          setSettingsError("Password must be at least 6 characters.");
          return;
        }

        await updatePassword(auth.currentUser, settingsNewPassword.trim());
        setSettingsNewPassword("");
      }

      setSettingsMsg("Settings updated successfully.");
    } catch (error) {
      setSettingsError(error.message);
    }
  };

  const handleSaveDoctorSettings = async () => {
    setDoctorSettingsMsg("");
    setDoctorSettingsError("");

    if (
      !doctorSettingsName.trim() ||
      !doctorSettingsDob ||
      !doctorSettingsSpecialty.trim()
    ) {
      setDoctorSettingsError(
        "Name, date of birth, and specialty are required."
      );
      return;
    }

    try {
      await update(ref(realtimeDb, `users/${currentUserId}`), {
        fullName: doctorSettingsName.trim(),
        dateOfBirth: doctorSettingsDob,
        specialty: doctorSettingsSpecialty.trim(),
      });

      await update(ref(realtimeDb, `doctors/${currentUserId}`), {
        fullName: doctorSettingsName.trim(),
        specialty: doctorSettingsSpecialty.trim(),
      });

      setCurrentUserName(doctorSettingsName.trim());
      setCurrentUserDob(doctorSettingsDob);
      setCurrentUserSpecialty(doctorSettingsSpecialty.trim());

      if (doctorSettingsNewPassword.trim()) {
        if (doctorSettingsNewPassword.trim().length < 6) {
          setDoctorSettingsError("Password must be at least 6 characters.");
          return;
        }

        await updatePassword(auth.currentUser, doctorSettingsNewPassword.trim());
        setDoctorSettingsNewPassword("");
      }

      setDoctorSettingsMsg("Settings updated successfully.");
    } catch (error) {
      setDoctorSettingsError(error.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
setPatientSearch("");
    setEmail("");
    setPassword("");
    setErrorMsg("");

    setCurrentUserId("");
    setCurrentUserName("");
    setCurrentUserRole("");
    setCurrentUserEmail("");
    setCurrentUserDob("");
    setCurrentUserSpecialty("");

    setPatientTab("doctors");
    setDoctorTab("reports");

    setSelectedDoctorId("");
    setSelectedDoctorName("");
    setDoctorSearch("");
    setDoctors([]);
    setReports([]);
    setAlerts([]);

    setSelectMsg("");
    setSelectError("");

    setPatients([]);
    setSelectedPatientId("");
    setSelectedPatientName("");
    setSelectedPatientData(null);
    setSelectedPatientAlerts([]);
    setSelectedPatientReports([]);

    setReportText("");
    setHeartNote("");
    setOxygenNote("");
    setRecommendationNote("");
    setDoctorMsg("");
    setDoctorError("");
    setDoctorAllReportsCount(0);

    setChatMessages([]);
    setPatientMessageText("");
    setDoctorMessageText("");
    setChatError("");
    setChatInfo("");

    setSettingsName("");
    setSettingsDob("");
    setSettingsNewPassword("");
    setSettingsMsg("");
    setSettingsError("");

    setDoctorSettingsName("");
    setDoctorSettingsDob("");
    setDoctorSettingsSpecialty("");
    setDoctorSettingsNewPassword("");
    setDoctorSettingsMsg("");
    setDoctorSettingsError("");

    setPage("login");
  };

  if (page === "splash") {
    return (
      <div className="splash-page">
        <div className="top-light"></div>
        <div className="bottom-light"></div>

        <div className="splash-content">
          <div className="logo-wrap">
          <SplashSnakeLogo />
          </div>

          <h1 className="title">Smart Care System</h1>

          <p className="subtitle">
            Advanced patient monitoring for safer, smarter,
            <br />
            and more connected healthcare
          </p>

          <div className="heartbeat-wrapper">
            <svg viewBox="0 0 900 120" className="heartbeat-line">
              <path
                d="M0 60
                   L330 60
                   L360 60
                   L380 36
                   L398 92
                   L420 18
                   L442 96
                   L465 52
                   L490 60
                   L900 60"
              />
            </svg>
          </div>

          <button className="start-btn" onClick={() => setPage("login")}>
            Get Started
          </button>
        </div>
      </div>
    );
  }

  if (page === "login") {
    return (
      <div className="login-page">
        <div className="login-box">
          <form onSubmit={handleLogin}>
            <h2 className="form-label">Email</h2>
            <input
              type="email"
              placeholder="Enter your email"
              className="login-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <h2 className="form-label second-label">Password</h2>
            <input
              type="password"
              placeholder="Enter your password"
              className="login-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button type="submit" className="login-btn">
              Login
            </button>

            {errorMsg && <p className="error-text">{errorMsg}</p>}

            <p className="signup-text">
              Don’t have an account?{" "}
              <span className="signup-link" onClick={() => setPage("signup")}>
                Sign Up
              </span>
            </p>
          </form>
        </div>
      </div>
    );
  }

  if (page === "signup") {
    return (
      <div className="login-page">
        <div className="login-box">
          <form onSubmit={handleSignUp}>
            <h2 className="form-label">Full Name</h2>
            <input
              type="text"
              placeholder="Enter your full name"
              className="login-input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />

            <h2 className="form-label second-label">Email</h2>
            <input
              type="email"
              placeholder="Enter your email"
              className="login-input"
              value={signupEmail}
              onChange={(e) => setSignupEmail(e.target.value)}
            />

            <h2 className="form-label second-label">Password</h2>
            <input
              type="password"
              placeholder="Enter your password"
              className="login-input"
              value={signupPassword}
              onChange={(e) => setSignupPassword(e.target.value)}
            />

            <h2 className="form-label second-label">Date of Birth</h2>
            <input
              type="date"
              className="login-input"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
            />

            <h2 className="form-label second-label">Role</h2>
            <select
              className="login-input"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
            </select>

         
            {role === "doctor" && (
  <>
    <h2 className="form-label second-label">Specialty</h2>
    <input
      type="text"
      placeholder="Enter your specialty"
      className="login-input"
      value={specialty}
      onChange={(e) => setSpecialty(e.target.value)}
    />
<h2 className="form-label second-label">CV Link</h2>

<input
  type="url"
  placeholder="Paste Google Drive CV link"
  className="login-input"
  value={doctorCvLink}
  onChange={(e) => setDoctorCvLink(e.target.value)}
/>
  </>
)}

            <button type="submit" className="login-btn">
              Create Account
            </button>

            {signupError && <p className="error-text">{signupError}</p>}
            {signupSuccess && <p className="success-text">{signupSuccess}</p>}

            <p className="signup-text">
              Already have an account?{" "}
              <span className="signup-link" onClick={() => setPage("login")}>
                Login
              </span>
            </p>
          </form>
        </div>
      </div>
    );
  }

  if (page === "patientDashboard") {
    return (
      <div className="patient-dashboard-page">
        <aside className="patient-sidebar">
          <div className="patient-logo-box">
            <MedicalLogo />
            <div className="patient-logo-text">Smart Care</div>
          </div>

          <div className="patient-menu">
            <button
              className={`patient-menu-item ${
                patientTab === "doctors" ? "active" : ""
              }`}
              onClick={() => setPatientTab("doctors")}
            >
              Doctors
            </button>

            <button
              className={`patient-menu-item ${
                patientTab === "alerts" ? "active" : ""
              }`}
              onClick={() => setPatientTab("alerts")}
            >
              Alerts
            </button>

            <button
              className={`patient-menu-item ${
                patientTab === "chat" ? "active" : ""
              }`}
              onClick={() => setPatientTab("chat")}
            >
              Chat
            </button>

            <button
              className={`patient-menu-item ${
                patientTab === "settings" ? "active" : ""
              }`}
              onClick={() => setPatientTab("settings")}
            >
              Settings
            </button>
          </div>

          <button className="patient-logout-btn" onClick={handleLogout}>
            Log out
          </button>
        </aside>

        <main className="patient-main">
          <div className="patient-topbar">
            <input
              className="patient-search"
              placeholder="Search doctors..."
              value={doctorSearch}
              onChange={(e) => setDoctorSearch(e.target.value)}
            />

            <div className="patient-userbox">
              <span>{currentUserName || "Patient"}</span>
              <div className="patient-avatar-mini">
                {currentUserName ? currentUserName.charAt(0).toUpperCase() : "P"}
              </div>
            </div>
          </div>

          {patientTab === "doctors" && (
            <>
              <div className="patient-welcome-card">
                <div className="patient-welcome-avatar">
                  {currentUserName ? currentUserName.charAt(0).toUpperCase() : "P"}
                </div>
                <div>
                  <h2>Doctors</h2>
                  <p>Choose your doctor and review your daily reports</p>

             {selectedDoctorName && doctorRequestStatus === "accepted" && (
  <div className="selected-doctor-text">
    Current doctor: {selectedDoctorName}
  </div>
)}

{doctorRequestStatus === "pending" && pendingDoctorName && (
  <div className="selected-doctor-text">
    Waiting for Dr. {pendingDoctorName} to accept your request.
  </div>
)}

{doctorRequestStatus === "rejected" && (
  <div className="selected-doctor-text">
    Your request was rejected. Please choose another doctor.
  </div>
)}
                </div>
              </div>

              <div className="health-cards-row">
                <div className="health-card">
                  <div className="health-card-label">Heart Rate</div>
                  <div className="health-card-value">{dashboardHeartRate} bpm</div>
                </div>

                <div className="health-card">
                  <div className="health-card-label">SpO2</div>
                  <div className="health-card-value">{dashboardSpo2}%</div>
                </div>

                <div className="health-card">
                  <div className="health-card-label">Status</div>
                  <div
                    className={`health-card-value status-text ${
                      dashboardStatus === "Emergency"
                        ? "status-emergency"
                        : dashboardStatus === "Warning"
                        ? "status-warning"
                        : "status-stable"
                    }`}
                  >
                    {dashboardStatus}
                  </div>
                </div>

                <div className="health-card">
                  <div className="health-card-label">Motion</div>
                  <div className="health-card-value motion-text">
                    {dashboardMotion}
                  </div>
                </div>
              </div>

              <div className="last-update-line">
                <strong>Last update:</strong> {dashboardLastUpdate}
              </div>

              {latestAlert?.status === "emergency" && (
                <div className="emergency-banner">
                  <div className="emergency-banner-title">Emergency Alert</div>
                  <div className="emergency-banner-text">
                    {latestAlert.message || "Emergency detected"}
                  </div>
                </div>
              )}

              <div className="patient-section-card">
                <div className="section-title-row">
                  <h3>Recent Alerts Preview</h3>
                  <div className="dots">• • • • •</div>
                </div>

                {recentDashboardAlerts.length > 0 ? (
                  <div className="dashboard-alert-preview-list">
                    {recentDashboardAlerts.map((alert) => (
                      <div className="dashboard-alert-preview-card" key={alert.id}>
                        <div className="report-top">
                          <h4>{alert.message || "Hardware Alert"}</h4>
                          <span>{alert.time ? formatMessageTime(alert.time) : "-"}</span>
                        </div>

                        <div className="alert-status-row">
                          <span
                            className={`alert-badge ${
                              alert.status === "emergency"
                                ? "emergency"
                                : "warning"
                            }`}
                          >
                            {alert.status || "warning"}
                          </span>
                        </div>

                        <div className="report-details">
                          <div>
                            <strong>Heart Rate:</strong> {alert.heartRate ?? "-"} bpm
                          </div>
                          <div>
                            <strong>SpO2:</strong> {alert.spo2 ?? "-"}%
                          </div>
                          <div>
                            <strong>Motion/Fall:</strong> {alert.motion ?? "No data"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-box">No alerts available yet.</div>
                )}
              </div>

              <div className="patient-section-card">
                <div className="section-title-row">
                  <h3>Available Doctors</h3>
                  <div className="dots">• • • • •</div>
                </div>

                {selectMsg && <p className="success-text left-text">{selectMsg}</p>}
                {selectError && <p className="error-text left-text">{selectError}</p>}

                <div className="doctor-cards-row">
                  {filteredDoctors.map((doctor) => (
                    <div
                      className={`doctor-card-real ${
                        selectedDoctorId === doctor.id ? "selected" : ""
                      }`}
                      key={doctor.id}
                    >
                      {doctor.imageUrl ? (
                        <img
                          src={doctor.imageUrl}
                          alt={doctor.fullName}
                          className="doctor-img"
                        />
                      ) : (
                        <div className="doctor-placeholder">
                          {doctor.fullName?.charAt(0)?.toUpperCase() || "D"}
                        </div>
                      )}

                      <h4>{doctor.fullName}</h4>
                      <p>{doctor.specialty || "Doctor"}</p>
{doctor.cvUrl && (
  <a
    href={doctor.cvUrl}
    target="_blank"
    rel="noreferrer"
    className="doctor-cv-link"
  >
    View CV
  </a>
)}
                      <button
  className={`doctor-select-btn ${
    selectedDoctorId === doctor.id ? "selected-doctor-btn" : ""
  }`}
  onClick={() => handleSelectDoctor(doctor)}
  disabled={
    doctorRequestStatus === "pending" && pendingDoctorId === doctor.id
  }
>
  {selectedDoctorId === doctor.id && doctorRequestStatus === "accepted"
    ? "Selected"
    : doctorRequestStatus === "pending" && pendingDoctorId === doctor.id
    ? "Pending"
    : "Select"}
</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="patient-section-card">
                <div className="section-title-row">
                  <h3>Daily Reports</h3>
                  <div className="dots">• • • • •</div>
                </div>

                {reports.length > 0 ? (
                  <div className="reports-list">
                    {reports.map((report) => (
                      <div className="report-card" key={report.id}>
                        <div className="report-top">
                          <h4>{report.doctorName || "Doctor Report"}</h4>
                          <span>{report.date || "-"}</span>
                        </div>

                        <p className="report-summary">
                          {report.summary || "No summary available."}
                        </p>

                        <div className="report-details">
                          <div>
                            <strong>Heart Rate:</strong>{" "}
                            {report.heartRateNote || "No note"}
                          </div>
                          <div>
                            <strong>Oxygen:</strong>{" "}
                            {report.oxygenNote || "No note"}
                          </div>
                          <div>
                            <strong>Recommendation:</strong>{" "}
                            {report.recommendationNote || "No recommendation"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-box">
                    {selectedDoctorId
                      ? "No reports available for the selected doctor yet."
                      : "No reports available yet."}
                  </div>
                )}
              </div>
            </>
          )}

          {patientTab === "alerts" && (
            <>
              <div className="patient-welcome-card">
                <div className="patient-welcome-avatar">!</div>
                <div>
                  <h2>Alerts</h2>
                  <p>Monitor incoming hardware alerts and saved vital signs</p>
                </div>
              </div>

              <div className="patient-section-card">
                <div className="section-title-row">
                  <h3>Recent Alerts</h3>
                  <div className="dots">• • • • •</div>
                </div>

                {alerts.length > 0 ? (
                  <div className="reports-list">
                    {alerts.map((alert) => (
                      <div className="alert-card" key={alert.id}>
                        <div className="report-top">
                          <h4>{alert.message || "Hardware Alert"}</h4>
                          <span>{alert.time ? formatMessageTime(alert.time) : "-"}</span>
                        </div>

                        <div className="alert-status-row">
                          <span
                            className={`alert-badge ${
                              alert.status === "emergency"
                                ? "emergency"
                                : "warning"
                            }`}
                          >
                            {alert.status || "warning"}
                          </span>
                        </div>

                        <div className="report-details">
                          <div>
                            <strong>Heart Rate:</strong> {alert.heartRate ?? "-"} bpm
                          </div>
                          <div>
                            <strong>SpO2:</strong> {alert.spo2 ?? "-"}%
                          </div>
                          <div>
                            <strong>Motion/Fall:</strong> {alert.motion ?? "No data"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-box">No alerts available yet.</div>
                )}
              </div>
            </>
          )}

          {patientTab === "chat" && (
            <div className="patient-section-card">
              <div className="section-title-row">
                <h3>Chat</h3>
                <div className="dots">• • • • •</div>
              </div>

              {!selectedDoctorId ? (
                <div className="empty-box">
                  Please select a doctor first from the Doctors page.
                </div>
              ) : (
                <div className="chat-layout">
                  <div className="chat-header-box">
                    <strong>Chat with:</strong> {selectedDoctorName || "Doctor"}
                  </div>

                  <div className="chat-messages">
                    {chatMessages.length > 0 ? (
                      chatMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`chat-bubble ${
                            msg.senderId === currentUserId ? "mine" : "other"
                          }`}
                        >
                          <div className="chat-sender">{msg.senderName}</div>
                          <div className="chat-text">{msg.text}</div>
                          <div className="chat-time">
                            {formatMessageTime(msg.createdAt)}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="empty-box">No messages yet.</div>
                    )}
                  </div>

                  <div className="chat-input-row">
                    <input
                      className="chat-input"
                      placeholder="Write your message..."
                      value={patientMessageText}
                      onChange={(e) => setPatientMessageText(e.target.value)}
                    />
                    <button className="chat-send-btn" onClick={sendPatientMessage}>
                      Send
                    </button>
                  </div>

                  {chatError && <p className="error-text left-text">{chatError}</p>}
                  {chatInfo && <p className="success-text left-text">{chatInfo}</p>}
                </div>
              )}
            </div>
          )}

          {patientTab === "settings" && (
            <div className="patient-section-card">
              <div className="section-title-row">
                <h3>Settings</h3>
                <div className="dots">• • • • •</div>
              </div>

              <div className="settings-grid">
                <div className="settings-card">
                  <h4>Profile Information</h4>

                  <label className="settings-label">Full Name</label>
                  <input
                    className="login-input settings-input"
                    value={settingsName}
                    onChange={(e) => setSettingsName(e.target.value)}
                  />

                  <label className="settings-label">Email</label>
                  <input
                    className="login-input settings-input"
                    value={currentUserEmail}
                    disabled
                  />

                  <label className="settings-label">Date of Birth</label>
                  <input
                    type="date"
                    className="login-input settings-input"
                    value={settingsDob}
                    onChange={(e) => setSettingsDob(e.target.value)}
                  />

                  <label className="settings-label">New Password</label>
                  <input
                    type="password"
                    placeholder="Leave empty if you do not want to change it"
                    className="login-input settings-input"
                    value={settingsNewPassword}
                    onChange={(e) => setSettingsNewPassword(e.target.value)}
                  />

                  <button
                    className="save-settings-btn"
                    onClick={handleSaveSettings}
                  >
                    Save Changes
                  </button>

                  {settingsError && (
                    <p className="error-text left-text">{settingsError}</p>
                  )}
                  {settingsMsg && (
                    <p className="success-text left-text">{settingsMsg}</p>
                  )}
                </div>

                <div className="settings-card">
                  <h4>Doctor Information</h4>
                  <div className="settings-info-line">
                    <strong>Selected Doctor:</strong>{" "}
                    {selectedDoctorName || "No doctor selected yet"}
                  </div>
                  <div className="settings-info-line">
                    <strong>User Role:</strong> Patient
                  </div>
                  <div className="settings-info-line">
                    <strong>Account ID:</strong> {currentUserId}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  if (page === "doctorDashboard") {
    return (
      <div className="patient-dashboard-page">
        <aside className="patient-sidebar">
          <div className="patient-logo-box">
            <MedicalLogo />
            <div className="patient-logo-text">Smart Care</div>
          </div>

          <div className="patient-menu">
            <button
              className={`patient-menu-item ${
                doctorTab === "reports" ? "active" : ""
              }`}
              onClick={() => setDoctorTab("reports")}
            >
              Dashboard
            </button>
<button
  className={`patient-menu-item ${
    doctorTab === "requests" ? "active" : ""
  }`}
  onClick={() => setDoctorTab("requests")}
>
  Requests
</button>
            <button
              className={`patient-menu-item ${
                doctorTab === "chat" ? "active" : ""
              }`}
              onClick={() => setDoctorTab("chat")}
            >
              Chat
            </button>

            <button
              className={`patient-menu-item ${
                doctorTab === "settings" ? "active" : ""
              }`}
              onClick={() => setDoctorTab("settings")}
            >
              Settings
            </button>
          </div>

          <button className="patient-logout-btn" onClick={handleLogout}>
            Log out
          </button>
        </aside>

        <main className="patient-main">
          <div className="patient-topbar">
            <input
  className="patient-search"
  placeholder="Search patients..."
  value={patientSearch}
  onChange={(e) => setPatientSearch(e.target.value)}
/>

            <div className="patient-userbox">
              <span>Dr. {currentUserName || "Doctor"}</span>
              <div className="patient-avatar-mini">
                {currentUserName ? currentUserName.charAt(0).toUpperCase() : "D"}
              </div>
            </div>
          </div>

          {doctorTab === "reports" && (
            <>
              <div className="patient-section-card">
                <div className="section-title-row">
                  <h3>Doctor Dashboard</h3>
                  <div className="dots">• • • • •</div>
                </div>

                <div className="health-cards-row">
                  <div className="health-card">
                    <div className="health-card-label">Total Patients</div>
                    <div className="health-card-value">{patients.length}</div>
                  </div>

                  <div className="health-card">
                    <div className="health-card-label">New Alerts</div>
                    <div className="health-card-value">{doctorNewAlertsCount}</div>
                  </div>

                  <div className="health-card">
                    <div className="health-card-label">Reports Added</div>
                    <div className="health-card-value">
                      {doctorAllReportsCount}
                    </div>
                  </div>

                  <div className="health-card">
                    <div className="health-card-label">Selected Patient</div>
                    <div className="health-card-value doctor-small-value">
                      {selectedPatientName || "None"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="patient-section-card">
                <div className="section-title-row">
                  <h3>Patient Selection</h3>
                  <div className="dots">• • • • •</div>
                </div>

                <label className="settings-label">Select Patient</label>
                <select
                  className="login-input settings-input"
                  value={selectedPatientId}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSelectedPatientId(value);
                    const patient = patients.find((p) => p.id === value);
                    setSelectedPatientName(patient?.fullName || "");
                  }}
                >
                  <option value="">Choose patient</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.fullName}
                    </option>
                  ))}
                </select>

                {!selectedPatientId ? (
                  <div className="empty-box doctor-empty-box">
                    Select a patient to view health data and add reports.
                  </div>
                ) : (
                  <>
                    <div className="doctor-quick-actions">
                      <button
                        className="doctor-action-btn"
                        onClick={() => setDoctorTab("chat")}
                      >
                        Open Chat
                      </button>

                      <button
                        className="doctor-action-btn"
                        onClick={() => {
                          const reportSection =
                            document.getElementById("doctor-report-form");
                          reportSection?.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                          });
                        }}
                      >
                        Write Report
                      </button>

                      <button
                        className="doctor-action-btn"
                        onClick={() => {
                          const alertsSection =
                            document.getElementById("doctor-patient-alerts");
                          alertsSection?.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                          });
                        }}
                      >
                        View Alerts
                      </button>
                    </div>

                    <div className="patient-summary-box">
                      <div className="patient-summary-grid">
                        <div className="patient-summary-item">
                          <span>Patient Name</span>
                          <strong>{selectedPatientSummary.name}</strong>
                        </div>

                        <div className="patient-summary-item">
                          <span>Selected Doctor</span>
                          <strong>{selectedPatientSummary.doctor}</strong>
                        </div>

                        <div className="patient-summary-item">
                          <span>Latest Alert Status</span>
                          <strong
                            className={
                              selectedPatientSummary.status === "emergency"
                                ? "doctor-danger-text"
                                : selectedPatientSummary.status === "warning"
                                ? "doctor-warning-text"
                                : ""
                            }
                          >
                            {selectedPatientSummary.status}
                          </strong>
                        </div>

                        <div className="patient-summary-item">
                          <span>Latest Heart Rate</span>
                          <strong>
                            {selectedPatientSummary.heartRate} bpm
                          </strong>
                        </div>

                        <div className="patient-summary-item">
                          <span>Latest SpO2</span>
                          <strong>{selectedPatientSummary.spo2}%</strong>
                        </div>

                        <div className="patient-summary-item">
                          <span>Date of Birth</span>
                          <strong>{selectedPatientData?.dateOfBirth || "-"}</strong>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {selectedPatientId && (
                <div className="patient-section-card" id="doctor-patient-alerts">
                  <div className="section-title-row">
                    <h3>Recent Patient Alerts</h3>
                    <div className="dots">• • • • •</div>
                  </div>

                  {selectedPatientAlerts.length > 0 ? (
                    <div className="dashboard-alert-preview-list">
                      {selectedPatientAlerts.slice(0, 3).map((alert) => (
                        <div className="dashboard-alert-preview-card" key={alert.id}>
                          <div className="report-top">
                            <h4>{alert.message || "Hardware Alert"}</h4>
                            <span>{alert.time ? formatMessageTime(alert.time) : "-"}</span>
                          </div>

                          <div className="alert-status-row">
                            <span
                              className={`alert-badge ${
                                alert.status === "emergency"
                                  ? "emergency"
                                  : "warning"
                              }`}
                            >
                              {alert.status || "warning"}
                            </span>
                          </div>

                          <div className="report-details">
                            <div>
                              <strong>Heart Rate:</strong> {alert.heartRate ?? "-"} bpm
                            </div>
                            <div>
                              <strong>SpO2:</strong> {alert.spo2 ?? "-"}%
                            </div>
                            <div>
                              <strong>Motion/Fall:</strong> {alert.motion ?? "No data"}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-box">
                      No alerts available for this patient yet.
                    </div>
                  )}
                </div>
              )}

              {selectedPatientId && (
                <div className="patient-section-card" id="doctor-report-form">
                  <div className="section-title-row">
                    <h3>Add Patient Report</h3>
                    <div className="dots">• • • • •</div>
                  </div>

                  <label className="settings-label">Report Summary</label>
                  <textarea
                    className="chat-input big-textarea"
                    placeholder="Write report summary"
                    value={reportText}
                    onChange={(e) => setReportText(e.target.value)}
                  />

                  <label className="settings-label">Heart Rate Note</label>
                  <input
                    type="text"
                    className="login-input settings-input"
                    placeholder="Write heart rate note"
                    value={heartNote}
                    onChange={(e) => setHeartNote(e.target.value)}
                  />

                  <label className="settings-label">Oxygen Note</label>
                  <input
                    type="text"
                    className="login-input settings-input"
                    placeholder="Write oxygen note"
                    value={oxygenNote}
                    onChange={(e) => setOxygenNote(e.target.value)}
                  />

                  <label className="settings-label">General Recommendation</label>
                  <textarea
                    className="chat-input big-textarea"
                    placeholder="Write general recommendation"
                    value={recommendationNote}
                    onChange={(e) => setRecommendationNote(e.target.value)}
                  />

                  <button className="save-settings-btn" onClick={handleAddReport}>
                    Add Report
                  </button>

                  {doctorError && (
                    <p className="error-text left-text">{doctorError}</p>
                  )}
                  {doctorMsg && (
                    <p className="success-text left-text">{doctorMsg}</p>
                  )}
                </div>
              )}

              {selectedPatientId && (
                <div className="patient-section-card">
                  <div className="section-title-row">
                    <h3>Previous Reports</h3>
                    <div className="dots">• • • • •</div>
                  </div>

                  {selectedPatientReports.length > 0 ? (
                    <div className="reports-list">
                      {selectedPatientReports.slice(0, 3).map((report) => (
                        <div className="report-card" key={report.id}>
                          <div className="report-top">
                            <h4>{report.doctorName || "Doctor Report"}</h4>
                            <span>{report.date || "-"}</span>
                          </div>

                          <p className="report-summary">
                            {report.summary || "No summary available."}
                          </p>

                          <div className="report-details">
                            <div>
                              <strong>Heart Rate:</strong>{" "}
                              {report.heartRateNote || "No note"}
                            </div>
                            <div>
                              <strong>Oxygen:</strong>{" "}
                              {report.oxygenNote || "No note"}
                            </div>
                            <div>
                              <strong>Recommendation:</strong>{" "}
                              {report.recommendationNote || "No recommendation"}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-box">
                      No reports available for this patient yet.
                    </div>
                  )}
                </div>
              )}
            </>
          )}
{doctorTab === "requests" && (
  <div className="patient-section-card">
    <div className="section-title-row">
      <h3>Patient Requests</h3>
      <div className="dots">• • • • •</div>
    </div>

    {doctorMsg && <p className="success-text left-text">{doctorMsg}</p>}
    {doctorError && <p className="error-text left-text">{doctorError}</p>}

    {doctorRequests.length > 0 ? (
      <div className="reports-list">
        {doctorRequests.map((request) => (
          <div className="report-card" key={request.patientId}>
            <div className="report-top">
              <h4>{request.patientName || "Patient"}</h4>
              <span>
                {request.createdAt ? formatMessageTime(request.createdAt) : "-"}
              </span>
            </div>

            <p className="report-summary">
              This patient wants to connect with you.
            </p>

            <div className="report-details">
              <div>
                <strong>Email:</strong> {request.patientEmail || "-"}
              </div>
              <div>
                <strong>Status:</strong> {request.status}
              </div>
            </div>

            <div className="doctor-quick-actions">
              <button
                className="doctor-action-btn"
                onClick={() => handleAcceptDoctorRequest(request)}
              >
                Accept
              </button>

              <button
                className="doctor-action-btn"
                onClick={() => handleRejectDoctorRequest(request)}
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="empty-box">No pending patient requests.</div>
    )}
  </div>
)}
          {doctorTab === "chat" && (
            <div className="patient-section-card">
              <div className="section-title-row">
                <h3>Doctor Chat</h3>
                <div className="dots">• • • • •</div>
              </div>

              <label className="settings-label">Select Patient</label>
              <select
                className="login-input settings-input"
                value={selectedPatientId}
                onChange={(e) => {
                  const value = e.target.value;
                  setSelectedPatientId(value);
                  const patient = patients.find((p) => p.id === value);
                  setSelectedPatientName(patient?.fullName || "");
                }}
              >
                <option value="">Choose patient</option>
                {filteredPatients.map((patient) => (
  <option key={patient.id} value={patient.id}>
    {patient.fullName}
  </option>
))}
              </select>

              {!selectedPatientId ? (
                <div className="empty-box">Please select a patient first.</div>
              ) : (
                <div className="chat-layout">
                  <div className="chat-header-box">
                    <strong>Chat with:</strong> {selectedPatientName || "Patient"}
                  </div>

                  <div className="chat-messages">
                    {chatMessages.length > 0 ? (
                      chatMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`chat-bubble ${
                            msg.senderId === currentUserId ? "mine" : "other"
                          }`}
                        >
                          <div className="chat-sender">{msg.senderName}</div>
                          <div className="chat-text">{msg.text}</div>
                          <div className="chat-time">
                            {formatMessageTime(msg.createdAt)}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="empty-box">No messages yet.</div>
                    )}
                  </div>

                  <div className="chat-input-row">
                    <input
                      className="chat-input"
                      placeholder="Write your message..."
                      value={doctorMessageText}
                      onChange={(e) => setDoctorMessageText(e.target.value)}
                    />
                    <button className="chat-send-btn" onClick={sendDoctorMessage}>
                      Send
                    </button>
                  </div>

                  {chatError && <p className="error-text left-text">{chatError}</p>}
                  {chatInfo && <p className="success-text left-text">{chatInfo}</p>}
                </div>
              )}
            </div>
          )}

          {doctorTab === "settings" && (
            <div className="patient-section-card">
              <div className="section-title-row">
                <h3>Doctor Settings</h3>
                <div className="dots">• • • • •</div>
              </div>

              <div className="settings-grid">
                <div className="settings-card">
                  <h4>Profile Information</h4>

                  <label className="settings-label">Full Name</label>
                  <input
                    className="login-input settings-input"
                    value={doctorSettingsName}
                    onChange={(e) => setDoctorSettingsName(e.target.value)}
                  />

                  <label className="settings-label">Email</label>
                  <input
                    className="login-input settings-input"
                    value={currentUserEmail}
                    disabled
                  />

                  <label className="settings-label">Date of Birth</label>
                  <input
                    type="date"
                    className="login-input settings-input"
                    value={doctorSettingsDob}
                    onChange={(e) => setDoctorSettingsDob(e.target.value)}
                  />

                  <label className="settings-label">Specialty</label>
                  <input
                    type="text"
                    className="login-input settings-input"
                    value={doctorSettingsSpecialty}
                    onChange={(e) => setDoctorSettingsSpecialty(e.target.value)}
                    placeholder="Enter your specialty"
                  />

                  <label className="settings-label">New Password</label>
                  <input
                    type="password"
                    className="login-input settings-input"
                    value={doctorSettingsNewPassword}
                    onChange={(e) => setDoctorSettingsNewPassword(e.target.value)}
                    placeholder="Leave empty if you do not want to change it"
                  />

                  <button
                    className="save-settings-btn"
                    onClick={handleSaveDoctorSettings}
                  >
                    Save Changes
                  </button>

                  {doctorSettingsError && (
                    <p className="error-text left-text">{doctorSettingsError}</p>
                  )}
                  {doctorSettingsMsg && (
                    <p className="success-text left-text">
                      {doctorSettingsMsg}
                    </p>
                  )}
                </div>

                <div className="settings-card">
                  <h4>Doctor Information</h4>
                  <div className="settings-info-line">
                    <strong>User Role:</strong> Doctor
                  </div>
                  <div className="settings-info-line">
                    <strong>Specialty:</strong> {currentUserSpecialty || "-"}
                  </div>
                  <div className="settings-info-line">
                    <strong>Total Patients:</strong> {patients.length}
                  </div>
                  <div className="settings-info-line">
                    <strong>Total Reports:</strong> {doctorAllReportsCount}
                  </div>
                  <div className="settings-info-line">
                    <strong>Account ID:</strong> {currentUserId}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  return null;
}

export default App;