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
export declare const casbin: (options: CasbinOptions) => Elysia<"", {
    decorator: {};
    store: {};
    derive: {};
    resolve: {};
}, {
    typebox: {};
    error: {};
}, {
    schema: {};
    standaloneSchema: {};
    macro: {};
    macroFn: {};
    parser: {};
    response: {
        [x: string]: {
            [x: string]: any;
        };
    };
}, {}, {
    derive: {};
    resolve: {};
    schema: {};
    standaloneSchema: {};
    response: {};
}, {
    derive: {};
    resolve: {};
    schema: {};
    standaloneSchema: {};
    response: {};
}>;
export default casbin;
