import {
    auth,
    db,
    signInWithEmailAndPassword,
    query,
    collection,
    where,
    getDocs,
    signOut
} from "./firebase.js";

async function fLogin() {
    
    const sEmail = document.getElementById("email").value.trim().toLowerCase();

    const sPassword = document.getElementById("password").value;

    if (!sEmail) {
        await showMsg("err", "Zadejte e-mail.");
        return;
    }

    if (!sPassword) {
        await showMsg("err", "Zadejte heslo.");
        return;
    }

    try {
        // sign in with email and password and get user credential
        
        const userCredential = await signInWithEmailAndPassword(
            auth, sEmail, sPassword);
        
        const user = userCredential.user;
            
        await user.reload();

        //await showMsg("User", user);
        
        
        if (!user.emailVerified) {
            // not yet verified - sign out and show message
            await signOut(auth);
            await showMsg("err", "Nejdříve ověřte svůj e-mail. Na e-mail jsme vám poslali ověřovací odkaz.");
            return;
        }

        const qEmployees = query(
            collection(db, "employees"),
            where("firebase_uid", "==", user.uid)
        );

        
        const employeeSnapshot = await getDocs(qEmployees);

        if (employeeSnapshot.empty) {
            await showMsg("err","Váš účet nebyl nalezen v seznamu zaměstnanců.");      
            return;
        }

        const employeeDoc = employeeSnapshot.docs[0];
        const dctEmpl = employeeDoc.data();

        if (!dctEmpl.profileSaved) {
            await showMsg("warn","Než budete moci začít vyplňovat své požadavky, musíte nejdříve doplnit svůj profil. Klikněte na tlačítko 'OK' a vyplňte požadované informace.");
            await fShowPage("profile", dctEmpl);
            return;
        }

        await showMsg("dctEmpl", dctEmpl);
        
        if (dctEmpl.active !== true) {
            await showMsg("err", "Váš účet není aktivní. Kontaktujte prosím administrátora.");
            return;
        }

        // await updateDoc(
        //     doc(db, "employees", employeeDoc.id),
        //     {
        //         last_login: serverTimestamp()
        //     }
        // );

        // get employee data and store in localSt

        // localStorage.setItem("employeeDocId", employeeDoc.id);
        // localStorage.setItem("employeeName", dctEmpl.name || "");
        // localStorage.setItem("employeeRole", dctEmpl.role || "");
        // localStorage.setItem("employeeDepartment", dctEmpl.department || "");



        // if (
        //     dctEmpl.role === "admin"
        //     || dctEmpl.role === "manager"
        // ) {
        //     window.location.href = "requests.html";
        // } else {
        //     window.location.href = "requests.html";
        // }

        await fShowPage("requests", dctEmpl);

    } catch (err) {

        console.error(err);

        await showMsg(
            "err",
            fGetFirebaseErrorCz(err.code)
        );
    }
    
}
window.fLogin = fLogin;

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
            return sCode;
    }
}
