#!/usr/bin/python3
import time
import pyrebase
import sys
import getpass
import requests
import psycopg2
from datetime import datetime
from facepy import GraphAPI
from os.path import expanduser

## To run this program for Atlantic City use:
#      python3 facebookEventScraper.py 39.364283 -74.422927 20 100000
## To run this program for Philadelphia use:
#      python3 facebookEventScraper.py 39.952584 -75.165222 20 100000
## To run for New York City:
#      python3 facebookEventScraper.py 40.712784 -74.005941 20 100000
# To run for Columbia:
#      python3 facebookEventScraper.py 34.000710 -81.034814 20 100000
# To run for sea isle, nj
#      python3 facebookEventScraper.py 39.153448 -74.692939 20 100000
## Now you can run this using the city name like so:
#      python3 facebookEventScraper.py NewYork 20 100000
#      python3 facebookEventScraper.py AtlanticCity 20 100000
#      python3 facebookEventScraper.py Philadelphia 20 100000
'''
Current Locales-
AC
    python3 facebookEventScraper.py 39.364283 -74.422927 20 100000
Philadelphia
    python3 facebookEventScraper.py 39.952584 -75.165222 20 100000
Camden
    python3 facebookEventScraper.py 39.925946 -75.119620 20 100000
Ocean City
    python3 facebookEventScraper.py 39.277616 -74.574600 20 100000
Avalon
    python3 facebookEventScraper.py 39.101225 39.101225 20 100000
Stone Harbor
    python3 facebookEventScraper.py 39.046407 -74.764361 20 100000
Wildwood
    python3 facebookEventScraper.py 38.991780 -74.814889 20 100000
Cape May
    python3 facebookEventScraper.py 38.935113 -74.906005 20 100000
Sea Isle City
    python3 facebookEventScraper.py 39.153448 -74.692939 20 100000
'''


# Setting up the graph api and firebase connections.
graph = GraphAPI('1738197196497592|RpbqD1owgCZ6aT7s5JOrGvp9_7Q')
# graph = GraphAPI('EAACEdEose0cBAKprAK5L4u823Jm6UbqnMueJ1WDQJfJTkqOZBEND5wgfYtx2ypQXFlZCVSrXBDyZCVASfqqQGHVc6kszwLZA71tV7a64PRgOx1ZCUS79deom19KBn8IBTNzHX2q4BZCopwc8rCasZAVuvqOVJpKAwLJvtGSzE2cW20MfXe7OuNYe7WpjVEcCjUZD')
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
# };
firebase = pyrebase.initialize_app(config)
milesIntoMetersConv = 1609.34

def checkCommandLineArguments():
    numberOfArgs = len(sys.argv)
    if (numberOfArgs != 5 and numberOfArgs != 4):
        print("Not enough command line arguements. " +
            "Please enter the arguements as shown: latitude longitude distance limit.")
        sys.exit()

def setParameters():
    numberOfArgs = len(sys.argv)
    if numberOfArgs is 4:
        if sys.argv[1].lower() == "newyork":
            centerCoordinates = '40.712784, -74.005941'
        elif sys.argv[1].lower() == "atlanticcity":
            centerCoordinates = '39.364283, -74.422927'
        elif sys.argv[1].lower() == "philadelphia":
            centerCoordinates = '39.952584, -75.165222'
        else:
            print("Invalid Parameters.")
            sys.exit()
        distanceNumber = int(sys.argv[2]) * milesIntoMetersConv
        limitNumber = sys.argv[3]
    elif numberOfArgs is 5:
        centerCoordinates = sys.argv[1] + ", " + sys.argv[2]
        distanceNumber = int(sys.argv[3]) * milesIntoMetersConv
        limitNumber = sys.argv[4]
    return [centerCoordinates, distanceNumber, limitNumber]

"""Search for places within the parameters.
Edit distance, center, and limit in order to change search results.
"""
# TODO: make AC get from db
def searchForPlaces(listOfParameters):
    listofPlaces = []
    result = graph.search(
        term = '',
        type = 'place',
        center = listOfParameters[0],
        #increase limit and distance to increase event results
        distance = listOfParameters[1],
        limit = listOfParameters[2]
    )
    for element in result['data']:
        listofPlaces.append(element['name'] + "::: " + element['id'])

    while 'paging' in result and 'next' in result['paging']:
        next = result['paging']['next']
        result = requests.get(next)
        result = result.json()
        for element in result['data']:
            stringName = element['name'] + ", " + element['id']
            if stringName in listofPlaces:
                pass
            else:
                listofPlaces.append(element['name'] + "::: " + element['id'])
    return listofPlaces

"""Parse the short description from the long description."""
def getShortDescription(longDescription):
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

