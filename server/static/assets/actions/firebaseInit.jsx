/**
 * Initialize single instance firebase and export for use with other components.
 */
import * as firebase from 'firebase'

//initialize firebase TODO: pull from a credentials file
const firebaseConfig = {
  apiKey: "AIzaSyBc6_49WEUZLKCBoR8FFIHAfVjrZasdHlc",
  authDomain: "projectnow-964ba.firebaseapp.com",
  databaseURL: "https://projectnow-964ba.firebaseio.com",
  storageBucket: "projectnow-964ba.appspot.com",
  messagingSenderId: "14798821887"
}

const firebaseApp = firebase.initializeApp(firebaseConfig)
export default firebase
