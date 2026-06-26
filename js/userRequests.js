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




async function fShowUserRequestsPage(dctEditedUser, dctUserRequests = {}) {
    appHtml.titUser = dctEditedUser.description;
    appHtml.titPage = "Požadavky na směny";
    appFormValues.userRequests = {...dctUserRequests};

    appHtml.prevPage = appHtml.activePage;
    appHtml.activePage = "userRequests";

    
    //console.log("fShowUserRequestsPage - dctEditedUser:", dctEditedUser);
    await fShowPage("userRequests", {...dctEditedUser, ...appHtml});
    const pageRequests = document.getElementById("pageRequests");
    const monthSelect = document.getElementById("requestMonth");

    monthSelect.value = fGetMonthAhead();


    await fRenderRequestsCalendar(appFormValues.userRequests);
}
window.fShowUserRequestsPage = fShowUserRequestsPage;


async function fRenderRequestsCalendar(dctUserRequests) {
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
// creates weekNum + 7 days in week on top of calendar
        for (let weekday = 0; weekday <= 7; weekday++) {
            const td = document.createElement("td");
            const weekNum = fGetNumberOfWeek(new Date(year, month - 1, day));
            // sets week number in first column of calendar, and skips to next iteration of loop
            if (weekday === 0) {
                td.innerText = weekNum;
                td.classList = "requests-calendar-weeknum";
                tr.appendChild(td);
                continue;
                
            }
            // sets empty cells for days before the first day of the month and after the last day of the month
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

            td.innerHTML = fCreateDayForRequestsInput(year, month, day);
            // set value of inputs from dctUserRequests if they exist, otherwise set to empty string
            // const dayInputId = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            // const dayInputD = td.querySelector(`#${dayInputId}-d`);
            // const dayInputN = td.querySelector(`#${dayInputId}-n`);
            // console.log("dayInputD", dayInputD, "dayInputN", dayInputN);

            tr.appendChild(td);
            day++;
        }

        calendarBody.appendChild(tr);

        if (day > daysInMonth) {
            break;
        }
    }

    // fill values from dctUserRequests into inputs
    for (const key in dctUserRequests) {
        const input = document.getElementById(key);
    
        if (input) {
            //const sDayNight = key.slice(-1).toUpperCase();
            //console.log("fRenderRequestsCalendar - key:", key, "sDayNight:", sDayNight, "value:", dctUserRequests[key]);
            const sShiftValue = fGetNthCol(lstRequestOptionsDay, [dctUserRequests[key]], 1);
            //console.log("fRenderRequestsCalendar - sShiftValue:", sShiftValue);
            input.value = sShiftValue;
            await fPickShift(input, false);
        }
    }

    
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


function fCreateDayForRequestsInput(year, month, day) {
    //console.log("appFormValues.userRequests:", appFormValues.userRequests)
    const dateText =
        year + "-" +
        String(month).padStart(2, "0") + "-" +
        String(day).padStart(2, "0");

    const dayInWeekCz = ["Ne", "Po", "Út", "St", "Čt", "Pá", "So", ][new Date(year, month - 1, day).getDay()];    
    
    const sDate = `${dayInWeekCz} ${day}.${month}`;

    // sets value of inputs from appFormValues.userRequests if they exist, otherwise set to empty string
    const sDayShiftValue = fGetDctValueByKey(appFormValues.userRequests, dateText + "-d", '');
    const sNightShiftValue = fGetDctValueByKey(appFormValues.userRequests, dateText + "-n", '');

    // // sets color class of inputs from lstRequestOptionsDay and lstRequestOptionsNight if they exist, otherwise set to empty string
    // const sDayColorClass = fGetNthCol(lstRequestOptionsDay, sDayShiftValue, 2);
    // const sNightColorClass = fGetNthCol(lstRequestOptionsNight, sNightShiftValue, 2);
    
    const sDayText = (sDayShiftValue) ? 'D:' + fGetNthCol(lstRequestOptionsDay, [sDayShiftValue], 1) : '';
    const sNightText = (sNightShiftValue) ? 'N:' + fGetNthCol(lstRequestOptionsNight, [sNightShiftValue], 1) : '';
   

    return `
        <div class="day-number">${sDate}</div>

        <input data-dirty id="${dateText}-d" class="form-control shift-input" readonly 
            data-value="${dateText}-d" data-action="fPickShift"
            data-shift="${dateText}-d" data-descr="${sDate} - denní">
        
        <input data-dirty id="${dateText}-n" class="form-control shift-input" readonly         
            data-value="${dateText}-n" data-action="fPickShift" 
            data-shift="${dateText}-n" data-descr="${sDate} - noční">       
    `;
}
window.fCreateDayForRequestsInput = fCreateDayForRequestsInput;

function createOptionsHtml(sDayNight){
    let lstRequestOptions = sDayNight=='d' ? lstRequestOptionsDay : lstRequestOptionsNight;
    
    return lstRequestOptions
        .map(item => `<option value="${item[0]}">${item[1]}</option>`)
        .join("");
}
window.createOptionsHtml = createOptionsHtml;

