# SSH Key Setup for Deployment

## Step 1: Generate SSH Key Pair

On the Jenkins server or your local machine:

```bash
ssh-keygen -t ed25519 -C "deploy-key" -f ~/.ssh/deploy_key -N ""
```

Or using RSA (if ed25519 is not supported):

```bash
ssh-keygen -t rsa -b 4096 -C "deploy-key" -f ~/.ssh/deploy_key -N ""
```

## Step 2: Copy Public Key to Docker VM

Use `ssh-copy-id` to copy the public key to the target Docker VM:

```bash
ssh-copy-id -i ~/.ssh/deploy_key.pub username@docker-vm-host
```

Replace:
- `username` - SSH username on Docker VM
- `docker-vm-host` - IP address or hostname of Docker VM

Example:
```bash
ssh-copy-id -i ~/.ssh/deploy_key.pub ubuntu@192.168.1.100
```

## Step 3: Test SSH Connection

Verify passwordless SSH works:

```bash
ssh -i ~/.ssh/deploy_key username@docker-vm-host "echo 'SSH connection successful'"
```

## Step 4: Configure Jenkins

1. Go to **Jenkins > Manage Jenkins > Credentials**
2. Click **Add Credentials**
3. Select **SSH Username with private key**
4. Configure:
   - **ID**: `docker-vm-ssh`
   - **Username**: Your SSH username (e.g., `ubuntu`)
   - **Private Key**: Enter directly, paste contents of `~/.ssh/deploy_key`

To view private key:
```bash
cat ~/.ssh/deploy_key
```

## Step 5: Configure GitHub Actions (if using)

Add these secrets in your GitHub repository:

1. Go to **Repository > Settings > Secrets and variables > Actions**
2. Add the following secrets:

| Secret Name      | Value                                    |
|------------------|------------------------------------------|
| `DEPLOY_HOST`    | Docker VM IP/hostname (e.g., `192.168.1.100`) |
| `DEPLOY_USER`    | SSH username (e.g., `ubuntu`)            |
| `DEPLOY_SSH_KEY` | Contents of `~/.ssh/deploy_key` (private key) |

To copy private key:
```bash
cat ~/.ssh/deploy_key | pbcopy  # macOS
cat ~/.ssh/deploy_key | xclip   # Linux
```

## Troubleshooting

### Permission denied
```bash
# Check permissions on Docker VM
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

### Host key verification failed
```bash
# Add host to known_hosts
ssh-keyscan -H docker-vm-host >> ~/.ssh/known_hosts
```

### Test connection with verbose output
```bash
ssh -v -i ~/.ssh/deploy_key username@docker-vm-host
```
