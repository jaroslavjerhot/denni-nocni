import {
    auth,
    db,
    signInWithEmailAndPassword,
    signOut,
    createUserWithEmailAndPassword,
    sendEmailVerification,
    query,
    collection,
    where,
    getDocs,
    fGetFirebaseErrorCz,
    appState,
} from "./firebase.js";

auth.languageCode = "cs";


async function fRegister() {

    const sEmail = document.getElementById("email").value.trim().toLowerCase();

    const sPassword = document.getElementById("password").value;

    const sPassword2 = document.getElementById("password2").value;

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

        const employeeDoc = await fFindEmployeeByEmail(sEmail);

        if (!employeeDoc) {
            showMsg(
                "err",
                "Tento e-mail není v seznamu povolených zaměstnanců."
            );
            return;
        }

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
                "Tento uživatel už má vytvořený účet. Pokud e-mail ještě není ověřený, zkontrolujte prosím poštu nebo použijte přihlášení."
            );
            return;
        }

        const userCredential = await createUserWithEmailAndPassword(
            auth,
            sEmail,
            sPassword
        );

        const user = userCredential.user;

        try {
            alert("Sending verification email..., back: " + location.origin);
            await sendEmailVerification(user, {
                url: location.origin 
                //url: "https://denni-nocni.openeer.eu/index.html"
            });

        } catch (errVerification) {

            console.error(errVerification);

            await signOut(auth);

            showMsg(
                "err",
                "Účet byl vytvořen, ale nepodařilo se odeslat ověřovací e-mail. Kontaktujte prosím administrátora."
            );

            return;
        }

        // await updateDoc(
        //     doc(db, "employees", employeeDoc.id),
        //     {
        //         firebase_uid: user.uid,
        //         email_verified: false,
        //         verification_sent_at: serverTimestamp(),
        //         last_login: null
        //     }
        // );

        await signOut(auth);

        showMsg(
            "success",
            "Registrace proběhla úspěšně. Na e-mail jsme poslali ověřovací odkaz. Po ověření se prosím přihlaste."
        );

        fShowLogin();
    } catch (err) {

        console.error(err);

        showMsg("err", fGetFirebaseErrorCz(err.code));
    }
}
window.fRegister = fRegister;

async function fShowLogin() {
    //alert("fShowLogin");
    await fShowPage("login", appState.dctEmpl);
}
window.fShowLogin = fShowLogin;

async function fFindEmployeeByEmail(sEmail) {

    const qEmployees = query(
        collection(db, "employees"),
        where("email", "==", sEmail)
    );

    try {
        const employeeSnapshot = await getDocs(qEmployees);

        if (employeeSnapshot.empty) {
            return null;
        }

        return employeeSnapshot.docs[0];
    } catch (err) {
        alert('ERR');
        showMsg("err", err.message);
        console.error(err);
        return null;
    }
}

