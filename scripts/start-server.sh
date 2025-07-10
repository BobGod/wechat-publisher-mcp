#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Default values
TRANSPORT="stdio"
PORT="3000"
HOST="localhost"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --transport)
      TRANSPORT="$2"
      shift 2
      ;;
    --port)
      PORT="$2"
      shift 2
      ;;
    --host)
      HOST="$2"
      shift 2
      ;;
    *)
      echo -e "${RED}Unknown argument: $1${NC}"
      exit 1
      ;;
  esac
done

echo -e "${YELLOW}🚀 Starting WeChat Publisher MCP Server...${NC}"
echo -e "${YELLOW}📁 Project root: $PROJECT_ROOT${NC}"
echo -e "${YELLOW}🔌 Transport: $TRANSPORT${NC}"

if [ "$TRANSPORT" != "stdio" ]; then
  echo -e "${YELLOW}🌐 Host: $HOST${NC}"
  echo -e "${YELLOW}🔧 Port: $PORT${NC}"
fi

# Check if package.json exists
if [[ ! -f "$PROJECT_ROOT/package.json" ]]; then
  echo -e "${RED}❌ Error: package.json not found in $PROJECT_ROOT${NC}"
  echo -e "${RED}   Please make sure you're running the script from the correct directory${NC}"
  exit 1
fi

# Check if node_modules exists, if not install dependencies
if [[ ! -d "$PROJECT_ROOT/node_modules" ]]; then
  echo -e "${YELLOW}📦 Installing dependencies...${NC}"
  cd "$PROJECT_ROOT" && npm install
fi

# Export environment variables
export MCP_TRANSPORT="$TRANSPORT"
export MCP_PORT="$PORT"
export MCP_HOST="$HOST"

# Start the server
echo -e "${GREEN}✅ Starting server...${NC}"
cd "$PROJECT_ROOT" && node src/server.js 