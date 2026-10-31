package com.example.currencyconv.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.example.currencyconv.model.CurrencyLog;
import com.example.currencyconv.repository.CurrencyRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CurrencyService {

    private final CurrencyRepository currencyRepository;

    // Default rate for USD to LKR
    private static final double DEFAULT_USD_TO_LKR_RATE = 300.0;

    public CurrencyLog convertAndSave(double amount, String sourceCurrency) {
        double result;
        String targetCurrency;

        if ("LKR".equalsIgnoreCase(sourceCurrency)) {
            result = amount / DEFAULT_USD_TO_LKR_RATE;
            targetCurrency = "USD";
        } else {
            result = amount * DEFAULT_USD_TO_LKR_RATE;
            sourceCurrency = "USD";
            targetCurrency = "LKR";
        }

        CurrencyLog log = new CurrencyLog();
        log.setInputAmount(amount);
        log.setOutputAmount(result);
        log.setExchangeRate(DEFAULT_USD_TO_LKR_RATE);
        log.setInputCurrency(sourceCurrency);
        log.setOutputCurrency(targetCurrency);
        log.setTimestamp(java.time.LocalDateTime.now().toString());

        return currencyRepository.save(log);
    }

    /**
     * Returns all currency logs from MongoDB.
     */
    public List<CurrencyLog> getAllLogs() {
        return currencyRepository.findAll();
    }

    /**
     * Returns filtered currency logs from MongoDB.
     * All parameters are optional — if null or blank, that filter is skipped.
     *
     * @param currency  e.g. "USD" or "LKR" — case-insensitive input currency filter
     * @param from      ISO datetime string e.g. "2026-01-01T00:00:00"
     * @param to        ISO datetime string e.g. "2026-12-31T23:59:59"
     */
    public List<CurrencyLog> getFilteredLogs(String currency, String from, String to) {
        boolean hasCurrency = currency != null && !currency.isBlank();
        boolean hasFrom     = from     != null && !from.isBlank();
        boolean hasTo       = to       != null && !to.isBlank();

        String effectiveFrom = hasFrom ? from : "0000-01-01T00:00:00";
        String effectiveTo   = hasTo   ? to   : "9999-12-31T23:59:59";

        if (hasCurrency && (hasFrom || hasTo)) {
            return currencyRepository.findByInputCurrencyAndTimestampBetween(currency, effectiveFrom, effectiveTo);
        } else if (hasCurrency) {
            return currencyRepository.findByInputCurrencyIgnoreCase(currency);
        } else if (hasFrom || hasTo) {
            return currencyRepository.findByTimestampBetween(effectiveFrom, effectiveTo);
        } else {
            return currencyRepository.findAll();
        }
    }
}