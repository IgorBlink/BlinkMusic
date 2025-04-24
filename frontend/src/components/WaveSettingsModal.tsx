import React, { useState, useEffect } from 'react';
import './WaveSettingsModal.css';
import { 
  FiX,
  FiAlignCenter,
  FiSunrise,
  FiHeadphones,
  FiActivity,
  FiMoon,
  FiHeart,
  FiStar,
  FiZap
} from 'react-icons/fi';

export interface WaveSettings {
  activity: string;
  character: string;
  mood: string;
}

interface WaveSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: WaveSettings) => void;
  initialSettings?: Partial<WaveSettings>;
}

const WaveSettingsModal: React.FC<WaveSettingsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialSettings = {}
}) => {
  const [settings, setSettings] = useState<Partial<WaveSettings>>(initialSettings);

  useEffect(() => {
    if (isOpen) {
      setSettings(initialSettings);
    }
  }, [isOpen, initialSettings]);

  const activities = [
    { id: 'wakeup', label: 'Просыпаюсь', icon: <FiSunrise /> },
    { id: 'commute', label: 'В дороге', icon: <FiAlignCenter /> },
    { id: 'work', label: 'Работаю', icon: <FiHeadphones /> },
    { id: 'workout', label: 'Тренируюсь', icon: <FiActivity /> },
    { id: 'sleep', label: 'Засыпаю', icon: <FiMoon /> }
  ];

  const characters = [
    { id: 'favorite', label: 'Любимое', icon: <FiHeart /> },
    { id: 'new', label: 'Незнакомое', icon: <FiStar /> },
    { id: 'popular', label: 'Популярное', icon: <FiZap /> }
  ];

  const moods = [
    { id: 'energetic', label: 'Бодрое', color: '#FF5722' },
    { id: 'happy', label: 'Весёлое', color: '#FFC107' },
    { id: 'calm', label: 'Спокойное', color: '#4CAF50' },
    { id: 'sad', label: 'Грустное', color: '#2196F3' }
  ];

  const handleActivityChange = (activity: string) => {
    setSettings(prev => ({ ...prev, activity }));
  };

  const handleCharacterChange = (character: string) => {
    setSettings(prev => ({ ...prev, character }));
  };

  const handleMoodChange = (mood: string) => {
    setSettings(prev => ({ ...prev, mood }));
  };

  const handleSave = () => {
    if (settings.activity && settings.character && settings.mood) {
      onSave(settings as WaveSettings);
      onClose();
    }
  };

  const isComplete = Boolean(settings.activity && settings.character && settings.mood);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Настройка моей волны</h2>
          <button className="close-button" onClick={onClose}>
            <FiX />
          </button>
        </div>
        
        <div className="modal-body">
          <div className="settings-section">
            <h3>По занятию</h3>
            <div className="options-grid">
              {activities.map(activity => (
                <button
                  key={activity.id}
                  className={`option-button with-icon ${settings.activity === activity.id ? 'selected' : ''}`}
                  onClick={() => handleActivityChange(activity.id)}
                  style={{
                    '--accent-color': '33, 150, 243'
                  } as React.CSSProperties}
                >
                  <span className="icon">{activity.icon}</span>
                  <span>{activity.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="settings-section">
            <h3>По характеру</h3>
            <div className="options-grid">
              {characters.map(character => (
                <button
                  key={character.id}
                  className={`option-button with-icon ${settings.character === character.id ? 'selected' : ''}`}
                  onClick={() => handleCharacterChange(character.id)}
                  style={{
                    '--accent-color': '33, 150, 243'
                  } as React.CSSProperties}
                >
                  <span className="icon">{character.icon}</span>
                  <span>{character.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="settings-section">
            <h3>Под настроение</h3>
            <div className="options-grid">
              {moods.map(mood => (
                <button
                  key={mood.id}
                  className={`option-button with-color ${settings.mood === mood.id ? 'selected' : ''}`}
                  onClick={() => handleMoodChange(mood.id)}
                  style={{
                    '--accent-color': mood.color.replace('#', '').match(/.{2}/g)?.map(hex => parseInt(hex, 16)).join(', ') || '33, 150, 243'
                  } as React.CSSProperties}
                >
                  <div className="color-dot" style={{ backgroundColor: mood.color }}></div>
                  <span>{mood.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="cancel-button" onClick={onClose}>
            Отмена
          </button>
          <button 
            className="save-button" 
            onClick={handleSave} 
            disabled={!isComplete}
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
};

export default WaveSettingsModal;