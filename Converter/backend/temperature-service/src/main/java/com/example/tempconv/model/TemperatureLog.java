package com.example.tempconv.model;

import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document
@Data
@AllArgsConstructor
@NoArgsConstructor



public class TemperatureLog {
    private String id;
    private double inputTemperature;
    private double outputTemperature;
    private String inputUnit;
    private String outputUnit;

    private String timestamp;


}
