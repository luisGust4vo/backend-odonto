import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('clinic_expenses')
export class ExpenseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 180 })
  description: string;

  @Column({ type: 'varchar', length: 80, default: 'Outros' })
  category: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  amount: number;

  @Column({ type: 'date' })
  dueDate: string;

  @Column({ type: 'varchar', length: 40, default: 'pending' })
  status: string;

  @Column({ type: 'varchar', length: 40, default: 'Pix' })
  paymentMethod: string;

  @Column({ type: 'varchar', length: 180, nullable: true })
  supplier: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
