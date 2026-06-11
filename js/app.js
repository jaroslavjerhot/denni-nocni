
import {
    app, auth, db, appState, collection, getDocs, query, where, orderBy
} from "./firebase.js";
import "./login.js";
import "./registration.js";
import "./profile.js";

let dctPages = {};


async function fStartApplication() {

    await fLoadPages();
    
        
    //await showMsg("auth", auth);

    const user =
        auth.currentUser;
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
        //"requests",
        
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
// document.addEventListener("change", fDispatch);
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
    //alert("page html: " + page.innerHTML.includes("data-field") );
    //alert("data fields: " + JSON.stringify(page.querySelectorAll("[data-field]")) );
    //alert("appState[dctDepartments]: " + JSON.stringify(dct["dctDepartments"], null, 2));
    page
        .querySelectorAll("[data-field]")
        .forEach(function(element) {
            const sField = element.dataset.field;
            if (!(sField in dct)) {return};
            
            const value = dct[sField];

            if (element.type === "checkbox") {
                element.checked = value === true;
                return;
            }

            if (element.tagName === "SELECT") {
                //console.log("fFillPage:", sField, "with value:", value, "and options:", dct[sField]);
                fFillSelect(element, dct[sField], element.value);
                //element.value = value ?? "";
                return;
            }

            element.value = value ?? "";
        });


    page
        .querySelectorAll("[data-text]")
        .forEach(function(element) {

            const sField = element.dataset.text;
            if (!(sField in dct)) {return};
            element.textContent = dct[sField] ?? "";
        });
}

async function fFillSelect(elSelect, dctValues, sSelectedValue = "") {

    //const select = page.querySelector(`#${sSelectId}`);
    console.log("fFillSelect:", elSelect.id, "with values:", dctValues, "selected:", sSelectedValue);
    elSelect.innerHTML = "";

    const emptyOption = document.createElement("option");
        emptyOption.value = "";
        emptyOption.textContent = elSelect.placeholder || "-- vyberte --";
    elSelect.appendChild(emptyOption);
    //alert('emptyOption: ' + emptyOption.outerHTML);

    Object.entries(dctValues).forEach(function([k, v]) {
        const option = document.createElement("option");
        option.value = k;
        option.textContent = v;

        if (k === sSelectedValue || v === sSelectedValue) {
            option.selected = true;
        }

        elSelect.appendChild(option);
    });
}


async function fFillAllSelects(employeeData) {

    await fFillSelect(
        document,
        "department",
        "departments",
        employeeData.department || ""
    );

    await fFillSelect(
        document,
        "pos1",
        "positions",
        employeeData.pos || ""
    );

    await fFillSelect(
        document,
        "role",
        "roles",
        employeeData.role || ""
    );

    await fFillSelect(
        "preferred_room",
        "rooms",
        employeeData.preferred_room || "",
        employeeData.department || ""
    );

    document
        .getElementById("department")
        .addEventListener("change", async function() {

            await fFillSelect(
                "preferred_room",
                "rooms",
                "",
                this.value
            );
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


async function fGetCodeDescriptionDict(sCollectionName) {
    //alert(appState.department);
    
    
    const dct = {};

    //alert("Loading code descriptions for: " + sCollectionName);
    try {
        let snapshot = null;
        if (sCollectionName === "employees") {
            snapshot = await getDocs(query(
                collection(db,sCollectionName),
                where("active", "==", true),
                orderBy("description", "asc")
            )) } else {
            snapshot = await getDocs(query(
                collection(db,sCollectionName),
                where("active", "==", true),
                orderBy("sortOrder", "asc")
            ))};
                

        //alert("snapshot: " + snapshot.size);
        //await showMsg("snapshot", snapshot);
        snapshot.forEach(function(docSnap) {
            const data = docSnap.data();
            //alert("data: " + JSON.stringify(data));
            dct[docSnap.id] = data.description;
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
window.fGetCodeDescriptionDict = fGetCodeDescriptionDict;