# Digital Ocean Deployment Guide

This guide will help you deploy the Gmail MCP Server to a Digital Ocean droplet using Docker.

## Prerequisites

1. **Digital Ocean Droplet** with Docker installed
2. **Domain name** (optional, but recommended for HTTPS)
3. **Google Cloud Project** with Gmail API enabled

## Step 1: Prepare Your Digital Ocean Droplet

### Create a Droplet

1. Go to [Digital Ocean](https://digitalocean.com)
2. Create a new droplet:
   - **Image**: Ubuntu 22.04 LTS
   - **Size**: Basic plan, $6/month (1GB RAM, 1vCPU) should be sufficient
   - **Region**: Choose closest to your users
   - **Authentication**: SSH key (recommended)

### Install Docker

```bash
# Update package index
sudo apt update

# Install Docker
sudo apt install -y docker.io docker-compose

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add your user to docker group (optional, allows running docker without sudo)
sudo usermod -aG docker $USER

# Log out and back in for group changes to take effect
```

## Step 2: Deploy Your Application

### Option A: Git Clone and Build

```bash
# Clone your repository
git clone https://github.com/your-username/gmail-mcp-server.git
cd gmail-mcp-server

# Copy and configure environment file
cp env.production.example .env
nano .env  # Edit with your configuration

# Deploy using the script
./scripts/deploy.sh production
```

### Option B: Docker Hub (Recommended for Production)

First, build and push your image to Docker Hub:

```bash
# Build and tag image
docker build -t your-dockerhub-username/gmail-mcp-server:latest .

# Push to Docker Hub
docker push your-dockerhub-username/gmail-mcp-server:latest
```

Then on your Digital Ocean droplet:

```bash
# Create project directory
mkdir gmail-mcp-server
cd gmail-mcp-server

# Create docker-compose.yml for production
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  gmail-mcp-server:
    image: your-dockerhub-username/gmail-mcp-server:latest
    container_name: gmail-mcp-server
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=production
      - PORT=8080
    env_file:
      - .env
    networks:
      - mcp-network

networks:
  mcp-network:
    driver: bridge
EOF

# Create environment file
cat > .env << 'EOF'
NODE_ENV=production
PORT=8080
LOG_LEVEL=info
HEALTH_CHECK_ENABLED=true
EOF

# Start the service
docker-compose up -d

# Check status
docker-compose ps
docker-compose logs -f gmail-mcp-server
```

## Step 3: Configure Firewall

```bash
# Install UFW (Uncomplicated Firewall)
sudo apt install -y ufw

# Set default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH
sudo ufw allow ssh

# Allow HTTP and HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Allow your MCP server port
sudo ufw allow 8080

# Enable firewall
sudo ufw enable
```

## Step 4: Set Up HTTPS (Optional but Recommended)

### Using Nginx and Let's Encrypt

```bash
# Install Nginx
sudo apt install -y nginx certbot python3-certbot-nginx

# Create Nginx configuration
sudo tee /etc/nginx/sites-available/gmail-mcp << 'EOF'
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # CORS headers
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
        add_header Access-Control-Allow-Headers "Content-Type, Authorization, x-google-access-token";
    }
}
EOF

# Enable the site
sudo ln -s /etc/nginx/sites-available/gmail-mcp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com
```

## Step 5: Set Up Monitoring and Logging

### Create monitoring script

```bash
# Create monitoring directory
mkdir -p ~/monitoring

# Create health check script
cat > ~/monitoring/health-check.sh << 'EOF'
#!/bin/bash

URL="http://localhost:8080/mcp"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $URL)

if [ $RESPONSE -eq 200 ] || [ $RESPONSE -eq 400 ]; then
    echo "$(date): Gmail MCP Server is healthy (HTTP $RESPONSE)"
else
    echo "$(date): Gmail MCP Server is down (HTTP $RESPONSE)"
    # Restart the service
    cd ~/gmail-mcp-server
    docker-compose restart gmail-mcp-server
    echo "$(date): Attempted to restart Gmail MCP Server"
fi
EOF

chmod +x ~/monitoring/health-check.sh

# Add to crontab to run every 5 minutes
(crontab -l 2>/dev/null; echo "*/5 * * * * ~/monitoring/health-check.sh >> ~/monitoring/health.log 2>&1") | crontab -
```

### Set up log rotation

```bash
# Create logrotate configuration
sudo tee /etc/logrotate.d/gmail-mcp << 'EOF'
~/monitoring/health.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 644 $USER $USER
}
EOF
```

## Step 6: Test Your Deployment

```bash
# Test the MCP endpoint
curl -s http://your-droplet-ip:8080/mcp

# Test with a tool call (you'll need a valid access token)
curl -X POST http://your-droplet-ip:8080/mcp \
  -H "Content-Type: application/json" \
  -H "x-google-access-token: YOUR_ACCESS_TOKEN" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list",
    "params": {}
  }'
```

## Step 7: Update Your Main App

Update your main application to use the production URL:

```javascript
const MCP_SERVER_URL = 'https://your-domain.com/mcp'; // or http://your-droplet-ip:8080/mcp

const callGmailTool = async (userId, toolName, args) => {
  const token = await getUserAccessToken(userId);
  
  const response = await fetch(MCP_SERVER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-google-access-token': token.access_token
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: { name: toolName, arguments: args }
    })
  });
  
  return response.json();
};
```

## Troubleshooting

### Check container status
```bash
docker-compose ps
docker-compose logs gmail-mcp-server
```

### Check server resources
```bash
htop  # or top
df -h  # disk usage
```

### Restart service
```bash
docker-compose restart gmail-mcp-server
```

### Update deployment
```bash
# Pull latest image
docker-compose pull

# Restart with new image
docker-compose up -d
```

## Security Best Practices

1. **Use HTTPS** in production
2. **Keep your system updated**: `sudo apt update && sudo apt upgrade`
3. **Monitor logs** regularly
4. **Use secrets management** for sensitive environment variables
5. **Implement rate limiting** if needed
6. **Regular backups** of your configuration

## Cost Optimization

- **$6/month droplet** is sufficient for moderate usage
- **Monitor resource usage** and scale up if needed
- **Use Digital Ocean monitoring** to track performance
- **Set up billing alerts** to avoid surprises

Your Gmail MCP Server should now be running in production! 🚀 