import time
import json
import random
from typing import Dict, Any

try:
    from kafka import KafkaProducer
except ImportError:
    KafkaProducer = None


# ============================================================
# KAFKA CONFIGURATION
# ============================================================

BOOTSTRAP_SERVERS = [
    "localhost:29092",   # Host-accessible port (docker-compose PLAINTEXT_HOST)
    "localhost:9092",    # Fallback (if Kafka running natively)
    "kafka:9092"         # Docker-internal (when running inside compose network)
]

TOPIC_NAME = "transactions-topic"


# ============================================================
# TRANSACTION TYPES
# ============================================================

TYPES = [
    "CASH_IN",
    "CASH_OUT",
    "DEBIT",
    "PAYMENT",
    "TRANSFER"
]


# ============================================================
# MERCHANTS / LOCATIONS
# ============================================================

MERCHANTS = [
    "Global Offshore Wire",
    "TechStore Online",
    "CryptoExchange Liquidity",
    "Coffee & Bakers"
]

LOCATIONS = [
    "Zurich, CH",
    "New York, US",
    "London, UK",
    "Tokyo, JP"
]


# ============================================================
# GENERATE SYNTHETIC TRANSACTION
# ============================================================

def generate_synthetic_transaction() -> Dict[str, Any]:

    # Random transaction type
    txn_type = random.choices(
        TYPES,
        weights=[
            0.20,   # CASH_IN
            0.30,   # CASH_OUT
            0.05,   # DEBIT
            0.25,   # PAYMENT
            0.20    # TRANSFER
        ],
        k=1
    )[0]

    # ========================================================
    # FRAUD / ANOMALY INJECTION
    # Approximately 8% of transactions
    # ========================================================

    is_fraud_scenario = random.random() < 0.08

    # ========================================================
    # HIGH-RISK FRAUD PATTERN
    # ========================================================

    if is_fraud_scenario and txn_type in ["TRANSFER", "CASH_OUT"]:

        # Large account balance
        old_org = round(
            random.uniform(50_000, 500_000),
            2
        )

        # Entire balance transferred
        amount = old_org

        # Account completely drained
        new_orig = 0.0

        # Suspicious destination balance pattern
        old_dest = 0.0
        new_dest = 0.0

    # ========================================================
    # NORMAL TRANSACTION
    # ========================================================

    else:

        old_org = round(
            random.uniform(100, 25_000),
            2
        )

        amount = round(
            random.uniform(5, 5_000),
            2
        )

        # Prevent negative balance
        if amount > old_org:
            amount = round(
                random.uniform(5, old_org),
                2
            )

        new_orig = round(
            old_org - amount,
            2
        )

        old_dest = round(
            random.uniform(0, 50_000),
            2
        )

        new_dest = round(
            old_dest + amount,
            2
        )

    # ========================================================
    # CREATE TRANSACTION PAYLOAD
    # ========================================================

    transaction = {

        "transactionId":
            f"TXN-{random.randint(10000, 99999)}",

        "userId":
            f"USR-{random.randint(1000, 9999)}",

        "amount":
            amount,

        "oldBalanceOrg":
            old_org,

        "newBalanceOrig":
            new_orig,

        "oldBalanceDest":
            old_dest,

        "newBalanceDest":
            new_dest,

        "type":
            txn_type,

        "merchant":
            random.choice(MERCHANTS),

        "location":
            random.choice(LOCATIONS),

        "timestamp":
            time.strftime(
                "%Y-%m-%dT%H:%M:%S",
                time.localtime()
            ),

        "status":
            "PENDING"
    }

    return transaction


# ============================================================
# CONNECT TO KAFKA
# ============================================================

def create_kafka_producer():

    if KafkaProducer is None:

        print(
            "WARNING: kafka-python is not installed."
        )

        print(
            "Running in simulation-only mode."
        )

        return None

    for server in BOOTSTRAP_SERVERS:

        try:

            print(
                f"Connecting to Kafka broker: {server}"
            )

            producer = KafkaProducer(

                bootstrap_servers=server,

                value_serializer=lambda value:
                    json.dumps(value).encode("utf-8"),

                acks="all",

                retries=5
            )

            print(
                f"Connected to Kafka broker at {server}"
            )

            return producer

        except Exception as error:

            print(
                f"Unable to connect to {server}: {error}"
            )

    print(
        "WARNING: Kafka is unavailable."
    )

    print(
        "Transactions will be generated locally "
        "but will NOT reach the backend."
    )

    return None


