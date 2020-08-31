import datetime
import json
from peewee import MySQLDatabase, Model, CharField, AutoField, DateTimeField, TextField, IntegerField, BooleanField, ForeignKeyField, DoubleField, CompositeKey

with open("./settings.json") as f:
    settings = json.load(f)

db = MySQLDatabase(
    settings["DATABASE"]["NAME"],
    user=settings["DATABASE"]["USER"],
    password=settings["DATABASE"]["PASSWORD"],
    host=settings["DATABASE"]["HOST"],
    port=settings["DATABASE"]["PORT"]
)


class BaseModel(Model):
    class Meta:
        database = db


class User(BaseModel):
    user_id = AutoField()
    username = CharField(unique=True)
    email = CharField(unique=True)
    fullname = CharField()
    password = CharField()
    created_date = DateTimeField(default=datetime.datetime.now)
    is_admin = BooleanField(default=False)


class Business(BaseModel):
    business_id = AutoField()
    name = CharField(unique=True)
    description = TextField(null=True)
    address = TextField()
    email = TextField()
    time_table = TextField()  # JSON string :)


class Service(BaseModel):
    service_id = AutoField()
    name = CharField()
    duration_m = DoubleField(default=0)
    price = DoubleField(default=0)
    description = TextField(null=True)
    created_date = DateTimeField(default=datetime.datetime.now)
    created_by = ForeignKeyField(User, backref='user')
    updated_date = DateTimeField(default=datetime.datetime.now)
    updated_by = ForeignKeyField(User, null=True, backref='user')
    business = ForeignKeyField(Business, backref='business')


class OwnerBusiness(BaseModel):  # Many-to-many relationship.
    user = ForeignKeyField(User)
    business = ForeignKeyField(Business)

    class Meta:
        primary_key = CompositeKey('user', 'business')


class Reservation(BaseModel):
    reservation_id = AutoField()
    created_date = DateTimeField(default=datetime.datetime.now)
    start = DateTimeField()
    end = DateTimeField()
    note = TextField(null=True)
    is_approved = BooleanField(default=False)
    approved_by = ForeignKeyField(User, null=True, backref='user')
    is_reject = BooleanField(default=False)
    reject_by = ForeignKeyField(User, null=True, backref='user')
    customer = ForeignKeyField(User, backref='user')
    business = ForeignKeyField(Business, backref='business')


class ReservationService(BaseModel):
    reservation = ForeignKeyField(Reservation)
    service_id = IntegerField()  # Without ForeignKeyField
    name = CharField()
    duration_m = DoubleField()
    price = DoubleField()
    description = TextField(null=True)
