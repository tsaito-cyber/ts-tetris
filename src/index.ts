
enum BlockState {
    Wall = '*',
    FixedBlock = '0',
    Empty = '.',
    UnboundedBlock = '1',
    CentralUnboundedBlock = 'X'
}

enum BoardState {
    Moving,
    Creating,
    Stopping,
    Eliminating,
    Ending,
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

type BlockStates = Array<Array<BlockState>>

function* blockGen() {
    function randBlocks(): Board {
        return Blocks[Math.floor(Math.random() * Blocks.length)]
    }
    let items = []
    for (let i = 0; i < 3; i++) {
        items.push(randBlocks())
    }
    while(true) {
        yield items
        items.shift() // discard
        items.push(randBlocks())
    }
}

class Board {
    private board: BlockStates
    constructor(str: string) {
        this.board = str.split("\n").map(row => [...row].map(char => char as BlockState))
    }
    get boardText() {
        return this.board.map(row => row.map(r => r as string).join('')).join("\n")
    }
}

const Blocks = [
    "...\n.X.\n111", // T
    "...\n1X.\n.11", // Z
    "...\n.X1\n11.", // Z_t
    ".1.\n.X.\n.11", // L
    ".1.\n.X.\n11.", // L_t
].map(str => new Board(str))

let board = new Board(boardRaw)
let gen = blockGen();
for (let i = 0; i < 3; i++) {
    let result = gen.next().value as Array<Board>
    console.log(result[0].boardText)
}

