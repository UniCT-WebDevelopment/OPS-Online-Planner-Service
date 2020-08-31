#!/usr/bin/python3
# -*- coding: utf-8 -*-

import datetime
import json
import re
import bcrypt
import time
import code
import random

import utils

from Mailer import Mailer

from flask import Flask, make_response, request
from flask_cors import CORS
from flask_restful import Resource, Api, reqparse
from flask_jwt_extended import (
    JWTManager, jwt_required, get_jwt_identity,
    create_access_token, get_raw_jwt
)


from werkzeug.security import safe_str_cmp

from playhouse.shortcuts import model_to_dict
from database import db, User, Business, Service, OwnerBusiness, Reservation, ReservationService

app = Flask(__name__)
CORS(app)

api = Api(app, prefix="/api/v1")

with open("./settings.json") as f:
    settings = json.load(f)

SEND_EMAIL = True
mailer = Mailer(
    smtp=settings["EMAIL"]["SMTP"],
    port=settings["EMAIL"]["PORT"],
    email=settings["EMAIL"]["EMAIL"],
    password=settings["EMAIL"]["PASSWORD"],
    html_template="./",
)

app.config['JWT_SECRET_KEY'] = settings["JWT_SECRET_KEY"]
app.config['JWT_BLACKLIST_ENABLED'] = True
app.config['JWT_BLACKLIST_TOKEN_CHECKS'] = ['access', 'refresh']

jwt = JWTManager(app)
blacklist = set()

SALT = settings["SALT"].encode("utf-8")


@app.errorhandler(Exception)
def handle_error(e):
    return {"message": "Exception raised: {}".format(e)}, 500


@api.representation('application/json')
def output_json(data, status_code, headers=None):
    resp = make_response(json.dumps(data, cls=utils.JSONEncoder), status_code)
    resp.headers.extend(headers or {})
    return resp


@jwt.unauthorized_loader
def unauthorized_loader(expired_token):
    return {'message': 'Missing Authorization Header'}, 403


@jwt.token_in_blacklist_loader
def check_if_token_in_blacklist(decrypted_token):
    jti = decrypted_token['jti']
    return jti in blacklist


class UserRegistration(Resource):
    def post(self):

        parser = reqparse.RequestParser(bundle_errors=True)
        parser.add_argument("fullname", type=str, required=True)
        parser.add_argument("username", type=str, required=True)
        parser.add_argument("password1", type=str, required=True)
        parser.add_argument("password2", type=str, required=True)
        parser.add_argument("email", type=str, required=True)
        args = parser.parse_args()

        args["username"] = args["username"].lower().strip()
        args["email"] = args["email"].lower().strip()
        args["fullname"] = " ".join([word.title().strip() for word in args["fullname"].split(" ")])

        if args['password1'] != args['password2']:
            return {"message": "Le password inserite non coincidono"}, 400

        # if re.search(utils.regex_passw, args["password1"]) is None:
        #     return {"message": "La password deve contenere almeno un numero, un carattere speciale, caratteri misti (upper, lower) e deve comprendere tra i 6 e i 20 caratteri"}, 400

        if re.search(utils.regex_email, args["email"]) is None:
            return {"message": "La mail inserita non sembra essere valida"}, 400

        if User.get_or_none(User.username == args["username"]) is not None:
            return {"message": "Un altro utente sta gia' utilizzando l'username: {}".format(args["username"])}, 400
        if User.get_or_none(User.email == args["email"]) is not None:
            return {"message": "Un altro utente sta gia' utilizzando la mail: {}".format(args["email"])}, 400

        hashed = bcrypt.hashpw(args["password1"].encode("utf-8"), SALT)
        User.create(
            username=args["username"],
            email=args["email"],
            fullname=args["fullname"],
            password=hashed
        )

        return {'message': 'L\'utente {} e\' stato creato con successo. Per favore accedi con le tua credenziali nella pagina dedicata'.format(args["username"])}, 200


