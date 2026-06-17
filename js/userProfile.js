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

async function fShowUserProfilePage(dctEditedUser, bPublishAfterSave) {
    
    // uprava telefonu
    dctEditedUser.phone = String(dctEditedUser.phone ?? "");
    
    // uprava pohlaví - pokud je pohlaví string, převede se na list
    if (typeof dctEditedUser.sex === "string") {
        dctEditedUser.sex = [dctEditedUser.sex];
    }
    // appHtml.optSpots = fDctToLst(appHtml.dctSpots);
    // appHtml.strSpots = fGetDctValuesByKeyList(appHtml.dctSpots, dctEditedUser.spots, "");
    await fAddDctLstAndStrToDctFromCollection("sex", appHtml.dctSex, dctEditedUser);
    
    await fAddDctLstAndStrToDctFromCollection("spots", null, dctEditedUser);
    await fAddDctLstAndStrToDctFromCollection("positions", null, dctEditedUser);
    //await fAddDctLstAndStrToDctFromCollection("departments", null, dctEditedUser);
    // get employees without this employee to avoid showing the employee itself in favorites, unfavorites and deputies selection
    appHtml.dctEmployees = await fGetVDctFromCollection("employees");
    appHtml.dctEmplWoThis = fRemoveKeyFromDct(appHtml.dctEmployees, dctEditedUser.code);
        
    await fAddDctLstAndStrToDctFromCollection("favorites", appHtml.dctEmplWoThis, dctEditedUser);
    await fAddDctLstAndStrToDctFromCollection("unfavorites", appHtml.dctEmplWoThis, dctEditedUser);
    await fAddDctLstAndStrToDctFromCollection("deputies", appHtml.dctEmplWoThis, dctEditedUser);
    // console.log("dctEmplWoThis:", appHtml.dctEmplWoThis);
    // console.log("dctSex:", appHtml.dctSex);
    
    
    // appHtml.dctPositions = await fGetVDctFromCollection("positions");
    // appHtml.optPositions = fDctToLst(appHtml.dctPositions);
    // //console.log("Zobrazovaná data profilu:", dctEditedUser);
    // let lst = fGetDctValuesByKeyList(appHtml.dctPositions, dctEditedUser.positions, "description", []);
    // //console.log("Získané pozice pro profil:", lst);
    // appHtml.strPositions = lst.join(", ");
    //alert("appHtml.strPositions: " + JSON.stringify(appHtml.strPositions, null, 2));
    // appHtml.dctDepartments = await fGetVDctFromCollection("departments");
    // appHtml.optDepartments = fDctToLst(appHtml.dctDepartments);
    // appHtml.dctEmployees = await fGetVDctFromCollection("employees");
    // appHtml.dctEmplWoThis = fRemoveKeyFromDct(appHtml.dctEmployees, dctEditedUser.code);
    // appHtml.optEmplWoThis = fDctToLst(appHtml.dctEmplWoThis);
    // appHtml.strFavorites = fGetDctValuesByKeyList(appHtml.dctEmplWoThis, dctEditedUser.favorites, "");
    // appHtml.strUnfavorites = fGetDctValuesByKeyList(appHtml.dctEmplWoThis, dctEditedUser.unfavorites, "");
    // appHtml.strDeputies = fGetDctValuesByKeyList(appHtml.dctEmplWoThis, dctEditedUser.deputies, "");
    
    console.log("Zobrazovaná data profilu:", dctEditedUser);
    if (dctEditedUser.sex[0] === "f") {
        appHtml.titPage = "Profil uživatelky";
    } else {
        appHtml.titPage = "Profil uživatele";
    }
    appHtml.titUser = dctEditedUser.description || dctEditedUser.surname + " " + dctEditedUser.givenname || "Nový uživatel";
        
    
    //console.log("appHtml", appHtml);

    await fShowPage("userProfile", {...dctEditedUser, ...appHtml});
    appFormValues.profile = dctEditedUser;
}
window.fShowUserProfilePage = fShowUserProfilePage;

