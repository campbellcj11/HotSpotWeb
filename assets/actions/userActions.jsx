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
export const RESET_PASSWORD = 'RESET_PASSWORD';
export const DB_CALL = "DB_CALL";
export const SIGN_UP = "SIGN_UP";
export const LOGGING_IN = "LOGGING_IN";
export const LOGGING_OUT = "LOGGING_OUT";

//initialize firebase TODO:pull from a credentials file
const firebaseConfig = {
  apiKey: "AIzaSyBc6_49WEUZLKCBoR8FFIHAfVjrZasdHlc",
  authDomain: "projectnow-964ba.firebaseapp.com",
  databaseURL: "https://projectnow-964ba.firebaseio.com",
  storageBucket: "projectnow-964ba.appspot.com",
  messagingSenderId: "14798821887"
};
const firebaseApp = firebase.initializeApp(firebaseConfig);
//initialize database
const database = firebase.database();

export function loggingIn() {
  console.log('Logging in');
  return { type: LOGGING_IN };
}

export function loggingOut() {
  console.log('Logging out');
  return { type: LOGGING_OUT }
}

export function stateLogIn(user) {
  return { type: LOG_IN, currentUser: user };
}

export function stateLogOut() {
  return { type: LOG_OUT };
}

export function loginUser(user){
  console.log('Logging in user');
  return (dispatch) => {
    dispatch(loggingIn());
    firebase.auth().signInWithEmailAndPassword(user.email, user.password)
      .then(currentUser => {
        var ref = database.ref("users/" + firebase.auth().currentUser.uid);
        var userFromTable;
        ref.once('value')
          .then(function(snapshot) {
            console.log(snapshot.val())
            userFromTable = {
              email : snapshot.val().email,
              firstName : snapshot.val().firstName,
              lastName : snapshot.val().lastName
            };
            console.log("USERFROMTABLE: " + userFromTable);
            dispatch(stateLogIn(userFromTable));
        })
        .catch(function(error) {
          var errorCode = error.code;
          var errorMessage = error.message;
          console.log('ERROR: ' + error.code + ' - ' + error.message);
          if (Platform.OS == 'ios')
          {
            AlertIOS.alert('User does not exist.');
          }
          else
          {
            Alert.alert('User does not exist.');
          }
        });
      })
      .catch(error => {
        var errorCode = error.code;
        var errorMessage = error.message;
        console.log('ERROR: ' + error.code + ' - ' + error.message);
        if (Platform.OS == 'ios')
        {
          AlertIOS.alert('Invalid Login for ' + user.email, error.message);
        }
        else
        {
          Alert.alert('Invalid Login for ' + user.email + user.password, error.message);
        }
    });
  };
}

//TODO: fix logout function -- seems to be logging out to early?
export function logoutUser(){
  console.log('Logging out user');
  return (dispatch) => {
    dispatch(loggingOut());
    firebase.auth().signOut()
      .then(currentUser => {
        dispatch(stateLogOut());
      })
      .catch(error => {
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
  };
}

export function signUpUser(user) {
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
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      console.log('UID: ' + user.uid);
    }
  });
  database.ref('users/' + firebase.auth().currentUser.uid).set({
    email: user.email,
    firstName: 'Conor',
    lastName: 'Campbell',
    registeredUser: true,
    adminUser: true,
    events: null,
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
