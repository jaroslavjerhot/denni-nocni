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


const maxRequests = 10;

const lstRequestOptionsDay = [
    ["", "Bez požadavku"],
    ["wnt", "chci", "btn btn-green-lighter w-100 mb-1", "btn btn-green-darker w-100 mb-1", ],
    ["cnt", "nemohu", "btn btn-red-lighter w-100 mb-1", "btn btn-red-darker w-100 mb-1"],
    ["hld", "dovol", "btn btn-yellow-lighter w-100 mb-1", "btn btn-yellow-darker w-100 mb-1"],
    ["sck", "nem/očr", "btn btn-blue2-lighter w-100 mb-1", "btn btn-blue2-darker w-100 mb-1"],
  ];

const lstRequestOptionsNight = [
    ["", "Noční"],
    ["wnt", "N:chci", "btn btn-green-lighter w-100 mb-1", "btn btn-green-darker w-100 mb-1"],
    ["cnt", "N:nemohu", "btn btn-red-lighter w-100 mb-1", "btn btn-red-darker w-100 mb-1"],
];

appHtml.optRequests = lstRequestOptionsDay;


//document.getElementById("requestMonth").addEventListener("change", fRenderCalendar);


function fGetMonthAhead(iDays=0) {
    const dt = new Date();
    // today + iDays
    if (iDays===0) {
        iDays = new Date(dt.getFullYear(), dt.getMonth() + 1, 0).getDate();
    }
    dt.setDate(dt.getDate() + iDays);
    
    return dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, "0");
}

async function fShowUserRequestsPage(dctEditedUser) {
    appHtml.titUser = dctEditedUser.description;
    appHtml.titPage = "Požadavky na směny";
    appFormValues.userRequests = {}
    
    console.log("fShowUserRequestsPage - dctEditedUser:", dctEditedUser);
    await fShowPage("userRequests", {...dctEditedUser, ...appHtml});
    const pageRequests = document.getElementById("pageRequests");
    const monthSelect = document.getElementById("requestMonth");

    monthSelect.value = fGetMonthAhead();

    fRenderRequestsCalendar();
}
window.fShowUserRequestsPage = fShowUserRequestsPage;


function fRenderRequestsCalendar() {
    const monthSelect = document.getElementById("requestMonth");
    const calendarBody = document.getElementById("calendarBody");
    
    const year = monthSelect.value.split("-")[0];
    const month = Number(monthSelect.value.split("-")[1]);
    

    const firstDate = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();

    let firstWeekday = firstDate.getDay();

    if (firstWeekday === 0) {
        firstWeekday = 7;
    }

    calendarBody.innerHTML = "";

    //alert("fGetMonthAhead: " + fGetMonthAhead(20));
    
    let day = 1;

    for (let week = 0; week < 6; week++) {
        const tr = document.createElement("tr");
// ctreates 7 days in week on top of calendar
        for (let weekday = 1; weekday <= 7; weekday++) {
            const td = document.createElement("td");

            if ((week === 0 && weekday < firstWeekday) || day > daysInMonth) {
                td.className = "requests-calendar-day empty-day";
                tr.appendChild(td);
                continue;
            }

            const date = new Date(year, month - 1, day);

            td.className = "requests-calendar-day";

            if (isWeekend(date)) {
                td.classList.add("weekend-day");
            }

            if (isCzechHoliday(date)) {
                td.classList.add("holiday-day");
            }

            td.innerHTML = createRequestHtml(year, month, day);

            tr.appendChild(td);
            day++;
        }

        calendarBody.appendChild(tr);

        if (day > daysInMonth) {
            break;
        }
    }

    updateCounter();

    document
        .querySelectorAll(".request-select")
        .forEach(select => {
            select.addEventListener("change", updateCounter);
            select.addEventListener("change", () => fChangeRequestColor(select));
        });
}

function fChangeRequestColorsmaz(select) {

    Array.from(select.classList)
        .filter(c => c.startsWith("sel-shift-"))
        .forEach(c =>
            select.classList.remove(c)
        );
    
        select.classList.add("sel-shift-" + select.value);
}

window.fRenderRequestsCalendar = fRenderRequestsCalendar;


function createRequestHtml(year, month, day) {
    const dateText =
        year + "-" +
        String(month).padStart(2, "0") + "-" +
        String(day).padStart(2, "0");

    const dayInWeekCz = ["Ne", "Po", "Út", "St", "Čt", "Pá", "So", ][new Date(year, month - 1, day).getDay()];    
    // return `
    //     <div class="day-number">${dayInWeekCz} ${day}. ${month}.</div>

        
    //     <select
    //         class="form-select form-select-sm request-select mb-2"
    //         id="requestType"
    //         data-shift="${dateText}-d">
    //         ${createOptionsHtml('d')}
    //     </select>

        
    //     <select
    //         class="form-select form-select-sm request-select mb-3"
    //         id="requestType"
    //         data-shift="${dateText}-n">
    //         ${createOptionsHtml('n')}
    //     </select>
    // `;
    const sDate = `${dayInWeekCz} ${day}. ${month}.`;
    return `
        <div class="day-number">${sDate}</div>

        <input id="${dateText}-d" class="form-control shift-input" readonly 
            data-value="${dateText}-d" data-action="fPickShift"
            data-shift="${dateText}-d" data-descr="${sDate} - denní">
        
            <input id="${dateText}-n" class="form-control shift-input" readonly 
            data-value="${dateText}-n" data-action="fPickShift" 
            data-shift="${dateText}-n" data-descr="${sDate} - noční">       
    `;
}
window.createRequestHtml = createRequestHtml;

