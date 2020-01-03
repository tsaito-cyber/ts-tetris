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

