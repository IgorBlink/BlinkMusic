import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaPlay, FaPause } from 'react-icons/fa';
import { IoMdArrowBack } from 'react-icons/io';
import { BiInfoCircle } from 'react-icons/bi';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { MdOutlineClose } from 'react-icons/md';
import { usePlayer } from '../context/PlayerContext';
import './TrackPage.css';

const testPicture = '/test-picture.png';

interface LyricLine {
  text: string;
  startTime: number;
  endTime: number;
  annotation?: string;
}

const demoLyrics: LyricLine[] = [
  { text: "Этой ночью чьё-то сердце от любви горит", startTime: 0, endTime: 15 },
  { text: "Всё внутри (но мне это ни о чём не говорит), на счёт три", startTime: 15, endTime: 30 },
  { text: "Забываем нас двоих", startTime: 30, endTime: 45 },
  { text: "Где же слёзы мои? Где-то сердце горит", startTime: 45, endTime: 60 },
  { text: "Этой ночью чьё-то сердце от любви горит", startTime: 60, endTime: 75 },
  { text: "И эта ночь принадлежит нам двоим", startTime: 75, endTime: 90 },
  { text: "Я отключаю телефон, закрываю дверь", startTime: 90, endTime: 105 },
  { text: "Не нужно звонков и стука в окно", startTime: 105, endTime: 120 },
  { text: "Ты отдаешься мне полностью теперь", startTime: 120, endTime: 135 },
  { text: "И этот танец танцуем до утра", startTime: 135, endTime: 150 },
  { text: "Где же слёзы мои? Где-то сердце горит", startTime: 150, endTime: 165 },
  { text: "Этой ночью чьё-то сердце от любви горит", startTime: 165, endTime: 180 },
];

const getAnnotationFromAI = async (lyric: string): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const annotationExamples: {[key: string]: string} = {
        "Этой ночью чьё-то сердце от любви горит": "Метафора сильных эмоциональных переживаний, связанных с любовью. Образ горящего сердца часто используется для описания страсти и сильных чувств.",
        "Всё внутри (но мне это ни о чём не говорит), на счёт три": "Выражает внутренний конфликт между эмоциями и рациональным мышлением. Фраза 'на счёт три' означает решительное действие после короткого обратного отсчёта.",
        "Забываем нас двоих": "Отражает желание отпустить прошлые отношения, стереть воспоминания о совместно проведенном времени.",
        "Где же слёзы мои? Где-то сердце горит": "Риторический вопрос о неспособности выразить эмоции через слёзы, несмотря на внутреннюю боль ('горящее сердце').",
        "И эта ночь принадлежит нам двоим": "Выражение исключительности момента, интимности между двумя людьми, когда весь мир сужается до их отношений.",
        "Я отключаю телефон, закрываю дверь": "Символизирует отгораживание от внешнего мира, создание приватного пространства только для себя или для себя и партнёра.",
        "Не нужно звонков и стука в окно": "Продолжение темы изоляции от внешних вмешательств, желание не допускать ничего, что может нарушить созданную атмосферу."
      };
      
      const annotation = annotationExamples[lyric] || 
        `Эта строка может интерпретироваться как ${lyric.length < 20 ? 'краткое выражение эмоций' : 'развернутая метафора чувств'}, передающая настроение меланхолии и романтической тоски.`;
      
      resolve(annotation);
    }, 1500);
  });
};

const TrackPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentTrack, isPlaying, togglePlay, progress, setProgress } = usePlayer();
  const [lyrics, setLyrics] = useState<LyricLine[]>(demoLyrics);
  const [activeLyricIndex, setActiveLyricIndex] = useState<number>(0);
  const [loadingAnnotation, setLoadingAnnotation] = useState<number | null>(null);
  const [showAnnotation, setShowAnnotation] = useState<number | null>(null);
  const [isUserScrolling, setIsUserScrolling] = useState<boolean>(false);
  const [scrollTimeout, setScrollTimeout] = useState<number | null>(null);
  
  const progressBarRef = useRef<HTMLDivElement>(null);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const lyricsContentRef = useRef<HTMLDivElement>(null);
  const lyricRefs = useRef<Array<HTMLDivElement | null>>([]);
  const pageRef = useRef<HTMLDivElement>(null);
  const isAutoScrollEnabled = useRef<boolean>(true);

  useEffect(() => {
    console.log(`Загрузка текста песни для трека с ID: ${id}`);
    lyricRefs.current = Array(lyrics.length).fill(null);
  }, [id, lyrics.length]);

  useEffect(() => {
    if (!currentTrack || isUserScrolling) return;

    const newActiveIndex = lyrics.findIndex(
      line => progress >= line.startTime && progress < line.endTime
    );

    if (newActiveIndex !== -1 && newActiveIndex !== activeLyricIndex) {
      setActiveLyricIndex(newActiveIndex);
    }
  }, [progress, lyrics, activeLyricIndex, currentTrack, isUserScrolling]);

  useEffect(() => {
    if (!lyricsContainerRef.current || isUserScrolling || !isAutoScrollEnabled.current) return;
    
    const activeElement = lyricRefs.current[activeLyricIndex];
    if (activeElement) {
      activeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [activeLyricIndex, isUserScrolling]);

  const handleScroll = useCallback(() => {
    if (!lyricsContainerRef.current || !isAutoScrollEnabled.current) return;
    
    setIsUserScrolling(true);
    
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }
    
    const timeout = window.setTimeout(() => {
      setIsUserScrolling(false);
    }, 500);
    
    setScrollTimeout(timeout);
    
    const containerRect = lyricsContainerRef.current.getBoundingClientRect();
    const containerCenter = containerRect.top + containerRect.height / 2;
    
    let closestIndex = 0;
    let closestDistance = Infinity;
    
    lyricRefs.current.forEach((ref, index) => {
      if (ref) {
        const rect = ref.getBoundingClientRect();
        const lineCenter = rect.top + rect.height / 2;
        const distance = Math.abs(lineCenter - containerCenter);
        
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      }
    });
    
    if (closestIndex !== activeLyricIndex) {
      setActiveLyricIndex(closestIndex);
      
      const selectedLine = lyrics[closestIndex];
      setProgress(selectedLine.startTime);
    }
  }, [activeLyricIndex, lyrics, scrollTimeout, setProgress, isUserScrolling]);

  useEffect(() => {
    const lyricsContainer = lyricsContainerRef.current;
    if (lyricsContainer) {
      lyricsContainer.addEventListener('scroll', handleScroll);
      
      return () => {
        lyricsContainer.removeEventListener('scroll', handleScroll);
        if (scrollTimeout) {
          clearTimeout(scrollTimeout);
        }
      };
    }
  }, [handleScroll, scrollTimeout]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleLyricClick = (index: number) => {
    if (!currentTrack) return;
    
    setIsUserScrolling(true);
    
    const clickedLine = lyrics[index];
    setProgress(clickedLine.startTime);
    setActiveLyricIndex(index);
    
    const selectedElement = lyricRefs.current[index];
    if (selectedElement) {
      selectedElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
      
      setTimeout(() => {
        setIsUserScrolling(false);
      }, 600);
    }
  };

  const toggleAutoScroll = () => {
    isAutoScrollEnabled.current = !isAutoScrollEnabled.current;
    
    if (isAutoScrollEnabled.current) {
      const activeElement = lyricRefs.current[activeLyricIndex];
      if (activeElement) {
        activeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }
  };

  const handleRequestAnnotation = async (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (showAnnotation === index) {
      setShowAnnotation(null);
      return;
    }
    
    if (lyrics[index].annotation) {
      setShowAnnotation(index);
      return;
    }
    
    setLoadingAnnotation(index);
    setShowAnnotation(index);
    
    try {
      const annotation = await getAnnotationFromAI(lyrics[index].text);
      
      const updatedLyrics = [...lyrics];
      updatedLyrics[index] = {
        ...updatedLyrics[index],
        annotation
      };
      
      setLyrics(updatedLyrics);
    } catch (error) {
      console.error('Ошибка при получении аннотации:', error);
    } finally {
      setLoadingAnnotation(null);
    }
  };

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

  const handleCloseAnnotation = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowAnnotation(null);
  };

  const getLyricLineClass = (index: number) => {
    let classes = 'lyric-line';
    
    if (index === activeLyricIndex) classes += ' active';
    if (index === activeLyricIndex + 1) classes += ' next-active';
    if (showAnnotation === index) classes += ' has-annotation';
    
    return classes;
  };

  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!currentTrack) {
    return (
      <div className="track-page no-track">
        <div className="back-button-container">
          <button onClick={handleBack} className="back-button">
            <IoMdArrowBack /> Назад
          </button>
        </div>
        <div className="no-track-message">
          <h2>Трек не выбран</h2>
          <p>Выберите трек для прослушивания</p>
        </div>
      </div>
    );
  }

  const progressPercentage = (progress / currentTrack.duration) * 100;

  return (
    <div className="track-page" ref={pageRef}>
      <div className="back-button-container">
        <button onClick={handleBack} className="back-button">
          <IoMdArrowBack /> Назад
        </button>
      </div>

      <div className="track-content">
        <div className="track-cover-container">
          <div className="track-cover-wrapper">
            <img 
              src={testPicture} 
              alt={`${currentTrack.title} - ${currentTrack.artist}`} 
              className="track-page-cover"
            />
            
          </div>
          
          <div className="track-info-header">
            <div className="track-main-info">
              <h2 className="track-title">{currentTrack.title}</h2>
              <p className="track-artist">{currentTrack.artist}</p>
            </div>
          </div>
          
          <div className="track-progress-container">
            <div className="track-time-current">{formatTime(progress)}</div>
            <div 
              className="track-progress-bar" 
              ref={progressBarRef}
              onClick={handleProgressClick}
            >
              <div 
                className="track-progress-current" 
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <div className="track-time-total">{formatTime(currentTrack.duration)}</div>
          </div>
        </div>

        <div className="lyrics-container" ref={lyricsContainerRef}>
          {/* <div className="lyrics-header">
            <h3>Текст песни</h3>
            <div className="lyrics-controls">
              <button 
                className={`auto-scroll-toggle ${isAutoScrollEnabled.current ? 'active' : ''}`}
                onClick={toggleAutoScroll}
              >
                {isAutoScrollEnabled.current ? 'Автоскролл: вкл' : 'Автоскролл: выкл'}
              </button>
              <div className="lyrics-info">
                <span>Нажмите на <BiInfoCircle /> для получения аннотации к строке</span>
              </div>
            </div>
          </div> */}
          
          <div className="lyrics-content">
            {lyrics.map((line, index) => (
              <div 
                key={index}
                className={getLyricLineClass(index)}
                onClick={() => handleLyricClick(index)}
                ref={(el) => { lyricRefs.current[index] = el; }}
              >
                <div className="lyric-line-wrapper">
                  <p className="lyrics-text">
                    {line.text}
                  </p>
                  <button 
                    className="annotation-button" 
                    onClick={(e) => handleRequestAnnotation(index, e)}
                    aria-label="Показать аннотацию"
                  >
                    {loadingAnnotation === index ? (
                      <AiOutlineLoading3Quarters className="loading-icon" />
                    ) : (
                      <BiInfoCircle />
                    )}
                  </button>
                </div>
                
                {showAnnotation === index && (
                  <div className="lyric-annotation">
                    <div className="annotation-header">
                      <h4>Аннотация</h4>
                      <button 
                        className="close-annotation" 
                        onClick={handleCloseAnnotation}
                        aria-label="Закрыть аннотацию"
                      >
                        <MdOutlineClose />
                      </button>
                    </div>
                    <div className="annotation-content">
                      {lyrics[index].annotation ? (
                        <p>{lyrics[index].annotation}</p>
                      ) : (
                        <p className="loading-text">Получаем аннотацию...</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div 
            className={`lyrics-scroll-indicator ${isUserScrolling ? 'visible' : ''}`}
            style={{ 
              height: lyricsContainerRef.current 
                ? `${Math.min(lyricsContainerRef.current.scrollTop / 10, 80)}%` 
                : '0%' 
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default TrackPage;