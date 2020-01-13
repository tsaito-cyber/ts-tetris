import {Point, PointState, PointKind, Move, PointColor} from './point'

export type Table = Array<Array<PointState>>

export class Board {
    public readonly table: Table
    private readonly numColumn = 10
    constructor(table: Table) {
        this.table = table
    }
    static toPointStates(str: string, color: PointColor = PointColor.None): Array<PointState> {
        return [...str].map(char => PointState.fromChar(char, color))
    }
    static toTable(str: string, color: PointColor = PointColor.None): Table {
        return str.split("\n").map(row => this.toPointStates(row, color))
    }
    static create(rows: number = 16) {
        const table = Array.from(new Array(rows-2), () => [...PointStateRow]) as Table
        for (let i = 0; i < 2; i++) { table.push(this.toPointStates('**************')) }
        return new Board(table)
    }
    get text(): string {
        return this.table.map(row => row.map(r => r.char).join('')).join("\n")
    }
    unPuttablePoints(other: Board): Point[] {
        let points: Point[] = []
        for (const {point: {y: y, x: x}, value: value} of Array.from(other.iterator())) {
            if (y >= this.table.length) { continue }
            if (x >= this.table[y].length) { continue }
            if (value.isEmpty() || this.table[y][x].isEmpty()) { continue }
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
    merge(other: Board, kind?: PointKind): Board {
        if (!this.isPuttable(other)) { return this }
        const table = this.tableClone()
        for (const {point: {y: y, x: x}, value: value} of other.iterator()) {
            if (table.length > y && table[y].length > x && value.notEmpty()) {
                table[y][x] = kind !== undefined ? PointState.makePointState(kind, value.color) : value
            }
        }
        return new Board(table)
    }
    isPuttable(other: Board): boolean {
        for (const {point: {y: y, x: x}, value: value} of other.iterator()) {
            if (y >= this.table.length) { return false }
            if (x >= this.table[y].length) { return false }
            if (value.isEmpty() || this.table[y][x].isEmpty()) { continue }
            return false
        }
        return true
    }
    canMove(other: Board, move: Move): boolean {
        return Array.from(other.iterator())
            .every(({point: point, value: value}) => {
                const p = move(point as Point)
                return value.isEmpty() || (this.table[p.y][p.x].isEmpty())
            })
    }
    getEliminatingRows(): Array<number> {
        return Array.from(this.table.entries()).map(([i, row]) => {
            return row.slice(2, this.numColumn + 2).every(r => r.isFixed()) ? i : null
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

const PointStateRow = Board.toPointStates('**..........**')