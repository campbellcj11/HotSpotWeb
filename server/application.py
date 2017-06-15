from flask import request, send_from_directory
from flask_restful import Resource
from init import application, api, db
from models import User
import os
import firebase_admin
from firebase_admin import credentials, auth

# Firebase Setup
cred = credentials.Certificate('./service-key.json')
default_app = firebase_admin.initialize_app(cred)

# root --> marketing site home
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
@api.route('/login', methods=['POST'])
class AuthLoginHandler(Resource):
    def get(self):
        print("inside function - GET")
        return "Login Success."

    def post(self):
        token = request.headers.get('token')
        uidFromUser = request.headers.get('uid')
        if (uidFromUser is None or token is None):
            #this should be logged.
            response = 'Missing header requirements, uid and token.'
            return response, 401
        else:
            valid = self.checkToken(token, uidFromUser)
            if valid is True:
                response = "Login Successful"
                return response, 200
            else:
                response = "Login Unsuccessful"
                return response, 401

    def checkToken(self, token, uidFromUser):
        try:
            decoded_token = firebase_admin.auth.verify_id_token(token)
            if decoded_token['uid'] == uidFromUser:
                return True
            else:
                return False
        except:
            return False




# TODO actual API endpoints


if __name__ == '__main__':
    application.run(debug=True)
