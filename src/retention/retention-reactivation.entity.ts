import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('retention_reactivation')
export class RetentionReactivationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 160 })
  patientName: string;

  @Column({ type: 'varchar', length: 50 })
  phone: string;

  @Column({ type: 'timestamptz' })
  lastVisit: string;

  @Column({ type: 'int', default: 180 })
  suggestedReturnInDays: number;

  @Column({ type: 'varchar', length: 20, default: 'medium' })
  priority: string;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
