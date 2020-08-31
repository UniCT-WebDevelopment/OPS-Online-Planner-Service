import { User } from './user';
import { Service } from './service';
import { Business } from './business';

export class Reservation {
    id: number | null;
    createdDate: string;
    start: string;
    end: string;
    note: string;
    approvedBy?: User | null;
    rejectBy?: User | null;
    isApproved: boolean;
    isReject: boolean;
    customer: User | null;
    business: Business;
    services: Service[];
}

