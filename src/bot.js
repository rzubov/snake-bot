import { ELEMENT, COMMANDS, FURY_TARGETS } from './constants';
import {
    isGameOver,
    isGameStarting,
    getHeadPosition,
    getElementByXY,
    getXYByPosition,
    getAt,
    setAt,
    getSnakeLength,
    getEnemies,
    findNextElements,
    getSurround,
    getSurroundPoints,
    getBoardSize,
    getBoardAsArray,
    getBoardAsString,
    getSurroundEcho,
    getTailPosition
} from './utils';

import * as _ from 'lodash';
import * as PF from 'pathfinding';

// Bot Example
export function getNextSnakeMove(board, logger) {
    if (isGameOver(board)) {
        return '';
    }
    const headPosition = getHeadPosition(board);
    if (!headPosition) {
        return '';
    }
    logger('Head:' + JSON.stringify(headPosition));
    return getNextCommand(board, headPosition);
}

let ALLOWED_CELLS = [
    ELEMENT.NONE,
    ELEMENT.GOLD,
    ELEMENT.APPLE,
    ELEMENT.FURY_PILL,
    ELEMENT.FLYING_PILL,
    ...ELEMENT.SNAKE_HEAD
];

let SEARCH_ITEMS = [
    ELEMENT.GOLD,
    ELEMENT.APPLE,
    ELEMENT.FURY_PILL
];

let debug = true;

let snake = {
    prevCommand: 'RIGHT',
    furious: 0,
    flying: 0,
    length: 0,
    stones: 0,
    head: null,
    allowed_cells: null,
    search_items: null,
    mode: 'pvp'
};

let GRID = null;
let finder = new PF.AStarFinder();

function getNextCommand(board, head) {
    console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
    console.log(new Date());
    if (isGameStarting(board)) {
        console.log('Game starting...');
        snake.furious = 0;
        snake.flying = 0;
        snake.stones = 0;
    }

    let enemies = getEnemies(board);

    snake.length = getSnakeLength(board);
    snake.head = head;
    snake.furious = getSnakeFurious(board);
    snake.flying = getSnakeFlying(board);
    snake.allowed_cells = getAllowedCells(board, enemies);
    snake.search_items = getSearchItems(board, enemies);
    if (!snake.search_items.length) {
        snake.search_items = [...SEARCH_ITEMS];
    }

    GRID = getBoardGrid(board, enemies);
    if (debug) {
        console.log('allowed:', snake.allowed_cells);
        console.log('search items:', snake.search_items);
        console.log('snake length:', snake.length);
        console.log('stones:', snake.stones)
    }

    let dropStone = isHeadOnTheTail(board);

    let items = getItems(board, enemies);

    let { nextPoint } = findNearestPoint(board, head, items, enemies);

    if (!nextPoint.x) {
        console.warn('No PRIMARY targets accessible!');
        snake.search_items = [...SEARCH_ITEMS];
        let items = getItems(board, enemies);
        ({ nextPoint } = findNearestPoint(board, head, items));

        if (!nextPoint.x) {
            console.warn('No SECONDARY targets accessible!', getBoardAsString(board));
            console.warn('Getting command by rating...');
            return getCommandByRatings(board);
        }
    }

    if (nextPoint.x && getAt(board, nextPoint.x, nextPoint.y) === ELEMENT.STONE) {
        snake.stones++;
    }

    let preCommand = computeDirection(head, nextPoint);

    /*   if (!nearestDistancesPoint) {
           console.log('NO NEAREST POINT!');
           return getCommandByRatings(board);
       }

       if (debug) {
           console.log('nearest item:', getElementByXY(board, nearestPoint));
       }

       let preCommand = moveToPoint(board, head, nearestPoint, nearestDistancesPoint);
       if (isCommandOppositeToPrevious(preCommand)) {
           preCommand = reverse(board, head, nearestDistancesPoint.dy);
       }

       preCommand = snake.prevCommand = findSafe(board, head, nearestPoint, preCommand);*/
    if (dropStone && snake.stones > 0) {
        snake.stones--;
    }


    if (isKillerAround(enemies)) {
        console.warn('KAMIKADZE!!')
        return 'ACT(0)';
    }
    console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
    return dropStone ? `${preCommand},ACT` : preCommand;
}

