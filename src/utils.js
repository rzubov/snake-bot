import {
    ELEMENT
} from './constants';

// Here is utils that might help for bot development
export function getBoardAsString(board) {
    const size = getBoardSize(board);

    return getBoardAsArray(board).join("\n");
}

export function getBoardAsArray(board) {
    const size = getBoardSize(board);
    let result = [];
    for (let i = 0; i < size; i++) {
        result.push(board.substring(i * size, (i + 1) * size));
    }
    return result;
}

export function getBoardSize(board) {
    return Math.sqrt(board.length);
}

export function getSnakeLength(board) {
    let snakeElements = [
        ELEMENT.HEAD_DOWN,
        ELEMENT.HEAD_LEFT,
        ELEMENT.HEAD_RIGHT,
        ELEMENT.HEAD_UP,
        ELEMENT.HEAD_DEAD,
        ELEMENT.HEAD_EVIL,
        ELEMENT.HEAD_FLY,
        ELEMENT.HEAD_SLEEP,
        ELEMENT.TAIL_END_DOWN,
        ELEMENT.TAIL_END_LEFT,
        ELEMENT.TAIL_END_UP,
        ELEMENT.TAIL_END_RIGHT,
        ELEMENT.TAIL_INACTIVE,
        ELEMENT.BODY_HORIZONTAL,
        ELEMENT.BODY_VERTICAL,
        ELEMENT.BODY_LEFT_DOWN,
        ELEMENT.BODY_LEFT_UP,
        ELEMENT.BODY_RIGHT_DOWN,
        ELEMENT.BODY_RIGHT_UP
    ];
    let offset = -1;
    let length = 0;
    while ((offset = findNextElements(board, offset, snakeElements)) >= 0) {
        length++;
    }

    return length;
}

let enemyHead = [
    ELEMENT.ENEMY_HEAD_DOWN,
    ELEMENT.ENEMY_HEAD_LEFT,
    ELEMENT.ENEMY_HEAD_RIGHT,
    ELEMENT.ENEMY_HEAD_UP,
    ELEMENT.ENEMY_HEAD_EVIL,
    ELEMENT.ENEMY_HEAD_FLY
];

let enemyTail = [
    ELEMENT.ENEMY_TAIL_END_DOWN,
    ELEMENT.ENEMY_TAIL_END_LEFT,
    ELEMENT.ENEMY_TAIL_END_UP,
    ELEMENT.ENEMY_TAIL_END_RIGHT,
];

export function getEnemiesCount(board) {

    let offset = -1;
    let length = 0;
    while ((offset = findNextElements(board, offset, enemyHead)) >= 0) {
        length++;
    }

    return length;
}

let enemy = [
    ELEMENT.ENEMY_HEAD_DOWN,
    ELEMENT.ENEMY_HEAD_LEFT,
    ELEMENT.ENEMY_HEAD_RIGHT,
    ELEMENT.ENEMY_HEAD_UP,
    ELEMENT.ENEMY_HEAD_EVIL,
    ELEMENT.ENEMY_HEAD_FLY,
    ELEMENT.ENEMY_TAIL_END_DOWN,
    ELEMENT.ENEMY_TAIL_END_LEFT,
    ELEMENT.ENEMY_TAIL_END_UP,
    ELEMENT.ENEMY_TAIL_END_RIGHT,
    ELEMENT.ENEMY_TAIL_INACTIVE,
    ELEMENT.ENEMY_BODY_HORIZONTAL,
    ELEMENT.ENEMY_BODY_VERTICAL,
    ELEMENT.ENEMY_BODY_LEFT_DOWN,
    ELEMENT.ENEMY_BODY_LEFT_UP,
    ELEMENT.ENEMY_BODY_RIGHT_DOWN,
    ELEMENT.ENEMY_BODY_RIGHT_UP
];

let enemyBody = [
    ELEMENT.ENEMY_TAIL_END_DOWN,
    ELEMENT.ENEMY_TAIL_END_LEFT,
    ELEMENT.ENEMY_TAIL_END_UP,
    ELEMENT.ENEMY_TAIL_END_RIGHT,
    ELEMENT.ENEMY_TAIL_INACTIVE,
    ELEMENT.ENEMY_BODY_HORIZONTAL,
    ELEMENT.ENEMY_BODY_VERTICAL,
    ELEMENT.ENEMY_BODY_LEFT_DOWN,
    ELEMENT.ENEMY_BODY_LEFT_UP,
    ELEMENT.ENEMY_BODY_RIGHT_DOWN,
    ELEMENT.ENEMY_BODY_RIGHT_UP
];

export function getEnemiesLength(board) {
    let offset = -1;
    let enemies = [];
    while ((offset = findNextElements(board, offset, enemyHead)) >= 0) {
        let position = getXYByPosition(board, offset);
        position.length = computeEnemyLength(board, position);
        enemies.push(position);
    }
    return enemies;
}

