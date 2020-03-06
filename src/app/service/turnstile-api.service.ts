import {Injectable} from '@angular/core';
import {ApiService, Links, makeLink} from "./api.service";
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
    turnstileDataList: TurnstileResource[];
}

export interface TurnstileResourceList extends Links {
    _embedded: TurnstileResources;
}

@Injectable({
    providedIn: 'root'
})
export class TurnstileApiService {

    constructor(private apiService: ApiService) {
    }

    list(): Observable<TurnstileResourceList> {
        return new Observable<TurnstileResourceList>(observer => {
            this.apiService.get<TurnstileResourceList>('list').subscribe(response => {
                observer.next(response);
            }, error => {
                observer.error(error);
            });
        });
    }

    create(): Observable<TurnstileResource> {
        return new Observable<TurnstileResource>(observer => {
            this.apiService.post<TurnstileResource, TurnstileResource>('create').subscribe(response => {
                observer.next(response);
            }, error => {
                observer.error(error);
            });
        });
    }

    get(turnstile: TurnstileResource): Observable<TurnstileResource> {
        return new Observable<TurnstileResource>(observer => {
            this.apiService.getLinkName<TurnstileResource>(turnstile,'self').subscribe(response => {
                observer.next(response);
            }, error => {
                observer.error(error);
            });
        });
    }

    sendEvent(turnstile: TurnstileResource, event: string): Observable<TurnstileResource> {
        return new Observable<TurnstileResource>(observer => {
            this.apiService.postLinkName<any, TurnstileResource>(turnstile, event).subscribe(response => {
                observer.next(response);
            }, error => {
                observer.error(error);
            });
        });
    }
}
