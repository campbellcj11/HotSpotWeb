from init import db
from sqlalchemy.dialects.postgresql import ARRAY

# users table
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, db.Sequence('users_id_seq'), primary_key=True)
    roles = db.Column(ARRAY(db.String))
    dob = db.Column(db.DateTime)
    email = db.Column(db.String)
    first_name = db.Column(db.String)
    last_name = db.Column(db.String)
    phone = db.Column(db.String)
    last_login = db.Column(db.DateTime, default=db.func.now())
    gender = db.Column(db.String)
    profile_image = db.Column(db.String)
    locales = db.Column(ARRAY(db.Integer))

    # relationships
    favorites = db.relationship('Favorite', backref='favorites')

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
            'locales': self.get_locale_jsons()
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

    # relationships
    tags = db.relationship('Tag', backref='events')
    locale = db.relationship('Locale', uselist=False)

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
            'tags': self.tags,
            'locale': self.locale.client_json()
        }

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

# convert datetime object to Unix timestamp integer
def toUnixTime(datetime):
    return int(datetime.timestamp() * 1000)