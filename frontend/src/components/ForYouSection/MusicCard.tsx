import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../../context/PlayerContext';
import './MusicCard.css';

type MusicCardProps = {
  music: {
    id?: string | number;  // Поддержка как строковых, так и числовых ID
    title: string;
    artist: string;
    album?: string;
    albumArtist?: string;
    cover?: string;
    coverUrl?: string;  // Поддержка нового поля из API
    audioUrl?: string;
    duration?: number;
    originalTrack?: any; // Оригинальные данные трека из API
    isNeon?: boolean;
    isSilhouette?: boolean;
    isLandscape?: boolean;
  };
};

const MusicCard = ({ music }: MusicCardProps) => {
  const { id, title, artist, album = '', albumArtist, isNeon, isSilhouette, isLandscape, originalTrack } = music;
  const { setCurrentTrack } = usePlayer();
  const navigate = useNavigate();
  
  // Поддержка как старых (cover), так и новых (coverUrl) полей
  const coverImage = music.coverUrl || music.cover || '/test-picture.png';
  
  // Убедимся, что ID всегда строка для использования в URL и существует
  const trackId = id ? id.toString() : 'unknown';
  
  const cardClasses = `music-card ${isNeon ? 'neon' : ''} ${isSilhouette ? 'silhouette' : ''} ${isLandscape ? 'landscape' : ''}`;
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Если есть originalTrack, используем его данные напрямую
    if (originalTrack) {
      // Создаем объект трека, совместимый с PlayerContext
      const trackData = {
        id: trackId,
        title: title,
        artist: artist,
        album: album,
        coverUrl: coverImage,
        duration: music.duration || 0,
        audioUrl: music.audioUrl || '',
        // Сохраняем оригинальные данные для использования
        originalData: originalTrack
      };
      
      // Устанавливаем текущий трек в PlayerContext
      setCurrentTrack(trackData);
      
      // Переходим на страницу трека
      navigate(`/track/${trackId}`);
    } else {
      // Если нет оригинальных данных, просто переходим по ссылке
      navigate(`/track/${trackId}`);
    }
  };
  
  return (
    <div className={cardClasses} onClick={handleClick}>
      <div className="card-cover">
        <img src={coverImage} alt={`${title} by ${artist}`} />
      </div>
      <div className="card-info">
        <h3>{title}</h3>
        <div className="track-details">
          <p className="album-name">{album}</p>
          <p className="artist-name">{albumArtist || artist}</p>
        </div>
      </div>
    </div>
  );
};

export default MusicCard; 