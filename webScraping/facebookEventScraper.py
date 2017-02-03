import time
import pyrebase
import sys
from datetime import datetime
from facepy import GraphAPI

## To run this program for Atlantic City use:
#      python3 facebookEventScraper.py 39.364283 -74.422927 16093 1000

# Setting up the graph api and firebase connections.
graph = GraphAPI('1738197196497592|HHscAS8uDjBcjiCgf-NZbQjjmL0')
config = {
    "apiKey" : "AIzaSyBc6_49WEUZLKCBoR8FFIHAfVjrZasdHlc",
    "authDomain" : "projectnow-964ba.firebaseapp.com",
    "databaseURL" : "https://projectnow-964ba.firebaseio.com",
    "storageBucket" : "projectnow-964ba.appspot.com",
}
firebase = pyrebase.initialize_app(config)

def checkCommandLineArguments():
    numberOfArgs = len(sys.argv)
    if (numberOfArgs != 5):
        print("Not enough command line arguements. " +
            "Please enter the arguements as shown: latitude longitude distance limit.")
        sys.exit()

def setup():
    print("Setting up web scraper...")
    """Setup firebase and return auth user."""
    auth = firebase.auth()
    # Log the user in
    user = auth.sign_in_with_email_and_password('conor@email.sc.edu', 'password')
    return user;

def searchForPlaces():
    """Search for places within the parameters.

    Edit distance, center, and limit in order to change search results.
    """
    """TODO: these need validation"""
    print("Getting places around coordinates...")
    centerCoordinates = sys.argv[1] + "," + sys.argv[2]
    distanceNumber = sys.argv[3]
    limitNumber = sys.argv[4]

    result = graph.search(
        term = '',
        type = 'place',
        center = centerCoordinates,
        #increase limit and distance to increase event results
        distance = distanceNumber,
        limit = limitNumber
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
    print("Getting current database events to avoid duplicates...")
    databaseEvents = db.child("events").get()
    listOfEvents = []
    if databaseEvents.each() is None:
        return listOfEvents
    else:
        for singleEvent in databaseEvents.each():
            if 'Facebook_ID' in singleEvent.val():
                listOfEvents.append(singleEvent.val()['Facebook_ID'])

    return listOfEvents


def getEvents(listOfPlaces, user, db, databaseEvents):
    """Get event by using event ID. Then put event into database."""
    print("Getting events of all places...")
    ids = []
    # Loops through places to get event IDs for all events for each place - limit at 100000"""
    for x in listOfPlaces['data']:
        #GET command to get future events
        events = graph.get(x['id'] + '/events', since=time.strftime("%m/%d/%Y"), limit=100000, fields='id')
        for x in events['data']:
            event = graph.get(x['id'])
            ids.append(x['id'])

    counter = 0
    dictOfRepeatsTime = dict()
    dictOfNameAndPlace = dict()
    millisecondsInADay = 8.64e+7
    eventNameAndLocationCap = 5
    # Loop through event IDs to get all event details to put into databases"""
    for id in ids:
        event = graph.get(id, fields='id,description,name,category,cover,start_time,end_time,place')
        data = formatOutput(event, user)
        if data is not None:
            # Checking if event already exists in database
            if data['Facebook_ID'] not in databaseEvents:
                eventNameAndLocationString = data['Event_Name'] + ":" + data['Location']
                if eventNameAndLocationString not in dictOfNameAndPlace:
                    # Checking to see if multiple events from the same time and provider
                    if data['Event_Name'] not in dictOfRepeatsTime:
                        # Putting event into databases
                        eventsOutcome = db.child("events").push(data, user['idToken'])
                        putTags(db, user, event, eventsOutcome['name'])
                        dictOfRepeatsTime[data['Event_Name']] = data["Date"]
                        counter += 1
                    elif abs(int(dictOfRepeatsTime[data['Event_Name']]) - int(data['Date'])) >= millisecondsInADay:
                        # Putting event into databases if time is greater than a day
                        print(abs(int(dictOfRepeatsTime[data['Event_Name']]) - int(data['Date'])))
                        eventsOutcome = db.child("events").push(data, user['idToken'])
                        putTags(db, user, event, eventsOutcome['name'])
                        dictOfRepeatsTime[data['Event_Name']] = data["Date"]
                        counter += 1
                    else:
                        print(abs(int(dictOfRepeatsTime[data['Event_Name']]) - int(data['Date'])))
                        print("Repeat, skipping this event.")
                    dictOfNameAndPlace[eventNameAndLocationString] = 1
                else:
                    if dictOfNameAndPlace[eventNameAndLocationString] < eventNameAndLocationCap:
                        # Checking to see if multiple events from the same time and provider
                        if data['Event_Name'] not in dictOfRepeatsTime:
                            # Putting event into databases
                            eventsOutcome = db.child("events").push(data, user['idToken'])
                            putTags(db, user, event, eventsOutcome['name'])
                            dictOfRepeatsTime[data['Event_Name']] = data["Date"]
                            counter += 1
                            dictOfNameAndPlace[eventNameAndLocationString] += 1
                        elif abs(int(dictOfRepeatsTime[data['Event_Name']]) - int(data['Date'])) >= millisecondsInADay:
                            # Putting event into databases if time is greater than a day
                            # print(abs(int(dictOfRepeatsTime[data['Event_Name']]) - int(data['Date'])))
                            eventsOutcome = db.child("events").push(data, user['idToken'])
                            putTags(db, user, event, eventsOutcome['name'])
                            dictOfRepeatsTime[data['Event_Name']] = data["Date"]
                            counter += 1
                            dictOfNameAndPlace[eventNameAndLocationString] += 1
                        else:
                            pass
                            # print(abs(int(dictOfRepeatsTime[data['Event_Name']]) - int(data['Date'])))
                            # print("Repeat, skipping this event.")
                    else:
                        pass
                        # print("Cap hit, not adding. " + eventNameAndLocationString)

    print("Added " + str(counter) + " events. ")

checkCommandLineArguments()
db = firebase.database()
user = setup()
listOfPlaces = searchForPlaces()
databaseEvents = getAllDatabaseEvents(db, user)
getEvents(listOfPlaces, user, db, databaseEvents)
