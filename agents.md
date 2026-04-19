# Local AI Packaged - Service Startup Issues
## Current Situation

The local-ai-packaged project has multiple services (N8N, Flowise, Open WebUI, Supabase, Langfuse, Neo4j, etc.) that should start automatically using the `start_services.py` script, but the startup process repeatedly fails.

## Identified Problems

### 1. Vector Configuration Problem
**Issue**: The Supabase `vector` service fails to start with configuration errors.

**Symptoms**:
- Container exits with "Configuration error" messages
- Logs show "No sources defined in the config" or "Config file not found"
- Health check fails

**Root Cause**: The `docker-compose.yml` expects a vector config file at `./volumes/logs/vector.yml`, but this file doesn't exist or isn't accessible.

### 2. Container Cleanup Design Flaw
**Issue**: The `start_services.py` script doesn't properly clean up existing containers before starting new ones.

**Symptoms**:
- "Conflict. The container name '/supabase-vector' is already in use" errors
- Startup fails due to name conflicts

**Root Cause**: The script only cleans containers from the main `docker-compose.yml` but Supabase containers come from `supabase/docker/docker-compose.yml`.

### 3. Dependency Chain Issues
**Issue**: Service dependencies are not properly managed during startup.

**Symptoms**:
- Services fail to start in correct order
- Database service fails because vector dependency isn't healthy

**Root Cause**: The `db` service depends on `vector` service being healthy, but vector repeatedly fails.

### 4. Configuration File Access Issues
**Issue**: Configuration files have permission or accessibility problems.

**Symptoms**:
- "Permission denied" when creating config files
- Files created by root but accessed by different user

**Root Cause**: File ownership mismatches between host and container.

### 5. Port Conflicts (RESOLVED)
**Issue**: Services tried to use ports already occupied by other containers.

**Resolution**: Fixed by setting unique hostnames in `.env` file (8030-8037 range).

## Analysis Steps for Codex

### Step 1: Examine Current State
1. Check running containers: `docker ps -a --filter "label=com.docker.compose.project=local-ai-packaged"`
2. Check port usage: `docker ps --format "table {{.Names}}\t{{.Ports}}"`
3. Examine configuration files:
   - `/home/oues/local-ai-packaged/docker-compose.yml`
   - `/home/oues/local-ai-packaged/supabase/docker/docker-compose.yml`
   - `/home/oues/local-ai-packaged/.env`
   - `/home/oues/local-ai-packaged/Caddyfile`

### Step 2: Test Current Configuration
1. Try starting Supabase manually: `docker compose -p local-ai-packaged -f supabase/docker/docker-compose.yml up -d`
2. Check vector logs: `docker logs supabase-vector`
3. Check other Supabase service logs for dependency issues

### Step 3: Research Solutions Online

#### Search Queries for Vector Issues:
- "supabase vector timberio configuration error"
- "timberio vector docker inline config"
- "supabase docker-compose vector service config"
- "vector docker-compose config file location"

#### Search Queries for Cleanup Issues:
- "docker-compose cleanup containers from multiple compose files"
- "docker compose project cleanup script"
- "docker compose stop all containers in project"

#### Search Queries for Dependency Issues:
- "docker-compose service dependencies health checks"
- "supabase docker startup order"

## Solution Implementation Steps

### Phase 1: Fix Vector Configuration

#### Option A: Create Proper Config File
1. Create the vector config directory: `sudo mkdir -p /home/oues/local-ai-packaged/supabase/docker/volumes/logs`
2. Create vector.toml config file with proper TOML syntax:
   ```toml
   data_dir = "/tmp/vector"

   [api]
   enabled = true
   address = "0.0.0.0:8686"

   [sources.internal_logs]
   type = "internal_logs"

   [sinks.blackhole]
   type = "blackhole"
   inputs = ["internal_logs"]
   ```
3. Update docker-compose.yml to mount the file: `- ./volumes/logs/vector.toml:/etc/vector/vector.toml:ro`
4. Set proper ownership: `sudo chown -R 1000:1000 /home/oues/local-ai-packaged/supabase/docker/volumes`

#### Option B: Use Environment Variable Config
1. Remove volume mount from vector service
2. Add VECTOR_CONFIG environment variable with inline TOML
3. Update command to use `--config /dev/stdin`

### Phase 2: Fix Container Cleanup

#### Modify start_services.py
1. Add function to clean Supabase containers:
   ```python
   def cleanup_supabase_containers():
       cmd = ["docker", "compose", "-p", PROJECT_NAME, "-f", "supabase/docker/docker-compose.yml", "down", "--timeout", "10"]
       run_command_safe(cmd, continue_on_error=True)
   ```
2. Call this function before starting Supabase services

#### Alternative: Manual Cleanup
Add commands to clean both compose projects:
```bash
docker compose -p local-ai-packaged -f docker-compose.yml down --timeout 10
docker compose -p local-ai-packaged -f supabase/docker/docker-compose.yml down --timeout 10
```

### Phase 3: Fix Dependency Chain

1. Ensure vector service has proper health check
2. Ensure db service waits for vector health check
3. Test startup order: vector → db → other services

### Phase 4: Test Complete Startup

1. Clean all containers
2. Run `python3 start_services.py`
3. Monitor startup logs for each service
4. Verify all services are healthy and accessible
5. Test Caddy reverse proxy configuration

## Verification Steps

1. **Vector Service**: Should start without config errors, health check passes
2. **Database Service**: Should start after vector is healthy
3. **All Services**: Should be accessible through Caddy on assigned ports (8030-8037)
4. **No Conflicts**: No container name conflicts on restart

## Files to Modify

1. `supabase/docker/docker-compose.yml` - Fix vector configuration
2. `start_services.py` - Add Supabase container cleanup
3. `.env` - Verify port assignments (already done)

## Expected Outcome

After fixes, running `python3 start_services.py` should:
1. Clean all existing containers
2. Start Supabase services in correct order
3. Wait for health checks
4. Start AI services
5. Make all services accessible through Caddy

## Priority Order

1. Fix vector configuration (blocks everything)
2. Fix container cleanup (enables clean restarts)
3. Test full startup sequence
4. Optimize performance if needed
