// Copyright 2026 The Casbin Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { Elysia } from 'elysia';
import { newEnforcer } from 'casbin';
import { casbin } from '../src/index';
import * as path from 'path';

describe('Elysia Casbin Middleware', () => {
  let enforcer: any;

  beforeAll(async () => {
    const modelPath = path.join(__dirname, 'fixtures/rbac_model.conf');
    const policyPath = path.join(__dirname, 'fixtures/rbac_policy.csv');
    enforcer = await newEnforcer(modelPath, policyPath);
  });

  describe('Basic Authorization', () => {
    it('should allow authorized requests', async () => {
      const app = new Elysia()
        .use(casbin({ 
          enforcer,
          subjectResolver: () => 'alice'
        }))
        .get('/data1', () => 'Success')
        .listen(0);

      const response = await app.handle(
        new Request('http://localhost/data1', {
          method: 'GET'
        })
      );

      expect(response.status).toBe(200);
      const body = await response.text();
      expect(body).toBe('Success');

      app.stop();
    });

    it('should deny unauthorized requests', async () => {
      const app = new Elysia()
        .use(casbin({ 
          enforcer,
          subjectResolver: () => 'bob'
        }))
        .get('/data1', () => 'Success')
        .listen(0);

      const response = await app.handle(
        new Request('http://localhost/data1', {
          method: 'GET'
        })
      );

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.error).toBe('Forbidden');

      app.stop();
    });

    it('should work with POST method', async () => {
      const app = new Elysia()
        .use(casbin({ 
          enforcer,
          subjectResolver: () => 'alice'
        }))
        .post('/data1', () => 'Success')
        .listen(0);

      const response = await app.handle(
        new Request('http://localhost/data1', {
          method: 'POST'
        })
      );

      expect(response.status).toBe(200);

      app.stop();
    });

    it('should deny unauthorized POST requests', async () => {
      const app = new Elysia()
        .use(casbin({ 
          enforcer,
          subjectResolver: () => 'bob'
        }))
        .post('/data1', () => 'Success')
        .listen(0);

      const response = await app.handle(
        new Request('http://localhost/data1', {
          method: 'POST'
        })
      );

      expect(response.status).toBe(403);

      app.stop();
    });
  });

  describe('Role-Based Authorization', () => {
    it('should allow access based on roles', async () => {
      const app = new Elysia()
        .use(casbin({ 
          enforcer,
          subjectResolver: () => 'alice'
        }))
        .get('/admin', () => 'Admin Panel')
        .listen(0);

      const response = await app.handle(
        new Request('http://localhost/admin', {
          method: 'GET'
        })
      );

      expect(response.status).toBe(200);
      const body = await response.text();
      expect(body).toBe('Admin Panel');

      app.stop();
    });

    it('should deny access to users without proper role', async () => {
      const app = new Elysia()
        .use(casbin({ 
          enforcer,
          subjectResolver: () => 'bob'
        }))
        .get('/admin', () => 'Admin Panel')
        .listen(0);

      const response = await app.handle(
        new Request('http://localhost/admin', {
          method: 'GET'
        })
      );

      expect(response.status).toBe(403);

      app.stop();
    });
  });

  describe('Custom Resolvers', () => {
    it('should use custom subject resolver', async () => {
      const app = new Elysia()
        .use(casbin({ 
          enforcer,
          subjectResolver: (ctx) => {
            const userId = ctx.headers['x-user-id'];
            return userId ? String(userId) : 'anonymous';
          }
        }))
        .get('/data1', () => 'Success')
        .listen(0);

      const response = await app.handle(
        new Request('http://localhost/data1', {
          method: 'GET',
          headers: { 'x-user-id': 'alice' }
        })
      );

      expect(response.status).toBe(200);

      app.stop();
    });

    it('should use custom object resolver', async () => {
      const app = new Elysia()
        .use(casbin({ 
          enforcer,
          subjectResolver: () => 'alice',
          objectResolver: (ctx) => {
            return '/data1';
          }
        }))
        .get('/some-other-path', () => 'Success')
        .listen(0);

      const response = await app.handle(
        new Request('http://localhost/some-other-path', {
          method: 'GET'
        })
      );

      expect(response.status).toBe(200);

      app.stop();
    });

    it('should use custom action resolver', async () => {
      const app = new Elysia()
        .use(casbin({ 
          enforcer,
          subjectResolver: () => 'alice',
          actionResolver: () => 'GET'
        }))
        .post('/data1', () => 'Success')
        .listen(0);

      const response = await app.handle(
        new Request('http://localhost/data1', {
          method: 'POST'
        })
      );

      expect(response.status).toBe(200);

      app.stop();
    });

    it('should use custom unauthorized handler', async () => {
      const app = new Elysia()
        .use(casbin({ 
          enforcer,
          subjectResolver: () => 'bob',
          unauthorizedHandler: (ctx) => {
            ctx.set.status = 401;
            return { custom: 'error', message: 'Custom unauthorized' };
          }
        }))
        .get('/data1', () => 'Success')
        .listen(0);

      const response = await app.handle(
        new Request('http://localhost/data1', {
          method: 'GET'
        })
      );

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.custom).toBe('error');
      expect(body.message).toBe('Custom unauthorized');

      app.stop();
    });
  });

  describe('Error Handling', () => {
    it('should throw error if enforcer is not provided', () => {
      expect(() => {
        casbin({} as any);
      }).toThrow('Casbin enforcer is required');
    });
  });

  describe('Default Resolvers', () => {
    it('should use default subject resolver from x-user-id header', async () => {
      const app = new Elysia()
        .use(casbin({ enforcer }))
        .get('/data1', () => 'Success')
        .listen(0);

      const response = await app.handle(
        new Request('http://localhost/data1', {
          method: 'GET',
          headers: { 'x-user-id': 'alice' }
        })
      );

      expect(response.status).toBe(200);

      app.stop();
    });

    it('should use anonymous as default subject when no user info is available', async () => {
      const app = new Elysia()
        .use(casbin({ enforcer }))
        .get('/data1', () => 'Success')
        .listen(0);

      const response = await app.handle(
        new Request('http://localhost/data1', {
          method: 'GET'
        })
      );

      expect(response.status).toBe(403);

      app.stop();
    });
  });
});
