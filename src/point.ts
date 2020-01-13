// 今後クラスにする
export enum PointKind {
    FixedBlock = '0',
    Empty = '.',
    UnboundedBlock = '1',
    CentralUnboundedBlock = 'X',
    Wall = '*',
}

export enum PointColor {
    LightBlue = 1,
    Yellow    = 2,
    Purple    = 3,
    Blue      = 4,
    Orange    = 5,
    Green     = 6,
    Red       = 7,
    None      = 8,
}

export namespace PointColor {
    export function toAnsi(color: PointColor): string {
        switch(color) {
            case PointColor.LightBlue: {
                return '\u001b[36m'
            }
            case PointColor.Yellow: {
                return '\u001b[33m'
            }
            case PointColor.Purple: {
                return '\u001b[35m'
            }
            case PointColor.Blue: {
                return '\u001b[34m'
            }
            case PointColor.Orange: {
                return '\u001b[31m'
            }
            case PointColor.Green: {
                return '\u001b[32m'
            }
            case PointColor.Red: {
                return '\u001b[31m'
            }
            case PointColor.None: {
                return '\u001b[37m'
            }
        }
    }
}

export class PointState {
    public readonly kind: PointKind
    public readonly color: PointColor
    constructor(kind: PointKind, color: PointColor) {
        this.kind = kind
        this.color = color
    }
    get char(): string {
        return this.kind as string
    }
    static fixedBlock(color?: PointColor): PointState {
        return PointState.makePointState(PointKind.FixedBlock, color)
    }
    static fromChar(char: string, color?: PointColor): PointState {
        return PointState.makePointState(char as PointKind, color)
    }
    static makePointState(kind: PointKind, color?: PointColor): PointState {
        const c = (color === undefined || kind === PointKind.Empty || kind === PointKind.Wall) ?
            PointColor.None : color
        return new PointState(kind, c)
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

