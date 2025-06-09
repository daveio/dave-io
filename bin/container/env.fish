#!/usr/bin/env fish

# Container environment inspector - prints environment variables as a nicely formatted Markdown table
# Usage: ./env.fish [--filter PATTERN] [--hide-sensitive] [--format FORMAT]
#
# Arguments:
#   --filter PATTERN     Only show variables matching pattern (case-insensitive)
#   --hide-sensitive     Mask values for potentially sensitive variables
#   --format FORMAT      Output format: table (default), json, yaml
#   --help              Show this help message

function show_help
    echo "Container Environment Inspector"
    echo "Usage: "(status current-filename)" [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --filter PATTERN     Only show variables matching pattern"
    echo "  --hide-sensitive     Mask values for sensitive variables"
    echo "  --format FORMAT      Output format: table, json, yaml"
    echo "  --help              Show this help"
    echo ""
    echo "Examples:"
    echo "  "(status current-filename)"                           # Show all variables as table"
    echo "  "(status current-filename)" --filter NODE             # Show only NODE* variables"
    echo "  "(status current-filename)" --hide-sensitive          # Mask sensitive values"
    echo "  "(status current-filename)" --format json             # Output as JSON"
end

# Parse command line arguments
set filter_pattern ""
set hide_sensitive false
set output_format "table"

for i in (seq (count $argv))
    switch $argv[$i]
        case --filter
            if test $i -lt (count $argv)
                set filter_pattern $argv[(math $i + 1)]
            else
                echo "Error: --filter requires a pattern argument" >&2
                exit 1
            end
        case --hide-sensitive
            set hide_sensitive true
        case --format
            if test $i -lt (count $argv)
                set output_format $argv[(math $i + 1)]
                if not contains $output_format table json yaml
                    echo "Error: Invalid format '$output_format'. Use: table, json, yaml" >&2
                    exit 1
                end
            else
                echo "Error: --format requires a format argument" >&2
                exit 1
            end
        case --help -h
            show_help
            exit 0
    end
end

# Sensitive variable patterns (case-insensitive)
set sensitive_patterns "SECRET" "PASSWORD" "TOKEN" "KEY" "AUTH" "CREDENTIAL" "PRIVATE"

function is_sensitive
    set var_name (string upper $argv[1])
    for pattern in $sensitive_patterns
        if string match -q "*$pattern*" $var_name
            return 0
        end
    end
    return 1
end

function mask_value
    set value $argv[1]
    set length (string length $value)
    if test $length -le 8
        echo "***"
    else
        set visible (string sub -s 1 -l 3 $value)
        echo "$visible...(masked)"
    end
end

# Collect and process environment variables
set all_vars
set max_var_len 8   # minimum width for "Variable" header
set max_val_len 5   # minimum width for "Value" header

for var in (env | sort)
    set parts (string split -m 1 "=" $var)
    set var_name $parts[1]
    set var_value $parts[2]

    # Apply filter if specified
    if test -n "$filter_pattern"
        if not string match -qi "*$filter_pattern*" $var_name
            continue
        end
    end

    # Handle sensitive variables
    if test $hide_sensitive = true; and is_sensitive $var_name
        set var_value (mask_value $var_value)
    end

    # Escape special characters based on output format
    switch $output_format
        case table
            set var_value (string replace -a "|" "\\|" $var_value)
        case json
            set var_value (string replace -a '"' '\\"' $var_value)
            set var_value (string replace -a '\\' '\\\\' $var_value)
    end

    # Track maximum lengths for table formatting
    set var_len (string length $var_name)
    if test $var_len -gt $max_var_len
        set max_var_len $var_len
    end

    set val_len (string length $var_value)
    if test $val_len -gt $max_val_len
        set max_val_len $val_len
    end

    # Store the variable data
    set all_vars $all_vars "$var_name=$var_value"
end

# Output in requested format
switch $output_format
    case json
        echo "{"
        set first true
        for var_data in $all_vars
            set parts (string split -m 1 "=" $var_data)
            if test $first = false
                echo ","
            end
            printf '  "%s": "%s"' $parts[1] $parts[2]
            set first false
        end
        echo ""
        echo "}"

    case yaml
        echo "# Environment Variables"
        echo "# Generated on "(date)
        echo "environment:"
        for var_data in $all_vars
            set parts (string split -m 1 "=" $var_data)
            printf "  %s: \"%s\"\n" $parts[1] $parts[2]
        end

    case table
        # Print title
        echo "# Container Environment Variables"
        echo "Generated on "(date)" | Variables: "(count $all_vars)
        echo ""

        # Print the header with proper padding
        set header_var (string pad -w $max_var_len "Variable")
        set header_val (string pad -w $max_val_len "Value")
        echo "| $header_var | $header_val |"

        # Print the separator line
        set separator_var (string repeat -n $max_var_len "-")
        set separator_val (string repeat -n $max_val_len "-")
        echo "|-$separator_var-|-$separator_val-|"

        # Print all variables with proper alignment
        for var_data in $all_vars
            set parts (string split -m 1 "=" $var_data)
            set var_name $parts[1]
            set var_value $parts[2]

            # Pad both columns to their maximum widths
            set padded_var (string pad -w $max_var_len $var_name)
            set padded_val (string pad -w $max_val_len $var_value)

            # Print the table row
            echo "| $padded_var | $padded_val |"
        end
end

