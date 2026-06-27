export const suits = ['♠', '♥', '♦', '♣'];
export const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export function createDeck() {
  const newDeck = [];
  for (let d = 0; d < 4; d++) {
    for (let s of suits) {
      for (let r of ranks) {
        newDeck.push({ suit: s, rank: r });
      }
    }
  }
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
}

export function calculateHand(hand) {
  let value = 0;
  let aces = 0;
  for (let card of hand) {
    if (['J', 'Q', 'K'].includes(card.rank)) {
      value += 10;
    } else if (card.rank === 'A') {
      value += 11;
      aces += 1;
    } else {
      value += parseInt(card.rank);
    }
  }
  while (value > 21 && aces > 0) {
    value -= 10;
    aces -= 1;
  }
  return value;
}
