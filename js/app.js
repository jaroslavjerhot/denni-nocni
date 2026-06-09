
import {app, auth, db} from "./firebase.js";
import "./login.js";
// import "./registration.js";
// import "./profile.js";

let dctPages = {};

async function fStartApplication() {

    await fLoadPages();
    
        
    //await showMsg("auth", auth);

    const user =
        auth.currentUser;

    if (user) {
        await fShowPage("login", {email: user.email});
    }
    else {
        await fShowPage("login");
    }
}

document.addEventListener(
    "DOMContentLoaded",
    async function() {


        await fLoadPages();
        await fStartApplication();
        // await fShowPage("login");
        
        
        // onAuthStateChanged(
        //     auth,
        //     async function(user) {

        //         if (!user) {
        //             await showMsg("err", "Neznámý uživatel.");
        //             await fShowPage("login");
        //             return;
        //         }

        //         await user.reload();

        //         if (!user.emailVerified) {

        //             await fShowPage("login", {email: user.email});

        //             await showMsg("err","Nejdříve ověřte svůj e-mail.");

        //             return;
        //         }

        //         // invoke Login btn click on profile page to load user data

        //         const dctUser = {
        //             email: user.email,
        //             uid: user.uid
        //         };
        //         await fShowPage("profile", dctUser);
        //     }
        // );
    }
);

async function fLoadPages() {

    const lstPages = [
        "login",
        "register",
        "profile",
        //"dashboard"
    ];
    
    for (const sPage of lstPages) {

        
        const response = await fetch(
            `./pages/${sPage}.html`
        );

        dctPages[sPage] =
            await response.text();
    }
}

async function fShowPage(
    sPage,
    dct = {}
) {

    document.getElementById(
        "appContent"
    ).innerHTML =
        dctPages[sPage];

    document.addEventListener("click", fDispatch);
// document.addEventListener("change", fDispatch);
// document.addEventListener("input", fDispatch);

    // fFillPage(
    //     document.getElementById(
    //         "appContent"
    //     ),
    //     dct
    // );
}

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

window.fShowPage = fShowPage;