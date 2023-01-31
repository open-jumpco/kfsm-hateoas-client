export const environment = {
    production: true,
    apiUrl: new URL(window.location.href).origin + '/api',
    wsUrl: new URL(window.location.href).origin.replace('https://', 'ws://').replace('http://', 'ws://') + '/ws'
};


/*
Copyright Google LLC. All Rights Reserved.
Use of this source code is governed by an MIT-style license that
can be found in the LICENSE file at http://angular.io/license
*/
