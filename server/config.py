import os

class Config(object):
    DEBUG = True
    TESTING = True
    # SQLALCHEMY_DATABASE_URI = os.environ.get('SQLALCHEMY_DATABASE_URI')
    SQLALCHEMY_DATABASE_URI = 'postgresql://HotSpotAdmin:UscGrad2017@hotspotdb.cv91mewjlcfw.us-east-1.rds.amazonaws.com:5432/HotSpot'
    SQLALCHEMY_TRACK_MODIFICATIONS = False

class ProductionConfig(Config):
    SQLALCHEMY_DATABASE_URI = 'postgresql://HotSpotAdmin:UscGrad2017@hotspotdb.cv91mewjlcfw.us-east-1.rds.amazonaws.com:5432/HotSpot'
    DEBUG = False
    TESTING = False

configName = os.environ.get('FLASK_CONFIG') or 'production'
if configName == 'production':
    config = ProductionConfig
elif configName == 'dev':
    config = Config
