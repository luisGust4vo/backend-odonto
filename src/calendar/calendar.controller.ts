import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto';
import { UpdateCalendarEventDto } from './dto/update-calendar-event.dto';
import { ListCalendarEventsDto } from './dto/list-calendar-events.dto';

@Controller('calendar/events')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get()
  getAll(@Query() query: ListCalendarEventsDto) {
    return this.calendarService.list(query);
  }

  @Post()
  create(@Body() dto: CreateCalendarEventDto) {
    return this.calendarService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCalendarEventDto) {
    return this.calendarService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.calendarService.remove(id);
  }
}
