package com.example.tempconv;

import com.example.tempconv.model.Apikey;
import com.example.tempconv.repository.ApiKeyRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private final ApiKeyRepository apiKeyRepository;

    public DatabaseSeeder(ApiKeyRepository apiKeyRepository) {
        this.apiKeyRepository = apiKeyRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        // Ensure developer key exists
        if (apiKeyRepository.findAll().stream().noneMatch(key -> "SUPER-SECRET-DEV-KEY-123".equals(key.getKeyValue()))) {
            Apikey devKey = new Apikey();
            devKey.setKeyValue("SUPER-SECRET-DEV-KEY-123");
            devKey.setClientName("Developer");
            devKey.setActive(true);
            apiKeyRepository.save(devKey);
            System.out.println("Seeded database with active key: SUPER-SECRET-DEV-KEY-123");
        }

        // Ensure expired hacker key exists
        if (apiKeyRepository.findAll().stream().noneMatch(key -> "EXPIRED-HACKER-KEY-999".equals(key.getKeyValue()))) {
            Apikey hackerKey = new Apikey();
            hackerKey.setKeyValue("EXPIRED-HACKER-KEY-999");
            hackerKey.setClientName("Expired Hacker");
            hackerKey.setActive(false);
            apiKeyRepository.save(hackerKey);
            System.out.println("Seeded database with inactive key: EXPIRED-HACKER-KEY-999");
        }
    }
}
