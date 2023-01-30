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
import {parseTemplate} from 'url-template';
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
    if (error?.error?.detail) {
        return error.error.detail;
    }
    if (error?.error?.title) {
        return error.error.title;
    }
    if (error?.error?.message) {
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
    if (links._links) {
        return expectNotNullFn(links._links[linkName], () => `Expected ${linkName} from ${links}`);
    } else {
        return expectNotNullFn(links[linkName], () => `Expected ${linkName} from ${links}`);
    }
}

export function makeUrl(link: Link, params?: any): string {
    let result = link.href;
    if (link.templated) {
        preconditionFn(params != null, () => `params required for ${link.href}`);
        const template = parseTemplate(link.href);
        const url = template.expand(params);
        console.debug(`makeUrl:${link.href}`, params);
        result = url;
    }
    if (params != null) {
        const url = new URL(result);
        for (const param of Object.keys(params)) {
            const value = params[param];
            if (value !== null && value !== undefined) {
                if (!url.searchParams.has(param) && !link.href.includes('{' + param + '}')) {
                    console.debug('makeUrl:add:', param, '=', value);
                    url.searchParams.append(param, value);
                }
            }
        }
        result = url.toString();
    }
    return result;
}

export function asPromise<T>(observable: Observable<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        observable.subscribe({
            next: (data) => resolve(data),
            error: (err) => reject(err)
        });
    });
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
    async url(endpoint: string, params?: any): Promise<string> {
        const linksResponse = await this.links();
        return makeUrl(makeLink(linksResponse, endpoint), params);
    }


    private async links(): Promise<SystemInfoResource> {
        if (!this.systemInfo) {
            const params = new HttpParams().set('requestedVersion', '1');
            const opts = addObserve({params});
            try {
                const response = await asPromise(this.http.get<SystemInfoResource>(this.baseURL, opts));
                if (response instanceof HttpResponse) {
                    const httpResponse = response as HttpResponse<SystemInfoResource>;
                    if (httpResponse.ok) {
                        console.debug('links:ok', httpResponse);
                        this.systemInfo = httpResponse.body;
                    } else if (response instanceof HttpErrorResponse) {
                        const error = response as HttpErrorResponse;
                        console.error('links:error', error);
                        throw error;
                    } else {
                        console.error('links:unknown', response);
                        throw response;
                    }
                }
            } catch (error) {
                if (error.status === 417) {
                    alert(error.error);
                    document.location.reload();
                    return null;
                }
                console.error('links:error', error);
                throw error;
            }
        }
        return this.systemInfo
    }

    private processEvent<R>(response: HttpEvent<R>, link: Link): R {
        if (response instanceof HttpResponse) {
            const httpResponse = response as HttpResponse<R>;
            if (httpResponse.ok) {
                console.debug('process:ok', link, httpResponse);
                return httpResponse.body;
            } else {
                console.debug('process:response:error:', link, httpResponse);
                throw httpResponse;
            }
        } else {
            throw response
        }
    }

    async getByLinkName<R>(links: Links, linkName: string, params ?: any, reqOpts ?: any): Promise<R> {
        return this.getByLink<R>(makeLink(links, linkName), params, reqOpts);
    }

    async deleteByLinkName<R>(links: Links, linkName: string, params ?: any, reqOpts ?: any): Promise<R> {
        return this.deleteByLink<R>(makeLink(links, linkName), params, reqOpts);
    }

    async putByLinkName<T, R>(links: Links, linkName: string, body ?: T, params ?: any, reqOpts ?: any): Promise<R> {
        return this.putByLink<T, R>(makeLink(links, linkName), body, params, reqOpts);
    }

    async postByLinkName<T, R>(links: Links, linkName: string, body ?: T, params ?: any, reqOpts ?: any): Promise<R> {
        return this.postByLink<T, R>(makeLink(links, linkName), body, params, reqOpts);
    }

    async patchByLinkName<T, R>(links: Links, linkName: string, body ?: T, params ?: any, reqOpts ?: any): Promise<R> {
        return this.patchByLink<T, R>(makeLink(links, linkName), body, params, reqOpts);
    }

    async getByLink<R>(link: Link, params ?: any, reqOpts ?: any): Promise<R> {
        if (link == null) {
            console.log('link is null');
        }
        const url = makeUrl(link, params);
        const opts = addObserve(reqOpts);
        console.debug('get:url', link, url, opts);
        return this.processEvent(await asPromise(this.http.get<R>(url, opts)), link);
    }

    async get<R>(endpoint: string, params ?: any, reqOpts ?: any): Promise<R> {
        const linksResponse = await this.links();
        console.debug('links', linksResponse);
        return this.getByLinkName<R>(linksResponse, endpoint, params, reqOpts);
    }

    async postByLink<T, R>(link: Link, body ?: T, params ?: any, reqOpts ?: any): Promise<R> {
        const url = makeUrl(link, params);
        const opts = addObserve(reqOpts);
        console.debug('post:url', link, url, body, params, opts);
        return this.processEvent(await asPromise(this.http.post<R>(url, body, opts)), link);
    }

    async post<T, R>(endpoint: string, body ?: T, params ?: any, reqOpts ?: any): Promise<R> {
        console.log('post', endpoint, body, params, reqOpts);
        const linksResponse = await this.links();
        console.debug('links', linksResponse);
        return this.postByLinkName<T, R>(linksResponse, endpoint, body, params, reqOpts);
    }

    async putByLink<T, R>(link: Link, body ?: T, params ?: any, reqOpts ?: any): Promise<R> {
        const url = makeUrl(link, params);
        const opts = addObserve(reqOpts);
        console.debug(`put:url=${url}`, link, opts);
        return this.processEvent(await asPromise(this.http.put<R>(url, body, opts)), link);
    }

    async put<T, R>(endpoint: string, body ?: T, params ?: any, reqOpts ?: any): Promise<R> {
        const linksResponse = await this.links();
        console.debug('links', linksResponse);
        return this.putByLinkName<T, R>(linksResponse, endpoint, body, params, reqOpts);
    }

    async deleteByLink<R>(link: Link, params ?: any, reqOpts ?: any): Promise<R> {
        const url = makeUrl(link, params);
        const opts = addObserve(reqOpts);
        console.debug(`delete:url=${url}`, link, opts);
        return this.processEvent(await asPromise(this.http.delete<R>(url, opts)), link);

    }

    async delete<R>(endpoint: string, params?: any, reqOpts?: any): Promise<R> {
        const linksResponse = await this.links();
        console.debug('links', linksResponse);
        return await this.deleteByLinkName<R>(linksResponse, endpoint, params, reqOpts);
    }

    async patchByLink<T, R>(link: Link, body: T, params ?: any, reqOpts ?: any): Promise<R> {
        const url = makeUrl(link, params);
        const opts = addObserve(reqOpts);
        console.debug(`patch:url=${url}`, link, opts);
        return this.processEvent(await asPromise(this.http.patch<R>(url, body, opts)), link);
    }

    async patch<T, R>(endpoint: string, body: T, params ?: any, reqOpts ?: any): Promise<R> {
        const linksResponse = await this.links();
        console.debug('links', linksResponse);
        return this.patchByLinkName<T, R>(linksResponse, endpoint, body, params, reqOpts);
    }

    async request<T>(request: HttpRequest<T>): Promise<HttpEvent<any>> {
        console.debug('apiService:request:', request);
        return asPromise(this.http.request<T>(request));
    }

    async self<T extends Links>(links: T): Promise<T> {
        return this.getByLinkName<T>(links, 'self');
    }

    async selfPage<T extends Paged>(page: T, request?: PageRequest): Promise<T> {
        return this.getByLinkName<T>(page, 'self', request);
    }

    async firstPage<T extends Paged>(page: T, request?: PageRequest): Promise<T> {
        return this.getByLinkName<T>(page, 'first', request);
    }

    async lastPage<T extends Paged>(page: T, request?: PageRequest): Promise<T> {
        return this.getByLinkName<T>(page, 'last', request);
    }

    async nextPage<T extends Paged>(page: T, request?: PageRequest): Promise<T> {
        return this.getByLinkName<T>(page, 'next', request);
    }

    async prevPage<T extends Paged>(page: T, request?: PageRequest): Promise<T> {
        return this.getByLinkName<T>(page, 'prev', request);
    }
}
