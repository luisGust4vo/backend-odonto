import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CalendarEventEntity } from './calendar.entity';

@Injectable()
export class CalendarService {
  constructor(
    @InjectRepository(CalendarEventEntity)
    private readonly repo: Repository<CalendarEventEntity>,
  ) {}

  async list() {
    const events = await this.repo.find({ order: { start: 'ASC' } });
    return events.map((event) => ({
      ...event,
      extendedProps: { calendar: event.calendar },
    }));
  }

  async create(body: Partial<CalendarEventEntity>) {
    const entity = this.repo.create({
      title: body.title || 'Sem título',
      start: body.start || new Date().toISOString().slice(0, 10),
      end: body.end || null,
      calendar: body.calendar || 'Primary',
      allDay: body.allDay ?? true,
    });
    const saved = await this.repo.save(entity);
    return { ...saved, extendedProps: { calendar: saved.calendar } };
  }

  async update(id: string, body: Partial<CalendarEventEntity>) {
    const current = await this.repo.findOne({ where: { id } });
    if (!current) throw new NotFoundException('Evento não encontrado.');

    const merged = this.repo.merge(current, {
      ...body,
      calendar: body.calendar || current.calendar || 'Primary',
    });
    const saved = await this.repo.save(merged);
    return { ...saved, extendedProps: { calendar: saved.calendar } };
  }
}
