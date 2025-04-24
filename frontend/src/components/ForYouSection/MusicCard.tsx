import { Link } from 'react-router-dom';
import './MusicCard.css';

type MusicCardProps = {
  music: {
    id: number;
    title: string;
    artist: string;
    album: string;
    albumArtist: string;
    cover: string;
    isNeon?: boolean;
    isSilhouette?: boolean;
    isLandscape?: boolean;
  };
};

const MusicCard = ({ music }: MusicCardProps) => {
  const { id, title, artist, album, albumArtist, cover, isNeon, isSilhouette, isLandscape } = music;
  
  const cardClasses = `music-card ${isNeon ? 'neon' : ''} ${isSilhouette ? 'silhouette' : ''} ${isLandscape ? 'landscape' : ''}`;
  
  return (
    <Link to={`/track/${id}`} className={cardClasses}>
      <div className="card-cover">
        <img src={cover} alt={`${title} by ${artist}`} />
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