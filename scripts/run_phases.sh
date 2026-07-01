#!/bin/bash
# Run phased translation in batches
# This script processes ~4200 candidates in small batches to avoid Ollama overload

set -e
cd "$(dirname "$0")/.."

BATCH_SIZE=25
DELAY_MS=4000
OUTPUT_SCRIPT="scripts/phase_translations.txt"
RESULTS_JSON="scripts/phase_translations.json"
CANDIDATES_TXT="scripts/filtered_candidates.txt"
LOG_FILE="scripts/translate_progress.log"

echo "Starting phased translation at $(date)" | tee -a "$LOG_FILE"
echo "Batch size: $BATCH_SIZE, Delay: ${DELAY_MS}ms" | tee -a "$LOG_FILE"

# Run the translation script
node scripts/phased_translate.cjs $BATCH_SIZE $DELAY_MS 2>&1 | tee -a "$LOG_FILE"

echo "Finished at $(date)" | tee -a "$LOG_FILE"

# Count results
if [ -f "$RESULTS_JSON" ]; then
  COUNT=$(node -e "const j=require('./$RESULTS_JSON'); console.log(Object.keys(j).length)")
  echo "Total translations collected: $COUNT" | tee -a "$LOG_FILE"
fi
