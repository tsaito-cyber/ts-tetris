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
const NumberOfRow = 16 // 24
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
        let args = [strToTable(block.text), getPoint(xRange, yRange)] as any[]
        if (block.rType) { args.push(block.rType) }
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
        for (const {point: {y: y, x: x}, value: value} of Array.from(other.iterator()).reverse()) {
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
const moveLeftFn  =  (dx: number) => ((p: Point) => ({x: p.x-dx, y: p.y} as Point))
const moveRightFn =  (dx: number) => ((p: Point) => ({x: p.x+dx, y: p.y} as Point))
const moveLeft    = moveLeftFn(1)
const moveRight   = moveRightFn(1)
const moveDown    =  (p: Point) => ({x: p.x,   y: p.y+1} as Point)
const moveNone    =  (p: Point) => p

abstract class Block extends Board {
    public readonly point: Point
    constructor(table: Table, point: Point) {
        super(table)
        this.point = point
    }
    *iterator() {
        for(const {point: {y: y, x: x}, value: value} of super.iterator()) {
            yield {point: {y: this.point.y + y, x: this.point.x + x}, value: value}
        }
    }
    abstract get center(): Point
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
        return new Block3x3(table, this.point)
    }
    get center(): Point {
        return ({x: this.point.x + 1, y: this.point.y + 1} as Point)
    }
    movePoint(fn: (fn: Point) => Point): Block {
        return new Block3x3(this.table, fn(this.point))
    }
}

class Block2x2 extends Block {
    constructor(table: Table, point: Point) {
        super(table, point)
    }
    rotate(): Block {
        return new Block2x2(this.table, this.point)
    }
    get center(): Point {
        return {...this.point}
    }
    movePoint(fn: (fn: Point) => Point): Block {
        return new Block2x2(this.table, fn(this.point))
    }
}

enum RotType {
    Vertical  = ".1..\n.1..\n.1..\n.1..",
    Horizon   = "....\n1111\n....\n....",
}

class Block4x4 extends Block {
    private rType: RotType
    constructor(table: Table, point: Point, rType: RotType) {
        super(table, point)
        this.rType = rType
    }
    rotate(): Block {
        let table = this.tableClone()
        let nextType: RotType
        switch (this.rType) {
            case RotType.Vertical: {
                nextType = RotType.Horizon
                break
            }
            case RotType.Horizon: {
                nextType = RotType.Vertical
                break
            }
        }
        console.log(nextType)
        return new Block4x4(strToTable(nextType as string), this.point, nextType)
    }
    movePoint(fn: (fn: Point) => Point): Block {
        return new Block4x4(this.table, fn(this.point), this.rType)
    }
    get center(): Point {
        return ({x: this.point.x + 1, y: this.point.y + 1} as Point)
    }
}

const Blocks = [
    {ctor: Block3x3, text: ".1.\n1X1\n..."},  // T
    {ctor: Block3x3, text: "...\n1X.\n.11"},  // Z
    {ctor: Block3x3, text: "...\n.X1\n11."},  // Z_t
    {ctor: Block3x3, text: ".1.\n.X.\n.11"},  // L
    {ctor: Block3x3, text: ".1.\n.X.\n11."},  // L_t
    {ctor: Block2x2, text: "11\n11"},         // O
    {ctor: Block4x4, text: RotType.Vertical as string, rType: RotType.Vertical}, // I
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
        if (v == 0) { return }
        else if (v > 0) {
            for (var k = p.x; k >= 0 && this._board.table[p.y][k] != PointState.Empty; k++) {}
            let pos = k - p.x
            if (this._board.canMove(block, moveRightFn(pos))) {
                this.block = block.movePoint(moveRightFn(pos))
            }
        } else if (v < 0) {
            const row = this._board.table[p.y]
            for (var k = p.x; k < row.length && row[k] != PointState.Empty; k--) {}
            let pos = p.x - k
            if (this._board.canMove(block, moveLeftFn(pos))) {
                this.block = block.movePoint(moveLeftFn(pos))
            }
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
        this.debug = false
        this.clockdown = 1000
        if (!this.debug) {
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