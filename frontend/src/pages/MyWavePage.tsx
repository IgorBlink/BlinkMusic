import React, { useState } from 'react';
import WaveCustomizeModal, { WaveSettings } from '../components/MyWave/WaveCustomizeModal';
import { MdSettings } from 'react-icons/md';
import './MyWavePage.css';

const MyWavePage: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [waveSettings, setWaveSettings] = useState<WaveSettings>({});

  const handleOpenModal = () => {
    setShowModal(true);
  };

  
  const handleCloseModal = () => {
    setShowModal(false);
  };

  
  const handleSaveSettings = (settings: WaveSettings) => {
    setWaveSettings(settings);
    setShowModal(false);
    console.log('Сохранены настройки:', settings);
 


  const renderSelectedSettings = () => {
    const { activity, character, mood } = waveSettings;
    
    const activityNames: Record<string, string> = {
      'wakeUp': 'Просыпаюсь',
      'onTheRoad': 'В дороге',
      'working': 'Работаю',
      'training': 'Тренируюсь',
      'sleep': 'Засыпаю'
    };
    
    const characterNames: Record<string, string> = {
      'favorite': 'Любимое',
      'unknown': 'Незнакомое',
      'popular': 'Популярное'
    };
    
    const moodNames: Record<string, string> = {
      'energetic': 'Бодрое',
      'happy': 'Весёлое',
      'calm': 'Спокойное',
      'sad': 'Грустное'
    };
    
    return (
      <div className="selected-settings">
        <h3>Текущие настройки волны:</h3>
        <ul>
          {activity && (
            <li>
              <span className="setting-label">Занятие:</span> 
              <span className="setting-value">{activityNames[activity]}</span>
            </li>
          )}
          {character && (
            <li>
              <span className="setting-label">Характер:</span> 
              <span className="setting-value">{characterNames[character]}</span>
            </li>
          )}
          {mood && (
            <li>
              <span className="setting-label">Настроение:</span> 
              <span className="setting-value">{moodNames[mood]}</span>
            </li>
          )}
          {!activity && !character && !mood && (
            <li className="no-settings">Настройки не выбраны</li>
          )}
        </ul>
      </div>
    );
  };

  return (
    <div className="mywave-page">
      <div className="mywave-header">
        <h1>Моя волна</h1>
        <button className="customize-button" onClick={handleOpenModal}>
          <MdSettings /> Настроить волну
        </button>
      </div>
      
      {renderSelectedSettings()}
      
      <div className="mywave-content">
        <div className="placeholder-content">
          <p>Здесь будет отображаться контент согласно вашим настройкам.</p>
          <p>Нажмите "Настроить волну", чтобы задать параметры.</p>
        </div>
      </div>
      
      {showModal && (
        <WaveCustomizeModal 
          onClose={handleCloseModal}
          onSave={handleSaveSettings}
          initialSettings={waveSettings}
        />
      )}
    </div>
  );
};

export default MyWavePage; 