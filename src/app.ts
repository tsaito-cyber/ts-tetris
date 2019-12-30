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

type Table = Array<Array<PointState>>

function create<T>(ctor: {new(...args: any[]): T}, args: any) {
    return new ctor(...args);
}

function blockGen(xRange: number = 8, yRange: number = 22): () => Block {
    function randBlocks(): Block {
        const block = Blocks[Math.floor(Math.random() * Blocks.length)]
        let args = [getPoint(xRange, yRange)] as any[]
        if (block.text) { args.push(strToTable(block.text)) }
        return create(block.ctor, args)
    }
    return () => {
        let block = randBlocks()
        for(let i = 0; i < Math.floor(Math.random() * 4); i++) { block = block.rotate() }
        return block
    }
}

function getPoint(xRange: number = 8, yRange: number = 22): Point {
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
    isPuttable(other: Block): boolean {
        for (const {point: {y: y, x: x}, value: value} of other.iterator()) {
            if (y >= this.table.length) { return false }
            if (x >= this.table[y].length) { return false }
            if (value === PointState.Empty || this.table[y][x] === PointState.Empty) { continue }
            return false
        }
        return true
    }
    canMove(other: Block, move: Move): boolean {
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
const moveDown   =  (p: Point) => ({x: p.x,   y: p.y+1} as Point)
const moveNone   =  (p: Point) => p

abstract class Block extends Board {
    public readonly point: Point
    constructor(point: Point, table: Table) {
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
    abstract rotate(): Block
    abstract movePoint(fn: (fn: Point) => Point): Block
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
    rotate(): Block {
        let table = this.tableClone()
        for (const {from: [x, y], to: [newX, newY]} of this.rotationMatrix) {
            table[newX][newY] = this.table[x][y]
        }
        return new Block3x3(this.point, table)
    }
    movePoint(fn: (fn: Point) => Point): Block {
        return new Block3x3(fn(this.point), this.table)
    }
}

class Block2x2 extends Block {
    constructor(point: Point) {
        super(point, strToTable("11\n11"))
    }
    rotate(): Block {
        return new Block2x2(this.point)
    }
    movePoint(fn: (fn: Point) => Point): Block {
        return new Block2x2(fn(this.point))
    }
}

class Block4x4 extends Block {
    constructor(point: Point) {
        super(point, strToTable(".1..\n.1..\n.1..\n.1.."))
    }
    rotate(): Block {
        let table = this.tableClone()
        return new Block4x4(this.point)
    }
    movePoint(fn: (fn: Point) => Point): Block {
        return new Block4x4(fn(this.point))
    }
}

const Blocks = [
    {ctor: Block3x3, text: ".1.\n1X1\n..."},  // T
    {ctor: Block3x3, text: "...\n1X.\n.11"},  // Z
    {ctor: Block3x3, text: "...\n.X1\n11."},  // Z_t
    {ctor: Block3x3, text: ".1.\n.X.\n.11"},  // L
    {ctor: Block3x3, text: ".1.\n.X.\n11."},  // L_t
    {ctor: Block2x2, text: null},             // O
    {ctor: Block4x4, text: null},             // I
]

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
    Down   = 2,
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
            case 'd':
            case 'down':
                return BlockCommand.Down
            case 'r':
            case 'right':
                return BlockCommand.Right
            case 'l':
            case 'left':
                return BlockCommand.Left
            case 'u':
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
        } else if (cmd === BlockCommand.Down) {
            this._board = this._board.merge(this.block, PointState.FixedBlock)
            this.state = GameState.Stopping
            this.next()
        }
    }
    rotateBlock() {
        let block = this.block.rotate()
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
                if (this._board.canMove(block, moveRight)) {
                    this.block = block.movePoint(moveRight)
                }
                break
            }
            case -1: {
                if (this._board.canMove(block, moveLeft)) {
                    this.block = block.movePoint(moveLeft)
                }
                break
            }
            default:
                console.log(`${v}, ${block.center.x}, ${p.x}`)
                throw new Error('I think falling into this line is impossible...')
        }
    }
}

class GameCommandLine {
    private tetris: Tetris
    private clockdown: number
    private rl: any
    private debug: boolean
    constructor() {
        this.tetris = new Tetris()
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: true,
        })
        this.debug = true
        this.clockdown = 1000
        if (!debug) {
            process.stdin.setRawMode(true)
            this.clock()
        }
    }
    clock() {
        setTimeout(() => {
            this.tetris.next(BlockCommand.Down)
            this.clock()
            this.screen(`clockdown`)
        }, this.clockdown)
    }
    debugRun() {
        console.log(this.tetris.board.text)
        out.write(' > ')
        this.rl.on('line', (line: string) => {
            const cmd = BlockCommand.fromString(line)
            if (cmd != null) { this.tetris.next(cmd) }
            if (this.tetris.gameOver) { process.exit(0) }
            console.log(this.tetris.board.text)
            out.write(' > ')
        })
    }
    run() {
        if (this.debug) {
            this.debugRun()
            return
        }
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



(new GameCommandLine()).run()