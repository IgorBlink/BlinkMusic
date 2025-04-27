import { useState, useEffect } from 'react';
import { FiChevronRight } from 'react-icons/fi';
import { FiRefreshCw } from 'react-icons/fi';
import MusicCard from './MusicCard';
import { tracksApi } from '../../services/api';
import './ForYouSection.css';

// Функция проверки доступности API
const checkApiAvailability = async () => {
  try {
    // Попытка получить API-статус или выполнить простой запрос
    // Если API работает с проверкой здоровья (health check), здесь можно использовать его
    const tracks = await tracksApi.getRecommended(1);
    return tracks && Array.isArray(tracks);
  } catch (error) {
    console.error('API недоступен:', error);
    return false;
  }
};

const ForYouSection = () => {
  const [visibleCards, setVisibleCards] = useState(4);
  const [recommendedTracks, setRecommendedTracks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    fetchRecommendedTracks();
  }, [visibleCards]);

  const fetchRecommendedTracks = async () => {
    setIsLoading(true);
    setError(null);
    
    // Проверка доступности API
    const isApiAvailable = await checkApiAvailability();
    
    if (!isApiAvailable) {
      // Если API недоступен, имитируем задержку и показываем ошибку
      setTimeout(() => {
        setError('Сервис рекомендаций временно недоступен');
        setIsLoading(false);
      }, 1000);
      return;
    }
    
    try {
      // Получаем рекомендованные треки из API
      const tracks = await tracksApi.getRecommended(visibleCards);
      
      // Если получили треки с сервера, используем их
      if (tracks && tracks.length > 0) {
        // Преобразуем треки к формату, ожидаемому компонентом MusicCard
        const mappedTracks = tracks.map(track => ({
          // Используем sourceId или комбинацию artist+title вместо генерации временного ID
          id: track.sourceId || `${track.artist}-${track.title}`.replace(/\s+/g, '-').toLowerCase(),
          // Исходные данные трека сохраняем для дальнейшей передачи в PlayerContext
          originalTrack: track,
          title: track.title,
          artist: track.artist,
          album: track.album || '',
          albumArtist: track.artist,
          coverUrl: track.coverUrl || '/test-picture.png', // Используем изображение по умолчанию, если нет coverUrl
          // Конвертируем длительность из миллисекунд в секунды, если она больше 1000
          duration: track.duration > 1000 ? Math.round(track.duration / 1000) : track.duration,
          audioUrl: track.audioUrl,
          // Свойства для оформления (в реальном API их может не быть)
          isNeon: Math.random() > 0.5,
          isSilhouette: Math.random() > 0.7,
          isLandscape: Math.random() > 0.8,
          // Дополнительные данные из API
          genre: Array.isArray(track.genre) ? track.genre : (track.genre ? [track.genre] : []),
          tags: track.tags || [],
          source: track.source,
          likeCount: track.likeCount,
          playCount: track.playCount,
          sourceId: track.sourceId,
          isPublic: track.isPublic
        }));
        
        setRecommendedTracks(mappedTracks);
        
        // Сохраняем треки в localStorage для использования на странице трека
        localStorage.setItem('recommendedTracks', JSON.stringify(tracks));
      } else {
        // Если треков нет или произошла ошибка
        console.log('Не удалось получить рекомендованные треки');
        setError('Не удалось загрузить рекомендованные треки');
        setRecommendedTracks([]);
      }
    } catch (error) {
      console.error('Ошибка при получении рекомендованных треков:', error);
      setError('Не удалось загрузить рекомендованные треки');
      setRecommendedTracks([]);
    } finally {
      // Небольшая задержка для отображения загрузчика, чтобы пользователь успел его увидеть
      setTimeout(() => {
        setIsLoading(false);
      }, 800);
    }
  };
  
  // Обработчик для кнопки "Смотреть все"
  const handleSeeAll = () => {
    setVisibleCards(prev => prev + 4); // Показываем больше треков
  };

  // Обработчик для повторной загрузки данных
  const handleRefresh = () => {
    fetchRecommendedTracks();
  };
  
  // Рендер загрузчика с эффектом shimmer
  const renderShimmerLoader = () => {
    const shimmerCards = Array.from({ length: visibleCards }).map((_, index) => (
      <div key={`shimmer-${index}-${Date.now()}`} className="shimmer-card">
        <div className="shimmer-cover"></div>
        <div className="shimmer-info">
          <div className="shimmer-title"></div>
          <div className="shimmer-artist"></div>
        </div>
      </div>
    ));
    
    return (
      <div className="loading-shimmer">
        {shimmerCards}
      </div>
    );
  };

  // Рендер сообщения об ошибке или пустых данных
  const renderErrorMessage = (message: string) => (
    <div className="error-message">
      <p>{message}</p>
      <button className="refresh-button" onClick={handleRefresh}>
        <FiRefreshCw /> Попробовать снова
      </button>
    </div>
  );
  
  return (
    <section className="for-you-section">
      <div className="section-header">
        <h2>For You</h2>
        <button className="see-all-button" onClick={handleSeeAll}>
          <FiChevronRight />
        </button>
      </div>
      
      {isLoading ? (
        <>
          <div className="for-you-loading">
            <div className="for-you-spinner"></div>
            <div className="loading-message">Подбираем музыку для вас...</div>
          </div>
          {renderShimmerLoader()}
        </>
      ) : error ? (
        renderErrorMessage(error)
      ) : recommendedTracks.length > 0 ? (
        <div className="music-cards-container">
          {recommendedTracks.map((item, index) => (
            <MusicCard key={item.id || `track-${index}-${Date.now()}`} music={item} />
          ))}
        </div>
      ) : (
        renderErrorMessage('Не удалось найти рекомендации. Попробуйте позже.')
      )}
    </section>
  );
};

export default ForYouSection; 