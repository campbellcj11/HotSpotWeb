//initialize firebase
var firebaseConfig = {
  apiKey: "AIzaSyBc6_49WEUZLKCBoR8FFIHAfVjrZasdHlc",
  authDomain: "projectnow-964ba.firebaseapp.com",
  databaseURL: "https://projectnow-964ba.firebaseio.com",
  storageBucket: "projectnow-964ba.appspot.com",
  messagingSenderId: "14798821887"
}

var firebaseApp = firebase.initializeApp(firebaseConfig)

// anonymous auth
firebase.auth().signInAnonymously()

// init db
var database = firebase.database()

function submitContactForm() {
    // get info from form
    var info = {
        name: $('#name').val(),
        email: $('#email').val(),
        message: $('#message').val()
    }
    // submit to db
    var ref = database.ref('contactFormEntries').push()
    ref.set(info, function(error) {
        if (!error) {
            $('#success-container').show()
            $('#submit').attr('disabled', "true")
        } else {
            console.error('Failed to submit contact form')
        }
    })
}

$('#submit').on('click', submitContactForm)