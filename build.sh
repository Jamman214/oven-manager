#!/bin/bash

PLATFORM="local"

usage() {
    echo "Usage: $0 [local|pi]"
    echo
    echo "  Arguments can be in any order."
    echo "    [local|pi]    Specifies the platform (default: local)."
    exit 1
}

if [ "$#" -gt 1 ]; then
    echo "Error: Incorrect number of arguments."
    usage
elif [ "$#" -eq 1 ]; then
    PLATFORM="$1"
    case "$1" in
        local|pi)
            PLATFORM="$1"
        ;;
        *)
            echo "Error: Unknown argument '$1'."
            usage
        ;;
    esac
fi

case "$PLATFORM" in
    local)
        echo "Building and loading for local"
        docker buildx bake --file compose.yml --set *.platform=local --load
    ;;
    pi)
        echo "Building and pushing for pi"
        docker buildx bake --file compose.yml --set *.platform=linux/arm/v6 --push
    ;;
esac