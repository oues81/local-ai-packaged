#!/usr/bin/env python3
"""
start_services.py

This script starts the Supabase stack first, waits for it to initialize, and then starts
the local AI stack. Both stacks use the same Docker Compose project name ("localai")
so they appear together in Docker Desktop.
"""

import os
import subprocess
import shutil
import time
import argparse
import platform
import sys
import socket
import secrets
from subprocess import Popen, PIPE

# Single source of truth for the compose project name
PROJECT_NAME = "local-ai-packaged"

def run_command(cmd, cwd=None):
    """Run a shell command and print it."""
    print("Running:", " ".join(cmd))
    subprocess.run(cmd, cwd=cwd, check=True)

def run_command_safe(cmd, cwd=None, timeout=None, continue_on_error=False):
    """Run a shell command with optional timeout; optionally continue on error."""
    print("Running:", " ".join(cmd))
    try:
        subprocess.run(cmd, cwd=cwd, check=True, timeout=timeout)
        return True
    except subprocess.TimeoutExpired as e:
        print(f"Warning: Command timed out after {timeout}s: {' '.join(cmd)}")
        if continue_on_error:
            return False
        raise
    except subprocess.CalledProcessError as e:
        print(f"Warning: Command failed (exit {e.returncode}): {' '.join(cmd)}")
        if continue_on_error:
            return False
        raise

def is_container_healthy(container_name: str) -> bool:
    """Return True if docker container has Health.Status=healthy, False otherwise."""
    try:
        result = subprocess.run(
            ["docker", "inspect", "-f", "{{ .State.Health.Status }}", container_name],
            capture_output=True, text=True, check=False
        )
        status = result.stdout.strip()
        return status == "healthy"
    except Exception:
        return False

def wait_for_containers_healthy(container_names, timeout_seconds=120, poll_interval=2):
    """Wait for all containers in list to become healthy until timeout; returns bool."""
    start = time.time()
    remaining = set(container_names)
    while time.time() - start < timeout_seconds:
        ready = {name for name in list(remaining) if is_container_healthy(name)}
        remaining -= ready
        if not remaining:
            return True
        time.sleep(poll_interval)
    if remaining:
        print(f"Warning: Timed out waiting for containers healthy: {', '.join(sorted(remaining))}")
    return False

def clone_supabase_repo():
    """Clone the Supabase repository using sparse checkout if not already present."""
    if not os.path.exists("supabase"):
        print("Cloning the Supabase repository...")
        run_command([
            "git", "clone", "--filter=blob:none", "--no-checkout",
            "https://github.com/supabase/supabase.git"
        ])
        os.chdir("supabase")
        run_command(["git", "sparse-checkout", "init", "--cone"])
        run_command(["git", "sparse-checkout", "set", "docker"])
        run_command(["git", "checkout", "master"])
        os.chdir("..")
    else:
        print("Supabase repository already exists, updating...")
        os.chdir("supabase")
        run_command(["git", "pull"])
        os.chdir("..")

def prepare_supabase_env():
    """Copy .env to .env in supabase/docker."""
    env_path = os.path.join("supabase", "docker", ".env")
    env_example_path = os.path.join(".env")
    print("Copying .env in root to .env in supabase/docker...")
    shutil.copyfile(env_example_path, env_path)

def kill_process_using_port(port):
    """Kill any process using the specified port."""
    try:
        # Check if port is in use
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(('127.0.0.1', port)) == 0:
                print(f"Port {port} is in use. Attempting to free it...")
                if platform.system() == 'Windows':
                    # For Windows
                    process = Popen(['netstat', '-ano', '|', 'findstr', f':{port}'], 
                                 stdout=PIPE, stderr=PIPE, shell=True)
                    stdout, _ = process.communicate()
                    for line in stdout.decode().split('\n'):
                        if f':{port}' in line:
                            parts = line.split()
                            if len(parts) > 4:
                                pid = parts[-1]
                                Popen(['taskkill', '/F', '/PID', pid], 
                                     stdout=PIPE, stderr=PIPE)
                                print(f"Killed process with PID {pid}")
                else:
                    # For Linux/Mac
                    process = Popen(['lsof', '-ti', f':{port}'], 
                                 stdout=PIPE, stderr=PIPE)
                    stdout, _ = process.communicate()
                    for pid in stdout.decode().split():
                        if pid.strip():
                            # Do not kill Docker-managed proxy/runtime processes.
                            cmdline_proc = Popen(
                                ['ps', '-p', pid, '-o', 'comm='],
                                stdout=PIPE, stderr=PIPE
                            )
                            proc_out, _ = cmdline_proc.communicate()
                            proc_name = proc_out.decode().strip().lower()
                            if any(x in proc_name for x in ['docker', 'containerd', 'runc']):
                                print(f"Skipping Docker-managed process on port {port}: PID {pid} ({proc_name})")
                                continue
                            Popen(['kill', '-9', pid], 
                                 stdout=PIPE, stderr=PIPE)
                            print(f"Killed process with PID {pid}")
    except Exception as e:
        print(f"Warning: Could not free port {port}. Error: {e}")

