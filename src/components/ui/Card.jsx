import React from 'react';

export const Card = ({ card, hidden, index }) => {
  const delay = index * 0.15 + 's';
  if (hidden) {
    return (
      <div className="card-deal" style={{
        width: '70px', height: '100px', background: 'repeating-linear-gradient(45deg, #b91c1c, #b91c1c 10px, #7f1d1d 10px, #7f1d1d 20px)',
        borderRadius: '8px', border: '3px solid #fff', boxShadow: '0 4px 10px rgba(0,0,0,0.6)',
        animationDelay: delay
      }}></div>
    );
  }
  const color = ['♥', '♦'].includes(card.suit) ? '#ef4444' : '#1f2937';
  return (
    <div className="card-deal" style={{
      width: '70px', height: '100px', background: '#fff', borderRadius: '8px',
      color: color, display: 'flex', flexDirection: 'column',
      justifyContent: 'space-between', padding: '8px',
      boxShadow: '0 4px 10px rgba(0,0,0,0.6)', fontWeight: 'bold',
      border: '1px solid #ccc',
      animationDelay: delay
    }}>
      <div style={{ alignSelf: 'flex-start', fontSize: '1.4rem', lineHeight: '1' }}>{card.rank}</div>
      <div style={{ alignSelf: 'center', fontSize: '2rem', lineHeight: '1' }}>{card.suit}</div>
    </div>
  );
};
