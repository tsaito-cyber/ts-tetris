const readline = require('readline');
const out = process.stdout

enum PointState {
    FixedBlock = '0',
    Empty = '.',
    UnboundedBlock = '1',
    CentralUnboundedBlock = 'X'
}

function strToTable(str: string): Table {
    return str.split("\n").map(row => toPointStates(row))
}

function toPointStates(str: string): Array<PointState> {
    return [...str].map(char => char as PointState)
}

const NumberOfColumn = 10
const NumberOfRow = 10 // 24
const PointStateRow = toPointStates('**..........**')

const boardRaw = Array.from(new Array(NumberOfRow), () => [...PointStateRow]) as Table
for (let i = 0; i < 2; i++) { boardRaw.push(toPointStates('**************')) }

const BlockStrings = [
    ".1.\n1X1\n...", // T
    "...\n1X.\n.11", // Z
    "...\n.X1\n11.", // Z_t
    ".1.\n.X.\n.11", // L
    ".1.\n.X.\n11.", // L_t
]

type Table = Array<Array<PointState>>

function blockGen(xRange: number = 10, yRange: number = 22): () => Block {
    function randBlocks(): Block {
        const index = Math.floor(Math.random() * BlockStrings.length)
        const row = strToTable(BlockStrings[index])
        return new Block(row, genPoint(xRange, yRange))
    }
    return () => {
        let block = randBlocks()
        for(let i = 0; i < Math.floor(Math.random() * 4); i++) { block = block.rotate3x3() }
        return block
    }
}

function genPoint(xRange: number = 10, yRange: number = 22): Point {
    return {x: Math.floor(Math.random() * xRange) + 2, y: Math.floor(Math.random() * yRange)} as Point
}

