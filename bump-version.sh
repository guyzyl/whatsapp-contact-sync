#!/bin/bash

# Usage: ./bump-version.sh [patch|minor|major]
# Default is patch if no argument provided

VERSION_TYPE=${1:-patch}

echo "Bumping ${VERSION_TYPE} version for web and server..."

# Bump web version
cd web && npm version "${VERSION_TYPE}" --no-git-tag-version
cd ..

# Bump server version
cd server && npm version "${VERSION_TYPE}" --no-git-tag-version
cd ..

WEB_VERSION=$(node -p "require('./web/package.json').version")
SERVER_VERSION=$(node -p "require('./server/package.json').version")

echo "Version bump complete!"
echo ""
echo "Web version: ${WEB_VERSION}"
echo "Server version: ${SERVER_VERSION}"

# Commit the version changes
echo ""
echo "Committing package.json changes..."
git add web/package.json web/package-lock.json server/package.json server/package-lock.json
git commit -Ssm "chore: bump version to ${WEB_VERSION}"

# Create git tag
if [[ "${WEB_VERSION}" = "${SERVER_VERSION}" ]]; then
	TAG="v${WEB_VERSION}"
	echo ""
	echo "Creating signed git tag: ${TAG}"
	git tag -s "${TAG}" -m "v${WEB_VERSION} release"
	echo "Git tag created. Push with: git push origin ${TAG}"
else
	echo ""
	echo "Warning: Web and Server versions differ!"
	echo "Web version: ${WEB_VERSION}"
	echo "Server version: ${SERVER_VERSION}"
	echo "No git tags created."
fi
