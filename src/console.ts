import {Tetris} from './tetris'
import {MoveBlock} from './block'
import {PointColor} from './point'

export class ConsoleGame {
    private readline = require('readline')
    private out = process.stdout
    private tetris: Tetris
    private clockdown: number
    private rl: any
    private debug: boolean
    constructor(debug: boolean = false) {
        this.tetris = new Tetris(16)
        this.rl = this.readline.createInterface({
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
            this.tetris.next(MoveBlock.Down)
            this.clock()
            this.screen(`clockdown`)
        }, this.clockdown)
    }
    debugRun() {
        this.show()
        this.out.write(' > ')
        this.rl.on('line', (line: string) => {
            const cmd = MoveBlock.fromString(line)
            if (cmd != null) { this.tetris.next(cmd) }
            if (this.tetris.gameOver) { process.exit(0) }
            this.show()
            this.out.write(' > ')
        })
    }
    show() {
        const text = this.tetris.board.table.map(
            row => row.map(r => `${PointColor.toAnsi(r.color)}${r.char}\u001b[0m`).join('')).join('\n')
        console.log(text)
    }
    run() {
        if (this.debug) {
            this.debugRun()
            return
        }
        this.show()
        process.stdin.on('keypress', (c: string, key: any) => {
            const cmd = MoveBlock.fromString(key.name as string)
            if (cmd != null) { this.tetris.next(cmd) }
            this.screen(`input: ${key.name}`)
            if (this.tetris.gameOver) {
                let p = this.tetris.block.point
                console.log(`your score: ${this.tetris.score}`)
                console.log(`pos: (${p.x}, ${p.y})`)
                this.tetris.block.info()
                process.exit(0)
            }
        })
    }
    screen(text: string) {
        this.out.write("\u001B[2J\u001B[0;0f")
        this.out.write("")
        this.show()
        console.log(text)
        this.out.write(' > ')
    }
}

(new ConsoleGame()).run()
