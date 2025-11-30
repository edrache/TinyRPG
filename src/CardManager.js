import { CardData } from './CardData.js';

export default class CardManager {
    constructor() {
        this.decks = this.initializeDecks();
        this.currentCard = null;
    }

    initializeDecks() {
        const decks = {};
        // Get types from CardData keys
        const types = Object.keys(CardData);

        types.forEach(type => {
            decks[type] = this.generateCardsForType(type);
            this.shuffleDeck(decks[type]);
        });

        return decks;
    }

    generateCardsForType(type) {
        // Deep copy the cards from CardData to avoid modifying the original data
        const cards = CardData[type].map(card => ({ ...card, type }));
        return cards;
    }

    shuffleDeck(deck) {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
    }

    drawCard(type) {
        if (!this.decks[type] || this.decks[type].length === 0) {
            // Reshuffle if empty
            if (CardData[type] && CardData[type].length > 0) {
                this.decks[type] = this.generateCardsForType(type);
                this.shuffleDeck(this.decks[type]);
            } else {
                return null; // No cards for this type
            }
        }

        const card = this.decks[type].pop();
        this.currentCard = card;
        return card;
    }

    getCardsRemaining(type) {
        return this.decks[type] ? this.decks[type].length : 0;
    }
}
