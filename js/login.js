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


        const employeeDoc = employeeSnapshot.docs[0];
        appState.dctEmpl = employeeDoc.data();
        //alert("appState.dctEmpl: " + JSON.stringify(appState.dctEmpl));
       
        if (appState.dctEmpl.active !== true) {
            await showMsg("err", "Váš účet není aktivní. Kontaktujte prosím administrátora.");
            return;
        }

        // await showMsg("success","Přihlášení bylo úspěšné. Vítejte, " + (appState.dctEmpl.surname || "neznámý uživateli") + "!");
        if (!appState.dctEmpl.profileSaved) {
            //await showMsg("warn","Než budete moci začít vyplňovat své požadavky, musíte nejdříve doplnit svůj profil. Jinak nebude možné zpracovat vaše požadavky.\nKlikněte na tlačítko 'OK' a vyplňte požadované informace.");
            appState.dctEmpl.name = ((appState.dctEmpl.prefix ? appState.dctEmpl.prefix + " " : "") + (appState.dctEmpl.givenname || "") + " " + (appState.dctEmpl.surname || "") + (appState.dctEmpl.suffix ? ", " + appState.dctEmpl.suffix : "")).trim();
            appState.dctEmpl.phone = String(appState.dctEmpl.phone ?? "");
            //await showMsg("appState.dctEmpl", appState.dctEmpl);
            const dctTitle = {'profileTitle': "Doplňte a uložte svůj profil"};
            const dctSelects= {}
            appState.dctDepartments = await fGetCodeDescriptionDict("departments");
            appState.dctSpots = await fGetCodeDescriptionDict("spots");
            appState.dctPositions = await fGetCodeDescriptionDict("positions");
            appState.dctEmployees = await fGetCodeDescriptionDict("employees");
            // dctSelects['department'] = appState.dctDepartments;
            // dctSelects['pref_spot'] = appState.dctSpots;
            // dctSelects['pos1'] = appState.dctPositions;
            // dctSelects['pos2'] = appState.dctPositions;
            // dctSelects['favorite1'] = appState.dctEmployees;
            // dctSelects['favorite2'] = appState.dctEmployees;
            // dctSelects['favorite3'] = appState.dctEmployees;
            // dctSelects['favorite4'] = appState.dctEmployees;
            // dctSelects['unfavorite1'] = appState.dctEmployees;
            // dctSelects['unfavorite2'] = appState.dctEmployees;
            // dctSelects['unfavorite3'] = appState.dctEmployees;
            // dctSelects['unfavorite4'] = appState.dctEmployees;

            //await showMsg("dctSelects", dctSelects);
            //alert("appState.dctDepartments: " + JSON.stringify(appState.dctDepartments, null, 2));
            //alert("appState.dctSpots: " + JSON.stringify(appState.dctSpots, null, 2));
            //alert("appState.dctEmployees: " + JSON.stringify(appState.dctEmployees, null, 2));
            // const dctSelects= {
            await fShowPage("profile", {...dctTitle, ...appState.dctEmpl, ...appState});
            // await fFillSelect(document, "department", appState.dctDepartments, "Vyberte oddělení...");
            // await fFillSelect(document, "pref_spot", appState.dctSpots, "Vyberte preferované místo...");
            // await fFillSelect(document, "pos1", appState.dctPositions, "Vyberte první pozici...");
            
            
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