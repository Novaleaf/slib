/// <reference types="node" />
/// <reference types="bluebird" />
import xlib = require("xlib");
import Promise = xlib.promise.bluebird;
export interface IModuleImport {
    (authOptions?: IAuthOptions): IGCloud;
}
export interface IAuthOptions {
    projectId?: string;
    keyFilename?: string;
}
export interface IGCloud {
    bigquery: (authOptions?: IAuthOptions) => any;
    datastore(options?: datastore.IDatastoreOptions): datastore.IDatastore_v040;
}
export declare module datastore {
    interface IEntityInstrumentedData {
        name: string;
        value: string | number | boolean | IInt | IDouble | Date | Buffer | any[] | any;
        excludeFromIndexes?: boolean;
    }
    interface IEntity<TData> {
        key: IKey;
        method?: string;
        /** Data to save with the provided key. If you provide an array of objects, you must use the explicit syntax: name for the name of the property and value for its value. You may also specify an excludeFromIndexes property, set to true or false. */
        data: TData;
    }
    interface IDatastoreOptions extends IAuthOptions {
        /** Override the default API endpoint used to reach Datastore. This is useful for connecting to your local Datastore server (usually "http://localhost:8080"). */
        apiEndpoint?: string;
        /** Namespace to isolate transactions to. */
        namespace?: string;
    }
    type ICallbackApiResponse = {} | any;
    type ICoreApiOptions = {
        /** Specify either strong or eventual. If not specified, default values are chosen by Datastore for the operation. Learn more about strong and eventual consistency here*/
        consistency?: "strong" | "eventual";
        /** Maximum API calls to make.*/
        maxApiCalls?: boolean;
    };
    type IRunQueryCallbackInfo = {
        /**Use this in a follow-up query to begin from where these results ended.*/
        endCursor: string | null;
        /** Datastore responds with one of:
datastore#MORE_RESULTS_AFTER_LIMIT: There may be more results after the specified limit.
datastore#MORE_RESULTS_AFTER_CURSOR: There may be more results after the specified end cursor.
datastore#NO_MORE_RESULTS: There are no more results.*/
        moreResults: string;
    };
    /** functions that are shared between both the ITransaction and IDataset interfaces */
    interface ICoreConnection {
        /**Generate IDs without creating entities.*/
        allocateIds(
            /** The key object to complete. */ incompleteKey: IKey, 
            /** How many IDs to generate. */ n: number, callback: (err: any, keys: IKey[], 
            /** The full API response. */ apiResponse: ICallbackApiResponse) => void): void;
        /** Create a query from the current dataset to query the specified kind, scoped to the namespace provided at the initialization of the dataset. */
        createQuery(namespace: string | undefined, kind: string): IQuery;
        createQuery(kind: string): IQuery;
        /** Delete all entities identified with the specified key(s). */
        delete(key: IKey | IKey[], callback: (err: any, apiResponse: ICallbackApiResponse) => void): void;
        /** Retrieve the entities identified with the specified key(s) in the current transaction. Get operations require a valid key to retrieve the key-identified entity from Datastore. */
        get<TEntityData>(key: IKey, callback: (err: any, entity: IEntity<TEntityData>, apiResponse?: ICallbackApiResponse) => void): void;
        get<TEntityData>(keys: IKey[], callback: (err: any, entities: IEntity<TEntityData>[], apiResponse?: ICallbackApiResponse) => void): void;
        get<TEntityData>(key: IKey, options: ICoreApiOptions, callback: (err: any, entity: IEntity<TEntityData>, apiResponse?: ICallbackApiResponse) => void): void;
        get<TEntityData>(keys: IKey[], options: ICoreApiOptions, callback: (err: any, entities: IEntity<TEntityData>[], apiResponse?: ICallbackApiResponse) => void): void;
        get<TEntityData>(key: IKey, options?: ICoreApiOptions): IStream<IEntity<TEntityData>>;
        /** Datastore allows you to query entities by kind, filter them by property filters, and sort them by a property name. Projection and pagination are also supported.

If you provide a callback, the query is run, and the results are returned as the second argument to your callback. A third argument may also exist, which is a query object that uses the end cursor from the previous query as the starting cursor for the next query. You can pass that object back to this method to see if more results exist.

You may also omit the callback to this function to trigger streaming mode.

        IMPORTANT!  RUNNING IN A TRANSACTION:   Queries inside transactions must include ancestor filters:  Datastore transactions operate only on entities belonging to the same entity group (descended from a common ancestor). To preserve this restriction, all queries performed within a transaction must include an ancestor filter specifying an ancestor in the same entity group as the other operations in the transaction. */
        runQuery<TEntityData>(q: IQuery, callback: (err: any, entities: IEntity<TEntityData>[], info: IRunQueryCallbackInfo, endCursor: string, moreResults: string, apiResponse: ICallbackApiResponse) => void): void;
        runQuery<TEntityData>(q: IQuery, options: ICoreApiOptions, callback: (err: any, entities: IEntity<TEntityData>[], info: IRunQueryCallbackInfo, endCursor: string, moreResults: string, apiResponse: ICallbackApiResponse) => void): void;
        /** probably works, but need to investigate if there is an analogue to the "info" callback parameter */
        runQuery<TEntityData>(q: IQuery, options?: ICoreApiOptions): IStream<IEntity<TEntityData>>;
    }
    interface IDatastore_v040 extends ICoreConnection {
        /** v0.28  undocumented, ex: "https://www.googleapis.com"*/
        apiEndpoint: string;
        /** v0.28  undocumented, ex:  "phantomjscloud-stage3-test1"*/
        namespace: string;
        projectId: string;
        /** Helper function to get a Datastore Double object.*/
        double(value: number): IDouble;
        /** Helper function to get a Datastore Geo Point object.*/
        geoPoint(coordinates: {
            latitude: number;
            longitude: number;
        }): IGeoPoint;
        /** Helper function to get a Datastore Int object.*/
        int(value: number): IInt;
        /** Helper to create a Key object, scoped to the dataset's namespace by default.

You may also specify a configuration object to define a namespace and path. */
        key(/**examples:   'Company'  OR  ['Company', 123] OR ['Company', 'Google'] */ path?: string | (string | number)[]): IKey;
        key(options: {
            path?: string | (string | number)[];
            namespace?: string;
        }): IKey;
        /** Insert or update the specified object(s). If a key is incomplete, its associated object is inserted and the original Key object is updated to contain the generated ID.

This method will determine the correct Datastore method to execute (upsert, insert, update, and insertAutoId) by using the key(s) provided. For example, if you provide an incomplete key (one without an ID), the request will create a new entity and have its ID automatically assigned. If you provide a complete key, the entity will be updated with the data specified.

By default, all properties are indexed. To prevent a property from being included in all indexes, you must supply an entity's data property as an array.*/
        save: IDatasetSaveMethod;
        /** Maps to datastore/dataset#save, forcing the method to be insert. */
        insert: IDatasetSaveMethod;
        /** Maps to datastore/dataset#save, forcing the method to be update.*/
        update: IDatasetSaveMethod;
        /** Maps to datastore/dataset#save, forcing the method to be upsert.*/
        upsert: IDatasetSaveMethod;
        /** A transaction is a set of Datastore operations on one or more entities. Each transaction is guaranteed to be atomic, which means that transactions are never partially applied. Either all of the operations in the transaction are applied, or none of them are applied.*/
        transaction(): ITransaction;
    }
    interface IDatasetSaveMethod {
        <TEntityData>(entity: IEntity<TEntityData> | IEntity<TEntityData>[], callback: (err: any, apiResponse: ICallbackApiResponse) => void): void;
    }
    interface ITransactionSaveMethod {
        <TEntityData>(entity: IEntity<TEntityData> | IEntity<TEntityData>[]): void;
    }
    interface IStream<TData> extends NodeJS.ReadableStream {
        on(event: "error", callback: (err: Error) => void): this;
        on(event: "data", callback: (data: TData) => void): this;
        on(event: "end", callback: () => void): this;
        on(event: string, callback: Function): this;
    }
    interface IDouble {
    }
    interface IInt {
    }
    interface IGeoPoint {
    }
    interface IKey {
        /** 	The ID of the entity. Never equal to zero. Values less than zero are discouraged and will not be supported in the future.
         used for numerical identified entities.   either .id or .key can be set, not both.   */
        id: number;
        /** The name of the entity. A name matching regex "__.*__" is reserved/read-only. A name must not be more than 500 characters. Cannot be "".
        used for named entities.   either .id or .key can be set, not both.
        */
        name: string;
        /** The entity path. An entity path consists of one or more elements composed of a kind and a string or numerical identifier, which identify entities. The first element identifies a root entity, the second element identifies a child of the root entity, the third element a child of the second entity, and so forth. The entities identified by all prefixes of the path are called the element's ancestors. An entity path is always fully complete: ALL of the entity's ancestors are required to be in the path along with the entity identifier itself. The only exception is that in some documented cases, the identifier in the last path element (for the entity) itself may be omitted. A path can never be empty. */
        path: string[];
        /** The kind of the entity. A kind matching regex "__.*__" is reserved/read-only. A kind must not contain more than 500 characters. Cannot be "". */
        kind: string;
        parent: IKey;
    }
    interface IQuery {
        /** Have pagination handled automatically. Default: true.   if true, and you run a query, a sub-query with more results will be returned

        Example

// Retrieve a list of people related to person "1234",
// disabling auto pagination
var query = dataset.createQuery('Person')
  .hasAncestor(dataset.key(['Person', 1234]))
  .autoPaginate(false);

var callback = function(err, entities, nextQuery, apiResponse) {
  if (nextQuery) {
    // More results might exist, so we'll manually fetch them
    dataset.runQuery(nextQuery, callback);
  }
};

dataset.runQuery(query, callback);
        */
        autoPaginate(val: boolean): IQuery;
        /** Set an ending cursor to a query.

        Example

var cursorToken = 'X';

// Retrieve results limited to the extent of cursorToken.
var endQuery = companyQuery.end(cursorToken);*/
        end(/** The ending cursor token. */ custorToken: string): IQuery;
        /** Datastore allows querying on properties. Supported comparison operators are =, <, >, <=, and >=. "Not equal" and IN operators are currently not supported.

To filter by ancestors, see datastore/query#hasAncestor.

        Example

// List all companies named Google that have less than 400 employees.
var companyQuery = query
  .filter('name =', 'Google')
  .filter('size <', 400);

// To filter by key, use `__key__` for the property name. Filter on keys
// stored as properties is not currently supported.
var keyQuery = query.filter('__key__ =', dataset.key(['Company', 'Google']));
        */
        filter(/** Property.  the field name*/ property: string, /** Operator (=, <, >, <=, >=) */ operator: string, /** 	Value to compare property to.*/ value: any): IQuery;
        /** Group query results by a list of properties.
        Example

var groupedQuery = companyQuery.groupBy(['name', 'size']);*/
        groupBy(/** Properties to group by.*/ properties: string[]): IQuery;
        /** Filter a query by ancestors.
        Example

var ancestoryQuery = query.hasAncestor(dataset.key(['Parent', 123]));*/
        hasAncestor(/** Key object to filter by.*/ key: IKey): IQuery;
        /**Set a limit on a query.
        Example

// Limit the results to 10 entities.
var limitQuery = companyQuery.limit(10);*/
        limit(/** The number of results to limit the query to.*/ n: number): IQuery;
        /** Set an offset on a query.
        Example

// Start from the 101st result.
var offsetQuery = companyQuery.offset(100);*/
        offset(/**The offset to start from after the start cursor.*/ n: number): IQuery;
        /** Sort the results by a property name in ascending or descending order. By default, an ascending sort order will be used.
        Example

// Sort by size ascendingly.
var companiesAscending = companyQuery.order('size');

// Sort by size descendingly.
var companiesDescending = companyQuery.order('-size');*/
        order(/**Optional operator (+, -) and property to order by.*/ property: string, options?: {
            descending: boolean;
        }): IQuery;
        /**Retrieve only select properties from the matched entities.

Queries that select a subset of properties are called Projection Queries.
        Example

// Only retrieve the name property.
var selectQuery = companyQuery.select('name');

// Only retrieve the name and size properties.
var selectQuery = companyQuery.select(['name', 'size']);*/
        select(/**Properties to return from the matched entities.*/ fieldNames: string | string[]): IQuery;
        /**Set a starting cursor to a query.
        Example

var cursorToken = 'X';

// Retrieve results starting from cursorToken.
var startQuery = companyQuery.start(cursorToken);*/
        start(/**The starting cursor token.*/ cursorToken: string): IQuery;
    }
    /** Build a Transaction object. Transactions will be created for you by datastore/dataset. When you need to run a transactional operation, use datastore/dataset#runInTransaction. */
    interface ITransaction extends ICoreConnection {
        /** Maps to datastore/dataset#save, forcing the method to be insert. */
        insert: ITransactionSaveMethod;
        /** Insert or update the specified object(s). If a key is incomplete, its associated object is inserted and the original Key object is updated to contain the generated ID.

This method will determine the correct Datastore method to execute (upsert, insert, update, and insertAutoId) by using the key(s) provided. For example, if you provide an incomplete key (one without an ID), the request will create a new entity and have its ID automatically assigned. If you provide a complete key, the entity will be updated with the data specified.

By default, all properties are indexed. To prevent a property from being included in all indexes, you must supply an entity's data property as an array.*/
        save: ITransactionSaveMethod;
        /** Maps to datastore/dataset#save, forcing the method to be update.*/
        update: ITransactionSaveMethod;
        /** Maps to datastore/dataset#save, forcing the method to be upsert.*/
        upsert: ITransactionSaveMethod;
        /** Commit the remote transaction and finalize the current transaction instance.

If the commit request fails, we will automatically rollback the transaction.

        NOTE: in v0.28 this was known as "done()"*/
        commit(callback: (err: any, apiResponse: ICallbackApiResponse) => void): void;
        /** Reverse a transaction remotely and finalize the current transaction instance. */
        rollback(callback: (err: any, apiResponse: ICallbackApiResponse) => void): void;
        /** Begin a remote transaction. In the callback provided, run your transactional commands.
        NOTE: in v0.28 this used to be accomplished by dataset.runInTransaction()
        */
        run(
            /**The function to execute within the context of a transaction.*/
            callback: (
            /** An error returned while making this request. May be null */ err: any, 
            /** This transaction instance.*/
            transaction: ITransaction, 
            /**The full API response.*/
            apiResponse: ICallbackApiResponse) => void): void;
    }
}
/**
 *  definitions for v0.27.0
  docs here: https://googlecloudplatform.github.io/gcloud-node/#/docs/v0.27.0/datastore/dataset
 */
