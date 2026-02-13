import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('calendar_events')
export class CalendarEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 160 })
  title: string;

  @Column({ type: 'date' })
  start: string;

  @Column({ type: 'date', nullable: true })
  end: string | null;

  @Column({ type: 'varchar', length: 40, default: 'Primary' })
  calendar: string;

  @Column({ type: 'boolean', default: true })
  allDay: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
