import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {TurnstileApiService, TurnstileResource} from "app/service/turnstile-api.service";
import {BehaviorSubject} from "rxjs";
import {convertErrorToString} from "app/service/api.service";

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

    async sendEvent(event: string) {
        try {
            this.turnstile = await this.turnstileService.sendEvent(this.turnstile, event).toPromise();
            this.resourceUpdated.emit(this.turnstile);
            if (this.turnstile.message) {
                this.errorString.next(this.turnstile.message);
                const self = this;
                setTimeout(function () {
                    self.errorString.next(" ")
                }, 2000);
            } else {
                this.errorString.next(" ");
            }
        } catch (error) {
            console.error('sendEvent:', event, error);
            this.errorString.next(convertErrorToString(error));
            const self = this;
            setTimeout(function () {
                self.errorString.next(" ")
            }, 5000);
        }
    }

    async delete() {
        await this.turnstileService.delete(this.turnstile).toPromise();
        this.resourceUpdated.emit(null);
    }
}
