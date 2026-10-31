package com.example.tempconv.controller;

import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.tempconv.model.TemperatureLog;
import com.example.tempconv.service.TemperatureService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/temperature")
@CrossOrigin
@RequiredArgsConstructor
public class TemperatureController {

    private final TemperatureService temperatureService;

    /**
     * POST /api/temperature/convert
     * Converts a temperature value and saves the log to MongoDB.
     */
    @PostMapping("/convert")
    public TemperatureLog convertTemperature(
            @RequestHeader("X-API-Key") String apiKey,
            @RequestParam double value,
            @RequestParam String unit) {
        temperatureService.verifyApiKey(apiKey);
        return temperatureService.convertAndSave(value, unit);
    }

    /**
     * GET /api/temperature/logs
     * Returns all temperature conversion logs from MongoDB.
     */
    @GetMapping("/logs")
    public List<TemperatureLog> getAllLogs() {
        return temperatureService.getAllLogs();
    }

    /**
     * GET /api/temperature/logs/filter
     * Returns filtered temperature logs from MongoDB.
     *
     * Query params (all optional):
     *   - unit   : CELCIUS or FAHRENHEIT
     *   - from   : ISO datetime e.g. 2026-01-01T00:00:00
     *   - to     : ISO datetime e.g. 2026-12-31T23:59:59
     *
     * Examples:
     *   /api/temperature/logs/filter?unit=CELCIUS
     *   /api/temperature/logs/filter?from=2026-07-01T00:00:00&to=2026-07-31T23:59:59
     *   /api/temperature/logs/filter?unit=FAHRENHEIT&from=2026-07-01T00:00:00&to=2026-07-31T23:59:59
     */
    @GetMapping("/logs/filter")
    public List<TemperatureLog> getFilteredLogs(
            @RequestParam(required = false) String unit,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {
        return temperatureService.getFilteredLogs(unit, from, to);
    }

    /**
     * GET /api/temperature/safety-check
     * Returns a safety warning message for the given temperature.
     */
    @GetMapping("/safety-check")
    public String checkTemperatureSafety(
            @RequestParam double value,
            @RequestParam String unit) {
        return temperatureService.getSafetyWarning(value, unit);
    }
}
