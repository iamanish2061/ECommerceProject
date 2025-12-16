package com.ecommerce.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

import java.lang.annotation.*;

@NotNull(message = "Price is required")
@DecimalMin(value = "0.01", inclusive = true, message = "Price must be greater than or equal to 0.01")
@Digits(integer = 10, fraction = 2, message = "Price can have maximum 10 digits before and 2 digits after decimal")
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = {})
public @interface ValidPrice {
    String message() default "Invalid price";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
