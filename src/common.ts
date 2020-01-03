// 今後クラスにする
export enum PointState {
    FixedBlock = '0',
    Empty = '.',
    UnboundedBlock = '1',
    CentralUnboundedBlock = 'X'
}

export interface Point {
    x: number
    y: number
}

export type Move = (p: Point) => Point

export type Table = Array<Array<PointState>>

export function strToTable(str: string): Table {
    return str.split("\n").map(row => toPointStates(row))
}

export function toPointStates(str: string): Array<PointState> {
    return [...str].map(char => char as PointState)
}