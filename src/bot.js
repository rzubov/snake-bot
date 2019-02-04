import { ELEMENT, COMMANDS, FURY_TARGETS } from './constants';
import {
    isGameOver,
    getHeadPosition,
    getElementByXY,
    getXYByPosition,
    getAt,
    getSnakeLength,
    getEnemies,
    findNextElements,
    getSurround,
    getSurroundPoints
} from './utils';

import * as _ from 'lodash';

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

let allowed = [
    ELEMENT.NONE,
    ELEMENT.GOLD,
    ELEMENT.APPLE,
    ELEMENT.FURY_PILL,
    ELEMENT.FLYING_PILL,
    ...ELEMENT.ENEMY_TAIL,
    ...ELEMENT.SNAKE_TAIL
];
let itemsToSearchOriginal = [
    ELEMENT.GOLD,
    ELEMENT.APPLE,
    ELEMENT.FURY_PILL
];

let itemsToSearch = [
    ELEMENT.GOLD,
    ELEMENT.APPLE,
    ELEMENT.FURY_PILL
];

let furyAllowed = allowed.concat(FURY_TARGETS);

let snake = {
    prevCommand: 'RIGHT',
    furious: 0,
    flying: 0,
    length: 0,
    stones: 0,
    head: null,
    allowed_cells: null,
    search_items: null,
    mode: 'farm'
};

function getNextCommand(board, head) {
    let enemies = getEnemies(board);

    snake.length = getSnakeLength(board);
    snake.head = head;
    snake.furious = getSnakeFurious(board);
    snake.flying = getSnakeFlying(board);
    snake.allowed_cells = getAllowedCells(board, enemies);
    snake.search_items = getSearchItems(board, enemies);

    let dropStone = snake.furious;

    if (snake.furious) {
        itemsToSearch = FURY_TARGETS;
        allowed = furyAllowed;
    } else if (snake.length > 4) {
        itemsToSearch = itemsToSearchOriginal;
        itemsToSearch.push(ELEMENT.STONE);

        allowed = allowed.filter(item => !~FURY_TARGETS.indexOf(item));
        allowed.push(ELEMENT.STONE)
    } else {
        allowed = allowed.filter(item => !~FURY_TARGETS.indexOf(item));
        itemsToSearch = itemsToSearchOriginal;
    }

    /*TODO: TEST aggressive mode*/
    console.log(snake.length, enemies.reduce((acc, enemy) => acc += enemy.length, 0));

    allowed = allowed.filter(item => !~ELEMENT.ENEMY_PASSIVE_HEAD.indexOf(item));
    allowed = allowed.filter(item => item !== ELEMENT.STONE);
    itemsToSearch = itemsToSearch.filter(item => item !== ELEMENT.STONE);

    if (enemies.length === 1) {
        allowed = allowed.filter(item => item !== ELEMENT.STONE);
        itemsToSearch = itemsToSearch.filter(item => item !== ELEMENT.STONE);
        if (snake.length - enemies[0].length > 1) {
            let surround = getSurround(board, head);
            /*TODO: Search apples and coins in surround*/
            itemsToSearch = ELEMENT.ENEMY_PASSIVE_HEAD;
            allowed = allowed.concat(ELEMENT.ENEMY_PASSIVE_HEAD)
        }
    }

    let itemPositions = [];

    let offset = -1;
    while ((offset = findNextItem(board, offset)) >= 0) {
        let position = getXYByPosition(board, offset);
        if (isPointAccessible(board, position)) {
            itemPositions.push(position);
        }
    }

    let potentialTargetsCount = 0;
    enemies.forEach(enemy => {
        if (snake.length - enemy.length > 1) {
            potentialTargetsCount++;
            itemPositions.push(enemy.head);
        }
    });

    console.log('targets:', potentialTargetsCount);

    if (potentialTargetsCount) {
        itemsToSearch = itemsToSearch.concat(ELEMENT.ENEMY_PASSIVE_HEAD);
        allowed = allowed.concat(ELEMENT.ENEMY_PASSIVE_HEAD);
    }

    console.log(allowed, snake.allowed_cells);

    let { nearestDistancesPoint, nearestPoint } = findNearestPoint(board, head, itemPositions);

    if (!nearestDistancesPoint) {
        console.log('NO NEAREST POINT!');
        let surround = getSurround(board, head);
        const ratings = surround.map(rateElement);
        return getCommandByRatings(ratings);
    }

    let preCommand = moveToPoint(board, head, nearestPoint, nearestDistancesPoint);
    if (isCommandOppositeToPrevious(preCommand)) {
        preCommand = turnSideways(board, head, nearestDistancesPoint.dy);
    }

    preCommand = snake.prevCommand = findSafe(board, head, nearestPoint, preCommand);

    return dropStone ? `${preCommand},ACT` : preCommand;
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
            ...ELEMENT.ENEMY_BODY
        ]
    }

    if (enemies.some(enemy => snake.length - enemy.length > 1)) {
        /*TODO:May be no the best place to make it allowed*/
        extra_allowed = [
            ...extra_allowed,
            ...ELEMENT.ENEMY_PASSIVE_HEAD
        ]
    }

    return _.uniq([...allowed, ...extra_allowed]);
}

