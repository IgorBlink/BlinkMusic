import { FiChevronRight } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa';
import './FavoritesSection.css';

  
  const testPicture = '/test-picture.png'; 

// moock
const favoriteMusic = [
  {
    id: 1001,
    title: 'Favorites',
    tracks: 250,
    cover: testPicture,
    isCollection: true
  },
  {
    id: 501,
    title: 'Running Wild',
    artist: 'Daniel Lazarus',
    album: '',
    cover: testPicture
  }
];

const FavoritesSection = () => {
  return (
    <section className="favorites-section">
      <div className="section-header">
        <h2>Favorites</h2>
        <button className="see-all-button">
          <FiChevronRight />
        </button>
      </div>
      
      <div className="favorites-container">
        <div className="favorite-card collection-card">
          <div className="favorite-icon">
            <FaHeart className="heart-icon" />
          </div>
          <div className="favorite-info">
            <h3>Favorites</h3>
            <p>{favoriteMusic[0].tracks} songs</p>
          </div>
        </div>
        
        {favoriteMusic.slice(1).map(item => (
          <div key={item.id} className="favorite-card">
            <div className="favorite-cover">
              <img src={testPicture} alt={item.title} />
            </div>
            <div className="favorite-info">
              <h3>{item.title}</h3>
              {item.artist && <p>{item.artist}</p>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FavoritesSection; 