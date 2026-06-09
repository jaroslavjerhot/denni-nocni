function fShowPage(sPageId, dct = {}) {

    document
        .querySelectorAll(".app-page")
        .forEach(function(page) {
            page.classList.add("d-none");
        });

    const page = document.getElementById(sPageId);

    if (!page) {
        console.error("Page not found:", sPageId);
        return;
    }

    fFillPage(page, dct);

    page.classList.remove("d-none");
}


function fFillPage(page, dct) {

    page
        .querySelectorAll("[data-field]")
        .forEach(function(element) {

            const sField = element.dataset.field;

            if (!(sField in dct)) {
                return;
            }

            const value = dct[sField];

            if (element.type === "checkbox") {
                element.checked = value === true;
                return;
            }

            if (element.tagName === "SELECT") {
                element.value = value ?? "";
                return;
            }

            element.value = value ?? "";
        });


    page
        .querySelectorAll("[data-text]")
        .forEach(function(element) {

            const sField = element.dataset.text;

            if (!(sField in dct)) {
                return;
            }

            element.textContent = dct[sField] ?? "";
        });
}

async function fFillSelect(sSelectId, dctValues, sPlaceholder, sSelectedValue = "") {

    const select = document.getElementById(sSelectId);

    select.innerHTML = "";

    const emptyOption = document.createElement("option");
        emptyOption.value = "";
        emptyOption.textContent = sPlaceholder || "-- vyberte --";
    select.appendChild(emptyOption);


    Object.entries(dctValues).forEach(function([k, v]) {
        const option = document.createElement("option");
        option.value = k;
        option.textContent = v;

        if (k === sSelectedValue || v === sSelectedValue) {
            option.selected = true;
        }

        select.appendChild(option);
    });
}


async function fFillAllSelects(employeeData) {

    await fFillSelect(
        "department",
        "departments",
        employeeData.department || ""
    );

    await fFillSelect(
        "pos",
        "positions",
        employeeData.pos || ""
    );

    await fFillSelect(
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
