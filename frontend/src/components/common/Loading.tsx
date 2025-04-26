import './Loading.css';

interface LoadingProps {
  message?: string;
  error?: string | null;
}

const Loading = ({ message = 'Загрузка...', error = null }: LoadingProps) => {
  return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>{message}</p>
      {error && <div className="loading-error">{error}</div>}
    </div>
  );
};

export default Loading; 