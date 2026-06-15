import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import Layout from './components/layout/Layout';

import HomePage         from './pages/HomePage';
import ProductListPage  from './pages/ProductListPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage         from './pages/CartPage';
import CheckoutPage     from './pages/CheckoutPage';
import OrdersPage       from './pages/OrdersPage';
import OrderDetailPage  from './pages/OrderDetailPage';
import LoginPage        from './pages/LoginPage';
import RegisterPage     from './pages/RegisterPage';
import ProfilePage      from './pages/ProfilePage';
import FavoritesPage    from './pages/FavoritesPage';
import AdminPanelPage   from './pages/AdminPanelPage';
import CategoriesPage   from './pages/CategoriesPage';

import './index.css';

const queryClient = new QueryClient();

// Защищённый маршрут
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <Layout>
      <Routes>
        <Route path="/"           element={<HomePage />} />
        <Route path="/products"   element={<ProductListPage />} />
        <Route path="/products/:slug" element={<ProductDetailPage />} />
        <Route path="/cart"       element={<CartPage />} />
        <Route path="/login"      element={<LoginPage />} />
        <Route path="/register"   element={<RegisterPage />} />
        <Route path="/categories" element={<CategoriesPage />} />

        {/* Защищённые маршруты */}
        <Route path="/checkout"   element={<PrivateRoute><CheckoutPage /></PrivateRoute>} />
        <Route path="/orders"     element={<PrivateRoute><OrdersPage /></PrivateRoute>} />
        <Route path="/orders/:id" element={<PrivateRoute><OrderDetailPage /></PrivateRoute>} />
        <Route path="/profile"    element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        <Route path="/favorites"  element={<PrivateRoute><FavoritesPage /></PrivateRoute>} />
        <Route path="/admin-panel" element={<PrivateRoute><AdminPanelPage /></PrivateRoute>} />

        <Route path="*" element={<div style={{textAlign:'center',padding:'4rem'}}><h2>404 — Страница не найдена</h2></div>} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
