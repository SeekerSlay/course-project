import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();

  const [form, setForm]     = useState({
    first_name: user?.first_name || '',
    last_name:  user?.last_name  || '',
    bio:        user?.bio        || '',
    phone:      user?.phone      || '',
    address:    user?.address    || '',
  });
  const [success, setSuccess] = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const { data } = await authAPI.updateProfile(form);
      updateUser(data);
      setSuccess('Профиль успешно обновлён!');
    } catch {
      setError('Ошибка сохранения.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-page">
      <h1>Мой профиль</h1>

      <div className="profile-card">
        <div className="profile-card__avatar">
          {user?.avatar
            ? <img src={user.avatar} alt="Аватар" />
            : <div className="avatar-placeholder">👤</div>
          }
          <p className="profile-card__email">{user?.email}</p>
          {user?.is_staff && <span className="tag tag--admin">Администратор</span>}
        </div>

        <form className="profile-form" onSubmit={handleSubmit}>
          {success && <p className="success">{success}</p>}
          {error   && <p className="error">{error}</p>}

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
            О себе
            <textarea name="bio" rows={3} value={form.bio} onChange={handleChange} />
          </label>

          <label>
            Телефон
            <input name="phone" value={form.phone} onChange={handleChange} placeholder="+7 (999) 000-00-00" />
          </label>

          <label>
            Адрес доставки (по умолчанию)
            <textarea name="address" rows={2} value={form.address} onChange={handleChange} />
          </label>

          <button className="btn btn--primary" disabled={loading}>
            {loading ? 'Сохранение...' : 'Сохранить изменения'}
          </button>
        </form>
      </div>
    </div>
  );
}
