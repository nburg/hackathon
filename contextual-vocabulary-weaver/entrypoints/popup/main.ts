import './style.css';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <h1>🧪 Storage Layer Test</h1>
    <p style="font-size: 14px; color: #666;">P5 - Algorithm & Data Engineer</p>

    <div class="test-section">
      <button id="test1" type="button">Test 1: Check Storage</button>
      <div id="result1" class="result"></div>
    </div>

    <div class="test-section">
      <button id="test2" type="button">Test 2: Insert Word</button>
      <div id="result2" class="result"></div>
    </div>

    <div class="test-section">
      <button id="test3" type="button">Test 3: Read Word</button>
      <div id="result3" class="result"></div>
    </div>

    <div class="test-section">
      <button id="test4" type="button">Test 4: Update Word</button>
      <div id="result4" class="result"></div>
    </div>

    <div class="test-section">
      <button id="test5" type="button">Test 5: Summary</button>
      <div id="result5" class="result"></div>
    </div>

    <div class="test-section">
      <button id="clear" type="button" style="background: #f44336;">Clear All Data</button>
      <div id="resultClear" class="result"></div>
    </div>
  </div>
`;

// Test 1: Check storage access
document.getElementById('test1')!.addEventListener('click', async () => {
  const resultDiv = document.getElementById('result1')!;
  try {
    const data = await chrome.storage.local.get(null);
    resultDiv.textContent = '✅ Storage accessible!\n' + JSON.stringify(data, null, 2);
    resultDiv.style.color = 'green';
  } catch (error: any) {
    resultDiv.textContent = '❌ Error: ' + error.message;
    resultDiv.style.color = 'red';
  }
});

// Test 2: Insert word
document.getElementById('test2')!.addEventListener('click', async () => {
  const resultDiv = document.getElementById('result2')!;
  try {
    await chrome.storage.local.set({
      word_stats: {
        hello: {
          word: 'hello',
          exposureCount: 1,
          recallFailures: 0,
          firstSeen: Date.now(),
          lastSeen: Date.now(),
          pKnown: 0.0
        }
      }
    });
    resultDiv.textContent = '✅ Word "hello" inserted!\nRun Test 3 to verify.';
    resultDiv.style.color = 'green';
  } catch (error: any) {
    resultDiv.textContent = '❌ Error: ' + error.message;
    resultDiv.style.color = 'red';
  }
});

// Test 3: Read word
document.getElementById('test3')!.addEventListener('click', async () => {
  const resultDiv = document.getElementById('result3')!;
  try {
    const result = await chrome.storage.local.get('word_stats');
    if (result.word_stats?.hello) {
      resultDiv.textContent = '✅ Word retrieved!\n' + JSON.stringify(result.word_stats.hello, null, 2);
      resultDiv.style.color = 'green';
    } else {
      resultDiv.textContent = '⚠️ No data. Run Test 2 first.';
      resultDiv.style.color = 'orange';
    }
  } catch (error: any) {
    resultDiv.textContent = '❌ Error: ' + error.message;
    resultDiv.style.color = 'red';
  }
});

// Test 4: Update word (add failure)
document.getElementById('test4')!.addEventListener('click', async () => {
  const resultDiv = document.getElementById('result4')!;
  try {
    const data = await chrome.storage.local.get('word_stats');
    if (!data.word_stats?.hello) {
      resultDiv.textContent = '⚠️ No data. Run Test 2 first.';
      resultDiv.style.color = 'orange';
      return;
    }

    const stats = data.word_stats;
    stats.hello.exposureCount += 1;
    stats.hello.recallFailures += 1;
    stats.hello.pKnown = (stats.hello.exposureCount - stats.hello.recallFailures) / stats.hello.exposureCount;

    await chrome.storage.local.set({ word_stats: stats });
    resultDiv.textContent = '✅ Updated!\nexposureCount: ' + stats.hello.exposureCount + '\nrecallFailures: ' + stats.hello.recallFailures + '\npKnown: ' + stats.hello.pKnown.toFixed(2);
    resultDiv.style.color = 'green';
  } catch (error: any) {
    resultDiv.textContent = '❌ Error: ' + error.message;
    resultDiv.style.color = 'red';
  }
});

// Test 5: Learning summary
document.getElementById('test5')!.addEventListener('click', async () => {
  const resultDiv = document.getElementById('result5')!;
  try {
    const data = await chrome.storage.local.get('word_stats');
    const statsArray = Object.values(data.word_stats || {}) as any[];

    const summary = {
      total: statsArray.length,
      known: statsArray.filter(s => s.pKnown >= 0.85).length,
      learning: statsArray.filter(s => s.pKnown >= 0.3 && s.pKnown < 0.85).length,
      new: statsArray.filter(s => s.pKnown < 0.3).length
    };

    resultDiv.textContent = `✅ Summary:\nTotal: ${summary.total}\nKnown: ${summary.known}\nLearning: ${summary.learning}\nNew: ${summary.new}`;
    resultDiv.style.color = 'green';
  } catch (error: any) {
    resultDiv.textContent = '❌ Error: ' + error.message;
    resultDiv.style.color = 'red';
  }
});

// Clear all
document.getElementById('clear')!.addEventListener('click', async () => {
  const resultDiv = document.getElementById('resultClear')!;
  try {
    await chrome.storage.local.clear();
    resultDiv.textContent = '✅ All data cleared!';
    resultDiv.style.color = 'green';
  } catch (error: any) {
    resultDiv.textContent = '❌ Error: ' + error.message;
    resultDiv.style.color = 'red';
  }
});
