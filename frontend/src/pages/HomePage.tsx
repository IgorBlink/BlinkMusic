import MyWave from '../components/MyWave/MyWave';
import ForYouSection from '../components/ForYouSection/ForYouSection';
import FavoritesSection from '../components/FavoritesSection/FavoritesSection';
import MiniPlayer from '../components/Player/MiniPlayer';
import './HomePage.css';

const HomePage = () => {
  return (
    <div className="home-page">
      <div className="container">
        <MyWave />
        
        <ForYouSection />
        
        <FavoritesSection />
      </div>
      
      <MiniPlayer />
    </div>
  );
};

export default HomePage; 