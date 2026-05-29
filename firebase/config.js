import { initializeApp }
from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";

import { getAuth }
from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

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

export const auth = getAuth(app);