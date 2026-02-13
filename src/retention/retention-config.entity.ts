import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('retention_config')
export class RetentionConfigEntity {
  @PrimaryColumn({ type: 'varchar', length: 30 })
  id: string;

  @Column({ type: 'jsonb', default: {} })
  templates: Record<string, unknown>;

  @Column({ type: 'jsonb', default: {} })
  settings: Record<string, unknown>;
}
