# Deployment Guide

This guide covers deploying Kontecst to production.

## Overview

Kontecst uses a hybrid deployment strategy:
- **Frontend (Next.js)**: Deployed to Vercel
- **Database & Auth**: Supabase Cloud
- **File Proxy**: Docker containers on your infrastructure
- **Dedicated DBs**: Docker containers for enterprise customers

## Prerequisites

- Vercel account
- Supabase account (Pro plan recommended)
- Docker-capable hosting (AWS ECS, DigitalOcean, etc.)
- Domain name
- SSL certificates
- Stripe account (for billing)

## Part 1: Supabase Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Choose your region (consider data residency requirements)
4. Note your project URL and API keys

### 2. Apply Database Migrations

```bash
cd packages/database

# Link to your project
npx supabase link --project-ref your-project-ref

# Push migrations
npx supabase db push
```

### 3. Configure Authentication

In Supabase Dashboard:
1. Go to Authentication > Providers
2. Enable Email provider
3. Configure OAuth providers (GitHub, Google, etc.)
4. Set up email templates
5. Configure redirect URLs

### 4. Set Up Storage (Optional)

If using Supabase Storage for non-sensitive files:
1. Go to Storage
2. Create a bucket named `public-assets`
3. Set up RLS policies

### 5. Configure Secrets

In Supabase Dashboard > Settings > Vault:
1. Store encryption keys
2. Store Stripe keys
3. Store API keys

## Part 2: File Proxy Deployment

### Option A: AWS ECS (Recommended)

#### 1. Build and Push Docker Image

```bash
# Build the image
docker build -f apps/proxy/Dockerfile -t kontecst-proxy:latest .

# Tag for ECR
docker tag kontecst-proxy:latest \
  your-account-id.dkr.ecr.region.amazonaws.com/kontecst-proxy:latest

# Login to ECR
aws ecr get-login-password --region region | \
  docker login --username AWS --password-stdin \
  your-account-id.dkr.ecr.region.amazonaws.com

# Push
docker push your-account-id.dkr.ecr.region.amazonaws.com/kontecst-proxy:latest
```

#### 2. Create ECS Task Definition

```json
{
  "family": "kontecst-proxy",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "proxy",
      "image": "your-account-id.dkr.ecr.region.amazonaws.com/kontecst-proxy:latest",
      "portMappings": [
        {
          "containerPort": 3001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "3001"
        }
      ],
      "secrets": [
        {
          "name": "SUPABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:supabase-url"
        },
        {
          "name": "SUPABASE_SERVICE_KEY",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:supabase-service-key"
        },
        {
          "name": "ENCRYPTION_KEY",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:encryption-key"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/kontecst-proxy",
          "awslogs-region": "region",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "mountPoints": [
        {
          "sourceVolume": "file-storage",
          "containerPath": "/data/files"
        }
      ]
    }
  ],
  "volumes": [
    {
      "name": "file-storage",
      "efsVolumeConfiguration": {
        "fileSystemId": "fs-xxxxxx",
        "transitEncryption": "ENABLED"
      }
    }
  ]
}
```

#### 3. Create EFS File System

```bash
# Create EFS
aws efs create-file-system \
  --performance-mode generalPurpose \
  --encrypted \
  --tags Key=Name,Value=kontecst-files

# Create mount targets in your VPC subnets
aws efs create-mount-target \
  --file-system-id fs-xxxxxx \
  --subnet-id subnet-xxxxx \
  --security-groups sg-xxxxx
```

#### 4. Create Application Load Balancer

```bash
# Create ALB
aws elbv2 create-load-balancer \
  --name kontecst-proxy-alb \
  --subnets subnet-xxxxx subnet-yyyyy \
  --security-groups sg-xxxxx

# Create target group
aws elbv2 create-target-group \
  --name kontecst-proxy-tg \
  --protocol HTTP \
  --port 3001 \
  --vpc-id vpc-xxxxx \
  --target-type ip \
  --health-check-path /health

# Create listener
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:... \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=arn:aws:acm:... \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:...
```

#### 5. Create ECS Service

