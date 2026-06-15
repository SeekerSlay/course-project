import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate      = useNavigate();

  const [form, setForm]   = useState({
    username: '', email: '', password: '', password2: '',
    first_name: '', last_name: '',
  });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.password2) {
      setError('Пароли не совпадают.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      const data = err.response?.data;
      if (data) {
        const msgs = Object.values(data).flat();
        setError(msgs[0] || 'Ошибка регистрации.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Регистрация</h1>

        {error && <p className="error">{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label>
              Имя
              <input name="first_name" value={form.first_name} onChange={handleChange} />
            </label>
            <label>
              Фамилия
              <input name="last_name" value={form.last_name} onChange={handleChange} />
            </label>
          </div>

          <label>
            Имя пользователя *
            <input name="username" required value={form.username} onChange={handleChange} />
          </label>

          <label>
            Email *
            <input type="email" name="email" required value={form.email} onChange={handleChange} />
          </label>

          <label>
            Пароль *
            <input type="password" name="password" required value={form.password} onChange={handleChange} />
          </label>

          <label>
            Повторите пароль *
            <input type="password" name="password2" required value={form.password2} onChange={handleChange} />
          </label>

          <button className="btn btn--primary btn--large" disabled={loading}>
            {loading ? 'Регистрация...' : 'Создать аккаунт'}
          </button>
        </form>

        <p className="auth-card__footer">
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </div>
    </div>
  );
}
