from flask import request, send_from_directory
from flask_restful import Resource
from init import application, api, db, check_token
from models import *
import os

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
Routes for the admin panel
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

# /admin/event/<int:id>
# Get the event with the specified id
# Includes extra information not available to a user requesting an event
@api.route('/admin/event/<int:id>')
class AdminEvent(Resource):
    @api.login_required
    def get(self, id):
        event = Event.query.get(id)
        if (event != None):
            return event.client_json()
        else:
            return 'Event not found', 404

if __name__ == '__main__':
    application.run(debug=True)
