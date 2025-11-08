#!/bin/bash

# Kontecst Setup Script
# This script helps you get started with Kontecst development

set -e

echo "🚀 Welcome to Kontecst Setup"
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi
echo "✅ Node.js $(node --version)"

# Check pnpm
if ! command -v pnpm &> /dev/null; then
    echo "⚠️  pnpm is not installed. Installing pnpm..."
    npm install -g pnpm@8.15.0
fi
echo "✅ pnpm $(pnpm --version)"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi
echo "✅ Docker $(docker --version)"

# Check Docker Compose
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi
echo "✅ Docker Compose"

echo ""
echo "📦 Installing dependencies..."
pnpm install

echo ""
echo "🔐 Setting up environment variables..."

if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env file"

    # Generate encryption key
    if command -v openssl &> /dev/null; then
        ENCRYPTION_KEY=$(openssl rand -hex 32)
        # Replace the encryption key in .env
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s/0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef/$ENCRYPTION_KEY/" .env
        else
            sed -i "s/0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef/$ENCRYPTION_KEY/" .env
        fi
        echo "✅ Generated encryption key"
    fi

    echo ""
    echo "⚠️  Please edit .env and add your Supabase credentials:"
    echo "   - SUPABASE_URL"
    echo "   - SUPABASE_ANON_KEY"
    echo "   - SUPABASE_SERVICE_KEY"
    echo ""
    echo "   Get these from: https://supabase.com/dashboard/project/_/settings/api"
    echo ""
else
    echo "ℹ️  .env file already exists"
fi

# Copy app-specific env files
if [ ! -f apps/web/.env ]; then
    cp apps/web/.env.example apps/web/.env
    echo "✅ Created apps/web/.env"
fi

if [ ! -f apps/proxy/.env ]; then
    cp apps/proxy/.env.example apps/proxy/.env
    echo "✅ Created apps/proxy/.env"
fi

echo ""
echo "🐳 Starting Docker services..."
docker compose up -d

echo ""
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

echo ""
echo "✨ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env with your Supabase credentials"
echo "2. Run 'pnpm dev' to start development servers"
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "Useful commands:"
echo "  pnpm dev          - Start all development servers"
echo "  pnpm build        - Build all applications"
echo "  pnpm type-check   - Run TypeScript type checking"
echo "  pnpm lint         - Run ESLint"
echo "  pnpm docker:up    - Start Docker services"
echo "  pnpm docker:down  - Stop Docker services"
echo ""
echo "Documentation:"
echo "  README.md              - Project overview"
echo "  docs/DEVELOPMENT.md    - Development guide"
echo "  docs/ARCHITECTURE.md   - Architecture overview"
echo ""
echo "Happy coding! 🎉"
