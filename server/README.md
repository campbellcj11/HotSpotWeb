# Flask Server for HotSpot

## Setup

Virtual Environment:

Create [While in this dir]

`virtualenv --python=/your/path/to/python3.6 server_venv` (server_venv can be whatever you want)

Activate

`source server_venv/bin/activate`

Install dependencies:

`pip install -r requirements.txt`

Set required environment variables:

`export SQLALCHEMY_DATABASE_URI=postgres://user:pw@host:port/dbname`

`export FLASK_CONFIG=production` (production)

OR

`export FLASK_CONFIG=dev` (development)

## Run

`python server.py`

## Interactive DB

(Example)

`python`

`>> from models import db, User`

`>> u = User.query.all()[0]`

`>> import datetime`

`>> u.dob = datetime.datetime.now().date()`

`>> db.session.commit()`

## Recommended

- create an alias to toggle the database URI