function computeEnemyLength(board, position) {
    if (!position) {
        /*TODO: Debug this case*/
        return 0;
    }
    let headType = getAt(board, position.x, position.y);
    let enemyLength = 1;
    position = { ...position };
    let prevPosition = { ...position };

    switch (headType) {
        case ELEMENT.ENEMY_HEAD_DOWN:
            position.y--;
            break;
        case ELEMENT.ENEMY_HEAD_UP:
            position.y++;
            break;
        case ELEMENT.ENEMY_HEAD_LEFT:
            position.x++;
            break;
        case ELEMENT.ENEMY_HEAD_RIGHT:
            position.x--;
            break;
        default:
            let surroundPoints = getSurroundPoints(position);
            let surround = getSurround(board, position);
            let index = surround.findIndex(item => ~enemyBody.indexOf(item));
            position = surroundPoints[index];
            console.log('default head:', position);
            console.log('default head prev:', prevPosition)
        /*TODO: logic for EVIL AND FLY HEAD*/
    }
    while (true) {
        if (!position) {
            break;
        }
        let element = getAt(board, position.x, position.y);
        if (~enemyTail.indexOf(element)) {
            enemyLength++;
            break;
        }

        if (!~enemy.indexOf(element)) {
            console.log(prevPosition, position);
            console.log(element);
            console.log(getBoardAsString(board));
            console.log('PREV?', getAt(board, prevPosition.x, prevPosition.y));
            console.log('Looks like a bug!Not a part of enemy');
            break;
        }

        if (enemyLength > 50) {
            console.log(`I don't fucking care about length more than 50 ;)`);
            break;
        }

        let positionClone = { ...position };
        switch (element) {
            case ELEMENT.ENEMY_BODY_VERTICAL:
                if (prevPosition.y > position.y) {
                    position.y--;
                } else {
                    position.y++;
                }
                break;
            case ELEMENT.ENEMY_BODY_HORIZONTAL:
                if (prevPosition.x > position.x) {
                    position.x--;
                } else {
                    position.x++;
                }
                break;
            case ELEMENT.ENEMY_BODY_LEFT_DOWN:
                if (prevPosition.y === position.y) {
                    position.y++;
                } else {
                    position.x--;
                }
                break;
            case ELEMENT.ENEMY_BODY_LEFT_UP:
                if (prevPosition.y === position.y) {
                    position.y--;
                } else {
                    position.x--;
                }
                break;
            case ELEMENT.ENEMY_BODY_RIGHT_DOWN:
                if (prevPosition.y === position.y) {
                    position.y++;
                } else {
                    position.x++;
                }
                break;
            case ELEMENT.ENEMY_BODY_RIGHT_UP:
                if (prevPosition.y === position.y) {
                    position.y--;
                } else {
                    position.x++;
                }
                break;
            default:
                console.log('DEFAULT?', element);
                console.log('PREV?', getAt(board, prevPosition.x, prevPosition.y))
                console.log(getBoardAsString(board));
                console.log('######################################################')
        }
        enemyLength++;
        prevPosition = { ...positionClone };

    }
    return enemyLength;

}

export function getSurround(board, position) {
    return getSurroundPoints(position)
        .map(point => getElementByXY(board, point))
}

export function getSurroundPoints(position) {
    const p = position;
    return [
        { x: p.x - 1, y: p.y }, // LEFT
        { x: p.x, y: p.y - 1 }, // UP
        { x: p.x + 1, y: p.y }, // RIGHT
        { x: p.x, y: p.y + 1 } // DOWN
    ];
}

export function findNextElements(board, offset, elements) {
    let foundItems = elements
        .map(item => board.indexOf(item, offset + 1))
        .filter(item => item !== -1);
    return foundItems.length ? Math.min(...foundItems) : -1
}

export function isGameOver(board) {
    return board.indexOf(ELEMENT.HEAD_DEAD) !== -1;
}

export function isAt(board, x, y, element) {
    if (isOutOf(board, x, y)) {
        return false;
    }
    return getAt(board, x, y) === element;
}

export function getAt(board, x, y) {
    if (isOutOf(board, x, y)) {
        return ELEMENT.WALL;
    }
    return getElementByXY(board, { x, y });
}

export function isNear(board, x, y, element) {
    if (isOutOf(board, x, y)) {
        return ELEMENT.WALL;
    }

    return isAt(board, x + 1, y, element) ||
        isAt(board, x - 1, y, element) ||
        isAt(board, x, y + 1, element) ||
        isAt(board, x, y - 1, element);
}

export function isOutOf(board, x, y) {
    const boardSize = getBoardSize(board);
    return x >= boardSize || y >= boardSize || x < 0 || y < 0;
}

export function getHeadPosition(board) {
    return getFirstPositionOf(board, [
        ELEMENT.HEAD_DOWN,
        ELEMENT.HEAD_LEFT,
        ELEMENT.HEAD_RIGHT,
        ELEMENT.HEAD_UP,
        ELEMENT.HEAD_DEAD,
        ELEMENT.HEAD_EVIL,
        ELEMENT.HEAD_FLY,
        ELEMENT.HEAD_SLEEP,
    ]);
}

export function getFirstPositionOf(board, elements) {
    for (var i = 0; i < elements.length; i++) {
        var element = elements[i];
        var position = board.indexOf(element);
        if (position !== -1) {
            return getXYByPosition(board, position);
        }
    }
    return null;
}

export function getXYByPosition(board, position) {
    if (position === -1) {
        return null;
    }

    const size = getBoardSize(board);
    return {
        x: position % size,
        y: (position - (position % size)) / size
    };
}

export function getElementByXY(board, position) {
    const size = getBoardSize(board);
    return board[size * position.y + position.x];
}
