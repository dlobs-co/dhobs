#!/bin/bash

# Project S: HomeForge Installation Script for Linux
# --------------------------------------------------

set -e

echo "Starting Project S HomeForge installation..."

# 1. Check for Docker
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed. Please install Docker first: https://docs.docker.com/get-docker/"
    exit 1
fi

# 2. Check for Docker Compose (plugin or standalone)
if ! docker compose version &> /dev/null && ! command -v docker-compose &> /dev/null; then
    echo "Error: Docker Compose is not installed. Please install it: https://docs.docker.com/compose/install/"
    exit 1
fi

# 3. Create necessary data and config directories
echo "Creating data and configuration directories..."
mkdir -p ./data/jellyfin/config ./data/jellyfin/cache ./data/media
mkdir -p ./data/nextcloud/html ./data/nextcloud/data ./data/nextcloud/db
mkdir -p ./data/matrix/db ./data/matrix/synapse
mkdir -p ./data/vaultwarden
mkdir -p ./config/matrix

# Ensure Nextcloud directories have correct permissions (UID 33 is www-data in the container)
echo "Setting permissions for Nextcloud..."
sudo chown -R 33:33 ./data/nextcloud/html ./data/nextcloud/data

# 4. Initialize Matrix Element configuration
# This prevents Docker from creating a directory instead of a file during volume mounting
if [ ! -f ./config/matrix/element-config.json ]; then
    echo "Initializing Matrix Element configuration..."
    cat <<EOF > ./config/matrix/element-config.json
{
    "default_server_config": {
        "m.homeserver": {
            "base_url": "http://localhost:8008",
            "server_name": "localhost"
        },
        "m.identity_server": {
            "base_url": "https://vector.im"
        }
    },
    "disable_custom_urls": false,
    "disable_guests": false,
    "disable_login_language_selector": false,
    "disable_3pid_login": false,
    "brand": "Element",
    "default_theme": "dark"
}
EOF
fi

# 5. Build and start the containers
echo "Building and starting containers in the background..."
docker compose up -d --build

echo "--------------------------------------------------"
echo "Installation complete! Your services are starting."
echo "--------------------------------------------------"
echo "Dashboard:      http://localhost:3069"
echo "Jellyfin:       http://localhost:8096"
echo "Nextcloud:      http://localhost:8081"
echo "Code Server:    http://localhost:3030"
echo "Matrix Element: http://localhost:8082"
echo "Vaultwarden:    http://localhost:8083"
echo "--------------------------------------------------"

# 6. Post-Installation Configuration
echo "Finalizing Nextcloud Hub configuration (this may take a moment)..."

# Give Nextcloud a moment to fully initialize its internal services
sleep 15

# Ensure the core Hub apps are installed (Calendar, Contacts, Mail, Talk, Office)
echo "Installing Nextcloud Hub app suite..."
docker exec -u www-data project-s-nextcloud php occ app:install calendar || true
docker exec -u www-data project-s-nextcloud php occ app:install contacts || true
docker exec -u www-data project-s-nextcloud php occ app:install mail || true
docker exec -u www-data project-s-nextcloud php occ app:install spreed || true
docker exec -u www-data project-s-nextcloud php occ app:install richdocuments || true

# Allow Nextcloud to make requests to local/internal network addresses (needed for Collabora)
docker exec -u www-data project-s-nextcloud php occ config:system:set allow_local_remote_servers --value=true --type=boolean || true

# --- Collabora Online (Office) Configuration ---
# Collabora runs with network_mode: host, so:
#   wopi_url:        Nextcloud PHP → Collabora via host.docker.internal (host-gateway)
#   public_wopi_url: Browser → Collabora via localhost (host port)
#   Collabora → Nextcloud WOPI: uses localhost:8081 directly (host network)
docker exec -u www-data project-s-nextcloud php occ config:app:set richdocuments wopi_url --value="http://host.docker.internal:9980" || true
docker exec -u www-data project-s-nextcloud php occ config:app:set richdocuments public_wopi_url --value="http://localhost:9980" || true
docker exec -u www-data project-s-nextcloud php occ config:app:set richdocuments nextcloud_url --value="http://nextcloud" || true
docker exec -u www-data project-s-nextcloud php occ config:app:set richdocuments disable_certificate_verification --value="yes" || true

echo "Configuration complete! You can view logs using: docker compose logs -f"
