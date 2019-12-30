
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
interface Point {
    x: number
    y: number
} 

function* blockGen() {
    function randBlocks(): Board {
        return Blocks[Math.floor(Math.random() * Blocks.length)]
    }
    while(true) {
        yield randBlocks()
    }
}

class Board {
    public readonly table: Table
    constructor(table: Table) {
        this.table = table
    }
    get boardText(): string {
        return this.table.map(row => row.map(r => r as string).join('')).join("\n")
    }
    isPuttable(point: Point, other: Board): boolean {
        let iter = other.iterator()
        let result = iter.next()
        while(true) {
            const {done: done, value: result} = iter.next()
            if (done) { break }
            const [y, x, value] = result
            const newY = y as number + point.y
            const newX = x as number + point.x
            if (newY >= this.table.length) { return false }
            if (newX >= this.table[newY].length) { return false }
            if (value === PointState.Empty || this.table[newY][newX] === PointState.Empty) { continue }
            return false
        }
        return true
    }
    *iterator() {
        for (const [y, row] of this.table.entries()) {
            for (const [x, value] of row.entries()) {
                yield [y, x, value]
            }
        }
    }
    merge(point: Point, other: Board, pointState?: PointState): Board {
        if (!this.isPuttable(point, other)) { return this }
        for (const [y, row] of this.table.entries()) {
            for (const [x, value] of row.entries()) {
                if (point.x <= x && point.y <= y &&
                    other.table.length > (y - point.y) &&
                    other.table[y - point.y].length > (x - point.x)) {
                    let s =  other.table[y - point.y][x - point.x]
                    this.table[y][x] = (pointState && (s !== PointState.Empty)) ? pointState : s
                } else { this.table[y][x] = value }
            }
        }
        return this
    }    
    static fromString(str: string): Board {
        return new Board(str.split("\n").map(row => [...row].map(char => char as PointState)))
    }
}

const Blocks = [
    "...\n.X.\n111", // T
    "...\n1X.\n.11", // Z
    "...\n.X1\n11.", // Z_t
    ".1.\n.X.\n.11", // L
    ".1.\n.X.\n11.", // L_t
].map(Board.fromString)

let board = Board.fromString(boardRaw)
let gen = blockGen();
for (let i = 0; i < 2; i++) {
    let b = gen.next().value as Board
    let point = {x: Math.floor(Math.random() * 6) + 1, y: Math.floor(Math.random() * 15)}
    if (!board.isPuttable(point, b)) { continue }
    board = board.merge(point, b, PointState.FixedBlock)
    
    console.log(b.boardText)
    console.log("~~")
    console.log(board.boardText)
    console.log("~~~~~~")
    console.log("")
}

