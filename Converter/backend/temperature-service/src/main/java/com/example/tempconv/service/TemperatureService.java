package com.example.tempconv.service;

import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Service;

import com.example.tempconv.exception.UnauthorizedException;
import com.example.tempconv.exception.ValidationException;
import com.example.tempconv.model.TemperatureLog;
import com.example.tempconv.repository.ApiKeyRepository;
import com.example.tempconv.repository.TemperatureRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TemperatureService {

    private final TemperatureRepository temperatureRepository;
    private final ApiKeyRepository apiKeyRepository;

    // Accepted unit values for validation
    private static final Set<String> VALID_UNITS = Set.of(
            "CELSIUS", "CELCIUS", "C",
            "FAHRENHEIT", "FARENHEIT", "F"
    );

    /**
     * Verifies that the provided API key is valid and active.
     * Throws UnauthorizedException if the key is null, empty, invalid, or inactive.
     */
    public void verifyApiKey(String apiKey) {
        if (apiKey == null || apiKey.trim().isEmpty()) {
            throw new UnauthorizedException("API Key is missing or empty.");
        }
        apiKeyRepository.findByKeyValueAndActiveTrue(apiKey.trim())
                .orElseThrow(() -> new UnauthorizedException("Invalid or inactive API Key."));
    }

    /**
     * Validates the temperature conversion input.
     * Throws ValidationException with a clear message if input is invalid.
     */
    public void validateInput(double value, String unit) {
        if (unit == null || unit.trim().isEmpty()) {
            throw new ValidationException("Unit must not be null or empty.");
        }
        if (!VALID_UNITS.contains(unit.trim().toUpperCase())) {
            throw new ValidationException(
                    "Invalid unit: '" + unit + "'. Accepted values are: CELSIUS, FAHRENHEIT, C, F.");
        }
        if (value < -273.15 && isCelsiusFamily(unit)) {
            throw new ValidationException(
                    "Temperature cannot be below absolute zero (-273.15°C).");
        }
        if (value < -459.67 && isFahrenheitFamily(unit)) {
            throw new ValidationException(
                    "Temperature cannot be below absolute zero (-459.67°F).");
        }
    }

    public TemperatureLog convertAndSave(double value, String unit) {
        validateInput(value, unit);

        double result;
        String outputUnit;
        if (isCelsiusFamily(unit)) {
            result = value * 1.8 + 32;
            outputUnit = "FAHRENHEIT";
        } else {
            result = (value - 32) * 5 / 9;
            outputUnit = "CELSIUS";
        }

        TemperatureLog log = new TemperatureLog();
        log.setInputTemperature(value);
        log.setOutputTemperature(result);
        log.setInputUnit(unit);
        log.setOutputUnit(outputUnit);
        log.setTimestamp(java.time.LocalDateTime.now().toString());

        return temperatureRepository.save(log);
    }

    public String getSafetyWarning(double value, String unit) {
        String cleanUnit = unit.trim().toUpperCase();
        double celsiusTemp = value;

        // Convert to a standardized unit (Celsius) for uniform evaluation
        if ("FAHRENHEIT".equals(cleanUnit) || "F".equals(cleanUnit)) {
            celsiusTemp = (value - 32) * 5 / 9;
        }

        // Determine the environmental safety message
        if (celsiusTemp >= 38.0) {
            return "Warning: " + value + "" + cleanUnit + " is dangerously HOT! Stay hydrated.";
        } else if (celsiusTemp <= 0.0) {
            return "Warning: " + value + "" + cleanUnit + " is freezing cold! Bundle up";
        } else {
            return "The temperature is comfortable and safe.";
        }
    }

    /**
     * Returns all temperature logs from MongoDB.
     */
    public List<TemperatureLog> getAllLogs() {
        return temperatureRepository.findAll();
    }

    /**
     * Returns filtered temperature logs from MongoDB based on optional unit and date range.
     * All parameters are optional — if null or blank, that filter is skipped.
     *
     * @param unit  e.g. "CELCIUS" or "FAHRENHEIT" — case-insensitive
     * @param from  ISO datetime string e.g. "2026-01-01T00:00:00"
     * @param to    ISO datetime string e.g. "2026-12-31T23:59:59"
     */
    public List<TemperatureLog> getFilteredLogs(String unit, String from, String to) {
        boolean hasUnit = unit != null && !unit.isBlank();
        boolean hasFrom = from != null && !from.isBlank();
        boolean hasTo   = to   != null && !to.isBlank();

        // Use sensible defaults for date range edges if only one side is provided
        String effectiveFrom = hasFrom ? from : "0000-01-01T00:00:00";
        String effectiveTo   = hasTo   ? to   : "9999-12-31T23:59:59";

        if (hasUnit && (hasFrom || hasTo)) {
            return temperatureRepository.findByInputUnitAndTimestampBetween(unit, effectiveFrom, effectiveTo);
        } else if (hasUnit) {
            return temperatureRepository.findByInputUnitIgnoreCase(unit);
        } else if (hasFrom || hasTo) {
            return temperatureRepository.findByTimestampBetween(effectiveFrom, effectiveTo);
        } else {
            return temperatureRepository.findAll();
        }
    }

    // --- Private helpers ---

    private boolean isCelsiusFamily(String unit) {
        String u = unit.trim().toUpperCase();
        return "CELSIUS".equals(u) || "CELCIUS".equals(u) || "C".equals(u);
    }

    private boolean isFahrenheitFamily(String unit) {
        String u = unit.trim().toUpperCase();
        return "FAHRENHEIT".equals(u) || "FARENHEIT".equals(u) || "F".equals(u);
    }
}