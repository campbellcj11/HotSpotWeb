from flask import Flask, request
from flask_restful import Api
import types
from functools import wraps
from flask_sqlalchemy import SQLAlchemy
from config import config


application = Flask(__name__)
application.config.from_object(config)
db = SQLAlchemy(application)
api = Api(application)

# TODO consider moving decorators to separate file (e.g. decorators)

# allow method directors above flask_restful functions like standard flask
def api_route(self, *args, **kwargs):
    def wrapper(_class):
        self.add_resource(_class, *args, **kwargs)
        return _class
    return wrapper

api.route = types.MethodType(api_route, api)

# decorator to specify that authentication is required
def login_required(self, f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        print("op before wrapped function")
        # TODO do auth
        # call function if successful, otherwise, return 401 Unauthorized
        # Felt this was unneccesary unless it was async, maybe come back to this?
        # calls original function
        r = f(*args, **kwargs)
        print("op after wrapped function")
        return r
    return wrapper

api.login_required = types.MethodType(login_required, api)

# decorator to specify auth roles (TODO use 403 Forbidden if this fails)
