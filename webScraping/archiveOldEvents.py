#!/usr/bin/python3
import pyrebase
import sys
import getpass
import time
from os.path import expanduser

home = expanduser("~")
config = {
    "apiKey" : "AIzaSyBc6_49WEUZLKCBoR8FFIHAfVjrZasdHlc",
    "authDomain" : "projectnow-964ba.firebaseapp.com",
    "databaseURL" : "https://projectnow-964ba.firebaseio.com",
    "storageBucket" : "projectnow-964ba.appspot.com",
    "serviceAccount": home + "/service-key.json",
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
    print("Setting up archiver...")
    auth = firebase.auth()
    # Log the user in
    #userName = input("Plese enter a user name for firebase: ")
    userName = 'conor@email.sc.edu'
    user = auth.sign_in_with_email_and_password(userName, 'password')
    return user;

def migrateEvents(user, db):
    print("Starting Achiver...")
    databaseEvents = db.child("events").get()
    timeNow = int(time.time()) * 1000 # for milliseconds
    counter = 0

    favorites = db.child("favorites").get()

    #  Charleston/-Ki64z0PcRTN9jee3KyF

    if databaseEvents.each() is None:
        print("Error, database empty.")
    else:
        for locale in databaseEvents.each():
            for key, data in locale.val().items():
                if 'Date' in data:
                    if (int(data['Date']) < timeNow):
                        for user in favorites.each():
                            index = 0
                            for item in user.val():
                                if item is not None:
                                    if key in item:
                                        db.child("favorites").child(user.key()).child(index).remove()
                            index += 1
                        db.child("archivedEvents").child(locale.key()).update({key : data})
                        db.child("events").child(locale.key()).child(key).remove()
                        db.child("tags").child(key).remove()
                        counter += 1
    print("Archived " + str(counter) + " events.")

db = firebase.database()
user = setup()
migrateEvents(user, db)
print("Archive complete.")
