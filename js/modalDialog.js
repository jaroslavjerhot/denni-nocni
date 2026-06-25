
// import { appState } from "./firebase.js";

function fCreateModal(sModalTitle, text) {
    const modalTitle = document.getElementById("modalTitle");
    const modalText = document.getElementById("modalText");
    const modalHeader = document.getElementById("modalHeader");
    const modalOK = document.getElementById("modalOk");
    const modalCancel = document.getElementById("modalCancel");
    //const modalClose = document.getElementById("modalClose");
    // of modalText is not text, use JSON.stringify
    
    if (typeof text !== "string") {
        text = JSON.stringify(text, null, 2);
    }

    switch (sModalTitle) {

        case "err":
          modalTitle.innerText = ":((";
          modalHeader.className ="modal-header bg-danger text-white";
          modalOK.className = "btn bg-danger text-white";
          //modalClose.className = "btn-close btn-close-white";
          modalCancel.style.display = "none";
          break;

        case "succ":
            modalTitle.innerText = ":))";
            modalHeader.className = "modal-header bg-success text-white";
            modalOK.className = "btn bg-success text-white";
            modalCancel.style.display = "none";
            break;

        case "warn":
            modalTitle.innerText = "!!!";
            modalHeader.className = "modal-header bg-warning text-white";
            modalOK.className = "btn bg-warning text-white";
            modalCancel.style.display = "none";
            break;

        case "wait":
            modalTitle.innerText = ":O";
            modalHeader.className = "modal-header bg-primary text-white";
            modalOK.className = "btn bg-primary text-white";
            const modalClose = document.getElementById("modalClose");
            modalClose.style.display = "none";
            modalCancel.style.display = "none";
            break;

        case "question":
            modalTitle.innerText = "???";
            modalHeader.className = "modal-header bg-info text-white";
            modalOK.className = "btn bg-info text-white";
            modalCancel.className = "btn btn-red-darker";
            break;

        default:
            modalTitle.innerText = sModalTitle ||"Info";
            modalHeader.className = "modal-header c-blue-darker text-white";
            modalOK.className = "btn bg-blue-darker text-white";

    }
    modalText.innerText = text;
    
    const modal =
        new bootstrap.Modal(
            document.getElementById("genericModal")
        );

    //modal.show();
    return modal;
}

function fHideMsg() {
  //alert("hideMsg");  
  const modal = document.getElementById("genericModal")
  const bootstrapModal = bootstrap.Modal.getInstance(modal);
  if (bootstrapModal) {
    bootstrapModal.hide();
  }
}

async function fShowMsg(sModalTitle, sText) {

    return new Promise((resolve) => {

        const modalElement =
            document.getElementById("genericModal");

        const modal = fCreateModal(sModalTitle, sText);


        modalElement.addEventListener(
            "hidden.bs.modal",
            function fHandler() {

                modalElement.removeEventListener(
                    "hidden.bs.modal",
                    fHandler
                );

                resolve();
            }
        );

        modal.show();
    });
}
window.fShowMsg = fShowMsg;

async function fShowMsgIfEmpty(value, valueName) {
    if (!value) {
        await fShowMsg("err", `${fCapitalizeFirst(valueName)} nesmí být prázdné.`);
        return true;
    }
    return false;
}

async function fShowChoiceModal(
    title,
    lstChoices,
    selectedIds = [],
    maxSelected = 1
) {
    //console.log("fShowChoiceModal maxSelected:", maxSelected, "title:", title);
    return new Promise(function(resolve) {

        let selected = new Set(
            Array.isArray(selectedIds)
                ? selectedIds.map(String)
                : [String(selectedIds)]
        );

        selected.delete("");

        const modalElement = document.getElementById("choiceModal");
        const modal = new bootstrap.Modal(modalElement);

        const titleElement = document.getElementById("choiceModalTitle");
        const bodyElement = document.getElementById("choiceModalBody");
        const btnOk = document.getElementById("choiceModalOk");
        const btnDelete = document.getElementById("choiceModalDelete");
        const btnCancel = document.getElementById("choiceModalCancel");

        titleElement.textContent = title;
        bodyElement.innerHTML = "";

        function fRender() {

            bodyElement.innerHTML = "";

            const wrapper = document.createElement("div");
            // wrapper.className = "d-flex flex-wrap gap-2";
            wrapper.className = "d-flex flex-column gap-2"; 

            lstChoices.forEach(function(row) {

                const code = String(row[0]);
                const caption = row[1] ?? code;
                const clsNormal = row[2] ?? "btn inp-blue-lighter w-100 mb-2";
                const clsSelected = row[3] ?? "btn btn-blue-darker w-100 mb-2";
                // const comment = row[4] ?? "comment";
                const comment = "comment";

                const isSelected = selected.has(code);

                const btn = document.createElement("button");
                btn.type = "button";
                btn.className = isSelected ? clsSelected : clsNormal;
                btn.dataset.code = code;
                btn.textContent = caption;

                if (comment) {
                    btn.title = comment;
                }

                btn.addEventListener("click", async function() {

                    if (maxSelected === 1) {
                        //console.log("Selected code:", code);
                        selected = new Set([code]);

                        fCleanup();

                        modal.hide();
                        
                        resolve({ids:[code], descr: [caption]});

                        return;
                    }

                    if (selected.has(code)) {
                        selected.delete(code);
                    } else {

                        if (
                            maxSelected > 0 &&
                            selected.size >= maxSelected
                        ) {
                            await fShowMsg(
                                "err",
                                "Můžete vybrat maximálně " + maxSelected + " položek."
                            );
                            return;
                        }

                        selected.add(code);
                    }

                    fRender();
                });

                wrapper.appendChild(btn);
            });

            bodyElement.appendChild(wrapper);

            btnOk.style.display =
                maxSelected === 1
                    ? "none"
                    : "";
        }

        function fOk() {

            fCleanup();

            modal.hide();

            resolve({ids: Array.from(selected), descr: fGetDescrFromSelected(lstChoices, Array.from(selected))});
        }

        function fDelete() {

            fCleanup();

            modal.hide();

            resolve({ids: [], descr: []});
        }

        function fCancel() {

            fCleanup();

            modal.hide();

            resolve(null);
        }

        function fCleanup() {

            btnOk.removeEventListener("click", fOk);
            btnDelete.removeEventListener("click", fDelete);
            btnCancel.removeEventListener("click", fCancel);
        }

        btnOk.addEventListener("click", fOk);
        btnDelete.addEventListener("click", fDelete); 
        btnCancel.addEventListener("click", fCancel);

        fRender();

        modal.show();
    });
}

function fGetDescrFromSelected(lstChoices, selectedIds) {
    const selectedSet = new Set(selectedIds.map(String));
    return lstChoices
        .filter(row => selectedSet.has(String(row[0])))
        .map(row => row[1]);
}
window.fGetDescrFromSelected = fGetDescrFromSelected;