// saves employee profile data to Firestore, after checking the data for validity
async function fSaveUserProfile() {
    // alert("editablePageData: " + JSON.stringify(fGetEditablePageData(), null, 2));
    // alert("appFormValues.profile: " + JSON.stringify(appFormValues.profile, null, 2));
    appFormValues.profile = {...appFormValues.profile, ...fGetEditablePageData()};
    //console.log("Získaná data z formuláře: " + JSON.stringify(appFormValues.profile, null, 2));
    const bValid = await fValidateUserProfile(appFormValues.profile);    
    if (!bValid) {
        //alert("Data nejsou validní, uložení zrušeno.");
        return;
    }
    //alert("Ukládám data: " + JSON.stringify(appFormValues.profile, null, 2));
    
    await fSaveDctToCollection("employees", appUser.edited, appFormValues.profile, null, false, false);
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

    // creates description / name sort  
    dctData.description = fGetDctValueByKey(dctData, `${dctData.surname}} ${dctData.givenname}`);
    dctData.sortOrder = fCreateSortText(dctData.description);

    // check if shortname is not in others
    const shortname = fGetDctValueByKey(dctData, "shortname", '').trim();
    const dct = fIsUniqueInDct(appHtml.dctEmplWoThis, "shortname", shortname);
    if (!dct.result) {
        const message = `Zkrácené jméno ${shortname} již používá ${appHtml.dctEmplWoThis[dct.key].description}.`;
        await fShowMsg("err", message);
        return false;
    }

    // check if pos and pos2 are not the same and pos is not empty
    //alert("Vybrané pozice: " + JSON.stringify(appFormValues.profile.positions));    
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
    appFormValues.profile.sex = await fPickSelection(element, "Pohlaví", appHtml.optSex, appFormValues.profile.sex, 1);
    //console.log("Vybrané pohlaví:", appFormValues.profile.sex);
}
window.fPickSex = fPickSex;


async function fPickFavoriteSpots(element) {
    
    appFormValues.profile.spots = await fPickSelection(element, "Preferovaná pracoviště", appHtml.optSpots, appFormValues.profile.spots, 1);
    //console.log("Vybraná pracoviště:", appFormValues.profile.spots);
}
window.fPickFavoriteSpots = fPickFavoriteSpots;

async function fPickFavoritePositions(element) {
    //if (!appFormValues.profile.positions){ appFormValues.profile.positions = []; }
    appFormValues.profile.positions = await fPickSelection(element, "Pracovní pozice", appHtml.optPositions, appFormValues.profile.positions, 2);

}
window.fPickFavoritePositions = fPickFavoritePositions;

async function fPickFavoriteEmployees(element) {
    //if (!appFormValues.profile.favorites){ appFormValues.profile.favorites = []; }
    appFormValues.profile.favorites = await fPickSelection(element, "Oblíbení kolegové/yně", appHtml.optFavorites, appFormValues.profile.favorites, 4);
}
window.fPickFavoriteEmployees = fPickFavoriteEmployees;

async function fPickUnfavoriteEmployees(element) {
    //if (!appFormValues.profile.unfavorites){ appFormValues.profile.unfavorites = []; }
    appFormValues.profile.unfavorites = await fPickSelection(element, "Neoblíbení kolegové/yně", appHtml.optUnfavorites, appFormValues.profile.unfavorites, 4);
}
window.fPickUnfavoriteEmployees = fPickUnfavoriteEmployees;

async function fPickDeputyEmployees(element) {
    //if (!appFormValues.profile.deputies){ appFormValues.profile.deputies = []; }
    appFormValues.profile.deputies = await fPickSelection(element, "Zástupci", appHtml.optDeputies, appFormValues.profile.deputies, 1);
}
window.fPickDeputyEmployees = fPickDeputyEmployees;
