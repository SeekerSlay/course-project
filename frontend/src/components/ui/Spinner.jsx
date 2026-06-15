export default function Spinner({ text = 'Загрузка...' }) {
  return (
    <div className="spinner-wrap">
      <div className="spinner" />
      <p>{text}</p>
    </div>
  );
}
