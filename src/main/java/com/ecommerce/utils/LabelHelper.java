package com.ecommerce.utils;

public class LabelHelper {

    public static String getLabel(int score) {
        if (score >= 90) return "Best Match";
        if (score >= 80) return "Great";
        if (score >= 70) return "Good";
        return "Available";
    }

}
