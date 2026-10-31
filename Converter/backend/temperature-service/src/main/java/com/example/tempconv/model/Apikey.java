package com.example.tempconv.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Document(collection = "api_keys")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Apikey {
        @Id
        private String id;
        private String keyValue;
        private String clientName;
        private boolean active;
}