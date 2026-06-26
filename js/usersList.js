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

async function fShowUsersListPage() {
    appHtml.titUser = appUser.current.description;
    appHtml.titPage = "Seznam zaměstnanců";
    // console.log("appHtml:", appHtml);
    // console.log("appFormValues:", appFormValues);
    appHtml.prevPage = appHtml.activePage;
    appHtml.activePage = "usersList";

    const dctEmployees = await fGetVDctFromCollection("employees");
    appHtml.dctEmployees = {...dctEmployees};

    //console.log("fShowUserRequestsPage - dctEditedUser:", dctEditedUser);
    await fShowPage("usersList", {...appHtml});

    
    await fRenderUsersList(appHtml.dctEmployees);
    // Your implementation here

}
window.fShowUsersListPage = fShowUsersListPage;    


async function fRenderUsersList(dctEmployees) {
    // console.log("fRenderUsersList - dctEmployees:", dctEmployees);

    const container =
        document.getElementById("usersListContainer");

    if (!container) {
        return;
    }

    container.innerHTML =
        "<div class='text-muted'>Načítám...</div>";

    const lstUsers = [];

    Object.entries(dctEmployees).forEach(function([k, v]) {
        lstUsers.push({code: k, ...v });
    });


    // lstUsers.sort(function(a, b) {

    //     return String(a.description ?? "")
    //         .localeCompare(
    //             String(b.description ?? ""),
    //             "cs",
    //             { sensitivity: "base" }
    //         );

    // });

    container.innerHTML =
        fCreateUsersListHtml(lstUsers);
}


function fCreateUsersListHtml(lstUsers) {
    // console.log("fCreateUsersListHtml - lstUsers:", lstUsers);
    if (lstUsers.length === 0) {
        return "<div class='text-muted'>Žádní zaměstnanci.</div>";
    }

    return `
        <div class="table-responsive">
            <table class="table table-sm align-middle">
                <thead>
                    <tr>
                        <th></th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    ${lstUsers.map(fCreateUserRowHtml).join("")}
                </tbody>
            </table>
        </div>
    `;
}


function fCreateUserRowHtml(user) {

    const sCode =
        user.code ?? "";

    const sName =
        user.description
        ?? user.name
        ?? "";

    let sPhone =
        String(user.phone ?? "").trim();

    let sPhoneClean =
        sPhone.replace(/\s+/g, "");

    // adds +420 if not present and add spaces for display
    if (sPhoneClean && !sPhoneClean.startsWith("+420")) {
        sPhoneClean = "+420" + sPhoneClean;
    }
    sPhone = sPhoneClean.substring(0,4) + " " + sPhoneClean.substring(4,7) + " " + sPhoneClean.substring(7,10) + " " + sPhoneClean.substring(10,13);

    const sPhoneHtml =
        sPhone
            ? `
                <a href="tel:${sPhoneClean}" class="btn btn-sm btn-green-middle mb-1 btn-in-list">
                    ${sPhone.replace('+420 ', '')}
                </a>

                <a href="https://wa.me/${fPhoneForWhatsApp(sPhoneClean)}"
                   target="_blank"
                   class="btn btn-sm btn-green-lighter mb-1 btn-in-list">
                    WhatsApp
                </a>
              `
            : `<span class="text-muted">—</span>`;

    return `
        <tr>
            <td>
                <strong>${fEscapeHtml(sName)}</strong>
            </td>

            
            <td>
                ${sPhoneHtml}

                <button
                    class="btn btn-sm btn-blue-darker mb-1 btn-in-list"
                    data-action="fShowUserProfileFromList"
                    data-user-code="${fEscapeHtml(sCode)}">
                    Profil
                </button>

                <button
                    class="btn btn-sm btn-blue-semidark mb-1 btn-in-list"
                    data-action="fShowUserRequestsFromList"
                    data-user-code="${fEscapeHtml(sCode)}">
                    Požadavky
                </button>
            </td>
        </tr>
    `;
}


function fPhoneForWhatsApp(sPhone) {

    return String(sPhone)
        .replace(/^\+/, "")
        .replace(/\D/g, "");
}


function fEscapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


async function fShowUserProfileFromList(element) {

    const sUserCode = element.dataset.userCode;
    appUser.edited = await fGetDctFromDoc("employees", sUserCode);
    await fShowUserProfilePage(appUser.edited, appHtml.activePage);
}
window.fShowUserProfileFromList = fShowUserProfileFromList;


async function fShowUserRequestsFromList(element) {

    const sUserCode = element.dataset.userCode;
    appUser.edited = await fGetDctFromDoc("employees", sUserCode);
    const sRequestId =  fGetMonthAhead() + "_" + sUserCode;
    const dctUserRequests = await fGetDctFromDoc("userRequests", sRequestId);
    //console.log("sRequestId:", sRequestId);
    //console.log("dctUserRequests:", dctUserRequests);
    await fShowUserRequestsPage(appUser.edited, dctUserRequests);

}
window.fShowUserRequestsFromList = fShowUserRequestsFromList;
