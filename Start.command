#!/usr/bin/env bash
# FinanceChecker double-click launcher for macOS.
# Finder opens .command files in Terminal. Ensures Node, then runs the
# production launch flow and opens the browser.

cd "$(dirname "$0")" || exit 1

bash setup.sh --launch
