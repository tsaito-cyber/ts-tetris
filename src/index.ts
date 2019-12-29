
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
..........
..........
..........
..........
..........
..........
..........
..........
..........
..........
..........
..........
..........
..........
..........
..........
..........
..........
..........
..........
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
    let items = []
    for (let i = 0; i < 3; i++) {
        items.push(randBlocks())
    }
    while(true) {
        yield items
        items.shift() // discard
        items.push(randBlocks())
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
    isPuttable = (point: Point, other: Board): boolean => {
        return true
    }
    merge = (other: Board, board: Board): Board | void => { // FIX me
        
    }
    clone = (): Board => {
        return new Board(this.table.map(block => Array.from(block)))
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
for (let i = 0; i < 3; i++) {
    let result = gen.next().value as Array<Board>
    console.log(result[0].boardText)
}

