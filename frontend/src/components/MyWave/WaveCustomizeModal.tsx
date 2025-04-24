import React, { useState } from 'react';
import './WaveCustomizeModal.css';
import { IoClose } from 'react-icons/io5';
import { 
  MdWbSunny, 
  MdDirectionsCar, 
  MdWork, 
  MdFitnessCenter, 
  MdNightlight 
} from 'react-icons/md';
import { AiFillHeart, AiFillStar, AiFillThunderbolt } from 'react-icons/ai';

export type Activity = 'wakeUp' | 'onTheRoad' | 'working' | 'training' | 'sleep' | null;
export type Character = 'favorite' | 'unknown' | 'popular' | null;
export type Mood = 'energetic' | 'happy' | 'calm' | 'sad' | null;

export interface WaveSettings {
  activity?: Activity;
  character?: Character;
  mood?: Mood;
}

interface WaveCustomizeModalProps {
  onClose: () => void;
  onSave: (settings: WaveSettings) => void;
  initialSettings?: WaveSettings;
}

const WaveCustomizeModal: React.FC<WaveCustomizeModalProps> = ({
  onClose,
  onSave,
  initialSettings = {}
}) => {
  const [settings, setSettings] = useState<WaveSettings>({
    activity: initialSettings.activity || null,
    character: initialSettings.character || null,
    mood: initialSettings.mood || null
  });

  const handleActivityChange = (activity: Activity) => {
    setSettings(prev => ({
      ...prev,
      activity: prev.activity === activity ? null : activity
    }));
  };

  const handleCharacterChange = (character: Character) => {
    setSettings(prev => ({
      ...prev,
      character: prev.character === character ? null : character
    }));
  };

  const handleMoodChange = (mood: Mood) => {
    setSettings(prev => ({
      ...prev,
      mood: prev.mood === mood ? null : mood
    }));
  };

  const getActiveClass = (
    type: 'activity' | 'character' | 'mood',
    value: Activity | Character | Mood
  ) => {
    return settings[type] === value ? 'active' : '';
  };

  const handleModalContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={handleModalContentClick}>
        <div className="modal-header">
          <h2>Настройка Моей волны</h2>
          <button className="close-button" onClick={onClose}>
            <IoClose />
          </button>
        </div>
        
        <div className="modal-body">
          <div className="modal-section">
            <h3>По занятию</h3>
            <div className="activity-options">
              <button 
                className={`activity-button ${getActiveClass('activity', 'wakeUp')}`}
                onClick={() => handleActivityChange('wakeUp')}
              >
                <MdWbSunny /> Просыпаюсь
              </button>
              <button 
                className={`activity-button ${getActiveClass('activity', 'onTheRoad')}`}
                onClick={() => handleActivityChange('onTheRoad')}
              >
                <MdDirectionsCar /> В дороге
              </button>
              <button 
                className={`activity-button ${getActiveClass('activity', 'working')}`}
                onClick={() => handleActivityChange('working')}
              >
                <MdWork /> Работаю
              </button>
              <button 
                className={`activity-button ${getActiveClass('activity', 'training')}`}
                onClick={() => handleActivityChange('training')}
              >
                <MdFitnessCenter /> Тренируюсь
              </button>
              <button 
                className={`activity-button ${getActiveClass('activity', 'sleep')}`}
                onClick={() => handleActivityChange('sleep')}
              >
                <MdNightlight /> Засыпаю
              </button>
            </div>
          </div>
          
          <div className="modal-section">
            <h3>По характеру</h3>
            <div className="character-options">
              <div 
                className={`character-card ${getActiveClass('character', 'favorite')}`}
                onClick={() => handleCharacterChange('favorite')}
              >
                <div className="character-icon">
                  <AiFillHeart color="#ff6b6b" />
                </div>
                <span>Любимое</span>
              </div>
              <div 
                className={`character-card ${getActiveClass('character', 'unknown')}`}
                onClick={() => handleCharacterChange('unknown')}
              >
                <div className="character-icon">
                  <AiFillStar color="#ffc107" />
                </div>
                <span>Незнакомое</span>
              </div>
              <div 
                className={`character-card ${getActiveClass('character', 'popular')}`}
                onClick={() => handleCharacterChange('popular')}
              >
                <div className="character-icon">
                  <AiFillThunderbolt color="#4dabf7" />
                </div>
                <span>Популярное</span>
              </div>
            </div>
          </div>
          
          <div className="modal-section">
            <h3>Под настроение</h3>
            <div className="mood-options">
              <div 
                className={`mood-card ${getActiveClass('mood', 'energetic')}`}
                onClick={() => handleMoodChange('energetic')}
              >
                <div className="mood-color mood-energetic"></div>
                <span>Бодрое</span>
              </div>
              <div 
                className={`mood-card ${getActiveClass('mood', 'happy')}`}
                onClick={() => handleMoodChange('happy')}
              >
                <div className="mood-color mood-happy"></div>
                <span>Весёлое</span>
              </div>
              <div 
                className={`mood-card ${getActiveClass('mood', 'calm')}`}
                onClick={() => handleMoodChange('calm')}
              >
                <div className="mood-color mood-calm"></div>
                <span>Спокойное</span>
              </div>
              <div 
                className={`mood-card ${getActiveClass('mood', 'sad')}`}
                onClick={() => handleMoodChange('sad')}
              >
                <div className="mood-color mood-sad"></div>
                <span>Грустное</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="button-cancel" onClick={onClose}>
            Отмена
          </button>
          <button 
            className="button-save"
            onClick={() => onSave(settings)}
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
};

export default WaveCustomizeModal;