import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";

const ADMIN_EMAIL = process.env.REACT_APP_ADMIN_EMAIL || "";

const auth = getAuth();

export function observeAuth(callback){
  return onAuthStateChanged(auth, (user) => callback(user || null));
}

export async function signIn(email, password){
  const res = await signInWithEmailAndPassword(auth, email, password);
  return res.user;
}

export async function signOutUser(){
  await signOut(auth);
}

export function isAdmin(user){
  if (!user) return false;
  if (!ADMIN_EMAIL) return true; // if not configured, allow for now
  return (user.email || "").toLowerCase() === ADMIN_EMAIL.toLowerCase();
}
