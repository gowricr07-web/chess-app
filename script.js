let selectedSquare = null;
let legalMoves = [];
let currentTurn = 'white';
let gameOver = false;
let board = null;
let turnDisplay = null;

document.addEventListener('DOMContentLoaded', () => {
    board = document.querySelector('table');
    turnDisplay = document.getElementById('turn_display');

    const setB = document.getElementById("set_board");
    if (setB) {
        setB.addEventListener('click', setBoard);
    }

    setBoard();

    if (board) {
        board.addEventListener('click', handleBoardClick);
    }
});

function handleBoardClick(event) {
    if (gameOver) return; 

    const square = event.target.closest('td');

    if (!square || square.classList.contains('horz-labels') || square.classList.contains('vert-labels') || square.classList.contains('status-cell')) {
        return;
    }

    const clickedPiece = square.querySelector('img');

    if (selectedSquare && legalMoves.includes(square.id)) {
        movePiece(selectedSquare, square);
        clearHighlights();
        if (!gameOver) {
            switchTurn();
        }
        return;
    }

    if (clickedPiece && isPieceTurn(clickedPiece)) {
        if (selectedSquare === square) {
            clearHighlights();
            return;
        }

        clearHighlights();
        selectedSquare = square;
        square.classList.add('selected');

        legalMoves = calculateLegalMoves(square);
        legalMoves.forEach(squareId => {
            const targetCell = document.getElementById(squareId);
            if (targetCell) targetCell.classList.add('possible-move');
        });
        return;
    }

    clearHighlights();
}

function setBoard() {
    const cells = document.querySelectorAll('.white-box, .black-box');
    cells.forEach(cell => cell.innerHTML = '');

    clearHighlights();
    currentTurn = 'white';
    gameOver = false;
    if (turnDisplay) turnDisplay.textContent = "It's White's Turn";

    const initialBoard = {
        // Row 8 - Black Major
        a8: 'b_rook', b8: 'b_knight', c8: 'b_bishop', d8: 'b_queen',
        e8: 'b_king', f8: 'b_bishop', g8: 'b_knight', h8: 'b_rook',
        // Row 7 - Black Pawns
        a7: 'b_pawn', b7: 'b_pawn', c7: 'b_pawn', d7: 'b_pawn',
        e7: 'b_pawn', f7: 'b_pawn', g7: 'b_pawn', h7: 'b_pawn',
        // Row 2 - White Pawns
        a2: 'w_pawn', b2: 'w_pawn', c2: 'w_pawn', d2: 'w_pawn',
        e2: 'w_pawn', f2: 'w_pawn', g2: 'w_pawn', h2: 'w_pawn',
        // Row 1 - White Major
        a1: 'w_rook', b1: 'w_knight', c1: 'w_bishop', d1: 'w_queen',
        e1: 'w_king', f1: 'w_bishop', g1: 'w_knight', h1: 'w_rook'
    };

    for (const [squareId, pieceCode] of Object.entries(initialBoard)) {
        const square = document.getElementById(squareId);
        if (square) {
            const img = document.createElement('img');

            const [colorPrefix, type] = pieceCode.split('_');
            const fullName = `${colorPrefix === 'w' ? 'white' : 'black'}_${type}`;

            img.src = `pieces/${fullName}.png`;
            img.alt = fullName;
            img.id = `${pieceCode}_${squareId}`; 
            square.appendChild(img);
        }
    }
}

function movePiece(fromSquare, toSquare) {
    const piece = fromSquare.querySelector('img');
    const capturedPiece = toSquare.querySelector('img');

    if (capturedPiece && capturedPiece.id.includes('king')) {
        const winner = capturedPiece.id.startsWith('w_') ? 'black' : 'white';
        toSquare.innerHTML = '';
        toSquare.appendChild(piece);
        endGame(winner);
        return;
    }

    toSquare.innerHTML = ''; 
    toSquare.appendChild(piece);
}

function endGame(winner) {
    gameOver = true;
    clearHighlights();
    if (turnDisplay) {
        turnDisplay.textContent = `${winner.charAt(0).toUpperCase() + winner.slice(1)} wins!`;
    }
}

function clearHighlights() {
    if (selectedSquare) {
        selectedSquare.classList.remove('selected');
        selectedSquare = null;
    }
    document.querySelectorAll('.possible-move').forEach(el => el.classList.remove('possible-move'));
    legalMoves = [];
}

function isPieceTurn(pieceImg) {
    return (currentTurn === 'white' && pieceImg.id.startsWith('w_')) ||
           (currentTurn === 'black' && pieceImg.id.startsWith('b_'));
}

function switchTurn() {
    currentTurn = currentTurn === 'white' ? 'black' : 'white';
    if (turnDisplay) {
        turnDisplay.textContent = `It's ${currentTurn.charAt(0).toUpperCase() + currentTurn.slice(1)}'s Turn`;
    }
}

function calculateLegalMoves(square) {
    const piece = square.querySelector('img');
    if (!piece) return [];

    const file = square.id[0]; 
    const rank = parseInt(square.id[1]); 
    const pieceType = piece.id.split('_')[1]; 
    const color = piece.id.startsWith('w_') ? 'white' : 'black';

    let moves = [];

    switch (pieceType) {
        case 'pawn':
            const dir = color === 'white' ? 1 : -1;
            const startRank = color === 'white' ? 2 : 7;

            const forwardId = `${file}${rank + dir}`;
            if (isEmpty(forwardId)) {
                moves.push(forwardId);
                const doubleForwardId = `${file}${rank + (2 * dir)}`;
                if (rank === startRank && isEmpty(doubleForwardId)) {
                    moves.push(doubleForwardId);
                }
            }

            const captureFiles = [String.fromCharCode(file.charCodeAt(0) - 1), String.fromCharCode(file.charCodeAt(0) + 1)];
            captureFiles.forEach(f => {
                const targetId = `${f}${rank + dir}`;
                if (isEnemy(targetId, color)) moves.push(targetId);
            });
            break;

        case 'knight':
            const knightOffsets = [
                [-2, -1], [-2, 1], [-1, -2], [-1, 2],
                [1, -2], [1, 2], [2, -1], [2, 1]
            ];
            knightOffsets.forEach(([df, dr]) => {
                const targetId = getSquareId(file, rank, df, dr);
                if (isValidSquare(targetId) && (isEmpty(targetId) || isEnemy(targetId, color))) {
                    moves.push(targetId);
                }
            });
            break;

        case 'bishop':
            moves.push(...getRayMoves(file, rank, [[1, 1], [1, -1], [-1, 1], [-1, -1]], color));
            break;

        case 'rook':
            moves.push(...getRayMoves(file, rank, [[1, 0], [-1, 0], [0, 1], [0, -1]], color));
            break;

        case 'queen':
            moves.push(...getRayMoves(file, rank, [
                [1, 0], [-1, 0], [0, 1], [0, -1],
                [1, 1], [1, -1], [-1, 1], [-1, -1]
            ], color));
            break;

        case 'king':
            const kingOffsets = [
                [-1, -1], [-1, 0], [-1, 1],
                [0, -1],           [0, 1],
                [1, -1],  [1, 0],  [1, 1]
            ];
            kingOffsets.forEach(([df, dr]) => {
                const targetId = getSquareId(file, rank, df, dr);
                if (isValidSquare(targetId) && (isEmpty(targetId) || isEnemy(targetId, color))) {
                    moves.push(targetId);
                }
            });
            break;
    }

    return moves;
}

function getRayMoves(file, rank, directions, color) {
    let moves = [];
    directions.forEach(([df, dr]) => {
        let step = 1;
        while (true) {
            const targetId = getSquareId(file, rank, df * step, dr * step);
            if (!isValidSquare(targetId)) break;

            if (isEmpty(targetId)) {
                moves.push(targetId);
            } else if (isEnemy(targetId, color)) {
                moves.push(targetId);
                break;
            } else {
                break;
            }
            step++;
        }
    });
    return moves;
}

function getSquareId(file, rank, df, dr) {
    const newFile = String.fromCharCode(file.charCodeAt(0) + df);
    const newRank = rank + dr;
    return `${newFile}${newRank}`;
}

function isValidSquare(squareId) {
    if (squareId.length !== 2) return false;
    const f = squareId[0];
    const r = parseInt(squareId[1]);
    return f >= 'a' && f <= 'h' && r >= 1 && r <= 8;
}

function isEmpty(squareId) {
    const el = document.getElementById(squareId);
    return el && !el.querySelector('img');
}

function isEnemy(squareId, activeColor) {
    const el = document.getElementById(squareId);
    if (!el) return false;
    const img = el.querySelector('img');
    if (!img) return false;
    return activeColor === 'white' ? img.id.startsWith('b_') : img.id.startsWith('w_');
}