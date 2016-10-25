import Hapi = require("hapi");
/**
 * helper will configure your http+https connections.  This does standard boilerplate for you, that's all.
 * @param server
 * @param options
 */
export declare function initialize(server: Hapi.Server, _options?: {
    tls?: {
        keyPath: string;
        certPath: string;
    };
    /**if true, any requests other than those that contain "/metrics/" in the path will be redirected to HTTPS*/
    isHttpsOnly?: boolean;
    httpPort?: number;
    httpsPort?: number;
    /** if false (the default), will construct a "/metrics/simpleHealthCheck" endpoint that returns "OK" */
    disableSimpleHealthCheckEndpoint?: boolean;
}): void;
