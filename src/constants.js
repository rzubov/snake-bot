const ELEMENT = {
    NONE: ' ',
    WALL: '☼',
    START_FLOOR: '#',
    OTHER: '?',

    APPLE: '○',
    STONE: '●',
    FLYING_PILL: '©',
    FURY_PILL: '®',
    GOLD: '$',

    // игрок
    HEAD_DOWN: '▼',
    HEAD_LEFT: '◄',
    HEAD_RIGHT: '►',
    HEAD_UP: '▲',
    HEAD_DEAD: '☻',
    HEAD_EVIL: '♥',
    HEAD_FLY: '♠',
    HEAD_SLEEP: '&',

    TAIL_END_DOWN: '╙',
    TAIL_END_LEFT: '╘',
    TAIL_END_UP: '╓',
    TAIL_END_RIGHT: '╕',
    TAIL_INACTIVE: '~',

    BODY_HORIZONTAL: '═',
    BODY_VERTICAL: '║',
    BODY_LEFT_DOWN: '╗',
    BODY_LEFT_UP: '╝',
    BODY_RIGHT_DOWN: '╔',
    BODY_RIGHT_UP: '╚',

    // противник
    ENEMY_HEAD_DOWN: '˅',
    ENEMY_HEAD_LEFT: '<',
    ENEMY_HEAD_RIGHT: '>',
    ENEMY_HEAD_UP: '˄',
    ENEMY_HEAD_DEAD: '☺',
    ENEMY_HEAD_EVIL: '♣',
    ENEMY_HEAD_FLY: '♦',
    ENEMY_HEAD_SLEEP: 'ø',

    ENEMY_TAIL_END_DOWN: '¤',
    ENEMY_TAIL_END_LEFT: '×',
    ENEMY_TAIL_END_UP: 'æ',
    ENEMY_TAIL_END_RIGHT: 'ö',
    ENEMY_TAIL_INACTIVE: '*',

    ENEMY_BODY_HORIZONTAL: '─',
    ENEMY_BODY_VERTICAL: '│',
    ENEMY_BODY_LEFT_DOWN: '┐',
    ENEMY_BODY_LEFT_UP: '┘',
    ENEMY_BODY_RIGHT_DOWN: '┌',
    ENEMY_BODY_RIGHT_UP: '└',
};

ELEMENT.SNAKE_HEAD = [
    ELEMENT.HEAD_DOWN,
    ELEMENT.HEAD_LEFT,
    ELEMENT.HEAD_RIGHT,
    ELEMENT.HEAD_UP,
    ELEMENT.HEAD_DEAD,
    ELEMENT.HEAD_EVIL,
    ELEMENT.HEAD_FLY,
    ELEMENT.HEAD_SLEEP
];
ELEMENT.SNAKE_BODY = [
    ELEMENT.BODY_HORIZONTAL,
    ELEMENT.BODY_VERTICAL,
    ELEMENT.BODY_LEFT_DOWN,
    ELEMENT.BODY_LEFT_UP,
    ELEMENT.BODY_RIGHT_DOWN,
    ELEMENT.BODY_RIGHT_UP
];
ELEMENT.SNAKE_TAIL = [
    ELEMENT.TAIL_END_DOWN,
    ELEMENT.TAIL_END_LEFT,
    ELEMENT.TAIL_END_UP,
    ELEMENT.TAIL_END_RIGHT,
    ELEMENT.TAIL_INACTIVE
];
ELEMENT.SNAKE_ELEMENTS = [
    ...ELEMENT.SNAKE_HEAD,
    ...ELEMENT.SNAKE_BODY,
    ...ELEMENT.SNAKE_TAIL
];
ELEMENT.ENEMY_PASSIVE_HEAD = [
    ELEMENT.ENEMY_HEAD_DOWN,
    ELEMENT.ENEMY_HEAD_LEFT,
    ELEMENT.ENEMY_HEAD_RIGHT,
    ELEMENT.ENEMY_HEAD_UP,
];
ELEMENT.ENEMY_HEAD = [
    ...ELEMENT.ENEMY_PASSIVE_HEAD,
    ELEMENT.ENEMY_HEAD_EVIL,
    ELEMENT.ENEMY_HEAD_FLY,
    ELEMENT.ENEMY_HEAD_DEAD,
    ELEMENT.ENEMY_HEAD_SLEEP
];
ELEMENT.ENEMY_BODY = [
    ELEMENT.ENEMY_BODY_HORIZONTAL,
    ELEMENT.ENEMY_BODY_VERTICAL,
    ELEMENT.ENEMY_BODY_LEFT_DOWN,
    ELEMENT.ENEMY_BODY_LEFT_UP,
    ELEMENT.ENEMY_BODY_RIGHT_DOWN,
    ELEMENT.ENEMY_BODY_RIGHT_UP
];
ELEMENT.ENEMY_TAIL = [
    ELEMENT.ENEMY_TAIL_END_DOWN,
    ELEMENT.ENEMY_TAIL_END_LEFT,
    ELEMENT.ENEMY_TAIL_END_UP,
    ELEMENT.ENEMY_TAIL_END_RIGHT,
    ELEMENT.ENEMY_TAIL_INACTIVE,
];
ELEMENT.ENEMY_ELEMENTS = [
    ...ELEMENT.ENEMY_HEAD,
    ...ELEMENT.ENEMY_TAIL,
    ...ELEMENT.ENEMY_BODY
];

export { ELEMENT };

export const COMMANDS = {
    UP: 'UP', // snake momves
    DOWN: 'DOWN',
    LEFT: 'LEFT',
    RIGHT: 'RIGHT',
    ACT: 'ACT', // drop stone if any
    OPPOSITE: {
        LEFT: 'RIGHT',
        RIGHT: 'LEFT',
        UP: 'DOWN',
        DOWN: 'UP'
    },
    GET_INDEX: {
        LEFT: 0,
        UP: 1,
        RIGHT: 2,
        DOWN: 3
    },
    BY_INDEX: {
        0: 'LEFT',
        1: 'UP',
        2: 'RIGHT',
        3: 'DOWN'
    }

};

export const FURY_TARGETS = [
    ELEMENT.STONE,

    ...ELEMENT.ENEMY_PASSIVE_HEAD,
    ...ELEMENT.ENEMY_BODY
];
