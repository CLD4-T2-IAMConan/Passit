package com.company.sns;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventMessage {
    private String eventType;        // 예: "deal.requested"
    private String source;           // 예: "service-trade"
    private String version;          // 예: "1.0"

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime timestamp;

    private Map<String, Object> data; // 이벤트별 데이터
    private String correlationId;   // 트랜잭션 추적용

    public static EventMessage create(String eventType, String source, Map<String, Object> data) {
        return EventMessage.builder()
            .eventType(eventType)
            .source(source)
            .version("1.0")
            .timestamp(LocalDateTime.now())
            .data(data != null ? data : new HashMap<>())
            .correlationId(UUID.randomUUID().toString())
            .build();
    }
}
