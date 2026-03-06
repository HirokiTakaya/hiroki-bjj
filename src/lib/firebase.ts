import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
apiKey: "AIzaSyB5FgIgrra7VjNYgCKOQ6AeVf9hjG3atqw",
  authDomain: "jiujitsu-private-booking.firebaseapp.com",
  projectId: "jiujitsu-private-booking",
  storageBucket: "jiujitsu-private-booking.firebasestorage.app",
  messagingSenderId: "1050260435510",
  appId: "1:1050260435510:web:3bd32d4a8be1f8fb5a9e97",
  measurementId: "G-YQKELYGZDN"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);