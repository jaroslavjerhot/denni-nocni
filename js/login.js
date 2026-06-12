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
    appState,
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
            where("email", "==", user.email)
        );

        
        const employeeSnapshot = await getDocs(qEmployees);

        if (employeeSnapshot.empty) {
            await showMsg("err","Váš účet nebyl nalezen v seznamu zaměstnanců.");      
            return;
        }

        // sets current employee
        const employeeDoc = employeeSnapshot.docs[0];
        appState.dctEmpl = employeeDoc.data();
        appState.dctEmpl.code = employeeDoc.id;
        appState.dctDepartment = await fGetDctFromDoc("departments", appState.dctEmpl.department);
        appState.dctCompany = await fGetDctFromDoc("companys", appState.dctDepartment.company);
        const dctTitle2 = {'profileTitle2': appState.dctCompany.description + " - " + appState.dctDepartment.description + ", " + (appState.dctEmpl.description || "")};
            

        //alert("appState.dctEmpl: " + JSON.stringify(appState.dctEmpl));
       
        if (appState.dctEmpl.active !== true) {
            await showMsg("err", "Váš účet není aktivní. Kontaktujte prosím administrátora.");
            return;
        }

        // await showMsg("success","Přihlášení bylo úspěšné. Vítejte, " + (appState.dctEmpl.surname || "neznámý uživateli") + "!");
        if (!appState.dctEmpl.profile_saved) {
            appState.dctEmpl.phone = String(appState.dctEmpl.phone ?? "");
            
            const dctTitle = {'profileTitle': "Doplňte a uložte svůj profil"};
            
            appState.dctSpots = await fGetDctFromCollection("spots");
            appState.dctPositions = await fGetDctFromCollection("positions");
            appState.dctEmployees = await fGetDctFromCollection("employees");
            appState.dctEmplWoThis = fRemoveKeyFromDct(appState.dctEmployees, appState.dctEmpl.code);
            
            await fShowPage("profile", {...dctTitle, ...dctTitle2, ...appState.dctEmpl, ...appState});
            return;
        } else {
            const dctTitle = {'profileTitle': "Požadavky na směny"};
            
            await fShowPage("requests",{...dctTitle, ...dctTitle2, ...appState.dctEmpl, ...appState});
            //alert("Přihlášení bylo úspěšné. Vítejte, " + (appState.dctEmpl.surname || "neznámý uživateli") + "!");
            await fInitRequestsPage();
            return;
        }

    } catch (err) {
        //console.error(err);
        showMsg("err", fGetFirebaseErrorCz(err.code));
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
        showMsg("warn", "Zadejte e-mail pro reset hesla.");
        return;
    }
    try {
        await sendPasswordResetEmail(auth, sEmail, {
            url: window.location.origin
        });
        showMsg("succ", "Na zadaný e-mail byl odeslán odkaz pro reset hesla.");
    } catch (err) {
        console.error(err);
        showMsg("err", fGetFirebaseErrorCz(err.code));
    }
}
window.fResetPassword = fResetPassword;