from facepy import GraphAPI
import time
import pyrebase
from datetime import datetime

# Setting up the graph api and firebase connections.
graph = GraphAPI('1738197196497592|HHscAS8uDjBcjiCgf-NZbQjjmL0')
config = {
    "apiKey" : "AIzaSyBc6_49WEUZLKCBoR8FFIHAfVjrZasdHlc",
    "authDomain" : "projectnow-964ba.firebaseapp.com",
    "databaseURL" : "https://projectnow-964ba.firebaseio.com",
    "storageBucket" : "projectnow-964ba.appspot.com",
}
firebase = pyrebase.initialize_app(config)

def setup():
    """Setup firebase and return auth user."""
    auth = firebase.auth()
    # Log the user in
    user = auth.sign_in_with_email_and_password('conor@email.sc.edu', 'password')
    return user;

def searchForPlaces():
    """Search for places within the parameters.

    Edit distance, center, and limit in order to change search results.
    """
    result = graph.search(
        term = '',
        type = 'place',
        center = '39.364283,-74.422927',
        #increase limit and distance to increase event results
        distance = '16093',
        limit = '1000'
    )
    return result

def getShortDescription(longDescription):
    """Parse the short description from the long description."""
    maxCharacterLength = 200
    indexOfPeriod = -1

    for index, match in enumerate(longDescription[:maxCharacterLength]):
        if ((indexOfPeriod < index) and (match == '.' or match == '!' or match == '?')):
            indexOfPeriod = index

    if (indexOfPeriod == -1):
        shortDescription = longDescription[:maxCharacterLength - 1]
    else:
        shortDescription = longDescription[:indexOfPeriod + 1]
    return shortDescription


def formatOutput(event, user):
    """Format data to fit database scheme."""

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

    #Check for category
    if 'category' not in event:
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

    # Short Description parsing
    shortDescription = getShortDescription(event['description'])

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
        'Short_Description' : shortDescription,
        'Website' : ('www.facebook.com/' + event['id']),
        # TODO: need to find a better way for this
        'Email_Contact' : ('www.facebook.com/' + event['id']),
        'County' : ''
    }
    return newData

def putTags(db, user, event, pushID):
    """Put Tags for event into database."""

    if event['category'] is not None:
        if event['category'].endswith('_EVENT'):
            event['category'] = event['category'][:-6]
        event['category'] = event['category'][0] + event['category'][1:].lower()
        data = {
            event['category'] : 'true'
        }
        db.child("tags").child(pushID).set(data)

def getAllDatabaseEvents(db, user):
    """Get all the database events to check to see if events exist already."""

    databaseEvents = db.child("events").get()
    listOfEvents = []
    for singleEvent in databaseEvents.each():
        if 'Facebook_ID' in singleEvent.val():
            listOfEvents.append(singleEvent.val()['Facebook_ID'])

    return listOfEvents


def getEvents(result, user, db, databaseEvents):
    """Get event by using event ID. Then put event into database."""

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
            # Checking if event already exists in database
            if data['Facebook_ID'] not in databaseEvents:
                eventsOutcome = db.child("events").push(data, user['idToken'])
                putTags(db, user, event, eventsOutcome['name'])
                counter += 1

    print("Added " + str(counter) + " events. ")

db = firebase.database()
user = setup()
result = searchForPlaces()
databaseEvents = getAllDatabaseEvents(db, user)
getEvents(result, user, db, databaseEvents)