function fUpdateCounter(lstRequestOptions=null) {
    // counts in appFormValues.userRequests the number of values that are not empty string and updates the counter in requestCounter element
    let iCount = 0;
    for (const key in appFormValues.userRequests) {
        if ((lstRequestOptions ? 
            lstRequestOptions.includes(appFormValues.userRequests[key]) : 
            appFormValues.userRequests[key] !== '')) {
            iCount++;
        }
    }
    appFormValues.userRequests.iRequests = iCount;
    
    //console.log("fUpdateCounter - count:", iCount);
    requestCounter.innerHTML =
        `Počet zadaných požadavků: <strong>${iCount}</strong> z ${maxRequests}`;

    if (iCount > maxRequests) {
        requestCounter.className = "text-danger text-center mb-3";
    } else {
        requestCounter.className = "text-success text-center mb-3 c-blue-darker";
    }
}
window.fUpdateCounter = fUpdateCounter;

function getSelectedRequests(lstRequestOptions=null) {
    return Array.from(document.querySelectorAll(".request-select"))
        .filter(select => 
            (lstRequestOptions ? lstRequestOptions.includes(select.value) : select.value !== ""))
        .map(select => ({
            date: select.dataset.date,
            shift: select.dataset.shift,
            request: select.value
        }));
}
window.getSelectedRequests = getSelectedRequests;



async function fSaveUserRequests() {
    //console.log("fSaveUserRequests - appFormValues.userRequests:", appFormValues.userRequests);
    
    // remove from appFormValues.userRequests all keys with empty string values
    for (const key in appFormValues.userRequests) {
        if (appFormValues.userRequests[key] === '') {
            delete appFormValues.userRequests[key];
        }
    }

    // checks if there are any requests in appFormValues.userRequests, if not shows error message and returns
    if (appFormValues.userRequests.iRequests === 0) {
        await fShowMsg("err", "Nezadali jste žádné požadavky. Vyberte alespoň jeden požadavek.");
        return;
    }

    // checks if there are more than maxRequests in appFormValues.userRequests, if so shows error message and returns
    if (appFormValues.userRequests.iRequests > maxRequests) {
        console.log("fSaveUserRequests - appFormValues.userRequests:", appFormValues.userRequests);
        await fShowMsg("err", "Překročil jste maximální počet požadavků. Maximální počet je " + maxRequests);
        return;
    }

    // sets bPublish to true if the user clicked to button with data-publish="true", otherwise sets to false
    const bPublish = event.target.dataset.publish === "true";
        
    try {        
        await fSaveDctToCollection("userRequests", null, appFormValues.userRequests, null, bPublish, false);

    } catch (err) {
        await fShowMsg("err", err.code + '\n' + err.message);
    }
    await fGoToPage();
}
window.fSaveUserRequests = fSaveUserRequests;


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

async function fPickShift(element, bOpenSelect=true) {
    //if (!appFormValues.userProfile.deputies){ appFormValues.userProfile.deputies = []; }
    const shiftId = element.dataset.shift;
    appFormValues.userRequests.code = shiftId.substring(0, 7) + "_" + appUser.edited.code;
    
    const sDayNight = shiftId.slice(-1).toUpperCase();
    const shiftDescription = element.dataset.descr;
    const requestValue = fGetDctValueByKey(appFormValues.userRequests, shiftId, '');
    
    if (bOpenSelect) {
        appFormValues.userRequests[shiftId] = 
            await fPickSelection(element, shiftDescription, 
                appHtml.optRequests, requestValue, 1);
        appFormValues.userRequests[shiftId] = appFormValues.userRequests[shiftId][0]
    }    
    // console.log("fPickShift - appFormValues.userRequests:", appFormValues.userRequests, "shiftId:", shiftId, "sDayNight:", sDayNight, "requestValue:", requestValue);
    
    // if no requests sets field to empty string, otherwise sets it to sDayNight + ":" + value
    if (appFormValues.userRequests[shiftId] === '') {
        element.value = "";
    } else {
        element.value = sDayNight + ":" + element.value;
    }

    // nastavi barvu pole podle treti hodnoty v optRequests pro dany shift
    let sElementColorClass = fGetNthCol(lstRequestOptionsDay, [appFormValues.userRequests[shiftId]], 2);
    sElementColorClass = sElementColorClass.split(" ")[1]; // get first class if there are multiple classes
    //console.log("Orig sElementColorClass:", element.classList);
    //console.log("New sElementColorClass:", sElementColorClass);
    const classArray = Array.from(element.classList);
    if (classArray.length === 3){element.classList.remove(classArray[2]);}
    if (sElementColorClass) {element.classList.add(sElementColorClass);}
    //console.log("New sElementColorClass:", element.classList);
    //console.log(`appFormValues.userRequests[${shiftId}]:`, appFormValues.userRequests[shiftId], document.getElementById(shiftId).value);
    
    // saves values to appFormValues.userRequests and updates the value of the input field
    

    //update counter of selected requests with values that are not empty string
    fUpdateCounter(['wnt', 'cnt']); 

}
window.fPickShift = fPickShift;