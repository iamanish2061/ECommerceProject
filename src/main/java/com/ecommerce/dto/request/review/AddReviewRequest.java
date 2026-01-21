package com.ecommerce.dto.request.review;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;

public record AddReviewRequest(
        @NotNull(message = "Please give the rating")
        @Positive(message = "Invalid rating")
        Integer rating,

        @NotBlank(message = "Please choose fill the title field")
        @Pattern(
                regexp = "^[^<>;\\\\{}]+$",
                message = "Special characters < > ; { } and backslashes are not allowed"
        )
        String title,

        @Pattern(
                regexp = "^[^<>;\\\\{}]+$",
                message = "Special characters < > ; { } and backslashes are not allowed"
        )
        String comment
) {}
