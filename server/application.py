from flask import request, send_from_directory
from flask_restful import Resource
from init import application, api, db, check_token
from models import *
import os, traceback, sqlalchemy, time

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
            }

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
            pageSize = json['pageSize']
            pageNumber = json['pageNumber'] if 'pageNumber' in json else 1
            pageSize = int(pageSize)
            pageNumber = int(pageNumber) - 1
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
    # group has length 1 and and OR group has length > 1
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

# /createUser

# /launch

# /toggleFavorite (also increment decrement interested count of event)
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
                    "error": str(error)
                }
        else:
            return 'Missing required parameters', 400

# /getFavorites ?? paginate

# /setUserLocales

# /setUserInterests

# /feedback

# /user/<int:id>


if __name__ == '__main__':
    application.run(debug=True)
