import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('retention_appointments')
export class RetentionAppointmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 160 })
  patientName: string;

  @Column({ type: 'varchar', length: 50 })
  patientPhone: string;

  @Column({ type: 'timestamptz' })
  datetime: string;

  @Column({ type: 'varchar', length: 160 })
  procedure: string;

  @Column({ type: 'varchar', length: 120 })
  professional: string;

  @Column({ type: 'varchar', length: 40, default: 'pending_confirmation' })
  status: string;

  @Column({ type: 'varchar', length: 20, default: 'whatsapp' })
  reminderChannel: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
