import { ApiProperty } from '@nestjs/swagger';
import { Result } from './result.dto';
import { ErrorCodes } from '../constants';

/**
 * Pagination Metadata
 */
export class PageMeta {
  @ApiProperty({ description: 'Current page number', example: 1 })
  page: number;

  @ApiProperty({ description: 'Page size', example: 10 })
  pageSize: number;

  @ApiProperty({ description: 'Total items count', example: 100 })
  total: number;

  @ApiProperty({ description: 'Total pages count', example: 10 })
  totalPages: number;

  @ApiProperty({ description: 'Has next page', example: true })
  hasNext: boolean;

  @ApiProperty({ description: 'Has previous page', example: false })
  hasPrev: boolean;

  constructor(page: number, pageSize: number, total: number) {
    this.page = page;
    this.pageSize = pageSize;
    this.total = total;
    this.totalPages = Math.ceil(total / pageSize);
    this.hasNext = page < this.totalPages;
    this.hasPrev = page > 1;
  }
}

/**
 * Paginated Data Response
 */
export class PageData<T> {
  @ApiProperty({ description: 'List of items', isArray: true })
  items: T[];

  @ApiProperty({ type: PageMeta, description: 'Pagination metadata' })
  meta: PageMeta;

  constructor(items: T[], page: number, pageSize: number, total: number) {
    this.items = items;
    this.meta = new PageMeta(page, pageSize, total);
  }
}

/**
 * Paginated Result Response
 */
export class PageResult<T> extends Result<PageData<T>> {
  constructor(items: T[], page: number, pageSize: number, total: number) {
    const pageData = new PageData(items, page, pageSize, total);
    super(ErrorCodes.SUCCESS.code, ErrorCodes.SUCCESS.message, pageData);
  }

  /**
   * Create paginated success response
   */
  static create<T>(
    items: T[],
    page: number,
    pageSize: number,
    total: number,
  ): PageResult<T> {
    return new PageResult(items, page, pageSize, total);
  }
}
