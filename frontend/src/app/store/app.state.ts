import { createFeatureSelector } from '@ngrx/store';
import * as auth from './reducers/auth.reducer';
import * as business from './reducers/business.reducer';

export interface AppState {
    authState: auth.State;
    businessState: business.State;
}

export const reducers = {
    auth: auth.reducer,
    business: business.reducer
};

export const selectAuthState = createFeatureSelector<AppState>('auth');
export const selectBusinessState = createFeatureSelector<AppState>('business');
