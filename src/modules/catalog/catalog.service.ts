import { Repository } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { AuditService } from '../admin-core/services/audit.service';
import { CatalogCategory } from './entities/CatalogCategory';
import { CatalogServiceItem } from './entities/CatalogServiceItem';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateCatalogServiceDto } from './dto/create-catalog-service.dto';
import { UpdateCatalogServiceDto } from './dto/update-catalog-service.dto';

export class CatalogAdminService {
  private audit = new AuditService();

  async listCategories(includeInactive: boolean): Promise<CatalogCategory[]> {
    const repo = AppDataSource.getRepository(CatalogCategory);
    const qb = repo.createQueryBuilder('c').orderBy('c.sortOrder', 'ASC').addOrderBy('c.name', 'ASC');
    if (!includeInactive) qb.andWhere('c.isActive = :a', { a: true });
    return qb.getMany();
  }

  async getCategory(id: string): Promise<CatalogCategory | null> {
    return AppDataSource.getRepository(CatalogCategory).findOne({ where: { id } });
  }

  async createCategory(dto: CreateCategoryDto, actorSub: string, ip: string | undefined): Promise<CatalogCategory> {
    const repo = AppDataSource.getRepository(CatalogCategory);
    if (dto.parentId) {
      const p = await repo.findOne({ where: { id: dto.parentId } });
      if (!p) throw new Error('Parent category not found');
    }
    const row = repo.create({
      name: dto.name,
      availability: dto.availability ?? false,
      emergency: dto.emergency ?? false,
      trending: dto.trending ?? false,
      description: dto.description ?? null,
      slug: dto.slug ?? null,
      parentId: dto.parentId ?? null,
      thumbnailUrl: dto.thumbnailUrl ?? null,
      bannerUrls: dto.bannerUrls ?? null,
      iconUrl: dto.iconUrl ?? null,
      sortOrder: dto.sortOrder ?? 0,
      isActive: dto.isActive ?? true,
      metadata: dto.metadata ?? null,
    });
    await repo.save(row);
    await this.audit.log({
      actorSub,
      action: 'CREATE',
      entityType: 'CatalogCategory',
      entityId: row.id,
      metadata: { name: row.name },
      ipAddress: ip ?? null,
    });
    return row;
  }

  async updateCategory(id: string, dto: UpdateCategoryDto, actorSub: string, ip: string | undefined): Promise<CatalogCategory> {
    const repo = AppDataSource.getRepository(CatalogCategory);
    const row = await repo.findOne({ where: { id } });
    if (!row) throw new Error('Category not found');
    if (dto.parentId !== undefined) {
      if (dto.parentId === id) throw new Error('Category cannot be its own parent');
      if (dto.parentId) {
        const p = await repo.findOne({ where: { id: dto.parentId } });
        if (!p) throw new Error('Parent category not found');
        const cycle = await this.isCategoryDescendant(repo, id, dto.parentId);
        if (cycle) throw new Error('Invalid parent: would create a cycle');
      }
      row.parentId = dto.parentId;
    }
    if (dto.name !== undefined) row.name = dto.name;
    if (dto.availability !== undefined) row.availability = dto.availability;
    if (dto.emergency !== undefined) row.emergency = dto.emergency;
    if (dto.trending !== undefined) row.trending = dto.trending;
    if (dto.description !== undefined) row.description = dto.description;
    if (dto.slug !== undefined) row.slug = dto.slug;
    if (dto.thumbnailUrl !== undefined) row.thumbnailUrl = dto.thumbnailUrl;
    if (dto.bannerUrls !== undefined) row.bannerUrls = dto.bannerUrls;
    if (dto.iconUrl !== undefined) row.iconUrl = dto.iconUrl;
    if (dto.sortOrder !== undefined) row.sortOrder = dto.sortOrder;
    if (dto.isActive !== undefined) row.isActive = dto.isActive;
    if (dto.metadata !== undefined) row.metadata = dto.metadata;
    await repo.save(row);
    await this.audit.log({
      actorSub,
      action: 'UPDATE',
      entityType: 'CatalogCategory',
      entityId: row.id,
      metadata: { changes: dto },
      ipAddress: ip ?? null,
    });
    return row;
  }

  private async isCategoryDescendant(repo: Repository<CatalogCategory>, rootId: string, candidateParentId: string): Promise<boolean> {
    let current: string | null = candidateParentId;
    const visited = new Set<string>();
    while (current) {
      if (current === rootId) return true;
      if (visited.has(current)) return true;
      visited.add(current);
      const r = await repo.findOne({ where: { id: current } });
      current = r?.parentId ?? null;
    }
    return false;
  }

