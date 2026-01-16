🛒 Saloon Ecommerce and Booking System (The CutLab)
Advanced E-Commerce & Service Ecosystem
A full-stack, distributed enterprise application built with Spring Boot and React, featuring real-time logistics, algorithmic service scheduling, and an AI-driven recommendation engine.

Tech Stack
Backend: Java (Spring Boot), Hibernate (JPA), Spring Security
Frontend: HTML5, Tailwind CSS, JavaScriptDatabase & Storage: Supabase (PostgreSQL), Redis (Caching & Temporary State)Messaging: RabbitMQ (Asynchronous Tasks & Event Streaming)
Communication: WebSockets (Live Notifications), Java Mail SenderAuthentication: JWT (JSON Web Tokens)

Key Features & Modules
1. Multi-Role Ecosystem (4 Actors)
   i. Admin: Full system control, inventory management, and business analytics.
   ii. Staff: Specialized dashboard to manage professional appointments and schedules.
   iii. Driver: Optimized delivery routes for efficient order fulfillment.
   iv. User: Seamless shopping experience, appointment booking, and real-time tracking.

2. Intelligent Appointment Recommendation Engine
Unlike standard booking systems, this platform uses a multi-factor ranking algorithm to suggest the best time slots for users:
  -Feasibility Check: Filters slots based on staff qualifications and existing booking overlaps.
  -Preference Scoring: Analyzes user history (morning/afternoon/evening trends) to predict preferred times.
  -Workload Balancing: Redistributes appointments to prevent staff burnout by calculating current load scores.
  -Time-Fit Decay: Uses a decay factor to prioritize slots closest to a user's historical booking time.

3. Logistics & Route Optimization
For our delivery drivers, we implemented a Heuristic Routing Algorithm:
  -Nearest Neighbor + 2-Opt: Calculates the most efficient path to visit all delivery locations, starting and ending at the warehouse. This minimizes fuel costs and delivery time.

4. Recommendation System (Collaborative Filtering)User Similarity:
  -Stores user activity vectors (views, cart additions, purchases) in Redis.
  -Scoring: Calculates similarity scores between users to recommend products that "similar customers also bought."

5. Advanced Real-Time Infrastructure
   -Live Notifications: Utilizes WebSockets and RabbitMQ to push instant updates for order status changes (Placed, Shipped, Delivered).
   -Payment Integration: Fully integrated with eSewa and Khalti for secure, local digital payments.
   -Distributed Caching (Redis): * Stores temporary session data (email OTPs, checkout states) to ensure DB consistency.
   -Manages unread notification counts and high-frequency user similarity scores for low-latency performance.

6. Security & Mail Services
   -Spring Security & JWT: Robust Role-Based Access Control (RBAC) ensuring users only access authorized resources.
   -Automated Emailing: Triggered service for OTP verification and sending detailed digital purchase receipts.

ALGORITHMS:
1. Recommendation Engine (Collaborative Filtering)
  -Mechanism: Implements User-Based Collaborative Filtering to find "neighboring" shoppers with similar tastes.
  -The Math: Uses Cosine Similarity to compare user behavior vectors (views, carts, purchases) stored in Redis.
  -Performance: Executed as an Async process using CompletableFuture to maintain zero-latency user experience.

2. Logistics Route Optimization (TSP Solver)
  -Mechanism: Solves the Traveling Salesperson Problem (TSP) for drivers using a two-stage heuristic.
  -Nearest Neighbor: Generates an initial efficient path by always visiting the closest unvisited location.
  -2-Opt Refinement: Iteratively "untangles" the route by swapping edges to eliminate path crossings, reducing total travel distance.

3. Intelligent Appointment Ranking
  -Mechanism: A multi-objective scoring algorithm that ranks service slots based on three weighted factors.
  -Scoring Factors: Balances User Preference Similarity (historical habits), Staff Workload (load balancing), and Time-Fit Decay.
  -Logic: Discards infeasible slots (leave/conflicts) and returns a sorted list of the most "compatible" times for the user.

  