class UserLogin(Resource):
    def post(self):

        parser = reqparse.RequestParser(bundle_errors=True)
        parser.add_argument("username", type=str, required=True)
        parser.add_argument("password", type=str, required=True)
        args = parser.parse_args()

        hashed = bcrypt.hashpw(args["password"].encode("utf-8"), SALT)
        user = User.get_or_none(User.username == args["username"].lower().strip())
        if user is not None and safe_str_cmp(user.password, hashed) is True:
            access_token = create_access_token(identity=json.dumps({
                "username": user.username,
                "user_id": user.user_id
            }), expires_delta=datetime.timedelta(days=60))
            return {'message': 'Login effettuato con successo!', 'user': model_to_dict(user, recurse=False, backrefs=False, exclude=[User.password]), 'token': access_token}, 200
        else:
            return {'message': 'Credenziali errata. Assicurati che username e password siano corretti'}, 400


class UserPassword(Resource):
    def post(self):
        args = request.get_json()

        user = User.get_or_none(User.username == args["username"])
        if user is None:
            return {'message': "Impossibile eseguire, username non trovato"}, 400

        new_password = "".join([random.choice("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789") for i in range(12)])

        hashed = bcrypt.hashpw(new_password.encode("utf-8"), SALT)
        user.password = hashed
        user.save()

        data = {"fullname": user.fullname, "new_password": new_password}
        title = "Password resettata!"
        text = "Ciao {fullname}, la tua password e' state resettata. Accedi con: {new_password}".format(**data)
        html = "Ciao <b>{fullname}</b>, la tua password e' state resettata. Accedi con: <b>{new_password}</b>".format(**data)

        html = mailer.build_html_mail(title, html)
        if SEND_EMAIL is True:
            mailer.send_mail(user.email, user.username, text, title, html=html)

        return {"message": "Password resettata. E' stata inviata una mail contenente la nuova password"}, 200


class UserEndpoint(Resource):
    @jwt_required
    def get(self):
        current_user = get_jwt_identity()
        current_user = json.loads(current_user)
        user = User.get_or_none(User.username == current_user["username"] and User.user_id == int(current_user["user_id"]))
        if user is not None:
            return model_to_dict(user, recurse=False, backrefs=False, exclude=[User.password]), 200
        return {}, 404

    """
    @jwt_required
    def post(self):
        current_user = get_jwt_identity()
        current_user = json.loads(current_user)
        user = User.get_or_none(User.username == current_user["username"] and User.user_id == int(current_user["user_id"]))
    """

    @jwt_required
    def put(self):
        current_user = get_jwt_identity()
        current_user = json.loads(current_user)

        user = User.get_or_none(User.user_id == current_user["user_id"])
        if user is None:
            return {'message': "Impossibile eseguire, sei sicuro di avere i permessi per eseguire queta operazione?"}, 400

        args = request.get_json()

        if "action" not in args or args["action"] not in ["email", "password"]:
            return {'message': "Inserisci un azione tra: email, password"}, 400

        if args["action"] == "email":
            if user.email == args["email"]:
                return {'message': "Impossibile proseguire, la nuova email deve essere diversa da quella corrente"}, 400

            if re.search(utils.regex_email, args["email"]) is None:
                return {"message": "La mail inserita non sembra essere valida"}, 400

            data = {"fullname": user.fullname, "email": user.email}
            title = "Email aggiornata!"
            text = "Ciao {fullname}, qualcuno ha modificato la tua email attuale con la seguente: {email}. Se non sei stato tu contattaci".format(**data)
            html = "Ciao <b>{fullname}</b>, qualcuno ha modificato la tua email attuale con la seguente: <b>{email}</b>. Se non sei stato tu contattaci".format(**data)

            html = mailer.build_html_mail(title, html)
            if SEND_EMAIL is True:
                mailer.send_mail(user.email, user.username, text, title, html=html)

            user.email = args["email"]
            user.save()

            message = "Email aggiornata con successo"
        elif args["action"] == "password":
            hashed = bcrypt.hashpw(args["password"].encode("utf-8"), SALT)
            if safe_str_cmp(user.password, hashed) is False:
                return {'message': "La password inserita non corrisponde a quella attuale. Se hai dimenticato la password chiedi un reset"}, 400

            if safe_str_cmp(args["password1"], args["password2"]):
                return {'message': "Le due password inserite non coincidono"}, 400

            if re.search(utils.regex_passw, args["password1"]) is None:
                return {"message": "La password deve contenere almeno un numero, un carattere speciale, caratteri misti (upper, lower) e deve comprendere tra i 6 e i 20 caratteri"}, 400

            hashed = bcrypt.hashpw(args["password1"].encode("utf-8"), SALT)
            user.password = hashed
            user.save()

            title = "Password aggiornata!"
            text = "Ciao {}, qualcuno ha modificato la tua password. Se non sei stato tu contattaci".format(user.fullname)
            html = "Ciao <b>{}</b>, qualcuno ha modificato la tua password. Se non sei stato tu contattaci".format(user.fullname)

            html = mailer.build_html_mail(title, html)
            if SEND_EMAIL is True:
                mailer.send_mail(user.email, user.username, text, title, html=html)
            message = "Password aggiornata con successo"

        return {'message': message, 'user': model_to_dict(user, recurse=False, backrefs=False, exclude=[User.password])}, 200

    @jwt_required
    def delete(self):
        jti = get_raw_jwt()['jti']
        blacklist.add(jti)
        return {'message': 'Logout completato'}, 200


