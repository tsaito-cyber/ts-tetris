
enum PointState {
    FixedBlock = '0',
    Empty = '.',
    UnboundedBlock = '1',
    CentralUnboundedBlock = 'X'
}

const NumberOfColumn = 10

const boardRaw = `
**..........**
**..........**
**..........**
**..........**
**..........**
**..........**
**..........**
**..........**
**..........**
**..........**
**..........**
**..........**
**..........**
**..........**
**..........**
**..........**
**..........**
**..........**
**..........**
**..........**
**..........**
**..........**
**..........**
**..........**
**************
**************
`.trim()

type Table = Array<Array<PointState>>

function* blockGen(xRange: number = 10, yRange: number = 22) {
    function randBlocks(): BoardLayer {
        return BoardLayer.fromStringAndPoint(BlockStrings[Math.floor(Math.random() * BlockStrings.length)], genPoint(xRange, yRange))
    }
    while(true) {
        const block = randBlocks()
        for(let i = 0; i < Math.floor(Math.random() * 4); i++) { block.rotate3x3() }
        yield block
    }
}

function genPoint(xRange: number = 10, yRange: number = 22): Point {
    return {x: Math.floor(Math.random() * xRange) + 2, y: Math.floor(Math.random() * yRange)} as Point
}

const BlockStrings = [
    "...\n.X.\n111", // T
    "...\n1X.\n.11", // Z
    "...\n.X1\n11.", // Z_t
    ".1.\n.X.\n.11", // L
    ".1.\n.X.\n11.", // L_t
]

function strToTable(str: string): Table {
    return str.split("\n").map(row => [...row].map(char => char as PointState))
}

class Board {
    public readonly table: Table
    constructor(table: Table) {
        this.table = table
    }
    get boardText(): string {
        return this.table.map(row => row.map(r => r as string).join('')).join("\n")
    }
    isPuttable(other: BoardLayer): boolean {
        for (const {point: {y: y, x: x}, value: value} of other.iterator()) {
            if (y >= this.table.length) { return false }
            if (x >= this.table[y].length) { return false }
            if (value === PointState.Empty || this.table[y][x] === PointState.Empty) { continue }
            return false
        }
        return true
    }
    *iterator() {
        for (const [y, row] of this.table.entries()) {
            for (const [x, value] of row.entries()) {
                yield {point: {y: y, x: x}, value: value}
            }
        }
    }
    merge(other: BoardLayer, pointState: PointState): Board {
        if (!this.isPuttable(other)) { return this }
        const point = other.point
        for (const {point: {y: y, x: x}, value: value} of other.iterator()) {
            if (this.table.length > y && this.table[y].length > x && value !== PointState.Empty) {
                this.table[y][x] = pointState
            }
        }
        return this
    }
    canMove(other: BoardLayer, fn: (fn: Point) => Point): boolean {
        if (!this.isPuttable(other)) { return false }
        return Array.from(other.iterator())
            .every(({point: point, value: value}) => {
                const p = fn(point as Point)
                return value === PointState.Empty || (this.table[p.y][p.x] === PointState.Empty)
            })
    }
    getEliminatingRows(): Array<number> {
        return Array.from(this.table.entries()).map(([i, row]) => {
            return row.slice(2, NumberOfColumn + 2).every(r => r === PointState.FixedBlock) ? i : null
        }) as Array<number>
    }
    hasEliminatingRows(): boolean {
        return this.getEliminatingRows().filter(v => v).length > 0
    }
    eliminatingRows() {
        const rs = this.getEliminatingRows()
        let items = []
        let count = 0
        for(let i = rs.length - 1; i >= 0; i--) {
            for(var k = count; (i-k) >= 0 && (rs[i-k] != null); k++) {}
            count = k
            items[i] = [i, i - count] // may be negative
        }
        items.reverse()
        for (const [k, r] of items) {
            if (r >= 0) {
                this.table[k] = this.table[r]
            } else {
                this.table[k] = '**..........**'.split('').map(char => char as PointState) // SIZE
            }
        }
    }
    static fromString(str: string): Board {
        return new this(strToTable(str))
    }
}

