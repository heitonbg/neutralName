import styles from "./ConsentScreen.module.css";

const ConsentScreen = ({ onAccept }) => {
  return (
    <div className={styles.screen}>
      <div className={styles.icon}>
        <img src="/logo.png" alt="Вместе" className={styles.logo} />
      </div>
      <h1 className={styles.title}>Вместе</h1>
      <p className={styles.subtitle}>
        Делитесь идеями. Собирайте людей. Делайте город ярче!
      </p>

      <div className={styles.card}>
        <h3>Согласие на обработку данных</h3>
        <p>
          Для работы приложения мы обрабатываем: имя, аватар и приблизительную
          геолокацию. Данные используются только для организации досуга и не
          передаются третьим лицам.
        </p>
        <ul>
          <li>✅ Точный адрес виден только участникам</li>
          <li>✅ Модерация всех событий</li>
          <li>✅ Возможность удалить данные в любой момент</li>
        </ul>
      </div>

      <button className="primary-btn" onClick={onAccept}>
        Согласен и продолжить
      </button>
      <p className={styles.note}>
        Нажимая кнопку, вы соглашаетесь с политикой конфиденциальности (152-ФЗ)
      </p>
    </div>
  );
};

export default ConsentScreen;