```bash
aws ecs create-service \
  --cluster your-cluster \
  --service-name kontecst-proxy \
  --task-definition kontecst-proxy:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxx,subnet-yyyyy],securityGroups=[sg-xxxxx],assignPublicIp=DISABLED}" \
  --load-balancers targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=proxy,containerPort=3001
```

### Option B: DigitalOcean App Platform

1. Create a new App
2. Connect your GitHub repo
3. Set build command: `cd apps/proxy && pnpm build`
4. Set run command: `node dist/index.js`
5. Add environment variables
6. Add a managed database or connect to Supabase
7. Deploy

### Option C: Docker Swarm

```bash
# Initialize swarm
docker swarm init

# Create secrets
echo "your-encryption-key" | docker secret create encryption_key -
echo "your-supabase-key" | docker secret create supabase_key -

# Deploy stack
docker stack deploy -c docker-compose.prod.yml kontecst
```

Example `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  proxy:
    image: your-registry/kontecst-proxy:latest
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
    ports:
      - "3001:3001"
    environment:
      NODE_ENV: production
      PORT: 3001
      SUPABASE_URL: ${SUPABASE_URL}
    secrets:
      - encryption_key
      - supabase_key
    volumes:
      - file-data:/data/files

volumes:
  file-data:
    driver: local

secrets:
  encryption_key:
    external: true
  supabase_key:
    external: true
```

## Part 3: Vercel Deployment (Next.js)

### 1. Connect Repository

1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Select the `apps/web` directory as root

### 2. Configure Build Settings

- **Framework Preset**: Next.js
- **Build Command**: `cd ../.. && pnpm install && pnpm build --filter=@kontecst/web`
- **Output Directory**: `apps/web/.next`
- **Install Command**: `pnpm install`

### 3. Set Environment Variables

In Vercel Dashboard > Settings > Environment Variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# File Proxy
NEXT_PUBLIC_FILE_PROXY_URL=https://proxy.kontecst.com

# Stripe
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Environment
NODE_ENV=production
```

### 4. Configure Domains

1. Add your custom domain in Vercel
2. Configure DNS:
   - A record: `kontecst.com` → Vercel IP
   - CNAME: `www.kontecst.com` → `cname.vercel-dns.com`
3. SSL is automatic via Vercel

### 5. Deploy

```bash
# Push to main branch
git push origin main

# Or deploy via CLI
vercel --prod
```

## Part 4: Stripe Setup

### 1. Create Products

In Stripe Dashboard:
1. Create products for each tier (Free, Team, Enterprise)
2. Create prices (monthly/yearly)
3. Note the price IDs

### 2. Configure Webhooks

1. Go to Developers > Webhooks
2. Add endpoint: `https://kontecst.com/api/webhooks/stripe`
3. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the webhook signing secret to Vercel env vars

### 3. Test Webhooks

```bash
# Install Stripe CLI
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger test events
stripe trigger customer.subscription.created
```

## Part 5: DNS Configuration

### Main Domain

```
kontecst.com
├── A      →  Vercel IP (or CNAME to vercel-dns.com)
├── www    →  CNAME to cname.vercel-dns.com
├── proxy  →  CNAME to your-alb.region.elb.amazonaws.com
└── api    →  CNAME to cname.vercel-dns.com (API routes)
```

### SSL Certificates

- **Vercel**: Automatic via Let's Encrypt
- **ALB**: Use AWS Certificate Manager (ACM)
- **Custom domains**: Upload to ACM or use Let's Encrypt

## Part 6: Monitoring & Logging

### Application Monitoring

#### Vercel Analytics

Enable in Vercel Dashboard:
- Web Vitals
- Real User Monitoring
- Server-side errors

#### Supabase Monitoring

Available in Dashboard:
- Database performance
- API usage
- Auth metrics

#### File Proxy Monitoring

##### CloudWatch (AWS)

```bash
# Create log group
aws logs create-log-group --log-group-name /ecs/kontecst-proxy

# Set retention
aws logs put-retention-policy \
  --log-group-name /ecs/kontecst-proxy \
  --retention-in-days 30
```

##### Custom Monitoring