class Board {
    public readonly table: Table
    constructor(table: Table) {
        this.table = table
    }
    get text(): string {
        return this.table.map(row => row.map(r => r as string).join('')).join("\n")
    }
    unPuttablePoint(other: Block): Point | void {
        for (const {point: {y: y, x: x}, value: value} of other.iterator()) {
            if (y >= this.table.length) { continue }
            if (x >= this.table[y].length) { continue }
            if (value === PointState.Empty || this.table[y][x] === PointState.Empty) { continue }
            return ({y: y, x: x} as Point)
        }
        return
    }
    isPuttable(other: Block): boolean {
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
    merge(other: Block, pointState?: PointState): Board {
        if (!this.isPuttable(other)) { return this }
        const point = other.point
        const table = this.tableClone()
        for (const {point: {y: y, x: x}, value: value} of other.iterator()) {
            if (table.length > y && table[y].length > x && value !== PointState.Empty) {
                table[y][x] = pointState || value
            }
        }
        return new Board(table)
    }
    canMove(other: Block, move: Move): boolean {
        if (!this.isPuttable(other)) { return false }
        return Array.from(other.iterator())
            .every(({point: point, value: value}) => {
                const p = move(point as Point)
                return value === PointState.Empty || (this.table[p.y][p.x] === PointState.Empty)
            })
    }
    getEliminatingRows(): Array<number> {
        return Array.from(this.table.entries()).map(([i, row]) => {
            return row.slice(2, NumberOfColumn + 2).every(r => r === PointState.FixedBlock) ? i : null
        }) as Array<number>
    }
    countEliminatingRows(): number {
        return this.getEliminatingRows().filter(v => v).length
    }
    tableClone(): Table {
        return this.table.map(row => [...row])
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
                this.table[k] = [...PointStateRow]
            }
        }
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

class Block extends Board {
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
    get center(): Point {
        return ({x: this.point.x + 1, y: this.point.y + 1} as Point) // FIX
    }
    *iterator() {
        for(const {point: {y: y, x: x}, value: value} of super.iterator()) {
            yield {point: {y: this.point.y + y, x: this.point.x + x}, value: value}
        }
    }
    rotate3x3(): Block {
        let table = this.tableClone()
        for (const {from: [x, y], to: [newX, newY]} of this.rotationMatrix) {
            table[newX][newY] = this.table[x][y]
        }
        return new Block(table, this.point)
    }
    movePoint(fn: (fn: Point) => Point): Block {
        return new Block(this.table, fn(this.point))
    }
}

enum GameState {
    Moving      = 1,
    Creating    = 2,
    Stopping    = 3,
    Eliminating = 4,
    Ending      = 5,
    Starting    = 6,
}

enum BlockCommand {
    Rotate = 1,
    Bottom = 2,
    Left   = 3,
    Right  = 4,
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
    export function fromString(str: string): BlockCommand | void {
        switch(str) {
            case 'b':
                return BlockCommand.Bottom
            case 'r':
                return BlockCommand.Right
            case 'l':
                return BlockCommand.Left
            case 't':
                return BlockCommand.Rotate
            default:
                return
        }
    }
}

class Tetris {
    private state: GameState
    private _board: Board
    private block: Block
    private score: number
    private blockGen: () => Block
    get board() {
        return this._board.merge(this.block)
    }
    constructor() {
        this._board = new Board(boardRaw)
        this.state = GameState.Creating
        this.score = 0
        this.blockGen = blockGen(10, 0)
        this.block = this.blockGen()
    }
    next(cmd?: BlockCommand) {
        console.log(`cmd: ${cmd}`)
        switch (this.state) {
            case GameState.Moving: {
                this.moveBlock(cmd || BlockCommand.Bottom)
                break
            }
            case GameState.Stopping: {
                const score = this._board.countEliminatingRows()
                if (score > 0) {
                    this.state = GameState.Eliminating
                    this.score += score
                } else {
                    this.state = GameState.Creating
                }
                this.next()
                break
            }
            case GameState.Eliminating: {
                this._board.eliminatingRows()
                this.state = GameState.Creating
                this.next()
                break
            }
            case GameState.Ending: {
                console.log("Game Over")
                break
            }
            case GameState.Creating: {
                this.block = this.blockGen()
                this.state = this._board.isPuttable(this.block) ? GameState.Moving : GameState.Ending
                break
            }
        }
    }
    moveBlock(cmd: BlockCommand) {
        const move = BlockCommand.toMove(cmd)
        if (cmd === BlockCommand.Rotate) {
            this.rotateBlock()
            return
        }
        if (this._board.canMove(this.block, move)) {
            this.block = this.block.movePoint(move)
        } else if (cmd === BlockCommand.Bottom) {
            this._board = this._board.merge(this.block, PointState.FixedBlock)
            this.state = GameState.Stopping
        }
    }
    rotateBlock() {
        let block = this.block.rotate3x3()
        let p = this._board.unPuttablePoint(block)
        console.log(p)
        if (!p) {
            this.block = block
            return
        }
        console.log(p)
        const v = block.center.x - p.x
        switch(v) {
            case 0:
                return
            case 1:
                if (this._board.canMove(block, moveLeft)) {
                    this.block = this.block.movePoint(moveLeft)
                }
            case -1:
                if (this._board.canMove(block, moveRight)) {
                    this.block = this.block.movePoint(moveRight)
                }
            default:
                throw new Error('I seem not to be falling into this line...')
        }
    }
}

class CommandLine {
    private tetris: Tetris
    private rl: any
    constructor() {
        this.tetris = new Tetris()
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        })
    }
    run() {
        console.log(this.tetris.board.text)
        out.write(' > ')
        this.rl.on('line', (input: string) => {
            console.log(`input: ${input}`)
            const cmd = BlockCommand.fromString(input)
            if (cmd != null) { this.tetris.next(cmd) }
            console.log(this.tetris.board.text)
            out.write(' > ')
        })
    }
}

function debug() {
    let board = new Board(boardRaw)
    const gen = blockGen();
    for (let i = 0; i < 30000; i++) {
        const b = gen()
        if (!board.isPuttable(b)) { continue }
        console.log(`move ok: ${board.canMove(b, moveBottom)}`)
        board = board.merge(b, PointState.FixedBlock)
        console.log(`[${i}] ~~~~~`)
        console.log(b.text)
        console.log(`(x: ${b.point.x}, y: ${b.point.y})`)
        console.log(`rows: ${board.getEliminatingRows()}`)
        console.log(`~~~~~~~~~`)
        console.log(board.text)
        console.log("")
    }
    console.log(board.eliminatingRows())
    console.log(board.text)
}

(new CommandLine()).run()