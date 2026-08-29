#!/usr/bin/env bash
#
# Sets up the Vertex AI backend, so nobody has to click through Cloud Console.
#
# Creates (or reuses) a project, enables the API, makes a service account with
# the one role it needs, issues a key, and writes it into .env.local. Every step
# is skipped if it has already been done, so re-running is safe.
#
# Usage:  npm run setup:vertex            # project rakshabot-<random>
#         npm run setup:vertex my-project # a project id you choose
set -euo pipefail

BOLD=$'\033[1m'; DIM=$'\033[2m'; GREEN=$'\033[32m'; RED=$'\033[31m'; OFF=$'\033[0m'
say()  { printf '%s\n' "$*"; }
step() { printf '%s→%s %s\n' "$BOLD" "$OFF" "$*"; }
ok()   { printf '  %s✓%s %s\n' "$GREEN" "$OFF" "$*"; }
die()  { printf '%s✗%s %s\n' "$RED" "$OFF" "$*" >&2; exit 1; }

SA_NAME="rakshabot-gemini"
ROLE="roles/aiplatform.user"
ENV_FILE=".env.local"

command -v gcloud >/dev/null 2>&1 || die \
"The Google Cloud CLI is not installed.

  macOS    brew install --cask google-cloud-sdk
  Windows  https://cloud.google.com/sdk/docs/install
  Linux    https://cloud.google.com/sdk/docs/install#deb

Then run: gcloud auth login"

ACCOUNT=$(gcloud config get-value account 2>/dev/null || true)
[ -n "$ACCOUNT" ] && [ "$ACCOUNT" != "(unset)" ] || die \
"You are not signed in to gcloud. Run:

  gcloud auth login"
ok "signed in as $ACCOUNT"

# ── Project ──────────────────────────────────────────────────────────────────
PROJECT="${1:-}"
if [ -z "$PROJECT" ]; then
  PROJECT="rakshabot-$(LC_ALL=C tr -dc 'a-z0-9' </dev/urandom | head -c 8)"
fi

step "Project $PROJECT"
if gcloud projects describe "$PROJECT" >/dev/null 2>&1; then
  ok "already exists"
else
  gcloud projects create "$PROJECT" --name="RakshaBot" >/dev/null
  ok "created"
fi
gcloud config set project "$PROJECT" >/dev/null 2>&1

# Vertex AI is a billed API; without billing the enable step fails with a
# message that does not say so plainly, hence the check up front.
BILLING=$(gcloud beta billing projects describe "$PROJECT" \
  --format='value(billingEnabled)' 2>/dev/null || echo "unknown")
if [ "$BILLING" = "False" ]; then
  die "Billing is not enabled on $PROJECT, and Vertex AI requires it.

Enable it at:
  https://console.cloud.google.com/billing/linkedaccount?project=$PROJECT

Then run this script again — it will pick up where it left off."
fi

# ── API ──────────────────────────────────────────────────────────────────────
step "Vertex AI API"
if gcloud services list --enabled --project "$PROJECT" 2>/dev/null \
     | grep -q '^aiplatform\.googleapis\.com'; then
  ok "already enabled"
else
  say "  ${DIM}enabling (this takes a moment)…${OFF}"
  gcloud services enable aiplatform.googleapis.com --project "$PROJECT" >/dev/null
  ok "enabled"
fi

# ── Service account ──────────────────────────────────────────────────────────
SA_EMAIL="$SA_NAME@$PROJECT.iam.gserviceaccount.com"
step "Service account $SA_NAME"
if gcloud iam service-accounts describe "$SA_EMAIL" --project "$PROJECT" >/dev/null 2>&1; then
  ok "already exists"
else
  gcloud iam service-accounts create "$SA_NAME" \
    --display-name="RakshaBot Gemini" --project "$PROJECT" >/dev/null
  ok "created"
fi

gcloud projects add-iam-policy-binding "$PROJECT" \
  --member="serviceAccount:$SA_EMAIL" --role="$ROLE" \
  --condition=None >/dev/null 2>&1
ok "granted ${ROLE#roles/}"

# ── Key ──────────────────────────────────────────────────────────────────────
step "Key"
KEY_FILE=$(mktemp)
# The key is written to a temp file, folded into .env.local, and deleted — it is
# a private key and has no business sitting in the project directory.
trap 'rm -f "$KEY_FILE"' EXIT
gcloud iam service-accounts keys create "$KEY_FILE" \
  --iam-account="$SA_EMAIL" --project "$PROJECT" >/dev/null 2>&1
ok "issued"

# Base64, deliberately. The raw JSON carries quotes and newlines, which .env
# parsers, shells and dashboard fields each mangle in their own way; base64 is
# one unbroken token of [A-Za-z0-9+/=] that survives all of them. The server
# accepts either form.
ONE_LINE=$(base64 < "$KEY_FILE" | tr -d '\n')

# ── .env.local ───────────────────────────────────────────────────────────────
step "Writing $ENV_FILE"
[ -f "$ENV_FILE" ] || : > "$ENV_FILE"
# Drop any previous values so re-running replaces rather than duplicates.
grep -vE '^(GOOGLE_SERVICE_ACCOUNT_KEY|GOOGLE_CLOUD_PROJECT)=' "$ENV_FILE" > "$ENV_FILE.tmp" || true
mv "$ENV_FILE.tmp" "$ENV_FILE"
{
  printf 'GOOGLE_SERVICE_ACCOUNT_KEY=%s\n' "$ONE_LINE"
  printf 'GOOGLE_CLOUD_PROJECT=%s\n' "$PROJECT"
} >> "$ENV_FILE"
ok "$ENV_FILE updated (gitignored)"

VERCEL_FILE="vertex-key-for-vercel.txt"
{
  printf 'GOOGLE_SERVICE_ACCOUNT_KEY\n%s\n\nGOOGLE_CLOUD_PROJECT\n%s\n' "$ONE_LINE" "$PROJECT"
} > "$VERCEL_FILE"

cat <<EOF

${GREEN}${BOLD}Done.${OFF} Local development will now use Vertex AI:

  npm run dev
  open http://localhost:5173/api/health?live=1

${BOLD}For the deployed site${OFF} — Vercel → Settings → Environment Variables. The two
values to paste are in ${BOLD}$VERCEL_FILE${OFF} (gitignored). Add both, redeploy,
then check https://<your-site>/api/health?live=1

Delete $VERCEL_FILE once pasted — it contains a private key.
EOF
