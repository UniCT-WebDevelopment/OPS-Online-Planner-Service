#!/usr/bin/python3
# -*- coding: utf-8 -*-

import bcrypt
import json

from database import db, User, Business, Service, OwnerBusiness, Reservation, ReservationService

if __name__ == '__main__':

    with open("./settings.json") as f:
        settings = json.load(f)

    SALT = settings["SALT"].encode("utf-8")

    db.connect()
    db.create_tables([User, Business, Service, OwnerBusiness, Reservation, ReservationService])

    print("- Creazione amministratore: ")
    username = input("Inserisci username: ")
    email = input("Inserisci email: ")
    fullname = input("Inserisci nome e cognome: ")
    password1 = input("Inserisci password: ")

    hashed = bcrypt.hashpw(password1.encode("utf-8"), SALT)
    admin = User.create(
        username=username,
        email=email,
        fullname=fullname,
        password=hashed,
        is_admin=True
    )

    time_table = json.dumps([{"name": "Luned\u00ec", "morning": {"open": None, "close": None}, "afternoon": {"open": None, "close": None}}, {"name": "Marted\u00ec", "morning": {"open": None, "close": None}, "afternoon": {"open": None, "close": None}}, {"name": "Mercoled\u00ec", "morning": {"open": None, "close": None}, "afternoon": {"open": None, "close": None}}, {"name": "Gioved\u00ec", "morning": {"open": None, "close": None}, "afternoon": {"open": None, "close": None}}, {"name": "Venerd\u00ec", "morning": {"open": None, "close": None}, "afternoon": {"open": None, "close": None}}, {"name": "Sabato", "morning": {"open": None, "close": None}, "afternoon": {"open": None, "close": None}}, {"name": "Domenica", "morning": {"open": None, "close": None}, "afternoon": {"open": None, "close": None}}])

    print("\n================================\n")

    print("- Creazione attivita' commerciale: ")
    name = input("Inserisci nome: ")
    email = input("Inserisci email: ")
    address = input("Inserisci indirizzo: ")

    business = Business.create(
        name=name,
        email=email,
        address=address,
        time_table=time_table
    )

    OwnerBusiness.insert(
        user=admin.user_id,
        business=business.business_id
    ).execute()

    print("\n================================\n")
    print("Configurazione completata! Welcome")