"""Format data to fit database scheme."""
def formatOutput(event):

    restrictions = ''
    # Check Status
    if 'is_canceled' in event:
        if event['is_canceled'] is True:
            status = "canceled"
        else:
            status = 'active'
    else:
        status = 'active'

    #format place
    if 'place' in event and 'location' in event['place']:
        location = event['place']['location']
        if 'street' not in location or 'state' not in location or 'zip' not in location:
            return None
        else:
            address = location['street'] + ', ' + location['city'] + ', ' + location['state'] + ' ' + location['zip']
        latitude = location['latitude']
        longitude = location['longitude']
        placeName = event['place']['name']
        city = location['city']
        state = location['state']
    else:
        # No Adress information, return none
        return None

    #Check for category - THIS is needed for tag
    if 'category' not in event:
        status = 'pending'
        restrictions += 'Needs tags. '
        category = ''
    else:
        category = event['category']
        if category.endswith('_EVENT'):
            category = category[:-6]
        category = category[0] + category[1:].lower()
        category = category.replace("_", " and ").title()

    # Format Date - start date and end date
    startDateString = event['start_time']
    startDate = datetime.strptime(startDateString, '%Y-%m-%dT%H:%M:%S%z')

    if 'end_time' not in event:
        status = 'pending'
        restrictions += 'Needs end date. '
        endDate = datetime.now()
        endDateString = 'undefined'
    else:
        endDateString = event['end_time']
        endDate = datetime.strptime(endDateString, '%Y-%m-%dT%H:%M:%S%z')

    # Cover Image used for us
    if 'cover' in event:
        image = event['cover']['source']
    else:
        return None

    #check for description
    if 'description' not in event:
        return None

    # interested
    if 'interested' in event:
        numberInterested = len(event['interested']['data'])
    else:
        numberInterested = 0

    # Short Description parsing
    shortDescription = getShortDescription(event['description'])

    newData = {
        'Facebook_ID' : event['id'],
        'Event_Name' : event['name'],
        'Address' : address,
        'Start_Date' : startDate,
        'End_Date' : endDate,
        'Image' : image,
        'Latitude' : str(latitude),
        'Longitude' : str(longitude),
        'Location' : placeName,
        'Long_Description' : event['description'],
        'Status' : status,
        'Short_Description' : shortDescription,
        'Website' : ('www.facebook.com/' + event['id']),
        # TODO: need to find a better way for this
        # 'Email_Contact' : ('www.facebook.com/' + event['id']),
        'Interested' : numberInterested,
        'Category' : category,
        'Restrictions' : restrictions,
        'City' : city,
        'State' : state
    }
    return newData
""" Connect to database using credentials."""
def connectToDatabase():
    # TODO: use credentials file
    print("Connecting to database...")
    try:
        conn = psycopg2.connect(dbname="HotSpot", user="HotSpotAdmin", password="UscGrad2017", host="hotspotdb.cv91mewjlcfw.us-east-1.rds.amazonaws.com", port="5432")
        cur = conn.cursor()
    except:
        print('Could not connect to database.')
        sys.exit()
    return cur, conn

def getCurrentLocales(cur, conn):
    print("Getting Current Locales...")
    localeSql = "SELECT * FROM locales;"
    cur.execute(localeSql)
    conn.commit()
    locales = cur.fetchall()
    dictOfLocales = {}
    # Format into a city state string split by ' ::: '
    for locale in locales:
        dictOfLocales[locale[1] + " ::: " + locale[2]] = locale[0]

    # print("Got Current Locales")
    return dictOfLocales

def refreshLocales(cur, conn, data):
    # print("RefreshingLocales")
    localeInsertSql = "INSERT INTO locales (name, state, country) VALUES (%s, %s, %s);"
    localeData = (data['City'], data['State'], 'United States')
    cur.execute(localeInsertSql, localeData)
    localeSql = "SELECT * FROM locales;"
    cur.execute(localeSql)
    conn.commit()
    locales = cur.fetchall()
    dictOfLocales = {}
    for locale in locales:
        dictOfLocales[locale[1] + " ::: " + locale[2]] = locale[0]

    # print("Got Current Locales")
    return dictOfLocales

def constructTagMapping():
    tagMapping = dict()
    tagMapping['art'] = 'art'
    tagMapping['art and film'] = 'art'
    tagMapping['book'] = 'books'
    tagMapping['books and literature'] = 'books'
    tagMapping['causes'] = 'causes'
    tagMapping['fundraiser'] = 'causes'
    tagMapping['class'] = 'class'
    tagMapping['lecture'] = 'class'
    tagMapping['comedy'] = 'comedy'
    tagMapping['community'] = 'community'
    tagMapping['neighborhood'] = 'community'
    tagMapping['festival'] = 'community'
    tagMapping['home and garden'] = 'community'
    tagMapping['conference'] = 'conference'
    tagMapping['dance'] = 'dance'
    tagMapping['dining'] = 'food'
    tagMapping['food and drink'] = 'food'
    tagMapping['food and tasting'] = 'food'
    tagMapping['fitness'] = 'health'
    tagMapping['health and wellness'] = 'health'
    tagMapping['meetup'] = 'social'
    tagMapping['networking'] = 'social'
    tagMapping['family'] = 'social'
    tagMapping['event and music'] = 'social'
    tagMapping['event and party'] = 'social'
    tagMapping['event and recreation'] = 'social'
    tagMapping['event and art'] = 'social'
    tagMapping['event and film'] = 'social'
    tagMapping['event and cause'] = 'social'
    tagMapping['event and food'] = 'social'
    tagMapping['event and dance'] = 'social'
    tagMapping['event'] = 'social'
    tagMapping['games'] = 'sport'
    tagMapping['sports'] = 'sport'
    tagMapping['sports and recreation'] = 'sport'
    tagMapping['movie'] = 'movie'
    tagMapping['music'] = 'music'
    tagMapping['nightlife'] = 'nightlife'
    tagMapping['parties and nightlife'] = 'nightlife'
    tagMapping['theater'] = 'theater'
    tagMapping['theater and dance'] = 'theater'
    tagMapping['religion'] = 'religion'
    tagMapping['religious'] = 'religion'
    tagMapping['shopping'] = 'shopping'
    tagMapping['other'] = 'other'
    tagMapping['Workshop'] = 'sport'
    # ignore tagging
    tagMapping[''] = ''
    return tagMapping


