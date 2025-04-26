import { Link } from 'react-router-dom';
import './MusicCard.css';

type MusicCardProps = {
  music: {
    id: string | number;  // Поддержка как строковых, так и числовых ID
    title: string;
    artist: string;
    album: string;
    albumArtist?: string;
    cover?: string;
    coverUrl?: string;  // Поддержка нового поля из API
    isNeon?: boolean;
    isSilhouette?: boolean;
    isLandscape?: boolean;
  };
};

const MusicCard = ({ music }: MusicCardProps) => {
  const { id, title, artist, album, albumArtist, isNeon, isSilhouette, isLandscape } = music;
  
  // Поддержка как старых (cover), так и новых (coverUrl) полей
  const coverImage = music.coverUrl || music.cover || '/test-picture.png';
  
  // Убедимся, что ID всегда строка для использования в URL
  const trackId = id.toString();
  
  const cardClasses = `music-card ${isNeon ? 'neon' : ''} ${isSilhouette ? 'silhouette' : ''} ${isLandscape ? 'landscape' : ''}`;
  
  return (
    <Link to={`/track/${trackId}`} className={cardClasses}>
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
    </Link>
  );
};

export default MusicCard; 