"""
Forecasting Benchmark Script
Evaluates Holt's Linear (Double Exponential Smoothing) on synthetic railway data.
Calculates MAE and RMSE honestly without claiming real railway accuracy.
"""
import sys
import os
import json
import math
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from ml_engine import ml_engine
from models import PredictionRequest

def run_forecast_benchmark():
    print("=" * 60)
    print("FORECASTING BENCHMARK - Holt's Linear / Double Exponential")
    print("=" * 60)

    print("Model implementation check:")
    print("  Class: RailwayMLEngine (backend/ml_engine.py)")
    print("  Algorithm: Holt's Linear Exponential Smoothing (Level + Trend, 2 equations)")
    print("  Note: Seasonal component is NOT present (Double Exponential, not Triple Exponential/Seasonal Holt-Winters)")
    
    np.random.seed(42)
    t = np.arange(0, 30)
    true_trend = 30.0
    true_base = 40000.0
    noise = np.random.normal(0, 25.0, size=len(t))
    synthetic_series = true_base + true_trend * t + noise
    
    history_pts = [float(x) for x in synthetic_series[:24]]
    ground_truth_future = [float(x) for x in synthetic_series[24:]]
    
    req = PredictionRequest(
        coach_id="COACH-TST-01",
        coach_no="S-4",
        coach_type="Sleeper",
        empty_weight_kg=35000.0,
        max_capacity_kg=55000.0,
        current_weight_kg=history_pts[-1],
        historical_weights=history_pts,
        time_step_minutes=5.0,
        alpha=0.35,
        beta=0.15
    )
    
    pred_res = ml_engine.predict_occupancy(req)
    
    print("\nForecast Horizons Generated:")
    horizon_mapping = {
        15: ground_truth_future[0],
        30: ground_truth_future[1],
        60: ground_truth_future[3] if len(ground_truth_future) > 3 else ground_truth_future[-1]
    }
    
    abs_errors = []
    sq_errors = []
    horizon_details = []
    
    for h in pred_res.predictions:
        gt = horizon_mapping.get(h.horizon_minutes, None)
        err = h.predicted_weight_kg - gt if gt is not None else 0.0
        abs_err = abs(err)
        sq_err = err ** 2
        abs_errors.append(abs_err)
        sq_errors.append(sq_err)
        
        horizon_details.append({
            "horizon_minutes": h.horizon_minutes,
            "predicted_weight_kg": round(h.predicted_weight_kg, 2),
            "lower_bound_kg": round(h.lower_bound_kg, 2),
            "upper_bound_kg": round(h.upper_bound_kg, 2),
            "synthetic_ground_truth_kg": round(float(gt), 2),
            "abs_error_kg": round(abs_err, 2),
            "confidence_score": h.confidence_score
        })
        print(f"  +{h.horizon_minutes}m: Pred={h.predicted_weight_kg:.1f}kg, CI=[{h.lower_bound_kg:.1f}, {h.upper_bound_kg:.1f}], GT={gt:.1f}kg, Error={err:+.1f}kg")

    mae = float(np.mean(abs_errors))
    rmse = float(math.sqrt(np.mean(sq_errors)))
    
    print(f"\nSynthetic Test Results:")
    print(f"  MAE (Mean Absolute Error):  {mae:.2f} kg")
    print(f"  RMSE (Root Mean Sq Error):  {rmse:.2f} kg")
    print("  DISCLAIMER: These metrics are derived solely from a synthetic benchmark.")
    print("  No claim is made of real-world railway accuracy without field hardware telemetry.")
    
    # Test insufficient data handling (<2 points)
    req_insuff = PredictionRequest(
        coach_id="COACH-INSUFF",
        coach_no="S-1",
        current_weight_kg=42000.0,
        historical_weights=[42000.0]
    )
    insuff_res = ml_engine.predict_occupancy(req_insuff)
    print(f"\nInsufficient History (<2 points) Behavior:")
    print(f"  Level estimate: {insuff_res.level_estimate_kg} kg")
    print(f"  Trend estimate: {insuff_res.trend_estimate_kg} kg")
    print(f"  Predictions generated: {len(insuff_res.predictions)} horizons")
    
    summary = {
        "algorithm": "Holt's Linear Exponential Smoothing (Level + Trend)",
        "seasonal_component_present": False,
        "synthetic_benchmark_mae_kg": round(mae, 2),
        "synthetic_benchmark_rmse_kg": round(rmse, 2),
        "horizons_tested": [15, 30, 60],
        "insufficient_data_handled": len(insuff_res.predictions) == 3,
        "data_source": "SYNTHETIC_DATA_ONLY"
    }
    print("\nBENCHMARK SUMMARY (JSON):")
    print(json.dumps(summary, indent=2))
    return summary

if __name__ == "__main__":
    run_forecast_benchmark()
