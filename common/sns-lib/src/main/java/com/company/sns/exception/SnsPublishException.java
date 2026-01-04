package com.company.sns.exception;

public class SnsPublishException extends RuntimeException {
    public SnsPublishException(String message, Throwable cause) {
        super(message, cause);
    }
}
