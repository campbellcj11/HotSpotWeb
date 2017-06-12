import os

class Config(object):
    DEBUG = True
    TESTING = True
    SQLALCHEMY_DATABASE_URI = os.environ.get('SQLALCHEMY_DATABASE_URI')
    SQLALCHEMY_TRACK_MODIFICATIONS = False

class ProductionConfig(Config):
    DEBUG = False
    TESTING = False

configName = os.environ.get('FLASK_CONFIG') or 'production'
if configName == 'production':
    config = ProductionConfig
elif configName == 'dev':
    config = Config