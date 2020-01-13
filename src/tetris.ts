import {PointKind} from './point'
import {Board} from './board'
import {Block, MoveBlock} from './block'

enum GameState {
    Moving      = 1,
    Creating    = 2,
    Stopping    = 3,
    Eliminating = 4,
    Ending      = 5,
    Starting    = 6,
}

export class Tetris {
    private state: GameState
    private _board: Board
    private _score: number
    public block: Block
    private genBlock: () => Block
    get board() {
        return this._board.merge(this.block)
    }
    get gameOver() {
        return this.state == GameState.Ending
    }
    get score() {
        return this._score
    }
    constructor(rows: number) {
        this._board = Board.create(rows)
        this._score = 0
        this.state = GameState.Moving
        this.genBlock = Block.generate(8, 0)
        this.block = this.genBlock()
    }
    next(cmd?: MoveBlock) {
        console.log(`cmd: ${cmd}`)
        switch (this.state) {
            case GameState.Moving: {
                this.moveBlock(cmd || MoveBlock.Down)
                break
            }
            case GameState.Stopping: {
                const score = this._board.countEliminatingRows()
                if (score > 0) {
                    this.state = GameState.Eliminating
                    this._score += score * 200
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
                this.block = this.genBlock()
                this.state = this._board.isPuttable(this.block) ? GameState.Moving : GameState.Ending
                break
            }
        }
    }
    moveBlock(cmd: MoveBlock) {
        const move = MoveBlock.toMove(cmd)
        if (cmd === MoveBlock.Rotate) {
            this.rotateBlock()
            return
        }
        if (this._board.canMove(this.block, move)) {
            this.block = this.block.movePoint(move)
            if (cmd === MoveBlock.Down) { this._score += 1 }
        } else if (cmd === MoveBlock.Down) {
            this._board = this._board.merge(this.block, PointKind.FixedBlock)
            this.state = GameState.Stopping
            this.next()
        }
    }
    rotateBlock() {
        let block = this.block.rotateOn(this._board)
        if (block) { this.block = block }
    }
}

