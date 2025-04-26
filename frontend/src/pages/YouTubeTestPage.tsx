import React, { useState, useRef, useEffect } from 'react';
import { usePlayer } from '../context/PlayerContext';
import '../styles/YouTubeTestPage.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faPause, faVolumeUp, faVolumeMute, faStepForward, faStepBackward } from '@fortawesome/free-solid-svg-icons';

// Предустановленные треки для демонстрации
const demoTracks = [
  {
    id: 'youtube-demo-1',
    title: 'Rick Astley',
    artist: 'Never Gonna Give You Up',
    album: 'YouTube',
    coverUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    cover: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    duration: 212,
    audioUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    sourceType: 'youtube' as const
  },
  {
    id: 'youtube-demo-2',
    title: 'Ed Sheeran',
    artist: 'Shape of You',
    album: 'YouTube',
    coverUrl: 'https://i.ytimg.com/vi/JGwWNGJdvx8/hqdefault.jpg',
    cover: 'https://i.ytimg.com/vi/JGwWNGJdvx8/hqdefault.jpg',
    duration: 240,
    audioUrl: 'https://www.youtube.com/watch?v=JGwWNGJdvx8',
    sourceType: 'youtube' as const
  },
  {
    id: 'youtube-demo-3',
    title: 'Luis Fonsi',
    artist: 'Despacito ft. Daddy Yankee',
    album: 'YouTube',
    coverUrl: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg',
    cover: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg',
    duration: 280,
    audioUrl: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
    sourceType: 'youtube' as const
  }
];

