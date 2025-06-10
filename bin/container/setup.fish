#!/usr/bin/env fish

# Development environment setup script
# Installs development tools and dependencies for the next-dave-io project

# Color codes for better output (fish style)
set -g RED '\033[0;31m'
set -g GREEN '\033[0;32m'
set -g YELLOW '\033[0;33m'
set -g BLUE '\033[0;34m'
set -g NC '\033[0m' # No Color

# Logging functions
function log_info
    printf "$BLUE[INFO]$NC %s\n" "$argv"
end

function log_success
    printf "$GREEN[SUCCESS]$NC %s\n" "$argv"
end

function log_warning
    printf "$YELLOW[WARNING]$NC %s\n" "$argv"
end

function log_error
    printf "$RED[ERROR]$NC %s\n" "$argv" >&2
end

# Function to check if a command exists
function command_exists
    command -v $argv[1] >/dev/null 2>&1
end

# Function to install with retry logic
function install_with_retry
    set max_attempts 3
    set attempt 1

    while test $attempt -le $max_attempts
        log_info "Installing $argv[1] (attempt $attempt/$max_attempts)..."

        if eval $argv[2]
            log_success "$argv[1] installed successfully"
            return 0
        else
            log_warning "Attempt $attempt failed for $argv[1]"
            set attempt (math $attempt + 1)

            if test $attempt -le $max_attempts
                log_info "Waiting 5 seconds before retry..."
                sleep 5
            end
        end
    end

    log_error "Failed to install $argv[1] after $max_attempts attempts"
    return 1
end

# Main setup process
function main
    log_info "Starting development environment setup..."

    # Install Trunk (code quality toolkit)
    if not command_exists trunk
        if not install_with_retry "Trunk" "curl -fsSL https://get.trunk.io | sh"
            log_error "Failed to install Trunk - continuing anyway"
        end
    else
        log_info "Trunk already installed"
    end

    # Install mise (development environment manager)
    if not command_exists mise
        if not install_with_retry "mise" "curl -fsSL https://mise.run | sh"
            log_error "Failed to install mise"
            exit 1
        end
    else
        log_info "mise already installed"
    end

    # Trust and install mise tools
    log_info "Configuring mise environment..."
    if not mise trust 2>/dev/null
        log_warning "Failed to trust mise configuration"
    end

    if not mise install
        log_error "Failed to install mise tools"
        exit 1
    end

    log_success "mise tools installed successfully"

    # Install Node.js dependencies
    log_info "Installing Node.js dependencies..."
    if not bun install
        log_error "Failed to install dependencies with bun"
        exit 1
    end

    log_success "Dependencies installed successfully"

    # Run project reset/build
    log_info "Building project..."
    if not bun run reset
        log_error "Failed to reset/build project"
        exit 1
    end

    log_success "Project build completed successfully"

    # Display completion message
    printf "\n$GREEN===== DEVELOPMENT ENVIRONMENT READY =====$NC\n"
    log_info "Environment setup completed successfully!"
    log_info "You can now start development with: bun run dev"
end

# Run main function
main
