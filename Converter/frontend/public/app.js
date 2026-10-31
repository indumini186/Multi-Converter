/**
 * OmniConvert Pro — Core Application Logic
 * Clean, structured JavaScript. Server-side DB filtering via API.
 */
(() => {
    'use strict';

    // ─── DOM Cache ──────────────────────────────────────────────────────────────
    const DOM = {
        // Tabs
        tabButtons:             document.querySelectorAll('.tab-trigger'),
        tabPanels:              document.querySelectorAll('.tab-panel'),

        // Currency Converter
        currencyForm:           document.getElementById('currency-form'),
        currencyAmount:         document.getElementById('currency-amount'),
        currencySource:         document.getElementById('currency-source'),
        currencyInputDecorator: document.getElementById('currency-input-decorator'),
        currencySubmit:         document.getElementById('currency-submit'),
        currencyOutputSymbol:   document.getElementById('currency-output-symbol'),
        currencyOutputValue:    document.getElementById('currency-output-value'),
        rateInfo:               document.getElementById('rate-info'),

        // Temperature Converter
        tempForm:               document.getElementById('temperature-form'),
        tempValue:              document.getElementById('temp-value'),
        tempUnit:               document.getElementById('temp-unit'),
        tempInputDecorator:     document.getElementById('temp-input-decorator'),
        tempSubmit:             document.getElementById('temperature-submit'),
        tempOutputValue:        document.getElementById('temp-output-value'),
        tempOutputUnit:         document.getElementById('temp-output-unit'),
        tempInfoText:           document.getElementById('temp-info-text'),
        safetyBanner:           document.getElementById('safety-warning-banner'),
        safetyText:             document.getElementById('safety-warning-text'),

        // Audit Logs
        logType:                document.getElementById('log-type'),
        currencyLogFilterGroup: document.getElementById('currency-log-filter-group'),
        currencyLogFilter:      document.getElementById('currency-log-filter'),
        tempLogFilterGroup:     document.getElementById('temp-log-filter-group'),
        tempLogFilter:          document.getElementById('temp-log-filter'),
        logDateFrom:            document.getElementById('log-date-from'),
        logDateTo:              document.getElementById('log-date-to'),
        applyFilterBtn:         document.getElementById('apply-filter-btn'),
        resultsCount:           document.getElementById('results-count'),
        refreshLogsBtn:         document.getElementById('refresh-logs-btn'),
        logsTbody:              document.getElementById('logs-tbody'),
    };

    // ─── State ──────────────────────────────────────────────────────────────────
    const state = {
        isConvertingCurrency: false,
        isConvertingTemp:     false,
        isFetchingLogs:       false,
    };

    // ─── Init ────────────────────────────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', () => {
        setupEventListeners();
        syncInputDecorators();
        fetchLogs();
    });

    // ─── Event Listeners ─────────────────────────────────────────────────────────
    function setupEventListeners() {

        // ── Tab Switching ──────────────────────────────────────────────────────
        DOM.tabButtons.forEach(button => {
            button.addEventListener('click', e => {
                const trigger    = e.currentTarget;
                const targetTabId = trigger.getAttribute('data-tab');

                DOM.tabButtons.forEach(btn => {
                    btn.classList.remove('active');
                    btn.setAttribute('aria-selected', 'false');
                });

                trigger.classList.add('active');
                trigger.setAttribute('aria-selected', 'true');

                DOM.tabPanels.forEach(panel => panel.classList.remove('active'));
                document.getElementById(targetTabId).classList.add('active');

                if (targetTabId === 'logs-panel') fetchLogs();
            });
        });

        // ── Currency ───────────────────────────────────────────────────────────
        DOM.currencySource.addEventListener('change', () => {
            syncInputDecorators();
            DOM.currencyOutputValue.textContent = '0.00';
            DOM.currencyOutputSymbol.textContent = DOM.currencySource.value === 'USD' ? 'Rs.' : '$';
        });

        DOM.currencyAmount.addEventListener('input', () => {
            DOM.currencyAmount.classList.remove('input-invalid');
        });

        DOM.currencyForm.addEventListener('submit', e => {
            e.preventDefault();
            convertCurrency();
        });

        // ── Temperature ────────────────────────────────────────────────────────
        DOM.tempUnit.addEventListener('change', () => {
            syncInputDecorators();
            DOM.tempOutputValue.textContent = '0.00';
            DOM.tempOutputUnit.textContent   = DOM.tempUnit.value === 'C' ? '°F' : '°C';
            DOM.safetyBanner.style.display   = 'none';
        });

        DOM.tempValue.addEventListener('input', () => {
            DOM.tempValue.classList.remove('input-invalid');
        });

        DOM.tempForm.addEventListener('submit', e => {
            e.preventDefault();
            convertTemperature();
        });

        // ── Audit Logs Controls ────────────────────────────────────────────────
        DOM.logType.addEventListener('change', () => {
            toggleLogFilterVisibility();
            fetchLogs();
        });

        // Apply filter button — triggers server-side filtered fetch
        DOM.applyFilterBtn.addEventListener('click', () => fetchLogs());

        // Refresh button — clears filters and reloads all logs
        DOM.refreshLogsBtn.addEventListener('click', () => {
            DOM.currencyLogFilter.value = '';
            DOM.tempLogFilter.value     = '';
            DOM.logDateFrom.value       = '';
            DOM.logDateTo.value         = '';
            fetchLogs();
        });
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────────

    function syncInputDecorators() {
        DOM.currencyInputDecorator.textContent = DOM.currencySource.value === 'USD' ? '$' : 'Rs.';
        DOM.tempInputDecorator.textContent     = DOM.tempUnit.value === 'C' ? '°C' : '°F';
    }

    function toggleLogFilterVisibility() {
        if (DOM.logType.value === 'temperature') {
            DOM.tempLogFilterGroup.style.display     = 'flex';
            DOM.currencyLogFilterGroup.style.display = 'none';
        } else {
            DOM.currencyLogFilterGroup.style.display = 'flex';
            DOM.tempLogFilterGroup.style.display     = 'none';
        }
    }

    /**
     * Smoothly animate a number from start to end.
     */
    function animateNumber(element, start, end, duration = 700) {
        let startTimestamp = null;
        const step = timestamp => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress      = Math.min((timestamp - startTimestamp) / duration, 1);
            const easeOutQuart  = 1 - Math.pow(1 - progress, 4);
            const current       = start + (end - start) * easeOutQuart;
            element.textContent = current.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            });
            if (progress < 1) window.requestAnimationFrame(step);
        };
        window.requestAnimationFrame(step);
    }

    // ─── Currency Conversion ──────────────────────────────────────────────────────
    async function convertCurrency() {
        const amountStr = DOM.currencyAmount.value.trim();
        const amount    = parseFloat(amountStr);

        if (amountStr === '' || isNaN(amount) || amount < 0) {
            DOM.currencyAmount.classList.add('input-invalid');
            DOM.currencyAmount.focus();
            return;
        }

        if (state.isConvertingCurrency) return;
        state.isConvertingCurrency = true;

        DOM.currencySubmit.disabled = true;
        DOM.currencySubmit.querySelector('span').textContent = 'Processing…';
        DOM.currencySubmit.querySelector('i').className = 'fa-solid fa-circle-notch fa-spin';
        DOM.rateInfo.textContent = 'Contacting conversion service…';

        try {
            const sourceCurrency = DOM.currencySource.value;
            const response = await fetch(
                `/api/currency/convert?amount=${amount}&sourceCurrency=${sourceCurrency}`,
                { method: 'POST' }
            );

            if (!response.ok) throw new Error('Conversion API failed');

            const data           = await response.json();
            const targetCurrency = sourceCurrency === 'USD' ? 'LKR' : 'USD';

            DOM.currencyOutputSymbol.textContent = targetCurrency === 'LKR' ? 'Rs.' : '$';
            animateNumber(DOM.currencyOutputValue, 0, data.outputAmount);
            DOM.rateInfo.innerHTML = `Rate: 1 USD = <strong>${data.exchangeRate.toFixed(2)}</strong> LKR`;

        } catch (error) {
            console.error('Currency error:', error);
            DOM.currencyOutputValue.textContent = 'Error';
            DOM.currencyOutputSymbol.textContent = '';
            DOM.rateInfo.textContent = 'Service unavailable. Verify the currency microservice is running.';
        } finally {
            state.isConvertingCurrency = false;
            DOM.currencySubmit.disabled = false;
            DOM.currencySubmit.querySelector('span').textContent = 'Convert Currency';
            DOM.currencySubmit.querySelector('i').className = 'fa-solid fa-arrow-right-long btn-arrow';
        }
    }

    // ─── Temperature Conversion ───────────────────────────────────────────────────
    async function convertTemperature() {
        const tempStr = DOM.tempValue.value.trim();
        const value   = parseFloat(tempStr);

        if (tempStr === '' || isNaN(value)) {
            DOM.tempValue.classList.add('input-invalid');
            DOM.tempValue.focus();
            return;
        }

        if (state.isConvertingTemp) return;
        state.isConvertingTemp = true;

        DOM.tempSubmit.disabled = true;
        DOM.tempSubmit.querySelector('span').textContent = 'Processing…';
        DOM.tempSubmit.querySelector('i').className = 'fa-solid fa-circle-notch fa-spin';
        DOM.tempInfoText.textContent = 'Calculating…';
        DOM.safetyBanner.style.display = 'none';

        try {
            const unit      = DOM.tempUnit.value;
            const unitParam = unit === 'C' ? 'CELCIUS' : 'FAHRENHEIT';

            const response = await fetch(
                `/api/temperature/convert?value=${value}&unit=${unitParam}`,
                { method: 'POST' }
            );

            if (!response.ok) {
                let errorMsg = 'Temperature conversion failed';
                try {
                    const errData = await response.json();
                    errorMsg = errData.message || errorMsg;
                } catch (_) {}
                throw new Error(errorMsg);
            }

            const data       = await response.json();
            const targetUnit = unit === 'C' ? '°F' : '°C';

            DOM.tempOutputUnit.textContent = targetUnit;
            animateNumber(DOM.tempOutputValue, 0, data.outputTemperature);
            DOM.tempInfoText.innerHTML = `Converted from <strong>${value}°${unit}</strong>`;

            await runSafetyCheck(value, unitParam);

        } catch (error) {
            console.error('Temperature error:', error);
            DOM.tempOutputValue.textContent = 'Error';
            DOM.tempOutputUnit.textContent  = '';
            DOM.tempInfoText.textContent = error.message || 'Service offline. Verify the temperature microservice.';
        } finally {
            state.isConvertingTemp = false;
            DOM.tempSubmit.disabled = false;
            DOM.tempSubmit.querySelector('span').textContent = 'Convert Temperature';
            DOM.tempSubmit.querySelector('i').className = 'fa-solid fa-arrow-right-long btn-arrow';
        }
    }

    async function runSafetyCheck(value, unitParam) {
        try {
            const response = await fetch(`/api/temperature/safety-check?value=${value}&unit=${unitParam}`);
            if (!response.ok) return;

            const warningMsg  = await response.text();
            DOM.safetyText.textContent = warningMsg;

            // Reset modifier classes
            DOM.safetyBanner.className = 'safety-banner';
            const lower = warningMsg.toLowerCase();
            let iconClass = 'fa-solid fa-circle-check';

            if (lower.includes('hot')) {
                DOM.safetyBanner.classList.add('hot');
                iconClass = 'fa-solid fa-fire';
            } else if (lower.includes('cold') || lower.includes('freezing')) {
                DOM.safetyBanner.classList.add('cold');
                iconClass = 'fa-solid fa-snowflake';
            } else {
                DOM.safetyBanner.classList.add('safe');
            }

            DOM.safetyBanner.querySelector('.safety-icon-wrapper i').className = iconClass;
            DOM.safetyBanner.style.display = 'flex';

        } catch (err) {
            console.warn('Safety check skipped:', err);
        }
    }

    // ─── Audit Logs ───────────────────────────────────────────────────────────────

    /**
     * Builds query params for the filter endpoint from the UI controls.
     * Sends the request to the backend — MongoDB does the actual filtering.
     */
    async function fetchLogs() {
        if (state.isFetchingLogs) return;
        state.isFetchingLogs = true;

        DOM.refreshLogsBtn.disabled    = true;
        DOM.applyFilterBtn.disabled    = true;
        DOM.resultsCount.textContent   = '';
        DOM.refreshLogsBtn.querySelector('i').className = 'fa-solid fa-circle-notch fa-spin';

        DOM.logsTbody.innerHTML = `
            <tr>
                <td colspan="2" class="empty-state">
                    <div class="empty-icon"><i class="fa-solid fa-circle-notch fa-spin"></i></div>
                    <p>Querying database&hellip;</p>
                </td>
            </tr>
        `;

        const logType = DOM.logType.value;

        try {
            // Build the filter URL with only params that have values
            const params = new URLSearchParams();

            if (logType === 'currency') {
                const currency = DOM.currencyLogFilter.value.trim();
                if (currency) params.set('currency', currency);
            } else {
                const unit = DOM.tempLogFilter.value.trim();
                if (unit) params.set('unit', unit);
            }

            // Date range — convert local date strings to ISO datetime strings
            const fromDate = DOM.logDateFrom.value;
            const toDate   = DOM.logDateTo.value;
            if (fromDate) params.set('from', `${fromDate}T00:00:00`);
            if (toDate)   params.set('to',   `${toDate}T23:59:59`);

            // Choose endpoint: filtered (with params) or plain all-logs
            const hasFilters = params.toString().length > 0;
            let url;

            if (logType === 'currency') {
                url = hasFilters
                    ? `/api/currency/logs/filter?${params.toString()}`
                    : '/api/currency/logs';
            } else {
                url = hasFilters
                    ? `/api/temperature/logs/filter?${params.toString()}`
                    : '/api/temperature/logs';
            }

            const response = await fetch(url);
            if (!response.ok) throw new Error('Logs API failed');

            const logs = await response.json();
            logs.reverse(); // newest first

            DOM.resultsCount.textContent = `${logs.length} record${logs.length !== 1 ? 's' : ''} found`;

            if (logs.length === 0) {
                DOM.logsTbody.innerHTML = `
                    <tr>
                        <td colspan="2" class="empty-state">
                            <div class="empty-icon"><i class="fa-solid fa-folder-open"></i></div>
                            <p>No logs match the selected filters.</p>
                        </td>
                    </tr>
                `;
                return;
            }

            // Render rows
            const rowsHtml = logs.map(log => {
                const date    = log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A';
                let details   = '';

                if (logType === 'currency') {
                    const inp = parseFloat(log.inputAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    const out = parseFloat(log.outputAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    details = `${inp} ${log.inputCurrency} &rarr; ${out} ${log.outputCurrency}`;
                } else {
                    const inp   = parseFloat(log.inputTemperature).toFixed(1);
                    const out   = parseFloat(log.outputTemperature).toFixed(2);
                    const inU   = log.inputUnit.charAt(0).toUpperCase();
                    const outU  = log.outputUnit.charAt(0).toUpperCase();
                    details = `${inp}&deg;${inU} &rarr; ${out}&deg;${outU}`;
                }

                return `
                    <tr>
                        <td><div class="log-date">${date}</div></td>
                        <td><div class="log-details">${details}</div></td>
                    </tr>
                `;
            }).join('');

            DOM.logsTbody.innerHTML = rowsHtml;

        } catch (error) {
            console.error('Logs fetch error:', error);
            DOM.logsTbody.innerHTML = `
                <tr>
                    <td colspan="2" class="empty-state" style="color: var(--red-500);">
                        <div class="empty-icon" style="color: var(--red-500);">
                            <i class="fa-solid fa-triangle-exclamation"></i>
                        </div>
                        <p>Failed to load logs. Is the ${logType} service running?</p>
                    </td>
                </tr>
            `;
            DOM.resultsCount.textContent = '';
        } finally {
            state.isFetchingLogs = false;
            DOM.refreshLogsBtn.disabled = false;
            DOM.applyFilterBtn.disabled = false;
            DOM.refreshLogsBtn.querySelector('i').className = 'fa-solid fa-arrow-rotate-right';
        }
    }

})();
