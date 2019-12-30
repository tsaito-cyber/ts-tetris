
enum PointState {
    FixedBlock = '0',
    Empty = '.',
    UnboundedBlock = '1',
    CentralUnboundedBlock = 'X'
}

enum BoardState {
    Moving,
    Creating,
    Stopping,
    Eliminating,
    Ending,
}

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
**************
**************
`.trim()

type Table = Array<Array<PointState>>

function* blockGen() {
    function randBlocks(): BoardLayer {
        return BoardLayer.fromStringAndPoint(BlockStrings[Math.floor(Math.random() * BlockStrings.length)], genPoint())
    }
    while(true) {
        yield randBlocks()
    }
}

function genPoint(midX: number = 5, midY: number = 15): Point {
    return {x: Math.floor(Math.random() * midX) + 1, y: Math.floor(Math.random() * midY)} as Point
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
    merge(other: BoardLayer, pointState?: PointState): Board {
        if (!this.isPuttable(other)) { return this }
        let point = other.point
        for (const {y: y, x: x, value: value} of other.iterator()) {
            if (this.table.length > y && this.table[y].length > x) {
                this.table[y][x] = (pointState && (value !== PointState.Empty)) ? pointState : value
            } else { this.table[y][x] = value }
        }
        return this
    }
    canMoveBottom(other: BoardLayer): boolean {
        return true
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
    constructor(table: Table, point: Point) {
        super(table)
        this.point = point
    }
    *iterator() {
        for(const {x: x, y: y, value: value} of super.iterator()) {
            yield {y: this.point.y + y, x: this.point.x + x, value: value}
        }
    }
    static fromStringAndPoint(str: string, point: Point): BoardLayer {
        return new BoardLayer(strToTable(str), point)
    }
}

let board = Board.fromString(boardRaw)
let gen = blockGen();
for (let i = 0; i < 2; i++) {
    let b = gen.next().value as BoardLayer
    if (!board.isPuttable(b)) { continue }
    board.merge(b, PointState.FixedBlock)
    console.log(b.boardText)
    console.log("~~")
    console.log(board.boardText)
    console.log("~~~~~~")
    console.log("")
}

