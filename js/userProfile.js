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

async function fShowUserProfilePage(dctEditedUser = null, bCheckAndPublish = true) {
    
    console.log("fShowUserProfilePage: dctEditedUser:", dctEditedUser, "bCheckAndPublish:", bCheckAndPublish);
    

    // uprava telefonu
    dctEditedUser.phone = String(dctEditedUser.phone ?? "");
    
    // uprava pohlaví - pokud je pohlaví string, převede se na list
    if (typeof dctEditedUser.sex === "string") {
        dctEditedUser.sex = [dctEditedUser.sex];
    }
    await fAddDctLstAndStrToDctFromCollection("sex", appHtml.dctSex, dctEditedUser);
    
    await fAddDctLstAndStrToDctFromCollection("spots", null, dctEditedUser);
    await fAddDctLstAndStrToDctFromCollection("positions", null, dctEditedUser);
    
    // get employees without this employee to avoid showing the employee itself in favorites, unfavorites and deputies selection
    appHtml.dctEmployees = await fGetVDctFromCollection("employees");
    appHtml.dctEmplWoThis = fRemoveKeyFromDct(appHtml.dctEmployees, dctEditedUser.code);
        
    await fAddDctLstAndStrToDctFromCollection("favorites", appHtml.dctEmplWoThis, dctEditedUser);
    await fAddDctLstAndStrToDctFromCollection("unfavorites", appHtml.dctEmplWoThis, dctEditedUser);
    await fAddDctLstAndStrToDctFromCollection("deputies", appHtml.dctEmplWoThis, dctEditedUser);
    
    if (dctEditedUser.sex[0] === "f") {
        appHtml.titPage = "Profil uživatelky";
    } else {
        appHtml.titPage = "Profil uživatele";
    }
    
    appHtml.titUser = dctEditedUser.description || 
        dctEditedUser.surname + " " + dctEditedUser.givenname || "Nový uživatel";
    appHtml.userProfile = { bCheckAndPublish: bCheckAndPublish };

    //console.log("appHtml", appHtml);

    await fShowPage("userProfile", {...dctEditedUser, ...appHtml});
    appFormValues.userProfile = dctEditedUser;
     
    
}
window.fShowUserProfilePage = fShowUserProfilePage;

// saves employee profile data to Firestore, after checking the data for validity
async function fSaveUserProfile() {
    // alert("editablePageData: " + JSON.stringify(fGetEditablePageData(), null, 2));
    // alert("appFormValues.userProfile: " + JSON.stringify(appFormValues.userProfile, null, 2));
    appFormValues.userProfile = {...appFormValues.userProfile, ...fGetEditablePageData()};
    //console.log("Získaná data z formuláře: " + JSON.stringify(appFormValues.userProfile, null, 2));
    
    if (appHtml.userProfile.bCheckAndPublish) {
        const bValid = await fValidateUserProfile(appFormValues.userProfile);
        appUser.edited = {...appUser.edited, ...appFormValues.userProfile};
        if (!bValid) {
            //alert("Data nejsou validní, uložení zrušeno.");
            return;
        }
        appUser.edited.profilePublished = true;
        // creates description / name sort  
        appFormValues.userProfile.description =  `${appUser.edited.surname} ${appUser.edited.givenname}`;
        appFormValues.userProfile.sortOrder = fCreateSortText(appFormValues.userProfile.description);
        // console.log("app.user.edited: " + JSON.stringify(appUser.edited, null, 2));
        // console.log("appFormValues.userProfile: " + JSON.stringify(appFormValues.userProfile, null, 2));
        
        await fSaveDctToCollection("employees", appUser.edited, appFormValues.userProfile, null, false, false);

    }
}
window.fSaveUserProfile = fSaveUserProfile;

