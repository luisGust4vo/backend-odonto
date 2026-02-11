import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly repo: Repository<User>,
  ) {}

  findByEmail(email: string) {
    return this.repo.findOne({ where: { email } });
  }

  // quando precisar validar senha, precisamos buscar com passwordHash (select:false)
  findByEmailWithPassword(email: string) {
    return this.repo
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .where('u.email = :email', { email })
      .getOne();
  }

  async createUser(input: {
    email: string;
    name: string;
    passwordHash: string;
    termsAccepted: boolean;
  }) {
    const user = this.repo.create(input);
    return this.repo.save(user);
  }
}