class BusinessEndpoint(Resource):
    def get(self):
        parser = reqparse.RequestParser(bundle_errors=True)
        parser.add_argument("business_id", type=int, required=False, default=1)
        args = parser.parse_args()

        business = Business.get_or_none(Business.business_id == args["business_id"])
        if business is not None:
            business = model_to_dict(business, recurse=False, backrefs=False)
            business['time_table'] = json.loads(business['time_table'])
            return business, 200
        return {}, 404

    @jwt_required
    def post(self):
        current_user = get_jwt_identity()
        current_user = json.loads(current_user)

        parser = reqparse.RequestParser(bundle_errors=True)
        parser.add_argument("id", type=str, required=True)
        argsname = ["name", "description", "address"]
        for name in argsname:
            parser.add_argument(name, type=str, required=False)
        args = parser.parse_args()

        args["timeTable"] = [] if "timeTable" not in request.get_json() else request.get_json()["timeTable"]

        for day in args["timeTable"]:
            for amorpm in ["morning", "afternoon"]:
                if day[amorpm]["open"] is None and day[amorpm]["close"] is None:
                    continue

                if (day[amorpm]["open"] is None and day[amorpm]["close"] is not None) or (day[amorpm]["open"] is not None and day[amorpm]["close"] is None):
                    return {'message': 'Ad ogni orario di chiusura deve corrispondere un orario di apertura e vice versa'}, 400

                # Too much keyword in code, user _ :)

                _today = datetime.datetime.now().strftime("%Y-%m-%d")
                _open_ = datetime.datetime.strptime("{} {}".format(_today, day[amorpm]["open"]), '%Y-%m-%d %H:%M')
                _close = datetime.datetime.strptime("{} {}".format(_today, day[amorpm]["close"]), '%Y-%m-%d %H:%M')

                if _open_ >= _close:
                    return {'message': 'L\'orario di apertura non puo\' avvenire dopo la chiusura'}, 400

                """
                if amorpm == "morning":
                    _min = datetime.datetime.strptime("{} {}".format(_today, "00:00"), '%Y-%m-%d %H:%M')
                    _max = datetime.datetime.strptime("{} {}".format(_today, "13:59"), '%Y-%m-%d %H:%M')
                else:
                    _min = datetime.datetime.strptime("{} {}".format(_today, "12:00"), '%Y-%m-%d %H:%M')
                    _max = datetime.datetime.strptime("{} {}".format(_today, "22:59"), '%Y-%m-%d %H:%M')

                if (not (_min <= _open_ <= _max)) or (not (_min <= _close <= _max)):
                    return {'message': 'Assicurati che gli orari orari inseriti per mattino e pomeriggio rispettino tale indicazione'}, 400
                """

        if utils.is_admin(current_user["user_id"], args["id"]) is True:
            update = {}
            for name in argsname:
                if args[name] is not None:
                    update[name] = args[name]
            if args["timeTable"] != []:
                update["time_table"] = json.dumps(args["timeTable"])

            query = Business.update(update).where(Business.business_id == int(args["id"]))
        else:
            return {'message': "Impossibile aggiornare, sei sicuro di avere i permessi per eseguire queta operazione?"}, 400

        if query.execute() != 0:
            business = Business.get_or_none(Business.business_id == int(args["id"]))
            business = model_to_dict(business, recurse=False, backrefs=False)
            business['time_table'] = json.loads(business['time_table'])
            return business, 200

        return {'message': "Non c'e' nulla da aggiornare"}, 400


