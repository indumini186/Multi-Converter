package com.example.tempconv.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.tempconv.model.Apikey;
import com.example.tempconv.repository.ApiKeyRepository;

import lombok.RequiredArgsConstructor;

/**
 * API Key Management Controller
 *
 * Exposes CRUD endpoints for managing API keys stored in the
 * 'api_keys' collection inside the 'tempconverter' MongoDB database.
 *
 * Base path: /api/keys
 */
@RestController
@RequestMapping("/api/keys")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ApiKeyController {

    private final ApiKeyRepository apiKeyRepository;

    /**
     * GET /api/keys
     * Returns all API keys stored in MongoDB (active and inactive).
     */
    @GetMapping
    public List<Apikey> getAllKeys() {
        return apiKeyRepository.findAll();
    }

    /**
     * POST /api/keys
     * Inserts a new API key into the 'api_keys' collection.
     *
     * Request body:
     * {
     *   "clientName": "My App",
     *   "keyValue":   "my-custom-key-abc123"   (optional — auto-generated if blank)
     * }
     */
    @PostMapping
    public ResponseEntity<Apikey> createKey(@RequestBody ApiKeyRequest request) {
        String keyValue = (request.getKeyValue() != null && !request.getKeyValue().isBlank())
                ? request.getKeyValue().trim()
                : "KEY-" + UUID.randomUUID().toString().toUpperCase().replace("-", "").substring(0, 20);

        Apikey newKey = new Apikey();
        newKey.setKeyValue(keyValue);
        newKey.setClientName(request.getClientName() != null ? request.getClientName().trim() : "Unnamed Client");
        newKey.setActive(true);

        Apikey saved = apiKeyRepository.save(newKey);
        return ResponseEntity.ok(saved);
    }

    /**
     * PATCH /api/keys/{id}/toggle
     * Toggles the active/inactive status of an API key by its MongoDB ID.
     */
    @PatchMapping("/{id}/toggle")
    public ResponseEntity<Apikey> toggleKey(@PathVariable String id) {
        return apiKeyRepository.findById(id)
                .map(key -> {
                    key.setActive(!key.isActive());
                    return ResponseEntity.ok(apiKeyRepository.save(key));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * DELETE /api/keys/{id}
     * Permanently removes an API key from MongoDB by its ID.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteKey(@PathVariable String id) {
        if (!apiKeyRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        apiKeyRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ─── Inner DTO for request body ───────────────────────────────────────────
    public static class ApiKeyRequest {
        private String clientName;
        private String keyValue;

        public String getClientName() { return clientName; }
        public void setClientName(String clientName) { this.clientName = clientName; }
        public String getKeyValue() { return keyValue; }
        public void setKeyValue(String keyValue) { this.keyValue = keyValue; }
    }
}
