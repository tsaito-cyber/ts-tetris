import { Tetris } from './tetris'
import { MoveBlock } from './block'
import { PointState, PointColor } from './point'
import window from './window'
import * as React from 'react'

interface GameWebProps { }
interface GameWebState {
  tetris: Tetris,
  score: number,
  speed: number,
}
export class GameWeb extends React.Component<GameWebProps, GameWebState> {
  constructor(props: GameWebProps) {
    super(props)
    this.state = {
      speed: 500,
      tetris: new Tetris(24),
      score: 0,
    }
  }
  componentDidMount() {
    window.addEventListener("keydown", this.onKey.bind(this))
    this.clock()
  }
  componentWillUnmount() {
    window.removeEventListener("keydown", this.onKey.bind(this))
  }
  clock() {
    console.log(`speed: ${this.state.speed}`)
    setTimeout(() => {
      if (this.state.tetris.gameOver) { return }
      this.next(MoveBlock.Down)
      this.clock()
    }, this.state.speed)
  }
  onKey(event: KeyboardEvent) {
    const cmd = MoveBlock.fromString(event.code as string)
    if (cmd != null) {
      this.next(cmd)
    }
  }
  next(cmd: MoveBlock) {
    this.state.tetris.next(cmd)
    this.setState((state, props) => (
      { score: state.tetris.score }
    ))
    console.log(this.state.tetris.board.text)
  }
  // TODO
  get points(): PointState[] {
    const newPoints: PointState[] = []
    for (const { point: { y: y, x: x }, value: value } of this.state.tetris.board.iterator()) {
      if (x < 2 || x > 11 || y < 2 || y > 21) { continue }
      newPoints[(y - 2) * 10 + (x - 2)] = value
    }
    return newPoints
  }
  render() {
    return (
      <div className="game-main">
        <div className="game-info">
          <div className="game-score">
            <h2 className="game-section-title">スコア</h2>
            <p>{this.state.score}点</p>
            <h2 className="game-section-title">速度</h2>
            <p>{this.state.speed}マイクロ秒</p>
          </div>
        </div>
        <div className="game-board">
          {this.points.map((val, i) => {
            const className = val.notEmpty() ? 'is-active' : '' // FIXME
            const color = PointColor.toName(val.color)
            return <div className={className} key={i} data-background-color={color}></div>
          })}
        </div>
      </div>
    )
  }
}
