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
import { Enforcer } from 'casbin';

export interface CasbinOptions {
  /**
   * Casbin enforcer instance
   */
  enforcer: Enforcer;

  /**
   * Custom function to extract subject from request context
   * @default - Extracts from user.id or headers['x-user-id']
   */
  subjectResolver?: (context: any) => string | Promise<string>;

  /**
   * Custom function to extract object from request context
   * @default - Extracts from request path
   */
  objectResolver?: (context: any) => string | Promise<string>;

  /**
   * Custom function to extract action from request context
   * @default - Extracts from request method
   */
  actionResolver?: (context: any) => string | Promise<string>;

  /**
   * Custom unauthorized handler
   * @default - Returns 403 Forbidden
   */
  unauthorizedHandler?: (context: any) => any;
}

const defaultSubjectResolver = (context: any): string => {
  const user = (context as any).user;
  if (user && user.id) {
    return user.id;
  }
  const headers = context.headers || {};
  const userId = headers['x-user-id'];
  return userId ? String(userId) : 'anonymous';
};

const defaultObjectResolver = (context: any): string => {
  return context.path;
};

const defaultActionResolver = (context: any): string => {
  return context.request.method;
};

const defaultUnauthorizedHandler = (context: any) => {
  context.set.status = 403;
  return {
    error: 'Forbidden',
    message: 'You do not have permission to access this resource'
  };
};

/**
 * Casbin authorization middleware for Elysia
 * 
 * @example
 * ```typescript
 * import { Elysia } from 'elysia';
 * import { casbin } from 'elysia-casbin';
 * import { newEnforcer } from 'casbin';
 * 
 * const enforcer = await newEnforcer('model.conf', 'policy.csv');
 * 
 * const app = new Elysia()
 *   .use(casbin({ enforcer }))
 *   .get('/data', () => 'Protected data')
 *   .listen(3000);
 * ```
 */
export const casbin = (options: CasbinOptions) => {
  const {
    enforcer,
    subjectResolver = defaultSubjectResolver,
    objectResolver = defaultObjectResolver,
    actionResolver = defaultActionResolver,
    unauthorizedHandler = defaultUnauthorizedHandler
  } = options;

  if (!enforcer) {
    throw new Error('Casbin enforcer is required');
  }

  return new Elysia({
    name: 'elysia-casbin',
    seed: options
  }).onBeforeHandle({ as: 'global' }, async (context) => {
    try {
      const subject = await subjectResolver(context);
      const object = await objectResolver(context);
      const action = await actionResolver(context);

      const allowed = await enforcer.enforce(subject, object, action);

      if (!allowed) {
        return unauthorizedHandler(context);
      }
    } catch (error) {
      console.error('Casbin authorization error:', error);
      context.set.status = 500;
      return {
        error: 'Internal Server Error',
        message: 'Authorization check failed'
      };
    }
  });
};

export default casbin;