function getSearchItems(board, enemies) {
    let search_items = [...itemsToSearchOriginal];
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
        /*if (enemies.some(enemy => snake.length - enemy.length > 1)) {
            search_items = [
                ...search_items,
                ...ELEMENT.ENEMY_PASSIVE_HEAD
            ]
        }*/

        if (enemies.length === 1 && snake.length - enemies[0].length > 1) {
            search_items = ELEMENT.ENEMY_PASSIVE_HEAD;
            let surroundForward = surround.splice(COMMANDS.GET_INDEX[snake.prevCommand], 1);

            //Search for surround apples, coins and fury pills
            let foundItemIndex = -1;
            if (surroundForward.some(item => {
                foundItemIndex = itemsToSearchOriginal.indexOf(item);
                return !!~foundItemIndex;
            })) {
                search_items.push(itemsToSearchOriginal[foundItemIndex]);
            }
        }
    }

    if (snake.furious && surround.some(item => !!~FURY_TARGETS.indexOf(item))) {
        search_items = FURY_TARGETS;
    }

    return _.unique(search_items);
}

function findNextItem(board, offset) {
    return findNextElements(board, offset, itemsToSearch);
}

function isPointAccessible(board, position) {
    let nextPoint = getAt(board, position.x, position.y);
    let allowedClone = allowed.slice();
    if (nextPoint === ELEMENT.STONE && snake.furious < 2 && getSnakeLength(board) < 8) {
        allowedClone = allowedClone.filter(item => item !== ELEMENT.STONE);
    }
    let surroundBlockers = getSurroundPoints(position)
        .filter(point => {
            return !allowedClone.includes(getAt(board, point.x, point.y))
        })
        .filter(ob => ELEMENT.WALL === getAt(board, ob.x, ob.y));
    return !surroundBlockers
        .some(block =>
            surroundBlockers.some(ob => ob.x === block.x && ob.y !== block.y) ||
            surroundBlockers.some(ob => ob.y === block.y && ob.x !== block.x));
}

function pointAccessibleCount(board, position) {
    return getSurroundPoints(position)
        .filter(point => {
            return allowed.includes(getAt(board, point.x, point.y))
        }).length
}