  async deleteCategory(id: string, actorSub: string, ip: string | undefined): Promise<void> {
    const repo = AppDataSource.getRepository(CatalogCategory);
    const row = await repo.findOne({ where: { id } });
    if (!row) throw new Error('Category not found');
    await repo.remove(row);
    await this.audit.log({
      actorSub,
      action: 'DELETE',
      entityType: 'CatalogCategory',
      entityId: id,
      metadata: { name: row.name },
      ipAddress: ip ?? null,
    });
  }

  async getService(id: string): Promise<CatalogServiceItem | null> {
    return AppDataSource.getRepository(CatalogServiceItem).findOne({ where: { id } });
  }

  async listServices(includeInactive: boolean): Promise<CatalogServiceItem[]> {
    const repo = AppDataSource.getRepository(CatalogServiceItem);
    const qb = repo.createQueryBuilder('s').orderBy('s.sortOrder', 'ASC').addOrderBy('s.name', 'ASC');
    if (!includeInactive) qb.andWhere('s.isActive = :a', { a: true });
    return qb.getMany();
  }

  async createService(dto: CreateCatalogServiceDto, actorSub: string, ip: string | undefined): Promise<CatalogServiceItem> {
    if (dto.categoryId) {
      const c = await this.getCategory(dto.categoryId);
      if (!c) throw new Error('Category not found');
    }
    const repo = AppDataSource.getRepository(CatalogServiceItem);
    const row = repo.create({
      categoryId: dto.categoryId ?? null,
      name: dto.name,
      availability: dto.availability ?? false,
      trending: dto.trending ?? false,
      iconUrl: dto.iconUrl ?? null,
      description: dto.description ?? null,
      sortOrder: dto.sortOrder ?? 0,
      isActive: dto.isActive ?? true,
      metadata: dto.metadata ?? null,
    });
    await repo.save(row);
    await this.audit.log({
      actorSub,
      action: 'CREATE',
      entityType: 'CatalogServiceItem',
      entityId: row.id,
      metadata: { name: row.name },
      ipAddress: ip ?? null,
    });
    return row;
  }

  async updateService(id: string, dto: UpdateCatalogServiceDto, actorSub: string, ip: string | undefined): Promise<CatalogServiceItem> {
    const repo = AppDataSource.getRepository(CatalogServiceItem);
    const row = await repo.findOne({ where: { id } });
    if (!row) throw new Error('Service not found');
    if (dto.categoryId !== undefined) {
      if (dto.categoryId) {
        const c = await this.getCategory(dto.categoryId);
        if (!c) throw new Error('Category not found');
      }
      row.categoryId = dto.categoryId;
    }
    if (dto.name !== undefined) row.name = dto.name;
    if (dto.availability !== undefined) row.availability = dto.availability;
    if (dto.trending !== undefined) row.trending = dto.trending;
    if (dto.iconUrl !== undefined) row.iconUrl = dto.iconUrl;
    if (dto.description !== undefined) row.description = dto.description;
    if (dto.sortOrder !== undefined) row.sortOrder = dto.sortOrder;
    if (dto.isActive !== undefined) row.isActive = dto.isActive;
    if (dto.metadata !== undefined) row.metadata = dto.metadata;
    await repo.save(row);
    await this.audit.log({
      actorSub,
      action: 'UPDATE',
      entityType: 'CatalogServiceItem',
      entityId: row.id,
      metadata: { changes: dto },
      ipAddress: ip ?? null,
    });
    return row;
  }

  async deleteService(id: string, actorSub: string, ip: string | undefined): Promise<void> {
    const repo = AppDataSource.getRepository(CatalogServiceItem);
    const row = await repo.findOne({ where: { id } });
    if (!row) throw new Error('Service not found');
    await repo.remove(row);
    await this.audit.log({
      actorSub,
      action: 'DELETE',
      entityType: 'CatalogServiceItem',
      entityId: id,
      metadata: { name: row.name },
      ipAddress: ip ?? null,
    });
  }

  async batchUnlinkServicesForCategory(categoryId: string, actorSub: string, ip: string | undefined): Promise<{ categoryId: string; updated: number }> {
    const cat = await this.getCategory(categoryId);
    if (!cat) throw new Error('Category not found');
    const repo = AppDataSource.getRepository(CatalogServiceItem);
    const result = await repo.update({ categoryId }, { categoryId: null });
    const updated = result.affected ?? 0;
    await this.audit.log({
      actorSub,
      action: 'BATCH_UPDATE',
      entityType: 'CatalogServiceItem',
      entityId: categoryId,
      metadata: { batch: 'unlink_category', updated },
      ipAddress: ip ?? null,
    });
    return { categoryId, updated };
  }

  batchProductsByCategoryStub(categoryId: string): { categoryId: string; updated: number; note: string } {
    return { categoryId, updated: 0, note: 'Deferred: integrate product catalog service.' };
  }
}
