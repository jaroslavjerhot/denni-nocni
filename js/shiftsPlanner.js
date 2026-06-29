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
    
    appHtml.prevPage = appHtml.activePage;
    appHtml.activePage = "shiftsPlanner";


    appHtml.dctRequestOpts = fLstToDct(lstRequestOptionsDay, 0, ['code', 'description', 'classNormal', 'classHover', 'rate']);    
    // console.log("fShowShiftsPlannerPage - appHtml.dctRequestOpts:", appHtml.dctRequestOpts);

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
    
    appFormValues.usersRequests = await fGetAllUsersRequests(monthSelect.value);
    //console.log("fShowShiftsPlannerPage - appFormValues:", appFormValues);
    

    await fBuildShiftsPlanner(monthSelect.value);
}

async function fGetAllUsersRequests(sMonth) {
    let dctUsersRequests = {}
    // reads all userRequestsfor specified  as they are    
    await Promise.all(Object.entries(appHtml.dctEmployees).map(async function([code, dctEmployee]) {
        const sDocumentId = sMonth + "_" + code;
        //console.log(sDocumentId);
        const userRequests = await fGetDctFromDoc('userRequests', sDocumentId);
        const bIsPublished = userRequests?.published ?? false;
        if (bIsPublished) {
            //console.log(userRequests);
            dctUsersRequests[sDocumentId] = {...userRequests};
        }
    }))

    // conversion to array of objects with code and data like {'01-d': {'00022':'cnt', '00023':'cnt'}, 
    //console.log("fGetAllUsersRequests - dctUsersRequests:", dctUsersRequests);
    let dctOut = {}
    dctOut[sMonth] = {}
    //console.log("fGetAllUsersRequests - dctOut:", dctOut);
    for (const [keyEmpl, dctEmpl] of Object.entries(dctUsersRequests)) {
        //console.log("fGetAllUsersRequests - code:", keyEmpl, "dct:", dctEmpl);
        const sEmployeeCode = keyEmpl.split("_")[1];

        //dctOut[sEmployeeCode] = {};
        Object.entries(dctEmpl).forEach(function([keyShift, value2]) {
            //console.log("fGetAllUsersRequests - key2:", keyShift, "value2:", value2);
            if (keyShift.slice(0,7) === sMonth) {
                const sShiftCode = keyShift.slice(8);
                if (dctOut[sMonth][sShiftCode] === undefined) {
                    dctOut[sMonth][sShiftCode] = {};
                }
                dctOut[sMonth][sShiftCode][sEmployeeCode] = value2;
            }
        })
    }
    //console.log("fGetAllUsersRequests - dctOut:", dctOut);
    return dctOut;
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

    const sField = `${sDateKey}-${sShiftCode}_${sSpotCode}`;

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
    const sElementId = element.dataset.id
    // console.log("fPickCrewMember - sId:", sId, "element:", element);
   // console.log("fPickCrewMember - appHtml", appHtml);
    //console.log("fPickCrewMember - appFormValues:", appFormValues);
    const sActiveMonth = appFormValues.shiftsPlanner.activeMonth;
    const sPrevMonth = fMoveDate(sActiveMonth+'-01', -1).slice(0, 7);
    //console.log("fPickCrewMember - sActiveMonth:", sActiveMonth, "sPrevMonth:", sPrevMonth);
    const sCurrentShiftId = sActiveMonth + "-" + sElementId.split("_")[0];
    const sCurrentDate = sCurrentShiftId.slice(0, 10);
    const sCurrentDayNight = sCurrentShiftId.slice(-1);
    //console.log("fPickCrewMember - sCurrentShiftId:", sCurrentShiftId, "sCurrentDate:", sCurrentDate, "sCurrentDayNight:", sCurrentDayNight);
    
    // get prev, current and next shift ids for the same date and spot
    let sPrevShiftId, sNextShiftId;
    if (sCurrentDayNight === "d") {
        sPrevShiftId = fMoveDate(sCurrentDate, -1) + "-n";
        sNextShiftId = sCurrentShiftId.replace('-d', '-n');
    } else if (sCurrentDayNight === "n") {
        sPrevShiftId = sCurrentShiftId.replace('-n', '-d');
        sNextShiftId = fMoveDate(sCurrentDate, 1) + "-d";
    }
    //console.log("fPickCrewMember - sCurrentShiftId:", sCurrentShiftId, "sPrevShiftId:", sPrevShiftId, "sNextShiftId:", sNextShiftId);
    
    // get all filled employees for the prev, current and next shift
    let dctFilledEmployees = {};
    dctFilledEmployees = {
        ...fGetFilledEmployeesForShift(sPrevShiftId, 'prev'),
        ...fGetFilledEmployeesForShift(sCurrentShiftId, 'current'),
        ...fGetFilledEmployeesForShift(sNextShiftId, 'next'),
    };
    //console.log("fPickCrewMember - dctFilledEmployees:", dctFilledEmployees);
    // adds rating to each employee
    let dctEmployeeRated = {};
    const sDayShiftId = sElementId.split("_")[0];
    Object.entries(appHtml.dctEmployees).forEach(([sEmplId, dctEmpl]) => {
        dctEmployeeRated[sEmplId] = {'code': sEmplId, 'name': dctEmpl.description, 'classNormal': '', 'classHover': '', 'rate': 0};
        // console.log("fPickCrewMember - sEmplId:", sEmplId, "dctEmpl:", dctEmpl);
        // console.log("fPickCrewMember - dctEmployeeRated[sEmplId]:", dctEmployeeRated[sEmplId]);
        
        //const sFilled = fGetDctValueByKey(dctFilledEmployees[sId], code);
        const dctFilled = fGetDctValueByKey(dctFilledEmployees, sDayShiftId, {});
        const sFilled = fGetDctValueByKey(dctFilled, sEmplId, '');
        if (sFilled) {
            dctEmployeeRated[sEmplId].rate += (-1000);
            return;
        }
        const dctShiftRequests = fGetDctValueByKey(appFormValues.usersRequests[sActiveMonth], sDayShiftId, {});
        const sEmplRequest = fGetDctValueByKey(dctShiftRequests, sEmplId, '');
        // console.log("fPickCrewMember - appFormValues.usersRequests[sActiveMonth]:", appFormValues.usersRequests[sActiveMonth]);
        // console.log("fPickCrewMember - sDayShiftId:", sDayShiftId, "dctRequest:", dctRequest);
        // console.log("fPickCrewMember - code:", code, "sFilled:", sFilled, "dctRequest:", dctRequest);
        if (sEmplRequest) {
            //const sEmplRequest = fGetDctValueByKey(dctEmplRequest, sEmplId, '');
            console.log("fPickCrewMember - sEmplId:", sEmplId, "sEmplRequest:", sEmplRequest)
            //const sRequestRate = fGetDctValueByKey(appHtml.dctRequestOpts[sEmplRequest], 'rate', 0);
            
            dctEmployeeRated[sEmplId] = {...dctEmployeeRated[sEmplId], ...{'request': sEmplRequest}, 
             ...appHtml.dctRequestOpts[sEmplRequest]};
        }
    });

    
    console.log("fPickCrewMember - dctEmployeeRated:", dctEmployeeRated);

    //console.log("fPickCrewMember - dctFilledEmployees:", dctFilledEmployees);
    //console.log("fPickCrewMember - appUser", appUser);
    
    // let lstNonAvailableEmployees = fGetNonAvailableEmployeesForShift(sCurrentShiftId, dctFilledEmployees);

    // const lstAvailableEmployees = 
    //     fFilterFilledEmployees([...appHtml.optEmployees], dctFilledEmployees);

    //console.log("fPickCrewMember - lstAvailableEmployees:", lstAvailableEmployees);

    appFormValues.shiftsPlanner[sActiveMonth][sId] = 
        await fPickSelection(element, "Pracovníci na směně", appHtml.optEmployees, 
            appFormValues.shiftsPlanner[sActiveMonth][sId], 1);
    //console.log("Vybraná pracoviště:", appFormValues.userProfile.spots);
}
window.fPickCrewMember = fPickCrewMember;

