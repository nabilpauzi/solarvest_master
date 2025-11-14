#!/bin/bash
# Helper script to load environment variables from .env file for Android builds

if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo "Environment variables loaded from .env"
else
    echo "Warning: .env file not found"
fi
