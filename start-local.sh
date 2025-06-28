#!/bin/bash

echo "Starting Scout Analytics Dashboard locally..."

# Start backend
echo "Starting backend server..."
cd server
npm run dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

# Start frontend
echo "Starting frontend..."
cd ../client
npm run dev &
FRONTEND_PID=$!

echo "Backend running on http://localhost:5000"
echo "Frontend running on http://localhost:5173"
echo "Press Ctrl+C to stop both servers"

# Wait for interrupt
trap "kill $BACKEND_PID $FRONTEND_PID" INT
wait