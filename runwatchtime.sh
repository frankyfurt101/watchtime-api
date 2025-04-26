#!/bin/bash

# Clear the terminal
clear

# Fancy colorful startup banner
echo ""
echo -e "\033[1;36m🎬 ====================================\033[0m"
echo -e "\033[1;33m     YouTube Watchtime Calculator     \033[0m"
echo -e "\033[1;36m🎬 ====================================\033[0m"
echo ""

# Small delay for effect
sleep 0.5

# Navigate to the project directory
cd ~/Desktop/Youtube\ Project

# Check if watch-history.json exists
if [ ! -f "watch-history.json" ]; then
  echo -e "\033[1;31m❌ Error: watch-history.json not found!\033[0m"
  exit 1
fi

# Start calculation
echo -e "\033[1;34m🚀 Starting watchtime calculation...\033[0m"
sleep 0.5

# Run the Node.js script
node CalculateYTWatchtime.js watch-history.json

# Check if the Node script succeeded
if [ $? -eq 0 ]; then
  echo ""
  echo -e "\033[1;32m✅ Watchtime calculation complete!\033[0m"
else
  echo ""
  echo -e "\033[1;31m❌ Watchtime calculation failed.\033[0m"
fi

echo -e "\033[1;36m====================================\033[0m"
echo ""