interface Point {
    x: number
    y: number
}
type Move = (p: Point) => Point
const moveLeft   =  (p: Point) => ({x: p.x-1, y: p.y}   as Point)
const moveRight  =  (p: Point) => ({x: p.x+1, y: p.y}   as Point)
const moveBottom =  (p: Point) => ({x: p.x,   y: p.y+1} as Point)
const moveNone   =  (p: Point) => p

class BoardLayer extends Board {
    public readonly point: Point
    private readonly rotationMatrix =
        [{from: [0, 0], to: [0, 2]},
         {from: [2, 0], to: [0, 0]},
         {from: [2, 2], to: [2, 0]},
         {from: [0, 2], to: [2, 2]}, // [2, 2]
         {from: [0, 1], to: [1, 2]},
         {from: [1, 0], to: [0, 1]},
         {from: [2, 1], to: [1, 0]},
         {from: [1, 2], to: [2, 1]}] // [2, 1]

    constructor(table: Table, point: Point) {
        super(table)
        this.point = point
    }
    *iterator() {
        for(const {point: {y: y, x: x}, value: value} of super.iterator()) {
            yield {point: {y: this.point.y + y, x: this.point.x + x}, value: value}
        }
    }
    rotate3x3() {
        const a = this.table[0][2]
        const b = this.table[1][2]
        for (const {from: [x, y], to: [newX, newY]} of this.rotationMatrix) {
            this.table[newX][newY] = this.table[x][y]
        }
        this.table[2][2] = a
        this.table[2][1] = b
    }
    movePoint(fn: (fn: Point) => Point): BoardLayer {
        return new BoardLayer(this.table, fn(this.point))
    }
    static fromStringAndPoint(str: string, point: Point): BoardLayer {
        return new BoardLayer(strToTable(str), point)
    }
}

// FIX
enum GameState {
    Moving,
    Creating,
    BlockStopping,
    Eliminating,
    Ending,
}

enum BlockCommand {
    Rotate,
    Bottom,
    Left,
    Right,
}

namespace BlockCommand {
    export function toMove(cmd: BlockCommand): Move {
        switch(cmd) {
            case BlockCommand.Bottom:
                return moveBottom
            case BlockCommand.Right:
                return moveRight
            case BlockCommand.Left:
                return moveLeft
            case BlockCommand.Rotate:
                return moveNone
        }
    }
}

class Game {
    private state: GameState
    private board: Board
    private block: BoardLayer
    constructor(block: BoardLayer) {
        this.board = Board.fromString(boardRaw)
        this.state = GameState.Creating
        this.block = block
    }
    next(cmd?: BlockCommand) {
        switch (this.state) {
            case GameState.Moving: {
                this.moveBlock(cmd || BlockCommand.Bottom)
                break
            }
            case GameState.BlockStopping: {
                break
            }
            case GameState.Eliminating: {
                break
            }
            case GameState.Ending: {
                break
            }
            case GameState.Creating: {
                break
            }
        }
    }
    moveBlock(cmd: BlockCommand) {
        const move = BlockCommand.toMove(cmd)
        if (cmd === BlockCommand.Rotate) {
            return
        }
        if (this.board.canMove(this.block, move)) {
            this.block = this.block.movePoint(move)
        }
    }
}

const board = Board.fromString(boardRaw)
const gen = blockGen();
for (let i = 0; i < 10000; i++) {
    const b = gen.next().value as BoardLayer
    if (!board.isPuttable(b)) { continue }
    console.log(`move ok: ${board.canMove(b, moveBottom)}`)
    board.merge(b, PointState.FixedBlock)
    console.log(`[${i}] ~~~~~`)
    console.log(b.boardText)
    console.log(`(x: ${b.point.x}, y: ${b.point.y})`)
    console.log(`rows: ${board.getEliminatingRows()}`)
    console.log(`~~~~~~~~~`)
    console.log(board.boardText)
    console.log("")
}
console.log(board.eliminatingRows())
console.log(board.boardText)