def stop_existing_containers(profile=None):
    print("Stopping and removing existing containers for the unified project 'local-ai-packaged'...")
    # Kill any process using port 11434 before stopping containers
    kill_process_using_port(11434)
    # Use a single compose project name to avoid duplicates
    base_cmd = ["docker", "compose", "-p", PROJECT_NAME]

    # Stop/remove local AI compose services
    local_cmd = base_cmd.copy()
    if profile and profile != "none":
        local_cmd.extend(["--profile", profile])
    stop_cmd = local_cmd + ["-f", "docker-compose.yml", "stop", "--timeout", "10"]
    run_command_safe(stop_cmd, timeout=60, continue_on_error=True)

    rm_cmd = local_cmd + ["-f", "docker-compose.yml", "rm", "-f", "-s", "-v"]
    run_command_safe(rm_cmd, timeout=60, continue_on_error=True)

    # Stop/remove Supabase compose services to prevent container name conflicts
    supabase_cmd = base_cmd + ["-f", "supabase/docker/docker-compose.yml"]
    supa_stop_cmd = supabase_cmd + ["stop", "--timeout", "10"]
    run_command_safe(supa_stop_cmd, timeout=60, continue_on_error=True)

    supa_rm_cmd = supabase_cmd + ["rm", "-f", "-s", "-v"]
    run_command_safe(supa_rm_cmd, timeout=60, continue_on_error=True)

    # Intentionally skip removing the compose network to prevent blocking.
    # 'up -d' will reuse or create the network as needed.

def start_supabase(environment=None):
    """Start the Supabase services (using its compose file)."""
    print("Starting Supabase services...")
    # Use the same compose project name as local AI to keep a single stack
    cmd = ["docker", "compose", "-p", PROJECT_NAME, "-f", "supabase/docker/docker-compose.yml"]
    if environment and environment == "public":
        cmd.extend(["-f", "docker-compose.override.public.supabase.yml"])
    cmd.extend(["up", "-d"])
    run_command(cmd)
    # Wait for critical Supabase containers to be healthy before proceeding
    print("Waiting for Supabase health (db, pooler)...")
    wait_for_containers_healthy(["supabase-db", "supabase-pooler"], timeout_seconds=180)

def start_local_ai(profile=None, environment=None):
    """Start the local AI services (using its compose file)."""
    print("Starting local AI services...")
    
    # Double check if port 11434 is available
    kill_process_using_port(11434)
    time.sleep(2)  # Give some time for the port to be released
    # Use the unified compose project name
    cmd = ["docker", "compose", "-p", "local-ai-packaged"]
    if profile and profile != "none":
        cmd.extend(["--profile", profile])
    cmd.extend(["-f", "docker-compose.yml"])
    if environment and environment == "private":
        cmd.extend(["-f", "docker-compose.override.private.yml"])
    if environment and environment == "public":
        cmd.extend(["-f", "docker-compose.override.public.yml"])
    cmd.extend(["up", "-d"])
    run_command(cmd)

def generate_searxng_secret_key():
    """Generate a secret key for SearXNG based on the current platform."""
    print("Checking SearXNG settings...")

    # Define paths for SearXNG settings files
    settings_path = os.path.join("searxng", "settings.yml")
    settings_base_path = os.path.join("searxng", "settings-base.yml")

    # Check if settings-base.yml exists
    if not os.path.exists(settings_base_path):
        print(f"Warning: SearXNG base settings file not found at {settings_base_path}")
        return

    # Check if settings.yml exists, if not create it from settings-base.yml
    if not os.path.exists(settings_path):
        print(f"SearXNG settings.yml not found. Creating from {settings_base_path}...")
        try:
            shutil.copyfile(settings_base_path, settings_path)
            print(f"Created {settings_path} from {settings_base_path}")
        except Exception as e:
            print(f"Error creating settings.yml: {e}")
            return
    else:
        print(f"SearXNG settings.yml already exists at {settings_path}")

    print("Generating SearXNG secret key (pure Python)...")
    try:
        # Generate a 32-byte hex key using Python's secrets
        random_key = secrets.token_hex(32)
        with open(settings_path, "r", encoding="utf-8") as f:
            content = f.read()
        if "ultrasecretkey" in content:
            content = content.replace("ultrasecretkey", random_key)
            # Write atomically: write to temp then replace
            tmp_path = settings_path + ".tmp"
            with open(tmp_path, "w", encoding="utf-8") as f:
                f.write(content)
            os.replace(tmp_path, settings_path)
            print("SearXNG secret key generated and applied.")
        else:
            print("SearXNG secret key already set; no replacement needed.")
    except Exception as e:
        print(f"Error generating SearXNG secret key: {e}")
        print("You may need to manually update searxng/settings.yml with a 64-hex secret.")