function isDangerousEnemy(enemy) {
    return (enemy.length - snake.length > 1 && !snake.furious) ||
        (enemy.isFurious && !snake.furious) ||
        (snake.length - enemy.length > 1 && enemy.isFurious && snake.furious)

}

function isKillerAround(emenies) {
    let surroundPoints = getSurroundPoints(snake.head);

    return emenies.some(enemy => {
        return surroundPoints.some(sp => {
            let isAround = sp.x === enemy.head.x && sp.y === enemy.head.y;
            let isDangerous = isDangerousEnemy(enemy);
            return isAround && isDangerous;
        });
    });
}

function isHeadOnTheTail(board) {
    let tailPosition = getTailPosition(board);
    if (!tailPosition) {
        console.warn('tailPosition', tailPosition);
        return false;
    }
    let tailElement = getAt(board, tailPosition.x, tailPosition.y);

    switch (tailElement) {
        case ELEMENT.TAIL_END_DOWN:
            tailPosition.y += 1;
            break;
        case ELEMENT.TAIL_END_UP:
            tailPosition.y -= 1;
            break;
        case ELEMENT.TAIL_END_LEFT:
            tailPosition.x -= 1;
            break;
        case ELEMENT.TAIL_END_RIGHT:
            tailPosition.x += 1;
    }

    let nextToTail = getAt(board, tailPosition.x, tailPosition.y);
    return ~ELEMENT.ENEMY_PASSIVE_HEAD.indexOf(nextToTail);
}

function computeDirection(fromPoint, toPoint) {
    if (fromPoint.x === toPoint.x) {
        return fromPoint.y - toPoint.y > 0 ? 'UP' : 'DOWN'
    }
    return fromPoint.x - toPoint.x > 0 ? 'LEFT' : 'RIGHT'
}

function getBoardGrid(board, enemies) {

    let boardClone = board;
    enemies.forEach(enemy => {
        let enemyHeadSurround = getSurroundPoints(enemy.head);
        if (snake.length - enemy.length < 2 && snake.furious < 2) {
            enemyHeadSurround.forEach(point => {
                if (!~ELEMENT.ENEMY_ELEMENTS.indexOf(getAt(boardClone, point.x, point.y))) {
                    boardClone = setAt(boardClone, point, ELEMENT.WALL);
                }
            })
        }
        if (enemy.isFurious && snake.furious < 2) {
            enemyHeadSurround.forEach(point => {
                if (!~ELEMENT.ENEMY_ELEMENTS.indexOf(getAt(boardClone, point.x, point.y))) {
                    boardClone = setAt(boardClone, point, ELEMENT.WALL);
                }
            })
        }
    });

    /*console.log(getBoardAsString(boardClone));*/

    return new PF.Grid(getBoardAsArray(boardClone).map((line, x) => {
        return line.split('').map((char, y) => {
            return isPointAllowed(char) /*&& isPointAccessible(boardClone, { x, y })*/ ? 0 : 1;
        });
    }));
}

function getSnakeFurious(board) {
    if (~board.indexOf(ELEMENT.HEAD_EVIL) && snake.furious < 1) {
        return 9;
    } else if (~board.indexOf(ELEMENT.HEAD_EVIL)) {
        return snake.furious - 1;
    } else {
        return 0;
    }
}

function getSnakeFlying(board) {
    if (~board.indexOf(ELEMENT.HEAD_FLY) && snake.flying < 1) {
        return 9;
    } else if (~board.indexOf(ELEMENT.HEAD_FLY)) {
        return snake.flying - 1;
    } else {
        return 0;
    }
}

