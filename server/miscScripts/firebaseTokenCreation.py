# Use this if you want to test using a token of your own.
import pyrebase

config = {
    "apiKey" : "AIzaSyBc6_49WEUZLKCBoR8FFIHAfVjrZasdHlc",
    "authDomain" : "projectnow-964ba.firebaseapp.com",
    "databaseURL" : "https://projectnow-964ba.firebaseio.com",
    "storageBucket" : "projectnow-964ba.appspot.com",
    "serviceAccount": "../service-key.json",
}

firebase = pyrebase.initialize_app(config)
auth = firebase.auth()
username = input('Please enter username: ')
password = input('Please enter password: ')
user = auth.sign_in_with_email_and_password(username, password)
print(user['idToken'])
