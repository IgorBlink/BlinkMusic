import React, { createContext, useState, useContext, ReactNode, useEffect, useRef } from 'react';

export interface Track {
  id: number;
  title: string;
  artist: string;
  album?: string;
  cover: string;
  duration: number;
  audioSrc: string;
}

interface PlayerContextProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  progress: number;
  volume: number;
  isMuted: boolean;
  setCurrentTrack: (track: Track | null) => void;
  togglePlay: () => void;
  play: () => void;
  pause: () => void;
  setProgress: (progress: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
}

const PlayerContext = createContext<PlayerContextProps | undefined>(undefined);

const testTrack: Track = {
  id: 999,
  title: 'Dancing Mirage',
  artist: 'Dreaming',
  album: 'Summer Nights',
  cover: 'https://via.placeholder.com/80/4169e1/ffffff?text=DM',
  duration: 218,
  audioSrc: '/test-audio.mp3'
};

export const PlayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(testTrack);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.7);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const audioElement = new Audio();
      audioElement.volume = isMuted ? 0 : volume;
      
      if (currentTrack) {
        audioElement.src = currentTrack.audioSrc;
        audioElement.load();
      }
      
      audioElement.addEventListener('timeupdate', () => {
        setProgress(audioElement.currentTime);
      });
      
      audioElement.addEventListener('ended', () => {
        setProgress(0);
        setIsPlaying(false);
      });
      
      audioRef.current = audioElement;
      
      return () => {
        audioElement.pause();
        audioElement.removeEventListener('timeupdate', () => {});
        audioElement.removeEventListener('ended', () => {});
      };
    }
  }, []);
  
  useEffect(() => {
    if (audioRef.current && currentTrack) {
      audioRef.current.src = currentTrack.audioSrc;
      audioRef.current.load();
      setProgress(0);
      
      if (isPlaying) {
        audioRef.current.play()
          .catch(error => console.error('Error playing new track:', error));
      }
    }
  }, [currentTrack]);
  
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);
  
  const handleSetCurrentTrack = (track: Track | null) => {
    setCurrentTrack(track);
  };
  
  const play = () => {
    if (audioRef.current && currentTrack) {
      audioRef.current.play()
        .catch(error => console.error('Error playing audio:', error));
      setIsPlaying(true);
    }
  };
  
  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };
  
  const togglePlay = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };
  
  const handleSetProgress = (newProgress: number) => {
    setProgress(newProgress);
    if (audioRef.current) {
      audioRef.current.currentTime = newProgress;
    }
  };
  
  const handleSetVolume = (newVolume: number) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : newVolume;
    }
  };
  
  const handleToggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.volume = !isMuted ? 0 : volume;
    }
  };
  
  const contextValue: PlayerContextProps = {
    currentTrack,
    isPlaying,
    progress,
    volume,
    isMuted,
    setCurrentTrack: handleSetCurrentTrack,
    togglePlay,
    play,
    pause,
    setProgress: handleSetProgress,
    setVolume: handleSetVolume,
    toggleMute: handleToggleMute
  };
  
  return (
    <PlayerContext.Provider value={contextValue}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = (): PlayerContextProps => {
  const context = useContext(PlayerContext);
  
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  
  return context;
};