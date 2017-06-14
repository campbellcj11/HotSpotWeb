/**
 * Manage user and auth related db interactions
 */
import firebase from './firebaseInit'

//initialize database
const database = firebase.database();

let UserActions = {

  /*
  This function logs a user in to firebase and when successful, it will
  update the last login field in the database under the specified user. This
  also sets the state of the current user.
    callback args: didSucceed, userFromTable/error, authResponse
  */
  loginUser: (user, callback) => {
    firebase.auth().signInWithEmailAndPassword(user.email, user.password)
      .then(currentUser => {
        let ref = database.ref("users/" + firebase.auth().currentUser.uid);
        //update timestamp
        ref.update({
          Last_Login : firebase.database.ServerValue.TIMESTAMP
        });
        ref.once('value')
          .then(function(snapshot) {
            callback(true, snapshot.val(), currentUser)
          })
          .catch(function(error) {
            let errorCode = error.code;
            let errorMessage = error.message;
            console.log('ERROR: ' + error.code + ' - ' + error.message);
            callback(false, 'USER_NOT_FOUND')
          });
      })
      .catch(error => {
        let errorCode = error.code;
        let errorMessage = error.message;
        console.log('ERROR: ' + error.code + ' - ' + error.message);
        callback(false, 'AUTH')
    });
  },

  getCurrentUser: (callback) => {
    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        let ref = database.ref("users/" + firebase.auth().currentUser.uid);
        ref.once('value')
        .then(function(snapshot) {
            callback(true, snapshot.val(), firebase.auth().currentUser)
        })
        .catch(function(error) {
            let errorCode = error.code;
            let errorMessage = error.message;
            console.log('ERROR: ' + error.code + ' - ' + error.message);
            callback(false, 'USER_NOT_FOUND')
        });
      } else {
        // No user is signed in.
        callback(false, 'AUTH')
      }
    });
  },

  logoutUser: (callback) => {
      firebase.auth().signOut()
        .then(currentUser => {
          callback(true)
        })
        .catch(error => {
          var errorCode = error.code;
          var errorMessage = error.message;
          console.log('ERROR: ' + error.code + ' - ' + error.message);
          callback(false, error)
      });
  }
}

export default UserActions