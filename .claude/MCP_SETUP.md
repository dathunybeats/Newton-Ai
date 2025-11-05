# Supabase MCP Setup for Newton AI

## What is MCP?

Model Context Protocol (MCP) allows Claude Code to directly interact with your Supabase database, making it easier to:
- Query database tables
- Create and modify schemas
- Run SQL commands
- Inspect data
- Debug issues

## Configuration Status

✅ **MCP Configuration Created**
- Project scoped to: `bhuhmoivafgsiiynuedv`
- Configuration files: `.mcp.json` and `.claude/mcp.json`

## Next Steps: Authentication

### Option 1: Automatic Authentication (Recommended)

1. **Restart Claude Code** (close and reopen VS Code)
2. **Run authentication command** in a regular terminal (NOT the IDE terminal):
   ```bash
   claude /mcp
   ```
3. **Select "supabase"** from the list
4. **Click "Authenticate"** - this will open a browser window
5. **Login to Supabase** and grant access to Newton AI organization

### Option 2: Manual Authentication (CI/Advanced)

If you need manual authentication (e.g., for CI environments):

1. **Generate Personal Access Token**
   - Go to: https://supabase.com/dashboard/account/tokens
   - Create new token: "Newton AI MCP Token"
   - Copy the token

2. **Update `.mcp.json`** with the token:
   ```json
   {
     "mcpServers": {
       "supabase": {
         "type": "http",
         "url": "https://mcp.supabase.com/mcp?project_ref=bhuhmoivafgsiiynuedv",
         "headers": {
           "Authorization": "Bearer YOUR_TOKEN_HERE"
         }
       }
     }
   }
   ```

## Security Best Practices

⚠️ **IMPORTANT**: This is configured for a **DEVELOPMENT PROJECT ONLY**

Following Supabase MCP security recommendations:
- ✅ Scoped to a single project
- ✅ Development environment (not production)
- ✅ Configuration files in .gitignore
- ⚠️ Always review SQL queries before executing
- ⚠️ Keep manual approval enabled in Claude Code

### Safety Settings

1. **Manual Approval**: Always keep "manual approval of tool calls" enabled in Claude Code
2. **Read-Only Mode**: Consider adding `&read_only=true` to the URL if you only need to inspect data
3. **Review Queries**: Always read the SQL before executing
4. **No Production Data**: Never connect to production database

## Testing the Connection

Once authenticated, try asking Claude Code:

```
"Can you show me the tables in my Supabase database?"
"What's the schema of the users table?"
"Can you help me create a notes table?"
```

## Available Features

With MCP enabled, Claude Code can:
- 📊 Query database tables
- 🔍 Inspect schemas
- 🛠️ Create/modify tables
- 🔐 Manage RLS policies
- 📁 Work with Storage buckets
- ⚡ Run SQL commands
- 🐛 Debug database issues

## Troubleshooting

### "MCP server not found"
- Make sure you've restarted Claude Code/VS Code
- Check that `.mcp.json` exists in the project root

### "Authentication failed"
- Run `claude /mcp` in a regular terminal (not IDE)
- Make sure you're logged into Supabase account
- Check that you've granted access to the correct organization

### "Permission denied"
- Verify your Supabase account has access to the project
- Check that project ref `bhuhmoivafgsiiynuedv` is correct

## Learn More

- [Supabase MCP Documentation](https://supabase.com/docs/guides/ai/model-context-protocol)
- [MCP Security Best Practices](https://supabase.com/docs/guides/ai/model-context-protocol#security-risks)
- [Claude Code MCP Guide](https://docs.anthropic.com/claude/docs/mcp)