function getAllowedCells(board, enemies) {
    let extra_allowed = [];
    if ((snake.furious || snake.flying || snake.length > 4) && snake.mode === 'farm') {
        extra_allowed.push(ELEMENT.STONE);
    }

    if (snake.flying) {
        extra_allowed = [
            ...extra_allowed,
            ...ELEMENT.SNAKE_BODY,
            ...ELEMENT.ENEMY_ELEMENTS
        ]
    }

    if (snake.furious) {
        extra_allowed = [
            ...extra_allowed,
            ...ELEMENT.ENEMY_BODY,
            ELEMENT.STONE
        ]
    }

    if (enemies.some(enemy => snake.length - enemy.length > 1)) {
        /*TODO:May be no the best place to make it allowed*/
        extra_allowed = [
            ...extra_allowed,
            ...ELEMENT.ENEMY_PASSIVE_HEAD
        ]
    }

    if (snake.length > 2) {
        extra_allowed = [
            ...extra_allowed,
            ...ELEMENT.SNAKE_TAIL
        ]
    }

    return _.uniq([...ALLOWED_CELLS, ...extra_allowed]);
}

function getSearchItems(board, enemies) {
    let search_items = [...SEARCH_ITEMS];
    let surround = getSurround(board, snake.head);

    if (snake.mode === 'farm') {
        if (snake.furious) {
            search_items = [ELEMENT.STONE];
        }

        if (!snake.furious && snake.length > 4) {
            search_items.push(ELEMENT.STONE);
        }
    }

    if (snake.mode === 'pvp') {
        let totalEnemiesLength = enemies.reduce((acc, enemy) => acc + enemy.length, 0);
        if ((enemies.length === 1 && (snake.length - enemies[0].length) > 1)
            || snake.length - totalEnemiesLength > 1) {
            console.log('HUNT MODE!');
            console.log('snake length:', snake.length);
            console.log('total enemies length:', totalEnemiesLength);
            search_items = [...ELEMENT.ENEMY_PASSIVE_HEAD];

            //Search for surround apples, coins and fury pills
            let foundItemIndex = -1;
            let backCellIndex = COMMANDS.GET_INDEX[snake.prevCommand];
            let isSomeUsefulSurround = surround.some(item => {
                foundItemIndex = SEARCH_ITEMS.indexOf(item);
                return !!~foundItemIndex && (foundItemIndex !== backCellIndex);
            });

            if (isSomeUsefulSurround) {
                search_items.push(SEARCH_ITEMS[foundItemIndex]);
            }
        }
    }

    if (snake.furious /*&& surround.some(item => !!~FURY_TARGETS.indexOf(item))*/) {
        console.log('furious and fury targets around');
        search_items = [
            ...search_items,
            ...ELEMENT.STONE
        ];
        if (snake.furious > 1) {
            let nearbyEcho = getSurroundEcho(board, snake.head, snake.furious);
            console.log(nearbyEcho);
            if (nearbyEcho.some(point => ~FURY_TARGETS.indexOf(point))) {
                console.log('FURY ATTACK!');
                search_items = [
                    ...FURY_TARGETS
                ]
            }
        }

    }

    return _.uniq(search_items);
}

function getItems(board, enemies) {
    let itemPositions = [];

    let offset = -1;
    while ((offset = findNextItem(board, offset)) >= 0) {
        let position = getXYByPosition(board, offset);
        if (isPointAccessible(board, position)) {
            itemPositions.push(position);
        }
    }

    enemies.forEach(enemy => {
        if (snake.length - enemy.length > 1) {
            itemPositions.push(enemy.head);
        }
    });

    return itemPositions;
}

function findNextItem(board, offset) {
    return findNextElements(board, offset, snake.search_items);
}

