import { useState } from 'react';
import { FiChevronRight } from 'react-icons/fi';
import MusicCard from './MusicCard';
import './ForYouSection.css';

const testPicture = '/test-picture.png'; 


const recommendedMusic = [
  {
    id: 1,
    title: 'Zdrow',
    artist: 'LLN',
    album: 'New Divide',
    albumArtist: 'The Breaks',
    cover: testPicture,
    isNeon: true
  },
  {
    id: 2,
    title: 'UwU',
    artist: 'UwU',
    album: 'Days Go By',
    albumArtist: 'UwU',
    cover: testPicture,
    isSilhouette: true
  },
  {
    id: 3,
    title: 'Running Wild',
    artist: 'Daniel Lazarus',
    album: 'Ascension',
    albumArtist: '',
    cover: testPicture,
    isLandscape: true
  },
  {
    id: 4,
    title: 'Echoes',
    artist: 'Midnight Light',
    album: 'Dimensions',
    albumArtist: '',
    cover: testPicture,
    isNeon: false
  }
];

const ForYouSection = () => {
  const [visibleCards, setVisibleCards] = useState(2);
  
  return (
    <section className="for-you-section">
      <div className="section-header">
        <h2>For You</h2>
        <button className="see-all-button">
          <FiChevronRight />
        </button>
      </div>
      
      <div className="music-cards-container">
        {recommendedMusic.slice(0, visibleCards).map(item => (
          <MusicCard key={item.id} music={item} />
        ))}
      </div>
    </section>
  );
};

export default ForYouSection; 