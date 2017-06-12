from flask import request
from flask_restful import Resource
from init import app, api, db
from models import User

@api.route('/')
class HelloWorld(Resource):
    def get(self):
        return {
            'test': 'result'
        }
    def post(self):
        return request.get_json()

@api.route('/<int:id>')
class WithParams(Resource):
    @api.login_required
    def get(self, id):
        print("op in wrapped function")
        return id

if __name__ == '__main__':
    app.run()