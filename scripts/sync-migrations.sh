#!/bin/bash

# Sync Migrations Script
# Keeps migration files synchronized between supabase/migrations and packages/database/supabase/migrations

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Syncing Migration Files${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Define source and destination directories
SOURCE_DIR="supabase/migrations"
DEST_DIR="packages/database/supabase/migrations"

# Check if directories exist
if [ ! -d "$SOURCE_DIR" ]; then
    print_warning "Source directory $SOURCE_DIR does not exist"
    exit 1
fi

if [ ! -d "$DEST_DIR" ]; then
    print_warning "Destination directory $DEST_DIR does not exist"
    print_info "Creating directory: $DEST_DIR"
    mkdir -p "$DEST_DIR"
fi

# Sync files from source to destination
print_info "Syncing migration files from $SOURCE_DIR to $DEST_DIR..."
rsync -av --delete "$SOURCE_DIR/" "$DEST_DIR/"

# Count files
file_count=$(ls -1 "$SOURCE_DIR"/*.sql 2>/dev/null | wc -l)

print_success "Migration sync complete!"
print_info "Total migration files: $file_count"

echo ""
echo "Migration files are now synchronized:"
echo "  Source:      $SOURCE_DIR"
echo "  Destination: $DEST_DIR"
echo ""
