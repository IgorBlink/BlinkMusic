import React, { createContext, useState, useContext, ReactNode, useEffect, useRef } from 'react';
import { Track as MusicApiTrack } from '../types/music';
import { tracksApi } from '../services/api';
import YouTubePlayer, { YouTubePlayerRef } from '../components/YouTubePlayer';

export type AudioSourceType = 'direct' | 'youtube' | 'soundcloud' | 'other';

export interface Track {
  id: string | number;
  title: string;
  artist: string;
  album?: string;
  cover?: string;
  coverUrl?: string;
  duration: number;
  audioSrc?: string;
  audioUrl?: string;
  sourceType?: AudioSourceType;
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
  loadTrackById: (id: string) => Promise<Track | null>;
  loadRandomRecommendedTrack: () => Promise<Track | null>;
  loadNextTrack: () => void;
  loadPreviousTrack: () => void;
}

const PlayerContext = createContext<PlayerContextProps | undefined>(undefined);

const testTrack: Track = {
  id: 999,
  title: 'Dancing Mirage',
  artist: 'Dreaming',
  album: 'Summer Nights',
  cover: '/test-picture.png',
  duration: 218,
  audioSrc: '/test-audio.mp3',
  sourceType: 'direct'
};

const DEMO_AUDIO_URL = 'https://assets.mixkit.co/sfx/preview/mixkit-tech-house-vibes-130.mp3';

const YOUTUBE_EMBED_PREFIX = 'https://www.youtube.com/embed/';