function createOptionsHtml(sDayNight){
    let lstRequestOptions = sDayNight=='d' ? lstRequestOptionsDay : lstRequestOptionsNight;
    
    return lstRequestOptions
        .map(item => `<option value="${item[0]}">${item[1]}</option>`)
        .join("");
}
window.createOptionsHtml = createOptionsHtml;

function updateCounter() {
    const count = getSelectedRequests().length;

    requestCounter.innerHTML =
        `Počet zadaných požadavků: <strong>${count}</strong> z ${maxRequests}`;

    if (count > maxRequests) {
        requestCounter.className = "text-danger text-center mb-3";
    } else {
        requestCounter.className = "text-success text-center mb-3 c-blue-darker";
    }
}
window.updateCounter = updateCounter;

function getSelectedRequests() {
    return Array.from(document.querySelectorAll(".request-select"))
        .filter(select => select.value !== "")
        .map(select => ({
            date: select.dataset.date,
            shift: select.dataset.shift,
            request: select.value
        }));
}
window.getSelectedRequests = getSelectedRequests;

async function fSaveRequests() {
    const requests = getSelectedRequests();

    if (requests.length > maxRequests) {
        showError("Maximum number of requests is " + maxRequests);
        return;
    }

    try {
        const result = await callApi("saveRequests", {
            year: Number(yearSelect.value),
            month: Number(monthSelect.value),
            requests: requests
        });

        if (!result.ok) {
            showError(result.error);
            return;
        }

        msg.className = "text-success text-center mt-3 c-blue-darker";
        msg.innerText = "Požadavky uloženy";

    } catch (err) {
        showError(err.message);
    }
}
window.fSaveRequests = fSaveRequests;

function showErrorxx(text) {
    msg.className = "text-danger text-center mt-3";
    msg.innerText = text;
}

function isWeekend(date) {
    const d = date.getDay();
    return d === 0 || d === 6;
}
window.isWeekend = isWeekend;

function isCzechHoliday(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    const fixedHolidays = [
        "1-1",
        "5-1",
        "5-8",
        "7-5",
        "7-6",
        "9-28",
        "10-28",
        "11-17",
        "12-24",
        "12-25",
        "12-26"
    ];

    if (fixedHolidays.includes(month + "-" + day)) {
        return true;
    }
    

    const easter = getEasterSunday(year);

    const goodFriday = addDays(easter, -2);
    const easterMonday = addDays(easter, 1);

    return sameDate(date, goodFriday) || sameDate(date, easterMonday);
}
window.isCzechHoliday = isCzechHoliday;

function getEasterSunday(year) {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;

    return new Date(year, month - 1, day);
}
window.getEasterSunday = getEasterSunday;

function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}
window.addDays = addDays;

function sameDate(a, b) {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}
window.sameDate = sameDate;

async function fPickShift(element) {
    //if (!appFormValues.userProfile.deputies){ appFormValues.userProfile.deputies = []; }
    const shiftId = element.dataset.shift;
    const sDayNight = shiftId.slice(-1).toUpperCase();
    const shiftDescription = element.dataset.descr;
    const requestValue = fGetDctValueByKey(appFormValues.userRequests, shiftId, '');
    appFormValues.userRequests[shiftId] = 
        await fPickSelection(element, shiftDescription, 
            appHtml.optRequests, requestValue, 1);
    // if Bez požadavku is selected, set the value to empty string
    appFormValues.userRequests[shiftId] = appFormValues.userRequests[shiftId][0]
    console.log("fPickShift - appFormValues.userRequests:", appFormValues.userRequests);
    
    // if no requests sets field to empty string, otherwise sets it to sDayNight + ":" + value
    if (appFormValues.userRequests[shiftId] === '') {
        element.value = "";
    } else {
        element.value = sDayNight + ":" + element.value;
    }

    // nastavi barvu pole podle treti hodnoty v optRequests pro dany shift
    let sElementColorClass = fGetNthCol(lstRequestOptionsDay, [appFormValues.userRequests[shiftId]], 2);
    sElementColorClass = sElementColorClass.split(" ")[1]; // get first class if there are multiple classes
    console.log("Orig sElementColorClass:", element.classList);
    //console.log("New sElementColorClass:", sElementColorClass);
    const classArray = Array.from(element.classList);
    if (classArray.length === 3){element.classList.remove(classArray[2]);}
    if (sElementColorClass) {element.classList.add(sElementColorClass);}
    console.log("New sElementColorClass:", element.classList);
    //console.log(`appFormValues.userRequests[${shiftId}]:`, appFormValues.userRequests[shiftId], document.getElementById(shiftId).value);
}
window.fPickShift = fPickShift;