Add to File Proxy:
- Datadog APM
- New Relic
- Sentry for error tracking

### Uptime Monitoring

Use services like:
- UptimeRobot
- Pingdom
- Better Uptime

Monitor:
- `https://kontecst.com` (Next.js)
- `https://proxy.kontecst.com/health` (File Proxy)
- `https://your-project.supabase.co` (Supabase)

### Alerts

Set up alerts for:
- High error rates
- Slow response times
- Database connection issues
- Disk space on EFS
- Failed payments

## Part 7: Backups

### Database Backups

Supabase provides automatic backups on Pro plan:
- Daily backups retained for 7 days
- Point-in-time recovery

For additional safety:
```bash
# Manual backup
pg_dump "postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres" \
  > backup-$(date +%Y%m%d).sql

# Automate with cron
0 2 * * * /path/to/backup-script.sh
```

### File Storage Backups

#### AWS EFS Backup

```bash
# Create backup vault
aws backup create-backup-vault --backup-vault-name kontecst-files

# Create backup plan
aws backup create-backup-plan --backup-plan file://backup-plan.json
```

#### Manual Backups

```bash
# Sync to S3
aws s3 sync /data/files s3://kontecst-backups/files/
```

## Part 8: Security Checklist

- [ ] All environment variables are secrets (not in git)
- [ ] Encryption keys are rotated regularly
- [ ] SSL/TLS enabled everywhere
- [ ] CORS configured properly
- [ ] Rate limiting enabled
- [ ] Supabase RLS policies tested
- [ ] File proxy authentication tested
- [ ] Audit logging enabled
- [ ] Backups automated and tested
- [ ] Security headers configured (helmet.js)
- [ ] Dependencies scanned for vulnerabilities
- [ ] Stripe webhook signature verification
- [ ] Database connection pooling configured
- [ ] Secrets stored in AWS Secrets Manager / Vault

## Part 9: Performance Optimization

### CDN Configuration

Use Vercel Edge Network for:
- Static assets
- Public package files
- API responses (cached)

### Database Optimization

```sql
-- Add indexes for common queries
CREATE INDEX idx_packages_owner_id ON packages(owner_id);
CREATE INDEX idx_package_versions_package_id ON package_versions(package_id);
CREATE INDEX idx_embeddings_package_version_id ON embeddings(package_version_id);

-- Analyze tables
ANALYZE packages;
ANALYZE package_versions;
ANALYZE embeddings;
```

### File Proxy Optimization

- Enable gzip compression
- Add ETag support for caching
- Implement connection pooling
- Use cluster mode for multi-core

## Part 10: CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm build --filter=@kontecst/web
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'

  deploy-proxy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: docker/setup-buildx-action@v2
      - uses: docker/login-action@v2
        with:
          registry: ${{ secrets.ECR_REGISTRY }}
          username: ${{ secrets.AWS_ACCESS_KEY_ID }}
          password: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
      - uses: docker/build-push-action@v4
        with:
          context: .
          file: apps/proxy/Dockerfile
          push: true
          tags: ${{ secrets.ECR_REGISTRY }}/kontecst-proxy:latest
      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster your-cluster \
            --service kontecst-proxy \
            --force-new-deployment
```

## Troubleshooting

### Common Issues

#### 1. File Proxy Can't Connect to Supabase

- Check security group rules
- Verify Supabase URL is correct
- Check service key hasn't expired

#### 2. High Latency on File Retrieval

- Check EFS performance mode
- Add CloudFront in front of ALB
- Increase ECS task count

#### 3. Database Connection Pool Exhausted

Increase pool size in Supabase:
```sql
ALTER SYSTEM SET max_connections = 200;
```

#### 4. Out of Memory Errors

Increase ECS task memory or add more replicas.

## Post-Deployment

1. Test all critical paths
2. Monitor error rates
3. Set up alerts
4. Document runbooks
5. Train team on operations
6. Schedule regular backups
7. Plan for disaster recovery

## Support

For deployment issues:
- Check logs in Vercel Dashboard
- Check ECS logs in CloudWatch
- Check Supabase logs in Dashboard
- Open a GitHub issue