export const PlayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.7);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [trackList, setTrackList] = useState<Track[]>([]);
  
  const [activeYoutubeId, setActiveYoutubeId] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const youtubePlayerRef = useRef<YouTubePlayerRef>(null);
  const youtubeInterval = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const detectSourceType = (url?: string): AudioSourceType => {
    if (!url) return 'direct';
    
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return 'youtube';
    }
    
    if (url.includes('soundcloud.com')) {
      return 'soundcloud';
    }
    
    return 'direct';
  };
  
  const extractYoutubeId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    
    return (match && match[2].length === 11) ? match[2] : null;
  };
  
  useEffect(() => {
    if (!isInitialized) {
      const initPlayer = async () => {
        try {
          const randomTrack = await loadRandomRecommendedTrack();
          
          if (!randomTrack) {
            console.log('Не удалось загрузить рекомендованный трек, используем тестовый');
            setCurrentTrack(testTrack);
          }
          
          setIsInitialized(true);
        } catch (error) {
          console.error('Ошибка при инициализации плеера:', error);
          setCurrentTrack(testTrack);
          setIsInitialized(true);
        }
      };
      
      initPlayer();
    }
  }, [isInitialized]);
  
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };
  
  const handleYoutubePlayer = (trackUrl: string) => {
    if (youtubeInterval.current) {
      clearInterval(youtubeInterval.current);
      youtubeInterval.current = null;
    }
    
    const videoId = extractYoutubeId(trackUrl);
    
    if (!videoId) {
      console.error('Не удалось извлечь ID видео из URL:', trackUrl);
      return false;
    }
    
    console.log('Загрузка YouTube видео с ID:', videoId);
    
    setActiveYoutubeId(videoId);
    
    return true;
  };
  
  const handleSoundCloudPlayer = (trackUrl: string) => {
    console.log('SoundCloud трек:', trackUrl);
    return false;
  };
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const audioElement = new Audio();
      audioElement.volume = isMuted ? 0 : volume;
      
      audioElement.addEventListener('timeupdate', () => {
        setProgress(audioElement.currentTime);
      });
      
      audioElement.addEventListener('ended', () => {
        setProgress(0);
        setIsPlaying(false);
      });
      
      audioRef.current = audioElement;
      
      return () => {
        if (youtubeInterval.current) {
          clearInterval(youtubeInterval.current);
          youtubeInterval.current = null;
        }
        
        audioElement.pause();
        audioElement.removeEventListener('timeupdate', () => {});
        audioElement.removeEventListener('ended', () => {});
      };
    }
  }, []);
  
  useEffect(() => {
    if (!currentTrack) return;
    
    if (youtubeInterval.current) {
      clearInterval(youtubeInterval.current);
      youtubeInterval.current = null;
    }
    
    let sourceType = currentTrack.sourceType;
    
    if (!sourceType) {
      const audioUrl = currentTrack.audioUrl || currentTrack.audioSrc;
      sourceType = audioUrl ? detectSourceType(audioUrl) : 'direct';
    }
    
    console.log(`Трек типа ${sourceType}`);
    
    if (sourceType !== 'youtube') {
      setActiveYoutubeId(null);
    }
    
    let audioSource = '';
    let handledExternally = false;
    
    if (sourceType === 'youtube' && (currentTrack.audioUrl || currentTrack.audioSrc)) {
      const youtubeUrl = currentTrack.audioUrl || currentTrack.audioSrc;
      if (youtubeUrl) {
        handledExternally = handleYoutubePlayer(youtubeUrl);
      }
    } else if (sourceType === 'soundcloud' && (currentTrack.audioUrl || currentTrack.audioSrc)) {
      const soundCloudUrl = currentTrack.audioUrl || currentTrack.audioSrc;
      if (soundCloudUrl) {
        handledExternally = handleSoundCloudPlayer(soundCloudUrl);
      }
    }
    
    if (!handledExternally) {
      if (currentTrack.audioUrl && isValidUrl(currentTrack.audioUrl)) {
        audioSource = currentTrack.audioUrl;
        console.log('Установлен источник аудио из audioUrl:', audioSource);
      } else if (currentTrack.audioSrc && isValidUrl(currentTrack.audioSrc)) {
        audioSource = currentTrack.audioSrc;
        console.log('Установлен источник аудио из audioSrc:', audioSource);
      } else if (currentTrack.id && !currentTrack.id.toString().startsWith('temp')) {
        try {
          const apiStreamUrl = tracksApi.getStreamUrl(currentTrack.id.toString());
          console.log('В продакшене будет использоваться API URL:', apiStreamUrl);
          
          audioSource = DEMO_AUDIO_URL;
        } catch (error) {
          console.error('Ошибка при получении URL потока:', error);
          audioSource = DEMO_AUDIO_URL;
        }
      } else {
        audioSource = DEMO_AUDIO_URL;
        console.log('Используется демо аудио:', audioSource);
      }
      
      if (audioRef.current) {
        try {
          audioRef.current.src = audioSource;
          audioRef.current.load();
          setProgress(0);
          
          if (isPlaying) {
            audioRef.current.play()
              .catch(error => {
                console.error('Error playing new track:', error);
                if (audioRef.current && audioSource !== DEMO_AUDIO_URL) {
                  console.log('Не удалось воспроизвести трек, пробуем использовать демо-аудио');
                  audioRef.current.src = DEMO_AUDIO_URL;
                  audioRef.current.load();
                  audioRef.current.play()
                    .catch(fallbackError => console.error('Error playing fallback audio:', fallbackError));
                }
              });
          }
        } catch (error) {
          console.error('Ошибка при установке источника аудио:', error);
        }
      }
    }
  }, [currentTrack, isPlaying]);
  
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
    
  }, [volume, isMuted]);
  
  const handleSetCurrentTrack = (track: Track | null) => {
    setCurrentTrack(track);
  };
  
  const play = () => {
    if (currentTrack) {
      const sourceType = currentTrack.sourceType || 
                        detectSourceType(currentTrack.audioUrl || currentTrack.audioSrc);
      
      if (sourceType === 'youtube') {
        console.log('Воспроизведение YouTube видео');
        
        if (youtubeInterval.current) {
          clearInterval(youtubeInterval.current);
        }
        
        youtubeInterval.current = setInterval(() => {
          setProgress(prev => {
            if (prev >= (currentTrack?.duration || 0)) {
              if (youtubeInterval.current) {
                clearInterval(youtubeInterval.current);
                youtubeInterval.current = null;
              }
              setIsPlaying(false);
              return 0;
            }
            return prev + 1;
          });
        }, 1000);
        
        setIsPlaying(true);
        return;
      } else if (sourceType === 'soundcloud') {
        console.log('Воспроизведение SoundCloud трека');
        setIsPlaying(true);
        return;
      }
    }
    
    if (audioRef.current && currentTrack) {
      audioRef.current.play()
        .catch(error => {
          console.error('Error playing audio:', error);
          if (audioRef.current && audioRef.current.src !== DEMO_AUDIO_URL) {
            console.log('Не удалось воспроизвести трек, используем демо-аудио');
            audioRef.current.src = DEMO_AUDIO_URL;
            audioRef.current.load();
            audioRef.current.play()
              .catch(fallbackError => console.error('Error playing fallback audio:', fallbackError));
          }
        });
      setIsPlaying(true);
    }
  };
  
  const pause = () => {
    if (currentTrack) {
      const sourceType = currentTrack.sourceType || 
                        detectSourceType(currentTrack.audioUrl || currentTrack.audioSrc);
      
      if (sourceType === 'youtube') {
        console.log('Пауза YouTube видео');
        
        if (youtubeInterval.current) {
          clearInterval(youtubeInterval.current);
          youtubeInterval.current = null;
        }
        
        setIsPlaying(false);
        return;
      } else if (sourceType === 'soundcloud') {
        console.log('Пауза SoundCloud трека');
        setIsPlaying(false);
        return;
      }
    }
    
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
    
    if (currentTrack) {
      const sourceType = currentTrack.sourceType || 
                        detectSourceType(currentTrack.audioUrl || currentTrack.audioSrc);
      
      if (sourceType === 'youtube') {
        console.log('Перемотка YouTube видео на', newProgress);
        
        if (youtubePlayerRef.current) {
          youtubePlayerRef.current.seekTo(newProgress);
        }
        return;
      } else if (sourceType === 'soundcloud') {
        console.log('Перемотка SoundCloud трека на', newProgress);
        return;
      }
    }
    
    if (audioRef.current) {
      audioRef.current.currentTime = newProgress;
    }
  };
  
  const handleSetVolume = (newVolume: number) => {
    setVolume(newVolume);
    
    if (currentTrack) {
      const sourceType = currentTrack.sourceType || 
                        detectSourceType(currentTrack.audioUrl || currentTrack.audioSrc);
      
      if (sourceType === 'youtube') {
        console.log('Изменение громкости YouTube видео на', isMuted ? 0 : newVolume);
      } else if (sourceType === 'soundcloud') {
        console.log('Изменение громкости SoundCloud трека на', isMuted ? 0 : newVolume);
      }
    }
    
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : newVolume;
    }
  };
  
  const handleToggleMute = () => {
    setIsMuted(!isMuted);
    
    if (currentTrack) {
      const sourceType = currentTrack.sourceType || 
                        detectSourceType(currentTrack.audioUrl || currentTrack.audioSrc);
      
      if (sourceType === 'youtube') {
        console.log('YouTube видео', !isMuted ? 'приглушено' : 'включено');
      } else if (sourceType === 'soundcloud') {
        console.log('SoundCloud трек', !isMuted ? 'приглушен' : 'включен');
      }
    }
    
    if (audioRef.current) {
      audioRef.current.volume = !isMuted ? 0 : volume;
    }
  };
  
  const loadTrackById = async (id: string): Promise<Track | null> => {
    try {
      const trackData = await tracksApi.getById(id);
      
      const sourceUrl = trackData.audioUrl || '';
      const sourceType = detectSourceType(sourceUrl);
      
      let validAudioUrl = sourceUrl;
      
      if (sourceType === 'direct') {
        validAudioUrl = DEMO_AUDIO_URL;
        console.log('Используется демо-аудио вместо аудио из API');
      } else {
        console.log(`Определен источник трека: ${sourceType}`);
      }
      
      const track: Track = {
        id: trackData.id || trackData._id || id,
        title: trackData.title || 'Неизвестный трек',
        artist: trackData.artist || 'Неизвестный исполнитель',
        album: trackData.album || 'Неизвестный альбом',
        duration: trackData.duration || 130,
        audioUrl: validAudioUrl,
        audioSrc: validAudioUrl,
        sourceType: sourceType
      };
      
      setCurrentTrack(track);
      return track;
    } catch (error) {
      console.error('Error loading track:', error);
      const demoTrack: Track = {
        id: id,
        title: `Трек ${id}`,
        artist: 'BlinkMusic Demo',
        album: 'Демо Альбом',
        duration: 130,
        audioUrl: DEMO_AUDIO_URL,
        audioSrc: DEMO_AUDIO_URL,
        sourceType: 'direct'
      };
      
      setCurrentTrack(demoTrack);
      return demoTrack;
    }
  };
  
  const loadRandomRecommendedTrack = async (): Promise<Track | null> => {
    try {
      const recommendedTracks = await tracksApi.getRecommended(5);
      
      if (recommendedTracks && recommendedTracks.length > 0) {
        const formattedTracks = recommendedTracks.map(track => {
          const sourceUrl = track.audioUrl || '';
          const sourceType = detectSourceType(sourceUrl);
          
          return {
            id: track.id || track._id || `temp-${Date.now()}`,
            title: track.title || 'Демо-трек',
            artist: track.artist || 'Неизвестный исполнитель',
            album: track.album || 'Демо-альбом',
            duration: track.duration || 130,
            audioUrl: track.audioUrl || DEMO_AUDIO_URL,
            audioSrc: track.audioUrl || DEMO_AUDIO_URL,
            sourceType: sourceType
          };
        });
        
        setTrackList(formattedTracks);
        
        const randomIndex = Math.floor(Math.random() * formattedTracks.length);
        const selectedTrack = formattedTracks[randomIndex];
        
        setCurrentTrack(selectedTrack);
        return selectedTrack;
      }
      
      console.log('API не вернул рекомендованные треки, используется тестовый трек');
      const demoTrack: Track = {
        id: `temp-${Date.now()}`,
        title: 'Tech House Vibes',
        artist: 'BlinkMusic Demo',
        album: 'Демо Альбом',
        duration: 130,
        audioUrl: DEMO_AUDIO_URL,
        audioSrc: DEMO_AUDIO_URL,
        sourceType: 'direct'
      };
      
      setCurrentTrack(demoTrack);
      return demoTrack;
    } catch (error) {
      console.error('Error loading recommended track:', error);
      const demoTrack: Track = {
        id: `temp-${Date.now()}`,
        title: 'Tech House Vibes',
        artist: 'BlinkMusic Demo',
        album: 'Демо Альбом',
        duration: 130,
        audioUrl: DEMO_AUDIO_URL,
        audioSrc: DEMO_AUDIO_URL,
        sourceType: 'direct'
      };
      
      setCurrentTrack(demoTrack);
      return demoTrack;
    }
  };
  
  const handleYoutubeProgress = (currentTime: number, duration: number) => {
    setProgress(currentTime);
    
    if (currentTrack && (!currentTrack.duration || currentTrack.duration === 0) && duration > 0) {
      setCurrentTrack({
        ...currentTrack,
        duration: duration
      });
    }
  };
  
  const handleYoutubeEnd = () => {
    setIsPlaying(false);
    setProgress(0);
  };
  
  const handleYoutubeError = (error: any) => {
    console.error('YouTube Player Error:', error);
    
    if (error === 150 || error === 100 || error === 101) {
      console.log('Видео недоступно, переключаемся на демо-трек');
      const demoTrack: Track = {
        id: `temp-${Date.now()}`,
        title: 'Tech House Vibes',
        artist: 'BlinkMusic Demo',
        album: 'Демо Альбом',
        duration: 130,
        audioUrl: DEMO_AUDIO_URL,
        audioSrc: DEMO_AUDIO_URL,
        sourceType: 'direct'
      };
      
      setCurrentTrack(demoTrack);
    }
  };
  
  const loadNextTrack = () => {
    if (!currentTrack || trackList.length === 0) {
      loadRandomRecommendedTrack();
      return;
    }

    try {
      const currentIndex = trackList.findIndex(track => 
        track.id === currentTrack.id || 
        (track.title === currentTrack.title && track.artist === currentTrack.artist)
      );
      
      if (currentIndex === -1 || currentIndex === trackList.length - 1) {
        setCurrentTrack(trackList[0]);
        console.log('Загружен первый трек из списка:', trackList[0].title);
      } else {
        setCurrentTrack(trackList[currentIndex + 1]);
        console.log('Загружен следующий трек:', trackList[currentIndex + 1].title);
      }
      
      if (isPlaying) {
        setTimeout(play, 50);
      }
    } catch (error) {
      console.error('Ошибка при загрузке следующего трека:', error);
      loadRandomRecommendedTrack();
    }
  };

  const loadPreviousTrack = () => {
    if (!currentTrack || trackList.length === 0) {
      loadRandomRecommendedTrack();
      return;
    }

    try {
      const currentIndex = trackList.findIndex(track => 
        track.id === currentTrack.id || 
        (track.title === currentTrack.title && track.artist === currentTrack.artist)
      );
      
      if (currentIndex === -1 || currentIndex === 0) {
        setCurrentTrack(trackList[trackList.length - 1]);
        console.log('Загружен последний трек из списка:', trackList[trackList.length - 1].title);
      } else {
        setCurrentTrack(trackList[currentIndex - 1]);
        console.log('Загружен предыдущий трек:', trackList[currentIndex - 1].title);
      }
      
      if (isPlaying) {
        setTimeout(play, 50);
      }
    } catch (error) {
      console.error('Ошибка при загрузке предыдущего трека:', error);
      loadRandomRecommendedTrack();
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
    toggleMute: handleToggleMute,
    loadTrackById,
    loadRandomRecommendedTrack,
    loadNextTrack,
    loadPreviousTrack
  };
  
  return (
    <PlayerContext.Provider value={contextValue}>
      {children}
      {activeYoutubeId && (
        <YouTubePlayer
          ref={youtubePlayerRef}
          videoId={activeYoutubeId}
          isPlaying={isPlaying}
          volume={volume}
          isMuted={isMuted}
          onProgress={handleYoutubeProgress}
          onEnd={handleYoutubeEnd}
          onError={handleYoutubeError}
        />
      )}
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
