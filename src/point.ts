// 今後クラスにする
export enum PointKind {
    FixedBlock = '0',
    Empty = '.',
    UnboundedBlock = '1',
    CentralUnboundedBlock = 'X'
}

export enum PointColor {
    LightBlue = 1,
    Yellow    = 2,
    Purple    = 3,
    Blue      = 4,
    Orange    = 5,
    Green     = 6,
    Red       = 7,
}

export class PointState {
    public readonly kind: PointKind
    constructor(kind: PointKind) {
        this.kind = kind
    }
    get char(): string {
        return this.kind as string
    }
    static fixedBlock(): PointState {
        return new PointState(PointKind.FixedBlock)
    }
    static fromChar(char: string): PointState {
        return new PointState(char as PointKind)
    }
    isEmpty(): boolean {
        return this.kind === PointKind.Empty
    }
    isFixed(): boolean {
        return this.kind === PointKind.FixedBlock
    }
    isUnbounded(): boolean {
        return this.kind === PointKind.UnboundedBlock
    }
    notEmpty(): boolean {
        return !this.isEmpty()
    }
}

export interface Point {
    x: number
    y: number
}

export type Move = (p: Point) => Point

