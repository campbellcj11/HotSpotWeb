from init import db
from sqlalchemy.dialects.postgresql import ARRAY
from datetime import datetime
import time

# users table
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, db.Sequence('users_id_seq'), primary_key=True)
    roles = db.Column(ARRAY(db.String), default=['user'])
    dob = db.Column(db.DateTime)
    email = db.Column(db.String)
    first_name = db.Column(db.String)
    last_name = db.Column(db.String)
    phone = db.Column(db.String)
    last_login = db.Column(db.DateTime, default=db.func.now())
    gender = db.Column(db.String)
    profile_image = db.Column(db.String)
    locales = db.Column(ARRAY(db.Integer))
    uid = db.Column(db.String, unique=True)
    interests = db.Column(ARRAY(db.String))

    # relationships
    favorites = db.relationship('Favorite', backref='favorites')

    # other
    updateable_fields = [
        'dob', 'email', 'first_name', 'last_name',
        'phone', 'gender'
    ]

    def get_locales(self):
        result = []
        if (self.locales != None):
            for id in self.locales:
                result.append(Locale.query.get(id))
        return result

    def get_locale_jsons(self):
        result = []
        if (self.locales != None):
            for id in self.locales:
                result.append(Locale.query.get(id).client_json())
        return result

    def __repr__(self):
        return '<User id=%i u%s>' % (self.id, id(self))

    def client_json(self):
        return {
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'phone': self.phone,
            'profile_image': self.profile_image,
            'locales': self.get_locale_jsons(),
            'interests': self.interests,
            'dob' : time.mktime(self.dob.timetuple()),
            'id' : self.id
        }

    def admin_json(self):
        json = self.client_json()
        json['roles'] = self.roles
        json['last_login'] = self.last_login
        json['id'] = self.id
        return json

# events table
class Event(db.Model):
    __tablename__ = 'events'
    id = db.Column(db.Integer, db.Sequence('events_id_seq'), primary_key=True)
    locale_id = db.Column(db.Integer, db.ForeignKey('locales.id'))
    address = db.Column(db.String)
    start_date = db.Column(db.DateTime, default=db.func.now())
    end_date = db.Column(db.DateTime, default=db.func.now())
    name = db.Column(db.String)
    venue_name = db.Column(db.String)
    type = db.Column(db.String, default='event') # event/advertisement
    short_description = db.Column(db.String)
    long_description = db.Column(db.String)
    interested = db.Column(db.Integer, default=0)
    status = db.Column(db.String, default='active')
    website = db.Column(db.String)
    facebook_id = db.Column(db.String)
    image = db.Column(db.String)
    phone_contact = db.Column(db.String)
    email_contact = db.Column(db.String)
    price = db.Column(db.Float, default=0)
    editors_pick = db.Column(db.Boolean, default=False)
    restrictions = db.Column(db.String)

    # relationships
    tags = db.relationship('Tag', backref='events')
    locale = db.relationship('Locale', uselist=False)

    # non db fields
    updateable_fields = [
        'locale_id', 'address', 'start_date', 'end_date', 'name',
        'venue_name', 'type', 'short_description', 'long_description',
        'status', 'website', 'image', 'phone_contact', 'email_contact',
        'price', 'editors_pick', 'tags'
    ]

    # requires function because favorites can only be backreffed to one table (users in this case)
    def get_favorites(self):
        favs = []
        for f in Favorite.query.filter(Favorite.event_id == self.id):
            favs.append(f)
        return favs

    def get_tags(self):
        result = []
        if self.tags != None:
            for t in self.tags:
                result.append(t.name)
        return result


    def set_tags(self, tagStringArray):
        for tag in self.tags:
            db.session.delete(tag)
        for tagName in tagStringArray:
            db.session.add(Tag(event_id=self.id, name=tagName))

    def __repr__(self):
        return '<Event id=%i u%s>' % (self.id, id(self))

    def client_json(self):
        return {
            'id': self.id,
            'address': self.address,
            'start_date': toUnixTime(self.start_date),
            'end_date': toUnixTime(self.end_date),
            'name': self.name,
            'venue_name': self.venue_name,
            'type': self.type,
            'short_description': self.short_description,
            'long_description': self.long_description,
            'interested': self.interested,
            'website': self.website,
            'image': self.image,
            'phone_contact': self.phone_contact,
            'email_contact': self.email_contact,
            'price': self.price,
            'editors_pick': self.editors_pick,
            'tags': self.get_tags(),
            'locale': self.locale.client_json(),
            'status': self.status,
            'restrictions': self.restrictions
        }

    def update_from_json(self, json):
        try:
            for key in json:
                if key in self.updateable_fields:
                    if key == 'start_date' or key == 'end_date':
                        json[key] = toDateTime(json[key])
                    if key == 'tags':
                        self.set_tags(json[key])
                    else:
                        setattr(self, key, json[key])
                else:
                    raise ValueError()
        except:
            raise ValueError('An invalid event field or value was attempted to be set.')

