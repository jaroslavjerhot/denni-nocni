import { auth } from "../firebase/config.js";

const API_URL = "https://script.google.com/macros/s/AKfycbwLh96CYLbczL6KLeYPshe8gXVldDJRKfmWvzZXPhVYIbjTNhgyMOkaa4c7bjwGvkYL7Q/exec";

export async function callApi(action, payload = {}) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User is not logged in");
  }

  const token = await user.getIdToken();

  const response = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: action,
      token: token,
      ...payload
    })
  });

  return await response.json();
}