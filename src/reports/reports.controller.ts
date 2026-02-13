import { Body, Controller, Post } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('odontology/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  create(@Body() body: any) {
    return this.reportsService.create(body);
  }
}
