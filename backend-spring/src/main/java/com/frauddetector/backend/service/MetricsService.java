package com.frauddetector.backend.service;

import org.springframework.stereotype.Service;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Deque;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class MetricsService {

    // =========================================================
    // CONFIGURATION
    // =========================================================

    /*
     * Maximum number of recent ML latency samples
     * kept in memory.
     */
    private static final int MAX_LATENCY_SAMPLES = 1000;

    /*
     * TPS is calculated using transactions received
     * during this recent rolling time window.
     *
     * Example:
     * 50 transactions in last 10 seconds = 5 TPS.
     */
    private static final long TPS_WINDOW_MILLIS = 10_000L;

    private static final double TPS_WINDOW_SECONDS = TPS_WINDOW_MILLIS / 1000.0;

    // =========================================================
    // ML LATENCY STORAGE
    // =========================================================

    /*
     * Stores recent Spring -> FastAPI -> Spring
     * ML scoring latency values in milliseconds.
     */
    private final List<Double> latencySamples = Collections.synchronizedList(
            new ArrayList<>());

    // =========================================================
    // TRANSACTION THROUGHPUT STORAGE
    // =========================================================

    /*
     * Total number of Kafka transaction messages
     * received since this Spring Boot application started.
     */
    private final AtomicLong transactionCount = new AtomicLong(0);

    /*
     * Stores timestamps of recently received Kafka
     * transaction messages.
     *
     * We only keep timestamps that fall inside
     * TPS_WINDOW_MILLIS.
     */
    private final Deque<Long> transactionTimestamps = new ArrayDeque<>();

    // =========================================================
    // RECORD ML LATENCY
    // =========================================================

    public void recordLatency(double latencyMs) {

        if (latencyMs < 0) {
            return;
        }

        synchronized (latencySamples) {

            latencySamples.add(latencyMs);

            /*
             * Prevent unlimited memory growth.
             */
            if (latencySamples.size() > MAX_LATENCY_SAMPLES) {

                latencySamples.remove(0);
            }
        }
    }

    // =========================================================
    // RECORD KAFKA TRANSACTION
    // =========================================================

    /*
     * Call this method whenever KafkaConsumerService
     * receives a transaction message.
     */
    public void recordTransaction() {

        long now = System.currentTimeMillis();

        // Lifetime transaction counter
        transactionCount.incrementAndGet();

        synchronized (transactionTimestamps) {

            transactionTimestamps.addLast(now);

            /*
             * Remove timestamps older than
             * the rolling TPS window.
             */
            removeExpiredTransactionTimestamps(now);
        }
    }

    // =========================================================
    // GET REAL TPS
    // =========================================================

    /*
     * Returns rolling transaction throughput.
     *
     * Example:
     *
     * 20 transactions received during the last
     * 10 seconds:
     *
     * TPS = 20 / 10 = 2.0
     */
    public double getThroughputTps() {

        long now = System.currentTimeMillis();

        synchronized (transactionTimestamps) {

            removeExpiredTransactionTimestamps(now);

            double tps = transactionTimestamps.size()
                    / TPS_WINDOW_SECONDS;

            return round(tps);
        }
    }

    // =========================================================
    // TOTAL TRANSACTION COUNT
    // =========================================================

    public long getTransactionCount() {

        return transactionCount.get();
    }

    // =========================================================
    // TPS WINDOW
    // =========================================================

    public int getThroughputWindowSeconds() {

        return (int) TPS_WINDOW_SECONDS;
    }

    // =========================================================
    // REMOVE OLD TPS SAMPLES
    // =========================================================

    private void removeExpiredTransactionTimestamps(
            long currentTimeMillis) {

        long cutoff = currentTimeMillis
                - TPS_WINDOW_MILLIS;

        while (!transactionTimestamps.isEmpty()
                &&
                transactionTimestamps.peekFirst() < cutoff) {

            transactionTimestamps.removeFirst();
        }
    }

    // =========================================================
    // ML LATENCY SAMPLE COUNT
    // =========================================================

    public int getSampleCount() {

        synchronized (latencySamples) {

            return latencySamples.size();
        }
    }

    // =========================================================
    // LATEST ML LATENCY
    // =========================================================

    public double getLatestLatencyMs() {

        synchronized (latencySamples) {

            if (latencySamples.isEmpty()) {
                return 0.0;
            }

            return round(
                    latencySamples.get(
                            latencySamples.size() - 1));
        }
    }

    // =========================================================
    // AVERAGE ML LATENCY
    // =========================================================

    public double getAverageLatencyMs() {

        synchronized (latencySamples) {

            if (latencySamples.isEmpty()) {
                return 0.0;
            }

            double total = 0.0;

            for (double latency : latencySamples) {

                total += latency;
            }

            return round(
                    total
                            / latencySamples.size());
        }
    }

    // =========================================================
    // P95 ML LATENCY
    // =========================================================

    public double getP95LatencyMs() {

        return calculatePercentile(95);
    }

    // =========================================================
    // P99 ML LATENCY
    // =========================================================

    public double getP99LatencyMs() {

        return calculatePercentile(99);
    }

    // =========================================================
    // GENERIC PERCENTILE CALCULATION
    // =========================================================

    private double calculatePercentile(
            double percentile) {

        List<Double> snapshot;

        synchronized (latencySamples) {

            if (latencySamples.isEmpty()) {
                return 0.0;
            }

            /*
             * Work on a copy so sorting does not
             * modify original latency sample order.
             */
            snapshot = new ArrayList<>(
                    latencySamples);
        }

        Collections.sort(snapshot);

        /*
         * Nearest-rank percentile method.
         *
         * P99 index =
         * ceil(0.99 * sampleCount) - 1
         */
        int index = (int) Math.ceil(
                (percentile / 100.0)
                        * snapshot.size())
                - 1;

        index = Math.max(
                0,
                Math.min(
                        index,
                        snapshot.size() - 1));

        return round(
                snapshot.get(index));
    }

    // =========================================================
    // ROUND TO 2 DECIMAL PLACES
    // =========================================================

    private double round(double value) {

        return Math.round(
                value * 100.0)
                / 100.0;
    }

    // =========================================================
    // OPTIONAL RESET
    // =========================================================

    public void resetMetrics() {

        synchronized (latencySamples) {

            latencySamples.clear();
        }

        synchronized (transactionTimestamps) {

            transactionTimestamps.clear();
        }

        transactionCount.set(0);
    }
}