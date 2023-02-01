import {AfterViewInit, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {TurnstileApiService, TurnstileResource} from "app/service/turnstile-api.service";
import {BehaviorSubject} from "rxjs";
import {convertErrorToString} from "app/service/api.service";

@Component({
    selector: 'app-turnstile',
    templateUrl: './turnstile.component.html',
    styleUrls: ['./turnstile.component.css']
})
export class TurnstileComponent implements OnInit, AfterViewInit {
    @Input() turnstile: TurnstileResource
    @Output() resourceUpdated = new EventEmitter<TurnstileResource>();

    errorString = new BehaviorSubject<string>(" ");

    constructor(private turnstileService: TurnstileApiService) {
    }

    ngOnInit() {
    }

    ngAfterViewInit(): void {
        if(this.turnstile.message) {
            this.setMessage(this.turnstile.message);
        }
    }

    async sendEvent(event: string) {
        try {
            this.turnstile = await this.turnstileService.sendEvent(this.turnstile, event);
            this.resourceUpdated.emit(this.turnstile);
            this.setMessage(this.turnstile.message);
        } catch (error) {
            console.error('sendEvent:', event, error);
            this.errorString.next(convertErrorToString(error));
            const self = this;
            setTimeout(function () {
                self.errorString.next(" ")
            }, 5000);
        }
    }
    setMessage(message: string) {
        this.errorString.next(message ? message : " ");
    }
    async delete() {
        await this.turnstileService.delete(this.turnstile);
        this.resourceUpdated.emit(null);
    }
}
