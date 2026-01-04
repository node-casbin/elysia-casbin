"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.casbin = void 0;
const elysia_1 = require("elysia");
const defaultSubjectResolver = (context) => {
    const user = context.user;
    if (user && user.id) {
        return user.id;
    }
    const userId = context.headers?.['x-user-id'];
    return userId ? String(userId) : 'anonymous';
};
const defaultObjectResolver = (context) => {
    return context.path;
};
const defaultActionResolver = (context) => {
    return context.request.method;
};
const defaultUnauthorizedHandler = (context) => {
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
const casbin = (options) => {
    const { enforcer, subjectResolver = defaultSubjectResolver, objectResolver = defaultObjectResolver, actionResolver = defaultActionResolver, unauthorizedHandler = defaultUnauthorizedHandler } = options;
    if (!enforcer) {
        throw new Error('Casbin enforcer is required');
    }
    return new elysia_1.Elysia({
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
        }
        catch (error) {
            console.error('Casbin authorization error:', error);
            context.set.status = 500;
            return {
                error: 'Internal Server Error',
                message: 'Authorization check failed'
            };
        }
    });
};
exports.casbin = casbin;
exports.default = exports.casbin;
