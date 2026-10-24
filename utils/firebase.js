// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDUfYXtJgUGiPg9wuAxJtNrfYptu78o2uo",
  authDomain: "vphree-data.firebaseapp.com",
  projectId: "vphree-data",
  storageBucket: "vphree-data.firebasestorage.app",
  messagingSenderId: "156397241299",
  appId: "1:156397241299:web:6cc3cb582f0cec2583e526",
  measurementId: "G-KQKP17NK6B"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };
