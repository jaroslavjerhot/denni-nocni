
import {
    app, auth, db,
    appUser,
    appHtml,
    appFormValues, 
    collection, getDocs, query, where, orderBy, doc, getDoc, 
    updateDoc,
    setDoc,
    serverTimestamp,
    fGetFirebaseErrorCz
} from "./firebase.js";
import "./login.js";
import "./registration.js";
import "./userRequests.js";
import "./modalDialog.js";
import "./userProfile.js";
import "./spotsList.js";
import "./shiftsPlanner.js";
import "./usersList.js";

let dctPages = {};


async function fStartApplication() {
        
    const user = auth.currentUser;
// await fShowMsg("User", user);
    if (user) {
        
        // await fShowPage("login", {email: user.email});
        await fShowPage("login", {email: 'xxx-jaroslav.jerhot@centrum.cz'});
        
    }
    else {
        //await fShowPage("login");
        const sPage = fGetUrlParam("p") || "login";
        const sId = fGetUrlParam("id") || "";
        
        if (sPage === "xusersList") {
            await fShowUsersList();
        } else {
            await fShowPage(sPage, {email: 'jaroslav.jerhot@centrum.cz'});
        }
        
        
    }
}


appHtml.isDirty = false;

// sets up history state and adds event listener for popstate to handle back/forward navigation
history.replaceState({}, "", location.href);
history.pushState({}, "", location.href);
window.addEventListener("popstate", async function () {
    //alert("Back or Forward");
    if (appHtml.isDirty) {
        //const answer = await fShowMsg("question", "Máte neuložené změny. Opravdu chcete opustit stránku?");
        await fShowMsg("warn", "Máte neuložené změny. Nejprve je uložte nebo zrušte.");
        // if (confirm("Máte neuložené změny. Opravdu chcete opustit stránku?")){
    } else {
     fGoToPage();
    }
});


function fSetDirty(event) {
    if (event.target.matches("[data-dirty]")) {
        appHtml.isDirty = true;
    }
}

//sets the leave page confirmation message
window.addEventListener("beforeunload", function(event) {
    if (!appHtml.isDirty) {
        return;
    }
    event.preventDefault();
    event.returnValue = "";
});


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
        "userRequests",
        "userProfile",
        "spotsList",
        "shiftsPlanner",
        "usersList"
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
    const sMenuHtml = `<button
        class="btn btn-outline-dark app-menu-btn"
        type="button"
        data-bs-toggle="offcanvas"
        data-bs-target="#appMenu"
        aria-controls="appMenu">
        ☰
    </button>`

    
    
    // add menu to all pages except login and registration
    if (sPage != "login" && sPage != "registration") {
        document.getElementById("appContent").innerHTML = sMenuHtml + dctPages[sPage];
    } else {
        document.getElementById("appContent").innerHTML = dctPages[sPage];
    }
    
       
    document.addEventListener("click", fDispatch);
    document.addEventListener("change", fDispatch);
