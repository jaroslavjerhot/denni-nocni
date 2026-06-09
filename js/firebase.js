import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";


import {
    getAuth,
    signInWithEmailAndPassword,
    signOut,
    createUserWithEmailAndPassword,
    sendEmailVerification
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
    getFirestore,
    collection,
    query,
    where,
    getDocs,
    doc,
    updateDoc,
    setDoc,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";;


const firebaseConfig = {
  apiKey: "AIzaSyBeTgy73Z4DCRb-vfQ6KxHNpknR2Vv0BtM",
  authDomain: "my-auth-app-cfd14.firebaseapp.com",
  projectId: "my-auth-app-cfd14",
  storageBucket: "my-auth-app-cfd14.firebasestorage.app",
  messagingSenderId: "586087979734",
  appId: "1:586087979734:web:5a8d95dd9c75af63140777",
  measurementId: "G-68C3B1BZB1"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);

export {
    app,
    auth,
    db,
    signInWithEmailAndPassword,
    signOut,
    createUserWithEmailAndPassword,
    sendEmailVerification,

    collection,
    query,
    where,
    getDocs,
    addDoc,
    setDoc,
    updateDoc,
    //deleteDoc,
    doc,

    serverTimestamp
};