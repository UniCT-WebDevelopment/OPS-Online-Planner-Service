import json
import datetime
import re

from playhouse.shortcuts import model_to_dict
from database import User, Business, Service, OwnerBusiness, Reservation, ReservationService

"""
- Should have at least one number.
- Should have at least one uppercase and one lowercase character.
- Should have at least one special symbol.
- Should be between 6 to 20 characters long.
"""
regex_passw = '^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!#%*?&]{6,20}$'
regex_email = '[\w\.-]+@[\w\.-]+(\.[\w]+)+'

class JSONEncoder(json.JSONEncoder):
    def default(self, o):
        if (
            isinstance(o, datetime.datetime)
            or isinstance(o, datetime.date)
        ):
            return str(o)
        return json.JSONEncoder.default(self, o)


def services_upsert(args, current_user, action="update"):
    if args["name"] == "":
        return {'message': "Inserisci il nome del servizio per proseguire"}, 400

    if args["price"] < 0:
        return {'message': "Il prezzo del servizio non puo' essere minore di 0 Eur"}, 400

    if is_admin(current_user["user_id"], args["business_id"]) is True:
        update = {}
        for name in ["name", "description", "price", "business_id", "duration_m"]:
            if args[name] is not None:
                update[name] = args[name]

        if action == "update":
            query = Service.update(update).where((Service.service_id == int(args["id"])) & (Service.business == int(args["business_id"])))
            if query.execute() != 0:
                update["updated_date"] = datetime.datetime.now()
                update["updated_by"] = current_user["user_id"]

            service = Service.get_or_none((Service.service_id == int(args["id"])) & (Service.business == int(args["business_id"])))
            service = model_to_dict(service, recurse=True, backrefs=True, max_depth=1, exclude=[User.password, Business.time_table])
            return service, 200
        else:
            update["created_by_id"] = current_user["user_id"]
            update["updated_by_id"] = current_user["user_id"]
            service = Service.create(**update)
            service = model_to_dict(service, recurse=True, backrefs=True, max_depth=1, exclude=[User.password, Business.time_table])
            return service, 200
    else:
        return {'message': "Impossibile eseguire, sei sicuro di avere i permessi per eseguire queta operazione?"}, 400


def is_valid_date(day, date):
    for amorpm in ["morning", "afternoon"]:
        if day[amorpm]["open"] is None and day[amorpm]["close"] is None:
            continue

        _open_ = datetime.datetime.strptime("{} {}".format(date.strftime("%Y-%m-%d"), day[amorpm]["open"]), '%Y-%m-%d %H:%M')
        _close = datetime.datetime.strptime("{} {}".format(date.strftime("%Y-%m-%d"), day[amorpm]["close"]), '%Y-%m-%d %H:%M')

        if _open_ <= date <= _close:
            return True

    return False


def is_admin(user_id, business_id):
    try:
        OwnerBusiness.select().join(User).where((User.is_admin == 1) & (OwnerBusiness.user_id == int(user_id)) & (OwnerBusiness.business_id == int(business_id))).get()
        return True
    except OwnerBusiness.DoesNotExist:
        return False


def index_from_array(array, value, field="id"):
    for index in range(0, len(array)):
        print(array[index], value)
        if array[index][field] == value:
            return index
    return -1


def cleanhtml(raw_html):
    cleanr = re.compile('<.*?>|&([a-z0-9]+|#[0-9]{1,6}|#x[0-9a-f]{1,6});')
    cleanr = re.compile('<.*?>')
    cleantext = re.sub(cleanr, '', raw_html)
    return cleantext


def hideinfo(item, current_user):
    for key in item['customer']:
        if item['customer']['user_id'] != current_user:
            item['customer'][key] = "" if type(item['customer'][key]) == str else -1  # "*" * (len(str(item['customer'][key])) // 2)
    return item


def safe_data(dict, key, _type='string'):
    try:
        return dict[key]
    except Exception:
        return 0 if _type == 'number' else ''
