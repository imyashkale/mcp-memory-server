# MCP Memory Server

A Model Context Protocol (MCP) server for storing and retrieving memories with comprehensive logging support.

## Features

- **Memory Storage**: Store text memories with optional tags for categorization
- **Memory Retrieval**: Search and retrieve memories based on content or tags
- **Memory Management**: List, delete, and clear memories
- **Comprehensive Logging**: Detailed logging for all operations with configurable log levels
- **HTTP API**: RESTful API for integration with Claude and other MCP clients
- **Docker Support**: Containerized deployment for easy deployment
- **Stdio Support**: Native MCP stdio transport for direct integration

## Available Tools

- `store_memory`: Store a memory with optional tags
- `retrieve_memories`: Retrieve memories based on a search query
- `list_memories`: List all stored memories
- `delete_memory`: Delete a memory by ID
- `clear_memories`: Clear all stored memories

## Installation

### Local Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd agetron
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

### Docker Installation

1. Build the Docker image:
```bash
docker build -t mcp-memory-server .
```

2. Run the container:
```bash
docker run -d -p 3000:3000 --name mcp-memory mcp-memory-server
```

## Usage

### Adding to Claude

To add this MCP server to Claude, use the following command:

```bash
claude mcp add memory --url http://localhost:3000/message
```

Or if using Docker with a custom port:

```bash
claude mcp add memory --url http://localhost:YOUR_PORT/message
```

### Environment Variables

- `PORT`: Server port (default: 3000)
- `LOG_LEVEL`: Logging level - `error`, `warn`, `info`, `debug` (default: `info`)

### API Testing

Test the server using curl:

```bash
# List available tools
curl -X POST http://localhost:3000/message \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}'

# Store a memory
curl -X POST http://localhost:3000/message \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "store_memory",
      "arguments": {
        "content": "Remember to buy groceries",
        "tags": ["personal", "todo"]
      }
    }
  }'

# Retrieve memories
curl -X POST http://localhost:3000/message \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "retrieve_memories",
      "arguments": {
        "query": "groceries"
      }
    }
  }'
```

## Logging

The server includes comprehensive logging for all operations:

- **Request/Response Logging**: All MCP requests and responses are logged
- **Tool Execution Logging**: Each tool execution is logged with parameters and results
- **Error Logging**: All errors are logged with context information
- **Performance Logging**: Request timing and performance metrics

Set the `LOG_LEVEL` environment variable to control logging verbosity:
- `error`: Only errors
- `warn`: Warnings and errors
- `info`: General information, warnings, and errors (default)
- `debug`: All logging including detailed debugging information

## Development

### Running in Development Mode

```bash
npm run dev
```

This starts the server with file watching for automatic restarts.

### Testing

Test the server functionality:

```bash
# Test local server
npm start &
curl -X POST http://localhost:3000/message -H "Content-Type: application/json" -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}'

# Test Docker container
docker run -d -p 3000:3000 --name test-mcp mcp-memory-server
curl -X POST http://localhost:3000/message -H "Content-Type: application/json" -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}'
docker stop test-mcp && docker rm test-mcp
```

## Architecture

- **Express Server**: HTTP server for MCP message handling
- **MCP SDK**: Official Model Context Protocol SDK for request/response handling
- **In-Memory Storage**: Simple in-memory storage for memories (data persists only during server runtime)
- **Structured Logging**: JSON-formatted logging with configurable levels

## Memory Data Structure

Each memory contains:
- `id`: Unique identifier (auto-incremented)
- `content`: The memory content text
- `tags`: Array of categorization tags
- `timestamp`: ISO 8601 creation timestamp

## Integration Examples

### With Claude Desktop

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "memory": {
      "command": "node",
      "args": ["/path/to/your/index.js"],
      "env": {
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

### With Docker Compose

```yaml
version: '3.8'
services:
  mcp-memory:
    build: .
    ports:
      - "3000:3000"
    environment:
      - LOG_LEVEL=info
    restart: unless-stopped
```

## License

MIT License

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Troubleshooting

### Common Issues

1. **Port already in use**: Change the PORT environment variable
2. **Connection refused**: Ensure the server is running and accessible
3. **Tool not found errors**: Verify the server is properly initialized

### Checking Logs

Monitor server logs for debugging:

```bash
# Local development
npm start

# Docker container
docker logs mcp-memory-server
```

### Health Check

Verify server health:

```bash
curl -X POST http://localhost:3000/message \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {}}'
```

## Support

For issues and questions:
1. Check the logs for error messages
2. Verify your configuration
3. Test with curl commands
4. Submit an issue with logs and configuration details