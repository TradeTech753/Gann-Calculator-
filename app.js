document.addEventListener('DOMContentLoaded', () => {
    const refPriceInput = document.getElementById('ref-price');
    const divFactorSelect = document.getElementById('div-factor');
    const maxIntervalInput = document.getElementById('max-interval');
    const btnCalc = document.getElementById('btn-calc');
    const btnReset = document.getElementById('btn-reset');
    const presetBtns = document.querySelectorAll('.preset-btn');
    const validationMsg = document.getElementById('validation-msg');
    
    const resultsPanel = document.getElementById('results-panel');
    const summRef = document.getElementById('summ-ref');
    const summDiv = document.getElementById('summ-div');
    const summNorm = document.getElementById('summ-norm');
    const outdatedWarning = document.getElementById('outdated-warning');
    const tableBody = document.getElementById('table-body');

    let lastCalculatedState = null;

    // Service Worker Registration for Offline Support
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js').catch(err => console.error('SW init failed:', err));
        });
    }

    const numberFormat = new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 2, maximumFractionDigits: 2
    });

    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            maxIntervalInput.value = btn.dataset.val;
            markOutdated();
        });
    });

    [refPriceInput, divFactorSelect, maxIntervalInput].forEach(el => 
        el.addEventListener('input', markOutdated)
    );

    btnReset.addEventListener('click', () => {
        refPriceInput.value = '';
        divFactorSelect.value = '100';
        maxIntervalInput.value = '1.00';
        validationMsg.classList.add('hidden');
        resultsPanel.classList.add('hidden');
        outdatedWarning.classList.add('hidden');
        lastCalculatedState = null;
    });

    btnCalc.addEventListener('click', () => {
        validationMsg.classList.add('hidden');
        
        const pRaw = refPriceInput.value.trim();
        const dRaw = divFactorSelect.value;
        const tRaw = maxIntervalInput.value;

        if (!pRaw || isNaN(pRaw)) return showError("Please enter a numeric Reference Price.");
        const p = parseFloat(pRaw);
        if (p <= 0) return showError("Reference Price must be greater than zero.");

        const d = parseInt(dRaw, 10);
        if (d !== 10 && d !== 100) return showError("Dividing Factor must be 10 or 100.");

        let maxT = parseFloat(tRaw);
        if (isNaN(maxT) || maxT <= 0 || (maxT % 0.25 !== 0)) return showError("Maximum Interval must be a positive multiple of 0.25.");
        if (maxT > 25) maxT = 25; // Prevent excessive DOM generation freeze
        
        // --- Core Methodology Calculation ---
        const n = p / d;
        const s = Math.sqrt(n);

        summRef.textContent = p;
        summDiv.textContent = d;
        summNorm.textContent = n.toFixed(2);
        tableBody.innerHTML = ''; 

        for (let t = 0.25; t <= maxT + 0.001; t += 0.25) {
            const upsideVal = Math.pow(s + t, 2) * d;
            const downsideVal = Math.pow(s - t, 2) * d; // Formula dictates (S - T)² even if negative

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${t.toFixed(2)}</td>
                <td>${numberFormat.format(upsideVal)}</td>
                <td>${numberFormat.format(downsideVal)}</td>
            `;
            tableBody.appendChild(tr);
        }

        lastCalculatedState = { p: pRaw, d: dRaw, t: tRaw };
        outdatedWarning.classList.add('hidden');
        resultsPanel.classList.remove('hidden');
        resultsPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });

    function markOutdated() {
        if (!lastCalculatedState) return;
        if (refPriceInput.value !== lastCalculatedState.p || 
            divFactorSelect.value !== lastCalculatedState.d || 
            maxIntervalInput.value !== lastCalculatedState.t) {
            outdatedWarning.classList.remove('hidden');
        } else {
            outdatedWarning.classList.add('hidden');
        }
    }

    function showError(msg) {
        validationMsg.textContent = msg;
        validationMsg.classList.remove('hidden');
    }
});