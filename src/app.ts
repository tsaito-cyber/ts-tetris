
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
        for (const {y: y, x: x, value: value} of other.iterator()) {
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
                yield {y: y, x: x, value: value}
            }
        }
    }
    merge(other: BoardLayer, pointState: PointState): Board {
        if (!this.isPuttable(other)) { return this }
        const point = other.point
        for (const {y: y, x: x, value: value} of other.iterator()) {
            if (this.table.length > y && this.table[y].length > x && value !== PointState.Empty) {
                this.table[y][x] = pointState
            }
        }
        return this
    }
    canMoveBottom(other: BoardLayer): boolean {
        if (!this.isPuttable(other)) { return false }
        return Array.from(other.iterator())
            .every(({y: y, x: x, value: value}) =>
                   value === PointState.Empty || (this.table[y+1][x] === PointState.Empty))
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
            items[i] = [i, i - count] // maybe negative
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
        for(const {x: x, y: y, value: value} of super.iterator()) {
            yield {y: this.point.y + y, x: this.point.x + x, value: value}
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
    private cloneTable(): Table {
        return this.table.map(row => Array.from(row))
    }
    static fromStringAndPoint(str: string, point: Point): BoardLayer {
        return new BoardLayer(strToTable(str), point)
    }
}

// FIX
enum GameState {
    Moving,
    Creating,
    Stopping,
    Eliminating,
    Ending,
}

enum Command {
    Rotate,
    Bottom,
    Left,
    Right,
}

class Game {
    private state: GameState
    private board: Board
    constructor() {
        this.board = Board.fromString(boardRaw)
        this.state = GameState.Creating
    }
    next(command?: Command) {
        switch (this.state) {
            case GameState.Moving:
            case GameState.Stopping:
            case GameState.Eliminating:
            case GameState.Ending:
            case GameState.Creating:
        }
    }
}

const board = Board.fromString(boardRaw)
const gen = blockGen();
for (let i = 0; i < 10000; i++) {
    const b = gen.next().value as BoardLayer
    if (!board.isPuttable(b)) { continue }
    console.log(`move ok: ${board.canMoveBottom(b)}`)
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

