#!/bin/sh

# Container initialization and development environment setup script
# Combines system setup, environment inspection, and development tools installation
# Usage: ./init.sh [--env-only] [--setup-only] [env_options...]

set -e # Exit on any error

# Color codes for better output readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Global variables for environment inspector
FILTER_PATTERN=""
HIDE_SENSITIVE="false"
OUTPUT_FORMAT="table"
ENV_ONLY="false"
SETUP_ONLY="false"

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

# Help function for environment inspector
show_env_help() {
  echo "Container Environment Inspector"
  echo "Usage: $0 [--env-only] [ENV_OPTIONS]"
  echo ""
  echo "Environment Options:"
  echo "  --filter PATTERN     Only show variables matching pattern"
  echo "  --hide-sensitive     Mask values for sensitive variables"
  echo "  --format FORMAT      Output format: table, json, yaml"
  echo "  --env-help          Show environment help"
  echo ""
  echo "Script Options:"
  echo "  --env-only          Only run environment inspector"
  echo "  --setup-only        Only run development setup"
  echo "  --help              Show this help"
  echo ""
  echo "Examples:"
  echo "  $0                                    # Full setup with env display"
  echo "  $0 --env-only --filter NODE          # Show only NODE* variables"
  echo "  $0 --env-only --hide-sensitive       # Mask sensitive values"
  echo "  $0 --env-only --format json          # Output as JSON"
}

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Function to check if variable name is sensitive
is_sensitive() {
  var_name="$1"
  # Convert to uppercase for comparison
  var_upper=$(echo "${var_name}" | tr '[:lower:]' '[:upper:]' || true)

  # Check against sensitive patterns
  case "${var_upper}" in
  *SECRET* | *PASSWORD* | *TOKEN* | *KEY* | *AUTH* | *CREDENTIAL* | *PRIVATE*)
    return 0
    ;;
  *)
    return 1
    ;;
  esac
}

# Function to mask sensitive values
mask_value() {
  value="$1"
  length=${#value}

  if [ "${length}" -le 8 ]; then
    echo "***"
  else
    visible=$(echo "${value}" | cut -c1-3 || true)
    echo "${visible}...(masked)"
  fi
}

# Function to escape special characters for different formats
escape_for_format() {
  value="$1"
  format="$2"

  case "${format}" in
  table)
    # Escape pipe characters for Markdown table
    echo "${value}" | sed 's/|/\\|/g'
    ;;
  json)
    # Escape quotes and backslashes for JSON
    echo "${value}" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g'
    ;;
  *)
    echo "${value}"
    ;;
  esac
}