# ============================================================
# DIRECT HTTP FALLBACK (when Kafka is unavailable)
# ============================================================

BACKEND_URL = "http://localhost:8080/api/transactions"

try:
    import requests as http_requests
    HTTP_AVAILABLE = True
except ImportError:
    HTTP_AVAILABLE = False


# ============================================================
# MAIN PRODUCER LOOP
# ============================================================

def main():

    print("=" * 70)

    print(
        "REAL-TIME FRAUD ANOMALY DETECTOR"
    )

    print(
        "Kafka Transaction Producer"
    )

    print("=" * 70)

    print(
        f"Kafka Topic : {TOPIC_NAME}"
    )

    print(
        "Fraud Injection Rate : ~8%"
    )

    print(
        "Transaction Interval : 0.5 - 2.0 seconds"
    )

    print("=" * 70)

    producer = create_kafka_producer()

    # Determine mode
    if producer is not None:
        mode = "KAFKA"
        print(f"Mode: KAFKA -> {TOPIC_NAME}")
    elif HTTP_AVAILABLE:
        mode = "HTTP"
        print(f"Mode: HTTP DIRECT -> {BACKEND_URL}")
        print("(Kafka unavailable - sending directly to Spring Boot REST API)")
    else:
        mode = "SIMULATION"
        print("Mode: SIMULATION ONLY (no Kafka, no requests library)")

    print("=" * 70)

    counter = 0

    try:

        while True:

            # Generate transaction
            transaction = (
                generate_synthetic_transaction()
            )

            counter += 1

            transaction_id = (
                transaction["transactionId"]
            )

            transaction_type = (
                transaction["type"]
            )

            amount = (
                transaction["amount"]
            )

            # =================================================
            # SEND TO KAFKA
            # =================================================

            if mode == "KAFKA":

                try:

                    future = producer.send(
                        TOPIC_NAME,
                        transaction
                    )

                    # Wait for Kafka acknowledgement
                    metadata = future.get(
                        timeout=10
                    )

                    print(
                        f"[{counter}] "
                        f"Kafka -> "
                        f"{transaction_id} | "
                        f"{transaction_type} | "
                        f"${amount:,.2f} | "
                        f"topic={metadata.topic} "
                        f"partition={metadata.partition}"
                    )

                except Exception as error:

                    print(
                        f"[{counter}] "
                        f"Kafka publish failed for "
                        f"{transaction_id}: "
                        f"{error}"
                    )

            # =================================================
            # HTTP DIRECT MODE (Kafka not available)
            # =================================================

            elif mode == "HTTP":

                try:

                    response = http_requests.post(
                        BACKEND_URL,
                        json=transaction,
                        timeout=5
                    )

                    if response.status_code in (200, 201, 202):
                        print(
                            f"[{counter}] "
                            f"HTTP OK -> "
                            f"{transaction_id} | "
                            f"{transaction_type} | "
                            f"${amount:,.2f} | "
                            f"status={response.status_code}"
                        )
                    else:
                        print(
                            f"[{counter}] "
                            f"HTTP {response.status_code} -> "
                            f"{transaction_id} | "
                            f"{response.text[:80]}"
                        )

                except Exception as error:
                    print(
                        f"[{counter}] "
                        f"HTTP failed for "
                        f"{transaction_id}: "
                        f"{error}"
                    )

            # =================================================
            # SIMULATION MODE
            # =================================================

            else:

                print(
                    f"[{counter}] "
                    f"Simulated -> "
                    f"{transaction_id} | "
                    f"{transaction_type} | "
                    f"${amount:,.2f}"
                )

            # =================================================
            # WAIT BEFORE NEXT TRANSACTION
            # =================================================

            time.sleep(
                random.uniform(0.5, 2.0)
            )

    except KeyboardInterrupt:

        print()
        print(
            "Stopping producer..."
        )

    finally:

        if producer is not None:

            try:
                producer.flush()
                producer.close()

            except Exception:
                pass

        print(
            "Producer stopped."
        )




# ============================================================
# APPLICATION ENTRY POINT
# ============================================================

if __name__ == "__main__":
    main()