// document.addEventListener("input", fDispatch);

    document.addEventListener("input", fSetDirty);
    document.addEventListener("change", fSetDirty);
    
    fFillPage(document.getElementById("appContent"), dct);
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
    //console.log("dct: " + JSON.stringify(dct, null, 2));
    page
        .querySelectorAll("[data-value]")
        .forEach(function(element) {
            //console.log("Processing element:", element, "with data-value:", dct[element.dataset.value]);
            const sField = element.dataset.value;
            //if (!(sField in dct)) {return};
            
            const value = fGetDctValueByKey(dct, sField, "");

            if (element.type === "checkbox") {
                element.checked = value === true;
                return;
            }

            if (element.tagName === "SELECT") {
                //console.log("fFillPage:", sField, "with value:", value, "and options:", dct[sField]);
                
                console.log("SELECT for field:", sField, "with value:", value);
                const options = dct[element.dataset.options];
                //alert("options: " + JSON.stringify(options));
                fFillSelect(element, options, value);
                //element.value = value ?? "";
                return;
            }
            
            if (element.type === "list") {
                alert("LIST for field:", sField, "with value:", value, "and options:", dct["dct" + fCapitalizeFirst(sField)]);
                const dctOptions = dct["dct" + fCapitalizeFirst(sField)];
                const lstValues = fGetDctValuesByKeyList(dctOptions, value, "description", "");
                //console.log("fFillPage: filling list for field:", sField, "with value:", value, "and options:", dctOptions);
                // if element is textarea, split text by new lines, otherwise by comma
                element.value = lstValues.join(", ");
                
                
                //element.value = fGetDctValuesByKeyList(dctOptions, value).join(", ");
            } else {
                //alert("fFillPage: filling field:", sField, "with value:", value);
                //console.log("ELSE for field:", sField, "with value:", value);
                // if element is textarea, split text by new lines, otherwise by comma
                if (value) {
                    if (element.tagName === "TEXTAREA") {
                        element.value = value.replaceAll(", ", "\n");
                        element.style.height = "auto";
                        element.style.height =
                            element.scrollHeight + "px";
                    } else {
                        element.value = value;
                    }
                }
    //            element.value = value ?? "";
            }
        });

    // fills text content of elements with data-text attribute
    page
        .querySelectorAll("[data-text]")
        .forEach(function(element) {

            const sField = element.dataset.text;
            //if (!(sField in dct)) {return};
            const value = fGetDctValueByKey(dct, sField, "");
            //element.textContent = value ?? "";
            element.innerHTML = value ?? "";
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
    return appUser.current.role === "Admin";
}

function fIsManager() {
    return appUser.current.role === "Mngr";
}

function fIsDeputy() {
    return appUser.current.role === "Dpty";
}

function fCanManageDepartment(sDepartment) {
    return (
        fIsAdmin()
        || (
            ["Mngr", "Dpty"].includes(appUser.current.role)
            && appUser.current.department === sDepartment
        )
    );
}

// description of function fGetVDctFromCollection: 
// This function retrieves documents from a specified Firestore collection and constructs a dictionary mapping document IDs to their descriptions. 
// It takes one parameter, sCollectionName, which is the name of the Firestore collection to query. The function returns a dictionary where the keys are document IDs and the values are the corresponding descriptions from the documents. If an error occurs during the retrieval process, it logs the error to the console and displays an error message using the fShowMsg function.
async function fGetVDctFromCollection(sCollectionName) {
    //alert(appUser.current.department);
    const dct = {};

    // in first step, try to get the collection from local storage
    const tsCollection = appFormValues.collectionsTS?.[sCollectionName];
    if (localStorage.getItem(sCollectionName)) {
        const dctLocal = JSON.parse(localStorage.getItem(sCollectionName));
        const tsLocal = JSON.parse(localStorage.getItem(sCollectionName + "_TS"));
        // console.log("fGetVDctFromCollection\nlocal storage timestamp for collection:", sCollectionName, "is:", tsLocal);
        // console.log("fGetVDctFromCollection\nFirebase timestamp for collection:", sCollectionName, "is:", tsCollection);
        if (tsCollection <= tsLocal) {
            // console.log("fGetVDctFromCollection: using local storage for collection:", sCollectionName, "with timestamp:", tsLocal);
            // console.log("fGetVDctFromCollection: local storage data:", dctLocal);
            return dctLocal;
        }
    }

    //console.log("fGetVDctFromCollection: fetching collection:", sCollectionName, "from Firestore");
    try {
        let snapshot = null;
        
        snapshot = await getDocs(query(
            collection(db,sCollectionName),
            where("active", "==", true),
            where("department", "==", appUser.current.department),
            orderBy("sortOrder", "asc")
        ));

                

        //alert("snapshot: " + snapshot.size);
        //await fShowMsg("snapshot", snapshot);
        snapshot.forEach(function(docSnap) {
            const data = docSnap.data();
            //alert("data: " + JSON.stringify(data));
            dct[docSnap.id] = data;
            // alert("data: " + JSON.stringify(dct, null, 2));
        });

        localStorage.setItem(sCollectionName + "_TS", new Date().getTime());
        localStorage.setItem(sCollectionName, JSON.stringify(dct));


    return dct;
} catch (err) {
    //alert("Firebase error: " + err.code + " - " + err.message);
    console.error("Firebase error:", err.code, err.message);
    await fShowMsg("err", fGetFirebaseErrorCz(err.code));
}
}
window.fGetVDctFromCollection = fGetVDctFromCollection;

// description of function fGetDctFromDoc: 
// This function retrieves a document from a specified Firestore collection using the document ID. It takes two parameters: sCollectionName (the name of the collection) and sDocumentId (the ID of the document to retrieve). The function returns an object containing the document ID and its data if the document exists, or null if it does not exist or if an error occurs during retrieval. The function also handles errors by logging them to the console and returning null.
async function fGetDctFromDoc(sCollectionName, sDocumentId) {
    
    // in first step, try to get the collection from local storage
    const tsCollection = appFormValues.collectionsTS?.[sCollectionName];
    if (localStorage.getItem(sCollectionName)) {
        const dctLocal = JSON.parse(localStorage.getItem(sCollectionName));
        const tsLocal = JSON.parse(localStorage.getItem(sCollectionName + "_TS"));
        // console.log("fGetVDctFromCollection\nlocal storage timestamp for collection:", sCollectionName, "is:", tsLocal);
        // console.log("fGetVDctFromCollection\nFirebase timestamp for collection:", sCollectionName, "is:", tsCollection);
        if (tsCollection <= tsLocal) {
            //console.log("fGetDctFromDoc: using local storage for collection:", sCollectionName, "with timestamp:", tsLocal);
            // console.log("fGetVDctFromCollection: local storage data:", dctLocal);
            
            return {code: sDocumentId,...fGetDctValueByKey(dctLocal, sDocumentId, null)};
        }
    }

    //console.log("fGetDctFromDoc: collection:", sCollectionName, "document ID:", sDocumentId);
    try {
        const docRef = doc(db,sCollectionName, sDocumentId);
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

function fGetDctValueByKey(dct, key, returnValueIfNotFound = '') {
    return dct[key] || (returnValueIfNotFound === '#key' ? key : returnValueIfNotFound);
}
window.fGetDctValueByKey = fGetDctValueByKey;

function fGetDctValuesByKeyList(dct, lstKeys, fieldName, returnValueIfNotFound = '') {
    if (typeof lstKeys === "string") {
        lstKeys = [lstKeys];
    }
    if (!dct || !lstKeys || lstKeys.length === 0) {
        return "";
    }
    const lstValues = [];
    if (!lstKeys || lstKeys.length === 0) {
        return "";
    }
    lstKeys.forEach(function(key) {
        //alert("Processing key: " + key + " in dct: " + JSON.stringify(dct, null, 2));
        const dctEntry = fGetDctValueByKey(dct, key, null);
        //alert("Found entry for key: " + key + " - " + JSON.stringify(dctEntry, null, 2));
        if (dctEntry) {
            lstValues.push(fGetDctValueByKey(dctEntry, fieldName, returnValueIfNotFound));
            // return;
        } 
        // lstValues.push(fGetDctValueByKey(dct, key, returnValueIfNotFound));
    });
    //alert("Collected values for keys: " + JSON.stringify(lstKeys) + " - " + JSON.stringify(lstValues));
    return lstValues;
}
window.fGetDctValuesByKeyList = fGetDctValuesByKeyList;

function fGetKeyByDctValue(dct, value, returnValueIfNotFound = '#value') {
    for (const [k, v] of Object.entries(dct)) {
        if (v === value) {
            return k;
        }
    }
    return returnValueIfNotFound === '#value' ? value : returnValueIfNotFound;
}
window.fGetKeyByDctValue = fGetKeyByDctValue;

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
            //alert("sField: " + sField + ", value: " + element.value);
            dctData[sField] = element.value;
        });
    //alert("Collected editable page data: " + JSON.stringify(dctData, null, 2));
    return dctData;
}
window.fGetEditablePageData = fGetEditablePageData;




