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

export async function fShowShiftsPlannerPage() {
    appHtml.titUser = appUser.current.description;
    appHtml.titPage = "Plánovač směn";
    appFormValues.userRequests = {};

    appHtml.prevPage = appHtml.activePage;
    appHtml.activePage = "shiftsPlanner";

    //await fAddDctLstAndStrToDctFromCollection("spots", appHtml.dctSpots, appUser.current);
    
    appHtml.dctSpots = await fGetVDctFromCollection("spots");
    // get employees without this employee to avoid showing the employee itself in favorites, unfavorites and deputies selection
    // appHtml.dctEmployees = await fGetVDctFromCollection("employees");
    await fAddDctLstAndStrToDctFromCollection("employees", appHtml.dctEmployees, appUser.current);

    // console.log("fShowShiftsPlannerPage - appUser:", appUser);
    //console.log("fShowShiftsPlannerPage - appHtml:", appHtml);
    
    //console.log("fShowShiftsPlannerPage:");
    await fShowPage("shiftsPlanner", {...appHtml});
    //const pageRequests = document.getElementById("pageRequests");
    const monthSelect = document.getElementById("plannerMonth");
    

    monthSelect.value = fGetMonthAhead();
    appFormValues.shiftsPlanner = {'activeMonth': monthSelect.value};
    appFormValues.shiftsPlanner[monthSelect.value] = {};
    

    await fBuildShiftsPlanner(monthSelect.value);
}


async function fPlannerMonthChanged(element) {

    await fBuildShiftsPlanner(element.value);
}


async function fBuildShiftsPlanner(sMonth) {
    //console.log("fBuildShiftsPlanner - sMonth:", sMonth);
    const container = document.getElementById("shiftsPlannerContainer");

    //const lstSpots = appHtml.optSpots;
    //console.log("fBuildShiftsPlanner - lstSpots:", lstSpots);
    container.innerHTML = fCreatePlannerTableHtml(sMonth, appHtml.dctSpots);
}


async function fGetActiveSpotsForDepartmentsmaz() {

    const qSpots = query(
        collection(db, "spots"),
        where("active", "==", true),
        where("department", "==", appState.dctEmpl.department),
        orderBy("sortOrder")
    );

    const snapshot = await getDocs(qSpots);

    const lst = [];

    snapshot.forEach(function(docSnap) {
        lst.push({
            code: docSnap.id,
            ...docSnap.data()
        });
    });

    return lst;
}


function fCreatePlannerTableHtml(sMonth, dctSpots) {

    const lstDays = fGetMonthDays(sMonth);
    //console.log("fCreatePlannerTableHtml - lstDays:", lstDays);

    return `
        <table id="shiftsPlannerTable" class="table table-bordered table-sm align-middle planner-table">


            <tbody>
                ${lstDays.map(day => fCreatePlannerDayRows(day, dctSpots)).join("")}
            </tbody>

        </table>
    `;
}


function fCreatePlannerDayRows(day, dctSpots) {

    return `
        ${fCreatePlannerShiftRow(day, "d", "Denní", dctSpots)}
        ${fCreatePlannerShiftRow(day, "n", "Noční", dctSpots)}
    `;
}


function fCreatePlannerShiftRow(day, sShiftCode, sShiftCaption, dctSpots) {

    //console.log("fCreatePlannerShiftRow - day:", day, "sShiftCode:", sShiftCode, "sShiftCaption:", sShiftCaption, "dctSpots:", dctSpots);
    const sDateKey = fFormatDateKey(day.date);
    const sTdClass = fGetDayCssClass(day.date);
    //console.log("fCreatePlannerShiftRow - sDateKey:", sDateKey, "sTdClass:", sTdClass);
    //console.log("fCreatePlannerShiftRow - sDateKey:", sDateKey, "sTdClass:", sTdClass);
    //console.log("fCreatePlannerShiftRow - dctSpots:", dctSpots);
    const lstParams = Object.entries(dctSpots).map(([key, spot]) => 
        fCreatePlannerCell(
                spot,
                day,
                key,
                sShiftCode,
                sDateKey
            ))

    //console.log("fCreatePlannerShiftRow - lstParams:", lstParams);

    const sDateCaption = sShiftCode === "d" ? `${day.weekDay} ${day.day}.${day.month}, t:${day.weekNumber}` : "";

    return `
        <tr class="planner-row ${sTdClass}">

            <td class="planner-date-cell align-top ${sTdClass}">
                <div class="small">
                    ${sDateCaption}
                </div>

                

                <div class="fw-bold">
                    ${sShiftCaption}
                </div>
            </td>

            ${Object.entries(dctSpots).map(([key, spot]) => fCreatePlannerCell(
                spot, day, key, sShiftCode, sDateKey, sTdClass
            )).join("")}

        </tr>
    `;
}


