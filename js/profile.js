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

// saves employee profile data to Firestore, after checking the data for validity
async function fSaveEmployeeProfile() {
    const dctFormData = fGetEditablePageData();
    const bValid = await fValidateEmployeeProfile(dctFormData);    
    if (!bValid) {
        return;
    }
    await fSaveDctToCollection("employees", appState.dctEmpl, dctFormData, null, false, false);
}
window.fSaveEmployeeProfile = fSaveEmployeeProfile;

// checks employee profile data for validity, returns true if valid, false otherwise
async function fValidateEmployeeProfile(dctData) {
    
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
    const shortname = fGetDctValueByKey(dctData, "shortname").trim();
    // console.log("shortname", shortname);
    // console.log("Empl list", appState.dctEmplWoThis);
    if (shortname) {
        for (const [emplId, empl] of Object.entries(appState.dctEmplWoThis)) {
            if (empl.shortname === shortname) {
                const message = `Zkrácené jméno ${shortname} již používá ${empl.description}.`;
                await fShowMsg("err", message);
                return false;
            }
        }
    }
    dctData.shortname = shortname;

    // check if pos and pos2 are not the same and pos is not empty
    const pos = fGetDctValueByKey(dctData, "pos");
    if (pos === "") {
        const message = "Hlavní pozice musí být vyplněna.";
        await fShowMsg("err", message);
        return false;
    }
    const pos2 = fGetDctValueByKey(dctData, "pos2");
    if (pos && pos === pos2) {
        const message = "Hlavní a vedlejší pozice nemohou být stejné.";
        await fShowMsg("err", message);
        return false;
    }

    // check if there are no duplicities in favorite1, favorite2 and favorite3, favorite4, 
    // unfavorite1, unfavorite2, unfavorite3, unfavorite4
    let lstFav = [];
    let lstUnfav = [];
    for (let i = 1; i <= 4; i++) {
        const fav = fGetDctValueByKey(dctData, "favorite_" + i);
        if (fav && lstFav.includes(fav)) {
            const name = appState.dctEmployees[fav].description;
            const message = `Duplicitní oblíbení nebo neoblíbení kolegové (${name}).`;
            await fShowMsg("err", message);
            return false;
        };
        lstFav.push(fav);
        const unfav = fGetDctValueByKey(dctData, "unfavorite_" + i);
        if (unfav && lstFav.includes(unfav)) {
            const name = appState.dctEmployees[unfav].description;
            const message = `Duplicitní oblíbení nebo neoblíbení kolegové (${name}).`;
            await fShowMsg("err", message);
            return false;
        };
        lstFav.push(unfav);
    }
    // shrinks fields, ie. favorite_1 is empty but favorite_2 is not, it moves favorite_2 to favorite_1, same for unfavorite fields
    for (let i = 1; i <= 4; i++) {
        const fav = fGetDctValueByKey(dctData, "favorite_" + i);
        if (fav) {lstFav.push(fav)};
        const unfav = fGetDctValueByKey(dctData, "unfavorite_" + i);
        if (unfav) {lstUnfav.push(unfav)};
    }
    for (let i = 1; i <= 4; i++) {
        dctData["favorite_" + i] = lstFav[i-1] || "";
        dctData["unfavorite_" + i] = lstUnfav[i-1] || "";
    }

    // check if deputy1 and deputy2 are not the same
    const deputy1 = fGetDctValueByKey(dctData, "deputy_1");
    const deputy2 = fGetDctValueByKey(dctData, "deputy_2");  
    if (deputy1 === deputy2) {
        const message = "Zástupci nemohou být stejní.";
        await fShowMsg("err", message);
        return false;
    }
    // creates description / name sort
    const description = fGetDctValueByKey(dctData, "description");
    dctData.sortOrder = fCreateSortText(description);
    
    return true;
}

async function fPickFavoriteSpots(element) {
    fPickSelection(element, "Preferované pracoviště", appState.lstSpots, appState.dctEmpl.spots, 3);
}
window.fPickFavoriteSpots = fPickFavoriteSpots;

async function fPickFavoritePositions(element) {
    fPickSelection(element, "Preferované pracovní pozice", appState.lstPositions, appState.dctEmpl.positions, 2);
}
window.fPickFavoritePositions = fPickFavoritePositions;

async function fPickFavoriteEmployees(element) {
    fPickSelection(element, "Preferovaní zaměstnanci", appState.lstEmplWoThis, appState.dctEmpl.favorites, 4);
}
window.fPickFavoriteEmployees = fPickFavoriteEmployees;

async function fPickUnfavoriteEmployees(element) {
    fPickSelection(element, "Neoblíbení zaměstnanci", appState.lstEmplWoThis, appState.dctEmpl.unfavorites, 4);
}
window.fPickUnfavoriteEmployees = fPickUnfavoriteEmployees;