export declare var gcloud: IModuleImport;
export declare module datastore {
    class _EzConnectionBase<TConnection extends ICoreConnection> {
        connection: TConnection;
        /** for use when the dataset is explicitly  needed (constructing keys, etc) */
        assistantDatastore: IDatastore_v040;
        isTransaction: boolean;
        constructor(connection: TConnection, 
            /** for use when the dataset is explicitly  needed (constructing keys, etc) */
            assistantDatastore: IDatastore_v040);
        allocateIds(/** The key object to complete. */ incompleteKey: IKey, n: number): Promise<{
            keys: IKey[];
            apiResponse: any;
        }>;
        delete(key: IKey | IKey[]): Promise<{
            apiResponse: any;
        }>;
        deleteEz(kind: string, idOrName: string | number, namespace?: string): Promise<{
            apiResponse: any;
        }>;
        get<TEntityData>(key: IKey): Promise<{
            entity: IEntity<TEntityData>;
            apiResponse: any;
        }>;
        get<TEntityData>(keys: IKey[]): Promise<{
            entity: IEntity<TEntityData>[];
            apiResponse: any;
        }>;
        getEz<TEntityData>(kind: string, idOrName: string | number, namespace?: string): Promise<{
            entity: IEntity<TEntityData>;
            apiResponse: any;
        }>;
        insertEz<TEntityData>(kind: string, idOrName: string | number, data: TEntityData, namespace?: string): Promise<{
            entity: IEntity<TEntityData>;
            apiResponse: any;
        }>;
        updateEz<TEntityData>(kind: string, idOrName: string | number, data: TEntityData, namespace?: string): Promise<{
            entity: IEntity<TEntityData>;
            apiResponse: any;
        }>;
        upsertEz<TEntityData>(kind: string, idOrName: string | number, data: TEntityData, namespace?: string): Promise<{
            entity: IEntity<TEntityData>;
            apiResponse: any;
        }>;
        runQuery<TEntityData>(q: IQuery): Promise<{
            entities: IEntity<TEntityData>[];
            nextQuery: IQuery;
            apiResponse: any;
        }>;
        insert<TEntityData>(entity: IEntity<TEntityData> | IEntity<TEntityData>[]): Promise<{
            apiResponse: any;
        }>;
        save<TEntityData>(entity: IEntity<TEntityData> | IEntity<TEntityData>[]): Promise<{
            apiResponse: any;
        }>;
        update<TEntityData>(entity: IEntity<TEntityData> | IEntity<TEntityData>[]): Promise<{
            apiResponse: any;
        }>;
        upsert<TEntityData>(entity: IEntity<TEntityData> | IEntity<TEntityData>[]): Promise<{
            apiResponse: any;
        }>;
    }
    interface IEntityResult<TEzEntity> {
        ezEntity: TEzEntity;
        apiResponse: any;
    }
    /** an base class for helping to create an ORM*/
    class EzEntity<TId extends string | (number), TData> {
        _ezDataset: EzDatastore;
        options: {
            /** for multitenancy, can be undefined to use the default namespace */
            namespace?: string;
            kind: string;
            excludeFromIndexes?: TData;
        };
        /** can be undefined if using a numeric ID, in that case the ID will be auto-assigned on the server.  this is updated whenever we read from the datastore server */
        idOrName: TId;
        constructor(_ezDataset: EzDatastore, options: {
            /** for multitenancy, can be undefined to use the default namespace */
            namespace?: string;
            kind: string;
            excludeFromIndexes?: TData;
        }, 
            /** can be undefined if using a numeric ID, in that case the ID will be auto-assigned on the server.  this is updated whenever we read from the datastore server */
            idOrName: TId, 
            /** if passed, we will clone this and populate the .data value with it*/
            initialData?: TData);
        /** the latest version of the data we read from the datastore (may not be up to date, be aware!)
        OR the latest version we wrote (whichever is most recent)

        this is only populated once we do a read/write to the datastore.

        IMPORTANT!  To write, use the various write functions, do not modify this directly.
        */
        data: TData | null;
        /**
        DO NOT USE!   for reference and advanced use.

         entity as returned by datastore or at least the local gcloud-datastore wrapper.

        this is only populated once we do a read/write to the datastore.
        */
        _rawEntity: IEntity<TData> | null;
        /**
         *  helper to properly apply our index status to fields
         * @param instrumentedData
         */
        private _convertInstrumentedEntityDataToData(instrumentedData);
        /**
         * helper to properly apply our index status to fields
         * @param data
         */
        private _convertDataToInstrumentedEntityData(data);
        /**
         *  create a query for entities of this kind.  (not related to this key, just a shortcut to dataset.connection.createQuery)
         */
        _query_create(): IQuery;
        /**
         * using the id/name supplied in the constructor, will retrieve the associated entity from the datastore, reading the results into this instance.
         * if the entity doesn't exist, the entity.data will be null.
         * @param transaction if you want this work to be done inside a transaction, pass it here
         */
        _read_get(transaction?: EzTransaction): Promise<IEntityResult<this>>;
        /**
         * same as ._read_get() but will return a rejected Promise if the entity does not exists.   (._read_get() returns null data on not exists)
         * @param transaction
         */
        _read_get_mustExist(transaction?: EzTransaction): Promise<IEntityResult<this>>;
        _write_insert(data: TData, transaction?: EzTransaction): Promise<IEntityResult<this>>;
        _write_update(data: TData, transaction?: EzTransaction): Promise<IEntityResult<this>>;
        _write_upsert(data: TData, transaction?: EzTransaction): Promise<IEntityResult<this>>;
        _write_delete(transaction?: EzTransaction): Promise<IEntityResult<this>>;
        /**
         * updates this ezEntity with values from a server, overwriting existing values in this object, but doesn't contact the datastore.
         * @param entity
         */
        _processEntityFromServer(entity: IEntity<TData> | null): void;
    }
    class EzDatastore extends _EzConnectionBase<IDatastore_v040> {
        constructor(dataset: IDatastore_v040);
        /**
         * DEPRECATED: while functional, the workflow is wonky.   favor the promise based ".runInTransaction()" instead.
         * @param fn
         */
        _runInTransaction_DEPRECATED<TResult>(
            /** be aware that inside transactions (using the transaction.write() functions), write operations resolve instantly as they are not actually applied until the done() callback method is called.*/
            fn: (transaction: EzTransaction, done: (result: TResult) => void) => void, 
            /** auto-retry if the transaction fails. default = { interval: 0, max_tries:10 }  FYI in datastore v1Beta2 each try takes aprox 1 second*/
            retryOptions?: xlib.promise._BluebirdRetryInternals.IOptions): Promise<TResult>;
        /**
         * promise based transaction.
         * @param userFunction
         * @param retryOptions
         */
        runInTransaction<TResult>(
            /** return a promise that resolves to commit the transaction.   return a rejected to rollback.
            IMPORTANT NOTE: be aware that inside transactions (using the transaction.write() functions), write operations resolve instantly as they are not actually applied until the done() callback method is called.
             */
            userFunction: (transaction: EzTransaction) => Promise<TResult>, 
            /** auto-retry if the transaction fails. default = { interval: 0, max_tries:10 }  FYI in datastore v1Beta2 each try takes aprox 1 second*/
            retryOptions?: xlib.promise._BluebirdRetryInternals.IOptions): Promise<TResult>;
    }
    /**
     * created by invoking EzDataset.runInTransaction
     * be aware that inside transactions, write operations resolve instantly as they are not actually applied until the done() callback method is called.
     */
    class EzTransaction extends _EzConnectionBase<ITransaction> {
        /**
     *  return this as a rejection of the transaction to prevent retries.
     * @param messageOrInnerError
     */
        newStopError(messageOrInnerError: string | Error): Error;
        /**
         * if you use the promise based tranasctions (which you should!) you should never manually need to call this.
        simply wraps the rollback() method in a promise, resolving when the rollback succeeds, rejects when rollback fails.
         */
        __rollbackHelper_INTERNAL(): Promise<{
            apiResponse: any;
        }>;
    }
    class DatastoreException extends xlib.exception.Exception {
    }
}
