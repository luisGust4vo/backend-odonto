import { Controller, Get, Query } from '@nestjs/common';
import { CrawlerService } from './crawler.service';
import { SearchProductsDto } from './dto/search-products.dto';

@Controller('clinic/products')
export class CrawlerController {
  constructor(private readonly crawlerService: CrawlerService) {}

  @Get('search')
  search(@Query() query: SearchProductsDto) {
    return this.crawlerService.searchProducts(query);
  }
}
