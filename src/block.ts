import {Point, PointColor, Move} from './point'
import {Board, Table} from './board'

function create<T>(ctor: {new(...args: any[]): T}, args: any) {
    return new ctor(...args);
}

// from <= retval < to
function rand(from: number, to: number) {
    return Math.floor(Math.random() * (to - from)) + from
}
const moveLeftFn  =  (dx: number) => ((p: Point) => ({x: p.x-dx, y: p.y} as Point))
const moveRightFn =  (dx: number) => ((p: Point) => ({x: p.x+dx, y: p.y} as Point))
const moveLeft    = moveLeftFn(1)
const moveRight   = moveRightFn(1)
const moveDown    =  (p: Point) => ({x: p.x,   y: p.y+1} as Point)
const moveNone    =  (p: Point) => p

interface Box {
    point: Point,
    height: number,
    width: number,
}

export enum MoveBlock {
    Rotate = 1,
    Down   = 2,
    Left   = 3,
    Right  = 4,
}

export namespace MoveBlock {
    export function toMove(cmd: MoveBlock): Move {
        switch(cmd) {
            case MoveBlock.Down:
                return moveDown
            case MoveBlock.Right:
                return moveRight
            case MoveBlock.Left:
                return moveLeft
            case MoveBlock.Rotate:
                return moveNone
        }
    }
    export function fromString(str: string): MoveBlock | void {
        switch(str) {
            case 'd':
            case 'down':
            case "ArrowDown":
                return MoveBlock.Down
            case 'r':
            case 'right':
            case "ArrowRight":
                return MoveBlock.Right
            case 'l':
            case 'left':
            case "ArrowLeft":
                return MoveBlock.Left
            case 'u':
            case 'up':
            case "ArrowUp":
                return MoveBlock.Rotate
            default:
                return
        }
    }
}

export abstract class Block extends Board {
    public readonly point: Point
    protected readonly color: PointColor
    constructor(table: Table, point: Point, color: PointColor) {
        super(table)
        this.point = point
        this.color = color
    }
    *iterator() {
        for(const {point: {y: y, x: x}, value: value} of super.iterator()) {
            yield {point: {y: this.point.y + y, x: this.point.x + x}, value: value}
        }
    }
    clone(): Block {
        return this.constructor(this.tableClone(), {...this.point})
    }
    movePoint(fn: (fn: Point) => Point): Block {
        return this.constructor(this.table, fn(this.point))
    }
    get box(): Box {
        let x: number = -1
        let y: number = -1
        let height: number = 0
        let width: number = 0
        const len = this.table.length
        for (let i = 0; i < len; i++) {
            for (let j = 0; j < len; j++) {
                if (this.table[i][j].notEmpty()) {
                    height = i > height ? i : height
                    width  = j > width  ? j : width
                    if (x < 0 || x > j) { x = j }
                    if (y < 0 || y > i) { y = i }
                }
            }
        }
        return {point: {x: x, y: y}, width: width - x + 1, height: height - y + 1}
    }
    info() {
        const box = this.box
        console.log(`${box.width}, ${box.point.x}, ${box.point.x}`)
        console.log(`from: ${2 - box.point.x}, to: ${11 - (this.baseLength - (box.width + box.point.x))}`)
        console.log(`${this.text}`)
        console.log(`x: ${this.point.x}, y: ${this.point.y}`)
        console.log(`~~~~~~~`)
    }
    adjustPoint(boardWidth: number = 14, boardHeight: number = 24): Block {
        this.info()
        const box = this.box
        this.point.x = rand(2 - box.point.x, (12 - this.baseLength) + box.point.x)
        this.point.y = 2 - this.box.point.y
        return this
    }
    static generate(xRange: number = 8, yRange: number = 22): () => Block {
        function randBlocks(): Block {
            const block = Blocks[Math.floor(Math.random() * Blocks.length)]
            let args = [Board.toTable(block.text), {x: 2, y:0}, block.color] as any[]
            return create(block.ctor, args)
        }
        return () => {
            const block = randBlocks()
            return block.adjustPoint()
        }
    }
    abstract rotate(): Block
    abstract rotateOn(board: Board): Block | void
    abstract get baseLength(): number
}