// combines existing data with new data from form, updates the document in Firestore
async function fSaveDctToCollection(sCollection, dctBaseData, dctFormData, sDocId = null, bPublish = false, bClose = false) {
    //console.log("fSaveDctToCollection: collection:", sCollection, "base data:", dctBaseData, "form data:", dctFormData, "doc ID:", sDocId, "publish:", bPublish, "close:", bClose);
    dctFormData = {...dctBaseData, ...dctFormData, };
    
    sDocId = sDocId || String(fGetDctValueByKey(dctFormData, "code")) || String(fGetDctValueByKey(dctBaseData, "code"));

    dctFormData.updated_at = serverTimestamp();
    dctFormData.updated_by = appUser.current.code;
    dctFormData.published = bPublish;
    dctFormData.closed = bClose;
    
    //console.log("fSaveDctToCollection: combined data:", dctFormData);
    
    // await updateDoc(doc(db, sCollection, sDocId), dctFormData);
    await setDoc(doc(db, sCollection, sDocId), dctFormData, { merge: true });

    //console.log("fSaveDctToCollection: updated document:", sDocId, "in collection:", sCollection, "with data:", dctFormData);
    //localStorage.setItem(sCollection + "_" + sDocId, JSON.stringify(dctFormData));

    // update the doc in local storage
    const dctLocal = JSON.parse(localStorage.getItem(sCollection)) || {};
    dctLocal[sDocId] = dctFormData;
    localStorage.setItem(sCollection, JSON.stringify(dctLocal));
    const tsLocal = new Date().getTime();
    localStorage.setItem(sCollection + "_TS", tsLocal);
    appFormValues.collectionsTS[sCollection] = tsLocal;
    
    // sets the timestamp for the collection in appFormValues.collectionsTS to the current time in milliseconds since the epoch
    await setDoc(doc(db, "collections", "TS"), appFormValues.collectionsTS, { merge: true });

    // sets the isDirty flag to false after saving the document
    appHtml.isDirty = false;

    await fShowMsg("succ", `Uloženo.`);
}

