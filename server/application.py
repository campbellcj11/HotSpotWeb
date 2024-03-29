from flask import request, send_from_directory, jsonify
from flask_restful import Resource
from init import application, api, db, check_token
from models import *
import os, traceback, sqlalchemy, time, json

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
                # Get user from DB
                kwargs = {'uid': uidFromUser}
                u = User.query.filter_by(**kwargs).first()
                response = "Login Successful"
                # return response, 200, u.client_json()
                if u is not None:
                    return {
                        "response" : response,
                        "user" : u.client_json()
                    }
                else:
                    response = "Unknown error"
                    return response, 401
            else:
                response = "Login Unsuccessful"
                return response, 401

"""
Database oriented routes
TODO figure out which of these ought to actually be restricted to admin
"""

# /locales
# Get all locales as an array
@api.route('/locales')
class GetLocales(Resource):
    @api.login_required
    def get(self):
        result = []
        for l in Locale.query.all():
            result.append(l.client_json())
        return result
    def post(self):
        body = request.get_json()
        if body != None:
            ids = []
            if 'ids' in body:
                ids = body.pop('ids')
            for element in ids:
                locales = Locale.query.filter(Locale.id.in_(ids))
                results = [q.client_json() for q in list(locales.all())]
                return results
        else:
            return 'Missing locale IDs', 404
# /locale/<int:id>
# Get the locale by id
@api.route('/locale/<int:id>')
class GetLocale(Resource):
    @api.login_required
    def get(self, id):
        locale = Locale.query.get(id)
        if locale != None:
            return locale.client_json()
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
            except sqlalchemy.exc.IntegrityError as error:
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
                except (ValueError, sqlalchemy.exc.SQLAlchemyError) as error:
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
            except sqlalchemy.exc.SQLAlchemyError as error:
                traceback.print_tb(error.__traceback__)
                return 'Failed to create event', 400
        else:
            return 'Missing request body', 404

# /getEvents
# Syntax:
"""
    {
        "tags": {string []}, events returned include at least one of these tags
        "sortBy": {string}, field name,
        "sortOrder": {string}, default 'ASC' if sortBy is given,
        "pageSize": {int} default 50, page size,
        "pageNumber": {int} default 1, page number,
        "count": {boolean} whether to return the number of total results, useful when paginating
        "query": [
            {
                "field": {string}, field name,
                "operator": {string}, default '='
                "value": {string}, expected field value,
                "logicAfter": {string}, default 'AND', 'OR' or 'AND'
            },
            ...
        ]
    }
"""
# Handle event queries
@api.route('/getEvents')
class EventQueries(Resource):
    allowed_operators = ['=', '<', '<=', '>', '>=', '!=', '<>', 'LIKE']

    @api.login_required
    def post(self):
        body = request.get_json()
        if 'query' not in body:
            raise ValueError('Missing parameter "query"')
        try:
            start = time.clock()
            # filter by tags
            query = self.filter_by_tags(Event.query, body)
            # execute query
            query = self.construct_query(query, body['query'])
            # sort
            query = self.sort(query, body)
            # get count (before pagination)
            count = query.count()
            # paginate
            query = self.paginate(query, body)
            # create result array
            results = [q.client_json() for q in list(query.all())]
            # log perf
            end = time.clock()
            print("Found {} results in {:.4f} seconds".format(count, end - start))
            # if count, return number of results in addition to array
            if 'count' in body and body['count']:
                return {
                    "count": count,
                    "events": results
                }
            else: # else return event json array
                return results
        except ValueError as error:
            return {
                'error': str(error)
            }, 400

    # Restrict query to events containing at least one of the specified tags
    def filter_by_tags(self, query, json):
        if 'tags' not in json:
            return query
        else:
            tagNames = json['tags']
            expressions = [Tag.name.ilike(name) for name in tagNames]
            tags = Tag.query.filter(sqlalchemy.or_(*tuple(expressions))).all()
            eventIds = [t.event_id for t in tags]
            return query.filter(Event.id.in_(eventIds))

    # Paginate query based on the parameters of the input JSON
    def paginate(self, query, json):
        if 'pageSize' not in json:
            return query
        else:
            pageSize = int(json['pageSize'])
            pageNumber = int(json['pageNumber']) - 1 if 'pageNumber' in json else 0
            return query.limit(pageSize).offset(pageSize * pageNumber)

    # Sort query based on the parameters of the input JSON
    def sort(self, query, json):
        if 'sortBy' not in json:
            return query
        else:
            column = json['sortBy']
            order = json['sortOrder'] if 'sortOrder' in json else 'ASC'
            if order == 'ASC':
                return query.order_by(getattr(Event, column))
            elif order == 'DESC':
                return query.order_by(getattr(Event, column).desc())
            else:
                raise ValueError('Invalid sortOrder: {}'.format(order))

    # Convert the JSON query's field, operator, and value into a
    # SQLAlchemy BinaryExpression
    def query_json_to_expression(self, query):
        if 'operator' not in query:
            query['operator'] = '='
        if query['operator'] in self.allowed_operators:
            try:
                col = getattr(Event, query['field'])
            except AttributeError:
                raise ValueError('Invalid query field {}'.format(query['field']))
            if query['field'] == 'start_date' or query['field'] == 'end_date':
                query['value'] = toDateTime(query['value'])
            if query['operator'] == 'LIKE':
                op = col.like
            return col.op(query['operator'])(query['value'])
        else:
            raise ValueError('Invalid operator {}'.format(query['operator']))

    # Additively apply the queryGroup's filters to the base query
    def apply_filter_group(self, base, queryGroup):
        orArray = []
        for query in queryGroup:
            if len(queryGroup) == 1:
                return base.filter(self.query_json_to_expression(query))
            else:
                orArray.append(self.query_json_to_expression(query))
        if len(queryGroup) == 0:
            return base
        else:
            return base.filter(sqlalchemy.or_(*tuple(orArray)))

    # Construct a SQLAlchemy query object based on the query array from the request JSON
    # OR and AND statements are handled by breaking queries into groups, where an AND
    # group has length 1 and an OR group has length > 1
    def construct_query(self, baseQuery, queryArray):
        queryGroups = [[]]
        for query in queryArray:
            queryGroups[len(queryGroups) - 1].append(query)
            if 'logicAfter' not in query or query['logicAfter'] == 'AND':
                queryGroups.append([])
            elif query['logicAfter'] != 'OR':
                raise ValueError('Invalid "logicAfter" query')
        for group in queryGroups:
            baseQuery = self.apply_filter_group(baseQuery, group)
        return baseQuery

