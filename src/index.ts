
enum BlockState {
    Wall = '*',
    FixedBlock = '0',
    Empty = '.',
    UnboundedBlock = '1',
    CentralUnboundedBlock = 'X'
}

const boardRaw = `
*..........*
*..........*
*..........*
*..........*
*..........*
*..........*
*..........*
*..........*
*..........*
*..........*
*..........*
*..........*
*..........*
*..........*
*..........*
*..........*
*..........*
*..........*
*..........*
*..........*
************
`.trim()

class Board {
    private board: Array<Array<BlockState>>
    constructor(boardRaw: string) {
        this.board = boardRaw.split("\n").map(row => {
            return [...row].map(char => char as BlockState)
        })
    }
    public to_s = (): string => {
        return this.board.map(row => row.map(r => r as string).join('')).join("\n")
    }
}

let board = new Board(boardRaw)
console.log(board.to_s())

