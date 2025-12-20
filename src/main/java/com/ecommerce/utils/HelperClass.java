package com.ecommerce.utils;

import java.util.UUID;
import java.util.random.RandomGenerator;

public class HelperClass {

    private HelperClass(){}

    public static String maskEmail(String email){
        boolean mask = false;
        StringBuilder maskedString = new StringBuilder();
        for (int i=0; i<email.length(); i++){
            if(i==2) mask=true;
            if(email.charAt(i) == '@')
                mask=false;
            if(mask){
                maskedString.append("*");
            }else{
                maskedString.append(email.charAt(i));
            }
        }
        return maskedString.toString();
    }

    public static String generateSlug(String name){
        if (name == null || name.isBlank()) return "";

        return name.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .trim()
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
    }


    public static String generateTransactionIdForInStoreOperation() {
        return "InStore "+ UUID.randomUUID().toString();
    }
}