class ServiceEndpoint(Resource):
    @jwt_required
    def get(self):
        current_user = get_jwt_identity()
        current_user = json.loads(current_user)

        parser = reqparse.RequestParser(bundle_errors=True)
        parser.add_argument("business_id", type=int, required=True)
        args = parser.parse_args()

        query = (Service
                 .select(Service)
                 .order_by(Service.created_date.desc())
                 .where(Service.business == int(args["business_id"])))

        services = [model_to_dict(item, recurse=True, backrefs=True, max_depth=1, exclude=[User.password, Business.time_table]) for item in query]
        return services, 200

    @jwt_required
    def put(self):
        current_user = get_jwt_identity()
        current_user = json.loads(current_user)

        parser = reqparse.RequestParser(bundle_errors=True)
        parser.add_argument("id", type=int, required=True)
        parser.add_argument("business_id", type=int, required=True)
        parser.add_argument("name", type=str, required=True)
        parser.add_argument("price", type=float, required=True)
        parser.add_argument("duration_m", type=float, required=False)
        parser.add_argument("description", type=str, required=False)
        args = parser.parse_args()

        return utils.services_upsert(args, current_user, action="update")

    @jwt_required
    def post(self):
        current_user = get_jwt_identity()
        current_user = json.loads(current_user)

        parser = reqparse.RequestParser(bundle_errors=True)
        parser.add_argument("business_id", type=int, required=True)
        parser.add_argument("name", type=str, required=True)
        parser.add_argument("price", type=float, required=True)
        parser.add_argument("duration_m", type=float, required=False)
        parser.add_argument("description", type=str, required=False)
        args = parser.parse_args()

        return utils.services_upsert(args, current_user, action="insert")

    @jwt_required
    def delete(self):
        current_user = get_jwt_identity()
        current_user = json.loads(current_user)

        args = {}
        for name in ["id", "business_id"]:
            arg = request.args.get(name)
            if arg in [None, ""] or arg.isdigit() is False:
                return {'message': "Argomento {} non valido".format(name)}, 400
            args[name] = arg

        if utils.is_admin(current_user["user_id"], args["business_id"]) is True:
            query = Service.delete().where((Service.service_id == int(args["id"])) & (Service.business == int(args["business_id"])))
            if query.execute() == 0:
                return {'message': "Spiacenti, il servizio non e' stato trovato"}, 400
            else:
                return {'message': "Servizio cancellato con successo"}, 200
        else:
            return {'message': "Impossibile eseguire, sei sicuro di avere i permessi per eseguire queta operazione?"}, 400