# Environment inspector function
inspect_environment() {
  log_info "Inspecting container environment..."

  # Collect environment variables
  env_vars=""
  max_var_len=8 # minimum width for "Variable" header
  max_val_len=5 # minimum width for "Value" header
  var_count=0

  # Process each environment variable
  for var_line in $(env | sort); do
    # Split variable name and value
    var_name=$(echo "${var_line}" | cut -d'=' -f1)
    var_value=$(echo "${var_line}" | cut -d'=' -f2-)

    # Apply filter if specified
    if [ -n "${FILTER_PATTERN}" ]; then
      # Case-insensitive pattern matching
      var_upper=$(echo "${var_name}" | tr '[:lower:]' '[:upper:]')
      pattern_upper=$(echo "${FILTER_PATTERN}" | tr '[:lower:]' '[:upper:]')
      case "${var_upper}" in
      *${pattern_upper}*) ;;
      *)
        continue
        ;;
      esac
    fi

    # Handle sensitive variables
    # trunk-ignore(shellcheck/SC2310)
    if [ "${HIDE_SENSITIVE}" = "true" ] && is_sensitive "${var_name}"; then
      var_value=$(mask_value "${var_value}")
    fi

    # Escape special characters based on output format
    var_value=$(escape_for_format "${var_value}" "${OUTPUT_FORMAT}")

    # Track maximum lengths for table formatting
    var_len=${#var_name}
    if [ "${var_len}" -gt "${max_var_len}" ]; then
      max_var_len="${var_len}"
    fi

    val_len=${#var_value}
    if [ "${val_len}" -gt "${max_val_len}" ]; then
      max_val_len="${val_len}"
    fi

    # Store the variable data
    if [ -z "${env_vars}" ]; then
      env_vars="${var_name}=${var_value}"
    else
      env_vars="${env_vars}
${var_name}=${var_value}"
    fi
    var_count=$((var_count + 1))
  done

  # Output in requested format
  case "${OUTPUT_FORMAT}" in
  json)
    echo "{"
    first=true
    echo "${env_vars}" | while IFS= read -r var_data; do
      if [ -n "${var_data}" ]; then
        var_name=$(echo "${var_data}" | cut -d'=' -f1)
        var_value=$(echo "${var_data}" | cut -d'=' -f2-)
        if [ "${first}" = "false" ]; then
          echo ","
        fi
        printf '  "%s": "%s"' "${var_name}" "${var_value}"
        first=false
      fi
    done
    echo ""
    echo "}"
    ;;

  yaml)
    echo "# Environment Variables"
    echo "# Generated on $(date || true)"
    echo "environment:"
    echo "${env_vars}" | while IFS= read -r var_data; do
      if [ -n "${var_data}" ]; then
        var_name=$(echo "${var_data}" | cut -d'=' -f1)
        var_value=$(echo "${var_data}" | cut -d'=' -f2-)
        printf "  %s: \"%s\"\n" "${var_name}" "${var_value}"
      fi
    done
    ;;

  table)
    # Print title
    echo "# Container Environment Variables"
    echo "Generated on $(date || true) | Variables: ${var_count}"
    echo ""

    # Create padding functions
    pad_string() {
      str="$1"
      width="$2"
      str_len=${#str}
      if [ "${str_len}" -lt "${width}" ]; then
        padding=$((width - str_len))
        spaces=$(printf "%*s" "${padding}" "")
        echo "${str}${spaces}"
      else
        echo "${str}"
      fi
    }

    # Print the header with proper padding
    header_var=$(pad_string "Variable" "${max_var_len}")
    header_val=$(pad_string "Value" "${max_val_len}")
    echo "| ${header_var} | ${header_val} |"

    # Print the separator line
    separator_var=$(printf "%*s" "${max_var_len}" "" | tr ' ' '-')
    separator_val=$(printf "%*s" "${max_val_len}" "" | tr ' ' '-')
    echo "|-${separator_var}-|-${separator_val}-|"

    # Print all variables with proper alignment
    echo "${env_vars}" | while IFS= read -r var_data; do
      if [ -n "${var_data}" ]; then
        var_name=$(echo "${var_data}" | cut -d'=' -f1)
        var_value=$(echo "${var_data}" | cut -d'=' -f2-)

        # Pad both columns to their maximum widths
        padded_var=$(pad_string "${var_name}" "${max_var_len}")
        padded_val=$(pad_string "${var_value}" "${max_val_len}")

        # Print the table row
        echo "| ${padded_var} | ${padded_val} |"
      fi
    done
    ;;
  *)
    log_error "Unsupported output format: ${OUTPUT_FORMAT}"
    exit 1
    ;;
  esac
}

# Function to install with retry logic
install_with_retry() {
  package_name="$1"
  install_command="$2"
  max_attempts=3
  attempt=1

  while [ "${attempt}" -le "${max_attempts}" ]; do
    log_info "Installing ${package_name} (attempt ${attempt}/${max_attempts})..."

    if eval "${install_command}"; then
      log_success "${package_name} installed successfully"
      return 0
    else
      log_warning "Attempt ${attempt} failed for ${package_name}"
      attempt=$((attempt + 1))

      if [ "${attempt}" -le "${max_attempts}" ]; then
        log_info "Waiting 5 seconds before retry..."
        sleep 5
      fi
    fi
  done

  log_error "Failed to install ${package_name} after ${max_attempts} attempts"
  return 1
}

# System initialization function
system_init() {
  log_info "Starting system initialization..."

  # Check if running as root (optional warning)
  user_id=$(id -u)
  if [ "${user_id}" = "0" ]; then
    log_warning "Running as root - this may not be necessary for all operations"
  fi

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
  command_exists fish
  fish_available=$?
  if [ "${fish_available}" -ne 0 ]; then
    log_error "Fish shell installation failed - command not found"
    exit 1
  fi

  log_success "System setup completed successfully"
}

