import Navbar from './Navbar';

export default function Layout({ children }) {
  return (
    <div className="layout">
      <Navbar />
      <main className="layout__main">{children}</main>
      <footer className="layout__footer">
        <p>© 2026 VeganShop — магазин вегетарианской продукции</p>
      </footer>
    </div>
  );
}
