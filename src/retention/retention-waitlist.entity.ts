import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('retention_waitlist')
export class RetentionWaitlistEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 160 })
  patientName: string;

  @Column({ type: 'varchar', length: 50 })
  phone: string;

  @Column({ type: 'varchar', length: 20, default: 'any' })
  preferredPeriod: string;

  @Column({ type: 'varchar', length: 160 })
  treatment: string;

  @Column({ type: 'varchar', length: 20, default: 'normal' })
  urgency: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
