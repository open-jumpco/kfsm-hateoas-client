import {Component, OnInit, QueryList, ViewChild, ViewChildren} from '@angular/core';
import {
    TurnstileApiService,
    TurnstileResource,
    TurnstileResourcePage,
    TurnstileResources
} from "app/service/turnstile-api.service";
import {BehaviorSubject} from "rxjs";
import {asPromise, convertErrorToString, Paged} from "app/service/api.service";
import {BreakpointObserver, Breakpoints} from "@angular/cdk/layout";
import {environment} from "../../environments/environment";
import {TurnstileComponent} from "app/turnstile/turnstile.component";
import {PagerComponent} from "app/pager/pager/pager.component";
import {determineFontSize} from "app/app.component";

@Component({
    selector: 'app-turnstile-list',
    templateUrl: './turnstile-list.component.html',
    styleUrls: ['./turnstile-list.component.css']
})
export class TurnstileListComponent implements OnInit {
    @ViewChild(PagerComponent) pager: PagerComponent;
    @ViewChildren(TurnstileComponent) childTurnstiles: QueryList<TurnstileComponent>;
    turnstiles = new BehaviorSubject<TurnstileResources>(null);
    turnstilePage: TurnstileResourcePage;
    totalPages: number;
    pageSize: number;
    errorMessage = new BehaviorSubject<string>(null);
    breakpoint: Promise<boolean>;
    fontSize: string = "8pt";
    colspan: number = 3;

    constructor(private turnstileService: TurnstileApiService, breakpointObserver: BreakpointObserver) {
        this.totalPages = 0;
        this.breakpoint = new Promise<boolean>(resolve => {
            breakpointObserver.observe([
                Breakpoints.Small,
                Breakpoints.XSmall,
                Breakpoints.Medium,
                Breakpoints.Large,
                Breakpoints.XLarge
            ]).subscribe(value => {
                const portrait = breakpointObserver.isMatched([Breakpoints.WebPortrait, Breakpoints.HandsetPortrait, Breakpoints.TabletPortrait]);
                if (portrait) {
                    this.colspan = 4;
                    this.pageSize = 9;
                } else {
                    this.colspan = 2;
                    this.pageSize = 12;
                }
                console.log("breakpointObserver:", value);
                this.fontSize = determineFontSize(breakpointObserver);
                resolve(true);
            });
        });
        this.turnstileService.messages.subscribe(async value => {
            if (!environment.production) {
                console.log("Updated", value);
            }
            let current = this.turnstilePage._embedded.turnstiles.find(v => v.id == value.id)
            if (current) {
                if (current.locked != value.locked || current.currentState != value.currentState) {
                    // load if the links are changing
                    current = await this.turnstileService.get(current);
                } else {
                    current.message = value.message
                }
            }
            await this.updateTurnstile(current);
        });
    }


    async ngOnInit() {
        await this.listTurnstiles();
    }

    async listTurnstiles() {
        try {
            this.errorMessage.next(null);
            const pageRequest = this.pager ?
                this.pager.getPageable() :
                {size: this.pageSize};
            this.turnstilePage = await this.turnstileService.list(pageRequest);
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
            const created = await this.turnstileService.create();
        } catch (error) {
            console.debug('createTurnstile:error:', error);
            this.errorMessage.next(convertErrorToString(error));
        }
        return this.listTurnstiles();
    }

    async updateTurnstile(resource: TurnstileResource) {
        console.debug('updateTurnstile', resource);
        if (resource == null) {
            return this.listTurnstiles();
        }
        let found = false;
        const child = this.childTurnstiles.find(item => item.turnstile.id === resource.id);
        if (child) {
            child.turnstile = resource;
            child.setMessage(resource.message)
        } else {
            await this.listTurnstiles();
            const item = this.childTurnstiles.find(item => item.turnstile.id === resource.id);
            if (item) {
                item.turnstile = resource;
                if (resource.message && resource.message.length > 0) {
                    item.setMessage(resource.message)
                }
            }
        }
    }

    pageUpdated(event: Paged) {
        console.debug('pageUpdated:', event);
        this.turnstilePage = event as TurnstileResourcePage;
        this.turnstiles.next(this.turnstilePage._embedded);
    }
}
