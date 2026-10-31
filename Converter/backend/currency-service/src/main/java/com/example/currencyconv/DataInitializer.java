package com.example.currencyconv;

import com.example.currencyconv.model.CurrencyLog;
import com.example.currencyconv.repository.CurrencyRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDateTime;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner initData(CurrencyRepository repository) {
        return args -> {
            // Check if the database is empty, and if so, add a dummy entry to initialize the database in MongoDB
            if (repository.count() == 0) {
                CurrencyLog log = new CurrencyLog();
                log.setInputAmount(1.0);
                log.setOutputAmount(1.0);
                log.setExchangeRate(1.0);
                log.setInputCurrency("USD");
                log.setOutputCurrency("USD");
                
                repository.save(log);
                System.out.println("Initialized database with a dummy record so the database appears in MongoDB Compass.");
            }
        };
    }
}
