// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDtqZfvqHfn4M6oIjupGnOjxcIUSOzsaTQ",
  authDomain: "mini-hcm.firebaseapp.com",
  projectId: "mini-hcm",
  storageBucket: "mini-hcm.firebasestorage.app",
  messagingSenderId: "183923491952",
  appId: "1:183923491952:web:5f04c85103bcea714820b5",
  measurementId: "G-FX3KFEE0SJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);