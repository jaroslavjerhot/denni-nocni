import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";


import {
    getAuth,
    signInWithEmailAndPassword,
    signOut,
    createUserWithEmailAndPassword,
    sendEmailVerification,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
    getFirestore,
    collection,
    query,
    where,
    getDocs,
    getDoc,
    doc,
    updateDoc,
    setDoc,
    addDoc,
    orderBy,
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
    sendPasswordResetEmail,
    collection,
    query,
    where,
    getDocs,
    getDoc,
    addDoc,
    setDoc,
    updateDoc,
    orderBy,
    //deleteDoc,
    doc,

    serverTimestamp
};

function fGetFirebaseErrorCz(sCode) {
    const dctErrorsCz = {
        "auth/email-already-in-use": "Tento e-mail již je registrován. Možná ale ještě nebyl ověřen emailem.",
        "auth/invalid-email": "E-mail má neplatný formát.",
        "auth/operation-not-allowed": "Tato operace není povolena.",
        "auth/weak-password": "Heslo musí mít alespoň 8 znaků.",
        "auth/user-disabled": "Tento účet byl zakázán.",
        "auth/user-not-found": "Uživatel s tímto e-mailem nebyl nalezen",
        "auth/wrong-password": "Nesprávný e-mail nebo heslo.",  
        "auth/invalid-credential": "Nesprávný e-mail nebo heslo.",
        "auth/missing-password": "Zadejte heslo.",
        "auth/too-many-requests": "Příliš mnoho pokusů o přihlášení. Zkuste to prosím později.",
        "permission-denied": "Nemáte oprávnění k této akci.",
        "firestore/permission-denied": "Nemáte oprávnění k této akci."
    };

    return dctErrorsCz[sCode] || sCode;
}
export { fGetFirebaseErrorCz };

// export const appState = {
//     dctEmpl: null,
//     department: "ApoBr",
//     dctEmployees: null,
//     dctDepartments: null,
//     dctSpots: null,
//     lstSpots: null,
//     dctPositions: null,
// };
const dctSex = {
    "m": {"description": "Muž"},
    "f": {"description": "Žena"}
};
export const appUser = {};
export const appHtml = {'dctSex': dctSex};
export const appFormValues = {};