# Development environment setup function
dev_setup() {
  log_info "Starting development environment setup..."

  # Install Trunk (code quality toolkit)
  command_exists trunk
  trunk_installed=$?
  if [ "${trunk_installed}" -ne 0 ]; then
    install_with_retry "Trunk" "curl -fsSL https://get.trunk.io | sh"
    trunk_install_result=$?
    if [ "${trunk_install_result}" -ne 0 ]; then
      log_error "Failed to install Trunk - continuing anyway"
    fi
  else
    log_info "Trunk already installed"
  fi

  # Install mise (development environment manager)
  command_exists mise
  mise_installed=$?
  if [ "${mise_installed}" -ne 0 ]; then
    install_with_retry "mise" "curl -fsSL https://mise.run | sh"
    mise_install_result=$?
    if [ "${mise_install_result}" -ne 0 ]; then
      log_error "Failed to install mise"
      exit 1
    fi
  else
    log_info "mise already installed"
  fi

  # Trust and install mise tools
  log_info "Configuring mise environment..."
  mise trust 2>/dev/null
  trust_result=$?
  if [ "${trust_result}" -ne 0 ]; then
    log_warning "Failed to trust mise configuration"
  fi

  if ! mise install; then
    log_error "Failed to install mise tools"
    exit 1
  fi

  log_success "mise tools installed successfully"

  # Install Node.js dependencies
  log_info "Installing Node.js dependencies..."
  if ! bun install; then
    log_error "Failed to install dependencies with bun"
    exit 1
  fi

  log_success "Dependencies installed successfully"

  # Run project reset/build
  log_info "Building project..."
  if ! bun run reset; then
    log_error "Failed to reset/build project"
    exit 1
  fi

  log_success "Project build completed successfully"
}

# Parse command line arguments
parse_args() {
  while [ $# -gt 0 ]; do
    case "$1" in
    --filter)
      if [ $# -lt 2 ]; then
        log_error "--filter requires a pattern argument"
        exit 1
      fi
      FILTER_PATTERN="$2"
      shift 2
      ;;
    --hide-sensitive)
      HIDE_SENSITIVE="true"
      shift
      ;;
    --format)
      if [ $# -lt 2 ]; then
        log_error "--format requires a format argument"
        exit 1
      fi
      case "$2" in
      table | json | yaml)
        OUTPUT_FORMAT="$2"
        ;;
      *)
        log_error "Invalid format '$2'. Use: table, json, yaml"
        exit 1
        ;;
      esac
      shift 2
      ;;
    --env-only)
      ENV_ONLY="true"
      shift
      ;;
    --setup-only)
      SETUP_ONLY="true"
      shift
      ;;
    --env-help)
      show_env_help
      exit 0
      ;;
    --help | -h)
      show_env_help
      exit 0
      ;;
    *)
      log_error "Unknown option: $1"
      show_env_help
      exit 1
      ;;
    esac
  done
}

# Main function
main() {
  parse_args "$@"

  # Check for conflicting options
  if [ "${ENV_ONLY}" = "true" ] && [ "${SETUP_ONLY}" = "true" ]; then
    log_error "Cannot specify both --env-only and --setup-only"
    exit 1
  fi

  # Run environment inspector only
  if [ "${ENV_ONLY}" = "true" ]; then
    inspect_environment
    exit 0
  fi

  # Run setup only (skip system init and env display)
  if [ "${SETUP_ONLY}" = "true" ]; then
    dev_setup
    printf "\n%s===== DEVELOPMENT ENVIRONMENT READY =====%s\n" "${GREEN}" "${NC}"
    log_info "Environment setup completed successfully!"
    log_info "You can now start development with: bun run dev"
    exit 0
  fi

  # Full initialization process
  system_init

  # Display environment information
  log_info "Displaying environment information..."
  inspect_environment

  printf "\n\n%s===== SYSTEM SETUP COMPLETE =====%s\n\n" "${BLUE}" "${NC}"

  # Run development environment setup
  dev_setup

  # Display completion message
  printf "\n%s===== DEVELOPMENT ENVIRONMENT READY =====%s\n" "${GREEN}" "${NC}"
  log_info "Full initialization completed successfully!"
  log_info "You can now start development with: bun run dev"
}

# Run main function with all arguments
main "$@"
