#!/bin/bash
# Read HOMEFORGE_LAN_IP from the running Nextcloud container so this script
# always uses the same value as setup-office.sh and docker-compose.yml.
PUBLIC_HOST=$(docker exec project-s-nextcloud printenv HOMEFORGE_LAN_IP 2>/dev/null)
PUBLIC_HOST="${PUBLIC_HOST:-localhost}"

docker exec -u www-data project-s-nextcloud php /var/www/html/occ config:app:set richdocuments wopi_url --value="http://collabora:9980"
docker exec -u www-data project-s-nextcloud php /var/www/html/occ config:app:set richdocuments wopi_callback_url --value="http://nextcloud:80"
docker exec -u www-data project-s-nextcloud php /var/www/html/occ config:app:set richdocuments public_wopi_url --value="http://${PUBLIC_HOST}:9980"
docker exec -u www-data project-s-nextcloud php /var/www/html/occ config:system:set allow_local_remote_servers --value=true --type=boolean
docker exec -u www-data project-s-nextcloud php /var/www/html/occ config:system:set trusted_domains 3 --value="collabora"
echo "---"
docker exec -u www-data project-s-nextcloud php /var/www/html/occ config:app:get richdocuments wopi_callback_url
