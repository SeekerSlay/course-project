import { useEffect, useState } from 'react';
import { productsAPI } from '../services/api';
import ProductCard from '../components/ui/ProductCard';
import Spinner from '../components/ui/Spinner';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    productsAPI.getFavorites()
      .then(({ data }) => setFavorites(data))
      .finally(() => setLoading(false));
  }, []);

  const handleFavoriteToggle = (productId, isFav) => {
    if (!isFav) {
      // Оптимистично убрать из списка
      setFavorites((prev) => prev.filter((f) => f.product.id !== productId));
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="favorites-page">
      <h1>Избранное ({favorites.length})</h1>

      {favorites.length === 0 ? (
        <div className="empty-state">
          <p>Вы ещё не добавили товары в избранное.</p>
        </div>
      ) : (
        <div className="products-grid">
          {favorites.map((fav) => (
            <ProductCard
              key={fav.id}
              product={{ ...fav.product, is_favorited: true }}
              onFavoriteToggle={handleFavoriteToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
