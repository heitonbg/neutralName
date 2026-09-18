import React, { useState } from 'react';
import {
  moderateContent,
  validateAddress,
  moderateUrl
} from '../utils/contentModeration';

const CATEGORIES = [
  'Настольные игры',
  'Спорт',
  'Культура',
  'Кино',
  'Прогулка',
  'Музыка',
  'Другое'
];

const CreateEventForm = ({ onCreate, onCancel, userId, userName }) => {
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    date: '',
    time: '',
    format: 'Офлайн',
    address: '',
    district: '',
    limit: '',
    description: '',
    image: '',
    lat: 55.796,
    lng: 49.108
  });

  const [errors, setErrors] = useState({});
  const [publicPlaceConfirmed, setPublicPlaceConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const newErrors = {};

    const titleCheck = moderateContent(formData.title);
    if (!titleCheck.isClean) newErrors.title = titleCheck.reason;

    const descCheck = moderateContent(formData.description);
    if (!descCheck.isClean) newErrors.description = descCheck.reason;

    if (formData.format === 'Офлайн') {
      const addrCheck = validateAddress(formData.address);
      if (!addrCheck.isClean) newErrors.address = addrCheck.reason;
    }

    if (formData.image) {
      const urlCheck = moderateUrl(formData.image);
      if (!urlCheck.isClean) newErrors.image = urlCheck.reason;
    }

    if (!formData.title.trim()) newErrors.title = 'Введите название';
    if (!formData.category) newErrors.category = 'Выберите категорию';
    if (!formData.date) newErrors.date = 'Укажите дату';
    if (!formData.time) newErrors.time = 'Укажите время';
    if (formData.format === 'Офлайн' && !formData.address.trim())
      newErrors.address = 'Укажите место';
    if (!publicPlaceConfirmed)
      newErrors.publicPlace = 'Подтвердите, что встреча в общественном месте';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);

    const newEvent = {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      price: 'Бесплатно',
      date: `${formData.date}, ${formData.time}`,
      time: formData.time,
      format: formData.format,
      address: formData.format === 'Онлайн' ? 'Онлайн' : formData.address,
      district:
        formData.format === 'Онлайн'
          ? 'Онлайн'
          : formData.district || formData.address,
      maxParticipants: parseInt(formData.limit) || 50,
      participants: 1,
      image:
        formData.image ||
        'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=800&q=80',
      lat: formData.lat,
      lng: formData.lng,
      distance: '0.0 км',
      rating: 0,
      reviewsCount: 0,
      organizer: { id: userId, name: userName || 'Вы', avatar: '👤' }
    };

    try {
      await onCreate(newEvent);
    } catch (e) {
      setErrors({ submit: e.message || 'Ошибка создания события' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="create-form-v2">
      <div className="create-header">
        <button className="back-btn" onClick={onCancel} aria-label="Назад">
          ←
        </button>
        <div>
          <h1>Создать событие</h1>
          <p className="create-subtitle">
            Делитесь идеями. Собирайте людей. Делайте город ярче!
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Название */}
        <div className="form-group">
          <label>Название события</label>
          <div className={`input-with-icon ${errors.title ? 'error' : ''}`}>
            <span className="input-icon">✏️</span>
            <input
              name="title"
              placeholder="Например, Вечер настолок в «Смене»"
              value={formData.title}
              onChange={handleChange}
            />
          </div>
          {errors.title && <p className="error-text">⚠️ {errors.title}</p>}
        </div>

        {/* Категория */}
        <div className="form-group">
          <label>Категория</label>
          <div className={`input-with-icon select-wrapper ${errors.category ? 'error' : ''}`}>
            <span className="input-icon">⊞</span>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
            >
              <option value="">Выберите категорию</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <span className="select-chevron">▼</span>
          </div>
          {errors.category && <p className="error-text">⚠️ {errors.category}</p>}
        </div>

        {/* Дата и время */}
        <div className="form-row-2">
          <div className="form-group">
            <label>Дата</label>
            <div className={`input-with-icon ${errors.date ? 'error' : ''}`}>
              <span className="input-icon">📅</span>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
              />
            </div>
            {errors.date && <p className="error-text">⚠️ {errors.date}</p>}
          </div>
          <div className="form-group">
            <label>Время</label>
            <div className={`input-with-icon ${errors.time ? 'error' : ''}`}>
              <span className="input-icon">🕐</span>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
              />
            </div>
            {errors.time && <p className="error-text">⚠️ {errors.time}</p>}
          </div>
        </div>

        {/* Формат */}
        <div className="form-group">
          <label>Формат</label>
          <div className="format-segmented">
            <button
              type="button"
              className={formData.format === 'Офлайн' ? 'active' : ''}
              onClick={() => setFormData({ ...formData, format: 'Офлайн' })}
            >
              <span>👥</span> Офлайн
            </button>
            <button
              type="button"
              className={formData.format === 'Онлайн' ? 'active' : ''}
              onClick={() => setFormData({ ...formData, format: 'Онлайн' })}
            >
              <span>💻</span> Онлайн
            </button>
          </div>
        </div>

        {/* Место проведения */}
        {formData.format === 'Офлайн' && (
          <div className="form-group">
            <label>Место проведения</label>
            <div className="address-row">
              <div className={`input-with-icon ${errors.address ? 'error' : ''}`}>
                <span className="input-icon">📍</span>
                <input
                  name="address"
                  placeholder="Введите адрес"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>
              <button
                type="button"
                className="map-picker-btn"
                onClick={() =>
                  alert('Укажите адрес в поле слева — точка подставится автоматически')
                }
              >
                <span>🗺️</span> Указать на карте
              </button>
            </div>
            {errors.address && <p className="error-text">⚠️ {errors.address}</p>}

            {/* Мини-карта-заглушка */}
            <div className="mini-map-preview">
              <div className="mini-map-bg"></div>
              <div className="mini-map-pin">📍</div>
              <div className="mini-map-city">
                <span>📍</span> Казань
              </div>
            </div>

            <p className="hint-text-with-icon">
              <span className="hint-icon">ⓘ</span>
              Укажите примерное место — точный адрес увидят только после
              подтверждения участия.
            </p>
          </div>
        )}

        {/* Лимит участников */}
        <div className="form-group">
          <label>Лимит участников</label>
          <div className="limit-row">
            <div className="input-with-icon">
              <span className="input-icon">👥</span>
              <input
                type="number"
                name="limit"
                placeholder="Например, 20"
                value={formData.limit}
                onChange={handleChange}
              />
            </div>
            <span className="limit-hint">
              Оставьте пустым,
              <br />
              если нет ограничений
            </span>
          </div>
        </div>

        {/* Описание */}
        <div className="form-group">
          <label>Описание</label>
          <div className={`textarea-with-icon ${errors.description ? 'error' : ''}`}>
            <span className="textarea-icon">📄</span>
            <textarea
              name="description"
              rows="5"
              maxLength={1000}
              placeholder="Расскажите подробнее о событии...&#10;Что будет, для кого, какая атмосфера?"
              value={formData.description}
              onChange={handleChange}
            />
          </div>
          <p className="char-counter">{formData.description.length}/1000</p>
          {errors.description && (
            <p className="error-text">⚠️ {errors.description}</p>
          )}
        </div>

        {/* Согласие */}
        <div className="checkbox-group">
          <input
            type="checkbox"
            id="publicPlace"
            checked={publicPlaceConfirmed}
            onChange={(e) => setPublicPlaceConfirmed(e.target.checked)}
          />
          <label htmlFor="publicPlace">
            Подтверждаю, что мероприятие проходит в общественном месте
          </label>
        </div>
        {errors.publicPlace && (
          <p className="error-text">⚠️ {errors.publicPlace}</p>
        )}

        {errors.submit && (
          <p className="error-text submit-error">⚠️ {errors.submit}</p>
        )}

        <button type="submit" className="submit-btn-v2" disabled={submitting}>
          {submitting ? 'Создаём...' : 'Создать событие'}
        </button>
      </form>
    </div>
  );
};

export default CreateEventForm;