// gets all filled empolyees for given shift (key starts by shift_)
function fGetFilledEmployeesForShift(sShiftKey, sDescr) {
    const dctFilled = {};
    const sMonth = sShiftKey.slice(0, 7);
    // remove the month and underscore from the shift key to get the rest of the key
    sShiftKey = sShiftKey.slice(8);
    const dctShiftsPlanned = fGetDctValueByKey(appFormValues.shiftsPlanner, sMonth, {});
    //console.log("fGetFilledEmployeesForShift - sShiftKey:", sShiftKey, "sDescr:", sDescr, "dctShiftsPlanned:", dctShiftsPlanned);
    for (const [key, value] of Object.entries(dctShiftsPlanned)) {
        if (key.startsWith(sShiftKey)) {
            dctFilled[sShiftKey] = {};
            dctFilled[sShiftKey][value] = 'filled in: ' + sDescr;
            
        }
    }
    return dctFilled;
}

function fEmplForShiftByRequestsmaz(sShiftKey, lstRequestCodes) {
    const lstNonAvailable = [];
    const sMonth = sShiftKey.slice(0, 7);
    sShiftKey = sShiftKey.slice(8);
    Object.entries(appFormValues.usersRequests[sMonth][sShiftKey] ?? {}).forEach(function([sEmplKey, sReqValue]) {
        if (lstRequestCodes.includes(sReqValue)) {
            lstNonAvailable.push({sEmplKey: sReqValue});
        }
    });
    //console.log("fEmplForShiftByRequest - lstNonAvailable:", lstNonAvailable);
    return lstNonAvailable;
}

// removes items from list where the value[0] is in lstFilled
function fFilterFilledEmployees(lstSource,lstRemove) {

    const setRemove = new Set(
        lstRemove.map(row => row[0])   // code
    );
    //console.log("fFilterFilledEmployees - setRemove:", setRemove);
    return lstSource.filter(
        row => !setRemove.has(row[0])
    );
}