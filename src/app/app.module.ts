import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {RouterModule} from '@angular/router';
import {ReactiveFormsModule} from '@angular/forms';
import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';
import {AppComponent} from './app.component';
import {TurnstileComponent} from './turnstile/turnstile.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {TurnstileListComponent} from './turnstile-list/turnstile-list.component';
import {MatCardModule} from "@angular/material/card";
import {MatIconModule} from "@angular/material/icon";
import {MatButtonModule} from "@angular/material/button";
import {MatToolbarModule} from "@angular/material/toolbar";
import {BasicHttpInterceptor} from "app/basic-http-interceptor.service";
import {MatGridListModule} from "@angular/material/grid-list";
import { PagerComponent } from './pager/pager/pager.component'
import {MatPaginatorModule} from "@angular/material/paginator";

@NgModule({
    imports: [
        BrowserModule,
        ReactiveFormsModule,
        RouterModule.forRoot([
            {path: '', component: TurnstileComponent},
        ]),
        BrowserAnimationsModule,
        MatCardModule,
        MatIconModule,
        HttpClientModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatToolbarModule,
        MatGridListModule,
        MatPaginatorModule
    ],
  declarations: [
    AppComponent,
    TurnstileComponent,
    TurnstileListComponent,
    PagerComponent
  ],
  bootstrap: [ AppComponent ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: BasicHttpInterceptor,
      multi: true
    }
  ]
})
export class AppModule { }


/*
Copyright Google LLC. All Rights Reserved.
Use of this source code is governed by an MIT-style license that
can be found in the LICENSE file at http://angular.io/license
*/
