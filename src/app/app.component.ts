import {Component, ViewChild} from '@angular/core';
import {BreakpointObserver, Breakpoints} from "@angular/cdk/layout";
import {TurnstileListComponent} from "app/turnstile-list/turnstile-list.component";

export function determineFontSize(breakpointObserver: BreakpointObserver): string {
    const portrait = breakpointObserver.isMatched([Breakpoints.WebPortrait, Breakpoints.HandsetPortrait, Breakpoints.TabletPortrait]);
    const web = breakpointObserver.isMatched(Breakpoints.Web);
    const tablet = breakpointObserver.isMatched(Breakpoints.Tablet);
    const handset = breakpointObserver.isMatched(Breakpoints.Handset);
    console.log("determineFontSize:portrait =", portrait, ', web =', web, ', tablet =', tablet, ', handset =', handset);
    if (handset) {
        return "9pt";
    } else {
        if (breakpointObserver.isMatched(Breakpoints.XSmall)) {
            return portrait ? "9pt" : "10pt";
        } else if (breakpointObserver.isMatched(Breakpoints.Small)) {
            return portrait ? "10pt" : "12pt";
        } else if (breakpointObserver.isMatched(Breakpoints.Medium)) {
            return portrait ? "12pt" : "14pt";
        } else if (breakpointObserver.isMatched(Breakpoints.Large)) {
            return portrait ? "14pt" : "16pt";
        } else if (breakpointObserver.isMatched(Breakpoints.XLarge)) {
            return portrait ? "16pt" : "18pt";
        }
    }
    return "10pt";
}

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent {
    @ViewChild(TurnstileListComponent) turnstileList: TurnstileListComponent
    fontSize: Promise<string>;

    constructor(breakpointObserver: BreakpointObserver) {
        this.fontSize = new Promise<string>(resolve => {
            breakpointObserver.observe([
                Breakpoints.Small,
                Breakpoints.XSmall,
                Breakpoints.Medium,
                Breakpoints.Large,
                Breakpoints.XLarge
            ]).subscribe(value => {
                console.log("breakpointObserver:", value);
                resolve(determineFontSize(breakpointObserver));
            });
        });
    }


}
