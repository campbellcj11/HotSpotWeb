import pyrebase
import sys
import getpass
import time

config = {
    "apiKey" : "AIzaSyBc6_49WEUZLKCBoR8FFIHAfVjrZasdHlc",
    "authDomain" : "projectnow-964ba.firebaseapp.com",
    "databaseURL" : "https://projectnow-964ba.firebaseio.com",
    "storageBucket" : "projectnow-964ba.appspot.com",
    "serviceAccount": "./service-key.json",
}
## test database
# config = {
#     "apiKey": "AIzaSyBtEU6cCFmGaUSrteSyrg8SDgiOsCaAJOo",
#     "authDomain": "projectnowtest.firebaseapp.com",
#     "databaseURL": "https://projectnowtest.firebaseio.com",
#     "storageBucket": "projectnowtest.appspot.com",
#     "messagingSenderId": "727912823537"
# };

firebase = pyrebase.initialize_app(config)

def setup():
    print("Setting up printer...")
    auth = firebase.auth()
    # Log the user in
    userName = input("Plese enter a user name for firebase: ")
    password = input("Please enter a password for the previous account: ")
    user = auth.sign_in_with_email_and_password(userName, getpass.getpass())
    return user;

def printEvents(user, db, locale):
    print("Printing Titles...")
    listOfEventNames = []
    databaseEvents = db.child("events").child(locale).get()
    if databaseEvents.each() is None:
        print("Error, database empty.")
    else:
        for key, data in databaseEvents.val().items():
            listOfEventNames.append(data['Event_Name'] + " - " + key)

    # sort list alphabetically
    listOfEventNames.sort()
    for item in listOfEventNames:
        print(item)

db = firebase.database()
user = setup()
locale = input("Please enter a locale to print events from: ")
printEvents(user, db, locale)
print("Print complete.")
