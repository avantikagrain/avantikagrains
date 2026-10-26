import { listProducts } from '@/server/admin';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/rbac';
import { EmptyState, PageTitle, Pagination, Panel } from '../ui';
import { ProductRow } from './product-row';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const search = params.q?.trim() || undefined;
  const page = Math.max(1, Number(params.page ?? 1) || 1);

  const [result, session] = await Promise.all([
    listProducts({ search, page, limit: PAGE_SIZE }),
    getSession(),
  ]);

  const canWrite = session ? hasPermission(session.role, 'product:write') : false;

  return (
    <>
      <PageTitle
        title="Catalogue"
        subtitle={`${result.total} product${result.total === 1 ? '' : 's'} · prices and stock are editable inline`}
      />

      <Panel>
        {result.rows.length === 0 ? (
          <EmptyState message="No products yet. Run the product seed to populate the catalogue." />
        ) : (
          <>
            <ul>
              {result.rows.map((product) => (
                <ProductRow
                  key={String(product._id)}
                  canWrite={canWrite}
                  product={{
                    id: String(product._id),
                    name: product.name,
                    slug: product.slug,
                    status: product.status,
                    isFeatured: product.isFeatured,
                    variants: product.variants.map((variant) => ({
                      id: String(variant._id),
                      sku: variant.sku,
                      packSize: variant.packSize,
                      pricePaise: variant.pricePaise,
                      mrpPaise: variant.mrpPaise,
                      stockQty: variant.stockQty,
                      reservedQty: variant.reservedQty,
                      availableQty: variant.availableQty,
                      lowStockThreshold: variant.lowStockThreshold,
                      isActive: variant.isActive,
                    })),
                  }}
                />
              ))}
            </ul>

            <Pagination
              page={page}
              totalPages={result.totalPages}
              basePath="/admin/products"
              params={{ q: search }}
            />
          </>
        )}
      </Panel>
    </>
  );
}
