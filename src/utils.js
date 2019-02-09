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
    let offset = -1;
    let length = 0;
    while ((offset = findNextElements(board, offset, ELEMENT.SNAKE_ELEMENTS)) >= 0) {
        length++;
    }

    return length;
}

const ENEMY_HEADLESS = [
    ...ELEMENT.ENEMY_TAIL,
    ...ELEMENT.ENEMY_BODY
];

export function getEnemies(board) {
    let offset = -1;
    let enemies = [];
    while ((offset = findNextElements(board, offset, ELEMENT.ENEMY_HEAD)) >= 0) {
        enemies.push(getComputedEnemy(board, getXYByPosition(board, offset)));
    }
    return enemies;
}

function getComputedEnemy(board, position) {
    if (!position) {
        /*TODO: Debug this case*/
        return 0;
    }
    let enemy = {
        isFlying: false,
        isFurious: false,
        head: position,
        path: []
    };

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
            let index = surround.findIndex(item => ~ENEMY_HEADLESS.indexOf(item));
            position = surroundPoints[index];
            if (headType === ELEMENT.ENEMY_HEAD_EVIL) {
                enemy.isFurious = true;
            } else if (headType === ELEMENT.ENEMY_HEAD_FLY) {
                enemy.isFlying = true;
            }

    }

    enemy.path.push({ ...position });

    while (true) {
        if (!position) {
            break;
        }
        let element = getAt(board, position.x, position.y);
        if (~ELEMENT.ENEMY_TAIL.indexOf(element)) {
            enemyLength++;
            break;
        }

        if (!~ELEMENT.ENEMY_ELEMENTS.indexOf(element)) {
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
                console.log('PREV?', getAt(board, prevPosition.x, prevPosition.y));
                console.log(getBoardAsString(board));
                console.log('######################################################')
        }

        enemy.path.push({ ...position });

        enemyLength++;
        prevPosition = { ...positionClone };
    }

    enemy.length = enemyLength;
    return enemy;
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
        ...ELEMENT.SNAKE_HEAD
    ]);
}

export function getFirstPositionOf(board, elements) {
    for (let i = 0; i < elements.length; i++) {
        let element = elements[i];
        let position = board.indexOf(element);
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

export function setAt(board, position, element) {
    const size = getBoardSize(board);
    let index = size * position.y + position.x;
    return board.substr(0, index) + element + board.substr(index + 1);
}
