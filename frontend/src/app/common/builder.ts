import { Business } from '../models/business';
import { Service } from '../models/service';
import { User } from '../models/user';
import { Reservation } from '../models/reservation';

export function buildUser(payload: any): User{
    const user = new User();
    if (payload){
        user.id = payload.user_id;
        user.username = payload.username;
        user.fullName = payload.fullname;
        user.email = payload.email;
        user.isAdmin = payload.is_admin;
    }
    return user;
}

export function buildService(payload: any): Service{
    const service = new Service();
    service.id = payload.id ? payload.id : ( payload.service_id ? payload.service_id : undefined );
    service.serviceId = payload.service_id ? payload.service_id : ( payload.id ? payload.id : undefined );
    service.name = payload.name;
    service.price = payload.price;
    service.durationM = payload.duration_m;
    service.description = payload.description;
    service.createdBy = buildUser(payload.created_by);
    service.updatedBy = buildUser(payload.updated_by);
    service.createdDate = payload.created_date;
    service.updatedDate = payload.updated_date;
    return service;
}

export function buildBusiness(payload: any): Business{
    const business = new Business();
    business.id = payload.business_id;
    business.name = payload.name;
    business.email = payload.email;
    business.description = payload.description;
    business.address = payload.address;
    business.timeTable = payload.time_table;
    return business;
}

export function buildReservation(payload: any): Reservation{
    const reservation = new Reservation();
    reservation.id = payload.reservation_id;
    reservation.createdDate = payload.created_date;
    reservation.start = payload.start;
    reservation.end = payload.end;
    reservation.note = payload.note;
    reservation.approvedBy = buildUser(payload.approved_by);
    reservation.rejectBy = buildUser(payload.reject_by);
    reservation.isApproved = payload.is_approved;
    reservation.isReject = payload.is_reject;
    reservation.customer = buildUser(payload.customer);
    reservation.business = buildBusiness(payload.business);
    reservation.services = payload.reservationservice_set.map((service: any) => buildService(service));
    return reservation;
}