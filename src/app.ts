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
9
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

function blockGen(xRange: number = 8, yRange: number = 22): () => Block {
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

function genPoint(xRange: number = 8, yRange: number = 22): Point {
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
const moveDown =  (p: Point) => ({x: p.x,   y: p.y+1} as Point)
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
    Down = 2,
    Left   = 3,
    Right  = 4,
}

namespace BlockCommand {
    export function toMove(cmd: BlockCommand): Move {
        switch(cmd) {
            case BlockCommand.Down:
                return moveDown
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
            case 'down':
                return BlockCommand.Down
            case 'right':
                return BlockCommand.Right
            case 'left':
                return BlockCommand.Left
            case 'up':
                return BlockCommand.Rotate
            default:
                return
        }
    }
}

class Tetris {
    private state: GameState
    private _board: Board
    private _score: number
    public block: Block
    private blockGen: () => Block
    private calling: boolean
    get board() {
        return this._board.merge(this.block)
    }
    get gameOver() {
        return this.state == GameState.Ending
    }
    get score() {
        return this._score
    }
    constructor() {
        this._board = new Board(boardRaw)
        this._score = 0
        this.state = GameState.Moving
        this.blockGen = blockGen(8, 0)
        this.block = this.blockGen()
        this.calling = false
    }
    next(cmd?: BlockCommand) {
        console.log(`cmd: ${cmd}`)
        if (this.calling || this.gameOver) { return }
        this.calling = true
        switch (this.state) {
            case GameState.Moving: {
                this.moveBlock(cmd || BlockCommand.Down)
                break
            }
            case GameState.Stopping: {
                const score = this._board.countEliminatingRows()
                if (score > 0) {
                    this.state = GameState.Eliminating
                    this._score += score
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
                console.log(this.block)
                console.log("Game Over")
                break
            }
            case GameState.Creating: {
                this.block = this.blockGen()
                this.state = this._board.isPuttable(this.block) ? GameState.Moving : GameState.Ending
                break
            }
        }
        this.calling = false
    }
    moveBlock(cmd: BlockCommand) {
        const move = BlockCommand.toMove(cmd)
        if (cmd === BlockCommand.Rotate) {
            this.rotateBlock()
            return
        }
        if (this._board.canMove(this.block, move)) {
            this.block = this.block.movePoint(move)
        } else if (cmd === BlockCommand.Down) {
            this._board = this._board.merge(this.block, PointState.FixedBlock)
            this.state = GameState.Stopping
            this.next()
        }
    }
    rotateBlock() {
        let block = this.block.rotate3x3()
        let p = this._board.unPuttablePoint(block)
        if (!p) {
            this.block = block
            return
        }
        const v = block.center.x - p.x
        switch(v) {
            case 0: {
                return
            }
            case 1: {
                if (this._board.canMove(block, moveLeft)) {
                    this.block = this.block.movePoint(moveLeft)
                }
                break
            }
            case -1: {
                if (this._board.canMove(block, moveRight)) {
                    this.block = this.block.movePoint(moveRight)
                }
                break
            }
            default:
                console.log(`${v}, ${block.center.x}, ${p.x}`)
                throw new Error('I think falling into this line is impossible...')
        }
    }
}

class CommandLine {
    private tetris: Tetris
    private clockdown: number
    private rl: any
    constructor() {
        this.tetris = new Tetris()
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: true,
        })
        process.stdin.setRawMode(true)
        this.clockdown = 1000
        this.clock()
    }
    clock() {
        setTimeout(() => {
            this.tetris.next(BlockCommand.Down)
            this.clock()
            this.screen(`clockdown`)
        }, this.clockdown)
    }
    run() {
        console.log(this.tetris.board.text)
        process.stdin.on('keypress', (c: string, key: any) => {
            const cmd = BlockCommand.fromString(key.name as string)
            if (cmd != null) { this.tetris.next(cmd) }
            this.screen(`input: ${key.name}`)
            if (this.tetris.gameOver) {
                let p = this.tetris.block.point
                console.log(`your score: ${this.tetris.score}`)
                console.log(`pos: (${p.x}, ${p.y})`)
                console.log(`table: ${this.tetris.block.text}`)
                process.exit(0)
            }
        })
    }
    screen(text: string) {
        out.write("\u001B[2J\u001B[0;0f")
        out.write("")
        console.log(this.tetris.board.text)
        console.log(text)
        out.write(' > ')
    }
}

function debug() {
    let board = new Board(boardRaw)
    const gen = blockGen();
    for (let i = 0; i < 30000; i++) {
        const b = gen()
        if (!board.isPuttable(b)) { continue }
        console.log(`move ok: ${board.canMove(b, moveDown)}`)
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