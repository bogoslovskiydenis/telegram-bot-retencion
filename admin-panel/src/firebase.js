import { initializeApp } from "firebase/app";
import {getAuth} from "firebase/auth";

export const firebaseConfig = {
    apiKey: "AIzaSyBVYT132YhW2ovMd7zci3wGh_rwj8W2zuA",
    authDomain: "bratanbetkz.firebaseapp.com",
    projectId: "bratanbetkz",
    storageBucket: "bratanbetkz.appspot.com",
    messagingSenderId: "1000232461688",
    appId: "1:1000232461688:web:ca67585e136c27e638948d"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };