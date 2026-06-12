
import {
    app, auth, db, appState, collection, getDocs, query, where, orderBy, doc, getDoc, 
    updateDoc,
    serverTimestamp,
    fGetFirebaseErrorCz
} from "./firebase.js";
import "./login.js";
import "./registration.js";
import "./requests.js";

import "./profile.js";




let dctPages = {};


async function fStartApplication() {

    await fLoadPages();
    
        
    //await showMsg("auth", auth);

    const user = auth.currentUser;
// await showMsg("User", user);
    if (user) {
        
        // await fShowPage("login", {email: user.email});
        await fShowPage("login", {email: 'xxx-jaroslav.jerhot@centrum.cz'});
        
    }
    else {
        //await fShowPage("login");
        await fShowPage("login", {email: 'jaroslav.jerhot@centrum.cz'});
        
    }
}

document.addEventListener(
    "DOMContentLoaded",
    async function() {


        await fLoadPages();
        await fStartApplication();

    }
);

async function fLoadPages() {

    const lstPages = [
        "login",
        "registration",
        "requests",
        "profile",
    ];
    
    for (const sPage of lstPages) {

        
        const response = await fetch(
            `./pages/${sPage}.html`
        );

        dctPages[sPage] =
            await response.text();
    }
}

async function fShowPage(sPage, dct = {}) {
    //alert("Page loaded: " + sPage);
    document.getElementById("appContent").innerHTML = dctPages[sPage];
    
    //alert("Page content: " + dctPages[sPage]);
    
    
    
    document.addEventListener("click", fDispatch);
    document.addEventListener("change", fDispatch);
// document.addEventListener("input", fDispatch);
    
    fFillPage(document.getElementById("appContent"),dct);
}
window.fShowPage = fShowPage;

function fDispatch(event) {

    const element =
        event.target.closest(
            "[data-action]"
        );

    if (!element) {
        return;
    }

    const sFunctionName =
        element.dataset.action;

    const fn =
        window[sFunctionName];

    if (
        typeof fn !== "function"
    ) {
        console.error(
            "Function not found:",
            sFunctionName
        );
        return;
    }

    fn(element, event);
}


function fFillPage(page, dct) {
    //alert("page html: " + page.innerHTML.includes("data-value") );
    //alert("data fields: " + JSON.stringify(page.querySelectorAll("[data-value]")) );
    //alert("appState[dctDepartments]: " + JSON.stringify(dct["dctDepartments"], null, 2));
    page
        .querySelectorAll("[data-value]")
        .forEach(function(element) {
            const sField = element.dataset.value;
            //if (!(sField in dct)) {return};
            
            const value = fGetDctValueByKey(dct, sField);

            if (element.type === "checkbox") {
                element.checked = value === true;
                return;
            }

            if (element.tagName === "SELECT") {
                //console.log("fFillPage:", sField, "with value:", value, "and options:", dct[sField]);
                const options = dct[element.dataset.options];
                //alert("options: " + JSON.stringify(options));
                fFillSelect(element, options, value);
                //element.value = value ?? "";
                return;
            }

            element.value = value ?? "";
        });

    // fills text content of elements with data-text attribute
    page
        .querySelectorAll("[data-text]")
        .forEach(function(element) {

            const sField = element.dataset.text;
            //if (!(sField in dct)) {return};
            const value = fGetDctValueByKey(dct, sField);
            element.textContent = value ?? "";
        });

    // unhides elements with data-visible attribute if the corresponding field in dct is false
    page
        .querySelectorAll("[data-visible]")
        .forEach(function(element) {
            const sField = element.dataset.visible.split("=")[0];
            const sValue = element.dataset.visible.split("=")[1];
            
            //if (!(sField in dct)) {return};
            const value = fGetDctValueByKey(dct, sField);
            element.style.display = value == sValue ? "" : "none";
        });
}

async function fFillSelect(elSelect, dctValues, sSelectedValue = "") {

    if (!dctValues) {
        console.error("No options provided for select:", elSelect.id);
        return;
    }
    //const select = page.querySelector(`#${sSelectId}`);
    //console.log("fFillSelect:", elSelect.id, "with values:", dctValues, "selected:", sSelectedValue);
    if (!sSelectedValue) {sSelectedValue = ""};

    elSelect.innerHTML = "";

    const emptyOption = document.createElement("option");
        emptyOption.value = "";
        emptyOption.textContent = elSelect.placeholder || "-- vyberte --";
    elSelect.appendChild(emptyOption);
    //alert('emptyOption: ' + emptyOption.outerHTML);

    Object.entries(dctValues).forEach(function([k, v]) {
        const option = document.createElement("option");
        option.value = k;
        option.textContent = v.description || v.name || v.code || k;

        if (k === sSelectedValue || parseInt(k) === sSelectedValue) {
            option.selected = true;
        }

        elSelect.appendChild(option);
    });
}

function togglePassword(sInputId, btn) {

    const input = document.getElementById(sInputId);

    if (input.type === "password") {
        input.type = "text";
        btn.textContent = "🙈";
    } else {
        input.type = "password";
        btn.textContent = "👁";
    }

}
window.togglePassword = togglePassword;

function fIsAdmin() {
    return appState.dctEmpl.role === "Admin";
}

function fIsManager() {
    return appState.dctEmpl.role === "Mngr";
}

function fIsDeputy() {
    return appState.dctEmpl.role === "Dpty";
}

function fCanManageDepartment(sDepartment) {
    return (
        fIsAdmin()
        || (
            ["Mngr", "Dpty"].includes(appState.dctEmpl.role)
            && appState.dctEmpl.department === sDepartment
        )
    );
}

// description of function fGetDctFromCollection: 
// This function retrieves documents from a specified Firestore collection and constructs a dictionary mapping document IDs to their descriptions. 
// It takes one parameter, sCollectionName, which is the name of the Firestore collection to query. The function returns a dictionary where the keys are document IDs and the values are the corresponding descriptions from the documents. If an error occurs during the retrieval process, it logs the error to the console and displays an error message using the showMsg function.
async function fGetDctFromCollection(sCollectionName) {
    //alert(appState.department);
    const dct = {};

    //alert("Loading code descriptions for: " + sCollectionName);
    try {
        let snapshot = null;
        if (sCollectionName === "employees") {
            snapshot = await getDocs(query(
                collection(db,sCollectionName),
                where("active", "==", true),
                where("department", "==", appState.department),
                orderBy("description", "asc")
            )) } else {
            snapshot = await getDocs(query(
                collection(db,sCollectionName),
                where("active", "==", true),
                where("department", "==", appState.department),
                orderBy("sortOrder", "asc")
            ))};
                

        //alert("snapshot: " + snapshot.size);
        //await showMsg("snapshot", snapshot);
        snapshot.forEach(function(docSnap) {
            const data = docSnap.data();
            //alert("data: " + JSON.stringify(data));
            dct[docSnap.id] = data;
            // alert("data: " + JSON.stringify(dct, null, 2));
        });

    return dct;
} catch (err) {
    //alert("Firebase error: " + err.code + " - " + err.message);
    console.error(
        "Firebase error:",
        err.code,
        err.message
    );
    await showMsg("err", fGetFirebaseErrorCz(err.code));
}
}
window.fGetDctFromCollection = fGetDctFromCollection;

