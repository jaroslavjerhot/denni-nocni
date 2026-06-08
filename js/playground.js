import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import {
    getFirestore,
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    query,
    where
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";


const firebaseConfig = {
  apiKey: "AIzaSyBeTgy73Z4DCRb-vfQ6KxHNpknR2Vv0BtM",
  authDomain: "my-auth-app-cfd14.firebaseapp.com",
  projectId: "my-auth-app-cfd14",
  storageBucket: "my-auth-app-cfd14.firebasestorage.app",
  messagingSenderId: "586087979734",
  appId: "1:586087979734:web:5a8d95dd9c75af63140777",
  measurementId: "G-68C3B1BZB1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


document.getElementById("btnGetCollection").addEventListener("click", async function() {

    const data = await fGetCollectionData(
        document.getElementById("collectionName").value
    );

    fShowData(data);
});


document.getElementById("btnGetByKey").addEventListener("click", async function() {

    const data = await fGetCollectionData(
        document.getElementById("collectionName").value,
        document.getElementById("key").value
    );

    fShowData(data);
});


document.getElementById("btnGetByField").addEventListener("click", async function() {

    const data = await fGetCollectionData(
        document.getElementById("collectionName").value,
        "",
        document.getElementById("field").value,
        document.getElementById("value").value
    );

    fShowData(data);
});


document.getElementById("btnGetFormData").addEventListener("click", function() {

    const data = fGetHtmlFormData("testForm");

    fShowData(data);
});


document.getElementById("btnSetData").addEventListener("click", async function() {

    const data = fGetHtmlFormData("testForm");

    delete data.collectionName;
    delete data.key;
    delete data.field;
    delete data.value;

    await fSetCollectionData(
        data,
        document.getElementById("collectionName").value,
        document.getElementById("key").value,
        document.getElementById("field").value,
        document.getElementById("value").value
    );

    fShowData({
        status: "OK",
        message: "Data byla uložena."
    });
});


async function fGetCollectionData(
    sCollectionName,
    sKey = "",
    sField = "",
    sValue = ""
) {

    sCollectionName = String(sCollectionName || "").trim();
    sKey = String(sKey || "").trim();
    sField = String(sField || "").trim();
    sValue = String(sValue || "").trim();

    if (!sCollectionName) {
        throw new Error("Collection name is empty.");
    }

    if (sKey) {

        const docRef = doc(db, sCollectionName, sKey);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return null;
        }

        return {
            _id: docSnap.id,
            ...docSnap.data()
        };
    }

    let qData;

    if (sField && sValue) {
        qData = query(
            collection(db, sCollectionName),
            where(sField, "==", sValue)
        );
    } else {
        qData = collection(db, sCollectionName);
    }

    const snapshot = await getDocs(qData);

    const data = [];

    snapshot.forEach(function(docSnap) {
        data.push({
            _id: docSnap.id,
            ...docSnap.data()
        });
    });

    return data;
}


async function fSetCollectionData(
    data,
    sCollectionName,
    sKey = "",
    sField = "",
    sValue = ""
) {

    sCollectionName = String(sCollectionName || "").trim();
    sKey = String(sKey || "").trim();
    sField = String(sField || "").trim();
    sValue = String(sValue || "").trim();

    if (!sCollectionName) {
        throw new Error("Collection name is empty.");
    }

    if (sKey) {

        await setDoc(
            doc(db, sCollectionName, sKey),
            data,
            { merge: true }
        );

        return;
    }

    if (sField && sValue) {

        const snapshot = await getDocs(
            query(
                collection(db, sCollectionName),
                where(sField, "==", sValue)
            )
        );

        for (const docSnap of snapshot.docs) {
            await updateDoc(
                doc(db, sCollectionName, docSnap.id),
                data
            );
        }

        return;
    }

    throw new Error("For writing, use either sKey or sField + sValue.");
}


function fGetHtmlFormData(sFormName) {

    const form = document.getElementById(sFormName);

    if (!form) {
        throw new Error("Form not found: " + sFormName);
    }

    const data = {};

    const elements = form.querySelectorAll("[data-field]");

    elements.forEach(function(element) {

        const sField = element.dataset.field;

        if (!sField) {
            return;
        }

        if (element.type === "checkbox") {
            data[sField] = element.checked;
            return;
        }

        data[sField] = element.value;
    });

    return data;
}


function fFillHtmlFormData(sFormName, data) {

    const form = document.getElementById(sFormName);

    if (!form) {
        throw new Error("Form not found: " + sFormName);
    }

    const elements = form.querySelectorAll("[data-field]");

    elements.forEach(function(element) {

        const sField = element.dataset.field;

        if (!(sField in data)) {
            return;
        }

        if (element.type === "checkbox") {
            element.checked = data[sField] === true;
            return;
        }

        element.value = data[sField] ?? "";
    });
}


function fShowData(data) {

    document.getElementById("output").textContent = JSON.stringify(
        data,
        null,
        4
    );
}