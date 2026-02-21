import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CalendarEventEntity } from './calendar.entity';
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto';
import { UpdateCalendarEventDto } from './dto/update-calendar-event.dto';
import { ListCalendarEventsDto } from './dto/list-calendar-events.dto';

const VALID_LEVELS = new Set(['primary', 'danger', 'success', 'warning']);

@Injectable()
export class CalendarService {
  constructor(
    @InjectRepository(CalendarEventEntity)
    private readonly repo: Repository<CalendarEventEntity>,
  ) {}

  async list(query: ListCalendarEventsDto = {}) {
    const qb = this.repo
      .createQueryBuilder('event')
      .orderBy('event.start', 'ASC')
      .addOrderBy('event.createdAt', 'ASC');

    if (query.start && query.end) {
      const rangeStart = this.parseDate(query.start, 'start');
      const rangeEnd = this.parseDate(query.end, 'end');

      if (rangeEnd.getTime() < rangeStart.getTime()) {
        throw new BadRequestException('Período inválido: end menor que start.');
      }

      qb.andWhere('event.start < :rangeEnd', { rangeEnd })
        .andWhere('COALESCE(event.end, event.start) >= :rangeStart', {
          rangeStart,
        });
    } else if (query.start) {
      const rangeStart = this.parseDate(query.start, 'start');
      qb.andWhere('COALESCE(event.end, event.start) >= :rangeStart', {
        rangeStart,
      });
    } else if (query.end) {
      const rangeEnd = this.parseDate(query.end, 'end');
      qb.andWhere('event.start < :rangeEnd', { rangeEnd });
    }

    const offset = query.offset ?? 0;
    const limit = query.limit ?? 500;

    qb.skip(offset).take(limit);

    const events = await qb.getMany();
    return events.map((event) => this.toResponse(event));
  }

  async create(dto: CreateCalendarEventDto) {
    const start = this.parseDate(dto.start, 'start');
    this.assertStartIsNotPast(start);

    const end = dto.end ? this.parseDate(dto.end, 'end') : null;
    this.assertDateRange(start, end);

    const entity = this.repo.create({
      title: dto.title.trim(),
      start,
      end,
      calendar: this.normalizeCalendarLevel(dto.calendar),
      allDay: dto.allDay ?? false,
    });

    const saved = await this.repo.save(entity);
    return this.toResponse(saved);
  }

  async update(id: string, dto: UpdateCalendarEventDto) {
    const current = await this.repo.findOne({ where: { id } });
    if (!current) throw new NotFoundException('Evento não encontrado.');

    const nextStart = dto.start ? this.parseDate(dto.start, 'start') : current.start;
    const nextEnd =
      dto.end === null ? null : dto.end ? this.parseDate(dto.end, 'end') : current.end;

    if (dto.start) {
      this.assertStartIsNotPast(nextStart);
    }
    this.assertDateRange(nextStart, nextEnd);

    const merged = this.repo.merge(current, {
      title: dto.title?.trim() ?? current.title,
      start: nextStart,
      end: nextEnd,
      calendar: this.normalizeCalendarLevel(dto.calendar ?? current.calendar),
      allDay: dto.allDay ?? current.allDay,
    });

    const saved = await this.repo.save(merged);
    return this.toResponse(saved);
  }

  async remove(id: string) {
    const result = await this.repo.delete({ id });
    if (!result.affected) {
      throw new NotFoundException('Evento não encontrado.');
    }
  }

  private parseDate(value: string, field: 'start' | 'end') {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(`Data inválida em ${field}.`);
    }
    return parsed;
  }

  private assertDateRange(start: Date, end: Date | null) {
    if (!end) return;
    if (end.getTime() < start.getTime()) {
      throw new BadRequestException('A data final deve ser maior ou igual à inicial.');
    }
  }

  private assertStartIsNotPast(start: Date) {
    const startDay = new Date(start);
    startDay.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDay.getTime() < today.getTime()) {
      throw new BadRequestException('Não é permitido agendar em dias passados.');
    }
  }

  private normalizeCalendarLevel(level?: string) {
    const raw = (level ?? 'primary').toLowerCase().trim();

    if (VALID_LEVELS.has(raw)) return raw;
    if (raw === 'atencao') return 'warning';
    if (raw === 'urgente') return 'danger';
    if (raw === 'confirmado') return 'success';
    if (raw === 'primary') return raw;

    return 'primary';
  }

  private toResponse(event: CalendarEventEntity) {
    return {
      id: event.id,
      title: event.title,
      start: event.start instanceof Date ? event.start.toISOString() : event.start,
      end: event.end instanceof Date ? event.end.toISOString() : event.end,
      calendar: event.calendar,
      allDay: event.allDay,
      extendedProps: { calendar: event.calendar },
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    };
  }
}
