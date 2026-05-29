import { auth } from "../firebase/config.js";
import { callApi } from "./api.js";

import {
  createUserWithEmailAndPassword,
  updateProfile
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

window.registerUser = async function () {
  
  const emailValue = email.value.trim().toLowerCase();
  const passwordValue = password.value;
  const password2Value = password2.value;

  if (!emailValue.endsWith("@vfn.cz")) {
    showError("Email musí být ve formátu @vfn.cz");
    return;
  }

  if (passwordValue !== password2Value) {
    showError("Hesla se neshodují");
    return;
  }

  if (passwordValue.length < 8) {
    showError("Heslo musí mít alespoň 8 znaků");
    return;
  }

  try {
    const fullName = [
      prefix.value,
      givenname.value,
      surname.value,
      suffix.value
    ].filter(Boolean).join(" ");

    const credential = await createUserWithEmailAndPassword(
      auth,
      emailValue,
      passwordValue
    );

    await updateProfile(credential.user, {
      displayName: fullName
    });

    const result = await callApi("registerProfile", {
      profile: {
        email: emailValue,
        prefix: prefix.value.trim(),
        givenname: givenname.value.trim(),
        surname: surname.value.trim(),
        suffix: suffix.value.trim(),
        shortname: shortname.value.trim(),
        phone: phone.value.trim(),
        position: position.value,
        unfavorite_1: unfavorite1.value,
        unfavorite_2: unfavorite2.value,
        unfavorite_3: unfavorite3.value,
        unfavorite_4: unfavorite4.value,
      }
    });

    if (!result.ok) {
      showError(result.error);
      return;
    }

    msg.className = "text-success text-center mt-3";
    msg.innerText = "Registration successful";

    setTimeout(() => {
      location.href = "dashboard.html";
    }, 800);

  } catch (err) {
    showError(err.message);
  }
};

function showError(text) {
  msg.className = "text-danger text-center mt-3";
  msg.innerText = text;
}