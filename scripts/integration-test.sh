#!/bin/bash

# Integration Test Runner for uni-git providers
# This script checks for available credentials and runs appropriate tests

set -e

echo "🧪 Running uni-git Integration Tests"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track what we can test
AVAILABLE_TESTS=()
SKIPPED_TESTS=()

# Check GitHub credentials
echo -n "🔍 Checking GitHub credentials... "
if [ -n "$GITHUB_TOKEN" ]; then
    echo -e "${GREEN}✅ Found${NC}"
    AVAILABLE_TESTS+=("github")
    if [ -n "$GITHUB_BASE_URL" ]; then
        echo "   🏢 GitHub Enterprise URL detected: $GITHUB_BASE_URL"
    fi
    if [ -n "$GITHUB_APP_ID" ] && [ -n "$GITHUB_APP_PRIVATE_KEY" ]; then
        echo "   🤖 GitHub App credentials detected"
    fi
else
    echo -e "${YELLOW}❌ Missing${NC}"
    SKIPPED_TESTS+=("github")
fi

# Check GitLab credentials  
echo -n "🔍 Checking GitLab credentials... "
if [ -n "$GITLAB_TOKEN" ]; then
    echo -e "${GREEN}✅ Found${NC}"
    AVAILABLE_TESTS+=("gitlab")
    GITLAB_HOST_DISPLAY=${GITLAB_HOST:-"https://gitlab.com"}
    echo "   🦊 GitLab host: $GITLAB_HOST_DISPLAY"
    if [ -n "$GITLAB_OAUTH_TOKEN" ]; then
        echo "   🔐 OAuth token detected"
    fi
    if [ -n "$GITLAB_JOB_TOKEN" ]; then
        echo "   ⚙️  Job token detected"
    fi
else
    echo -e "${YELLOW}❌ Missing${NC}"
    SKIPPED_TESTS+=("gitlab")
fi

# Check Bitbucket credentials
echo -n "🔍 Checking Bitbucket credentials... "
if [ -n "$BITBUCKET_USERNAME" ] && [ -n "$BITBUCKET_APP_PASSWORD" ]; then
    echo -e "${GREEN}✅ Found${NC}"
    AVAILABLE_TESTS+=("bitbucket")
    echo "   🪣 Username: $BITBUCKET_USERNAME"
    if [ -n "$BITBUCKET_OAUTH_TOKEN" ]; then
        echo "   🔐 OAuth token detected"
    fi
else
    echo -e "${YELLOW}❌ Missing${NC}"
    SKIPPED_TESTS+=("bitbucket")
fi

echo ""

# Show summary
if [ ${#AVAILABLE_TESTS[@]} -eq 0 ]; then
    echo -e "${RED}❌ No provider credentials found!${NC}"
    echo ""
    echo "To run integration tests, set up credentials for at least one provider:"
    echo ""
    echo -e "${BLUE}GitHub:${NC}"
    echo "  export GITHUB_TOKEN=\"ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\""
    echo ""
    echo -e "${BLUE}GitLab:${NC}"
    echo "  export GITLAB_TOKEN=\"glpat-xxxxxxxxxxxxxxxxxxxx\""
    echo ""
    echo -e "${BLUE}Bitbucket:${NC}"
    echo "  export BITBUCKET_USERNAME=\"your-username\""
    echo "  export BITBUCKET_APP_PASSWORD=\"ATBBxxxxxxxxxxxxxxxxxx\""
    echo ""
    echo "See INTEGRATION_TESTING.md for detailed setup instructions."
    exit 1
fi

echo -e "${GREEN}✅ Ready to test ${#AVAILABLE_TESTS[@]} provider(s):${NC} ${AVAILABLE_TESTS[*]}"

if [ ${#SKIPPED_TESTS[@]} -gt 0 ]; then
    echo -e "${YELLOW}⏭️  Skipping ${#SKIPPED_TESTS[@]} provider(s):${NC} ${SKIPPED_TESTS[*]}"
fi

echo ""

# Run tests for available providers
FAILED_TESTS=()
PASSED_TESTS=()

for provider in "${AVAILABLE_TESTS[@]}"; do
    echo -e "${BLUE}🧪 Testing $provider provider...${NC}"
    
    if pnpm run test:integration:$provider; then
        PASSED_TESTS+=("$provider")
        echo -e "${GREEN}✅ $provider tests passed${NC}"
    else
        FAILED_TESTS+=("$provider")
        echo -e "${RED}❌ $provider tests failed${NC}"
    fi
    
    echo ""
done

# Run unified factory tests if we have any providers
if [ ${#AVAILABLE_TESTS[@]} -gt 0 ]; then
    echo -e "${BLUE}🧪 Testing unified factory...${NC}"
    
    if pnpm run test:integration:unified; then
        PASSED_TESTS+=("unified")
        echo -e "${GREEN}✅ Unified factory tests passed${NC}"
    else
        FAILED_TESTS+=("unified")
        echo -e "${RED}❌ Unified factory tests failed${NC}"
    fi
    
    echo ""
fi

# Final summary
echo "🎯 Integration Test Summary"
echo "=========================="
echo -e "${GREEN}✅ Passed (${#PASSED_TESTS[@]}):${NC} ${PASSED_TESTS[*]}"

if [ ${#FAILED_TESTS[@]} -gt 0 ]; then
    echo -e "${RED}❌ Failed (${#FAILED_TESTS[@]}):${NC} ${FAILED_TESTS[*]}"
fi

if [ ${#SKIPPED_TESTS[@]} -gt 0 ]; then
    echo -e "${YELLOW}⏭️  Skipped (${#SKIPPED_TESTS[@]}):${NC} ${SKIPPED_TESTS[*]}"
fi

echo ""

if [ ${#FAILED_TESTS[@]} -eq 0 ]; then
    echo -e "${GREEN}🎉 All available integration tests passed!${NC}"
    exit 0
else
    echo -e "${RED}💥 Some integration tests failed. Check the output above for details.${NC}"
    exit 1
fi
