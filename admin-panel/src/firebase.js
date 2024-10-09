import { initializeApp } from "firebase/app";
import {getAuth} from "firebase/auth";

// export const firebaseConfig = {
//     apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
//     authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
//     projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
//     storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
//     messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
//     appId: process.env.REACT_APP_FIREBASE_APP_ID
// };
export const firebaseConfig = {
    apiKey: "AIzaSyBHANT5jst9KpWYAN38ZKwC4FqQMbHh5-Q",
    authDomain: "telegram-d8624.firebaseapp.com",
    projectId: "telegram-d8624",
    storageBucket: "telegram-d8624.appspot.com",
    messagingSenderId: "943102622976",
    appId: "1:943102622976:web:28cc5c97affd7979b207e5"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };