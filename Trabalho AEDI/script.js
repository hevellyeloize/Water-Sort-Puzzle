class Stack { //classe da pilha 
    constructor() {
        this.items = []; //guardados
    }

    push(item) {
        this.items.unshift(item); // adc / inicio do vetor unshift
    }

    pop() {
        if (this.isEmpty()) return null; //verifica null
        return this.items.shift(); // Remove topo
    }

    peek() {
        if (this.isEmpty()) return null;
        return this.items[0]; // permite consulta
    }

    isEmpty() { //vazio
        return this.items.length === 0;
    }

    size() { //qnts 
        return this.items.length;
    }

    clear() { //reinicia
        this.items = [];
    }

    getState() {
        return this.items.slice(); // evita alterações diretas
    }
}

class Jogo { //clss jogo
    constructor() {
        this.tubes = []; //tubos.
        this.undoStack = new Stack(); //undo desfazer.
        this.moveCount = 0; //movimentos.
        this.selectedTube = null;
        this.maxCapacity = 4;
        this.numTubes = 6;  // numero de tubos adicionados
        this.colors = ['pink', 'blue', 'green', 'purple'];
        this.isGameWon = false; //vtr.
        
        this.initializeGame();
        this.render(); //style.
        this.bindEvents(); //clicks
    }

    initializeGame() {
        this.tubes = [];
        this.undoStack.clear(); //limp hist
        this.moveCount = 0;
        this.selectedTube = null;
        this.isGameWon = false;

        //  cria pilha
        for (let i = 0; i < 6; i++) {
            this.tubes.push(new Stack());
        }

        this.generateInitialPuzzle();
    }

    generateInitialPuzzle() {
        // 16 segmentos (cd tubo usa 4 cores)
        const segments = [];
        const usedColors = this.colors.slice(0, 4); // Usar só 4 cores
        usedColors.forEach(color => {
            for (let i = 0; i < 4; i++) {
                segments.push(color);
            }
        });

        const shuffled = this.shuffleArray(segments); //mistura
        
        //  Distribuir em 4 tubos (deixando 2 vazios)
        let idx = 0;
        for (let tube = 0; tube < 4; tube++) {
            const numSegments = 4; // Cada tubo inicial com 4 segmentos
            for (let i = 0; i < numSegments && idx < 16; i++) {
                this.tubes[tube].push(shuffled[idx++]);
            }
        }
    }

    shuffleArray(array) {
        const copy = [...array];
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]]; //troca posições
        }
        return copy;
    }

    render() { 
      //desenho
        /*limpa o tabuleiro antigo
          percorre todos os tubos
          cria os tubos na tela
          coloca as cores dentro deles
          adiciona efeitos visuais (vazio, cheio, selecionado)
          atualiza a interface*/ 

        const gameBoard = document.getElementById('gameBoard');
        gameBoard.innerHTML = ''; //apaga

        this.tubes.forEach((tube, index) => { //percorre
            const tubeDiv = document.createElement('div'); //cria
            tubeDiv.className = 'tube';
            tubeDiv.dataset.index = index;

            const state = tube.getState();
            
            for (let i = 0; i < state.length; i++) {
                const segment = document.createElement('div');
                const colorClass = `color-${state[i]}`;
                segment.className = `color-segment ${colorClass}`;
                tubeDiv.appendChild(segment);
            }

            if (tube.size() === 0) tubeDiv.classList.add('empty');
            if (tube.size() === this.maxCapacity) tubeDiv.classList.add('full');
            if (index === this.selectedTube) tubeDiv.classList.add('selected');

            gameBoard.appendChild(tubeDiv);
        });

        this.updateUI();
    }

    updateUI() { //atualiza contador, status, undo
        document.getElementById('moveCount').textContent = this.moveCount; 
        document.getElementById('undoBtn').disabled = this.undoStack.isEmpty();
        
        const status = document.getElementById('gameStatus');
        status.textContent = this.isGameWon ? ' Nível Finalizado!' : 'Jogando';
    }

    bindEvents() { 
        document.getElementById('gameBoard').addEventListener('click', (e) => {
            const tube = e.target.closest('.tube'); //borda azul
            if (tube) {
                const index = parseInt(tube.dataset.index);
                this.click(index);
            }
        });

        document.getElementById('newGame').onclick = () => {
            this.showMessage(' Novo jogo!', 'success');
            setTimeout(() => this.restartGame(), 800);
        };

        document.getElementById('undoBtn').onclick = () => this.undoMove();
    }

    restartGame() {
        this.initializeGame();
        this.render();
    }

    click(index) {
        if (this.isGameWon) return;

        if (this.selectedTube === null) {
            if (!this.tubes[index].isEmpty()) {
                this.selectedTube = index;
                this.render();
                this.showMessage('Escolha o tubo para a nova cor!', 'selection');
            }
        } else if (this.selectedTube === index) {
            this.selectedTube = null;
            this.render();
        } else {
            if (this.moveColor(this.selectedTube, index)) {
                this.selectedTube = null;
                this.render();
                this.checkWinCondition();
            } else {
                this.showMessage(' Inválido!', 'error');
            }
        }
    }

    moveColor(from, to) {
        const fromTube = this.tubes[from];
        const toTube = this.tubes[to];

        if (fromTube.isEmpty() || toTube.size() === this.maxCapacity) return false;

        const fromTop = fromTube.peek();
        const toTop = toTube.peek();

        if (toTube.isEmpty() || fromTop === toTop) {
            const color = fromTube.pop();
            toTube.push(color);
            
            this.undoStack.push({ from, to, color }); //salva movimento
            this.moveCount++;
            return true;
        }
        return false;
    }

    undoMove() {
        const move = this.undoStack.pop();

        const fromTube = this.tubes[move.to];
        const toTube = this.tubes[move.from];
        
        const color = fromTube.pop();
        toTube.push(color);

        this.moveCount--;
        this.isGameWon = false;
        this.render();
        this.showMessage('Desfeito!', 'success');
    } 


    checkWinCondition() { //verif vitoria
        let won = true;
        
        for (let tube of this.tubes) {
            const state = tube.getState();
            
            // Vazio OU cheio com 1 cor
            if (state.length === 0) continue;
            if (state.length !== this.maxCapacity) {
                won = false;
                break;
            }
            
            // Verificar cor única
            const topColor = state[0];
            for (let color of state) {
                if (color !== topColor) {
                    won = false;
                    break;
                }
            }
            if (!won) break;
        }

        if (won) {
            this.isGameWon = true;
            this.showMessage('Nível Completo!', 'success');
            this.render();
        }
    }

    showMessage(text, type = 'info') {
        const msg = document.getElementById('message');
        msg.textContent = text;
        msg.className = `message ${type}`;
        setTimeout(() => msg.classList.add('hidden'), 10000);
    }

    hideMessage() {
        document.getElementById('message').classList.add('hidden');
    }
}

document.addEventListener('DOMContentLoaded', () => new Jogo()); //