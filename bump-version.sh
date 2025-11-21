#!/bin/bash

# Usage: ./bump-version.sh [patch|minor|major]

if [[ -z "$1" ]]; then
	echo "Which version to bump?"
	echo "1) patch (x.y.Z) [default]"
	echo "2) minor (x.Y.0)"
	echo "3) major (X.0.0)"

	# Countdown timer
	for i in {5..1}; do
		echo -ne "\rEnter choice [1-3] (timeout in ${i}s, default=1): "
		read -r -t 1 -n 1 choice && break
	done

	if [[ -z "${choice}" ]]; then
		echo ""
		echo "Timeout reached. Using default: patch"
		choice=1
	else
		echo ""
	fi

	case ${choice} in
	1 | "") VERSION_TYPE="patch" ;;
	2) VERSION_TYPE="minor" ;;
	3) VERSION_TYPE="major" ;;
	*)
		echo "Invalid choice. Using default: patch"
		VERSION_TYPE="patch"
		;;
	esac
else
	VERSION_TYPE=$1
fi

echo "Bumping ${VERSION_TYPE} version for web and server..."

# Bump web version
(cd web && npm version "${VERSION_TYPE}" --no-git-tag-version)

# Bump server version
(cd server && npm version "${VERSION_TYPE}" --no-git-tag-version)

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
