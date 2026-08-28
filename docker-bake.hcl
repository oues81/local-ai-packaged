# =============================================================================
# Docker Bake — multi-target build configuration
# Generated from docker-build-standards. Adapt targets as new services are added.
# See: docs/docker-build-standards/README.md §6
# =============================================================================

variable "REGISTRY" {
  default = "registry.lan.local:8444"
}

variable "PROJECT" {
  default = "local-ai-packaged"
}

variable "TAG" {
  default = "latest"
}

variable "CACHE_NS" {
  default = "registry.lan.local:8444/buildkit-cache/local"
}

variable "CACHE_DIR" {
  default = "/tmp/.buildx-cache"
}

# Group: build all custom services
group "default" {
  targets = ["mcp-server"]
}

# MCP server (Python, multi-stage Dockerfile.mcp)
target "mcp-server" {
  context    = "."
  dockerfile = "Dockerfile.mcp"
  platforms  = ["linux/amd64"]
  pull       = true
  cache-from = ["type=registry,ref=${CACHE_NS}/mcp-server"]
  cache-to   = ["type=registry,ref=${CACHE_NS}/mcp-server,mode=max"]
  tags = [
    "${REGISTRY}/${PROJECT}/mcp-server:${TAG}",
  ]
}

# =============================================================================
# Usage:
#   docker buildx bake --load                     # build all, load locally
#   docker buildx bake --push                     # build all, push to registry
#   docker buildx bake --set TAG=v0.1.0 --load    # build with custom tag
#   docker buildx bake --print                    # dry-run, show resolved config
# =============================================================================
