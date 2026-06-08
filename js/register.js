
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    sendEmailVerification,
    signOut,
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
    .getElementById("btnRegister")
    .addEventListener("click", fRegister);


async function fRegister() {

    const sEmail = document
        .getElementById("email")
        .value
        .trim()
        .toLowerCase();

    const sPassword = document
        .getElementById("password")
        .value;

    const sPassword2 = document
        .getElementById("password2")
        .value;

    if (!sEmail) {
        showMsg("err", "Zadejte e-mail.");
        return;
    }

    if (!sPassword) {
        showMsg("err", "Zadejte heslo.");
        return;
    }

    if (sPassword.length < 8) {
        showMsg("err", "Heslo musí mít alespoň 8 znaků.");
        return;
    }

    if (sPassword !== sPassword2) {
        showMsg("err", "Hesla se neshodují.");
        return;
    }

    try {

        const qEmployees = query(
            collection(db, "employees"),
            where("email", "==", sEmail)
        );

        const employeeSnapshot = await getDocs(qEmployees);

        if (employeeSnapshot.empty) {
            showMsg(
                "err",
                "Tento e-mail není v seznamu povolených zaměstnanců."
            );
            return;
        }

        const employeeDoc = employeeSnapshot.docs[0];
        const employeeData = employeeDoc.data();

        if (employeeData.active !== true) {
            showMsg(
                "err",
                "Tento účet není aktivní. Kontaktujte prosím administrátora."
            );
            return;
        }

        if (
            employeeData.firebase_uid
            && String(employeeData.firebase_uid).trim() !== ""
        ) {
            showMsg(
                "err",
                "Tento uživatel je již registrován. Použijte prosím přihlášení."
            );
            return;
        }

        const userCredential = await createUserWithEmailAndPassword(
    auth,
    sEmail,
    sPassword
);

    const user = userCredential.user;

    // await updateDoc(
    //     doc(db, "employees", employeeDoc.id),
    //     {
    //         firebase_uid: user.uid,
    //         last_login: serverTimestamp()
    //     }
    // );

    auth.languageCode = "cs";
    await sendEmailVerification(user, {
        url: "https://denni-nocni.openeer.eu/index.html"
    });

    alert("Ověřovací e-mail byl odeslán. Po ověření se prosím přihlaste.");
    
    await signOut(auth);

    showMsg(
        "success",
        "Registrace proběhla úspěšně. Na e-mail jsme vám poslali ověřovací odkaz. Po ověření se prosím přihlaste."
    );

    //localStorage.setItem("employeeDocId", employeeDoc.id);

    //window.location.href = "profile.html";

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

        case "auth/email-already-in-use":
            return "Tento e-mail je již ve Firebase registrován.";

        case "auth/invalid-email":
            return "E-mail má neplatný formát.";

        case "auth/weak-password":
            return "Heslo je příliš slabé.";

        case "auth/missing-password":
            return "Zadejte heslo.";

        case "permission-denied":
        case "firestore/permission-denied":
            return "Nemáte oprávnění k této akci.";

        default:
            return sCode;
    }
}