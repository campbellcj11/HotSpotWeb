//import offline from 'react-native-simple-store'
import * as firebase from 'firebase';

//var ReactNative = require('react-native');
//var {
  //AlertIOS,
  //Alert,
  //Platform,
//} = ReactNative;

//reducers
export const LOG_IN = 'LOG_IN'

//initialize firebase
const firebaseConfig = {
  apiKey: "AIzaSyBc6_49WEUZLKCBoR8FFIHAfVjrZasdHlc",
  authDomain: "projectnow-964ba.firebaseapp.com ",
  databaseURL: "https://projectnow-964ba.firebaseio.com/",
};
const firebaseApp = firebase.initializeApp(firebaseConfig);
//initialize database
const database = firebase.database();

export function pushEvent(event) {
  database.ref('events/').push({
    title: event.title,
    shortDescription: event.shortDescription,
    longDescription: event.longDescription,
    photo: event.photo, //TODO:pull from storage
    video: event.video, //TODO:pull from storage
    startDate: event.startDate,
    endDate: event.endDate,
  });
  return {
    type: LOG_IN,
    currentUser: firebase.auth().currentUser
  }
}
