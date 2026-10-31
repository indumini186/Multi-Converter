package com.example.currencyconv.controller;

import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.currencyconv.model.CurrencyLog;
import com.example.currencyconv.service.CurrencyService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/currency")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CurrencyController {

    private final CurrencyService currencyService;

    /**
     * POST /api/currency/convert
     * Converts a currency amount and saves the log to MongoDB.
     */
    @PostMapping("/convert")
    public CurrencyLog convertCurrency(
            @RequestParam double amount,
            @RequestParam(defaultValue = "USD") String sourceCurrency) {
        return currencyService.convertAndSave(amount, sourceCurrency);
    }

    /**
     * GET /api/currency/logs
     * Returns all currency conversion logs from MongoDB.
     */
    @GetMapping("/logs")
    public List<CurrencyLog> getAllLogs() {
        return currencyService.getAllLogs();
    }

    /**
     * GET /api/currency/logs/filter
     * Returns filtered currency logs from MongoDB.
     *
     * Query params (all optional):
     *   - currency : USD or LKR
     *   - from     : ISO datetime e.g. 2026-01-01T00:00:00
     *   - to       : ISO datetime e.g. 2026-12-31T23:59:59
     *
     * Examples:
     *   /api/currency/logs/filter?currency=USD
     *   /api/currency/logs/filter?from=2026-07-01T00:00:00&to=2026-07-31T23:59:59
     *   /api/currency/logs/filter?currency=LKR&from=2026-07-01T00:00:00&to=2026-07-31T23:59:59
     */
    @GetMapping("/logs/filter")
    public List<CurrencyLog> getFilteredLogs(
            @RequestParam(required = false) String currency,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {
        return currencyService.getFilteredLogs(currency, from, to);
    }
}