class ReservationEndpoint(Resource):
    @jwt_required
    def get(self):
        current_user = get_jwt_identity()
        current_user = json.loads(current_user)

        parser = reqparse.RequestParser(bundle_errors=True)
        parser.add_argument("timestamp", type=int, required=False)
        parser.add_argument("business_id", type=int, required=True)
        parser.add_argument("customer_id", type=int, required=False)
        args = parser.parse_args()

        if args["customer_id"] in [None, ""]:
            timestamp = int(time.time()) if args["timestamp"] is None else args["timestamp"]
            in___date = datetime.datetime.fromtimestamp(timestamp) - datetime.timedelta(days=30)

            query = (Reservation
                     .select()
                     .where((Reservation.business == args["business_id"]) & (Reservation.start >= in___date))
                     .order_by(Reservation.start)
                     )
        else:
            query = (Reservation
                     .select()
                     .where((Reservation.business == args["business_id"]) & (Reservation.customer == int(args["customer_id"])))
                     .order_by(Reservation.start)
                     )

        if utils.is_admin(current_user["user_id"], args["business_id"]) is True or (args["customer_id"] not in [None, ""] and args["customer_id"] == current_user["user_id"]):
            reservations = [model_to_dict(item, recurse=True, backrefs=True, max_depth=1, exclude=[User.password, Business.time_table]) for item in query]
        else:
            reservations = [utils.hideinfo(model_to_dict(item, recurse=True, backrefs=True, max_depth=1, exclude=[User.password, Business.time_table]), current_user["user_id"]) for item in query]
        return reservations, 200

    @jwt_required
    def post(self):
        current_user = get_jwt_identity()
        current_user = json.loads(current_user)

        args = request.get_json()

        business = Business.get_or_none(Business.business_id == int(args["business_id"]))
        time_table = json.loads(business.time_table)

        # "2020-07-27 19:10:00"
        start = datetime.datetime.strptime(args["start"], '%Y-%m-%d %H:%M:%S')
        end = start + datetime.timedelta(minutes=sum([service["duration_m"] for service in args["services"]]))

        start_day = time_table[start.weekday()]
        end_day = time_table[start.weekday()]
        if utils.is_valid_date(start_day, start) is False or utils.is_valid_date(end_day, end) is False:
            return {'message': "La data inserita non sembra esser valida. Il negozio e' chiuso"}, 400

        # if Reservation.get_or_none((Reservation.start >= start) & (Reservation.end >= end)) is not None:
        #     return {'message': 'Sembra esserci un altro appuntamento allo stesso orario, impossibile proseguire'}, 400

        is_admin = utils.is_admin(current_user["user_id"], args["business_id"])

        if is_admin is False:
            query = Reservation.select().where((Reservation.customer == int(current_user["user_id"])) & (Reservation.business == args["business_id"]) & (Reservation.is_reject == 0) & (Reservation.is_approved == 0))
            if query.count() >= 3:
                return {'message': "Spiacenti, hai troppi appuntamenti in sospeso, impossibile crearne uno nuovo"}, 400

            customer_id = int(current_user["user_id"])
        else:
            customer_id = int(args["customer"]["user_id"])

        reservation = Reservation.create(
            start=args["start"],
            end=args["end"],
            note=utils.cleanhtml(utils.safe_data(args, "note", _type="string")),
            customer=customer_id,
            business=int(args["business_id"]),
            is_approved=False if is_admin is False else True,
            approved_by_id=None if is_admin is False else current_user["user_id"]
        )

        data = [{
            "reservation": reservation.reservation_id,
            "service_id": utils.safe_data(service, "serviceId", _type="number"),
            "name": service["name"],
            "duration_m": service["duration_m"],
            "price": service["price"],
            "description": service["description"]
        } for service in args["services"]]
        ReservationService.insert_many(data).execute()

        reservation = model_to_dict(reservation, recurse=True, backrefs=True, max_depth=1, exclude=[User.password, Business.time_table])

        if is_admin is False:
            data = {
                "fullname": reservation["customer"]["fullname"],
                "start": reservation["start"],
                "services": ", ".join([item["name"] for item in reservation["reservationservice_set"]])
            }
            text = "Il cliente: {fullname}, ha richiesto un appuntamento per il: {start}, richiedendo i seguenti servizi: {services}".format(**data)
            html = "Il cliente: <b>{fullname}</b>, ha richiesto un appuntamento per il: <b>{start}</b>, richiedendo i seguenti servizi: <b>{services}</b>".format(**data)
            html = mailer.build_html_mail("Nuova prenotazione!", html)
            if SEND_EMAIL is True:
                mailer.send_mail(reservation["business"]["email"], reservation["business"]["name"], text, "Nuova prenotazione!", html=html)

        return reservation, 200

    @jwt_required
    def put(self):  # Multiple update, get directly the array please
        current_user = get_jwt_identity()
        current_user = json.loads(current_user)

        args = request.get_json()

        for reservation in args["reservations"]:  # Do again a speed check for make sure that all event are 'valid'.
            business = Business.get_or_none(Business.business_id == int(reservation["business_id"]))
            time_table = json.loads(business.time_table)

            # "2020-07-27 19:10:00"
            start = datetime.datetime.strptime(reservation["start"], '%Y-%m-%d %H:%M:%S')
            end = start + datetime.timedelta(minutes=sum([service["duration_m"] for service in reservation["services"]]))

            start_day = time_table[start.weekday()]
            end_day = time_table[start.weekday()]
            if utils.is_valid_date(start_day, start) is False or utils.is_valid_date(end_day, end) is False:
                return {'message': "La data inserita non sembra esser valida. Il negozio e' chiuso"}, 400

        is_admin = utils.is_admin(current_user["user_id"], args["business_id"])

        reservations = []
        for index in range(0, len(args["reservations"])):
            reservation = Reservation.get_or_none(Reservation.reservation_id == int(args["reservations"][index]["reservation_id"]))
            # if Reservation.get_or_none((Reservation.start >= reservation.start) & (Reservation.end <= reservation.end) & (Reservation.reservation_id != reservation.reservation_id)) is None:
            if reservation is not None and reservation.business_id == int(args["business_id"]) and (is_admin is True or reservation.customer.user_id == int(current_user["user_id"])):

                for service_index in range(0, len(args["reservations"][index]["services"])):
                    service = args["reservations"][index]["services"][service_index]
                    if service["id"] is None:
                        query = ReservationService.insert(
                            reservation=int(args["reservations"][index]["reservation_id"]),
                            name=service["name"],
                            duration_m=service["duration_m"],
                            price=service["price"],
                            service_id=service["service_id"],
                            description=service["description"]
                        )
                        args["reservations"][index]["services"][service_index]["id"] = query.execute()
                    """
                    else:
                        update = {
                            "name": service["name"],
                            "duration_m": service["duration_m"],
                            "price": service["price"],
                            "description": service["description"]
                        }
                        query = ReservationService.update(update).where((ReservationService.id == int(service["id"])) & (ReservationService.reservation_id == int(args["reservations"][index]["reservation_id"])))
                        query.execute()
                    """

                reservationservice_set = model_to_dict(reservation, recurse=True, backrefs=True, max_depth=1, exclude=[User.password, Business.time_table])["reservationservice_set"]
                todelete = [int(item["id"]) for item in reservationservice_set if item["id"] not in [service["id"] for service in args["reservations"][index]["services"] if service["id"] is not None]]
                if todelete != []:
                    query = ReservationService.delete().where((ReservationService.id << todelete) & (ReservationService.reservation_id == int(args["reservations"][index]["reservation_id"])))
                    query.execute()

                reservation.start = args["reservations"][index]["start"]
                reservation.end = args["reservations"][index]["end"]
                reservation.note = utils.cleanhtml(args["reservations"][index]["note"]) if "note" in args["reservations"][index] else ""

                if is_admin:
                    if "is_approved" in args["reservations"][index] and reservation.is_approved != args["reservations"][index]["is_approved"]:
                        reservation.is_approved = args["reservations"][index]["is_approved"]
                        if args["reservations"][index]["is_approved"] is True:
                            reservation.approved_by_id = current_user["user_id"]

                            data = {"fullname": reservation.customer.fullname, "start": reservation.start}
                            title = "Evviva, prenotazione confermata!"
                            text = "Ciao {fullname}, la tua prenotazione per il: {start}, e' stata accettata".format(**data)
                            html = "Ciao <b>{fullname}</b>, la tua prenotazione per il: <b>{start}</b>, e' stata <b>accettata</b>".format(**data)

                            html = mailer.build_html_mail(title, html)
                            if SEND_EMAIL is True:
                                mailer.send_mail(reservation.customer.email, reservation.customer.username, text, title, html=html)

                    if "is_reject" in args["reservations"][index] and reservation.is_reject != args["reservations"][index]["is_reject"]:
                        reservation.is_reject = args["reservations"][index]["is_reject"]
                        if args["reservations"][index]["is_reject"] is True:
                            reservation.reject_by_id = current_user["user_id"]

                            data = {"fullname": reservation.customer.fullname, "start": reservation.start}
                            title = "Ci dispiace, prenotazione rifiutata!"
                            text = "Caro {fullname}, ci dispiace ma la tua prenotazione per il: {start}, e' stata rifiutata".format(**data)
                            html = "Caro <b>{fullname}</b>, ci dispiace ma la tua prenotazione per il: <b>{start}</b>, e' stata <b>rifiutata</b>".format(**data)

                            html = mailer.build_html_mail(title, html)
                            if SEND_EMAIL is True:
                                mailer.send_mail(reservation.customer.email, reservation.customer.username, text, title, html=html)

                reservation.save()
                reservations.append(reservation)

        if reservations != []:
            reservations = [model_to_dict(reservation, recurse=True, backrefs=True, max_depth=1, exclude=[User.password, Business.time_table]) for reservation in reservations]
            return reservations, 200
        return [], 400