"""
App specific queries
"""

# /toggleFavorite
# also increments decrement interested count of event
@api.route('/toggleFavorite')
class ToggleFavorite(Resource):
    @api.login_required
    def post(self):
        body = request.get_json()
        if body != None or 'user_id' not in body or 'event_id' not in body:
            u_id = body['user_id']
            e_id = body['event_id']
            exp = sqlalchemy.and_(Favorite.user_id == u_id, Favorite.event_id == e_id)
            search = Favorite.query.filter(exp)
            try:
                if len(list(search.all())) == 1: # already favorited
                    # remove favorite entry
                    fav = search.first()
                    db.session.delete(fav)
                    # decrement interested count for the event
                    event = Event.query.get(e_id)
                    event.interested = event.interested - 1
                    # commit changes
                    db.session.commit()
                    return {
                        "isFavorite": False
                    }
                else: # not yet favorited
                    # create new favorite
                    fav = Favorite(event_id=e_id, user_id=u_id)
                    db.session.add(fav)
                    # increment interested count for the event
                    event = Event.query.get(e_id)
                    event.interested = event.interested + 1
                    # commit changes
                    db.session.commit()
                    return {
                        "isFavorite": True
                    }
            except sqlalchemy.exc.IntegrityError as error:
                traceback.print_tb(error.__traceback__)
                return {
                    'error': str(error)
                }
        else:
            return {
                'error': 'Missing required parameters'
            }, 400

# /getFavoritedEvents/<int:user_id>
@api.route('/getFavoritedEvents/<int:user_id>')
class GetFavorites(Resource):
    @api.login_required
    def post(self, user_id):
        if request.data:
            body = request.get_json()
        else:
            body = {}
        try:
            startDate = toDateTime(body['startDate']) if 'startDate' in body else datetime.now()
            pageSize = int(body['pageSize']) if 'pageSize' in body else 20
            pageNumber = int(body['pageNumber']) - 1 if 'pageNumber' in body else 0
            favs = list(Favorite.query.filter(Favorite.user_id == user_id).all())
            expressions = [Event.id.op('=')(fav.event_id) for fav in favs]
            # filter by events to those favorite by user
            events = Event.query.filter(sqlalchemy.or_(*tuple(expressions)))
            # remove events before startDate
            events = events.filter(Event.start_date >= datetime.now())
            # sort events
            events = events.order_by(Event.start_date)
            # paginate
            events = events.limit(pageSize).offset(pageSize * pageNumber)
            # return results
            return [event.client_json() for event in events]
        except sqlalchemy.exc.SQLAlchemyError as error:
            traceback.print_tb(error.__traceback__)
            return {
                'error': str(error)
            }, 400