function isPointAccessible(board, position) {
    let point = getAt(board, position.x, position.y);
    let allowed_cells = snake.allowed_cells.slice();
    if (point === ELEMENT.STONE && snake.furious < 2 && snake.length < 5) {
        allowed_cells = allowed_cells.filter(item => item !== ELEMENT.STONE);
    }
    let surroundBlockers = getSurroundPoints(position)
        .filter(point => {
            return !allowed_cells.includes(getAt(board, point.x, point.y))
        })
        .filter(point => ELEMENT.WALL === getAt(board, point.x, point.y));

    //TODO: avoid tunnels of walls only, need to check on tunnels from walls and stones
    return !surroundBlockers
        .some(block =>
            surroundBlockers.some(ob => ob.x === block.x && ob.y !== block.y) ||
            surroundBlockers.some(ob => ob.y === block.y && ob.x !== block.x));
}

function pointAccessibleCount(board, position) {
    return getSurroundPoints(position)
        .filter(point => {
            return isPointAllowed(getAt(board, point.x, point.y));
        }).length
}

function isPointAllowed(pointCharCode) {
    return snake.allowed_cells.includes(pointCharCode);
}

function findSafe(board, head, endPoint, nextCommand) {

    /*LEFT,UP,RIGHT,DOWN*/
    let surround = getSurround(board, head);
    let surroundPoints = getSurroundPoints(head);
    let currentCommandIndex = COMMANDS.GET_INDEX[nextCommand];

    if (isPointAllowed(surround[currentCommandIndex])
        && isPointAccessible(board, surroundPoints[currentCommandIndex])) {
        return nextCommand;
    } else {
        return findNearestSafePoint(board, head, nextCommand, endPoint);
    }
}

function findNearestPoint(board, startPoint, points, enemies) {
    if (!startPoint) {
        return { x: null, y: null }
    }

    let paths = points.map(point => {
        return finder.findPath(startPoint.x, startPoint.y, point.x, point.y, GRID.clone());
    });

    let distancesPoints = points
        .map(endPoint => findPathDeltas(startPoint, endPoint));

    let distances = distancesPoints
        .map((item, index) => {
            item.xDirection = item.dx >= 0 ? 'LEFT' : 'RIGHT';
            item.yDirection = item.dy >= 0 ? 'UP' : 'DOWN';
            return paths[index].length || Number.MAX_SAFE_INTEGER;
        });

    let minDistance = Math.min(...distances);
    let pointIndex = distances.indexOf(minDistance);

    let nearestPoint = points[pointIndex];
    let nearestDistancesPoint = distancesPoints[pointIndex];
    let foundPath = paths[pointIndex] || [];
    let nextStep = foundPath[1] || [];

    if (!nextStep.length) {
        console.log('no next step:', nextStep);
        console.log(getBoardAsString(board));
        console.log('paths:', paths);
    }

    let nextPoint = {
        x: nextStep[0],
        y: nextStep[1]
    };
    return {
        /* nearestPoint, nearestDistancesPoint,*/ nextPoint
    }
}

function findPathDeltas(startPoint, endPoint) {
    return {
        dx: startPoint.x - endPoint.x, dy: startPoint.y - endPoint.y
    };
}

function isSafePath(board, path) {
    return !path.some(point => !snake.allowed_cells.includes(getAt(board, point.x, point.y)));
}

function reverse(board, head, isVertical) {
    if (isVertical && snake.allowed_cells.includes(getAt(board, head.x + 1, head.y))) {
        return 'LEFT';
    } else if (isVertical) {
        return 'RIGHT'
    } else if (snake.allowed_cells.includes(getAt(board, head.x, head.y + 1))) {
        return 'DOWN';
    } else {
        return 'UP'
    }
}

function isCommandOppositeToPrevious(preCommand) {
    return COMMANDS.OPPOSITE[preCommand] === snake.prevCommand;
}

function moveToPoint(board, head, point, distancePoint) {

    /*TODO: Make sense to count  all blockers*/
    /*TODO: IS path safe working only for one step, does it make sense to cache or move this logic to steps count*/
    let { isYSafe, isXSafe } = isSafeVHPath(board, head, distancePoint);
    return isYSafe && distancePoint.dy ? distancePoint.yDirection : distancePoint.xDirection;
}

