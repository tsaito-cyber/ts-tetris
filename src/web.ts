import {Tetris} from './tetris'
import {MoveBlock} from './block'
import {PointState} from './point'
import Vue, {VNode} from 'vue'
import window from './window'

Vue.component('game-component', {
    data() {
        return {
            items: Array(200).fill(PointState.Empty),
            clockdown: 500,
            tetris: new Tetris(24),
            score: 0,
        }
    },
    template: '#game-component',
    created: function() {
        window.addEventListener("keydown", this.onKey);
        this.clock()
    },
    beforeDestroy: function() {
        window.removeEventListener("keydown", this.onKey);
    },
    computed: {
        speed: function(): number {
            return this.clockdown
        }
    },
    methods: {
        clock: function() {
            console.log(`clockdown: ${this.clockdown}`)
            setTimeout(() => {
                if (this.tetris.gameOver) { return }
                this.next(MoveBlock.Down)
                this.clock()
            }, this.clockdown)
        },
        onKey: function(event: KeyboardEvent) {
            const cmd = MoveBlock.fromString(event.code as string)
            if (cmd != null) {
                this.next(cmd)
            }
        },
        next: function(cmd: MoveBlock) {
            this.tetris.next(cmd)
            for (const {point: {y: y, x: x}, value: value} of this.tetris.board.iterator()) {
                if (x < 2 || x > 11 || y < 2 || y > 21) { continue }
                this.$set(this.items, (y - 2) * 10 + (x - 2), value)
            }
            this.score = this.tetris.score
            console.log(this.tetris.board.text)

        }
    }
})

export function run(): VNode {
    return new Vue({
        el: '#app',
    })
}