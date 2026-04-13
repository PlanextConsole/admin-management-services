/**
 * Cross-domain batch updates when a vendor is removed or deactivated.
 * Implementations should call catalog / order / settlement services when those exist.
 */
export type CascadeResource =
  | 'products'
  | 'orders'
  | 'settlements'
  | 'product_requests'
  | 'coupons'
  | 'vendor_reviews'
  | 'organization_orders'
  | 'service_notifications';

export class VendorCascadeService {
  async acknowledgeBatch(
    vendorId: string,
    resource: CascadeResource
  ): Promise<{ vendorId: string; resource: CascadeResource; updated: number; note: string }> {
    return {
      vendorId,
      resource,
      updated: 0,
      note: 'Deferred: integrate catalog, order, and settlement microservices.',
    };
  }

  async deleteServiceNotificationsForVendor(
    vendorId: string
  ): Promise<{ vendorId: string; deleted: number; note: string }> {
    return {
      vendorId,
      deleted: 0,
      note: 'Deferred: integrate notification service.',
    };
  }
}
