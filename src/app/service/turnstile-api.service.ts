import {Injectable} from '@angular/core';
import {ApiService, Links, makeLink, Paged} from "./api.service";
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

    list(): Observable<TurnstileResourcePage> {
        return new Observable<TurnstileResourcePage>(observer => {
            this.apiService.get<TurnstileResourcePage>('list').subscribe(response => {
                observer.next(response);
                observer.complete();
            }, error => {
                observer.error(error);
            });
        });
    }

    create(): Observable<TurnstileResource> {
        return new Observable<TurnstileResource>(observer => {
            this.apiService.post<TurnstileResource, TurnstileResource>('create').subscribe(response => {
                observer.next(response);
                observer.complete();
            }, error => {
                observer.error(error);
            });
        });
    }

    get(turnstile: TurnstileResource): Observable<TurnstileResource> {
        return new Observable<TurnstileResource>(observer => {
            this.apiService.getByLinkName<TurnstileResource>(turnstile,'self').subscribe(response => {
                observer.next(response);
                observer.complete();
            }, error => {
                observer.error(error);
            });
        });
    }

    sendEvent(turnstile: TurnstileResource, event: string): Observable<TurnstileResource> {
        return new Observable<TurnstileResource>(observer => {
            this.apiService.postByLinkName<any, TurnstileResource>(turnstile, event).subscribe(response => {
                observer.next(response);
                observer.complete();
            }, error => {
                observer.error(error);
            });
        });
    }
}
