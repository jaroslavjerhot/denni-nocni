import { auth } from "../firebase/config.js";
import { callApi } from "./api.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const maxRequests = 10;

const requestOptions = [
    ["", "-"],
    ["want", "Want"],
    ["cannot", "Cannot"],
    ["holiday", "Holiday"]
];

let authReady = false;

onAuthStateChanged(auth, user => {
    if (!user) {
        location.href = "index.html";
        return;
    }

    if (authReady) {
        return;
    }

    authReady = true;

    initMonthSelectors();
    renderCalendar();
});

window.renderCalendar = renderCalendar;
window.saveRequests = saveRequests;

function initMonthSelectors() {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const monthNames = [
        "January", "February", "March", "April",
        "May", "June", "July", "August",
        "September", "October", "November", "December"
    ];

    monthSelect.innerHTML = "";

    monthNames.forEach((name, index) => {
        const option = document.createElement("option");
        option.value = index + 1;
        option.textContent = name;

        if (index + 1 === currentMonth) {
            option.selected = true;
        }

        monthSelect.appendChild(option);
    });

    yearSelect.innerHTML = "";

    for (let y = currentYear - 1; y <= currentYear + 2; y++) {
        const option = document.createElement("option");
        option.value = y;
        option.textContent = y;

        if (y === currentYear) {
            option.selected = true;
        }

        yearSelect.appendChild(option);
    }
}

function renderCalendar() {
    const year = Number(yearSelect.value);
    const month = Number(monthSelect.value);

    const firstDate = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();

    let firstWeekday = firstDate.getDay();

    if (firstWeekday === 0) {
        firstWeekday = 7;
    }

    calendarBody.innerHTML = "";

    let day = 1;

    for (let week = 0; week < 6; week++) {
        const tr = document.createElement("tr");

        for (let weekday = 1; weekday <= 7; weekday++) {
            const td = document.createElement("td");

            if ((week === 0 && weekday < firstWeekday) || day > daysInMonth) {
                td.className = "calendar-day empty-day";
                tr.appendChild(td);
                continue;
            }

            const date = new Date(year, month - 1, day);

            td.className = "calendar-day";

            if (isWeekend(date)) {
                td.classList.add("weekend-day");
            }

            if (isCzechHoliday(date)) {
                td.classList.add("holiday-day");
            }

            td.innerHTML = createDayHtml(year, month, day);

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
        });
}

function createDayHtml(year, month, day) {
    const dateText =
        year + "-" +
        String(month).padStart(2, "0") + "-" +
        String(day).padStart(2, "0");

    return `
        <div class="day-number">${day}</div>

        <div class="shift-label">Day</div>
        <select
            class="form-select form-select-sm mb-2 request-select"
            data-date="${dateText}"
            data-shift="day">
            ${createOptionsHtml()}
        </select>

        <div class="shift-label">Night</div>
        <select
            class="form-select form-select-sm request-select"
            data-date="${dateText}"
            data-shift="night">
            ${createOptionsHtml()}
        </select>
    `;
}

function createOptionsHtml() {
    return requestOptions
        .map(item => `<option value="${item[0]}">${item[1]}</option>`)
        .join("");
}

function updateCounter() {
    const count = getSelectedRequests().length;

    requestCounter.innerHTML =
        `Selected requests: <strong>${count}</strong> / ${maxRequests}`;

    if (count > maxRequests) {
        requestCounter.className = "text-danger text-center mb-3";
    } else {
        requestCounter.className = "text-success text-center mb-3";
    }
}

function getSelectedRequests() {
    return Array.from(document.querySelectorAll(".request-select"))
        .filter(select => select.value !== "")
        .map(select => ({
            date: select.dataset.date,
            shift: select.dataset.shift,
            request: select.value
        }));
}

async function saveRequests() {
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

        msg.className = "text-success text-center mt-3";
        msg.innerText = "Requests saved";

    } catch (err) {
        showError(err.message);
    }
}

function showError(text) {
    msg.className = "text-danger text-center mt-3";
    msg.innerText = text;
}

function isWeekend(date) {
    const d = date.getDay();
    return d === 0 || d === 6;
}

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

function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function sameDate(a, b) {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}