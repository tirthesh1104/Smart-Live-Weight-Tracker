"""
Delta-Sync Benchmark Script
Runs 100 sequential weight readings and measures actual suppression rate.
Does NOT use hardcoded percentages - measures from actual logic.
"""
import sys
import os
import json
import random

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from ml_engine import ml_engine
from models import DeltaSyncRequest

def run_benchmark():
    print("=" * 60)
    print("DELTA-SYNC BENCHMARK - 100 Sequential Weight Updates")
    print("=" * 60)
    
    readings = []
    base = 42000.0
    
    random.seed(42)  # Reproducible
    for i in range(101):
        if random.random() < 0.70:
            delta = random.uniform(-10, 10)  # small - should SUPPRESS (<15kg)
        else:
            delta = random.uniform(-80, 80)  # large - should SYNC (>=15kg)
        base = max(24000, min(50000, base + delta))
        readings.append(round(base, 1))

    prev_weight = readings[0]
    
    synced_count = 0
    suppressed_count = 0
    heartbeat_count = 0
    edge_suppressed_count = 0
    
    FULL_PAYLOAD_BYTES = 256
    HEARTBEAT_PAYLOAD_BYTES = 64
    
    total_payload_if_all_synced = 0
    total_payload_actual = 0
    
    results = []
    
    for i, curr_weight in enumerate(readings[1:], start=1):
        # Every 25 updates simulate elapsed seconds triggering heartbeat (> 60s)
        elapsed = 65.0 if (i % 25 == 0) else 3.0
        
        req = DeltaSyncRequest(
            coach_id=f"coach-BEN-{i%12+1}",
            train_id="12345-BEN-MUM",
            current_weight_kg=curr_weight,
            previous_weight_kg=prev_weight,
            threshold_kg=15.0,
            elapsed_seconds=elapsed,
            max_heartbeat_interval_sec=60.0
        )
        
        result = ml_engine.evaluate_delta_sync(req)
        total_payload_if_all_synced += FULL_PAYLOAD_BYTES
        
        action = result.action
        
        if result.sync_required:
            synced_count += 1
            total_payload_actual += FULL_PAYLOAD_BYTES
        else:
            suppressed_count += 1
            if action == "HEARTBEAT_SYNC":
                heartbeat_count += 1
                total_payload_actual += HEARTBEAT_PAYLOAD_BYTES
            elif action == "EDGE_SUPPRESSED":
                edge_suppressed_count += 1
        
        results.append({
            "update": i,
            "curr_kg": curr_weight,
            "prev_kg": prev_weight,
            "delta_kg": round(curr_weight - prev_weight, 1),
            "sync_required": result.sync_required,
            "action": action,
            "message": result.message
        })
        
        prev_weight = curr_weight
    
    total_updates = len(readings) - 1  # 100 updates
    suppression_rate = (suppressed_count / total_updates) * 100
    bandwidth_saved_pct = (1.0 - total_payload_actual / total_payload_if_all_synced) * 100
    
    print(f"\nTotal updates evaluated: {total_updates}")
    print(f"Synced (transmitted):    {synced_count} ({synced_count/total_updates*100:.1f}%)")
    print(f"Suppressed (total):      {suppressed_count} ({suppression_rate:.1f}%)")
    print(f"  -> EDGE_SUPPRESSED:    {edge_suppressed_count}")
    print(f"  -> HEARTBEAT_SYNC:     {heartbeat_count}")
    print(f"\nPayload analysis (approx):")
    print(f"  If all synced:         {total_payload_if_all_synced:,} bytes")
    print(f"  Actual transmitted:    {total_payload_actual:,} bytes")
    print(f"  Bandwidth saved:       {bandwidth_saved_pct:.1f}%  (MEASURED from real evaluation)")
    
    summary = {
        "total_updates": total_updates,
        "synced": synced_count,
        "suppressed": suppressed_count,
        "suppression_rate_pct": round(suppression_rate, 1),
        "bandwidth_saved_pct_measured": round(bandwidth_saved_pct, 1),
        "edge_suppressed": edge_suppressed_count,
        "heartbeat_syncs": heartbeat_count
    }
    print("\nBENCHMARK SUMMARY (JSON):")
    print(json.dumps(summary, indent=2))
    return summary

if __name__ == "__main__":
    run_benchmark()
