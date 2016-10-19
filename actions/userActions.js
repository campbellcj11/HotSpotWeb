import offline from 'react-native-simple-store'
import * as firebase from 'firebase';

var ReactNative = require('react-native');
var {
  AlertIOS,
  Alert,
  Platform,
} = ReactNative;

//reducers
export const LOG_IN = 'LOG_IN'
export const LOG_OUT = 'LOG_OUT'
export const DB_CALL = "DB_CALL";
export const SIGN_UP = "SIGN_UP";

//initialize firebase
const firebaseConfig = {
  apiKey: "AIzaSyBc6_49WEUZLKCBoR8FFIHAfVjrZasdHlc",
  authDomain: "projectnow-964ba.firebaseapp.com ",
  databaseURL: "https://projectnow-964ba.firebaseio.com/",
};
const firebaseApp = firebase.initializeApp(firebaseConfig);
//initialize database
const database = firebase.database();

export function loginUser(user){
  console.log('Logging in user');
  firebase.auth().signInWithEmailAndPassword(user.email, user.password).catch(function(error) {
    var errorCode = error.code;
    var errorMessage = error.message;
    console.log('ERROR: ' + error.code + ' - ' + error.message);
    if (Platform.OS == 'ios')
    {
      AlertIOS.alert('Invalid Login for ' + user.email, error.message);
    }
    else
    {
      Alert.alert('Invalid Login for ' + user.email, error.message);
    }
  });
  return {
    type: LOG_IN,
    currentUser: user
  }
}

export function logoutUser(){
  console.log('Logging out user');
  firebase.auth().signOut().catch(function(error) {
    var errorCode = error.code;
    var errorMessage = error.message;
    console.log('ERROR: ' + error.code + ' - ' + error.message);
    if (Platform.OS == 'ios')
    {
      AlertIOS.alert('Invalid Logout for ' + user.email, error.message);
    }
    else
    {
      Alert.alert('Invalid Logout for ' + user.email, error.message);
    }
  });
  return {
    type: LOG_OUT
  }
}

export function signUpUser(user, first, last, registered, admin, events) {
  console.log('Signing up user');
  firebase.auth().createUserWithEmailAndPassword(user.email, user.password).catch(function(error) {
    var errorCode = error.code;
    var errorMessage = error.message;
    console.log('ERROR: ' + error.code + ' - ' + error.message);
    if (Platform.OS == 'ios')
    {
      AlertIOS.alert('Invalid Signup for ' + user.email, error.message);
    }
    else
    {
      Alert.alert('Invalid Signup for ' + user.email, error.message);
    }
  });
  //add user to user table -- TODO:fix this to not happen unless it is
  database.ref('users/').push({
    email: user.email,
    firstName: first,
    lastName: last,
    registeredUser: registered,
    adminUser: registered,
    events: events,
    lastLogin : firebase.database.ServerValue.TIMESTAMP
  });
  return {
    type: SIGN_UP,
    currentUser: user
  }
}

export function resetPassword(email) {
  console.log('Resetting Password');
  firebase.auth().sendPasswordResetEmail(email).catch(function(error) {
    var errorCode = error.code;
    var errorMessage = error.message;
    console.log('ERROR: ' + error.code + ' - ' + error.message);
    if (Platform.OS == 'ios')
    {
      AlertIOS.alert('Cannot Reset Password ' + user.email, error.message);
    }
    else
    {
      Alert.alert('Cannot Reset Password ' + user.email, error.message);
    }
  });
  return {}
}
