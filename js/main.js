let WORD = ''; // 正解の単語
let trimmedWORD = ''; // 空白を除外した正解の単語
let normalizedWORD = ''; // 正解の単語の正規化版
let hints = []; // ヒント
let hintIndex = 0;
let currentGuess = '';
let attempts = 0; //ユーザーの試行回数
let maxAttempts = 0; //最大試行回数
let maxAttemptsNormal = 12; // ノーマルモードの最大試行回数
let maxAttemptsHard = 8; // ハードモードの最大試行回数
let maxWordLength = 5; // 単語の文字数
let gameEnded = false; // ゲームの状態を示すフラグ
let isAnimating = false; // アニメーション中かどうかを示すフラグ
let selectedDifficulty = 'normal'; // デフォルトはノーマルモード

document.getElementById('giveup-button').addEventListener('click', handleGiveUpOrReset);
document.getElementById('guess-button').addEventListener('click', makeGuess);
document.getElementById('hint-button').addEventListener('click', showHint);
document.getElementById('guess-input').addEventListener('input', (e) => {
    currentGuess = e.target.value;
});

// HTMLファイルが読み込まれた後、すぐに実行される部分
document.addEventListener("DOMContentLoaded", function() {
    // モーダルを非表示にする
    document.getElementById('modal').style.display = 'none';

    // info-icon をクリックしたときの処理を追加
    document.getElementById('info-icon').addEventListener('click', function() {
        // モーダルを表示する
        document.getElementById('modal').style.display = 'block';
    });

    // close-button をクリックしたときの処理を追加
    document.querySelector('.close-button').addEventListener('click', function() {
        // モーダルを非表示にする
        document.getElementById('modal').style.display = 'none';
    });

    // デフォルトでノーマルモードをセットアップ
    setupNormalMode();

    const difficultySelect = document.getElementById('difficulty-select');
    const guessInput = document.getElementById('guess-input');
    const grid = document.getElementById('grid');

    difficultySelect.addEventListener('change', (event) => {
        selectedDifficulty = event.target.value;
        updatePlaceholder();
    });

    function updatePlaceholder() {
        if (selectedDifficulty === 'hard') {
            guessInput.placeholder = '6文字のカード名';
            grid.classList.remove('normal-mode');
            grid.classList.add('hard-mode');
        } else {
            guessInput.placeholder = '5文字のカード名';
            grid.classList.remove('hard-mode');
            grid.classList.add('normal-mode');
        }
    }

    updatePlaceholder();  // 初期状態で適切なプレースホルダーを設定
});

// 難易度を切り替えるプルダウンメニューの変更イベント
document.getElementById('difficulty-select').addEventListener('change', function() {
    selectedDifficulty = this.value; // 選択された難易度を更新
    if (selectedDifficulty === 'normal') {
        setupNormalMode();
    } else if (selectedDifficulty === 'hard') {
        setupHardMode();
    }
});

// ノーマルモードのセットアップ
function setupNormalMode() {
    maxWordLength = 5; // 単語の文字数を設定
    maxAttempts = maxAttemptsNormal; // 最大試行回数を設定
    initializeGrid(5); // グリッドを初期化
    resetGame();
    document.getElementById('hint-button').disabled = false; // ヒントボタンを有効化
}

// ハードモードのセットアップ
function setupHardMode() {
    maxWordLength = 6; // 単語の文字数を設定
    maxAttempts = maxAttemptsHard; // 最大試行回数を設定
    initializeGrid(6); // グリッドを初期化
    resetGame();
    document.getElementById('hint-button').disabled = true; // ヒントボタンを無効化
}

// JSONファイルから単語データを読み込む関数
function fetchWordData() {
    let url = ''; // URLを初期化

    if (selectedDifficulty === 'normal') {
        url = 'assets/words5.json'; // ノーマルモード用のURL
    } else if (selectedDifficulty === 'hard') {
        url = 'assets/words6.json'; // ハードモード用のURL
    }

    fetch(url)
        .then(response => response.json())
        .then(data => {
            const randomIndex = Math.floor(Math.random() * data.length);
            const selectedWord = data[randomIndex];
            WORD = selectedWord.name; // 正解の単語を保持
            trimmedWORD = WORD.replace(/\s/g, ''); // 空白を除外した単語を保持
            normalizedWORD = normalizeString(trimmedWORD); // 正解の単語を正規化して保持

            // カンニング用
            // console.log(normalizedWORD);
            
            // ヒントを設定
            hints = [
                selectedWord.hint1,
                selectedWord.hint2,
                selectedWord.hint3.substring(0, 10),
                trimmedWORD.charAt(trimmedWORD.length - 1),
                selectedWord.hint3.substring(0, 20),
                trimmedWORD.charAt(trimmedWORD.length - 5)
            ];

            // ハードモードの場合は最初からヒントを表示
            if (selectedDifficulty === 'hard') {
                const hint1Elem = document.getElementById('hint1').querySelector('.hint-text');
                const hint2Elem = document.getElementById('hint2').querySelector('.hint-text');
                const hint3Elem = document.getElementById('hint3').querySelector('.hint-text');
                const hint3LabelElem = document.getElementById('hint3').querySelector('.hint-label');
                const hint4Elem = document.getElementById('hint4').querySelector('.hint-text');
                const hint4LabelElem = document.getElementById('hint4').querySelector('.hint-label');
                const hint5Elem = document.getElementById('hint5');
                const hint6Elem = document.getElementById('hint6');

                if (hint1Elem) hint1Elem.textContent = hints[0];
                if (hint2Elem) hint2Elem.textContent = hints[1];
                
                // 漢字の数を計算してヒント3に表示
                const kanjiCount = trimmedWORD.match(/[\u4e00-\u9faf\u3400-\u4dbf]/g)?.length || 0;
                if (hint3LabelElem) hint3LabelElem.textContent = "漢字の登場数：";
                if (hint3Elem) hint3Elem.textContent = kanjiCount;

                if (hint4Elem) hint4Elem.textContent = selectedWord.hint3.slice(-10);
                if (hint4LabelElem) hint4LabelElem.textContent = "効果10文字（後ろから）：";

                if (hint5Elem) hint5Elem.style.display = 'none'; // 効果20文字を非表示
                if (hint6Elem) hint6Elem.style.display = 'none'; // カード名の最初を非表示

                // hint4 に hard-mode クラスを追加
                document.getElementById('hint4').classList.add('hard-mode'); 
                
                hintIndex = 0; // ハードモードではヒントインデックスを0に設定
            } else {
                // ノーマルモードの場合、非表示だったヒントを再表示
                document.getElementById('hint4').style.display = '';
                document.getElementById('hint5').style.display = '';
                document.getElementById('hint6').style.display = '';
                document.getElementById('hint3').querySelector('.hint-label').textContent = "効果10文字：";
                document.getElementById('hint4').classList.remove('hard-mode'); // hint3 から hard-mode クラスを削除
            }
        })
    .catch(error => console.error('Error loading JSON:', error));
}

// 初期の空グリッドを生成する関数
function initializeGrid(wordLength) {
    const grid = document.getElementById('grid');
    grid.innerHTML = ''; // グリッドを初期化
    for (let i = 0; i < maxAttempts; i++) {
        const row = document.createElement('div');
        row.classList.add('row');
        for (let j = 0; j < wordLength; j++) {
            const cell = document.createElement('div');
            cell.classList.add('cell', 'empty');
            row.appendChild(cell);
        }
        grid.appendChild(row);
    }
}

// 推測を行う関数
function makeGuess() {
    if (gameEnded || isAnimating) return; // ゲームが終了している、またはアニメーション中の場合は推測を受け付けない

    if (currentGuess.length !== maxWordLength) {
        alert(`${maxWordLength}文字のカード名を入力してください！`);
        return;
    }

    isAnimating = true; // アニメーション中のフラグを立てる
    document.getElementById('guess-input').disabled = true; // テキストエリアを無効化

    // 推測した文字列を1文字ずつに分割
    const guessCharacters = currentGuess.split('');

    const grid = document.getElementById('grid');
    const row = grid.children[attempts];
    const cells = row.children;

    // 推測した文字を1文字ずつ表示
    guessCharacters.forEach((char, index) => {
        setTimeout(() => {
            const cell = cells[index];
            const normalizedChar = normalizeString(char);

            // 正解の文字と比較して色を決定する
            if (normalizedChar === normalizedWORD[index]) {
                cell.textContent = char; // ユーザーの入力をそのまま表示
                cell.classList.add('green'); // 文字と位置が一致
            } else if (normalizedWORD.includes(normalizedChar)) {
                cell.textContent = char; // ユーザーの入力をそのまま表示
                cell.classList.add('yellow'); // 文字のみ一致
            } else {
                cell.textContent = char; // ユーザーの入力をそのまま表示
                cell.classList.add('gray'); // 不一致
            }

            // 最後の文字を表示したら判定
            if (index === guessCharacters.length - 1) {
                isAnimating = false; // アニメーション終了
                document.getElementById('guess-input').disabled = false; // テキストエリアを再び有効化
                checkGameStatus();
            }
        }, index * 400); // 各文字を0.4秒ごとに表示
    });

    attempts++;

    document.getElementById('guess-input').value = '';
}

// ヒントを表示する関数
function showHint() {
    if (hintIndex < hints.length) {
        document.getElementById(`hint${hintIndex + 1}`).querySelector('.hint-text').textContent = hints[hintIndex];
        hintIndex++;
    }

    if (hintIndex === hints.length) {
        document.getElementById('hint-button').disabled = true;
        document.getElementById('hint-button').style.backgroundColor = 'gray';
    }
}

// フォームの submit イベントを利用して ENTER キーを GUESS ボタンのクリックとして扱う
document.getElementById('guess-form').addEventListener('submit', function(event) {
    event.preventDefault(); // デフォルトの submit イベントをキャンセル
    makeGuess(); // GUESS ボタンのクリックをシミュレート
});

// ゲームをリセットする関数
function resetGame() {
    // ゲーム状態のリセット
    WORD = '';
    trimmedWORD = '';
    normalizedWORD = '';
    hints = [];
    currentGuess = '';
    attempts = 0;
    hintIndex = 0;
    gameEnded = false;
    isAnimating = false;

    // グリッドの初期化
    initializeGrid(maxWordLength);

    // ヒントの初期化
    document.querySelectorAll('.hint-text').forEach(hint => {
        hint.textContent = '';
    });

    // ボタンの初期化
    document.getElementById('hint-button').disabled = false;
    document.getElementById('hint-button').style.backgroundColor = '';
    document.getElementById('giveup-button').textContent = 'ギブアップ';
    document.getElementById('guess-input').disabled = false;
    document.getElementById('guess-button').disabled = false;

    // ハードモードの場合はヒントボタンを無効化
    if (selectedDifficulty === 'hard') {
        document.getElementById('hint-button').disabled = true;
        document.getElementById('hint-button').style.backgroundColor = 'gray';
    }

    // 次の単語の設定
    fetchWordData();
}

// ゲームをリセットまたはリスタートする関数
function handleGiveUpOrReset() {
    if (gameEnded) {
        // リセット処理
        resetGame();
    } else {
        // ギブアップ処理
        gameEnded = true;
        showModal(true); // ゲームオーバー時のモーダル表示
        document.getElementById('giveup-button').textContent = 'リセット';
    }
}

// 文字列を正規化する関数
function normalizeString(str) {
    // 全角半角を統一して、ひらがなをカタカナに変換する
    return str.toLowerCase().replace(/[Ａ-Ｚａ-ｚ０-９]/g, function(s) {
        return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
    }).replace(/[ぁ-ん]/g, function(s) {
        return String.fromCharCode(s.charCodeAt(0) + 0x60);
    });
}

// モーダルを表示する関数
function showModal(isGameOver) {
    const modal = document.createElement('div');
    modal.classList.add('modal');
    
    const content = document.createElement('div');
    content.classList.add('modal-content');
    
    let message = '';
    let tweetUrl = '';
    let hardModeText = selectedDifficulty === 'hard' ? 'ハードモードの ' : '';

    if (isGameOver) {
        // ゲームオーバー時のメッセージ
        message = `ゲームオーバー！<br><br>正解は... <span style="color: red; font-size: 30px;">${WORD}</span>`;
        tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`ゲームオーバー！\n${hardModeText}#遊戯王Wordle で「${WORD}」を推測できなかった...\nhttps://3zukie.github.io/YugiohWordle/`)}`;
    } else {
        // クリア時のメッセージ
        message = `<span style="color: green; font-size: 30px; text-transform: uppercase;">クリア！</span><br><br><span style="color: red; font-size: 30px;">${WORD.toUpperCase()}</span>を的中しました！<br><br>${attempts}回目の推測<br>使用したヒントの回数：${hintIndex}`;
        tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${hardModeText}#遊戯王Wordle で${WORD}を${attempts}手で推測したよ！\n使用したヒントの回数：${hintIndex}回\nhttps://3zukie.github.io/YugiohWordle/`)}`;
    }

    const messageText = document.createElement('div');
    messageText.style.fontWeight = 'bold';
    messageText.style.fontSize = '24px'; // メッセージ全体の文字サイズを大きく
    messageText.innerHTML = message;

    content.appendChild(messageText);
    
    const closeButton = document.createElement('button');
    closeButton.textContent = '×'; // 閉じるボタン
    closeButton.classList.add('close-button');
    closeButton.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // 閉じるボタンをモーダル右上に配置
    content.style.position = 'relative';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '10px';
    closeButton.style.right = '10px';
    
    const tweetButton = document.createElement('button');
    tweetButton.textContent = 'Tweet'; // ツイートボタン
    tweetButton.style.fontSize = '20px'; // ボタンのテキストサイズを大きくする
    tweetButton.addEventListener('click', () => {
        window.open(tweetUrl, '_blank');
    });
    
    content.appendChild(closeButton);
    content.appendChild(tweetButton);
    modal.appendChild(content);
    
    document.body.appendChild(modal);

    // ゲーム終了時にGUESSボタンを無効化
    if (gameEnded) {
        document.getElementById('guess-button').disabled = true;
    }
}

// ゲームの状態をチェックして、ゲームオーバーかクリアかを判定する関数
function checkGameStatus() {
    if (normalizeString(currentGuess) === normalizedWORD) {
        gameEnded = true;
        showModal(false); // クリア時のモーダル表示
    } else if (attempts === maxAttempts) {
        gameEnded = true;
        showModal(true); // ゲームオーバー時のモーダル表示
    }
}