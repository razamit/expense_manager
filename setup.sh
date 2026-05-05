#!/usr/bin/env bash

set -euo pipefail

NO_START=0
SKIP_NODE_INSTALL=0
SKIP_INSTALL=0
FORCE_ENV=0

print_info() {
  printf '[setup] %s\n' "$1"
}

print_help() {
  cat <<'EOF'
FinanceChecker setup

Usage: bash ./setup.sh [options]

Options:
  --no-start           Prepare the repo and database without starting the dev server
  --skip-node-install  Do not try to install Node.js/npm when missing
  --skip-install       Skip npm ci and reuse the current node_modules
  --force-env          Recreate .env from .env.example
  --help               Show this help message
EOF
}

parse_args() {
  while (($# > 0)); do
    case "$1" in
      --no-start)
        NO_START=1
        ;;
      --skip-node-install)
        SKIP_NODE_INSTALL=1
        ;;
      --skip-install)
        SKIP_INSTALL=1
        ;;
      --force-env)
        FORCE_ENV=1
        ;;
      --help|-h)
        print_help
        exit 0
        ;;
      *)
        printf 'Unknown option: %s\n' "$1" >&2
        exit 1
        ;;
    esac
    shift
  done
}

run_with_optional_sudo() {
  if [[ "$(id -u)" -eq 0 ]]; then
    "$@"
    return
  fi

  if command -v sudo >/dev/null 2>&1; then
    sudo "$@"
    return
  fi

  "$@"
}

install_node_with_brew() {
  print_info "Trying Homebrew to install Node.js."
  brew install node
}

install_node_linux() {
  if command -v apt-get >/dev/null 2>&1; then
    print_info "Trying apt-get to install Node.js and npm."
    run_with_optional_sudo apt-get update
    run_with_optional_sudo apt-get install -y nodejs npm
    return
  fi

  if command -v dnf >/dev/null 2>&1; then
    print_info "Trying dnf to install Node.js and npm."
    run_with_optional_sudo dnf install -y nodejs npm
    return
  fi

  if command -v yum >/dev/null 2>&1; then
    print_info "Trying yum to install Node.js and npm."
    run_with_optional_sudo yum install -y nodejs npm
    return
  fi

  if command -v pacman >/dev/null 2>&1; then
    print_info "Trying pacman to install Node.js and npm."
    run_with_optional_sudo pacman -Sy --noconfirm nodejs npm
    return
  fi

  printf 'Could not auto-install Node.js on this Linux system. Install Node.js 18+ manually and rerun setup.\n' >&2
  exit 1
}

install_node_if_needed() {
  if command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
    print_info "Node.js and npm are already available."
    return
  fi

  if [[ "$SKIP_NODE_INSTALL" -eq 1 ]]; then
    printf 'Node.js/npm are missing and --skip-node-install was provided. Install Node.js 18+ manually and rerun setup.\n' >&2
    exit 1
  fi

  print_info "Node.js or npm is missing. Trying to install Node.js."

  case "$(uname -s)" in
    Darwin)
      if command -v brew >/dev/null 2>&1; then
        install_node_with_brew
      else
        printf 'Homebrew is not available. Install Node.js 18+ manually and rerun setup.\n' >&2
        exit 1
      fi
      ;;
    Linux)
      install_node_linux
      ;;
    *)
      printf 'Unsupported platform for setup.sh. Use setup.ps1 on Windows or install Node.js 18+ manually.\n' >&2
      exit 1
      ;;
  esac

  if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
    printf 'Node.js installation completed but node/npm are still not on PATH. Open a new terminal and rerun setup.\n' >&2
    exit 1
  fi

  print_info "Node.js installation succeeded."
}

main() {
  local repo_root
  repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  cd "$repo_root"

  parse_args "$@"
  install_node_if_needed

  local node_args=("scripts/setup.cjs")

  if [[ "$NO_START" -eq 1 ]]; then
    node_args+=("--no-start")
  fi

  if [[ "$SKIP_INSTALL" -eq 1 ]]; then
    node_args+=("--skip-install")
  fi

  if [[ "$FORCE_ENV" -eq 1 ]]; then
    node_args+=("--force-env")
  fi

  print_info "Running shared setup flow from $repo_root"
  node "${node_args[@]}"
}

main "$@"