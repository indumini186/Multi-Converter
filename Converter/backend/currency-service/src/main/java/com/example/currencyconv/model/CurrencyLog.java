package com.example.currencyconv.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document(collection = "currency_logs")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class CurrencyLog {
    @Id
    private String id;
    private double inputAmount;
    private double outputAmount;
    private double exchangeRate;
    private String inputCurrency;
    private String outputCurrency;
    private String timestamp;
}
