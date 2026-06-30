import { initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyAbF8TmR-n4JYfHjVEbhe0dSw9y-Pzi_GE",
  authDomain: "vitacare-a6641.firebaseapp.com",
  projectId: "vitacare-a6641",
  storageBucket: "vitacare-a6641.firebasestorage.app",
  messagingSenderId: "233872645083",
  appId: "1:233872645083:web:0c69df848bdc5137f3e5fe",
};

export const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
