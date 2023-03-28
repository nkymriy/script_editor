const codeContainer = document.getElementById('code-container');
const codeLine = document.getElementById('code-line');

// 文字を1文字ずつ分割する関数
function splitText(text) {
  return Array.from(text).map(char => {
    const span = document.createElement('span');
    span.textContent = char;
    return span;
  });
}

// 数字だけを含む要素を水色にする関数
function styleDigitSpans(spans) {
  spans.forEach(span => {
    if (/\d/.test(span.textContent)) {
      span.classList.add('digit');
    }
  });
}

// コードの行を更新する関数
function updateCodeLine(code) {
  // 既存の文字を分割した要素を削除する
  codeLine.querySelectorAll('span').forEach(span => span.remove());

  // 新しい文字を分割した要素を作成し、行に追加する
  const textSpans = splitText(code);
  styleDigitSpans(textSpans); // 数字だけを含む要素にスタイルを適用する
  textSpans.forEach(span => codeLine.appendChild(span));
}

// コードを更新する例
const code = 'ping 172.0.0.1 #localhost';
updateCodeLine(code);