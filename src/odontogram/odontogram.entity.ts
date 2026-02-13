import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('odontogram_records')
export class OdontogramEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 80, unique: true })
  patientId: string;

  @Column({ type: 'jsonb', default: [] })
  selectedTeeth: string[];

  @Column({ type: 'jsonb', default: {} })
  toothNotes: Record<string, string>;

  @Column({ type: 'jsonb', default: {} })
  toothDetails: Record<string, unknown>;
}
