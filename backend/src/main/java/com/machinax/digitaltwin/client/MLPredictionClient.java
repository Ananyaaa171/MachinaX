package com.machinax.digitaltwin.client;

import com.machinax.digitaltwin.dto.request.MLPredictionClientRequest;
import com.machinax.digitaltwin.dto.response.MLPredictionClientResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.Optional;

@Component
@Slf4j
public class MLPredictionClient {

    private final RestClient restClient;
    private final String baseUrl;

    public MLPredictionClient(@Value("${machinax.ml-service.base-url:http://localhost:8000}") String baseUrl) {
        this.baseUrl = baseUrl;
        
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(3));
        requestFactory.setReadTimeout(Duration.ofSeconds(5));

        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(requestFactory)
                .build();
    }

    public Optional<MLPredictionClientResponse> predict(MLPredictionClientRequest request) {
        try {
            log.debug("Sending prediction request to ML service at {}/api/v1/predict for machine {}", baseUrl, request.machineId());
            MLPredictionClientResponse response = restClient.post()
                    .uri("/api/v1/predict")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(MLPredictionClientResponse.class);

            return Optional.ofNullable(response);
        } catch (Exception ex) {
            log.warn("ML Service call failed for machine {}: {} (ML Service available at: {})", 
                    request.machineId(), ex.getMessage(), baseUrl);
            return Optional.empty();
        }
    }
}
