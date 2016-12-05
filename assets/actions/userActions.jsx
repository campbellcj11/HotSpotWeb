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

  /*export function signUpUser(user) {
    console.log('Signing up user');
    console.log("USER!: " + user);
    return (dispatch) => {
      dispatch(signingUp());
      firebase.auth().createUserWithEmailAndPassword(user.email, user.password)
        .then(currentUser => {
          database.ref('users/' + firebase.auth().currentUser.uid).set({
            email: user.email,
            //TODO: need to implement first Name and last name fields on sign up.
            //firstName: 'Conor',
            //lastName: 'Campbell',
            registeredUser: true,
            adminUser: false,
            lastLogin : firebase.database.ServerValue.TIMESTAMP
          });
          dispatch(stateSignUp(user));
        })
        .catch(error => {
          var errorCode = error.code;
          var errorMessage = error.message;
          console.log('ERROR: ' + error.code + ' - ' + error.message);
        });
    };
  }*/

  //TODO: Test function - this function will have issues with the current
  // implementation.
  /*export function resetPassword(email) {
    console.log('Resetting Password');
    return (dispatch) => {
      dispatch(resettingPassword());
      firebase.auth().sendPasswordResetEmail(email)
        .then(currentUser => {
        
        })
        .catch(error => {
          var errorCode = error.code;
          var errorMessage = error.message;
          console.log('ERROR: ' + error.code + ' - ' + error.message);
        });
    };
    firebase.auth().sendPasswordResetEmail(email).catch(function(error) {
      var errorCode = error.code;
      var errorMessage = error.message;
      console.log('ERROR: ' + error.code + ' - ' + error.message);
    });
    return {}
  }*/
}

export default UserActions