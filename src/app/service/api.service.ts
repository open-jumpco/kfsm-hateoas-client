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

export interface SystemInfo {
    apiVersion: number;
    apiName: string;
}

export interface SystemInfoResource extends SystemInfo, Links {
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
            });
        }
    }

    getLinkName<R>(links: Links, linkName: string, params ?: any, reqOpts ?: any): Observable<R> {
        return this.getLink<R>(makeLink(links, linkName), params, reqOpts);
    }

    deleteLinkName<R>(links: Links, linkName: string, params ?: any, reqOpts ?: any): Observable<R> {
        return this.deleteLink<R>(makeLink(links, linkName), params, reqOpts);
    }

    putLinkName<T, R>(links: Links, linkName: string, body ?: T, params ?: any, reqOpts ?: any): Observable<R> {
        return this.putLink<T, R>(makeLink(links, linkName), body, params, reqOpts);
    }

    postLinkName<T, R>(links: Links, linkName: string, body ?: T, params ?: any, reqOpts ?: any): Observable<R> {
        return this.postLink<T, R>(makeLink(links, linkName), body, params, reqOpts);
    }

    patchLinkName<T, R>(links: Links, linkName: string, body ?: T, params ?: any, reqOpts ?: any): Observable<R> {
        return this.patchLink<T, R>(makeLink(links, linkName), body, params, reqOpts);
    }

    getLink<R>(link: Link, params ?: any, reqOpts ?: any): Observable<R> {
        if (link == null) {
            console.log('link is null');
        }
        return new Observable<R>(observer => {
            const url = makeUrl(link, params);
            const opts = addObserve(reqOpts);
            console.debug('get:url', link, url, opts);
            this.process(this.http.get<R>(url, opts), link, observer);
        });
    }

    private process<R>(request: Observable<HttpEvent<R>>, link: Link, observer: Subscriber<R>) {
        request.subscribe(response => {
            if (response instanceof HttpResponse) {
                const httpResponse = response as HttpResponse<R>;
                if (httpResponse.ok) {
                    console.debug('get:ok', link, httpResponse);
                    observer.next(httpResponse.body);
                } else {
                    console.debug('get:error', link, httpResponse);
                    observer.error(httpResponse);
                }
            }
        }, error => {
            console.error('getLink:error', link, error);
            observer.error(error);
        });
    }

    get<R>(endpoint: string, params ?: any, reqOpts ?: any): Observable<R> {
        return new Observable<R>(observer => {
            this.links().subscribe(linksResponse => {
                console.debug('links', linksResponse);
                this.getLinkName<R>(linksResponse, endpoint, params, reqOpts).subscribe(result => {
                    observer.next(result);
                }, error => {
                    observer.error(error);
                });
            }, error => {
                observer.error(error);
            });
        });
    }

    postLink<T, R>(link: Link, body ?: T, params ?: any, reqOpts ?: any): Observable<R> {
        return new Observable<R>(observer => {
            const url = makeUrl(link, params);
            const opts = addObserve(reqOpts);
            console.debug('post:url', link, url, body, params, opts);
            this.process(this.http.post<R>(url, body, opts), link, observer);
        });
    }

    post<T, R>(endpoint: string, body ?: T, params ?: any, reqOpts ?: any): Observable<R> {
        console.log('post', endpoint, body, params, reqOpts);
        return new Observable<R>(observer => {
            this.links().subscribe(linksResponse => {
                console.debug('links', linksResponse);
                this.postLinkName<T, R>(linksResponse, endpoint, body, params, reqOpts).subscribe(result => {
                    observer.next((result as R));
                }, error => {
                    observer.error(error);
                });
            }, error => {
                observer.error(error);
            });
        });
    }

    putLink<T, R>(link: Link, body ?: T, params ?: any, reqOpts ?: any): Observable<R> {
        return new Observable<R>(observer => {
            const url = makeUrl(link, params);
            const opts = addObserve(reqOpts);
            console.debug(`put:url=${url}`, link, opts);
            this.process(this.http.put<R>(url, body, opts), link, observer);
        });
    }

    put<T, R>(endpoint: string, body ?: T, params ?: any, reqOpts ?: any): Observable<R> {
        return new Observable<R>(observer => {
            this.links().subscribe(linksResponse => {
                console.debug('links', linksResponse);
                this.putLinkName<T, R>(linksResponse, endpoint, body, params, reqOpts).subscribe(response => {
                    observer.next(response);
                }, error => {
                    observer.error(error);
                });
            }, error => {
                observer.error(error);
            });
        });
    }

    deleteLink<R>(link: Link, params ?: any, reqOpts ?: any): Observable<R> {
        return new Observable<R>(observer => {
            const url = makeUrl(link, params);
            const opts = addObserve(reqOpts);
            console.debug(`delete:url=${url}`, link, opts);
            this.process(this.http.delete<R>(url, opts), link, observer);
        });
    }

    delete<R>(endpoint: string, params?: any, reqOpts?: any): Observable<R> {
        return new Observable<R>(observer => {
            this.links().subscribe(linksResponse => {
                console.debug('links', linksResponse);
                this.deleteLinkName<R>(linksResponse, endpoint, params, reqOpts).subscribe(response => {
                    observer.next(response);
                }, error => {
                    observer.error(error);
                });
            }, error => {
                observer.error(error);
            });
        });
    }

    patchLink<T, R>(link: Link, body: T, params ?: any, reqOpts ?: any): Observable<R> {
        return new Observable<R>(observer => {
            const url = makeUrl(link, params);
            const opts = addObserve(reqOpts);
            console.debug(`patch:url=${url}`, link, opts);
            this.process(this.http.patch<R>(url, body, opts), link, observer);
        });
    }

    patch<T, R>(endpoint: string, body: T, params ?: any, reqOpts ?: any): Observable<R> {
        return new Observable<R>(observer => {
            this.links().subscribe(linksResponse => {
                console.debug('links', linksResponse);
                this.patchLinkName<T, R>(linksResponse, endpoint, body, params, reqOpts).subscribe(response => {
                    observer.next(response);
                }, error => {
                    observer.error(error);
                });
            }, error => {
                observer.error(error);
            });
        });
    }

    request<T>(request: HttpRequest<T>): Observable<HttpEvent<any>> {
        console.debug('apiService:request:', request);
        return this.http.request<T>(request);
    }

}