# /setUserLocales
@api.route('/setUserLocales/<int:id>')
class SetUserLocales(Resource):
    @api.login_required
    def post(self, id):
        body = request.get_json()
        user = User.query.get(id)
        if user != None:
            try:
                self.verify_locale_array(body)
                user.locales = body
                db.session.commit()
                return 'success'
            except (ValueError, sqlalchemy.exc.IntegrityError) as error:
                traceback.print_tb(error.__traceback__)
                return {
                    'error': str(error)
                }
        else:
            return {
                'error': 'User not found'
            }, 404

    def verify_locale_array(self, array):
        if len(array) > 0:
            for l_id in array:
                if Locale.query.get(l_id) == None:
                    raise ValueError('Locale not found: {}'.format(l_id))
        else:
            raise ValueError('At least one locale must be specified')


# /setUserInterests
@api.route('/setUserInterests/<int:id>')
class SetUserInterests(Resource):
    allowed_interests = [
        "art", "books", "causes", "class", "comedy", "community",
        "conference", "dance", "food", "health", "social", "sports",
        "movie", "music", "nightlife", "theater", "religion",
        "shopping", "other"
    ]

    @api.login_required
    def post(self, id):
        body = request.get_json()
        user = User.query.get(id)
        if user != None:
            try:
                self.verify_tag_array(body)
                user.interests = body
                db.session.commit()
                return 'success'
            except (ValueError, sqlalchemy.exc.IntegrityError) as error:
                traceback.print_tb(error.__traceback__)
                return {
                    'error': str(error)
                }
        else:
            return {
                'error': 'User not found'
            }, 404

    def verify_tag_array(self, array):
        if len(array) > 0:
            for tag in array:
                if tag.lower() not in self.allowed_interests:
                    raise ValueError('Invalid interest: {}'.format(tag))
        else:
            raise ValueError('At least one locale must be specified')

# /feedback
@api.route('/feedback')
class SubmitFeedback(Resource):
    @api.login_required
    def post(self):
        body = request.get_json()
        try:
            fav = Feedback(user_id=body['user_id'], type=body['type'], message=body['message'])
            db.session.add(fav)
            db.session.commit()
            return {
                'message': 'Feedback submitted successfully.'
            }
        except (sqlalchemy.exc.SQLAlchemyError, KeyError) as error:
            traceback.print_tb(error.__traceback__)
            return {
                'error': str(error)
            }, 400

# /user/<int:id>
@api.route('/user/update/<int:id>')
class UpdateUser(Resource):
    @api.login_required
    def put(self, id):
        body = request.get_json()
        u = User.query.get(id)
        if u != None:
            try:
                for key in body:
                    if key in u.updateable_fields:
                        setattr(u, key, body[key])
                    else:
                        raise ValueError('Invalid field: {}'.format(key))
                db.session.commit()
                return 'Update suceeded'
            except (ValueError, sqlalchemy.exc.SQLAlchemyError) as error:
                traceback.print_tb(error.__traceback__)
                return {
                    'error': str(error)
                }, 400
        else:
            return {
                'error': 'User not found'
            }, 404

# /users/emails
@api.route('/users/emails')
class GetAllUserEmails(Resource):
    @api.login_required
    def get(self):
        response = 'Returning all emails of all users.'
        users = User.query.all()
        emails = []
        for user in users:
            emails.append(user.email)
        return {
            "response" : response,
            "emails" : json.dumps(emails)
        }

# /user/create
# pair with /user/uploadProfileImage
# TODO use firebase admin to check that uid is registered with firebase, otherwise throw error
@api.route('/user/create')
class CreateUser(Resource):
    required_keys = [
        'email', 'first_name', 'last_name',
        'locales', 'uid', 'interests'
    ]

    optional_keys = [
        'phone', 'dob', 'gender'
    ]

    def post(self):
        body = request.get_json()
        print(request.is_json)
        print(body)
        if body != None:
            for key in self.required_keys:
                if key not in body:
                    raise ValueError('Missing required key: {}'.format(key))
            try:
                user = User(
                    email=body['email'],
                    first_name=body['first_name'],
                    last_name=body['last_name'],
                    uid=body['uid'],
                    locales=body['locales'],
                    interests=body['interests']
                )
                for key in self.optional_keys:
                    if key in body:
                        if key is 'dob':
                            setattr(user, key, toDateTime(body['dob']))
                        else:
                            setattr(user, key, body[key])
                db.session.add(user)
                db.session.commit()
                return {
                    'message': 'User created successfully'
                }
            except sqlalchemy.exc.SQLAlchemyError as error:
                traceback.print_tb(error.__traceback__)
                return {
                    'error': str(error)
                }, 400
        else:
            return 'Missing body', 400

# TODO /user/uploadProfileImage/<int:user_id>

if __name__ == '__main__':
    application.run(debug=True)
