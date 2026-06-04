import { auth } from "../firebase/config.js";
import { callApi } from "./api.js";
import { publicApi } from "./api.js";

import {
  createUserWithEmailAndPassword,
  updateProfile
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";


email.onblur = function () {
  const emailValue = email.value.trim().toLowerCase();
  if (emailValue && !isValidEmail(emailValue)) {
    showMsg("err", "Toto není platný email");
  }
};

window.registerUser = async function () {
  
  const emailValue = email.value.trim().toLowerCase();
  const passwordValue = password.value;
  const password2Value = password2.value;

  if (!isValidEmail(emailValue)) {
    showMsg("err", "Toto není platný email");
    return;
  }

  if (passwordValue !== password2Value) {
    showMsg("wait", "Hesla se neshodují");
    return;
  }

  if (passwordValue.length < 8) {
    showMsg("err", "Heslo musí mít alespoň 8 znaků");
    return;
  }
  //alert("Kontrola emailu..." + emailValue);

  showMsg("wait", `Kontroluji, zda je email ${emailValue} předregistrovaný...`);
  let checkResult;
  try {
       checkResult = await publicApi("checkPreRegisteredEmail", {
          email: emailValue
      });
      //alert('checkResult: ' + JSON.stringify(checkResult));
      //return;
  } finally {
      hideMsg();
      //alert('checkResult: ' + JSON.stringify(checkResult));
      //showMsg("succ", "Zkontrolováno" + JSON.stringify(checkResult));
  }




  if (!checkResult.ok) {
    showMsg("err", checkResult.error);
    return;
  } else {
    localStorage.setItem("preRegisteredUser", JSON.stringify(checkResult));
  //  alert('checkResult: ' + JSON.stringify(checkResult));
  }


  try {
    // const fullName = [
    //   prefix.value,
    //   givenname.value,
    //   surname.value,
    //   suffix.value
    // ].filter(Boolean).join(" ");

    //alert("auth" + JSON.stringify(auth));
    const credential = await createUserWithEmailAndPassword(
      auth,
      emailValue,
      passwordValue
    );

    // await updateProfile(credential.user, {
    //   displayName: fullName
    // });

    // const result = await callApi("registerProfile", {
    //   profile: {
    //     email: emailValue,
    //     prefix: prefix.value.trim(),
    //     givenname: givenname.value.trim(),
    //     surname: surname.value.trim(),
    //     suffix: suffix.value.trim(),
    //     shortname: shortname.value.trim(),
    //     phone: phone.value.trim(),
    //     position: position.value,
    //     unfavorite_1: unfavorite1.value,
    //     unfavorite_2: unfavorite2.value,
    //     unfavorite_3: unfavorite3.value,
    //     unfavorite_4: unfavorite4.value,
    //   }
    // });

    // if (!result.ok) {
    //   showMsg("err", result.error);
    //   return;
    // }

    // msg.className = "text-success text-center mt-3";
    // msg.innerText = "Registration successful";

    setTimeout(() => {
      location.href = "profile.html";
    }, 800);

  } catch (err) {
    showMsg("err", err.message);
  }
};



window.togglePassword = function(inputId, button) {

    const input =
        document.getElementById(inputId);

    if (input.type === "password") {

        input.type = "text";
        button.innerHTML = "🙈";

    } else {

        input.type = "password";
        button.innerHTML = "👁";

    }

};

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}