import {Injectable} from '@angular/core';
import {ApiService, Links, Paged, PageRequest} from "./api.service";

import {AnonymousSubject} from 'rxjs/internal/Subject';
import {map, Observable, Subject} from 'rxjs';
import {environment} from "../../environments/environment";

enum TurnstileState {
    LOCKED = 'LOCKED',
    UNLOCKED = 'UNLOCKED'
}
export interface Turnstile {
    id: number;
    locked: boolean;
    message?: string;
    currentState: TurnstileState
}
export interface TurnstileResource extends Turnstile, Links {
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
    private subject: AnonymousSubject<MessageEvent>;
    public messages: Subject<TurnstileResource>;

    constructor(private apiService: ApiService) {
        this.messages = <Subject<TurnstileResource>> this.connect(environment.wsUrl).pipe(
            map(
                (response: MessageEvent): TurnstileResource => {
                    if(!environment.production) {
                        console.log("WebSocket:response:" + response);
                    }
                    const data = JSON.parse(response.data);
                    if(!environment.production) {
                        console.log("WebSocket:data:" + response.data);
                    }
                    return data;
                }
            )
        );
    }
    public connect(url: string): AnonymousSubject<MessageEvent> {
        if (!this.subject) {
            console.log("WebSocket Connection to:" + url);
            this.subject = this.createWs(url);
            if(!environment.production) {
                console.log("Successfully connected: " + url);
            }
        }
        return this.subject;
    }
    private createWs(url): AnonymousSubject<MessageEvent> {
        const ws = new WebSocket(url);
        const observable = new Observable<MessageEvent>(obs => {
            ws.onmessage = obs.next.bind(obs);
            ws.onerror = obs.error.bind(obs);
            ws.onclose = obs.complete.bind(obs);
            return ws.close.bind(ws);
        });
        const observer = {
            error: null,
            complete: null,
            next: (data: Object) => {
                if(!environment.production) {
                    console.log('Message sent to websocket: ', data);
                }
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify(data));
                }
            }
        };
        return new AnonymousSubject<MessageEvent>(observer, observable);
    }

    list(pageRequest: PageRequest): Promise<TurnstileResourcePage> {
        return this.apiService.get<TurnstileResourcePage>('list', pageRequest);
    }

    create(): Promise<TurnstileResource> {
        return this.apiService.post<TurnstileResource, TurnstileResource>('create');
    }

    get(turnstile: TurnstileResource): Promise<TurnstileResource> {
        return this.apiService.getByLinkName<TurnstileResource>(turnstile, 'self');
    }

    sendEvent(turnstile: TurnstileResource, event: string): Promise<TurnstileResource> {
        return this.apiService.postByLinkName<any, TurnstileResource>(turnstile, event);
    }

    delete(turnstile: TurnstileResource): Promise<void> {
        return this.apiService.deleteByLinkName(turnstile, 'delete');
    }
}