"""Get event by using event ID. Then put event into database."""
def getEvents(listOfPlaces, tagMapping):
    print("Getting events of all places...")
    offsetTimeInSeconds = 7.776e+6
    ids = []
    # Loops through places to get event IDs for all events for each place - limit at 100000"""
    counterhere = 0
    for x in listOfPlaces:
        x = x.split('::: ')
        #GET command to get future events
        counterhere += 1
        currentTime = int(time.time())
        offsetDaysLimit = currentTime + offsetTimeInSeconds
        try:
            events = graph.get(x[1] + '/events', since=currentTime, until=offsetDaysLimit, limit=100000, fields='id')
        except:
            # Place not found.
            pass
        for event in events['data']:
            ids.append(event['id'])

    print("Initial count of events before formatting: " + str(len(ids)))
    print("Count of places: " + str(counterhere))

    counter = 0
    wastedEvents = 0
    duplicateCounter = 0
    dictOfRepeatsTime = dict()
    dictOfNameAndPlace = dict()
    millisecondsInADay = 8.64e+7
    eventNameAndLocationCap = 5

    dictOfLocales = getCurrentLocales(cur, conn)

    # Loop through event IDs to get all event details to put into databases"""
    for id in ids:
        event = graph.get(id, fields='id,description,name,category,cover,start_time,end_time,place,interested')
        data = formatOutput(event)
        if data is not None:
            try:
                # check if locale exists
                cityStateString = data['City'] + ' ::: ' + data['State']
                if cityStateString not in dictOfLocales:
                    print("Locale does not exist: " + cityStateString)
                    continue
                    # dictOfLocales = refreshLocales(cur, conn, data)
                    # localeID = dictOfLocales[cityStateString]
                else:
                    localeID = dictOfLocales[cityStateString]

                # check if event exists
                existingEventsSql = "SELECT * FROM events WHERE facebook_id = \'" + data['Facebook_ID'] + "\';"
                cur.execute(existingEventsSql)
                conn.commit()
                existingEventsResult = [] if cur.description is None else cur.fetchall()

                if not existingEventsResult:
                    if 'event' in data['Category'].lower():
                        data['Category'] = 'event'

                    if data['Category'].lower() not in tagMapping:
                        if data['Category'] is not '':
                            print("Tag nonexistant, please add " + data['Category'])
                            data['Restrictions'] += "Needs tag. "
                            data['Category'] = ''

                    tag = tagMapping[data['Category'].lower()]
                    sql = "INSERT INTO events (locale_id, address, start_date, end_date, name, venue_name, type, short_description, long_description, interested, status, website, facebook_id, image, restrictions) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id;"
                    sqlData = (localeID, data['Address'], data['Start_Date'], data['End_Date'], data['Event_Name'], data['Location'], 'Event', data['Short_Description'], data['Long_Description'], data['Interested'], data['Status'], data['Website'], id, data['Image'], data['Restrictions'])
                    cur.execute(sql, sqlData)
                    id_of_new_row = int(cur.fetchone()[0])
                    # only insert tag if it exists
                    if data['Category'] is not '':
                        tagSql = "INSERT INTO tags (name, event_id) VALUES (%s, %s);"
                        tagData = (tag, id_of_new_row)
                        cur.execute(tagSql, tagData)
                        conn.commit()
                    counter += 1
                    # print("Inserted " + str(counter) + " event.")
                else:
                    duplicateCounter += 1
                    # print("Duplicate Event.")
            except psycopg2.Error as e:
                print("ERROR")
                print(e)
        else:
            wastedEvents += 1
    print("Added " + str(counter) + " events. ")
    print("Wasted " + str(wastedEvents) + " events. ")
    print("Duplicate Events: " + str(duplicateCounter))
    # print("Found " + str(duplicateCounter) + " existing events in database.")

checkCommandLineArguments()
cur, conn = connectToDatabase()
listOfParameters = setParameters()
listOfPlaces = searchForPlaces(listOfParameters)
tagMapping = constructTagMapping()
# getting the database events will have to be redone
getEvents(listOfPlaces, tagMapping)

cur.close()
conn.close()
