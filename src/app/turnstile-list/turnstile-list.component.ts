import {Component, OnInit} from '@angular/core';
import {
    TurnstileApiService,
    TurnstileResource,
    TurnstileResourcePage,
    TurnstileResources
} from "app/service/turnstile-api.service";
import {BehaviorSubject} from "rxjs";
import {convertErrorToString, Paged} from "app/service/api.service";

@Component({
    selector: 'app-turnstile-list',
    templateUrl: './turnstile-list.component.html',
    styleUrls: ['./turnstile-list.component.css']
})
export class TurnstileListComponent implements OnInit {
    turnstiles = new BehaviorSubject<TurnstileResources>(null);
    turnstilePage: TurnstileResourcePage;
    totalPages: number;
    pageSize: number;
    errorMessage = new BehaviorSubject<string>(null);

    constructor(private turnstileService: TurnstileApiService) {
        this.totalPages = 0;
        switch (window.screen.orientation.type) {
            case "portrait-primary":
            case "portrait-secondary":
                this.pageSize = 6;
                break;
            case "landscape-primary":
            case "landscape-secondary":
            default:
                this.pageSize = 10;
                break;
        }
    }

    async ngOnInit() {
        await this.listTurnstiles();
    }

    async listTurnstiles() {
        try {
            this.errorMessage.next(null);
            this.turnstilePage = await this.turnstileService.list({size: this.pageSize}).toPromise();
            this.totalPages = this.turnstilePage?.page?.totalPages;
            this.turnstiles.next(this.turnstilePage?._embedded);
        } catch (error) {
            console.debug('listTurnstiles:error:', error);
            this.errorMessage.next(convertErrorToString(error));
        }
    }

    async createTurnstile() {
        console.debug('createTurnstile');
        try {
            this.errorMessage.next(null);
            const created = await this.turnstileService.create().toPromise();
        } catch (error) {
            console.debug('createTurnstile:error:', error);
            this.errorMessage.next(convertErrorToString(error));
        }
        return this.listTurnstiles();
    }

    async updateTurnstile(resource: TurnstileResource) {
        console.debug('updateTurnstile', resource);
        if(resource == null) {
            return this.listTurnstiles();
        }
        let found = false;
        for (const item of this.turnstiles.getValue().turnstiles) {
            if (item.id === resource.id) {
                item.currentState = resource.currentState;
                item.locked = resource.locked;
                item.message = resource.message;
                item._links = resource._links;
                found = true;
            }
        }
        if (!found) {
            return this.listTurnstiles();
        }
    }

    pageUpdated(event: Paged) {
        console.debug('pageUpdated:', event);
        this.turnstilePage = event as TurnstileResourcePage;
        this.turnstiles.next(this.turnstilePage._embedded);
    }
}