class CustomersEndpoint(Resource):
    @jwt_required
    def get(self):
        current_user = get_jwt_identity()
        current_user = json.loads(current_user)

        parser = reqparse.RequestParser(bundle_errors=True)
        parser.add_argument("business_id", type=int, required=True)
        parser.add_argument("q", type=str, required=False)
        args = parser.parse_args()

        if utils.is_admin(current_user["user_id"], args["business_id"]) is True:
            if args['q'] is not None and args['q'] != "":
                query = (User.select().where(User.fullname.contains(args["q"])).order_by(User.fullname).limit(75))
            else:
                query = (User.select().order_by(User.fullname).limit(75))
            customers = [model_to_dict(item, recurse=False, backrefs=False, max_depth=0, exclude=[User.password]) for item in query]
            return customers, 200
        else:
            return {'message': "Impossibile eseguire, sei sicuro di avere i permessi per eseguire queta operazione?"}, 400

    @jwt_required
    def put(self):
        current_user = get_jwt_identity()
        current_user = json.loads(current_user)

        args = request.get_json()

        if utils.is_admin(current_user["user_id"], args["business_id"]) is True:
            user = User.get_or_none(User.user_id == args["user"]["user_id"])
            if user is None:
                return {'message': "Spacenti, utente non trovato"}, 400
            else:
                if user.is_admin != args["user"]["is_admin"]:
                    if args["user"]["is_admin"] is True:
                        OwnerBusiness.insert(
                            user=int(args["user"]["user_id"]),
                            business=int(args["business_id"])
                        ).execute()
                        user.is_admin = True
                        user.save()
                    else:
                        OwnerBusiness.delete().where((OwnerBusiness.user == int(args["user"]["user_id"])) & (OwnerBusiness.business == int(args["business_id"]))).execute()
                        user.is_admin = False
                        user.save()
                return model_to_dict(user, recurse=False, backrefs=False, max_depth=0, exclude=[User.password]), 200
        else:
            return {'message': "Impossibile eseguire, sei sicuro di avere i permessi per eseguire queta operazione?"}, 400


api.add_resource(UserRegistration, '/user/register')
api.add_resource(UserLogin, '/user/login')
api.add_resource(UserEndpoint, '/user')
api.add_resource(UserPassword, '/user/password')
api.add_resource(BusinessEndpoint, '/business')
api.add_resource(ServiceEndpoint, '/services')
api.add_resource(ReservationEndpoint, '/reservations')
api.add_resource(CustomersEndpoint, '/customers')


if __name__ == '__main__':
    db.connect()
    db.create_tables([User, Business, Service, OwnerBusiness, Reservation, ReservationService])
    # code.interact(local=locals())

    app.run(host="0.0.0.0", port=123456, threaded=True, debug=True)
