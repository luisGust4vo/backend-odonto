import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExpenseEntity } from './expense.entity';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(ExpenseEntity)
    private readonly repo: Repository<ExpenseEntity>,
  ) {}

  list() {
    return this.repo.find({ order: { dueDate: 'DESC' } });
  }

  async create(body: any) {
    const entity = this.repo.create({
      description: body.description || 'Despesa',
      category: body.category || 'Outros',
      amount: Number(body.amount || 0),
      dueDate: body.dueDate || new Date().toISOString().slice(0, 10),
      status: body.status || 'pending',
      paymentMethod: body.paymentMethod || 'Pix',
      supplier: body.supplier || null,
      notes: body.notes || null,
    });

    return this.repo.save(entity);
  }

  async patch(id: string, body: any) {
    const current = await this.repo.findOne({ where: { id } });
    if (!current) throw new NotFoundException('Despesa não encontrada.');
    const merged = this.repo.merge(current, body);
    return this.repo.save(merged);
  }

  async remove(id: string) {
    await this.repo.delete({ id });
    return { message: 'Despesa removida.' };
  }
}
