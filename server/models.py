from init import db
from sqlalchemy.dialects.postgresql import ARRAY

# TODO add json serialize function to classes

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
    default_locale = db.Column(db.Integer, db.ForeignKey('locales.id'))
    def __repr__(self):
        return '<User id=%i u%s>' % (self.id, id(self))

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
    def __repr__(self):
        return '<Event id=%i u%s>' % (self.id, id(self))

class Locale(db.Model):
    __tablename__ = 'locales'
    id = db.Column(db.Integer, db.Sequence('locales_id_seq'), primary_key=True)
    name = db.Column(db.String)
    state = db.Column(db.String)
    country = db.Column(db.String)
    def __repr__(self):
        return '<Locale id=%i u%s>' % (self.id, id(self))

class Favorite(db.Model):
    __tablename__ = 'favorites'
    id = db.Column(db.Integer, db.Sequence('favorites_id_seq'), primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey('events.id'))
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    def __repr__(self):
        return '<Favorite id=%i u%s>' % (self.id, id(self))

class Tag(db.Model):
    __tablename__ = 'tags'
    id = db.Column(db.Integer, db.Sequence('tags_id_seq'), primary_key=True)
    name = db.Column(db.String)
    event_id = db.Column(db.Integer, db.ForeignKey('events.id'))
    def __repr__(self):
        return '<Tag id=%i u%s>' % (self.id, id(self))

class Metric(db.Model):
    __tablename__ = 'metrics'
    id = db.Column(db.Integer, db.Sequence('metrics_id_seq'), primary_key=True)
    action = db.Column(db.String)
    info = db.Column(db.String)
    user_id = db.Column(db.String, db.ForeignKey('users.id'))
    def __repr__(self):
        return '<Metric id=%i u%s>' % (self.id, id(self))