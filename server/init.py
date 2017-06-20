from flask import Flask, request
from flask_restful import Api
import types
from functools import wraps
from flask_sqlalchemy import SQLAlchemy
from config import config
import firebase_admin
from firebase_admin import credentials, auth

# Firebase Setup
cred = credentials.Certificate('./service-key.json')
default_app = firebase_admin.initialize_app(cred)

# Flask initialization/config
application = Flask(__name__)
application.config.from_object(config)
db = SQLAlchemy(application)
api = Api(application)

# allow method directors above flask_restful functions like standard flask
def api_route(self, *args, **kwargs):
    def wrapper(_class):
        self.add_resource(_class, *args, **kwargs)
        return _class
    return wrapper

api.route = types.MethodType(api_route, api)

# check if firebase token matches stated user identity
def check_token(token, uidFromUser):
    try:
        decoded_token = firebase_admin.auth.verify_id_token(token)
        if decoded_token['uid'] == uidFromUser:
            return True
        else:
            return False
    except:
        return False

# decorator to specify that authentication is required
def login_required(self, f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        """ disabled for now during testing
        token = request.headers.get('token')
        uidFromUser = request.headers.get('uid')
        if (uidFromUser is None or token is None):
            #this should be logged.
            response = 'Missing header requirements, uid and token.'
            return response, 401
        else:
            if (check_token(token, uidFromUser)):
                 r = f(*args, **kwargs)
            else:
                return 'Failed to authenticate user', 401   
        """
        r = f(*args, **kwargs) 
        # consider logging here if necessary
        return r
    return wrapper

api.login_required = types.MethodType(login_required, api)

# decorator to specify auth roles (TODO use 403 Forbidden if this fails)
## instead of a new decorator, add an array of scopes ex. ['user', 'admin'] as
## a parameter to the login_required decorator, ['user'] is default