import { useState, useEffect, useRef } from 'react';
import { FaPlay, FaPause } from 'react-icons/fa';
import { MdErrorOutline } from 'react-icons/md';
import WaveCustomizeModal, { WaveSettings } from './WaveCustomizeModal';
import { usePlayer } from '../../context/PlayerContext';
import './MyWave.css';

const MyWave = () => {
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [waveSettings, setWaveSettings] = useState<WaveSettings>({});
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  
  const { 
    currentTrack, 
    isPlaying, 
    togglePlay,
    play, 
    pause
  } = usePlayer();
  
  useEffect(() => {
    const initAudio = async () => {
      try {
        if (!currentTrack) return;
        
        if (!analyserRef.current) {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const analyser = audioCtx.createAnalyser();
          
          analyser.fftSize = 256;
          analyser.smoothingTimeConstant = 0.8;
          
          const audio = document.querySelector('audio');
          if (audio) {
            const source = audioCtx.createMediaElementSource(audio);
            source.connect(analyser);
            analyser.connect(audioCtx.destination);
          }
          
          analyserRef.current = analyser;
        }
        
        setAudioError(null);
      } catch (error) {
        console.error('Error initializing audio context:', error);
        setAudioError('Не удалось инициализировать аудио визуализацию');
      }
    };
    
    initAudio();
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [currentTrack]);

  useEffect(() => {
    if (isPlaying) {
      updateVisualizer();
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      const gradient = document.querySelector('.wave-gradient');
      if (gradient) {
        (gradient as HTMLElement).style.setProperty('--audio-intensity', '0');
        (gradient as HTMLElement).style.setProperty('--bass-intensity', '0');
        (gradient as HTMLElement).style.setProperty('--treble-intensity', '0');
      }
    }
  }, [isPlaying]);
  
  const updateVisualizer = () => {
    if (!analyserRef.current) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    const sum = dataArray.reduce((a, b) => a + b, 0);
    const average = sum / dataArray.length;
    const volume = average / 255;
    
    const bass = dataArray.slice(0, 10).reduce((a, b) => a + b, 0) / 10 / 255;
    const treble = dataArray.slice(100, 150).reduce((a, b) => a + b, 0) / 50 / 255;
    
    const gradient = document.querySelector('.wave-gradient');
    if (gradient) {
      (gradient as HTMLElement).style.setProperty('--audio-intensity', volume.toString());
      (gradient as HTMLElement).style.setProperty('--bass-intensity', bass.toString());
      (gradient as HTMLElement).style.setProperty('--treble-intensity', treble.toString());
    }
    
    animationFrameRef.current = requestAnimationFrame(updateVisualizer);
  };
  
  const handleTogglePlay = () => {
    togglePlay();
  };

  const handleOpenCustomize = () => {
    setShowCustomizeModal(true);
  };

  const handleCloseCustomize = () => {
    setShowCustomizeModal(false);
  };

  const handleSaveSettings = (settings: WaveSettings) => {
    setWaveSettings(settings);
    setShowCustomizeModal(false);
    
    console.log('Применяем новые настройки волны:', settings);
    
    if (settings.mood) {
      const gradient = document.querySelector('.wave-gradient');
      if (gradient) {
        switch (settings.mood) {
          case 'energetic':
            document.documentElement.style.setProperty('--wave-color-primary', 'rgba(255, 81, 47, 0.6)');
            document.documentElement.style.setProperty('--wave-color-secondary', 'rgba(240, 152, 25, 0.5)');
            break;
          case 'happy':
            document.documentElement.style.setProperty('--wave-color-primary', 'rgba(170, 255, 169, 0.6)');
            document.documentElement.style.setProperty('--wave-color-secondary', 'rgba(17, 255, 189, 0.5)');
            break;
          case 'calm':
            document.documentElement.style.setProperty('--wave-color-primary', 'rgba(0, 201, 255, 0.6)');
            document.documentElement.style.setProperty('--wave-color-secondary', 'rgba(146, 254, 157, 0.5)');
            break;
          case 'sad':
            document.documentElement.style.setProperty('--wave-color-primary', 'rgba(69, 104, 220, 0.6)');
            document.documentElement.style.setProperty('--wave-color-secondary', 'rgba(176, 106, 179, 0.5)');
            break;
          default:
            document.documentElement.style.setProperty('--wave-color-primary', 'rgba(65, 105, 225, 0.6)');
            document.documentElement.style.setProperty('--wave-color-secondary', 'rgba(30, 144, 255, 0.5)');
        }
      }
    }
  };

  return (
    <div className="my-wave-container">
      <div className="wave-background">
        <div className={`wave-gradient ${isPlaying ? 'active' : ''}`}>
          <div className="wave-deepblue"></div>
          <div className="wave-chaos"></div>
        </div>
      </div>
      
      <div className="wave-content">
        <h1 className="wave-title">Моя волна</h1>
        
        <button 
          className={`play-button ${isPlaying ? 'pulse' : ''}`}
          onClick={handleTogglePlay}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          disabled={!currentTrack}
        >
          {isPlaying ? <FaPause /> : <FaPlay />}
        </button>
        
        {audioError && (
          <div className="audio-error">
            <MdErrorOutline style={{ marginRight: '5px' }} />
            {audioError}
          </div>
        )}
        
        <button 
          className="customize-button"
          onClick={handleOpenCustomize}
        >
          Настроить
        </button>
      </div>
      
      {showCustomizeModal && (
        <WaveCustomizeModal 
          onClose={handleCloseCustomize}
          onSave={handleSaveSettings}
          initialSettings={waveSettings}
        />
      )}
    </div>
  );
};

export default MyWave; 