import {Tetris} from './tetris'
import Vue, {VNode} from 'vue'

export class WebGame {
    public readonly tetris: Tetris
    public readonly vm: VNode
    constructor() {
        this.tetris = new Tetris()
        this.vm = new Vue({
            el: '#app',
            data: {
                items: [...Array(200)].map(k => Math.floor(Math.random() * 3))
            },
            created: function() {
                setTimeout(() => {
                    for(let i = 0; i < 10; i++)  {
                        this.$set(this.items, i, 1)
                    }
                }, 3000)
            }
        })
    }
    run() {
    }
}