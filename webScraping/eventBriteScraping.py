from eventbrite import Eventbrite
from bs4 import BeautifulSoup
import sys, psycopg2
eventbrite = Eventbrite('3DFUMKJHM7JBPUDAWUJY')

'''
Current Locales-
AC
    python3 eventBriteScraping.py 39.364283 -74.422927
Philadelphia
    python3 eventBriteScraping.py 39.952584 -75.165222
Camden
    python3 eventBriteScraping.py 39.925946 -75.119620
Ocean City
    python3 eventBriteScraping.py 39.277616 -74.574600
Avalon
    python3 eventBriteScraping.py 39.101225 39.101225
Stone Harbor
    python3 eventBriteScraping.py 39.046407 -74.764361
Wildwood
    python3 eventBriteScraping.py 38.991780 -74.814889
Cape May
    python3 eventBriteScraping.py 38.935113 -74.906005
Sea Isle City
    python3 eventBriteScraping.py 39.153448 -74.692939
'''

""" Connect to database using credentials."""
def connectToDatabase():
    print("Connecting to database...")
    try:
        conn = psycopg2.connect(dbname="HotSpot", user="HotSpotAdmin", password="UscGrad2017", host="hotspotdb.cv91mewjlcfw.us-east-1.rds.amazonaws.com", port="5432")
        cur = conn.cursor()
    except:
        print('Could not connect to database.')
        sys.exit()
    return cur, conn

def checkCommandLineArguments():
    numberOfArgs = len(sys.argv)
    if (numberOfArgs != 3):
        print("Not enough command line arguements. " +
            "Please enter the arguements as shown: latitude longitude.")
        sys.exit()

def setParameters():
    numberOfArgs = len(sys.argv)
    latitude = float(sys.argv[1])
    longitude = float(sys.argv[2])
    return latitude,longitude

def getCurrentLocales():
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

def refreshLocales(data):
    # print("RefreshingLocales")
    localeInsertSql = "INSERT INTO locales (name, state, country) VALUES (%s, %s, %s);"
    localeData = (data['city'], data['state'], 'United States')
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

def getEvents(this_latitude, this_longitude):
    totalEvents = []
    # get events within 10 miles
    events = eventbrite.event_search(**{
        'location.latitude': this_latitude,
        'location.longitude': this_longitude,
        'location.within' : '10mi'
    })
    if 'error' in events:
        if events['error'] == 'HIT_RATE_LIMIT':
            print("HIT RATE LIMIT.")
            sys.exit()
        else:
            print(events['error'])
            sys.exit()

    for x in events['events']:
        totalEvents.append(x)

    totalPages = events['pagination']['page_count']
    startPage = 2
    while startPage <= totalPages:
        events = eventbrite.event_search(**{
            'location.latitude': this_latitude,
            'location.longitude': this_longitude,
            'location.within' : '10mi',
            'page' : startPage
        })
        for x in events['events']:
            # print(x)
            totalEvents.append(x)
        startPage += 1

    return totalEvents

def getVenueInfo(venue_id):
    try:
        venue = eventbrite.get('/venues/' + str(venue_id))
        address_line1 = venue['address']['address_1'].title()
        city = venue['address']['city'].title()
        zipCode = venue['address']['postal_code']
        if len(venue['address']['region']) > 2:
            state = venue['address']['region'].title()
        else:
            state = venue['address']['region']
        address = address_line1 + ', ' + city + ', ' + state + ' ' + zipCode
        returnVenue = {
            'name' : venue['name'],
            'address' : address,
            'city' : city,
            'state' : state
        }
        return returnVenue
    except Exception as e:
        print("Could not find venue: " + e)
        return None

def parseDescription(description):
    soup = BeautifulSoup(description, "html.parser")
    paras = soup.find_all('p')
    fullDescription = ''
    for para in paras:
        paraText = para.getText()
        if len(paraText) > 3:
            if paraText[-1:] == '.' or paraText[-1:] == '!':
                fullDescription += (para.getText() + ' ')
            else:
                fullDescription += (para.getText() + '. ')
    return fullDescription

