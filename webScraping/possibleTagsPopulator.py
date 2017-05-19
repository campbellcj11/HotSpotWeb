#!/usr/bin/python3
import time
import pyrebase
import sys
import getpass
from datetime import datetime
from facepy import GraphAPI
from os.path import expanduser

# Setting up the graph api and firebase connections.
graph = GraphAPI('1738197196497592|RpbqD1owgCZ6aT7s5JOrGvp9_7Q')
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

def getPossibleTags(user, db):
    print("Starting Populator...")
    tags = db.child("tags").get()
    timeNow = int(time.time()) * 1000 # for milliseconds
    dictOfPossibleTags = {}
    if tags.each() is None:
        print("Error, database empty.")
    else:
        for item in tags.each():
            for key in item.val():
                dictOfPossibleTags[key] = "true"

    for items in dictOfPossibleTags:
        print(items)
    db.child("possibleTags").set(dictOfPossibleTags)
    print("Populated " + str(len(dictOfPossibleTags)) + " possible tags.")

db = firebase.database()
user = setup()
getPossibleTags(user, db)
print("Population complete.")
