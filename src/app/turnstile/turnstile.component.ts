import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {TurnstileApiService, TurnstileResource} from "app/service/turnstile-api.service";
import {BehaviorSubject} from "rxjs";

@Component({
    selector: 'app-turnstile',
    templateUrl: './turnstile.component.html',
    styleUrls: ['./turnstile.component.css']
})
export class TurnstileComponent implements OnInit {
    @Input() turnstile: TurnstileResource
    @Output() resourceUpdated = new EventEmitter<TurnstileResource>();

    errorString = new BehaviorSubject<string>(" ");

    constructor(private turnstileService: TurnstileApiService) {
    }

    ngOnInit() {
    }

    sendEvent(event: string) {
        this.turnstileService.sendEvent(this.turnstile, event).subscribe(response => {
            this.turnstile = response;
            this.resourceUpdated.emit(response);
            if (this.turnstile.message) {
                this.errorString.next(this.turnstile.message);
                const self = this;
                setTimeout(function () {
                    self.errorString.next(" ")
                }, 2000);
            } else {
                this.errorString.next(" ");
            }
        }, error => {
            if (error.error) {
                this.errorString = error.error;
            } else {
                this.errorString = error;
            }
            const self = this;
            setTimeout(function () {
                self.errorString.next(" ")
            }, 5000);
        });
    }
}
