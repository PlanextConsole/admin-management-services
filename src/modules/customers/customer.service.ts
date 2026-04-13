import { AppDataSource } from '../../config/database';
import { AuditService } from '../admin-core/services/audit.service';
import { Customer } from './entities/Customer';
import { Coupon } from './entities/Coupon';
import { Occupation } from './entities/Occupation';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CreateOccupationDto } from './dto/create-occupation.dto';
import { UpdateOccupationDto } from './dto/update-occupation.dto';

export class CustomerAdminService {
  private audit = new AuditService();

  async listCustomers(limit: number, offset: number): Promise<{ items: Customer[]; total: number }> {
    const repo = AppDataSource.getRepository(Customer);
    const [items, total] = await repo.findAndCount({
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
    return { items, total };
  }

  async updateCustomer(
    id: string,
    dto: UpdateCustomerDto,
    actorSub: string,
    ip: string | undefined
  ): Promise<Customer> {
    const repo = AppDataSource.getRepository(Customer);
    const row = await repo.findOne({ where: { id } });
    if (!row) throw new Error('Customer not found');
    if (dto.fullName !== undefined) row.fullName = dto.fullName;
    if (dto.email !== undefined) row.email = dto.email;
    if (dto.phone !== undefined) row.phone = dto.phone;
    if (dto.status !== undefined) row.status = dto.status;
    if (dto.occupationId !== undefined) row.occupationId = dto.occupationId;
    if (dto.keycloakUserId !== undefined) row.keycloakUserId = dto.keycloakUserId;
    if (dto.metadata !== undefined) row.metadata = dto.metadata;
    await repo.save(row);
    await this.audit.log({
      actorSub,
      action: 'UPDATE',
      entityType: 'Customer',
      entityId: row.id,
      metadata: { changes: dto },
      ipAddress: ip ?? null,
    });
    return row;
  }

  async deleteCustomer(id: string, actorSub: string, ip: string | undefined): Promise<void> {
    const repo = AppDataSource.getRepository(Customer);
    const row = await repo.findOne({ where: { id } });
    if (!row) throw new Error('Customer not found');
    await repo.remove(row);
    await this.audit.log({
      actorSub,
      action: 'DELETE',
      entityType: 'Customer',
      entityId: id,
      metadata: { fullName: row.fullName },
      ipAddress: ip ?? null,
    });
  }

  /** Resolve by profile UUID or Keycloak `sub` (matches `commerce_orders.customer_id`). */
  async getCustomer(id: string): Promise<Customer | null> {
    return AppDataSource.getRepository(Customer).findOne({
      where: [{ id }, { keycloakUserId: id }],
    });
  }

  async createCustomer(dto: any, actorSub: string, ip: string | undefined): Promise<Customer> {
    const repo = AppDataSource.getRepository(Customer);
    const row = repo.create({
      fullName: dto.fullName,
      email: dto.email ?? null,
      phone: dto.phone ?? null,
      status: dto.status ?? 'active',
      occupationId: dto.occupationId ?? null,
      keycloakUserId: dto.keycloakUserId ?? null,
      metadata: dto.metadata ?? null,
    });
    await repo.save(row);
    await this.audit.log({
      actorSub,
      action: 'CREATE',
      entityType: 'Customer',
      entityId: row.id,
      metadata: { fullName: row.fullName },
      ipAddress: ip ?? null,
    });
    return row;
  }

  async listAllCoupons(limit: number, offset: number): Promise<{ items: Coupon[]; total: number }> {
    const repo = AppDataSource.getRepository(Coupon);
    const [items, total] = await repo.findAndCount({
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
    return { items, total };
  }

  async createCoupon(dto: any, actorSub: string, ip: string | undefined): Promise<Coupon> {
    const repo = AppDataSource.getRepository(Coupon);
    const row = repo.create({
      code: dto.code,
      title: dto.title,
      status: dto.status ?? 'active',
      discountJson: dto.discountJson ?? null,
      validFrom: dto.validFrom ? new Date(dto.validFrom) : null,
      validTo: dto.validTo ? new Date(dto.validTo) : null,
    });
    await repo.save(row);
    await this.audit.log({
      actorSub,
      action: 'CREATE',
      entityType: 'Coupon',
      entityId: row.id,
      metadata: { code: row.code },
      ipAddress: ip ?? null,
    });
    return row;
  }

  async updateCoupon(id: string, dto: any, actorSub: string, ip: string | undefined): Promise<Coupon> {
    const repo = AppDataSource.getRepository(Coupon);
    const row = await repo.findOne({ where: { id } });
    if (!row) throw new Error('Coupon not found');
    if (dto.code !== undefined) row.code = dto.code;
    if (dto.title !== undefined) row.title = dto.title;
    if (dto.status !== undefined) row.status = dto.status;
    if (dto.discountJson !== undefined) row.discountJson = dto.discountJson;
    if (dto.validFrom !== undefined) row.validFrom = dto.validFrom ? new Date(dto.validFrom) : null;
    if (dto.validTo !== undefined) row.validTo = dto.validTo ? new Date(dto.validTo) : null;
    await repo.save(row);
    await this.audit.log({
      actorSub,
      action: 'UPDATE',
      entityType: 'Coupon',
      entityId: row.id,
      metadata: { changes: dto },
      ipAddress: ip ?? null,
    });
    return row;
  }

  async deleteCoupon(id: string, actorSub: string, ip: string | undefined): Promise<void> {
    const repo = AppDataSource.getRepository(Coupon);
    const row = await repo.findOne({ where: { id } });
    if (!row) throw new Error('Coupon not found');
    await repo.remove(row);
    await this.audit.log({
      actorSub,
      action: 'DELETE',
      entityType: 'Coupon',
      entityId: id,
      metadata: { code: row.code },
      ipAddress: ip ?? null,
    });
  }

  async getOccupation(id: string): Promise<Occupation | null> {
    return AppDataSource.getRepository(Occupation).findOne({ where: { id } });
  }

  async deleteOccupation(id: string, actorSub: string, ip: string | undefined): Promise<void> {
    const repo = AppDataSource.getRepository(Occupation);
    const row = await repo.findOne({ where: { id } });
    if (!row) throw new Error('Occupation not found');
    await repo.remove(row);
    await this.audit.log({
      actorSub,
      action: 'DELETE',
      entityType: 'Occupation',
      entityId: id,
      metadata: { name: row.name },
      ipAddress: ip ?? null,
    });
  }

  async listOccupations(): Promise<Occupation[]> {
    return AppDataSource.getRepository(Occupation).find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async listOccupationsAll(includeInactive: boolean): Promise<Occupation[]> {
    if (includeInactive) {
      return AppDataSource.getRepository(Occupation).find({
        order: { sortOrder: 'ASC', name: 'ASC' },
      });
    }
    return this.listOccupations();
  }

  async createOccupation(
    dto: CreateOccupationDto,
    actorSub: string,
    ip: string | undefined
  ): Promise<Occupation> {
    const repo = AppDataSource.getRepository(Occupation);
    const row = repo.create({
      name: dto.name,
      sortOrder: dto.sortOrder ?? 0,
      isActive: dto.isActive ?? true,
    });
    await repo.save(row);
    await this.audit.log({
      actorSub,
      action: 'CREATE',
      entityType: 'Occupation',
      entityId: row.id,
      metadata: { name: row.name },
      ipAddress: ip ?? null,
    });
    return row;
  }

  async updateOccupation(
    id: string,
    dto: UpdateOccupationDto,
    actorSub: string,
    ip: string | undefined
  ): Promise<Occupation> {
    const repo = AppDataSource.getRepository(Occupation);
    const row = await repo.findOne({ where: { id } });
    if (!row) throw new Error('Occupation not found');
    if (dto.name !== undefined) row.name = dto.name;
    if (dto.sortOrder !== undefined) row.sortOrder = dto.sortOrder;
    if (dto.isActive !== undefined) row.isActive = dto.isActive;
    await repo.save(row);
    await this.audit.log({
      actorSub,
      action: 'UPDATE',
      entityType: 'Occupation',
      entityId: row.id,
      metadata: { changes: dto },
      ipAddress: ip ?? null,
    });
    return row;
  }
}
