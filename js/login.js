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
        appState.dctEmpl = employeeDoc.data();
        appState.dctEmpl.code = employeeDoc.id;
        appState.dctDepartment = await fGetDctFromDoc("departments", appState.dctEmpl.department);
        appState.dctCompany = await fGetDctFromDoc("companys", appState.dctDepartment.company);
        const dctTitle2 = {'profileTitle2': appState.dctCompany.description + " - " + appState.dctDepartment.description};
        const dctTitle3 = {'profileTitle3': appState.dctEmpl.description || ""};
            

        //alert("appState.dctEmpl: " + JSON.stringify(appState.dctEmpl));
       
        if (appState.dctEmpl.active !== true) {
            await fShowMsg("err", "Váš účet není aktivní. Kontaktujte prosím administrátora.");
            return;
        }

        // await fShowMsg("success","Přihlášení bylo úspěšné. Vítejte, " + (appState.dctEmpl.surname || "neznámý uživateli") + "!");
        if (!appState.dctEmpl.published) {
            appState.dctEmpl.phone = String(appState.dctEmpl.phone ?? "");
            
            const dctTitle = {'profileTitle': "Profil"};
            
            appState.dctSpots = await fGetVDctFromCollection("spots");
            appState.lstSpots = fDctToLst(appState.dctSpots);
            //alert("lstSpots: " + JSON.stringify(appState.lstSpots));
            appState.dctPositions = await fGetVDctFromCollection("positions");
            appState.lstPositions = fDctToLst(appState.dctPositions);
            appState.dctDepartments = await fGetVDctFromCollection("departments");
            appState.lstDepartments = fDctToLst(appState.dctDepartments);
            appState.dctEmployees = await fGetVDctFromCollection("employees");
            appState.dctEmplWoThis = fRemoveKeyFromDct(appState.dctEmployees, appState.dctEmpl.code);
            appState.lstEmplWoThis = fDctToLst(appState.dctEmplWoThis);
            
            await fShowPage("profile", {...dctTitle, ...dctTitle2, ...dctTitle3, ...appState.dctEmpl, ...appState});
            //await fShowMsg("warn", "Nejprve doplňte a uložte svůj profil.");
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