import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlay, FaPause, FaStepBackward, FaStepForward } from 'react-icons/fa';
import { IoMdVolumeHigh, IoMdVolumeMute } from 'react-icons/io';
import { TbArrowsShuffle } from 'react-icons/tb';
import { FiRepeat } from 'react-icons/fi';
import { usePlayer } from '../../context/PlayerContext';
import './MiniPlayer.css';

const testPicture = '/test-picture.png';

const MiniPlayer = () => {
  const navigate = useNavigate();
  const { 
    currentTrack, 
    isPlaying, 
    progress, 
    isMuted,
    togglePlay, 
    toggleMute,
    setProgress
  } = usePlayer();
  
  const progressBarRef = useRef<HTMLDivElement>(null);
  
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (progressBarRef.current && currentTrack) {
      const rect = progressBarRef.current.getBoundingClientRect();
      const clickPosition = e.clientX - rect.left;
      const progressBarWidth = rect.width;
      const clickPercentage = clickPosition / progressBarWidth;
      const newProgress = clickPercentage * currentTrack.duration;
      
      setProgress(newProgress);
    }
  };

  const handleTrackInfoClick = () => {
    if (currentTrack) {
      navigate(`/track/${currentTrack.id}`);
    }
  };
  
  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  if (!currentTrack) return null;
  
  const progressPercentage = currentTrack 
    ? (progress / currentTrack.duration) * 100 
    : 0;
  
  return (
    <div className="mini-player">
      <div className="track-info" onClick={handleTrackInfoClick}>
        <div className="track-cover">
          <img src={testPicture} alt={currentTrack.title} />
        </div>
        <div className="track-details">
          <h4>{currentTrack.title}</h4>
          <p>{currentTrack.artist}</p>
        </div>
      </div>
      
      <div className="player-controls">
        <button className="control-button" aria-label="Previous" title="Предыдущий трек">
          <FaStepBackward />
        </button>
        
        <button 
          className="play-pause-button" 
          onClick={togglePlay}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          title={isPlaying ? 'Пауза' : 'Воспроизвести'}
        >
          {isPlaying ? <FaPause /> : <FaPlay />}
        </button>
        
        <button className="control-button" aria-label="Next" title="Следующий трек">
          <FaStepForward />
        </button>
        
        <div className="time-display">
          <span className="current-time">{formatTime(progress)}</span>
          <span className="time-separator">/</span>
          <span className="total-time">{formatTime(currentTrack.duration)}</span>
        </div>
      </div>
      
      <div className="player-progress">
        <div 
          className="progress-bar" 
          ref={progressBarRef}
          onClick={handleProgressClick}
        >
          <div 
            className="progress-current" 
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>
      
      <div className="player-actions">
        <button className="action-button" aria-label="Shuffle" title="Перемешать">
          <TbArrowsShuffle />
        </button>
        
        <button className="action-button" aria-label="Repeat" title="Повторять">
          <FiRepeat />
        </button>
        
        <button 
          className="action-button" 
          onClick={toggleMute}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
          title={isMuted ? 'Включить звук' : 'Выключить звук'}
        >
          {isMuted ? <IoMdVolumeMute /> : <IoMdVolumeHigh />}
        </button>
      </div>
    </div>
  );
};

export default MiniPlayer;