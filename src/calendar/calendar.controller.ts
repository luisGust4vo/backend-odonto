import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { CalendarService } from './calendar.service';

@Controller('calendar/events')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get()
  getAll() {
    return this.calendarService.list();
  }

  @Post()
  create(@Body() body: any) {
    return this.calendarService.create(body);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.calendarService.update(id, body);
  }
}
