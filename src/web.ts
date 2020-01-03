import {Tetris} from './tetris'
import {MoveBlock} from './block'
import {PointState} from './point'
import Vue, {VNode} from 'vue'
import window from './window'

Vue.component('game-component', {
    data() {
        return {
            items: Array(200).fill(PointState.Empty),
            clockdown: 1000,
            tetris: new Tetris(24),
            score: 0,
        }
    },
    template: '#game-component',
    created: function() {
        window.addEventListener("keydown", this.onKey);
    },
    beforeDestroy: function() {
        window.removeEventListener("keydown", this.onKey);
    },
    methods: {
        onKey: function(event: KeyboardEvent) {
            const cmd = MoveBlock.fromString(event.code as string)
            if (cmd != null) {
                this.tetris.next(cmd)
                for (const {point: {y: y, x: x}, value: value} of this.tetris.board.iterator()) {
                    if (x <= 1 && x >= 11) { continue }
                    this.items[(y - 2) * 10 + (x - 2)] = value
                }
                this.score += 100;
            }
        },
    }
})

export function run(): VNode {
    return new Vue({
        el: '#app',
    })
}