def check_and_fix_docker_compose_for_searxng():
    """Check and modify docker-compose.yml for SearXNG first run."""
    docker_compose_path = "docker-compose.yml"
    if not os.path.exists(docker_compose_path):
        print(f"Warning: Docker Compose file not found at {docker_compose_path}")
        return

    try:
        # Read the docker-compose.yml file
        with open(docker_compose_path, 'r') as file:
            content = file.read()

        # Default to first run
        is_first_run = True

        # Check if Docker is running and if the SearXNG container exists
        try:
            # Check if the SearXNG container is running
            container_check = subprocess.run(
                ["docker", "ps", "--filter", "name=searxng", "--format", "{{.Names}}"],
                capture_output=True, text=True, check=True
            )
            searxng_containers = container_check.stdout.strip().split('\n')

            # If SearXNG container is running, check inside for uwsgi.ini
            if any(container for container in searxng_containers if container):
                container_name = next(container for container in searxng_containers if container)
                print(f"Found running SearXNG container: {container_name}")

                # Check if uwsgi.ini exists inside the container
                container_check = subprocess.run(
                    ["docker", "exec", container_name, "sh", "-c", "[ -f /etc/searxng/uwsgi.ini ] && echo 'found' || echo 'not_found'"],
                    capture_output=True, text=True, check=False
                )

                if "found" in container_check.stdout:
                    print("Found uwsgi.ini inside the SearXNG container - not first run")
                    is_first_run = False
                else:
                    print("uwsgi.ini not found inside the SearXNG container - first run")
                    is_first_run = True
            else:
                print("No running SearXNG container found - assuming first run")
        except Exception as e:
            print(f"Error checking Docker container: {e} - assuming first run")

        if is_first_run and "cap_drop: - ALL" in content:
            print("First run detected for SearXNG. Temporarily removing 'cap_drop: - ALL' directive...")
            # Temporarily comment out the cap_drop line
            modified_content = content.replace("cap_drop: - ALL", "# cap_drop: - ALL  # Temporarily commented out for first run")

            # Write the modified content back
            with open(docker_compose_path, 'w') as file:
                file.write(modified_content)

            print("Note: After the first run completes successfully, you should re-add 'cap_drop: - ALL' to docker-compose.yml for security reasons.")
        elif not is_first_run and "# cap_drop: - ALL  # Temporarily commented out for first run" in content:
            print("SearXNG has been initialized. Re-enabling 'cap_drop: - ALL' directive for security...")
            # Uncomment the cap_drop line
            modified_content = content.replace("# cap_drop: - ALL  # Temporarily commented out for first run", "cap_drop: - ALL")

            # Write the modified content back
            with open(docker_compose_path, 'w') as file:
                file.write(modified_content)

    except Exception as e:
        print(f"Error checking/modifying docker-compose.yml for SearXNG: {e}")

def main():
    parser = argparse.ArgumentParser(description='Start the local AI and Supabase services.')
    parser.add_argument('--profile', choices=['cpu', 'gpu-nvidia', 'gpu-amd', 'none'], default='cpu',
                      help='Profile to use for Docker Compose (default: cpu)')
    parser.add_argument('--environment', choices=['private', 'public'], default='private',
                      help='Environment to use for Docker Compose (default: private)')
    args = parser.parse_args()

    clone_supabase_repo()
    prepare_supabase_env()

    # Generate SearXNG secret key and check docker-compose.yml
    generate_searxng_secret_key()
    check_and_fix_docker_compose_for_searxng()

    stop_existing_containers(args.profile)

    # Start Supabase first
    start_supabase(args.environment)

    # Give Supabase some time to initialize
    print("Waiting for Supabase to initialize...")
    time.sleep(10)

    # Then start the local AI services
    start_local_ai(args.profile, args.environment)

if __name__ == "__main__":
    main()
