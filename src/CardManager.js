export default class CardManager {
    constructor() {
        this.decks = this.initializeDecks();
        this.currentCard = null;
    }

    initializeDecks() {
        const decks = {};
        const types = ['plains', 'forest', 'village', 'swamp', 'desert', 'hills', 'ruins'];

        types.forEach(type => {
            decks[type] = this.generateCardsForType(type);
            this.shuffleDeck(decks[type]);
        });

        return decks;
    }

    generateCardsForType(type) {
        const cards = [];
        const templates = this.getTemplates(type);

        for (let i = 0; i < 5; i++) {
            cards.push({
                id: `${type}_${i}`,
                type: type,
                text: templates[i] || `You explore the ${type}. Nothing special happens.`,
                image: null // Placeholder for future
            });
        }
        return cards;
    }

    getTemplates(type) {
        const templates = {
            'plains': [
                "A gentle breeze rolls over the tall grass, carrying the scent of wildflowers.",
                "You spot a herd of wild horses grazing in the distance.",
                "An old stone marker stands here, its inscription worn away by time.",
                "The open sky above feels vast and endless. You feel small but free.",
                "You find a small, abandoned campfire. The ashes are still warm."
            ],
            'forest': [
                "The canopy above is thick, letting only dappled sunlight reach the forest floor.",
                "You hear the snapping of a twig nearby. Something is watching you.",
                "Ancient trees surround you, their roots twisting like giant snakes.",
                "A clear stream cuts through the woods, the water cool and refreshing.",
                "You find a patch of glowing mushrooms growing on a rotting log."
            ],
            'village': [
                "The locals greet you with a mixture of curiosity and caution.",
                "Smoke rises from a chimney, smelling of baking bread.",
                "A merchant offers to trade supplies with you.",
                "Children play in the muddy streets, chasing a stray dog.",
                "The village elder invites you to share a meal and a story."
            ],
            'swamp': [
                "The ground squelches beneath your boots. The air is thick with humidity.",
                "Will-o'-the-wisps dance in the distance, luring the unwary.",
                "A giant frog watches you from a lily pad, unblinking.",
                "The smell of decay is strong here, but life thrives in the muck.",
                "You stumble upon a sunken ruin, half-buried in the mud."
            ],
            'desert': [
                "The sun beats down mercilessly. Heat shimmers off the sand.",
                "A sudden sandstorm forces you to seek shelter behind a dune.",
                "You find the bleached bones of a large beast.",
                "An oasis appears on the horizon... or is it a mirage?",
                "Scorpions skitter away as you approach a rocky outcrop."
            ],
            'hills': [
                "The climb is steep, but the view from the top is worth it.",
                "Wind howls through the craggy peaks.",
                "You spot a goat navigating the sheer cliffs with ease.",
                "A hidden cave entrance is visible halfway up the slope.",
                "Rolling green hills stretch as far as the eye can see."
            ],
            'ruins': [
                "Broken columns and crumbling walls are all that remain of a great hall.",
                "You find a fragment of a statue, its face lost to history.",
                "Strange symbols are carved into the stone floor.",
                "The air here feels heavy with the ghosts of the past.",
                "You discover a hidden compartment in a wall, but it's empty."
            ]
        };
        return templates[type] || [];
    }

    shuffleDeck(deck) {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
    }

    drawCard(type) {
        if (!this.decks[type] || this.decks[type].length === 0) {
            // Reshuffle if empty (optional, for now just regenerate)
            if (this.getTemplates(type).length > 0) {
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
