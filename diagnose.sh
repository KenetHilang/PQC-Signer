#!/usr/bin/env bash
# Run this on the VPS to diagnose the auth 500 error
set -euo pipefail

echo "=== Python version ==="
python3 --version 2>&1 || echo "python3 not found"
/home/amoes_noland/.local/bin/uv run python --version 2>&1 || echo "uv python not found"

echo ""
echo "=== Backend service status ==="
sudo systemctl status q-sealnet-backend --no-pager 2>&1 | head -20

echo ""
echo "=== Recent backend logs ==="
sudo journalctl -u q-sealnet-backend --no-pager -n 30 2>&1

echo ""
echo "=== .env file ==="
cat /opt/q-sealnet/backend/.env 2>&1 | sed 's/QSEALNET_SECRET_KEY=.*/QSEALNET_SECRET_KEY=**REDACTED**/'

echo ""
echo "=== Auth module check ==="
cd /opt/q-sealnet/backend
/home/amoes_noland/.local/bin/uv run python -c "
from app import create_app
app = create_app()
print('AUTH_SERVICE in config:', 'AUTH_SERVICE' in app.config)
print('Secret key type:', type(app.config.get('SECRET_KEY')))
print('Users dir:', app.config['APP_CONFIG'].users_dir)
import os
print('Users dir exists:', os.path.exists(app.config['APP_CONFIG'].users_dir))
print('Users dir writable:', os.access(app.config['APP_CONFIG'].users_dir, os.W_OK))
" 2>&1

echo ""
echo "=== Test register locally ==="
/home/amoes_noland/.local/bin/uv run python -c "
from app import create_app
app = create_app()
with app.test_client() as c:
    r = c.post('/auth/register', json={'username':'diagtest','email':'diag@test.com','password':'Test12345!'})
    print('Status:', r.status_code)
    print('Body:', r.get_json())
" 2>&1

echo ""
echo "=== itsdangerous installed? ==="
/home/amoes_noland/.local/bin/uv run pip show itsdangerous 2>&1 || echo "itsdangerous NOT installed"

echo ""
echo "=== Code version check ==="
cd /opt/q-sealnet/backend
echo "auth.py last modified:"
stat -c '%y' app/auth.py 2>&1
echo "First line of auth.py:"
head -1 app/auth.py 2>&1
echo "Has datetime.UTC import?"
grep "from datetime import UTC" app/auth.py 2>&1 || echo "NO datetime.UTC import"
