import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {ApiService, asPromise, Paged, PageRequest} from "app/service/api.service";
import {PageEvent} from "@angular/material/paginator";

@Component({
    selector: 'app-pager',
    templateUrl: './pager.component.html',
    styleUrls: ['./pager.component.css']
})
export class PagerComponent implements OnInit {
    @Input() pagedResource: Paged;
    @Input() sort: string | null;
    @Input() size: number | null;
    @Output() pageUpdated = new EventEmitter<Paged>();
    @Input() sortOptions: string[];
    @Input() pageSizes: number[];

    constructor(private apiService: ApiService) {
        if (!this.pageSizes) {
            this.pageSizes = [5, 10, 20, 50];
        }
        if(!this.size) {
            this.size = 10;
        }
    }

    ngOnInit(): void {
    }

    async reload(pageRequest: PageRequest) {
        this.pagedResource = await this.apiService.selfPage(this.pagedResource, pageRequest);
        this.size = this.pagedResource.page.size;
        this.pageUpdated.emit(this.pagedResource);
    }

    getPageable(): PageRequest {
        return {
            size: this.size,
            sort: this.sort,
            page: this.pagedResource?.page?.number
        };
    }

    async first() {
        this.pagedResource = await this.apiService.firstPage(this.pagedResource, this.getPageable());
        this.size = this.pagedResource.page.size;
        this.pageUpdated.emit(this.pagedResource);
    }

    async next() {
        this.pagedResource = await this.apiService.nextPage(this.pagedResource, this.getPageable());
        this.size = this.pagedResource.page.size;
        this.pageUpdated.emit(this.pagedResource);
    }

    async prev() {
        this.pagedResource = await this.apiService.prevPage(this.pagedResource, this.getPageable());
        this.size = this.pagedResource.page.size;
        this.pageUpdated.emit(this.pagedResource);
    }

    async last() {
        this.pagedResource = await this.apiService.lastPage(this.pagedResource, this.getPageable());
        this.size = this.pagedResource.page.size;
        this.pageUpdated.emit(this.pagedResource);
    }

    async pageEvent(event: PageEvent) {
        if (this.size !== event.pageSize) {
            this.size = event.pageSize;
        }
        if (event.pageIndex !== this.pagedResource.page.number) {
            if (event.pageIndex == 0) {
                return this.first();
            }
            if (this.pagedResource.page.number + 1 === event.pageIndex) {
                return this.next();
            } else if (this.pagedResource.page.number - 1 === event.pageIndex) {
                return this.prev();
            } else if (this.pagedResource.page.totalPages - 1 === event.pageIndex) {
                return this.last();
            } else {
                return this.reload({page: event.pageIndex, size: event.pageSize});
            }
        }
    }
}