window.fSaveDctToCollection = fSaveDctToCollection;

function fDctToLst(dct, sKeyName = "code", sValueName = "description") {
    const lst = [];
    Object.entries(dct).forEach(function([k, v]) {
        lst.push([k, v[sValueName] || v[sKeyName] || k]);
    });
    return lst;
    }
window.fDctToLst = fDctToLst;



async function fPickSelection(element, sTitle, lstChoices = [], lstInOut, maxSelected = 1) {
    //console.log("fPickSelection: element:", element, "title:", sTitle, "choices:", lstChoices, "initial selection:", lstInOut, "max selected:", maxSelected);
    const dctSelected = await fShowChoiceModal(
        sTitle,
        lstChoices,
        lstInOut ?? [],
        maxSelected
    );

    if (dctSelected === null) {
        return;
    }

    // appState.dctEmpl.favorites = selectedIds;
    lstInOut = dctSelected.ids;
    //console.log("Selected IDs:", lstInOut);
    // if element is textarea, split text by new lines, otherwise by comma
    if (element.tagName === "TEXTAREA") {
        element.value = dctSelected.descr.join("\n");
        element.style.height = "auto";
        element.style.height =
            element.scrollHeight + "px";
    } else {
        element.value = dctSelected.descr.join(", ");
    }
    return lstInOut;
}

window.fPickSelection = fPickSelection;


function fGetNthCol(lst, lstIds, n) {
    
    if (!lstIds || lstIds.length === 0) {
        return "";
    }
    //console.log("fGetNthCol: lst:", lst, "lstIds:", lstIds, "n:", n);   
    for (const row of lst) {
        if (lstIds.includes(row[0])) {
            return row[n] ?? "";
        }
    }
    return "";
}
window.fGetNthCol = fGetNthCol;

function fCreateSortText(text) {

    return text
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .toLowerCase()
        .trim();
}
window.fCreateSortText = fCreateSortText;

function fCapitalizeFirst(text) {
    if (!text) {return ""}
    return text.charAt(0).toUpperCase() + text.slice(1);
}
window.fCapitalizeFirst = fCapitalizeFirst;        

function fIsUniqueInDct(dct, key, value) {
    for (const [k, v] of Object.entries(dct)) {
        if (v[key] === value) {
            return {result: false, key: k};
        }
    }
    return {result: true, key: null};
}
window.fIsUniqueInDct = fIsUniqueInDct;

function fIsDict(value) {

    return (
        value !== null
        && typeof value === "object"
        && !Array.isArray(value)
    );
}
window.fIsDict = fIsDict;

