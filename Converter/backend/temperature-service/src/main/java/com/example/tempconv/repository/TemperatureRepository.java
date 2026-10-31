package com.example.tempconv.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import com.example.tempconv.model.TemperatureLog;

@Repository
public interface TemperatureRepository extends MongoRepository<TemperatureLog, String> {

    // Filter by input unit (CELCIUS or FAHRENHEIT)
    List<TemperatureLog> findByInputUnitIgnoreCase(String inputUnit);

    // Filter by timestamp range (ISO string comparison works because ISO 8601 is lexicographically orderable)
    @Query("{ 'timestamp': { $gte: ?0, $lte: ?1 } }")
    List<TemperatureLog> findByTimestampBetween(String from, String to);

    // Filter by unit AND timestamp range
    @Query("{ 'inputUnit': { $regex: ?0, $options: 'i' }, 'timestamp': { $gte: ?1, $lte: ?2 } }")
    List<TemperatureLog> findByInputUnitAndTimestampBetween(String inputUnit, String from, String to);

}
