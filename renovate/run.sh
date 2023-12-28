sudo docker run \
    --rm \
    -e RENOVATE_REPOSITORIES="$RENOVATE_REPOSITORIES" \
    # I don't know why
    -e RENOVATE_GIT_AUTHOR="renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>" \
    -v "./renovate/config.js:/usr/src/app/config.js" \
    renovate/renovate \
    --token "$RENOVATE_TOKEN" \
    --dry-run="false"
