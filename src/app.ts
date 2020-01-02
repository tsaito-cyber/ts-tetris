const readline = require('readline');
const out = process.stdout

// 今後クラスにする
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
        let args = [strToTable(block.text), {x: 2, y:0}] as any[]
        return create(block.ctor, args)
    }
    return () => {
        const block = randBlocks()
        return block.adjustPoint()
    }
}

// from <= retval < to
function rand(from: number, to: number) {
    return Math.floor(Math.random() * (to - from)) + from
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
    unPuttablePoints(other: Block): Point[] {
        let points: Point[] = []
        for (const {point: {y: y, x: x}, value: value} of Array.from(other.iterator())) {
            if (y >= this.table.length) { continue }
            if (x >= this.table[y].length) { continue }
            if (value === PointState.Empty || this.table[y][x] === PointState.Empty) { continue }
            points.push({y: y, x: x})
        }
        return points
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

interface Box {
    point: Point,
    height: number,
    width: number,
}

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
            for (let j = i; j < len; j++) {
                if (this.table[i][j] !== PointState.Empty && y < 0) {
                    x = j
                }
                if (this.table[j][i] !== PointState.Empty && x < 0) {
                    y = j
                }
            }
            for (let j = 0; j < len; j++) {
                if (this.table[i][j] !== PointState.Empty) {
                    height = i > height ? (i+1) : height
                    width  = j > width  ? (j+1) : width
                }
            }
        }
        return {point: {x: x, y: y}, width: width - x, height: height - y}
    }
    adjustPoint(boardWidth: number = 14, boardHeight: number = 24): Block {
        console.log(`${this.box.width}, ${this.point.x}, ${this.baseLength}`)
        console.log(`from: ${2 - this.box.point.x}, to: ${11 - (this.baseLength - (this.box.width + this.point.x))}`)
        this.point.x = rand(2 - this.box.point.x, 11 - (this.baseLength - (this.box.width + this.point.x)))
        this.point.y = 2 - this.box.point.y
        console.log(`x: ${this.point.x}, y: ${this.point.y}`)
        console.log(`${this.text}`)
        console.log(`~~~~~~~`)
        return this
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
        return new Block3x3(table, {...this.point})
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
        return this.table[2][3] === PointState.UnboundedBlock
    }
    get isVertical(): boolean {
        return this.table[0][1] === PointState.UnboundedBlock
    }
    rotate(): Block4x4 {
        let table = this.tableClone()
        for (const {from: {y: y, x:x}, to: {y: newY, x: newX}} of this.rotationMatrix) {
            [table[y][x], table[newY][newX]] = [table[newY][newX], table[y][x]]
        }
        return new Block4x4(table, {...this.point})
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
    {ctor: Block3x3, text: ".1.\n1X1\n..."},  // T
    {ctor: Block3x3, text: "...\n1X.\n.11"},  // Z
    {ctor: Block3x3, text: ".1.\n1X.\n1.."},  // Z'
    {ctor: Block3x3, text: "...\n.X1\n11."},  // Z_t
    {ctor: Block3x3, text: ".1.\n.X1\n..1"},  // Z_t'
    {ctor: Block3x3, text: ".1.\n.X.\n.11"},  // L
    {ctor: Block3x3, text: "...\n1X1\n1.."},  // L'
    {ctor: Block3x3, text: "11.\n.X.\n.1."},  // L''
    {ctor: Block3x3, text: "..1\n1X1\n..."},  // L'''
    {ctor: Block3x3, text: ".1.\n.X.\n11."},  // L_t
    {ctor: Block3x3, text: "1..\n1X1\n..."},  // L_t'
    {ctor: Block3x3, text: ".11\n.X.\n.1."},  // L_t''
    {ctor: Block3x3, text: "...\n1X1\n..1"},  // L_t'''
    {ctor: Block2x2, text: "11\n11"},         // O
    {ctor: Block4x4, text: ".1..\n.1..\n.X..\n.1.."}, // I
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
        let block = this.block.rotateOn(this._board)
        if (block) { this.block = block }
    }
}

class GameCommandLine {
    private tetris: Tetris
    private clockdown: number
    private rl: any
    private debug: boolean
    constructor(debug: boolean = false) {
        this.tetris = new Tetris()
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: true,
        })
        this.debug = debug
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