// description of function fGetDctFromDoc: 
// This function retrieves a document from a specified Firestore collection using the document ID. It takes two parameters: sCollectionName (the name of the collection) and sDocumentId (the ID of the document to retrieve). The function returns an object containing the document ID and its data if the document exists, or null if it does not exist or if an error occurs during retrieval. The function also handles errors by logging them to the console and returning null.
async function fGetDctFromDoc(sCollectionName, sDocumentId) {

    //console.log("fGetDctFromDoc: collection:", sCollectionName, "document ID:", sDocumentId);
    try {
        const docRef = doc(db,sCollectionName,sDocumentId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {return null;}

        //console.log("fGetDctFromDoc: document data:", docSnap.data());
        return {code: docSnap.id,...docSnap.data()};

    } catch (err) {
        console.error(err);
        return null;
    }
}
window.fGetDctFromDoc = fGetDctFromDoc;

function fGetDctValueByKey(dct, key) {
    return dct[key] || key;
}
window.fGetDctValueByKey = fGetDctValueByKey;

function fRemoveKeyFromDct(dct, key) {
    //alert("Removing key: " + key + " from dct: " + JSON.stringify(dct, null, 2));
    const {[key]: _, ...rest} = dct;
    return rest;
}
window.fRemoveKeyFromDct = fRemoveKeyFromDct;

function fGetEditablePageData() {

    const dctData = {};

    document
        .querySelectorAll("[data-value]")
        .forEach(function(element) {

            const sField = element.dataset.value;
            //console.log("Processing field:", sField, "with element:", element);

            if (element.disabled || element.readOnly) {
                return;
            }
            if (element.type === "checkbox") {
                dctData[sField] = element.checked;
                return;
            }
            if (element.type === "number") {
                dctData[sField] = element.value === "" ? null : Number(element.value);
                return;
            }
            dctData[sField] = element.value;
        });

    return dctData;
}
window.fGetEditablePageData = fGetEditablePageData;

function fCheckEmployeeProfileData(dctData) {
    
    // check phone number format - it should start with +420 and be followed by 9 digits, optionally with spaces
    let phone = fGetDctValueByKey(dctData, "phone").trim();
    if (!phone.startsWith("+420")) {
        phone = "+420" + phone.replaceAll(/\s/g, "");
    } else {
        phone = phone.replaceAll(/\s/g, "");
    }
    const phoneRegex = /^\+\d{12}$/;
    if (!phoneRegex.test(phone)) {
        return {valid: false, message: "Neplatný formát telefonu. Očekává se formát +420123456789."};
    } else {
        dctData.phone = phone.substring(0,4) + " " + phone.substring(4,7) + " " + phone.substring(7,10) + " " + phone.substring(10,13);
    }

    // check if shortname is not in others
    const shortname = fGetDctValueByKey(dctData, "shortname").trim();
    if (shortname) {
        for (const [emplId, empl] of Object.entries(appState.dctEmplWoThis)) {
            if (empl.shortname === shortname) {
                return {valid: false, message: "Zkrácený název již používá jiný zaměstnanec. Zvolte prosím jiný."};
            }
        }
    }
    dctData.shortname = shortname;

    // check if pos and pos2 are not the same and pos is not empty
    const pos = fGetDctValueByKey(dctData, "pos");
    if (pos === "") {
        return {valid: false, message: "Hlavní pozice musí být vyplněna."};
    }
    const pos2 = fGetDctValueByKey(dctData, "pos2");
    if (pos && pos === pos2) {
        return {valid: false, message: "Hlavní a vedlejší pozice nemohou být stejné."};
    }

    // check if there are no duplicities in favorite1, favorite2 and favorite3, favorite4, 
    // unfavorite1, unfavorite2, unfavorite3, unfavorite4
    const lstFav = [];
    for (let i = 1; i <= 4; i++) {
        const fav = fGetDctValueByKey(dctData, "favorite_" + i);
        if (fav && lstFav.includes(fav)) {
            const name = appState.dctEmployees[fav].description;
            return {valid: false, 
                message: `Duplicitní oblíbení a neoblíbení kolegové (${name}).`}
        };
        lstFav.push(fav);
        const unfav = fGetDctValueByKey(dctData, "unfavorite_" + i);
        if (unfav && lstFav.includes(unfav)) {
            const name = appState.dctEmployees[unfav].description;
            return {valid: false, 
                message: `Duplicitní oblíbení a neoblíbení kolegové (${name}).`}
        };
        lstFav.push(unfav);
    }

    // check if deputy1 and deputy2 are not the same
    const deputy1 = fGetDctValueByKey(dctData, "deputy_1");
    const deputy2 = fGetDctValueByKey(dctData, "deputy_2");  
    if (deputy1 === deputy2) {
        return {valid: false, message: "Zástupci nemohou být stejní."};
    }
    return {valid: true};
}

async function fSaveEmployeeProfile() {

    const dctData = fGetEditablePageData();
    const validation = fCheckEmployeeProfileData(dctData);
    if (!validation.valid) {
        await showMsg("err", validation.message);
        return;
    }
    // alert("Data to save: " + JSON.stringify(dctData, null, 2));
    // return;

    const sEmployeeId = String(appState.dctEmpl.code);
    
    dctData.updated_at = serverTimestamp();
    dctData.profile_saved = true;
    await updateDoc(doc(db, "employees", sEmployeeId),dctData);

    appState.dctEmpl = {
        ...appState.dctEmpl,
        ...dctData
    };

    await showMsg("succ", `Profil uživatele ${appState.dctEmpl.description} byl uložen.`);
}

window.fSaveEmployeeProfile = fSaveEmployeeProfile;

function fRenderRequestsCalendar() {
    alert("fRenderRequestsCalendar");
}
window.fRenderRequestsCalendar = fRenderRequestsCalendar;

