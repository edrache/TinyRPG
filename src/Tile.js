export default class Tile {
    constructor(x, y, type = 'plains') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.tags = [type];

        this.properties = Tile.getProperties(type);
        if (!this.properties.walkable) {
            this.tags.push('impassable');
        } else {
            this.tags.push('walkable');
        }
    }

    static getProperties(type) {
        const props = {
            'plains': { color: '#90EE90', walkable: true, image: 'assets/plains_tile_1764359683240.png' },
            'forest': { color: '#228B22', walkable: true, image: 'assets/forest_tile_1764359696973.png' },
            'mountain': { color: '#808080', walkable: false, image: 'assets/mountain_tile_1764359710272.png' },
            'river': { color: '#4169E1', walkable: false, image: 'assets/river_tile_1764359723299.png' },
            'village': { color: '#DEB887', walkable: true, image: 'assets/village_tile_1764359737906.png' },
            'swamp': { color: '#556B2F', walkable: true, image: 'assets/swamp_tile_1764359757850.png' },
            'desert': { color: '#F4A460', walkable: true, image: 'assets/desert_tile_1764359770422.png' },
            'hills': { color: '#CD853F', walkable: true, image: 'assets/plains_tile_1764359683240.png' }, // Placeholder: plains
            'lake': { color: '#000080', walkable: false, image: 'assets/river_tile_1764359723299.png' }, // Placeholder: river
            'ruins': { color: '#708090', walkable: true, image: 'assets/mountain_tile_1764359710272.png' }, // Placeholder: mountain
            'wall': { color: '#333333', walkable: false, image: null }
        };
        return props[type] || { color: '#FF00FF', walkable: true, image: null }; // Magenta for error
    }

    addTag(tag) {
        if (!this.tags.includes(tag)) {
            this.tags.push(tag);
        }
    }

    hasTag(tag) {
        return this.tags.includes(tag);
    }
}
