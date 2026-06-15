import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productsAPI } from '../services/api';
import ProductCard from '../components/ui/ProductCard';
import Pagination from '../components/ui/Pagination';
import Spinner from '../components/ui/Spinner';

const PAGE_SIZE = 12;

export default function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories]     = useState([]);

  const page      = Number(searchParams.get('page') || 1);
  const search    = searchParams.get('search') || '';
  const category  = searchParams.get('category') || '';
  const ordering  = searchParams.get('ordering') || '-created_at';
  const minPrice  = searchParams.get('min_price') || '';
  const maxPrice  = searchParams.get('max_price') || '';
  const inStock   = searchParams.get('in_stock') || '';
  const isOrganic = searchParams.get('is_organic') || '';

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  };

  // React Query — кэширование каталога
  const queryParams = { page, page_size: PAGE_SIZE, search, category, ordering,
    min_price: minPrice, max_price: maxPrice, in_stock: inStock, is_organic: isOrganic };

  const { data, isLoading } = useQuery({
    queryKey: ['products', queryParams],
    queryFn: () => productsAPI.getList(queryParams).then(r => r.data),
    staleTime: 60_000,       // кэш 1 минута
    keepPreviousData: true,  // не мигать при смене страницы
  });

  const products = data?.results || [];
  const count    = data?.count   || 0;

  useEffect(() => {
    productsAPI.getCategories().then(({ data }) => {
      setCategories(Array.isArray(data) ? data : (data.results || []));
    });
  }, []);

  return (
    <div className="catalog-page">
      {/* Фильтры — боковая панель */}
      <aside className="catalog-page__sidebar">
        <h3>Фильтры</h3>

        <div className="filter-group">
          <label>Категория</label>
          <select value={category} onChange={(e) => setParam('category', e.target.value)}>
            <option value="">Все категории</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>{c.title}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Цена от</label>
          <input
            type="number" placeholder="0"
            value={minPrice}
            onChange={(e) => setParam('min_price', e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label>Цена до</label>
          <input
            type="number" placeholder="99999"
            value={maxPrice}
            onChange={(e) => setParam('max_price', e.target.value)}
          />
        </div>

        <label className="filter-checkbox">
          <input
            type="checkbox"
            checked={inStock === 'true'}
            onChange={(e) => setParam('in_stock', e.target.checked ? 'true' : '')}
          />
          Только в наличии
        </label>

        <label className="filter-checkbox">
          <input
            type="checkbox"
            checked={isOrganic === 'true'}
            onChange={(e) => setParam('is_organic', e.target.checked ? 'true' : '')}
          />
          Органик
        </label>

        <button
          className="btn btn--outline btn--small"
          onClick={() => setSearchParams({})}
        >
          Сбросить фильтры
        </button>
      </aside>

      {/* Основной контент */}
      <div className="catalog-page__main">
        {/* Строка поиска + сортировка */}
        <div className="catalog-page__toolbar">
          <input
            className="search-input"
            type="text"
            placeholder="Поиск товаров..."
            value={search}
            onChange={(e) => setParam('search', e.target.value)}
          />
          <select value={ordering} onChange={(e) => setParam('ordering', e.target.value)}>
            <option value="-created_at">Новинки</option>
            <option value="price">Цена ↑</option>
            <option value="-price">Цена ↓</option>
            <option value="-views">Популярные</option>
          </select>
        </div>

        <p className="catalog-page__count">Найдено: {count} товаров</p>

        {isLoading ? (
          <Spinner />
        ) : products.length === 0 ? (
          <div className="empty-state">
            <p>Товары не найдены. Попробуйте изменить фильтры.</p>
          </div>
        ) : (
          <div className="products-grid">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}

        <Pagination
          count={count}
          pageSize={PAGE_SIZE}
          currentPage={page}
          onPageChange={(p) => {
            const next = new URLSearchParams(searchParams);
            next.set('page', p);
            setSearchParams(next);
          }}
        />
      </div>
    </div>
  );
}