const YouTubeTestPage: React.FC = () => {
  const { 
    currentTrack, 
    isPlaying, 
    progress, 
    volume, 
    isMuted,
    togglePlay, 
    setProgress, 
    setVolume, 
    toggleMute,
    setCurrentTrack
  } = usePlayer();
  
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [currentIndex, setCurrentIndex] = useState<number>(-1); // -1 означает, что не выбран ни один трек из демо

  const progressSliderRef = useRef<HTMLInputElement>(null);
  const volumeSliderRef = useRef<HTMLInputElement>(null);
  
  // Обработчик изменения URL видео
  const handleVideoUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVideoUrl(e.target.value);
  };
  
  // Обработчик отправки формы
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!videoUrl) return;
    
    // Создаем новый трек с YouTube URL
    const newTrack = {
      id: `youtube-${Date.now()}`,
      title: 'YouTube Video',
      artist: 'YouTube',
      album: 'YouTube',
      coverUrl: 'https://via.placeholder.com/300.png?text=YouTube',
      cover: 'https://via.placeholder.com/300.png?text=YouTube',
      duration: 0, // Длительность будет определена при загрузке видео
      audioUrl: videoUrl,
      sourceType: 'youtube' as const
    };
    
    setCurrentTrack(newTrack);
    setCurrentIndex(-1); // Сбрасываем индекс, так как мы выбрали произвольное видео
  };
  
  // Обработчик для перехода к следующему треку
  const handleNextTrack = () => {
    // Если текущий трек не из демо-списка, начинаем с первого
    if (currentIndex === -1) {
      setCurrentTrack(demoTracks[0]);
      setCurrentIndex(0);
      return;
    }
    
    // Переходим к следующему треку или возвращаемся к первому
    const nextIndex = (currentIndex + 1) % demoTracks.length;
    setCurrentTrack(demoTracks[nextIndex]);
    setCurrentIndex(nextIndex);
  };
  
  // Обработчик для перехода к предыдущему треку
  const handlePreviousTrack = () => {
    // Если текущий трек не из демо-списка, начинаем с последнего
    if (currentIndex === -1) {
      const lastIndex = demoTracks.length - 1;
      setCurrentTrack(demoTracks[lastIndex]);
      setCurrentIndex(lastIndex);
      return;
    }
    
    // Переходим к предыдущему треку или к последнему, если сейчас первый
    const prevIndex = (currentIndex - 1 + demoTracks.length) % demoTracks.length;
    setCurrentTrack(demoTracks[prevIndex]);
    setCurrentIndex(prevIndex);
  };
  
  // Обработчик изменения позиции воспроизведения
  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = parseFloat(e.target.value);
    setProgress(newProgress);
  };
  
  // Обработчик изменения громкости
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  };

  // Получаем название видео из URL (для отображения более информативного заголовка)
  const getVideoTitle = (url: string) => {
    try {
      const videoId = new URL(url).searchParams.get('v');
      return videoId ? `YouTube Video (ID: ${videoId})` : 'YouTube Video';
    } catch (error) {
      return 'YouTube Video';
    }
  };
  
  // Обновляем индекс текущего трека при изменении трека
  useEffect(() => {
    if (currentTrack) {
      // Проверяем, является ли текущий трек одним из демо треков
      const index = demoTracks.findIndex(track => track.audioUrl === currentTrack.audioUrl);
      setCurrentIndex(index);
    }
  }, [currentTrack]);
  
  // Обновляем CSS переменную для визуализации прогресса
  useEffect(() => {
    if (progressSliderRef.current && currentTrack) {
      const percentage = currentTrack.duration 
        ? (progress / currentTrack.duration) * 100 
        : (progress / 100) * 100;
      progressSliderRef.current.style.setProperty('--value', `${percentage}%`);
    }
  }, [progress, currentTrack]);
  
  // Обновляем CSS переменную для визуализации громкости
  useEffect(() => {
    if (volumeSliderRef.current) {
      volumeSliderRef.current.style.setProperty('--value', `${volume * 100}%`);
    }
  }, [volume]);
  
  // Загрузить демо-трек при клике
  const loadDemoTrack = (index: number) => {
    setCurrentTrack(demoTracks[index]);
    setCurrentIndex(index);
    setVideoUrl(demoTracks[index].audioUrl);
  };
  
  return (
    <div className="youtube-test-page">
      <h1>YouTube Player Test</h1>
      
      <div className="youtube-form">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="youtube-url">YouTube URL:</label>
            <input
              type="text"
              id="youtube-url"
              value={videoUrl}
              onChange={handleVideoUrlChange}
              placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            />
          </div>
          <button type="submit" className="play-button">
            Загрузить и воспроизвести
            <FontAwesomeIcon icon={faPlay} style={{ marginLeft: '8px' }} />
          </button>
        </form>
      </div>
      
      {currentTrack && currentTrack.sourceType === 'youtube' && (
        <div className="youtube-player-controls">
          <h2>{currentTrack.title !== 'YouTube Video' ? currentTrack.title : getVideoTitle(currentTrack.audioUrl || '')}</h2>
          <p>{currentTrack.artist}</p>
          
          <div className="controls">
            <div className="player-buttons">
              <button onClick={handlePreviousTrack} className="navigation-button prev-button">
                <FontAwesomeIcon icon={faStepBackward} />
              </button>
              
              <button onClick={togglePlay} className="play-pause-button">
                <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
              </button>
              
              <button onClick={handleNextTrack} className="navigation-button next-button">
                <FontAwesomeIcon icon={faStepForward} />
              </button>
            </div>
            
            <div className="progress-container">
              <span className="progress-time">{formatTime(progress)}</span>
              <input
                ref={progressSliderRef}
                type="range"
                min="0"
                max={currentTrack.duration || 100}
                value={progress}
                onChange={handleProgressChange}
                className="progress-slider"
              />
              <span className="progress-time">{formatTime(currentTrack.duration || 0)}</span>
            </div>
            
            <div className="volume-container">
              <button onClick={toggleMute} className="mute-button">
                <FontAwesomeIcon icon={isMuted ? faVolumeMute : faVolumeUp} style={{ marginRight: '6px' }} />
                {isMuted ? 'Включить звук' : 'Выключить звук'}
              </button>
              <input
                ref={volumeSliderRef}
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="volume-slider"
              />
            </div>
          </div>
        </div>
      )}
      
      <div className="test-examples">
        <h3>Примеры YouTube ссылок для тестирования:</h3>
        <ul>
          <li>
            <button 
              onClick={() => loadDemoTrack(0)}
              className={`example-button ${currentIndex === 0 ? 'active' : ''}`}
            >
              Rick Astley - Never Gonna Give You Up
            </button>
          </li>
          <li>
            <button 
              onClick={() => loadDemoTrack(1)}
              className={`example-button ${currentIndex === 1 ? 'active' : ''}`}
            >
              Ed Sheeran - Shape of You
            </button>
          </li>
          <li>
            <button 
              onClick={() => loadDemoTrack(2)}
              className={`example-button ${currentIndex === 2 ? 'active' : ''}`}
            >
              Luis Fonsi - Despacito ft. Daddy Yankee
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
};

// Вспомогательная функция для форматирования времени
const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
};

export default YouTubeTestPage; 