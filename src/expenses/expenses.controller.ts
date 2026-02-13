import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ExpensesService } from './expenses.service';

@Controller('clinic/expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  getAll() {
    return this.expensesService.list();
  }

  @Post()
  create(@Body() body: any) {
    return this.expensesService.create(body);
  }

  @Patch(':id')
  patch(@Param('id') id: string, @Body() body: any) {
    return this.expensesService.patch(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.expensesService.remove(id);
  }
}