// checks employee profile data for validity, returns true if valid, false otherwise
async function fValidateUserProfile(dctData) {
    // check if givenname, surname and shortname are not empty
    if (await fShowMsgIfEmpty(fGetDctValueByKey(dctData, "givenname"), "Jméno")) { return false; }
    if (await fShowMsgIfEmpty(fGetDctValueByKey(dctData, "surname"), "Příjmení")) { return false; }
    if (await fShowMsgIfEmpty(fGetDctValueByKey(dctData, "shortname"), "Zkrácené jméno")) { return false; }
    

    // check phone number format - it should start with +420 and be followed by 9 digits, optionally with spaces
    let phone = fGetDctValueByKey(dctData, "phone").trim();
    if (!phone.startsWith("+420")) {
        phone = "+420" + phone.replaceAll(/\s/g, "");
    } else {
        phone = phone.replaceAll(/\s/g, "");
    }
    const phoneRegex = /^\+\d{12}$/;
    if (!phoneRegex.test(phone)) {
        const message = "Neplatný formát telefonu. Očekává se formát +420123456789.";
        await fShowMsg("err", message);
        return false;
    } else {
        dctData.phone = phone.substring(0,4) + " " + phone.substring(4,7) + " " + phone.substring(7,10) + " " + phone.substring(10,13);
    }

    // check if shortname is not in others
    const shortname = fGetDctValueByKey(dctData, "shortname", '').trim();
    let dct = fIsUniqueInDct(appHtml.dctEmplWoThis, "shortname", shortname);
    if (!dct.result) {
        const message = `Zkrácené jméno ${shortname} již používá ${appHtml.dctEmplWoThis[dct.key].description}.`;
        await fShowMsg("err", message);
        return false;
    }

    // check if shortname is not in others
    const description = `${dctData.surname}} ${dctData.givenname}`;
    
    dct = fIsUniqueInDct(appHtml.dctEmplWoThis, "description", description);
    if (!dct.result) {
        const message = `Jméno ${description} již používá ${appHtml.dctEmplWoThis[dct.key].description}.`;
        await fShowMsg("err", message);
        return false;
    }

    // check if pos and pos2 are not the same and pos is not empty
    //alert("Vybrané pozice: " + JSON.stringify(appFormValues.userProfile.positions));    
    //alert(JSON.stringify(dctData.positions));
    const pos = fGetDctValueByKey(dctData, "positions", []);
    if (pos.length === 0) {
        const message = "Pozice musí být vyplněna.";
        await fShowMsg("err", message);
        return false;
    }
    
    // check if there are no duplicities in favorite1, favorite2 and favorite3, favorite4, 
    // unfavorite1, unfavorite2, unfavorite3, unfavorite4
    let lstFav = fGetDctValueByKey(dctData, "favorites", []);
    let lstUnfav = fGetDctValueByKey(dctData, "unfavorites", []);
    for (let i = 0; i < lstFav.length; i++) {
        for (let j = 0; j < lstUnfav.length; j++) {
            if (lstFav[i] === lstUnfav[j]) {
                const name = fGetDctValueByKey(appHtml.dctEmplWoThis[lstFav[i]], "description", '');
                const message = `${name} je zároveň oblíbený i neoblíbený kolega.`;
                await fShowMsg("err", message);
                return false;
            }
        }
    }



    
    return true;
}

async function fPickSex(element) {
    console.log("appHtml.optSex:", appHtml.optSex);
    appFormValues.userProfile.sex = await fPickSelection(element, "Pohlaví", appHtml.optSex, appFormValues.userProfile.sex, 1);
    //console.log("Vybrané pohlaví:", appFormValues.userProfile.sex);
}
window.fPickSex = fPickSex;


async function fPickFavoriteSpots(element) {
    
    appFormValues.userProfile.spots = await fPickSelection(element, "Preferovaná pracoviště", appHtml.optSpots, appFormValues.userProfile.spots, 1);
    //console.log("Vybraná pracoviště:", appFormValues.userProfile.spots);
}
window.fPickFavoriteSpots = fPickFavoriteSpots;

async function fPickFavoritePositions(element) {
    //if (!appFormValues.userProfile.positions){ appFormValues.userProfile.positions = []; }
    appFormValues.userProfile.positions = await fPickSelection(element, "Pracovní pozice", appHtml.optPositions, appFormValues.userProfile.positions, 2);

}
window.fPickFavoritePositions = fPickFavoritePositions;

async function fPickFavoriteEmployees(element) {
    //if (!appFormValues.userProfile.favorites){ appFormValues.userProfile.favorites = []; }
    appFormValues.userProfile.favorites = await fPickSelection(element, "Oblíbení kolegové/yně", appHtml.optFavorites, appFormValues.userProfile.favorites, 4);
}
window.fPickFavoriteEmployees = fPickFavoriteEmployees;

async function fPickUnfavoriteEmployees(element) {
    //if (!appFormValues.userProfile.unfavorites){ appFormValues.userProfile.unfavorites = []; }
    appFormValues.userProfile.unfavorites = await fPickSelection(element, "Neoblíbení kolegové/yně", appHtml.optUnfavorites, appFormValues.userProfile.unfavorites, 4);
}
window.fPickUnfavoriteEmployees = fPickUnfavoriteEmployees;

async function fPickDeputyEmployees(element) {
    //if (!appFormValues.userProfile.deputies){ appFormValues.userProfile.deputies = []; }
    appFormValues.userProfile.deputies = await fPickSelection(element, "Zástupci", appHtml.optDeputies, appFormValues.userProfile.deputies, 1);
}
window.fPickDeputyEmployees = fPickDeputyEmployees;
