function showMsg(modalType, text) {
    const modalTitle = document.getElementById("modalTitle");
    const modalText = document.getElementById("modalText");



    switch (modalType) {

        case "err":
          modalTitle.innerText = "Chyba";
          modalHeader.className ="modal-header bg-danger text-white";
            break;

        case "succ":
            modalTitle.innerText = "Úspěch";
            modalHeader.className = "modal-header bg-success text-white";
            break;

        case "warn":
            modalTitle.innerText = "Upozornění";
            modalHeader.className = "modal-header bg-warning text-white";
            break;

        case "wait":
            modalTitle.innerText = "Čekejte";
            modalHeader.className = "modal-header bg-primary text-white";
            const modalClose = document.getElementById("modalClose");
            modalClose.style.display = "none";
            break;

        default:
            modalTitle.innerText = "Informace";
            modalHeader.className = "modal-header bg-secondary text-white";

    }
    modalText.innerText = text;
    
    const modal =
        new bootstrap.Modal(
            document.getElementById("genericModal")
        );

    modal.show();
}

function hideMsg() {
  //alert("hideMsg");  
  const modal = document.getElementById("genericModal")
  const bootstrapModal = bootstrap.Modal.getInstance(modal);
  if (bootstrapModal) {
    bootstrapModal.hide();
  }
}
