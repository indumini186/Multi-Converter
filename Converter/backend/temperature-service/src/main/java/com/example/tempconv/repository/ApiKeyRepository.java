package com.example.tempconv.repository;

import com.example.tempconv.model.Apikey;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface ApiKeyRepository extends MongoRepository<Apikey, String> {
    // Spring Boot auto-generates a query to find the key and verify it is active
    Optional<Apikey> findByKeyValueAndActiveTrue(String keyValue);
}