# locales table
class Locale(db.Model):
    __tablename__ = 'locales'
    id = db.Column(db.Integer, db.Sequence('locales_id_seq'), primary_key=True)
    name = db.Column(db.String)
    state = db.Column(db.String)
    country = db.Column(db.String)

    def __repr__(self):
        return '<Locale id=%i u%s>' % (self.id, id(self))

    def client_json(self):
        return {
            'id': self.id,
            'name': self.name,
            'state': self.state,
            'country': self.country
        }

# favorites table
class Favorite(db.Model):
    __tablename__ = 'favorites'
    id = db.Column(db.Integer, db.Sequence('favorites_id_seq'), primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey('events.id'))
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))

    # relationships
    event = db.relationship('Event', uselist=False)
    user = db.relationship('User', uselist=False)

    def __repr__(self):
        return '<Favorite id=%i u%s>' % (self.id, id(self))

    def client_json(self):
        return {
            'id': self.id,
            'event_id': self.event_id,
            'user_id': self.user_id
        }

# tags table
class Tag(db.Model):
    __tablename__ = 'tags'
    id = db.Column(db.Integer, db.Sequence('tags_id_seq'), primary_key=True)
    name = db.Column(db.String)
    event_id = db.Column(db.Integer, db.ForeignKey('events.id'))

    #relationships
    event = db.relationship('Event', uselist=False)

    def __repr__(self):
        return '<Tag id=%i u%s>' % (self.id, id(self))

    def client_json(self):
        return {
            'id': self.id,
            'name': self.name,
            'event_id': self.event_id
        }

# metrics table
class Metric(db.Model):
    __tablename__ = 'metrics'
    id = db.Column(db.Integer, db.Sequence('metrics_id_seq'), primary_key=True)
    action = db.Column(db.String)
    info = db.Column(db.String)
    user_id = db.Column(db.String, db.ForeignKey('users.id'))

    # relationships
    user = db.relationship('User', uselist=False)

    def __repr__(self):
        return '<Metric id=%i u%s>' % (self.id, id(self))

    def client_json(self):
        return {
            'id': self.id,
            'action': self.action,
            'info': self.info,
            'user_id': self.user_id,
            'user': self.user.admin_json()
        }

# feedback table
class Feedback(db.Model):
    __tablename__ = 'feedback'
    id = db.Column(db.Integer, db.Sequence('feedback_id_seq'), primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    type = db.Column(db.String) # BUG_REPORT, FEATURE_REQUEST, INACCURATE_EVENT_INFO, OTHER
    message = db.Column(db.String)

    def __repr__(self):
        return '<Feedback id=%i u%s>' % (self.id, id(self))

# convert datetime object to Unix timestamp integer
def toUnixTime(datetime):
    return int(datetime.timestamp() * 1000)

# convert Unix timestamp integer to datetime object
def toDateTime(unixTime):
    return datetime.fromtimestamp(int(unixTime / 1000))
