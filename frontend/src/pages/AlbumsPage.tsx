import { useState } from 'react';
import { Link } from 'react-router-dom';


const testPicture = '/test-picture.png';

// moock
const mockAlbums = [
  {
    id: 1,
    title: 'Thriller',
    artist: 'Michael Jackson',
    year: 1982,
    cover: testPicture,
    songs: [
      { id: 101, title: 'Billie Jean' },
      { id: 102, title: 'Beat It' },
      { id: 103, title: 'Thriller' }
    ]
  },
  {
    id: 2,
    title: 'Back in Black',
    artist: 'AC/DC',
    year: 1980,
    cover: testPicture,
    songs: [
      { id: 201, title: 'Back in Black' },
      { id: 202, title: 'You Shook Me All Night Long' },
      { id: 203, title: 'Hells Bells' }
    ]
  },
  {
    id: 3,
    title: 'The Dark Side of the Moon',
    artist: 'Pink Floyd',
    year: 1973,
    cover: testPicture,
    songs: [
      { id: 301, title: 'Money' },
      { id: 302, title: 'Time' },
      { id: 303, title: 'The Great Gig in the Sky' }
    ]
  }
];

const AlbumsPage = () => {
  const [expandedAlbum, setExpandedAlbum] = useState<number | null>(null);
  
  const toggleAlbum = (albumId: number) => {
    if (expandedAlbum === albumId) {
      setExpandedAlbum(null);
    } else {
      setExpandedAlbum(albumId);
    }
  };

  return (
    <div className="container">
      <h1>Альбомы</h1>
      
      <div className="search-bar">
        <input type="text" placeholder="Поиск по альбомам, исполнителям, песням..." />
        <button>Поиск</button>
      </div>
      
      <div className="albums-list">
        {mockAlbums.map(album => (
          <div className="album-card card" key={album.id}>
            <div className="album-header" onClick={() => toggleAlbum(album.id)}>
              <img src={testPicture} alt={album.title} className="album-cover" />
              <div className="album-info">
                <h3>{album.title}</h3>
                <p>{album.artist} • {album.year}</p>
              </div>
            </div>
            
            {expandedAlbum === album.id && (
              <div className="songs-list">
                <h4>Песни:</h4>
                <ul>
                  {album.songs.map(song => (
                    <li key={song.id}>
                      <Link to={`/lyrics/${song.id}`}>{song.title}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AlbumsPage; 