import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import express from 'express';
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema
} from '@modelcontextprotocol/sdk/types.js';

class Logger {
  constructor() {
    this.logLevel = process.env.LOG_LEVEL || 'info';
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`;
  }

  info(message, meta = {}) {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message, meta));
    }
  }

  error(message, meta = {}) {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, meta));
    }
  }

  warn(message, meta = {}) {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, meta));
    }
  }

  debug(message, meta = {}) {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', message, meta));
    }
  }

  shouldLog(level) {
    const levels = { error: 0, warn: 1, info: 2, debug: 3 };
    return levels[level] <= levels[this.logLevel];
  }
}

const logger = new Logger();

class MemoryStore {
  constructor() {
    this.memories = new Map();
    this.nextId = 1;
  }

  store(content, tags = []) {
    const id = this.nextId++;
    const memory = {
      id,
      content,
      tags,
      timestamp: new Date().toISOString()
    };
    this.memories.set(id, memory);
    logger.info('Memory stored', { memoryId: id, tagsCount: tags.length });
    return memory;
  }

  retrieve(query) {
    const results = [];
    for (const memory of this.memories.values()) {
      if (this.matchesQuery(memory, query)) {
        results.push(memory);
      }
    }
    const sortedResults = results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    logger.info('Memory retrieval', { query, resultsCount: sortedResults.length });
    return sortedResults;
  }

  matchesQuery(memory, query) {
    if (!query) return true;
    
    const searchText = query.toLowerCase();
    const contentMatch = memory.content.toLowerCase().includes(searchText);
    const tagMatch = memory.tags.some(tag => tag.toLowerCase().includes(searchText));
    
    return contentMatch || tagMatch;
  }

  getAll() {
    const memories = Array.from(this.memories.values())
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    logger.info('Listed all memories', { totalCount: memories.length });
    return memories;
  }

  delete(id) {
    const deleted = this.memories.delete(id);
    logger.info('Memory deletion attempt', { memoryId: id, success: deleted });
    return deleted;
  }

  clear() {
    const count = this.memories.size;
    this.memories.clear();
    logger.info('All memories cleared', { clearedCount: count });
  }
}

const server = new Server(
  {
    name: 'memory-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const memoryStore = new MemoryStore();

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'store_memory',
        description: 'Store a memory with optional tags',
        inputSchema: {
          type: 'object',
          properties: {
            content: {
              type: 'string',
              description: 'The content to store',
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Optional tags for categorizing the memory',
            },
          },
          required: ['content'],
        },
      },
      {
        name: 'retrieve_memories',
        description: 'Retrieve memories based on a search query',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query to filter memories',
            },
          },
        },
      },
      {
        name: 'list_memories',
        description: 'List all stored memories',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'delete_memory',
        description: 'Delete a memory by ID',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
              description: 'The ID of the memory to delete',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'clear_memories',
        description: 'Clear all stored memories',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  logger.info('Tool call received', { toolName: name, requestId: request.id, args });

  try {
    switch (name) {
      case 'store_memory': {
        logger.debug('Executing store_memory tool', { content: args.content?.substring(0, 100) + '...', tags: args.tags });
        const memory = memoryStore.store(args.content, args.tags || []);
        logger.info('Tool call completed successfully', { toolName: name, requestId: request.id, memoryId: memory.id });
        return {
          content: [
            {
              type: 'text',
              text: `Memory stored successfully with ID ${memory.id}`,
            },
          ],
        };
      }

    case 'retrieve_memories': {
      logger.debug('Executing retrieve_memories tool', { query: args.query });
      const memories = memoryStore.retrieve(args.query);
      logger.info('Tool call completed successfully', { toolName: name, requestId: request.id, resultCount: memories.length });
      return {
        content: [
          {
            type: 'text',
            text: memories.length > 0 
              ? `Found ${memories.length} memories:\n\n${memories.map(m => 
                  `ID: ${m.id}\nContent: ${m.content}\nTags: ${m.tags.join(', ')}\nTimestamp: ${m.timestamp}\n`
                ).join('\n')}`
              : 'No memories found matching the query.',
          },
        ],
      };
    }

    case 'list_memories': {
      logger.debug('Executing list_memories tool');
      const memories = memoryStore.getAll();
      logger.info('Tool call completed successfully', { toolName: name, requestId: request.id, totalMemories: memories.length });
      return {
        content: [
          {
            type: 'text',
            text: memories.length > 0
              ? `All memories (${memories.length} total):\n\n${memories.map(m => 
                  `ID: ${m.id}\nContent: ${m.content}\nTags: ${m.tags.join(', ')}\nTimestamp: ${m.timestamp}\n`
                ).join('\n')}`
              : 'No memories stored.',
          },
        ],
      };
    }

    case 'delete_memory': {
      logger.debug('Executing delete_memory tool', { memoryId: args.id });
      const deleted = memoryStore.delete(args.id);
      logger.info('Tool call completed successfully', { toolName: name, requestId: request.id, memoryId: args.id, deleted });
      return {
        content: [
          {
            type: 'text',
            text: deleted 
              ? `Memory with ID ${args.id} deleted successfully.`
              : `Memory with ID ${args.id} not found.`,
          },
        ],
      };
    }

    case 'clear_memories': {
      logger.debug('Executing clear_memories tool');
      memoryStore.clear();
      logger.info('Tool call completed successfully', { toolName: name, requestId: request.id });
      return {
        content: [
          {
            type: 'text',
            text: 'All memories cleared successfully.',
          },
        ],
      };
    }

    default:
      logger.error('Unknown tool called', { toolName: name, requestId: request.id });
      throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    logger.error('Tool call failed', { toolName: name, requestId: request.id, error: error.message });
    throw error;
  }
});

async function main() {
  const port = process.env.PORT || 3000;
  const app = express();
  
  app.use(express.json());
  
  // HTTP endpoint for MCP messages
  app.post('/message', async (req, res) => {
    try {
      const request = req.body;
      logger.info('HTTP MCP request received', { method: request.method, id: request.id });
      let response;
      
      if (request.method === 'initialize') {
        response = {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: { tools: {} },
            serverInfo: { name: 'memory-server', version: '1.0.0' }
          }
        };
      } else if (request.method === 'tools/list') {
        response = {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            tools: [
              {
                name: 'store_memory',
                description: 'Store a memory with optional tags',
                inputSchema: {
                  type: 'object',
                  properties: {
                    content: {
                      type: 'string',
                      description: 'The content to store',
                    },
                    tags: {
                      type: 'array',
                      items: { type: 'string' },
                      description: 'Optional tags for categorizing the memory',
                    },
                  },
                  required: ['content'],
                },
              },
              {
                name: 'retrieve_memories',
                description: 'Retrieve memories based on a search query',
                inputSchema: {
                  type: 'object',
                  properties: {
                    query: {
                      type: 'string',
                      description: 'Search query to filter memories',
                    },
                  },
                },
              },
              {
                name: 'list_memories',
                description: 'List all stored memories',
                inputSchema: {
                  type: 'object',
                  properties: {},
                },
              },
              {
                name: 'delete_memory',
                description: 'Delete a memory by ID',
                inputSchema: {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'number',
                      description: 'The ID of the memory to delete',
                    },
                  },
                  required: ['id'],
                },
              },
              {
                name: 'clear_memories',
                description: 'Clear all stored memories',
                inputSchema: {
                  type: 'object',
                  properties: {},
                },
              },
            ],
          }
        };
      } else if (request.method === 'tools/call') {
        const { name, arguments: args } = request.params;
        let result;

        logger.info('HTTP tool call', { toolName: name, requestId: request.id, args });

        switch (name) {
          case 'store_memory': {
            logger.debug('HTTP executing store_memory tool', { content: args.content?.substring(0, 100) + '...', tags: args.tags });
            const memory = memoryStore.store(args.content, args.tags || []);
            result = {
              content: [
                {
                  type: 'text',
                  text: `Memory stored successfully with ID ${memory.id}`,
                },
              ],
            };
            logger.info('HTTP tool call completed', { toolName: name, requestId: request.id, memoryId: memory.id });
            break;
          }

          case 'retrieve_memories': {
            logger.debug('HTTP executing retrieve_memories tool', { query: args.query });
            const memories = memoryStore.retrieve(args.query);
            result = {
              content: [
                {
                  type: 'text',
                  text: memories.length > 0 
                    ? `Found ${memories.length} memories:\n\n${memories.map(m => 
                        `ID: ${m.id}\nContent: ${m.content}\nTags: ${m.tags.join(', ')}\nTimestamp: ${m.timestamp}\n`
                      ).join('\n')}`
                    : 'No memories found matching the query.',
                },
              ],
            };
            logger.info('HTTP tool call completed', { toolName: name, requestId: request.id, resultCount: memories.length });
            break;
          }

          case 'list_memories': {
            logger.debug('HTTP executing list_memories tool');
            const memories = memoryStore.getAll();
            result = {
              content: [
                {
                  type: 'text',
                  text: memories.length > 0
                    ? `All memories (${memories.length} total):\n\n${memories.map(m => 
                        `ID: ${m.id}\nContent: ${m.content}\nTags: ${m.tags.join(', ')}\nTimestamp: ${m.timestamp}\n`
                      ).join('\n')}`
                    : 'No memories stored.',
                },
              ],
            };
            logger.info('HTTP tool call completed', { toolName: name, requestId: request.id, totalMemories: memories.length });
            break;
          }

          case 'delete_memory': {
            logger.debug('HTTP executing delete_memory tool', { memoryId: args.id });
            const deleted = memoryStore.delete(args.id);
            result = {
              content: [
                {
                  type: 'text',
                  text: deleted 
                    ? `Memory with ID ${args.id} deleted successfully.`
                    : `Memory with ID ${args.id} not found.`,
                },
              ],
            };
            logger.info('HTTP tool call completed', { toolName: name, requestId: request.id, memoryId: args.id, deleted });
            break;
          }

          case 'clear_memories': {
            logger.debug('HTTP executing clear_memories tool');
            memoryStore.clear();
            result = {
              content: [
                {
                  type: 'text',
                  text: 'All memories cleared successfully.',
                },
              ],
            };
            logger.info('HTTP tool call completed', { toolName: name, requestId: request.id });
            break;
          }

          default:
            logger.error('HTTP unknown tool called', { toolName: name, requestId: request.id });
            throw new Error(`Unknown tool: ${name}`);
        }

        response = {
          jsonrpc: '2.0',
          id: request.id,
          result: result
        };
      } else {
        logger.warn('HTTP method not found', { method: request.method, id: request.id });
        response = {
          jsonrpc: '2.0',
          id: request.id,
          error: { code: -32601, message: 'Method not found' }
        };
      }
      
      logger.info('HTTP response sent', { method: request.method, id: request.id, success: true });
      res.json(response);
    } catch (error) {
      logger.error('HTTP request failed', { method: req.body?.method, id: req.body?.id, error: error.message });
      res.status(500).json({
        jsonrpc: '2.0',
        id: req.body.id || null,
        error: { code: -32603, message: error.message }
      });
    }
  });
  
  app.listen(port, () => {
    logger.info('MCP Memory Server started', { port, logLevel: logger.logLevel });
    console.log(`MCP Memory Server running on http://localhost:${port}`);
  });
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});