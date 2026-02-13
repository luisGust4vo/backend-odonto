import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('patient_records')
export class PatientRecordEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 160 })
  name: string;

  @Column({ type: 'varchar', length: 50 })
  phone: string;

  @Column({ type: 'date' })
  birthDate: string;

  @Column({ type: 'varchar', length: 20, default: 'low' })
  riskLevel: string;

  @Column({ type: 'jsonb', default: [] })
  allergies: string[];

  @Column({ type: 'timestamptz' })
  lastVisit: string;

  @Column({ type: 'timestamptz', nullable: true })
  nextVisit: string | null;

  @Column({ type: 'jsonb', default: [] })
  attachments: any[];

  @Column({ type: 'jsonb', default: [] })
  timeline: any[];

  @Column({ type: 'jsonb', default: [] })
  treatmentPlan: any[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
