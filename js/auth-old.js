import { auth }
from "../firebase/config.js";

import {

  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail

}
from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const provider =
  new GoogleAuthProvider();

window.login = async function(){

  try{

    await signInWithEmailAndPassword(
      auth,
      email.value,
      password.value
    );

    location.href =
      "requests.html";

  }catch(err){

    msg.innerText =
      err.message;
  }
};

window.signup = async function(){

  try{

    await createUserWithEmailAndPassword(
      auth,
      email.value,
      password.value
    );

    msg.innerText =
      "Account created";

  }catch(err){

    msg.innerText =
      err.message;
  }
};

window.googleLogin = async function(){
  
  try{

    await signInWithPopup(
      auth,
      provider
    );

    location.href =
      "requests.html";

  }catch(err){

    msg.innerText =
      err.message;
  }
};

window.resetPassword = async function(){

  try{

    await sendPasswordResetEmail(
      auth,
      email.value
    );

    msg.innerText =
      "Reset email sent";

  }catch(err){

    msg.innerText =
      err.message;
  }
};