class Block3x3 extends Block {
    private readonly rotationMatrix =
        [{from: [0, 0], to: [0, 2]},
         {from: [2, 0], to: [0, 0]},
         {from: [2, 2], to: [2, 0]},
         {from: [0, 2], to: [2, 2]},
         {from: [0, 1], to: [1, 2]},
         {from: [1, 0], to: [0, 1]},
         {from: [2, 1], to: [1, 0]},
         {from: [1, 2], to: [2, 1]}]
    get baseLength(): number {
        return 3
    }
    get center(): Point {
        return ({x: this.point.x + 1, y: this.point.y + 1} as Point)
    }
    rotate(): Block3x3 {
        let table = this.tableClone()
        for (const {from: [x, y], to: [newX, newY]} of this.rotationMatrix) {
            table[newX][newY] = this.table[x][y]
        }
        return new Block3x3(table, {...this.point}, this.color)
    }
    rotateOn(board: Board): Block | void {
        let block = this.rotate()
        let p = board.unPuttablePoints(block)
        if (p.length === 0) { return block }
        const v = p[0].x - block.center.x
        switch(v) {
            case 0: {
                return
            }
            case 1: {
                if (board.canMove(block, moveLeft)) {
                    return block.movePoint(moveLeft)
                }
                break
            }
            case -1: {
                if (board.canMove(block, moveRight)) {
                    return block.movePoint(moveRight)
                }
                break
            }
            default: {
                throw new Error('I think it wont fall on this branch')
            }
        }
    }
}

class Block2x2 extends Block {
    rotate(): Block {
        return this.clone()
    }
    rotateOn(board: Board): Block | void {
        return this.clone()
    }
    get baseLength(): number {
        return 2
    }
}

class Block4x4 extends Block {
    private readonly rotationMatrix = [
        {from: {y: 0, x:1}, to: {y: 2, x: 3}},
        {from: {y: 1, x:1}, to: {y: 2, x: 2}},
        {from: {y: 3, x:1}, to: {y: 2, x: 0}},
    ]
    get baseLength(): number {
        return 4
    }
    get isHorizonal(): boolean {
        return this.table[2][3].isUnbounded()
    }
    get isVertical(): boolean {
        return this.table[0][1].isUnbounded()
    }
    rotate(): Block4x4 {
        let table = this.tableClone()
        for (const {from: {y: y, x:x}, to: {y: newY, x: newX}} of this.rotationMatrix) {
            [table[y][x], table[newY][newX]] = [table[newY][newX], table[y][x]]
        }
        return new Block4x4(table, {...this.point}, this.color)
    }
    rotateOn(board: Board): Block | void {
        let block = this.rotate()
        let ps = board.unPuttablePoints(block)
        if (ps.length === 0) { return block }
        if (block.isVertical) { return }
        let p = ps.pop() as Point
        switch (p.x - this.point.x) {
            case 0: {
                if (board.canMove(block, moveRight)) {
                    return block.movePoint(moveRight)
                }
                break
            }
            case 2: {
                if (board.canMove(block, moveLeft)) {
                    return block.movePoint(moveLeft)
                }
                break
            }
            case 3: {
                if (ps.length == 1 && board.canMove(block, moveLeftFn(2))) {
                    return block.movePoint(moveLeftFn(2))
                }
                if (ps.length == 0 && board.canMove(block, moveLeft)) {
                    return block.movePoint(moveLeft)
                }
                break
            }
            default: {
                console.log(`${p.x}, ${p.y}`)
                throw new Error('I think it wont fall on this branch')
            }
        }
    }
}

const Blocks = [
    {ctor: Block3x3, text: ".1.\n1X1\n...", color: PointColor.Purple},   // T
    {ctor: Block3x3, text: "...\n1X.\n.11", color: PointColor.Red},      // Z
    {ctor: Block3x3, text: "...\n.X1\n11.", color: PointColor.Green},    // Z_t
    {ctor: Block3x3, text: ".1.\n.X.\n.11", color: PointColor.Orange},   // L
    {ctor: Block3x3, text: ".1.\n.X.\n11.", color: PointColor.Blue},     // L_t
    {ctor: Block2x2, text: "11\n11",        color: PointColor.Yellow},   // O
    {ctor: Block4x4, text: "....\n....\n1X11\n....", color: PointColor.LightBlue}, // I
]