function isPointAllowed(pointCharCode) {
    return allowed.includes(pointCharCode);
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

function findNearestPoint(board, startPoint, points) {
    let distancesPoints = points
        .map(endPoint => findPathDeltas(startPoint, endPoint));

    let distances = distancesPoints.map(item => {
        let directionToPointX = item.xDirection = item.dx >= 0 ? 'LEFT' : 'RIGHT';
        let directionToPointY = item.yDirection = item.dy >= 0 ? 'UP' : 'DOWN';

        let additionalXSteps = COMMANDS.OPPOSITE[snake.prevCommand] === directionToPointX ? 2 : 0;
        let additionalYSteps = COMMANDS.OPPOSITE[snake.prevCommand] === directionToPointY ? 2 : 0;

        let { isYSafe, isXSafe } = isSafeVHPath(board, startPoint, item);

        if (!isYSafe) {
            additionalYSteps += 15;
        }

        if (!isXSafe) {
            additionalXSteps += 15;
        }

        if (!isYSafe && !isXSafe) {
            additionalXSteps += 55;
        }

        return Math.abs(item.dx) + Math.abs(item.dy) + additionalXSteps + additionalYSteps;
    });

    let minDistance = Math.min(...distances);
    let pointIndex = distances.indexOf(minDistance);

    let nearestPoint = points[pointIndex];
    let nearestDistancesPoint = distancesPoints[pointIndex];
    return {
        nearestPoint, nearestDistancesPoint
    }
}

function findPathDeltas(startPoint, endPoint) {
    return {
        dx: startPoint.x - endPoint.x, dy: startPoint.y - endPoint.y
    };
}

function isSafePath(board, path) {
    return !path.some(point => !allowed.includes(getAt(board, point.x, point.y)));
}

function findAllSafePaths(board, startPoint, endPoint) {
    let pointsDelta = findPathDeltas(startPoint, endPoint);

    let yPath = [];
    for (let i = 0; i < Math.abs(endPoint.dy); ++i) {
        for (let j = 0; j < Math.abs(endPoint.dy); ++j) {
            yPath.push({
                x: pointsDelta.dy > 0 ? startPoint.x -= i : startPoint.x += i,
                y: pointsDelta.dy > 0 ? startPoint.y -= j : startPoint.y += j
            })
        }
    }
    let last = yPath.slice().pop();

    let lastY = last ? last.y : startPoint.y;
    let xPath = [];
    for (let i = 0; i < Math.abs(endPoint.dx); i++) {
        xPath.push({
            x: endPoint.dx > 0 ? startPoint.x - 1 : startPoint.x + 1,
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

function turnSideways(board, head, isVertical) {
    if (isVertical && allowed.includes(getAt(board, head.x + 1, head.y))) {
        return 'LEFT';
    } else if (isVertical) {
        return 'RIGHT'
    } else if (allowed.includes(getAt(board, head.x, head.y + 1))) {
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
            return 5;
        case ELEMENT.FURY_PILL:
        case ELEMENT.FLYING_PILL:
            return 4;
        case ELEMENT.NONE:
            return 3;
        case ELEMENT.STONE:
            return 2;
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
            return 1;
        default:
            return -1
    }
}

function findNearestSafePoint(board, head, currentCommand, endPoint) {
    let skippedIndex = COMMANDS.GET_INDEX[currentCommand];
    let surround = getSurroundPoints(head);
    let surroundCandidates = surround.slice();

    surroundCandidates.splice(skippedIndex, 1);
    surroundCandidates = surroundCandidates
        .filter(point =>
            isPointAccessible(board, point) && isPointAllowed(getAt(board, point.x, point.y)))
        .sort((a, b) => pointAccessibleCount(board, a) - pointAccessibleCount(board, b));

    if (!surroundCandidates.length) {
        console.log('NOT SURROUND CANDIDATES, endpoint:', endPoint);
        console.log('NOT SURROUND CANDIDATES, surroundCandidates:', surroundCandidates);
        let surround = getSurround(board, head);
        const ratings = surround.map(rateElement);

        return getCommandByRatings(ratings);
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

function getCommandByRatings(ratings) {
    let indexToCommand = ['LEFT', 'UP', 'RIGHT', 'DOWN'];
    let maxIndex = 0;
    let max = -Infinity;
    for (let i = 0; i < ratings.length; i++) {
        let r = ratings[i];
        if (r > max) {
            maxIndex = i;
            max = r;
        }
    }

    return indexToCommand[maxIndex];
}
