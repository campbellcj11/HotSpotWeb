from facepy import GraphAPI
import time
import pyrebase
from datetime import datetime

graph = GraphAPI('1738197196497592|HHscAS8uDjBcjiCgf-NZbQjjmL0')
config = {
    "apiKey" : "AIzaSyBc6_49WEUZLKCBoR8FFIHAfVjrZasdHlc",
    "authDomain" : "projectnow-964ba.firebaseapp.com",
    "databaseURL" : "https://projectnow-964ba.firebaseio.com",
    "storageBucket" : "projectnow-964ba.appspot.com",
}
firebase = pyrebase.initialize_app(config)

def setup():
    auth = firebase.auth()
    # Log the user in
    user = auth.sign_in_with_email_and_password('conor@email.sc.edu', 'password')
    return user;

def searchForPlaces():
    result = graph.search(
        term = '',
        type = 'place',
        center = '39.364283,-74.422927',
        #increase limit and distance to increase event results
        distance = '10000',
        # limit = '1000'
    )
    return result

def formatOutput(event, user):
    #format place
    if 'place' in event:
        location = event['place']['location']
        if 'street' not in location:
            return None
        else:
            address = location['street'] + ', ' + location['city'] + ', ' + location['state'] + ', ' + location['zip']
        city = location['city']
        latitude = location['latitude']
        longitude = location['longitude']
        locationName = event['place']['name']
        state = location['state']
    else:
        return None

    # format Date
    dateString = event['start_time']
    date = int(time.mktime(datetime.strptime(dateString, '%Y-%m-%dT%H:%M:%S%z').timetuple())) * 1000

    # format Image
    if 'cover' in event:
        image = event['cover']['source']
    else:
        return None

    #check for description
    if 'description' not in event:
        return None

    #Status
    if 'is_canceled' in event:
        if event['is_canceled'] is True:
            status = "Canceled"
        else:
            status = 'Active'
    else:
        status = 'Active'

    newData = {
        'Facebook_ID' : event['id'],
        'Event_Name' : event['name'],
        'Address' : address,
        'City' : city,
        'Date' : date,
        'Sort_Date' : date,
        'Event_Type' : 'Event',
        'Image' : image,
        'Latitude' : str(latitude),
        'Longitude' : str(longitude),
        'Location' : locationName,
        'Long_Description' : event['description'],
        'State' : state,
        'Status' : status,
        'Short_Description' : '',
        'Website' : ('www.facebook.com/' + event['id']),
        # need to find a better way for this
        'Email_Contact' : ('www.facebook.com/' + event['id']),
        'County' : ''
    }
    # print(newData)
    return newData

def putTags(db, user, event, pushID):
    if event['category'].endswith('_EVENT'):
        event['category'] = event['category'][:-6]
    event['category'] = event['category'][0] + event['category'][1:].lower()
    data = {
        event['category'] : 'true'
    }
    db.child("tags").child(pushID).set(data)

def getAllDatabaseEvents(db, user):
    databaseEvents = db.child("events").get()
    listOfEvents = []
    for singleEvent in databaseEvents.each():
        if 'Facebook_ID' in singleEvent.val():
            listOfEvents.append(singleEvent.val()['Facebook_ID'])

    print(listOfEvents)
    return listOfEvents


def getEvents(result, user, db, databaseEvents):
    ids = []
    for x in result['data']:
        #GET command to get future events
        events = graph.get(x['id'] + '/events', since=time.strftime("%m/%d/%Y"), limit=100000, fields='id')
        for x in events['data']:
            event = graph.get(x['id'])
            ids.append(x['id'])

    counter = 0
    for id in ids:
        event = graph.get(id, fields='id,description,name,category,cover,start_time,end_time,place')
        data = formatOutput(event, user)
        if data is not None:
            # Here we should check if the event already exists before pushing it into database
            if data['Facebook_ID'] not in databaseEvents:
                eventsOutcome = db.child("events").push(data, user['idToken'])
                putTags(db, user, event, eventsOutcome['name'])
                counter += 1

    print("Added " + str(counter) + " events.")

db = firebase.database()
user = setup()
result = searchForPlaces()
databaseEvents = getAllDatabaseEvents(db, user)
getEvents(result, user, db, databaseEvents)
