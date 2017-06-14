from flask import request, send_from_directory
from flask_restful import Resource
from init import application, api, db
from models import User
import os

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

# TODO actual API endpoints


if __name__ == '__main__':
    application.run()
