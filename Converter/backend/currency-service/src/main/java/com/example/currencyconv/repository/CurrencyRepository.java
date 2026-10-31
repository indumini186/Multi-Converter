package com.example.currencyconv.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import com.example.currencyconv.model.CurrencyLog;

@Repository
public interface CurrencyRepository extends MongoRepository<CurrencyLog, String> {

    // Filter by source currency (USD or LKR)
    List<CurrencyLog> findByInputCurrencyIgnoreCase(String inputCurrency);

    // Filter by timestamp range
    @Query("{ 'timestamp': { $gte: ?0, $lte: ?1 } }")
    List<CurrencyLog> findByTimestampBetween(String from, String to);

    // Filter by currency AND timestamp range
    @Query("{ 'inputCurrency': { $regex: ?0, $options: 'i' }, 'timestamp': { $gte: ?1, $lte: ?2 } }")
    List<CurrencyLog> findByInputCurrencyAndTimestampBetween(String inputCurrency, String from, String to);

}
