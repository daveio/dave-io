#!/bin/sh

# Container initialization script - sets up the development environment
# This script handles the initial system setup and dependency installation

set -e # Exit on any error

# Color codes for better output readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
  printf "${BLUE}[INFO]${NC} %s\n" "$1"
}

log_success() {
  printf "${GREEN}[SUCCESS]${NC} %s\n" "$1"
}

log_warning() {
  printf "${YELLOW}[WARNING]${NC} %s\n" "$1"
}

log_error() {
  printf "${RED}[ERROR]${NC} %s\n" "$1" >&2
}

# Check if running as root (optional warning)
user_id=$(id -u)
if [ "${user_id}" = "0" ]; then
  log_warning "Running as root - this may not be necessary for all operations"
fi

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
  return $?
}

# Main initialization process
main() {
  log_info "Starting container initialization..."

  # Update package lists
  log_info "Updating package lists..."
  if ! sudo apt update; then
    log_error "Failed to update package lists"
    exit 1
  fi

  # Upgrade system packages
  log_info "Upgrading system packages..."
  if ! sudo apt -y full-upgrade; then
    log_error "Failed to upgrade system packages"
    exit 1
  fi

  # Install fish shell
  log_info "Installing fish shell..."
  if ! sudo apt -y install fish; then
    log_error "Failed to install fish shell"
    exit 1
  fi

  # Verify fish installation
  # trunk-ignore(shellcheck/SC2310)
  if ! command_exists fish; then
    log_error "Fish shell installation failed - command not found"
    exit 1
  fi

  log_success "System setup completed successfully"

  # Display environment information
  log_info "Displaying environment information..."
  if [ -f "bin/container/env.fish" ]; then
    env fish bin/container/env.fish --hide-sensitive
  else
    log_warning "Environment script not found at bin/container/env.fish"
  fi

  printf "\n\n%s===== SYSTEM SETUP COMPLETE =====%s\n\n" "${BLUE}" "${NC}"

  # Run development environment setup
  log_info "Starting development environment setup..."
  if [ -f "bin/container/setup.fish" ]; then
    env fish bin/container/setup.fish
  else
    log_error "Setup script not found at bin/container/setup.fish"
    exit 1
  fi
}

# Run main function
main "$@"