def constructTagMapping():
    tagMapping = dict()
    tagMapping['art'] = 'art'
    tagMapping['arts'] = 'art'
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
    tagMapping['family & education'] = 'community'
    tagMapping['conference'] = 'conference'
    tagMapping['dance'] = 'dance'
    tagMapping['dining'] = 'food'
    tagMapping['food and drink'] = 'food'
    tagMapping['food & drink'] = 'food'
    tagMapping['food and tasting'] = 'food'
    tagMapping['fitness'] = 'health'
    tagMapping['health'] = 'health'
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
    tagMapping['sports & fitness'] = 'sport'
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
    tagMapping['film & media'] = 'film'
    tagMapping['charity & causes'] = 'community'
    tagMapping['business'] = 'conference'
    tagMapping['spirituality'] = 'religion'
    tagMapping['science & tech'] = 'tech'
    tagMapping['travel & outdoor'] = 'sport'
    tagMapping['fashion'] = 'fashion'
    tagMapping['auto, boat & air'] = 'sport'
    tagMapping['government'] = 'community'
    tagMapping['home & lifestyle'] = 'other'
    tagMapping['holiday'] = 'social'
    tagMapping['hobbies'] = 'other'

    return tagMapping

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

def getCurrentDatabaseEvents():
    # check if event exists
    existingEventsSql = "SELECT website FROM events WHERE website LIKE \'%eventbrite.com%\';"
    cur.execute(existingEventsSql)
    conn.commit()
    existingEventsResult = [] if cur.description is None else cur.fetchall()
    returnEvents = {}
    for element in existingEventsResult:
        returnEvents[element[0]] = True
    return returnEvents


def formatEvents(totalEvents, tagMapping):
    dictOfLocales = getCurrentLocales()
    currentDatabaseEvents = getCurrentDatabaseEvents()
    throwAwayCounter = 0
    addedCounter = 0
    duplicateEventsCounter = 0
    print("Total Events: " + str(len(totalEvents)))
    for event in totalEvents:
        # locale_id, address, start_date, end_date, name, type, venue_name
        # short_description, long_description, status, website
        # image, price
        try:
            venue_id = event['venue_id']
            venue = getVenueInfo(venue_id)
            start_date = event['start']['utc']
            end_date = event['end']['utc']
            name = event['name']['html']
            event_type = 'Event'
            long_description = parseDescription(event['description']['html'])
            short_description = getShortDescription(long_description)
            # PENDING for now
            status = 'pending'
            website = event['url']
            #image
            image = event['logo']['url']
            #category
            category_id = event['category_id']
            category = eventbrite.get('/categories/' + str(category_id))
            tag = category['short_name'].lower()
            if tag not in tagMapping:
                print("Tag nonexistant, please add " + tag)
                continue
            else:
                tag = tagMapping[tag]
            # localeID
            if venue['state'] == 'New Jersey':
                cityStateString = venue['city'] + ' ::: NJ'
            elif venue['state'] == 'Pennsylvania':
                cityStateString = venue['city'] + ' ::: PA'
            else:
                cityStateString = venue['city'] + ' ::: ' + venue['state']
        except Exception as e:
            print(e)
            throwAwayCounter += 1
            continue
        if cityStateString not in dictOfLocales:
            print('Locale does not exist: ' + venue['city'])
            # dictOfLocales = refreshLocales(venue)
            # localeID = dictOfLocales[cityStateString]
            throwAwayCounter += 1
            pass
        else:
            localeID = dictOfLocales[cityStateString]
            if website not in currentDatabaseEvents:
                print("Adding.")
                sql = "INSERT INTO events (locale_id, address, start_date, end_date, name, venue_name, type, short_description, long_description, status, website, image) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id;"
                sqlData = (localeID, venue['address'], start_date, end_date, name, venue['name'], 'Event', short_description, long_description, status, website, image)
                cur.execute(sql, sqlData)
                id_of_new_row = int(cur.fetchone()[0])
                tagSql = "INSERT INTO tags (name, event_id) VALUES (%s, %s);"
                tagData = (tag, id_of_new_row)
                cur.execute(tagSql, tagData)
                conn.commit()
                addedCounter += 1
            else:
                duplicateEventsCounter += 1
                print('Duplicate. Not adding.')

    return (addedCounter, throwAwayCounter, duplicateEventsCounter)


checkCommandLineArguments()
current_latitude, current_longitude = setParameters()
cur, conn = connectToDatabase()
tagMapping = constructTagMapping()
totalEvents = getEvents(current_latitude, current_longitude)
addedCounter, throwAwayCounter, duplicateEventsCounter = formatEvents(totalEvents, tagMapping)
print("Added counter: " + str(addedCounter))
print("Throw away counter: " + str(throwAwayCounter))
print("Duplicate counter: " + str(duplicateEventsCounter))
