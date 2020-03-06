import {Component, OnInit} from '@angular/core';
import {TurnstileApiService, TurnstileResources} from "app/service/turnstile-api.service";
import {BehaviorSubject} from "rxjs";

@Component({
    selector: 'app-turnstile-list',
    templateUrl: './turnstile-list.component.html',
    styleUrls: ['./turnstile-list.component.css']
})
export class TurnstileListComponent implements OnInit {
    turnstiles = new BehaviorSubject<TurnstileResources>(null);

    constructor(private turnstileService: TurnstileApiService) {
    }

    ngOnInit() {
        this.turnstileService.list().subscribe(response => {
            this.turnstiles.next(response._embedded);
        });
    }

    createTurnstile() {
        this.turnstileService.create().subscribe(created => {
            this.turnstileService.list().subscribe(response => {
                this.turnstiles.next(response._embedded);
            });
        });
    }
}
