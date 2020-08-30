import {
    HttpClient,
    HttpErrorResponse,
    HttpEvent,
    HttpHeaders,
    HttpParams,
    HttpRequest,
    HttpResponse
} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable, Subscriber} from 'rxjs';
import {init} from 'rfc6570-expand';
import {environment} from 'app/../environments/environment';
import {expectNotNullFn, preconditionFn} from 'app/utils/errors.util';


export interface Links {
    _links?: { [key: string]: Link };
}

export interface Link {
    href: string;
    templated?: boolean;
}

export interface PageMetaData {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
}

export interface Paged extends Links {
    page: PageMetaData;
}

export interface PageRequest {
    sort?: string;
    size?: number;
    page?: number;
}

export interface SystemInfo {
    apiVersion: number;
    apiName: string;
}

export interface SystemInfoResource extends SystemInfo, Links {
}

export function convertErrorToString(error: any): string {
    if (!error) {
        return 'Unknown';
    }
    if (typeof error === 'string') {
        return error;
    }
    if (error.error && error.error.message) {
        return error.error.message;
    }
    if (error.status && typeof error.status === 'number') {
        const status = error.status as number;
        if (status === 0) {
            return 'Connection error';
        }
        switch (error.status as number) {
            case 405:
                return 'Unknown API error';
        }
    }
    if (error.message) {
        return error.message;
    }
    if (error.error) {
        return error.error;
    }
    return error.toString();
}


function addObserve(reqOpts?: any): any {
    let headers = new HttpHeaders();
    headers = headers.append('Access-Control-Allow-Origin', '*');
    const opts = {observe: 'response', responseType: 'json', headers};
    if (reqOpts && Object.getOwnPropertyNames(reqOpts).length !== 0) {
        for (const k of Object.keys(reqOpts)) {
            if (k === 'headers') {
                const hdr = reqOpts[k] as HttpHeaders;
                for (const h of hdr.keys()) {
                    headers = headers.append(h, hdr.get(h));
                }
                opts.headers = headers;
            } else {
                opts[k] = reqOpts[k];
            }
        }
    }
    return opts;
}


export function makeLink(links: Links, linkName: string): Link {
    // tslint:disable-next-line:no-console
    // console.debug('makeLink2', links, linkName);
    if (links._links) {
        return expectNotNullFn(links._links[linkName], () => `Expected ${linkName} from ${links}`);
    } else {
        return expectNotNullFn(links[linkName], () => `Expected ${linkName} from ${links}`);
    }
}

export function makeUrl(link: Link, params?: any): string {
    if (link.templated) {
        preconditionFn(params != null, () => `params required for ${link.href}`);
        const {expand} = init(link.href);
        const url = expand(params);
        console.debug(`makeUrl:${link.href}`, params);
        return url;
    }
    return link.href;
}


@Injectable({
    providedIn: 'root'
})
export class ApiService {
    private baseURL: string = environment.apiUrl;
    private systemInfo: SystemInfoResource;

    constructor(public http: HttpClient) {
    }


    /**
     * Provide a URL given endpoint name and parameters
     * @param endpoint
     * @param params
     */
    url(endpoint: string, params?: any): Observable<string> {
        return new Observable<string>(observer => {
            this.links().subscribe(linksResponse => {
                const url = makeUrl(makeLink(linksResponse, endpoint), params);
                // console.debug('url:', url);
                observer.next(url);
                observer.complete();
            }, error => {
                observer.error(error);
            });
        });
    }

