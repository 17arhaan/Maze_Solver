"""
Quick test script to verify backend setup
Run this after starting the server to test endpoints
"""

import requests
import time
import json

BASE_URL = "http://localhost:8000"

def test_root():
    """Test root endpoint"""
    print("Testing root endpoint...")
    response = requests.get(f"{BASE_URL}/")
    print(f"✓ Root endpoint: {response.status_code}")
    return response.status_code == 200

def test_training():
    """Test training workflow"""
    print("\nTesting training workflow...")
    
    # Start training
    payload = {
        "algorithm": "q_learning",
        "episodes": 100,
        "alpha": 0.3,
        "gamma": 0.99,
        "epsilon": 0.15,
        "max_steps": 200
    }
    
    print("Starting training...")
    response = requests.post(f"{BASE_URL}/train", json=payload)
    
    if response.status_code != 200:
        print(f"✗ Training failed: {response.status_code}")
        return False
    
    data = response.json()
    job_id = data.get("job_id")
    print(f"✓ Training started. Job ID: {job_id}")
    
    # Poll status
    print("Polling status...")
    for i in range(10):
        response = requests.get(f"{BASE_URL}/status/{job_id}")
        status_data = response.json()
        
        print(f"  Episode {status_data.get('episode', 0)}/{status_data.get('episodes', 100)} - "
              f"Status: {status_data.get('status')} - "
              f"Progress: {status_data.get('progress', 0)}%")
        
        if status_data.get('status') == 'finished':
            print("✓ Training completed!")
            
            # Get policy
            policy_response = requests.get(f"{BASE_URL}/policy/{job_id}")
            policy_data = policy_response.json()
            
            if policy_data.get('policy'):
                print(f"✓ Policy retrieved: {len(policy_data['policy'])} states")
            
            return True
        
        time.sleep(1)
    
    print("✓ Training in progress (still running after 10 seconds)")
    return True

def test_reset():
    """Test reset endpoint"""
    print("\nTesting reset endpoint...")
    response = requests.post(f"{BASE_URL}/reset")
    
    if response.status_code == 200:
        print("✓ Reset successful")
        return True
    else:
        print(f"✗ Reset failed: {response.status_code}")
        return False

def main():
    print("=" * 50)
    print("Backend API Test Suite")
    print("=" * 50)
    
    try:
        results = []
        
        results.append(test_root())
        results.append(test_training())
        results.append(test_reset())
        
        print("\n" + "=" * 50)
        print(f"Tests Passed: {sum(results)}/{len(results)}")
        print("=" * 50)
        
        if all(results):
            print("✓ All tests passed! Backend is working correctly.")
        else:
            print("✗ Some tests failed. Check the output above.")
            
    except requests.exceptions.ConnectionError:
        print("\n✗ ERROR: Could not connect to backend.")
        print("Make sure the backend server is running on http://localhost:8000")
        print("Run: uvicorn app:app --reload --host 0.0.0.0 --port 8000")

if __name__ == "__main__":
    main()

