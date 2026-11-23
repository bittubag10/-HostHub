package com.example.HostHub.annotation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.FIELD, ElementType.METHOD, ElementType.PARAMETER})
@Constraint(validatedBy = EmailValidator.class)
public @interface EmailValidation {

    String message() default "Email must be in lowercase, cannot start with a number, and must follow a valid domain format (e.g., gmail.com or college.ac.in)";

    Class<?>[] groups() default { };

    Class<? extends Payload>[] payload() default { };
}