function fCreatePlannerCell(spot, day, sSpotCode, sShiftCode, sDateKey, sTdClass) {

    //console.log("fCreatePlannerCell - day:", day, "sSpotCode:", sSpotCode, "sShiftCode:", sShiftCode, "sDateKey:", sDateKey);
    const sWorkField = fGetSpotWorkField(day.date, sShiftCode.toUpperCase());
    //console.log("fCreatePlannerCell - sWorkField:", sWorkField);
    //console.log("fCreatePlannerCell - spot:", spot);
    const sWorkValue = spot[sWorkField] ?? "";

    const htmlSpotDescription = spot.description && sShiftCode==='d' ? `<div class="planner-spot-caption small text-center">${fEscapeHtml(spot.description)}</div>` : "";
    
    if (!sWorkValue) {
        return `
        <td class="planner-input-cell align-top ${sTdClass}">
            <div class="d-flex flex-column gap-1">
                ${htmlSpotDescription}
                <input
                    type="text"
                    class="form-control form-control-sm planner-textarea"
                    readonly value="Zavřeno"
                >
                </div>
        </td>`;
    }

    const sField = `${sDateKey}_${sShiftCode}_${sSpotCode}`;

    //console.log("fCreatePlannerCell - sField: " + sField + ", sWorkValue: " + sWorkValue);
    
    const iCrew = spot.crew ?? 1;

    // create iCrew times input fields for each crew member, with data attributes for date, shift and spot
    const lstInputs = [];
    for (let i = 0; i < iCrew; i++) {
        const innerHtml = `
            <input
                type="text"
                id = "${fEscapeHtml(sField)}_${(i+1).toString().padStart(2, "0")}"
                class="form-control form-control-sm planner-textarea"
                data-id="${fEscapeHtml(sField)}_${(i+1).toString().padStart(2, "0")}"
                data-action="fPickCrewMember"
                data-dirty
                readonly
                >
        `;
        lstInputs.push(innerHtml);
        //console.log("fCreatePlannerCell - sCrewField:", sCrewField);
    }

    return `
        <td class="planner-input-cell align-top ${sTdClass}">
            <div class="d-flex flex-column gap-1">
                ${htmlSpotDescription}
                ${lstInputs.join("")}
            </div>
        </td>
    `;
}



function fGetSpotWorkField(date, sShiftCode) {
    return `${fGetEng3Weekday(date)}_${sShiftCode}`;
}


function fGetMonthDays(sMonth) {

    const [year, month] = sMonth
        .split("-")
        .map(Number);

    const lastDay = new Date(year, month, 0).getDate();

    const lst = [];

    for (let iDay = 1; iDay <= lastDay; iDay++) {

        const date = new Date(year, month - 1, iDay);
        const dayInWeekCz = ["Ne", "Po", "Út", "St", "Čt", "Pá", "So", ][date.getDay()];    
    

        lst.push({
            date: date,
            day: iDay,
            month: month,
            year: year,
            weekDay: dayInWeekCz,
            weekNumber: fGetIsoWeekNumber(date)
        });
    }

    return lst;
}


function fGetIsoWeekNumber(date) {

    const dt = new Date(
        Date.UTC(
            date.getFullYear(),
            date.getMonth(),
            date.getDate()
        )
    );

    const dayNum = dt.getUTCDay() || 7;

    dt.setUTCDate(
        dt.getUTCDate() + 4 - dayNum
    );

    const yearStart = new Date(
        Date.UTC(dt.getUTCFullYear(), 0, 1)
    );

    return Math.ceil(
        (((dt - yearStart) / 86400000) + 1) / 7
    );
}


function fGetDayCssClass(date) {

    const day = date.getDay();
    //console.log("fGetDayCssClass - date:", date, "day:", day);

    if (fIsCzechHoliday(date)) {
        return "holiday-day";
    }

    if (fIsWeekend(date)) {
        return "weekend-day";
    }

    return "";
}


function fFormatDateKey(date) {

    return String(date.getDate()).padStart(2, "0");
}




window.fShowShiftsPlannerPage = fShowShiftsPlannerPage;
window.fPlannerMonthChanged = fPlannerMonthChanged;

async function fPickCrewMember(element) {
    const sId = element.dataset.id
    // console.log("fPickCrewMember - sId:", sId, "element:", element);
    // console.log("fPickCrewMember - appHtml.optEmployees:", appHtml.optEmployees);
    console.log("fPickCrewMember - appFormValues:", appFormValues);
    const sActiveMonth = appFormValues.shiftsPlanner.activeMonth;
    const lstFilledEmployees = fGetFilledEmployeesForDay(sId.split("_")[0]);
    console.log("fPickCrewMember - lstFilledEmployees:", lstFilledEmployees);


    const lstAvailableEmployees = 
        fFilterFilledEmployees([...appHtml.optEmployees], lstFilledEmployees);

    appFormValues.shiftsPlanner[sActiveMonth][sId] = 
        await fPickSelection(element, "Pracovníci na směne", lstAvailableEmployees, 
            appFormValues.shiftsPlanner[sActiveMonth][sId], 1);
    //console.log("Vybraná pracoviště:", appFormValues.userProfile.spots);
}
window.fPickCrewMember = fPickCrewMember;

// gets all filled empolyees for given day (key starts by day_)
function fGetFilledEmployeesForDay(sDateKey) {
    const lstFilled = [];
    const sActiveMonth = appFormValues.shiftsPlanner.activeMonth;
    for (const [key, value] of Object.entries(appFormValues.shiftsPlanner[sActiveMonth] || {})) {
        if (key.startsWith(sDateKey)) {
            lstFilled.push(value);
        }
    }
    return lstFilled;
}

// removes items from list where the value[0] is in lstFilled
function fFilterFilledEmployees(lstEmployees, lstFilled) {
    lstEmployees.forEach(emp => {
        if (lstFilled.includes(emp[0])) {
            lstEmployees.splice(lstEmployees.indexOf(emp), 1);
        }
    });
    return lstEmployees;
}