function isSafeVHPath(board, headOrigin, distancePoint) {
    let head = { ...headOrigin };
    let yPath = [];
    for (let i = 0; i < Math.abs(distancePoint.dy); i++) {
        yPath.push({
            x: head.x,
            y: distancePoint.dy > 0 ? head.y -= 1 : head.y += 1
        })
    }
    let last = yPath.slice().pop();

    let lastY = last ? last.y : head.y;
    let xPath = [];
    for (let i = 0; i < Math.abs(distancePoint.dx); i++) {
        xPath.push({
            x: distancePoint.dx > 0 ? head.x -= 1 : head.x += 1,
            y: lastY
        })
    }

    /*TODO: Make sense to count  all blockers*/
    /*TODO: IS path safe working only for one step, does it make sense to cache or move this logic to steps count*/

    let isYSafe = isSafePath(board, yPath);
    let isXSafe = isSafePath(board, xPath);
    return {
        isYSafe,
        isXSafe
    }
}

function rateElement(element) {
    switch (element) {
        case ELEMENT.GOLD:
        case ELEMENT.APPLE:
            return 10;
        case ELEMENT.FURY_PILL:
        case ELEMENT.FLYING_PILL:
            return 9;
        case ELEMENT.NONE:
            return 8;
        case ELEMENT.STONE:
            return snake.length > 4 ? 7 : 5;
        case ELEMENT.TAIL_END_DOWN:
        case ELEMENT.TAIL_END_LEFT:
        case ELEMENT.TAIL_END_UP:
        case ELEMENT.TAIL_END_RIGHT:
        case ELEMENT.TAIL_INACTIVE:
        case ELEMENT.BODY_HORIZONTAL:
        case ELEMENT.BODY_VERTICAL:
        case ELEMENT.BODY_LEFT_DOWN:
        case ELEMENT.BODY_LEFT_UP:
        case ELEMENT.BODY_RIGHT_DOWN:
        case ELEMENT.BODY_RIGHT_UP:
            return 6;
        case ELEMENT.START_FLOOR:
        case ELEMENT.WALL:
            return 4;
        default:
            return -1
    }
}

function findNearestSafePoint(board, head, currentCommand, endPoint) {
    let skippedIndex = COMMANDS.GET_INDEX[currentCommand];
    let surround = getSurroundPoints(head);
    let surroundCandidates = [...surround];

    surroundCandidates.splice(skippedIndex, 1);
    surroundCandidates = surroundCandidates
        .filter(point =>
            isPointAccessible(board, point) && isPointAllowed(getAt(board, point.x, point.y)))
        .sort((a, b) => pointAccessibleCount(board, a) - pointAccessibleCount(board, b));

    if (!surroundCandidates.length) {
        console.log('NO SURROUND CANDIDATES, endpoint:', endPoint);
        console.log('NO SURROUND CANDIDATES, surroundCandidates:', surroundCandidates);

        return getCommandByRatings(board);
    }

    let candidate = surroundCandidates[0];

    if (surroundCandidates[0] === surroundCandidates[1]) {
        candidate = findNearestPoint(board, endPoint, [surroundCandidates[0], surroundCandidates[1]]);
    }

    let index = findByXY(candidate, surround);
    return COMMANDS.BY_INDEX[index];

}

function findByXY(point, pointsList = []) {
    return pointsList.findIndex(p => p.x === point.x && p.y === point.y)
}

function getCommandByRatings(board) {
    let surround = getSurround(board, snake.head);
    let ratings = surround.map(rateElement);
    let previous = COMMANDS.GET_INDEX[COMMANDS.OPPOSITE[snake.prevCommand]];

    console.log('surround:', surround);
    console.log('ratings:', ratings);

    let maxRatingIndex = ratings.findIndex(item => !ratings.some((rating, index) => rating > item && index !== previous));
    console.log('previous:', previous);
    console.log('maxRatingIndex:', maxRatingIndex);
    if (maxRatingIndex === -1) {
        return 'ACT(0)';
    }
    return COMMANDS.BY_INDEX[maxRatingIndex];
}
