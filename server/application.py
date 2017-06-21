from flask import request, send_from_directory
from flask_restful import Resource
from init import application, api, db, check_token
from sqlalchemy import sa_exc
from models import *
import os, traceback

"""
Static page routes
"""

# / (root) --> marketing site home
@api.route('/')
class Home(Resource):
    def get(self):
        return send_from_directory(os.path.join('static', 'assets', 'marketing'), 'index.html')

# /admin --> admin site
@api.route('/admin')
class Admin(Resource):
    def get(self):
        return send_from_directory(os.path.join('static', 'assets'), 'index.html')

"""
General purpose routes
"""

# /login
# User logs into app, sends uid and token as headers in POST
# we check the token validity and we check to make sure the
# uid from the token matches the uid they gave us.
# TODO: find a way to refresh tokens on future requests.
@api.route('/login')
class AuthLoginHandler(Resource):
    def get(self):
        token = request.headers.get('token')
        uidFromUser = request.headers.get('uid')
        if (uidFromUser is None or token is None):
            #this should be logged.
            response = 'Missing header requirements, uid and token.'
            return response, 401
        else:
            valid = check_token(token, uidFromUser)
            if valid is True:
                response = "Login Successful"
                return response, 200
            else:
                response = "Login Unsuccessful"
                return response, 401

"""
Database oriented routes
TODO figure out which of these ought to actually be restricted to admin
"""

# /admin/locales
# Get all locales for display in the admin panel
@api.route('/admin/locales')
class AdminLocales(Resource):
    @api.login_required ## TODO add requires admin role
    def get(self):
        result = []
        for l in Locale.query.all():
            result.append(l.client_json())
        return result

# /admin/localeEvents/<int:id>
# Get all events for the locale specified by the locale id
# TODO paginate this, add pageNum url param
@api.route('/admin/localeEvents/<int:id>')
class AdminLocaleEvents(Resource):
    @api.login_required
    def get(self, id):
        result = []
        locale = Locale.query.get(id)
        if (locale):
            events = Event.query.filter(Event.locale_id == id)
            for e in events:
                result.append(e.client_json())
            return result
        else:
            return 'Locale not found', 404

# /event/<int:id>
# retrieve, update, delete interactions for existing events
@api.route('/event/<int:id>')
class CrudEvent(Resource):
    # Get the event with the specified id
    @api.login_required
    def get(self, id):
        event = Event.query.get(id)
        if event != None:
            return event.client_json()
        else:
            return 'Event not found', 404
    
    # Delete the event with the specified id
    @api.login_required ## TODO also require admin
    def delete(self, id):
        event = Event.query.get(id)
        if event != None:
            try:
                # TODO implement this via cascade relationships in models.py
                for tag in event.tags:
                    db.session.delete(tag)
                for favorite in event.get_favorites():
                    db.session.delete(favorite)
                db.session.delete(event)
                db.session.commit()
                return {
                    'status': 'SUCCESS'
                }
            except sa_exc.IntegrityError as error:
                traceback.print_tb(error.__traceback__)
                return {
                    'status': 'FAILED'
                }, 500
        else:
            return 'Event not found', 404

    # Update the event with the specified id
    @api.login_required
    def put(self, id):
        body = request.get_json()
        if body != None:
            event = Event.query.get(id)
            if event != None:
                try:
                    event.update_from_json(body)
                    db.session.commit()
                    return event.client_json()
                except (ValueError, sa_exc.SQLAlchemyError) as error:
                    traceback.print_tb(error.__traceback__)
                    return 'Invalid parameters', 400
            else:
                return 'Event not found', 404
        else:
            return 'Missing request body', 400

# /createEvent
# Create a new event from the request parameters
@api.route('/createEvent')
class CreateEvent(Resource):
    @api.login_required ## admin too
    def post(self):
        body = request.get_json()
        if body != None:
            tags = []
            if 'tags' in body:
                tags = body.pop('tags')
            event = Event()
            try:
                event.update_from_json(body)
                db.session.add(event)
                db.session.commit()
                event.set_tags(tags)
                db.session.commit()
                return event.client_json()
            except sa_exc.SQLAlchemyError as error:
                traceback.print_tb(error.__traceback__)
                return 'Failed to create event', 400
        else:
            return 'Missing request body', 404


if __name__ == '__main__':
    application.run(debug=True)
