package com.ecommerce.service.order;

import com.ecommerce.dto.intermediate.DistanceAndTimeResponse;
import com.ecommerce.dto.intermediate.Route;
import com.ecommerce.dto.response.order.AssignedDeliveryResponse;
import com.ecommerce.exception.ApplicationException;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RouteService {

    @Value("${location.latitude}")
    private Double myLatitude;

    @Value("${location.longitude}")
    private Double myLongitude;

    private static final double MIN_CHARGE = 50.0;

    private static final double BASE_DISTANCE_KM = 2.0;
    private static final double RATE_PER_KM = 10.0;

    private static final double BASE_TIME_MIN = 15.0;
    private static final double RATE_PER_MIN = 1.0;

    private static final Logger log = LoggerFactory.getLogger(RouteService.class);
    private final RestTemplate restTemplate;

    public List<AssignedDeliveryResponse> startRoutingAlgorithm(List<AssignedDeliveryResponse> deliveryList) {
        if (deliveryList.size() < 2) {
            return deliveryList;
        }

        // Extract coordinates directly from your DTOs
        List<double[]> coordinates = deliveryList.stream()
                .map(d -> new double[]{d.latitude(), d.longitude()})
                .toList();

        log.info("Fetching distance matrix from OSRM for {} points", coordinates.size());
        double[][] distanceMatrix = buildDistanceMatrix(coordinates);

        log.info("Applying Optimization Algorithms (Nearest Neighbor + 2-Opt)");
        List<Integer> routeIdx = nearestNeighbor(distanceMatrix, deliveryList.size());
        routeIdx = twoOpt(routeIdx, distanceMatrix);

        // Map the optimized indices back to the original DTOs
        List<AssignedDeliveryResponse> orderedList = new ArrayList<>();
        for (int index : routeIdx) {
            orderedList.add(deliveryList.get(index));
        }

        return orderedList;
    }

    private double[][] buildDistanceMatrix(List<double[]> coordinates) {
        int n = coordinates.size();
        double[][] matrix = new double[n][n];
        try {
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < n; i++) {
                // OSRM expects longitude,latitude
                sb.append(coordinates.get(i)[1]).append(",").append(coordinates.get(i)[0]);
                if (i < n - 1) sb.append(";");
            }

            String url = "http://router.project-osrm.org/table/v1/driving/" + sb.toString() + "?annotations=distance";
            JsonNode response = restTemplate.getForObject(url, JsonNode.class);

            if (response != null && response.has("distances")) {
                JsonNode distances = response.get("distances");
                for (int i = 0; i < n; i++) {
                    for (int j = 0; j < n; j++) {
                        matrix[i][j] = distances.get(i).get(j).asDouble() / 1000.0;
                    }
                }
            }
        } catch (Exception e) {
            log.error("OSRM matrix failed: {}", e.getMessage());
        }
        return matrix;
    }

    //    algorithm
    //applying nearest neighbour
    private List<Integer> nearestNeighbor(double[][] distances, int size) {
        boolean[] visited = new boolean[size];
        List<Integer> route = new ArrayList<>();
        int current = 0; // from first
        route.add(current);
        visited[current] = true;

        for (int step = 1; step < size; step++) {
            double best = Double.MAX_VALUE;
            int next = -1;
            for (int j = 0; j < size; j++) {
                if (!visited[j] && distances[current][j] < best) {
                    best = distances[current][j];
                    next = j;
                }
            }
            route.add(next);
            visited[next] = true;
            current = next;
        }
        route.add(0); // return to first
        return route;
    }

    // improving the result of nearest neighbour using 2-opt
    private List<Integer> twoOpt(List<Integer> routeIdx, double[][] distances) {
        boolean improved = true;
        while (improved) {
            improved = false;
            for (int i = 1; i < routeIdx.size() - 2; i++) {
                for (int j = i + 1; j < routeIdx.size() - 1; j++) {
                    double before = distances[routeIdx.get(i - 1)][routeIdx.get(i)] +
                            distances[routeIdx.get(j)][routeIdx.get(j + 1)];
                    double after  = distances[routeIdx.get(i - 1)][routeIdx.get(j)] +
                            distances[routeIdx.get(i)][routeIdx.get(j + 1)];
                    if (after < before) {
                        Collections.reverse(routeIdx.subList(i, j + 1));
                        improved = true;
                    }
                }
            }
        }
        return routeIdx;
    }



    //getting distance and time between two points
    public Route calculateDistanceAndTime(Double latitude, Double longitude){

        String latAndLong = myLongitude + "," +myLatitude + ";" +longitude+ "," +latitude;
        String url = "http://router.project-osrm.org/route/v1/driving/" + latAndLong+"?overview=false&steps=false";
        try {
            DistanceAndTimeResponse response =
                    restTemplate.getForObject(url, DistanceAndTimeResponse.class);

            if (response == null || !"Ok".equals(response.code()) || response.routes() == null || response.routes().isEmpty()) {
                return new Route(0.0,0.0);
            }

            return response.routes().get(0);
        } catch (Exception e) {
            log.error(e.getMessage());
            throw new ApplicationException("Failed to calculate delivery charge!", "Failed_TO_CALCULATE", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    //for delivery charge
    public BigDecimal calculateDeliveryCharge(Double latitude, Double longitude){
        double charge = MIN_CHARGE;
        Route route = calculateDistanceAndTime(latitude, longitude);
        if(route.distance() == 0.0 || route.duration()==0.0)
            return BigDecimal.valueOf(50.0);

        double distanceKm = route.distance() / 1000.0;
        double timeMin = route.duration() / 60.0;

        // Distance charge
        if (distanceKm > BASE_DISTANCE_KM) {
            charge += (distanceKm - BASE_DISTANCE_KM) * RATE_PER_KM;
        }
        // Time charge
        if (timeMin > BASE_TIME_MIN) {
            charge += (timeMin - BASE_TIME_MIN) * RATE_PER_MIN;
        }

        return BigDecimal.valueOf(Math.ceil(charge));

    }

}