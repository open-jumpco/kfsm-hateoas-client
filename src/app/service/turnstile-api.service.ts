import {Injectable} from '@angular/core';
import {ApiService, Links, makeLink, Paged, PageRequest} from "./api.service";
import {Observable} from "rxjs";

enum TurnstileState {
    LOCKED = 'LOCKED',
    UNLOCKED = 'UNLOCKED'
}

export interface TurnstileResource extends Links {
    id: number;
    locked: boolean;
    message?: string;
    currentState: TurnstileState
}

export interface TurnstileResources {
    turnstiles: TurnstileResource[];
}

export interface TurnstileResourcePage extends Paged {
    _embedded: TurnstileResources;
}

@Injectable({
    providedIn: 'root'
})
export class TurnstileApiService {

    constructor(private apiService: ApiService) {
    }

    list(pageRequest: PageRequest): Observable<TurnstileResourcePage> {
        return this.apiService.get<TurnstileResourcePage>('list', pageRequest);
    }

    create(): Observable<TurnstileResource> {
        return this.apiService.post<TurnstileResource, TurnstileResource>('create');
    }

    get(turnstile: TurnstileResource): Observable<TurnstileResource> {
        return this.apiService.getByLinkName<TurnstileResource>(turnstile, 'self');
    }

    sendEvent(turnstile: TurnstileResource, event: string): Observable<TurnstileResource> {
        return this.apiService.postByLinkName<any, TurnstileResource>(turnstile, event);
    }

    delete(turnstile: TurnstileResource): Observable<void> {
        return this.apiService.deleteByLinkName(turnstile, 'delete');
    }
}
