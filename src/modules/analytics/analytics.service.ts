import { AppDataSource } from '../../config/database';
import { Customer } from '../customers/entities/Customer';
import { Vendor } from '../vendors/entities/Vendor';
import { Order } from '../orders/entities/Order';
import { Settlement } from '../orders/entities/Settlement';
import { Product } from '../products/entities/Product';

function parseDate(dateValue?: string): Date | null {
  if (!dateValue) return null;
  const d = new Date(dateValue);
  return Number.isNaN(d.getTime()) ? null : d;
}

export class AnalyticsAdminService {
  async metadataBundle(): Promise<Record<string, unknown>> {
    const customerRepo = AppDataSource.getRepository(Customer);
    const vendorRepo = AppDataSource.getRepository(Vendor);
    const orderRepo = AppDataSource.getRepository(Order);
    const settlementRepo = AppDataSource.getRepository(Settlement);
    const productRepo = AppDataSource.getRepository(Product);

    const [
      totalCustomers,
      activeCustomers,
      totalVendors,
      activeVendors,
      totalOrders,
      completedOrders,
      totalSettlements,
      totalProducts,
    ] = await Promise.all([
      customerRepo.count(),
      customerRepo.count({ where: { status: 'active' } }),
      vendorRepo.count(),
      vendorRepo.count({ where: { status: 'active' } as any }),
      orderRepo.count(),
      orderRepo.count({ where: { status: 'completed' } }),
      settlementRepo.count(),
      productRepo.count(),
    ]);

    return {
      users: {
        customers: { total: totalCustomers, active: activeCustomers },
        vendors: { total: totalVendors, active: activeVendors },
      },
      commerce: {
        orders: { total: totalOrders, completed: completedOrders },
        settlements: { total: totalSettlements },
        products: { total: totalProducts },
      },
      generatedAt: new Date().toISOString(),
    };
  }

  async usersJoined(type: 'customers' | 'vendors', dateFrom?: string, dateTo?: string): Promise<{ total: number }> {
    const from = parseDate(dateFrom);
    const to = parseDate(dateTo);
    const repo = type === 'customers' ? AppDataSource.getRepository(Customer) : AppDataSource.getRepository(Vendor);
    const qb = repo.createQueryBuilder('u');
    if (from) qb.andWhere('u.createdAt >= :from', { from });
    if (to) qb.andWhere('u.createdAt <= :to', { to });
    const total = await qb.getCount();
    return { total };
  }
}
