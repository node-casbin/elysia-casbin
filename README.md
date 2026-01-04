# Elysia Casbin

[![CI](https://github.com/node-casbin/elysia-casbin/actions/workflows/ci.yml/badge.svg)](https://github.com/node-casbin/elysia-casbin/actions/workflows/ci.yml)
[![NPM version][npm-image]][npm-url]
[![NPM download][download-image]][download-url]
[![Discord](https://img.shields.io/discord/1022748306096537660?logo=discord&label=discord&color=5865F2)](https://discord.gg/S5UjpzGZjN)

[npm-image]: https://img.shields.io/npm/v/elysia-casbin.svg?style=flat-square
[npm-url]: https://npmjs.com/package/elysia-casbin
[download-image]: https://img.shields.io/npm/dm/elysia-casbin.svg?style=flat-square
[download-url]: https://npmjs.com/package/elysia-casbin

Casbin authorization middleware for [Elysia](https://elysiajs.com/). This plugin integrates [Casbin](https://casbin.org/) with Elysia to provide powerful and flexible access control capabilities.

## Features

- 🚀 Easy integration with Elysia framework
- 🔒 Powerful authorization based on Casbin models
- 🎯 Support for RBAC, ABAC, and other access control models
- ⚙️ Customizable subject, object, and action resolvers
- 🎨 Custom unauthorized response handlers
- 📝 Full TypeScript support
- ✅ Comprehensive test coverage

## Installation

```bash
npm install elysia-casbin casbin
```

or with yarn:

```bash
yarn add elysia-casbin casbin
```

or with pnpm:

```bash
pnpm add elysia-casbin casbin
```

## Quick Start

First, create a Casbin model and policy files:

**model.conf**
```ini
[request_definition]
r = sub, obj, act

[policy_definition]
p = sub, obj, act

[role_definition]
g = _, _

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = g(r.sub, p.sub) && r.obj == p.obj && r.act == p.act
```

**policy.csv**
```csv
p, alice, /data1, GET
p, alice, /data1, POST
p, bob, /data2, GET

g, alice, admin
```

Then use the middleware in your Elysia application:

```typescript
import { Elysia } from 'elysia';
import { casbin } from 'elysia-casbin';
import { newEnforcer } from 'casbin';

const enforcer = await newEnforcer('model.conf', 'policy.csv');

const app = new Elysia()
  .use(casbin({ 
    enforcer,
    subjectResolver: (ctx) => {
      // Extract user from your authentication system
      return ctx.headers['x-user-id'] || 'anonymous';
    }
  }))
  .get('/data1', () => 'Protected data 1')
  .get('/data2', () => 'Protected data 2')
  .post('/data1', () => 'Created')
  .listen(3000);

console.log('Server running on http://localhost:3000');
```

## API Reference

### casbin(options: CasbinOptions)

Creates a Casbin middleware instance for Elysia.

#### Options

- **`enforcer`** (required): Casbin enforcer instance
- **`subjectResolver`** (optional): Function to extract the subject (user) from request context
  - Default: Extracts from `context.user.id` or `context.headers['x-user-id']`, falls back to `'anonymous'`
- **`objectResolver`** (optional): Function to extract the object (resource) from request context
  - Default: Uses the request path
- **`actionResolver`** (optional): Function to extract the action from request context
  - Default: Uses the request method (GET, POST, etc.)
- **`unauthorizedHandler`** (optional): Custom handler for unauthorized requests
  - Default: Returns 403 Forbidden with error message

## Examples

### Basic RBAC

```typescript
import { Elysia } from 'elysia';
import { casbin } from 'elysia-casbin';
import { newEnforcer } from 'casbin';

const enforcer = await newEnforcer('rbac_model.conf', 'rbac_policy.csv');

const app = new Elysia()
  .use(casbin({ enforcer }))
  .get('/admin', () => 'Admin panel')
  .listen(3000);
```

### Custom Subject Resolver

Extract user information from JWT or session:

```typescript
import { Elysia } from 'elysia';
import { casbin } from 'elysia-casbin';
import { newEnforcer } from 'casbin';

const enforcer = await newEnforcer('model.conf', 'policy.csv');

const app = new Elysia()
  .use(casbin({
    enforcer,
    subjectResolver: (ctx) => {
      // Extract from JWT payload or session
      return ctx.user?.id || 'guest';
    }
  }))
  .get('/protected', () => 'Protected resource')
  .listen(3000);
```

### Custom Object Resolver

Map resources to policy objects:

```typescript
import { Elysia } from 'elysia';
import { casbin } from 'elysia-casbin';
import { newEnforcer } from 'casbin';

const enforcer = await newEnforcer('model.conf', 'policy.csv');

const app = new Elysia()
  .use(casbin({
    enforcer,
    objectResolver: (ctx) => {
      // Map API paths to resource names
      const pathMap: Record<string, string> = {
        '/api/posts': 'posts',
        '/api/users': 'users',
        '/api/comments': 'comments'
      };
      return pathMap[ctx.path] || ctx.path;
    }
  }))
  .get('/api/posts', () => 'Posts')
  .listen(3000);
```

### Custom Action Resolver

Use custom actions instead of HTTP methods:

```typescript
import { Elysia } from 'elysia';
import { casbin } from 'elysia-casbin';
import { newEnforcer } from 'casbin';

const enforcer = await newEnforcer('model.conf', 'policy.csv');

const app = new Elysia()
  .use(casbin({
    enforcer,
    actionResolver: (ctx) => {
      const actionMap: Record<string, string> = {
        'GET': 'read',
        'POST': 'create',
        'PUT': 'update',
        'DELETE': 'delete'
      };
      return actionMap[ctx.request.method] || 'read';
    }
  }))
  .get('/data', () => 'Data')
  .listen(3000);
```

### Custom Unauthorized Handler

Provide custom error responses:

```typescript
import { Elysia } from 'elysia';
import { casbin } from 'elysia-casbin';
import { newEnforcer } from 'casbin';

const enforcer = await newEnforcer('model.conf', 'policy.csv');

const app = new Elysia()
  .use(casbin({
    enforcer,
    unauthorizedHandler: (ctx) => {
      ctx.set.status = 403;
      return {
        success: false,
        error: 'ACCESS_DENIED',
        message: 'You do not have permission to access this resource',
        timestamp: new Date().toISOString()
      };
    }
  }))
  .get('/protected', () => 'Protected')
  .listen(3000);
```

### Route-Specific Authorization

Apply Casbin middleware to specific routes only:

```typescript
import { Elysia } from 'elysia';
import { casbin } from 'elysia-casbin';
import { newEnforcer } from 'casbin';

const enforcer = await newEnforcer('model.conf', 'policy.csv');

const app = new Elysia()
  .get('/public', () => 'Public endpoint')
  .group('/protected', (app) => 
    app
      .use(casbin({ enforcer }))
      .get('/data', () => 'Protected data')
      .post('/data', () => 'Created')
  )
  .listen(3000);
```

## Integration with Authentication

```typescript
import { Elysia } from 'elysia';
import { jwt } from '@elysiajs/jwt';
import { casbin } from 'elysia-casbin';
import { newEnforcer } from 'casbin';

const enforcer = await newEnforcer('model.conf', 'policy.csv');

const app = new Elysia()
  .use(jwt({
    name: 'jwt',
    secret: 'your-secret-key'
  }))
  .derive(async ({ jwt, headers }) => {
    const auth = headers.authorization;
    if (!auth?.startsWith('Bearer ')) return {};
    
    const token = auth.slice(7);
    const user = await jwt.verify(token);
    return { user };
  })
  .use(casbin({
    enforcer,
    subjectResolver: (ctx) => {
      return (ctx as any).user?.id || 'anonymous';
    }
  }))
  .get('/protected', () => 'Protected resource')
  .listen(3000);
```

## Casbin Models

This middleware works with any Casbin model. Here are some common examples:

### RBAC (Role-Based Access Control)

See the Quick Start example above.

### ABAC (Attribute-Based Access Control)

**model.conf**
```ini
[request_definition]
r = sub, obj, act

[policy_definition]
p = sub_rule, obj, act

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = eval(p.sub_rule) && r.obj == p.obj && r.act == p.act
```

**policy.csv**
```csv
p, r.sub.age > 18, /adult-content, GET
p, r.sub.role == "admin", /admin, GET
```

## Testing

```bash
npm test
```

Run tests with coverage:

```bash
npm run coverage
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Getting Help

- [Casbin Official Website](https://casbin.org)
- [Casbin Documentation](https://casbin.org/docs/overview)
- [Node-Casbin](https://github.com/casbin/node-casbin)
- [Elysia Documentation](https://elysiajs.com)

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.