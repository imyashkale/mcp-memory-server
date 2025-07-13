# MCP Memory Server

A simple memory storage server for Claude using the Model Context Protocol (MCP). Perfect for hobby projects or learning how to build your first MCP server!

This server lets Claude remember things across conversations by storing and retrieving memories with optional tags.

## What It Does

Store text memories that Claude can search and retrieve later. Great for:
- Remembering user preferences 
- Storing project notes
- Building knowledge bases
- Learning MCP development

## Available Tools

- `store_memory`: Store a memory with optional tags
- `retrieve_memories`: Search memories by content
- `list_memories`: Show all stored memories  
- `delete_memory`: Delete a specific memory
- `clear_memories`: Delete all memories

## Quick Start

### 1. Install & Run

```bash
# Clone and setup
git clone https://github.com/imyashkale/mcp-memory-server.git
cd mcp-memory-server
npm install
npm start
```

Server runs on `http://localhost:3000`

### 2. Add to Claude

```bash
claude mcp add memory http://localhost:3000/message --transport http
```

That's it! Claude can now use the memory tools.

## Basic Usage

Once connected to Claude, you can:

```
# Store memories
"Remember that I like both dogs and cats"

# Retrieve memories  
"What do you remember about my pet preferences?"

# List all memories
"Show me all my stored memories"
```

## Development

### Run in dev mode (auto-restart)
```bash
npm run dev
```

### Project Structure
- `index.js` - Main server file with MCP tools
- `package.json` - Dependencies and scripts
- In-memory storage (resets on restart)

### Environment Variables
- `PORT` - Server port (default: 3000)
- `LOG_LEVEL` - Logging: error, warn, info, debug (default: info)

## Memory Format

Each memory contains:
- `id` - Unique number
- `content` - The memory text
- `tags` - Optional categorization tags
- `timestamp` - When it was created

## Docker (Optional)

```bash
# Build and run
docker build -t mcp-memory-server .
docker run -d -p 3000:3000 mcp-memory-server

# Add to Claude with Docker
claude mcp add memory --transport http -- http://localhost:3000/message
```

## What's Next?

This is a basic MCP server to get you started. You can extend it by:
- Adding persistent storage (database)
- Adding more search features
- Building a web interface
- Adding authentication

## Troubleshooting

**Port in use?** Change the port:
```bash
PORT=3001 npm start
claude mcp add memory http://localhost:3001/message --transport http
```

**Connection issues?** Check the server is running:
```bash
curl -X POST http://localhost:3000/message -H "Content-Type: application/json" -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}'
```

## Contributing

This is a hobby project, but contributions are welcome! Feel free to:
- Fork the repository
- Create a feature branch
- Make improvements
- Submit a pull request

## License

MIT License - feel free to use this project for learning, hobby projects, or commercial use.

## Support

- **Issues**: Open an issue on GitHub for bugs or feature requests
- **Questions**: Check the MCP documentation or start a discussion
- **MCP Resources**: [Model Context Protocol Docs](https://modelcontextprotocol.io)

---

Built with Node.js and the official MCP SDK. Perfect for learning MCP development!
