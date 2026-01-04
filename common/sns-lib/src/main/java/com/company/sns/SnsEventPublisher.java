package com.company.sns;

import com.company.sns.exception.SnsPublishException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.services.sns.SnsClient;
import software.amazon.awssdk.services.sns.model.PublishRequest;
import software.amazon.awssdk.services.sns.model.PublishResponse;

import java.util.concurrent.CompletableFuture;

@Slf4j
@Component
@RequiredArgsConstructor
public class SnsEventPublisher {

    private final SnsClient snsClient;
    private final ObjectMapper objectMapper;

    @Value("${aws.sns.topics.deal-events:}")
    private String dealEventsTopicArn;

    @Value("${aws.sns.topics.ticket-events:}")
    private String ticketEventsTopicArn;

    @Value("${aws.sns.topics.user-events:}")
    private String userEventsTopicArn;

    @Value("${aws.sns.topics.payment-events:}")
    private String paymentEventsTopicArn;

    @Value("${aws.sns.topics.chat-events:}")
    private String chatEventsTopicArn;

    /**
     * 동기적으로 이벤트 발행
     */
    public void publish(String topicName, EventMessage event) {
        try {
            String topicArn = getTopicArn(topicName);
            String messageJson = objectMapper.writeValueAsString(event);

            PublishRequest request = PublishRequest.builder()
                .topicArn(topicArn)
                .message(messageJson)
                .build();

            PublishResponse response = snsClient.publish(request);
            log.info("Event published successfully. EventType: {}, MessageId: {}, Topic: {}",
                event.getEventType(), response.messageId(), topicName);

        } catch (Exception e) {
            log.error("Failed to publish event. EventType: {}, Topic: {}",
                event.getEventType(), topicName, e);
            throw new SnsPublishException("Failed to publish event", e);
        }
    }

    /**
     * 비동기적으로 이벤트 발행
     */
    public CompletableFuture<Void> publishAsync(String topicName, EventMessage event) {
        return CompletableFuture.runAsync(() -> publish(topicName, event));
    }

    private String getTopicArn(String topicName) {
        return switch (topicName) {
            case "deal-events" -> dealEventsTopicArn;
            case "ticket-events" -> ticketEventsTopicArn;
            case "user-events" -> userEventsTopicArn;
            case "payment-events" -> paymentEventsTopicArn;
            case "chat-events" -> chatEventsTopicArn;
            default -> throw new IllegalArgumentException("Unknown topic: " + topicName);
        };
    }
}