    private links(): Observable<SystemInfoResource> {
        if (!this.systemInfo) {
            const sysInfoObs = new Observable<SystemInfoResource>(observer => {
                const params = new HttpParams().set('requestedVersion', '1');
                const opts = addObserve({params});
                this.http.get<SystemInfoResource>(this.baseURL, opts).subscribe(response => {
                    if (response instanceof HttpResponse) {
                        const httpResponse = response as HttpResponse<SystemInfoResource>;
                        if (httpResponse.ok) {
                            console.debug('links:ok', httpResponse);
                            observer.next(httpResponse.body);
                            observer.complete();
                        } else if (response instanceof HttpErrorResponse) {
                            const error = response as HttpErrorResponse;
                            console.error('links:error', error);
                            observer.error(error);
                        } else {
                            console.error('links:unknown', response);
                            observer.error(response);
                        }
                    }
                }, error => {
                    console.error('links:error', error);
                    observer.error(error);
                });
            });
            sysInfoObs.subscribe(result => {
                console.debug('links:', result);
                this.systemInfo = result;
            }, error => {
                console.error('links:error:', error);
                if (error.status === 417) {
                    alert(error.error);
                    document.location.reload(true);
                }
            });
            return sysInfoObs;
        } else {
            return new Observable<SystemInfoResource>(observer => {
                observer.next(this.systemInfo);
                observer.complete();
            });
        }
    }

    private processEvent<R>(request: Observable<HttpEvent<R>>, link: Link, observer: Subscriber<R>) {
        request.subscribe(response => {
            if (response instanceof HttpResponse) {
                const httpResponse = response as HttpResponse<R>;
                if (httpResponse.ok) {
                    console.debug('process:ok', link, httpResponse);
                    observer.next(httpResponse.body);
                    observer.complete();
                } else {
                    console.debug('process:response:error:', link, httpResponse);
                    observer.error(httpResponse);
                }
            }
        }, error => {
            console.error('process:error', link, error);
            observer.error(error);
        });
    }

    private process<R>(observer: Subscriber<R>, observable: Observable<R>) {
        observable.subscribe(result => {
            observer.next(result);
            observer.complete();
        }, error => {
            observer.error(error);
        });
    }

    getByLinkName<R>(links: Links, linkName: string, params ?: any, reqOpts ?: any): Observable<R> {
        return this.getByLink<R>(makeLink(links, linkName), params, reqOpts);
    }

    deleteByLinkName<R>(links: Links, linkName: string, params ?: any, reqOpts ?: any): Observable<R> {
        return this.deleteByLink<R>(makeLink(links, linkName), params, reqOpts);
    }

    putByLinkName<T, R>(links: Links, linkName: string, body ?: T, params ?: any, reqOpts ?: any): Observable<R> {
        return this.putByLink<T, R>(makeLink(links, linkName), body, params, reqOpts);
    }

    postByLinkName<T, R>(links: Links, linkName: string, body ?: T, params ?: any, reqOpts ?: any): Observable<R> {
        return this.postByLink<T, R>(makeLink(links, linkName), body, params, reqOpts);
    }

    patchByLinkName<T, R>(links: Links, linkName: string, body ?: T, params ?: any, reqOpts ?: any): Observable<R> {
        return this.patchByLink<T, R>(makeLink(links, linkName), body, params, reqOpts);
    }

    getByLink<R>(link: Link, params ?: any, reqOpts ?: any): Observable<R> {
        if (link == null) {
            console.log('link is null');
        }
        return new Observable<R>(observer => {
            const url = makeUrl(link, params);
            const opts = addObserve(reqOpts);
            console.debug('get:url', link, url, opts);
            this.processEvent(this.http.get<R>(url, opts), link, observer);
        });
    }

    get<R>(endpoint: string, params ?: any, reqOpts ?: any): Observable<R> {
        return new Observable<R>(observer => {
            this.links().subscribe(linksResponse => {
                console.debug('links', linksResponse);
                this.process(observer, this.getByLinkName<R>(linksResponse, endpoint, params, reqOpts));
            }, error => {
                observer.error(error);
            });
        });
    }

    postByLink<T, R>(link: Link, body ?: T, params ?: any, reqOpts ?: any): Observable<R> {
        return new Observable<R>(observer => {
            const url = makeUrl(link, params);
            const opts = addObserve(reqOpts);
            console.debug('post:url', link, url, body, params, opts);
            this.processEvent(this.http.post<R>(url, body, opts), link, observer);
        });
    }

