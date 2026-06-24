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

async function fShowUsersList() {
    appHtml.titUser = appUser.current.description;
    appHtml.titPage = "Seznam zaměstnanců";
    // console.log("appHtml:", appHtml);
    // console.log("appFormValues:", appFormValues);
    
    const dctEmployees = await fGetVDctFromCollection("employees");
    appHtml.dctEmployees = {...dctEmployees};

    //console.log("fShowUserRequestsPage - dctEditedUser:", dctEditedUser);
    await fShowPage("usersList", {...appHtml});

    
    await fRenderUsersList(appHtml.dctEmployees);
    // Your implementation here

}
window.fShowUsersList = fShowUsersList;    


async function fRenderUsersList(dctEmployees) {
    console.log("fRenderUsersList - dctEmployees:", dctEmployees);

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
    console.log("fCreateUsersListHtml - lstUsers:", lstUsers);
    if (lstUsers.length === 0) {
        return "<div class='text-muted'>Žádní zaměstnanci.</div>";
    }

    return `
        <div class="table-responsive">
            <table class="table table-sm align-middle">
                <thead>
                    <tr>
                        <th>Jméno</th>
                        <th>Telefon</th>
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

    const sPhone =
        String(user.phone ?? "").trim();

    const sPhoneClean =
        sPhone.replace(/\s+/g, "");

    const sPhoneHtml =
        sPhone
            ? `
                <a href="tel:${sPhoneClean}" class="btn btn-sm btn-outline-success me-1">
                    Volat
                </a>

                <a href="https://wa.me/${fPhoneForWhatsApp(sPhoneClean)}"
                   target="_blank"
                   class="btn btn-sm btn-outline-success">
                    WhatsApp
                </a>
              `
            : `<span class="text-muted">—</span>`;

    return `
        <tr>
            <td>
                ${fEscapeHtml(sName)}
            </td>

            <td>
                ${sPhoneHtml}
            </td>

            <td class="text-end">
                <button
                    class="btn btn-sm btn-outline-primary me-1"
                    data-action="fShowUserProfile"
                    data-user-code="${fEscapeHtml(sCode)}">
                    Profil
                </button>

                <button
                    class="btn btn-sm btn-outline-secondary"
                    data-action="fShowUserRequests"
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


async function fShowUserProfile(element) {

    const sUserCode =
        element.dataset.userCode;

    await fShowPage(
        "userProfile",
        {
            userCode: sUserCode
        }
    );
}


async function fShowUserRequests(element) {

    const sUserCode =
        element.dataset.userCode;

    await fShowPage(
        "userRequests",
        {
            userCode: sUserCode
        }
    );
}
