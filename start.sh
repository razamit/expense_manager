#!/usr/bin/env bash
# FinanceChecker launcher for Linux.
# Ensures Node, then runs the production launch flow and opens the browser.

cd "$(dirname "$0")" || exit 1

bash setup.sh --launch
