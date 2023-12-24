sudo docker run \
    --rm \
    -e RENOVATE_REPOSITORIES="$RENOVATE_REPOSITORIES" \
    -v "./renovate/config.js:/usr/src/app/config.js" \
    renovate/renovate \
    --token "$RENOVATE_TOKEN" \
    --dry-run="false"
