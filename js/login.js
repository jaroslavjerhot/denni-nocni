import {
    auth,
    db,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    query,
    collection,
    where,
    getDocs,
    signOut,
    fGetFirebaseErrorCz,
    appUser,
    appHtml,
    appFormValues,
} from "./firebase.js";



async function fLogin() {
    
    const sEmail = document.getElementById("email").value.trim().toLowerCase();

    const sPassword = document.getElementById("password").value;

    if (!sEmail) {
        await fShowMsg("err", "Zadejte e-mail.");
        return;
    }

    if (!sPassword) {
        await fShowMsg("err", "Zadejte heslo.");
        return;
    }

    try {
        // sign in with email and password and get user credential
        
        const userCredential = await signInWithEmailAndPassword(
            auth, sEmail, sPassword);
        
        const user = userCredential.user;
            
        await user.reload();

        //await fShowMsg("User", user);
        
        
        if (!user.emailVerified) {
            // not yet verified - sign out and show message
            await signOut(auth);
            await fShowMsg("err", "Nejdříve ověřte svůj e-mail. Na e-mail jsme vám poslali ověřovací odkaz.");
            return;
        }

        const qEmployees = query(
            collection(db, "employees"),
            where("email", "==", user.email)
        );

        
        const employeeSnapshot = await getDocs(qEmployees);

        if (employeeSnapshot.empty) {
            await fShowMsg("err","Váš účet nebyl nalezen v seznamu zaměstnanců.");      
            return;
        }

        // sets current employee
        const employeeDoc = employeeSnapshot.docs[0];
        appUser.current = employeeDoc.data();
        appUser.current.code = employeeDoc.id;
        
            
        appUser.current.dctDepartment = await fGetDctFromDoc("departments", appUser.current.department);
        appUser.current.dctCompany = await fGetDctFromDoc("companys", appUser.current.dctDepartment.company);
        //console.log('appUser.current:', appUser.current);
        appHtml.titCompany = appUser.current.dctCompany.description || "";
        appHtml.titDepartment = appUser.current.dctDepartment.description || "";
        //console.log('appHtml:', appHtml);
        
            

        //alert("appUser: " + JSON.stringify(appUser));
        
        if (appUser.current.active !== true) {
            await fShowMsg("err", "Váš účet není aktivní. Kontaktujte prosím administrátora.");
            return;
        }

        // await fShowMsg("success","Přihlášení bylo úspěšné. Vítejte, " + (appUser.current.surname || "neznámý uživateli") + "!");
        appUser.edited = {...appUser.current};
        
        if (!appUser.edited.profilePublished) {
            
            //console.log("appUser.edited:", appUser.edited);
            await fShowUserProfilePage(appUser.edited, false);
            //await fShowMsg("warn", "Nejprve doplňte a uložte svůj profil.");
            return;
        } else {
            const dctTitle = {'profileTitle': "Požadavky na směny"};
            
            await fShowPage("requests",{...dctTitle, ...dctTitle2, ...appCurrentUser, ...appState});
            //alert("Přihlášení bylo úspěšné. Vítejte, " + (appCurrentUser.surname || "neznámý uživateli") + "!");
            await fInitRequestsPage();
            return;
        }

    } catch (err) {
        //console.error(err);
        await fShowMsg("err", fGetFirebaseErrorCz(err.code));
    }
    
}
window.fLogin = fLogin;

function fShowRegistration() {
    const dct = {email: document.getElementById("email").value.trim().toLowerCase()};
    fShowPage("registration", dct);
}
window.fShowRegistration = fShowRegistration;

async function fResetPassword() {
    alert("fResetPassword");
    const sEmail = document.getElementById("email").value.trim().toLowerCase();
    if (!sEmail) {
        await fShowMsg("warn", "Zadejte e-mail pro reset hesla.");
        return;
    }
    try {
        await sendPasswordResetEmail(auth, sEmail, {
            url: window.location.origin
        });
        await fShowMsg("succ", "Na zadaný e-mail byl odeslán odkaz pro reset hesla.");
    } catch (err) {
        console.error(err);
        await fShowMsg("err", fGetFirebaseErrorCz(err.code));
    }
}
window.fResetPassword = fResetPassword;