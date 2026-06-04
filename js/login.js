
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import {
    getAuth,
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
    getFirestore,
    collection,
    query,
    where,
    getDocs,
    doc,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

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

document
    .getElementById("btnLogin")
    .addEventListener("click", fLogin);


async function fLogin() {

    const sEmail = document
        .getElementById("email")
        .value
        .trim()
        .toLowerCase();

    const sPassword = document
        .getElementById("password")
        .value;

    if (!sEmail) {
        showMsg("err", "Zadejte e-mail.");
        return;
    }

    if (!sPassword) {
        showMsg("err", "Zadejte heslo.");
        return;
    }

    try {

        const userCredential = await signInWithEmailAndPassword(
            auth,
            sEmail,
            sPassword
        );

        const user = userCredential.user;

        const qEmployees = query(
            collection(db, "employees"),
            where("firebase_uid", "==", user.uid)
        );

        const employeeSnapshot = await getDocs(qEmployees);

        if (employeeSnapshot.empty) {
            showMsg(
                "err",
                "Uživatel byl přihlášen, ale nebyl nalezen v seznamu zaměstnanců."
            );
            return;
        }

        const employeeDoc = employeeSnapshot.docs[0];
        const employeeData = employeeDoc.data();

        if (employeeData.active !== true) {
            showMsg(
                "err",
                "Váš účet není aktivní. Kontaktujte prosím administrátora."
            );
            return;
        }

        await updateDoc(
            doc(db, "employees", employeeDoc.id),
            {
                last_login: serverTimestamp()
            }
        );

        localStorage.setItem("employeeDocId", employeeDoc.id);
        localStorage.setItem("employeeName", employeeData.name || "");
        localStorage.setItem("employeeRole", employeeData.role || "");
        localStorage.setItem("employeeDepartment", employeeData.department || "");

        if (
            employeeData.role === "admin"
            || employeeData.role === "manager"
        ) {
            window.location.href = "requests.html";
        } else {
            window.location.href = "requests.html";
        }

    } catch (err) {

        console.error(err);

        showMsg(
            "err",
            fGetFirebaseErrorCz(err.code)
        );
    }
}


function fGetFirebaseErrorCz(sCode) {

    switch (sCode) {

        case "auth/invalid-email":
            return "E-mail má neplatný formát.";

        case "auth/user-disabled":
            return "Tento účet byl zakázán.";

        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-credential":
            return "Nesprávný e-mail nebo heslo.";

        case "auth/missing-password":
            return "Zadejte heslo.";

        case "auth/too-many-requests":
            return "Příliš mnoho pokusů o přihlášení. Zkuste to prosím později.";

        case "permission-denied":
        case "firestore/permission-denied":
            return "Nemáte oprávnění k této akci.";

        default:
            return "Přihlášení se nezdařilo.";
    }
}