    post<T, R>(endpoint: string, body ?: T, params ?: any, reqOpts ?: any): Observable<R> {
        console.log('post', endpoint, body, params, reqOpts);
        return new Observable<R>(observer => {
            this.links().subscribe(linksResponse => {
                console.debug('links', linksResponse);
                this.process(observer, this.postByLinkName<T, R>(linksResponse, endpoint, body, params, reqOpts));
            }, error => {
                observer.error(error);
            });
        });
    }

    putByLink<T, R>(link: Link, body ?: T, params ?: any, reqOpts ?: any): Observable<R> {
        return new Observable<R>(observer => {
            const url = makeUrl(link, params);
            const opts = addObserve(reqOpts);
            console.debug(`put:url=${url}`, link, opts);
            this.processEvent(this.http.put<R>(url, body, opts), link, observer);
        });
    }

    put<T, R>(endpoint: string, body ?: T, params ?: any, reqOpts ?: any): Observable<R> {
        return new Observable<R>(observer => {
            this.links().subscribe(linksResponse => {
                console.debug('links', linksResponse);
                this.process(observer, this.putByLinkName<T, R>(linksResponse, endpoint, body, params, reqOpts));
            }, error => {
                observer.error(error);
            });
        });
    }

    deleteByLink<R>(link: Link, params ?: any, reqOpts ?: any): Observable<R> {
        return new Observable<R>(observer => {
            const url = makeUrl(link, params);
            const opts = addObserve(reqOpts);
            console.debug(`delete:url=${url}`, link, opts);
            this.processEvent(this.http.delete<R>(url, opts), link, observer);
        });
    }

    delete<R>(endpoint: string, params?: any, reqOpts?: any): Observable<R> {
        return new Observable<R>(observer => {
            this.links().subscribe(linksResponse => {
                console.debug('links', linksResponse);
                this.process(observer, this.deleteByLinkName<R>(linksResponse, endpoint, params, reqOpts));
            }, error => {
                observer.error(error);
            });
        });
    }

    patchByLink<T, R>(link: Link, body: T, params ?: any, reqOpts ?: any): Observable<R> {
        return new Observable<R>(observer => {
            const url = makeUrl(link, params);
            const opts = addObserve(reqOpts);
            console.debug(`patch:url=${url}`, link, opts);
            this.processEvent(this.http.patch<R>(url, body, opts), link, observer);
        });
    }

    patch<T, R>(endpoint: string, body: T, params ?: any, reqOpts ?: any): Observable<R> {
        return new Observable<R>(observer => {
            this.links().subscribe(linksResponse => {
                console.debug('links', linksResponse);
                this.process(observer, this.patchByLinkName<T, R>(linksResponse, endpoint, body, params, reqOpts));
            }, error => {
                observer.error(error);
            });
        });
    }

    request<T>(request: HttpRequest<T>): Observable<HttpEvent<any>> {
        console.debug('apiService:request:', request);
        return this.http.request<T>(request);
    }

    self<T extends Links>(links: T): Observable<T> {
        return this.getByLinkName<T>(links, 'self');
    }

    selfPage<T extends Paged>(page: T, request?: PageRequest): Observable<T> {
        return this.getByLinkName<T>(page, 'self', request);
    }

    firstPage<T extends Paged>(page: T, request?: PageRequest): Observable<T> {
        return this.getByLinkName<T>(page, 'first', request);
    }

    lastPage<T extends Paged>(page: T, request?: PageRequest): Observable<T> {
        return this.getByLinkName<T>(page, 'last', request);
    }

    nextPage<T extends Paged>(page: T, request?: PageRequest): Observable<T> {
        return this.getByLinkName<T>(page, 'next', request);
    }

    prevPage<T extends Paged>(page: T, request?: PageRequest): Observable<T> {
        return this.getByLinkName<T>(page, 'prev', request);
    }
}