async function fAddDctLstAndStrToDctFromCollection(sCollectionName, dctOptions, dctUser, sStrName='') {
    const bReadFromCollection = (dctOptions === undefined || dctOptions === null)
    const dctName = "dct" + fCapitalizeFirst(sCollectionName);
    const optName = "opt" + dctName.substring(3);
    const strName = sStrName || "str" + dctName.substring(3);
    //console.log("fAddDctLstAndStrToDctFromCollection: collection:", sCollectionName, "str name:", sStrName);
    
    //console.log("appHtml before adding:", appHtml);
    if (!(dctName in appHtml) && bReadFromCollection) {
        //console.log("Loading collection for:", sCollectionName);
        appHtml[dctName] = await fGetVDctFromCollection(sCollectionName);
        appHtml[optName] = fDctToLst(appHtml[dctName]);
    }else{
        //console.log("Using provided options for:", dctName, ":", dctOptions);
        appHtml[dctName] = dctOptions;
        appHtml[optName] = fDctToLst(appHtml[dctName]);
    }

    //console.log(dctName, ":", appHtml[dctName]);
    if (sCollectionName in dctUser ) {
        //alert(dctUser[sCollectionName]+": " + JSON.stringify(dctUser[sCollectionName], null, 2));
        let lst = fGetDctValuesByKeyList(appHtml[dctName], dctUser[sCollectionName], "description", []);
        appHtml[strName] = (lst.length === 0) ? "" : lst.join(", ");
        //console.log("Získané hodnoty pro klíče", dctUser[sCollectionName], ":", lst);
    }else{
        //alert("dctUser does not contain key: " + sCollectionName);
        appHtml[strName] = "";
    }
    //console.log("Získané hodnoty pro profil:", appHtml[strName]);
};
window.fAddDctLstAndStrToDctFromCollection = fAddDctLstAndStrToDctFromCollection;

function fGetNumberOfWeek(date) {
    const firstThursday = new Date(date.getFullYear(), 0, 4);
    const pastDaysOfYear = (date - firstThursday) / 86400000;
    return Math.ceil((pastDaysOfYear + firstThursday.getDay() + 1) / 7)+1;
}
window.fGetNumberOfWeek = fGetNumberOfWeek;

function fGetMonthAhead(iDays=0) {
    const dt = new Date();
    // today + iDays. if iDays = 0, then return number of days in current month, so that the next month is returned
    
    if (iDays===0) {
        iDays = new Date(dt.getFullYear(), dt.getMonth() + 1, 0).getDate();
    }
    dt.setDate(dt.getDate() + iDays);
    
    return dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, "0");
}
window.fGetMonthAhead = fGetMonthAhead;

// menu
function fShowUserProfileFromMenu() {
    console.log("fShowUserProfileFromMenu: appUser.edited:", appUser.edited);
    fShowUserProfilePage(appUser.edited, true);
}
window.fShowUserProfileFromMenu = fShowUserProfileFromMenu;

function fShowUserRequestsFromMenu() {
    const sRequestId =  fGetMonthAhead() + "_" + appUser.edited.code;
    fGetDctFromDoc("userRequests", sRequestId)
        .then(function(dctUserRequests) {
            fShowUserRequestsPage(appUser.edited, dctUserRequests);
        });
}
window.fShowUserRequestsFromMenu = fShowUserRequestsFromMenu;

function fShowSpotsListFromMenu() {
//    fShowSpotsList(appHtml.dctSpots);
}
window.fShowSpotsListFromMenu = fShowSpotsListFromMenu;

async function fShowUsersListFromMenu() {
    fShowUsersListPage(appHtml.dctUsers);
}
window.fShowUsersListFromMenu = fShowUsersListFromMenu;

function fShowShiftsPlannerFromMenu() {
//    fShowShiftsPlanner(appUser.edited, true);
}
window.fShowShiftsPlannerFromMenu = fShowShiftsPlannerFromMenu;

function fResizeTextarea(el) {
    el.style.height = "auto";
    el.style.height =
        el.scrollHeight + "px";
}
window.fResizeTextarea = fResizeTextarea;

function fGetUrlParam(sName) {
    return new URLSearchParams(window.location.search).get(sName);
}
window.fGetUrlParam = fGetUrlParam;


// returns to the specified page after saving user profile
async function fGoToPage(sTargetPage) {
    // if sTargetType is not string, then get it from appHtml.prevPage
    if (typeof sTargetPage !== "string") {
        sTargetPage = '';
    }
    
    sTargetPage = sTargetPage || appHtml.prevPage || "login";
    
    switch (sTargetPage) {
        case "usersList":
            await fShowUsersListPage();
            break;
        case "userRequests":
            await fShowUserRequestsPage(appUser.edited);
            break;
        case "login":
            await fShowPage("login", {email: appUser.current.email});
            break;
    }
}
window.fGoToPage = fGoToPage;