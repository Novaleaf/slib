"use strict";



import xlib = require("xlib");
import _ = xlib.lodash;
import __ = xlib.lolo;
var log = new xlib.logging.Logger(__filename);
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
	//v0.28:  datastore: datastore.IDatastore_v028;
	datastore(options?: datastore.IDatastoreOptions): datastore.IDatastore_v040;
}


export module datastore {

	export interface IEntityInstrumentedData {
		name: string;
		value: string | number | boolean | IInt | IDouble | Date | Buffer | any[] | any;
		excludeFromIndexes?: boolean
	}

	/** the raw entity returned by the datastore api */
	export interface IDbEntity<TData> {
		key: IKey,
		///** Optional method to explicity use for save. The choices include 'insert', 'update', 'upsert' and 'insert_auto_id'. */
		method?: string,
		/** Data to save with the provided key. If you provide an array of objects, you must use the explicit syntax: name for the name of the property and value for its value. You may also specify an excludeFromIndexes property, set to true or false. */
		data: TData,// | IEntityInstrumentedData[],
	}
	///** advanced features of IEntity, not sure how to use yet */
	//export interface IEntityAdvanced<TData> extends IEntity<TData> {
	//    ///** Data to save with the provided key. If you provide an array of objects, you must use the explicit syntax: name for the name of the property and value for its value. You may also specify an excludeFromIndexes property, set to true or false. */
	//    //data: TData | IEntityInstrumentedData[],
	//}

	//export interface IDatastore_v028 {
	//    double(num: number): IDouble;
	//    int(num: number): IInt;
	//    dataset(options?: IDatastoreOptions): IDatastore_v040;

	//    /** undocumented, */
	//    config:{
	//        /** ?? */
	//        interceptors_:any[],
	//        projectId:string,
	//        /** path to keyfile */
	//        keyFilename:string;
	//        }
	//}


	export interface IDatastoreOptions extends IAuthOptions {
		/** Override the default API endpoint used to reach Datastore. This is useful for connecting to your local Datastore server (usually "http://localhost:8080"). */
		apiEndpoint?: string;
		/** Namespace to isolate transactions to. */
		namespace?: string;
	}

	export type ICallbackApiResponse = {} | any;

	export type ICoreApiOptions = {
		/** Specify either strong or eventual. If not specified, default values are chosen by Datastore for the operation. Learn more about strong and eventual consistency here*/
		consistency?: "strong" | "eventual";
		/** Maximum API calls to make.*/
		maxApiCalls?: boolean;

	};

	export type IRunQueryCallbackInfo = {
		/**Use this in a follow-up query to begin from where these results ended.*/
		endCursor: string | null;
		/** Datastore responds with one of:
datastore#MORE_RESULTS_AFTER_LIMIT: There may be more results after the specified limit.
datastore#MORE_RESULTS_AFTER_CURSOR: There may be more results after the specified end cursor.
datastore#NO_MORE_RESULTS: There are no more results.*/
		moreResults: string;
	}


	/** functions that are shared between both the ITransaction and IDataset interfaces */
	export interface ICoreConnection {
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
		get<TEntityData>(key: IKey, callback: (err: any, entity: IDbEntity<TEntityData>, apiResponse?: ICallbackApiResponse) => void): void;
		get<TEntityData>(keys: IKey[], callback: (err: any, entities: IDbEntity<TEntityData>[], apiResponse?: ICallbackApiResponse) => void): void;
		get<TEntityData>(key: IKey, options: ICoreApiOptions, callback: (err: any, entity: IDbEntity<TEntityData>, apiResponse?: ICallbackApiResponse) => void): void;
		get<TEntityData>(keys: IKey[], options: ICoreApiOptions, callback: (err: any, entities: IDbEntity<TEntityData>[], apiResponse?: ICallbackApiResponse) => void): void;
		get<TEntityData>(key: IKey, options?: ICoreApiOptions): IStream<IDbEntity<TEntityData>>;




		/** Datastore allows you to query entities by kind, filter them by property filters, and sort them by a property name. Projection and pagination are also supported.

If you provide a callback, the query is run, and the results are returned as the second argument to your callback. A third argument may also exist, which is a query object that uses the end cursor from the previous query as the starting cursor for the next query. You can pass that object back to this method to see if more results exist.

You may also omit the callback to this function to trigger streaming mode.

		IMPORTANT!  RUNNING IN A TRANSACTION:   Queries inside transactions must include ancestor filters:  Datastore transactions operate only on entities belonging to the same entity group (descended from a common ancestor). To preserve this restriction, all queries performed within a transaction must include an ancestor filter specifying an ancestor in the same entity group as the other operations in the transaction. */
		runQuery<TEntityData>(q: IQuery, callback: (err: any, entities: IDbEntity<TEntityData>[], info: IRunQueryCallbackInfo, endCursor: string, moreResults: string, apiResponse: ICallbackApiResponse) => void): void;
		runQuery<TEntityData>(q: IQuery, options: ICoreApiOptions, callback: (err: any, entities: IDbEntity<TEntityData>[], info: IRunQueryCallbackInfo, endCursor: string, moreResults: string, apiResponse: ICallbackApiResponse) => void): void;
		/** probably works, but need to investigate if there is an analogue to the "info" callback parameter */
		runQuery<TEntityData>(q: IQuery, options?: ICoreApiOptions): IStream<IDbEntity<TEntityData>>;









	}


	export interface IDatastore_v040 extends ICoreConnection {
		/** v0.28  undocumented, ex: "https://www.googleapis.com"*/
		apiEndpoint: string;
		/** v0.28  undocumented, ex:  "phantomjscloud-stage3-test1"*/
		namespace: string;
		/* v0.28  undocumented, ex: "phantomjscloud-20160125" */
		projectId: string;

		/** Helper function to get a Datastore Double object.*/
		double(value: number): IDouble;

		/** Helper function to get a Datastore Geo Point object.*/
		geoPoint(coordinates: { latitude: number, longitude: number }): IGeoPoint


		/** Helper function to get a Datastore Int object.*/
		int(value: number): IInt;

		/** Helper to create a Key object, scoped to the dataset's namespace by default.

You may also specify a configuration object to define a namespace and path. */
		key(/**examples:   'Company'  OR  ['Company', 123] OR ['Company', 'Google'] */path?: string | (string | number)[]): IKey;
		key(options: {
			path?: string | (string | number)[];
			namespace?: string;
		}): IKey;


		////// entity write methods.  same as ITransaction methods, but WITH CALLBACK

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

		////deprecated v0.28
		///** Run a function in the context of a new transaction. Transactions allow you to perform multiple operations, committing your changes atomically. When you are finished making your changes within the transaction, run the done() function provided in the callback function to commit your changes. See an example below for more information. */
		//runInTransaction(
		//	/** The function to run in the context of a transaction. */
		//	fn: (
		//		/** The Transaction. */
		//		transaction: ITransaction,
		//		/** Function used to commit changes. */
		//		done: () => void
		//	) => void,
		//	callback: (err: any, apiResponse: ICallbackApiResponse) => void
		//);




	}

	export interface IDatasetSaveMethod {
		<TEntityData>(entity: IDbEntity<TEntityData> | IDbEntity<TEntityData>[], callback: (err: any, apiResponse: ICallbackApiResponse) => void): void;
	}
	export interface ITransactionSaveMethod {
		<TEntityData>(entity: IDbEntity<TEntityData> | IDbEntity<TEntityData>[]): void;
	}

	export interface IStream<TData> extends NodeJS.ReadableStream {
		on(event: "error", callback: (err: Error) => void): this;
		on(event: "data", callback: (data: TData) => void): this;
		on(event: "end", callback: () => void): this;
		on(event: string, callback: Function): this;
	}

	export interface IDouble { }
	export interface IInt { }
	export interface IGeoPoint { }

	export interface IKey {
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

	export interface IQuery {


		////////  v0.28 deprecated

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
		end(/** The ending cursor token. */custorToken: string): IQuery;



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
		filter(/** Property.  the field name*/ property: string,/** Operator (=, <, >, <=, >=) */ operator: string, /** 	Value to compare property to.*/value: any): IQuery;

		/** Group query results by a list of properties.
		Example

var groupedQuery = companyQuery.groupBy(['name', 'size']);*/
		groupBy(/** Properties to group by.*/
			properties: string[]): IQuery;
		/** Filter a query by ancestors.
		Example

var ancestoryQuery = query.hasAncestor(dataset.key(['Parent', 123]));*/
		hasAncestor(/** Key object to filter by.*/key: IKey): IQuery;
		/**Set a limit on a query.
		Example

// Limit the results to 10 entities.
var limitQuery = companyQuery.limit(10);*/
		limit(/** The number of results to limit the query to.*/
			n: number): IQuery;
		/** Set an offset on a query.
		Example

// Start from the 101st result.
var offsetQuery = companyQuery.offset(100);*/
		offset(/**The offset to start from after the start cursor.*/n: number): IQuery;
		/** Sort the results by a property name in ascending or descending order. By default, an ascending sort order will be used.
		Example

// Sort by size ascendingly.
var companiesAscending = companyQuery.order('size');

// Sort by size descendingly.
var companiesDescending = companyQuery.order('-size');*/
		order(/**Optional operator (+, -) and property to order by.*/property: string, options?: {/**Sort the results by a property name in descending order. Default: false. */descending: boolean }): IQuery;
		/**Retrieve only select properties from the matched entities.

Queries that select a subset of properties are called Projection Queries.
		Example

// Only retrieve the name property.
var selectQuery = companyQuery.select('name');

// Only retrieve the name and size properties.
var selectQuery = companyQuery.select(['name', 'size']);*/
		select(/**Properties to return from the matched entities.*/fieldNames: string | string[]): IQuery;
		/**Set a starting cursor to a query.
		Example

var cursorToken = 'X';

// Retrieve results starting from cursorToken.
var startQuery = companyQuery.start(cursorToken);*/
		start(/**The starting cursor token.*/cursorToken: string): IQuery;

	}


	/** Build a Transaction object. Transactions will be created for you by datastore/dataset. When you need to run a transactional operation, use datastore/dataset#runInTransaction. */
	export interface ITransaction extends ICoreConnection {


		////// entity write methods.  same as IDatastore methods, but NO CALLBACK

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
				/** An error returned while making this request. May be null */err: any,
				/** This transaction instance.*/
				transaction: ITransaction,
				/**The full API response.*/
				apiResponse: ICallbackApiResponse
			) => void): void;

	}
}



/**
 *  definitions for v0.27.0
  docs here: https://googlecloudplatform.github.io/gcloud-node/#/docs/v0.27.0/datastore/dataset
 */
export var gcloud: IModuleImport = require("google-cloud");

let logGCloud = new xlib.logging.Logger("GCLOUD", xlib.environment.LogLevel.DEBUG);


//export module ezSchema {


//	enum Constraints {
//		String,
//		Integer,
//		Number,
//		Date,
//		Boolean,
//		NotNull,
//		Indexed,
//	}

//	const testSchema = {
//		tableName: "testTable",
//		fields: {
//			__name:"key",
//			col1: 123,
//			col2: new Date(),
//			col3:123.456,
//		},
//		writeConstraints: {
//			col1: [Constraints.Number,Constraints.NotNull, Constraints.Indexed],
//			custom: (key: string, value: any, newValues: {}, oldValues: {}) => { },
//		},
//		readConversions: {

//		},
//	}

//}


export module datastore {



	export class _EzConnectionBase<TConnection extends ICoreConnection> {

		public isTransaction = false;
		constructor(public _connection: TConnection,
			/** for use when the dataset is explicitly  needed (constructing keys, etc) */
			public assistantDatastore: IDatastore_v040) {

			logGCloud.trace(`_EzConnectionBase.ctor start`);

			var typeName = xlib.reflection.getTypeName(_connection);
			switch (typeName) {
				//case "Dataset": //v 0.28
				case "Datastore": //v 0.40
					this.isTransaction = false;
					break;
				case "Transaction":
					this.isTransaction = true;
					break;
				default:
					throw new xlib.exception.Exception("_EzConnectionBase.ctor: unknown typeName " + typeName);
			}
		}

		/** Create a query from the current dataset to query the specified kind, scoped to the namespace provided at the initialization of the dataset. */
		public createQuery(namespace: string | undefined, kind: string) {
			return this._connection.createQuery(namespace, kind);
		}


		public allocateIds(/** The key object to complete. */ incompleteKey: IKey, n: number): Promise<{ keys: IKey[], apiResponse: any }> {
			logGCloud.trace(`_EzConnectionBase.allocateIds`, { arguments });
			return new Promise<{ keys: IKey[], apiResponse: any }>((resolve, reject) => {
				this._connection.allocateIds(incompleteKey, n, (err, keys, apiResponse) => {
					if (err != null) {
						err.apiResponse = apiResponse; return reject(err);
					}
					return resolve({ keys, apiResponse });
				})
			});
		}

		public delete(key: IKey | IKey[]): Promise<{ apiResponse: any }> {
			logGCloud.trace(`_EzConnectionBase.delete`, { arguments });
			return <any>new Promise((resolve, reject) => {
				this._connection.delete(key, (err, apiResponse) => {
					if (err != null) {
						err.apiResponse = apiResponse; return reject(err);
					}
					return resolve({ apiResponse });
				})
			});
		}
		public deleteEz(kind: string, idOrName: string | number, namespace?: string): Promise<{ apiResponse: any }> {
			let path: (string | number)[] = [kind];
			if (idOrName != null) {
				path.push(idOrName);
			}
			let keyObj = this.assistantDatastore.key({ path, namespace });

			return this.delete(keyObj);
		}


		public get<TEntityData>(key: IKey): Promise<{ entity: IDbEntity<TEntityData>, apiResponse: any }>;
		public get<TEntityData>(keys: IKey[]): Promise<{ entity: IDbEntity<TEntityData>[], apiResponse: any }>;
		get(keyOrKeys: any) {
			logGCloud.trace(`_EzConnectionBase.get`, { arguments });
			return <any>new Promise((resolve, reject) => {

				this._connection.get(keyOrKeys,
					//	{ consistency: "strong" },
					(err, entityOrEntities, apiResponse) => {
						if (err != null) {
							//err.code=503 err.message="Service Unavailable - Backend Error" //reason: missing projectId
							err.apiResponse = apiResponse; return reject(err);
						}
						return resolve({ entity: entityOrEntities, apiResponse });
					});
			});
		}

		public getEz<TEntityData>(kind: string, idOrName: string | number, namespace?: string): Promise<{ entity: IDbEntity<TEntityData>, apiResponse: any }> {
			let path: (string | number)[] = [kind];
			if (idOrName != null) {
				path.push(idOrName);
			}
			let keyObj = this.assistantDatastore.key({ path, namespace });

			var toReturn = this.get<TEntityData>(keyObj);
			return toReturn;
		}

		public insertEz<TEntityData>(kind: string, idOrName: string | number | undefined, data: TEntityData, namespace?: string): Promise<{ entity: IDbEntity<TEntityData>, apiResponse: any }> {
			let path: (string | number)[] = [kind];
			if (idOrName != null) {
				path.push(idOrName);
			}
			let keyObj = this.assistantDatastore.key({ path, namespace });

			let entity: IDbEntity<TEntityData> = {
				key: keyObj,
				data: data,
			};
			return this.insert(entity).then((apiResponse) => {
				return { entity, apiResponse };
			});
		}
		public updateEz<TEntityData>(kind: string, idOrName: string | number, data: TEntityData, namespace?: string): Promise<{ entity: IDbEntity<TEntityData>, apiResponse: any }> {
			let path: (string | number)[] = [kind];
			if (idOrName != null) {
				path.push(idOrName);
			}
			let keyObj = this.assistantDatastore.key({ path, namespace });

			let entity: IDbEntity<TEntityData> = {
				key: keyObj,
				data: data,
			};
			return this.update(entity).then((apiResponse) => {
				return { entity, apiResponse };
			});
		}
		public upsertEz<TEntityData>(kind: string, idOrName: string | number, data: TEntityData, namespace?: string): Promise<{ entity: IDbEntity<TEntityData>, apiResponse: any }> {
			let path: (string | number)[] = [kind];
			if (idOrName != null) {
				path.push(idOrName);
			}
			let keyObj = this.assistantDatastore.key({ path, namespace });

			let entity: IDbEntity<TEntityData> = {
				key: keyObj,
				data: data,
			};
			return this.upsert(entity).then((apiResponse) => {
				return { entity, apiResponse };
			});
		}



		public runQuery<TEntityData>(q: IQuery): Promise<{ entities: IDbEntity<TEntityData>[], nextQuery: IQuery, apiResponse: any }> {
			logGCloud.trace(`_EzConnectionBase.runQuery`, { arguments });
			return <any>new Promise((resolve, reject) => {

				this._connection.runQuery(q, (err, entities, nextQuery, apiResponse) => {
					if (err != null) {
						err.apiResponse = apiResponse; return reject(err);
					}
					return resolve({ entities, nextQuery, apiResponse });
				})
			});
		}


		public insert<TEntityData>(entity: IDbEntity<TEntityData> | IDbEntity<TEntityData>[]): Promise<{ apiResponse: any }> {
			logGCloud.trace(`_EzConnectionBase.insert`, { arguments });
			return new Promise<{ apiResponse: any }>((resolve, reject) => {
				if (this.isTransaction === true) {
					//transaction doesn't have callback... annoying!
					(this._connection as any).insert(entity, (err: Error, apiResponse: any) => { throw new xlib.exception.Exception("api changed?  transaction's are supposed to not have callbacks." + __.JSONX.inspectStringify({ err, apiResponse })) });
					return resolve();
				} else {
					(this._connection as any as IDatastore_v040).insert(entity, (err, apiResponse) => {
						if (err != null) {
							err.apiResponse = apiResponse; return reject(err);
						}
						return resolve({ apiResponse });
					});
				}
			});
		}

		public save<TEntityData>(entity: IDbEntity<TEntityData> | IDbEntity<TEntityData>[]): Promise<{ apiResponse: any }> {
			logGCloud.trace(`_EzConnectionBase.save`, { arguments });
			return new Promise<{ apiResponse: any }>((resolve, reject) => {
				if (this.isTransaction === true) {
					//transaction doesn't have callback... annoying!
					(this._connection as any).save(entity, (err: Error, apiResponse: any) => { throw new xlib.exception.Exception("api changed?  transaction's are supposed to not have callbacks." + __.JSONX.inspectStringify({ err, apiResponse })) });
					return resolve();
				} else {
					(this._connection as any as IDatastore_v040).save(entity, (err, apiResponse) => {
						if (err != null) {
							err.apiResponse = apiResponse; return reject(err);
						}
						return resolve({ apiResponse });
					});
				}
			});
		}
		public update<TEntityData>(entity: IDbEntity<TEntityData> | IDbEntity<TEntityData>[]): Promise<{ apiResponse: any }> {
			logGCloud.trace(`_EzConnectionBase.update`, { arguments });
			return new Promise<{ apiResponse: any }>((resolve, reject) => {
				if (this.isTransaction === true) {
					//transaction doesn't have callback... annoying!
					(this._connection as any).update(entity, (err: Error, apiResponse: any) => { throw new xlib.exception.Exception("api changed?  transaction's are supposed to not have callbacks." + __.JSONX.inspectStringify({ err, apiResponse })) });
					return resolve();
				} else {
					(this._connection as any as IDatastore_v040).update(entity, (err, apiResponse) => {
						if (err != null) {
							err.apiResponse = apiResponse; return reject(err);
						}
						return resolve({ apiResponse });
					});
				}
			});
		}
		public upsert<TEntityData>(entity: IDbEntity<TEntityData> | IDbEntity<TEntityData>[]): Promise<{ apiResponse: any }> {
			logGCloud.trace(`_EzConnectionBase.upsert`, { arguments });
			return new Promise<{ apiResponse: any }>((resolve, reject) => {
				if (this.isTransaction === true) {
					//transaction doesn't have callback... annoying!
					(this._connection as any).upsert(entity, (err: Error, apiResponse: any) => { throw new xlib.exception.Exception("api changed?  transaction's are supposed to not have callbacks." + __.JSONX.inspectStringify({ err, apiResponse })) });
					return resolve();
				} else {
					(this._connection as any as IDatastore_v040).upsert(entity, (err, apiResponse) => {
						if (err != null) {
							err.apiResponse = apiResponse; return reject(err);
						}
						return resolve({ apiResponse });
					});
				}
			});
		}

	}

	export interface IEzEntityResult<TEzEntity> { // extends EzEntity<any, any>
		ezEntity: TEzEntity;
		apiResponse: any;
	}
	/** an base class for helping to create an ORM*/
	export class EzEntity<TId extends string | (number), TData>{


		constructor(
			public _ezDatastore: EzDatastore,

			public options: {
				/** for multitenancy, can be undefined to use the default namespace */
				namespace?: string,
				kind: string,
				excludeFromIndexes?: TData
			},
			/** can be undefined if using a numeric ID, in that case the ID will be auto-assigned on the server.  this is updated whenever we read from the datastore server */
			public idOrName: TId,
			/** if passed, we will clone this and populate the .data value with it*/
			initialData?: TData
		) {

			if (options.namespace === null) {
				options.namespace = undefined;
			}
			
			log.errorAndThrowIfFalse(options.kind != null && options.kind != "", "kind is null");
			//log.assert( incompletePath.length % 2 === 1, "incomplete path should be an odd number of elements, otherwise it's not incomplete" );
			if (initialData != null) {
				this.data = _.clone(initialData);
			}
		}



		/** the latest version of the data we read from the datastore (may not be up to date, be aware!)
		OR the latest version we wrote (whichever is most recent)

		this is only populated once we do a read/write to the datastore.

		IMPORTANT!  To write, use the various write functions, do not modify this directly.
		*/
		public data: TData | null;

		/**
		DO NOT USE!   for reference and advanced use.

		 entity as returned by datastore or at least the local gcloud-datastore wrapper.

		this is only populated once we do a read/write to the datastore.
		*/
		public _rawEntity: IDbEntity<TData> | null;

		/**
		 *  helper to properly apply our index status to fields
		 * @param instrumentedData
		 */
		private _convertInstrumentedEntityDataToData(instrumentedData: IEntityInstrumentedData[]): TData {
			if (instrumentedData == null) {
				throw log.error("instrumentedData is null");
				//return null;
			}
			log.assert(_.isArray(instrumentedData));
			let toReturn: TData = {} as any;
			_.forEach(instrumentedData, (item) => {
				(toReturn as any)[item.name] = item.value;
			});
			return toReturn;
		}

		/**
		 * helper to properly apply our index status to fields
		 * @param data
		 */
		private _convertDataToInstrumentedEntityData(data: TData): IEntityInstrumentedData[] {

			let toReturn: IEntityInstrumentedData[] = [];
			let keys = Object.keys(data);
			_.forEach(keys, (key) => {
				toReturn.push({
					name: key,
					value: (data as any)[key],
					excludeFromIndexes: (this.options.excludeFromIndexes != null && (this.options.excludeFromIndexes as any)[key] === true) ? true : undefined,
				});
			});
			return toReturn;
		}


		/**
		 *  create a query for entities of this kind.  (not related to this key, just a shortcut to dataset.connection.createQuery)
		 */
		public _query_create() {

			//let namespace = this._ezDataset.connection.namespace;

			//let query = this._ezDataset.connection.createQuery( this.incompletePath[ 0 ] );
			let query = this._ezDatastore.createQuery(this.options.namespace, this.options.kind);

			//query.

			//var connection: _EzConnectionBase<any> = transaction == null ? this._ezDataset as any : transaction as any;

			return query;



		}

		/**
		 * using the id/name supplied in the constructor, will retrieve the associated entity from the datastore, reading the results into this instance.
		 * if the entity doesn't exist, the entity.data will be null.
		 * @param transaction if you want this work to be done inside a transaction, pass it here
		 */
		public _read_get(transaction?: EzTransaction): Promise<IEzEntityResult<this>> {

			var connection: _EzConnectionBase<any> = transaction == null ? this._ezDatastore as any : transaction as any;



			var resultPromise = connection.getEz<TData>(this.options.kind, this.idOrName, this.options.namespace)
				.then(({entity, apiResponse}) => {

					//log.debug("EzEntity.read_get", entity, this);
					this._processEntityFromServer(entity);

					//if (entity == null) {
					//    return Promise.reject(new Error(`_read_get() failed:  entity for path "${this.incompletePath.join()} + ${this.idOrName}" does not exist`));
					//}

					let result: IEzEntityResult<this> = { ezEntity: this, apiResponse }
					return Promise.resolve(result);
				});

			return resultPromise;
		}
		/**
		 * same as ._read_get() but will return a rejected Promise if the entity does not exists.   (._read_get() returns null data on not exists)
		 * @param transaction
		 */
		public _read_get_mustExist(transaction?: EzTransaction): Promise<IEzEntityResult<this>> {
			return this._read_get(transaction)
				.then((readResponse) => {
					if (readResponse.ezEntity.data == null) {
						return Promise.reject(new Error(`_read_get() failed:  entity for path "${this.options.kind} + ${this.idOrName}" in namespace "${this.options.namespace}" does not exist`));
					} else {
						return Promise.resolve(readResponse);
					}
				});
		}

		public _write_insert(data: TData, transaction?: EzTransaction) {
			var connection: _EzConnectionBase<any> = transaction == null ? this._ezDatastore as any : transaction as any;

			data = <any>this._convertDataToInstrumentedEntityData(data); //HACK convert but keep type flow

			log.assert(this._rawEntity == null, "already has an entity, why?");

			return connection.insertEz(this.options.kind, this.idOrName, data, this.options.namespace)
				.then(({entity, apiResponse}) => {

					//var oldData = _.clone(this.data);
					this._processEntityFromServer(entity);

					let result: IEzEntityResult<this> = { ezEntity: this, apiResponse }
					//log.debug("EzEntity.write_insert", result);


					return Promise.resolve(result);
				})
		}

		public _write_update(data: TData, transaction?: EzTransaction) {
			var connection: _EzConnectionBase<any> = transaction == null ? this._ezDatastore as any : transaction as any;

			data = <any>this._convertDataToInstrumentedEntityData(data); //HACK convert but keep type flow

			if (this.idOrName == null) {
				throw log.error("id is not set");
			}
			return connection.updateEz(this.options.kind, this.idOrName as (string | number), data, this.options.namespace)
				.then(({entity, apiResponse}) => {

					//var oldData = _.clone(this.data);
					this._processEntityFromServer(entity);

					let result: IEzEntityResult<this> = { ezEntity: this, apiResponse }
					//log.debug("EzEntity.write_update", result);


					return Promise.resolve(result);
				})
		}
		public _write_upsert(data: TData, transaction?: EzTransaction) {
			var connection: _EzConnectionBase<any> = transaction == null ? this._ezDatastore as any : transaction as any;

			data = <any>this._convertDataToInstrumentedEntityData(data); //HACK convert but keep type flow


			return connection.upsertEz(this.options.kind, this.idOrName, data, this.options.namespace)
				.then(({entity, apiResponse}) => {

					//var oldData = _.clone(this.data);
					this._processEntityFromServer(entity);

					let result: IEzEntityResult<this> = { ezEntity: this, apiResponse }
					//log.debug("EzEntity.write_upsert", result);


					return Promise.resolve(result);
				})
		}

		public _write_delete(transaction?: EzTransaction) {
			var connection: _EzConnectionBase<any> = transaction == null ? this._ezDatastore as any : transaction as any;

			if (this.idOrName == null) {
				throw log.error("can not delete.  id is not set");
			}

			return connection.deleteEz(this.options.kind, this.idOrName as (string | number), this.options.namespace)
				.then(({apiResponse}) => {

					//var oldData = _.clone(this.data);
					this._processEntityFromServer(null);

					let result: IEzEntityResult<this> = { ezEntity: this, apiResponse }
					//log.debug("EzEntity.write_delete", result);


					return Promise.resolve(result);
				})
		}

		//public write_upsert(d


		/**
		 * updates this ezEntity with values from a server, overwriting existing values in this object, but doesn't contact the datastore.
		 * @param entity
		 */
		public _processEntityFromServer(entity: IDbEntity<TData> | null) {

			if (entity == null || entity.data == null) {
				this.data = null;
			} else {
				//if we write, we write in instrumented mode, and so we need to convert this to a user-friendly format
				if (_.isArray(entity.data)) {
					this.data = this._convertInstrumentedEntityDataToData(entity.data as any);
				} else {
					this.data = entity.data as any;
				}
			}

			//update internal entity
			this._rawEntity = entity;


			if (this._rawEntity != null) {
				//update id
				if (this._rawEntity.key.id != null) {
					//log.assert(this._rawEntity.key.id === this.idOrName as any, "id not equal?  why?");
					this.idOrName = this._rawEntity.key.id as any;
				} else if (this._rawEntity.key.name != null) {
					//log.assert(this._rawEntity.key.name === this.idOrName as any, "id not equal?  why?");
					this.idOrName = this._rawEntity.key.name as any;
				}
			}
		}
	}

	export class EzDatastore extends _EzConnectionBase<IDatastore_v040> {

		constructor(dataset: IDatastore_v040) {
			super(dataset, dataset);
		}
		/**
		 * DEPRECATED: while functional, the workflow is wonky.   favor the promise based ".runInTransaction()" instead.
		 * @param fn
		 */
		public _runInTransaction_DEPRECATED<TResult>(
			/** be aware that inside transactions (using the transaction.write() functions), write operations resolve instantly as they are not actually applied until the done() callback method is called.*/
			fn: (transaction: EzTransaction, done: (result: TResult) => void) => void,
			/** auto-retry if the transaction fails. default = { interval: 0, max_tries:10 }  FYI in datastore v1Beta2 each try takes aprox 1 second*/
			retryOptions: xlib.promise._BluebirdRetryInternals.IOptions = { interval: 0, max_tries: 10 }): Promise<TResult> {

			return xlib.promise.retry(() => {
				return new Promise<TResult>((resolve, reject) => {
					let _result: TResult;

					////////////////////////////////
					// v0.40 implementation
					let baseTransaction = this._connection.transaction();
					baseTransaction.run((err, base_normalTransaction, apiResponse) => {
						let newEzTransaction = new EzTransaction(base_normalTransaction, this._connection);
						try {
							return fn(newEzTransaction, (result) => {
								_result = result;
								base_normalTransaction.commit((err, apiResponse) => {
									if (err != null) {
										return reject(new DatastoreException("Transaction.Commit() failed.  Probably RolledBack or conflicting change occurred asynchronously.  \tapiResponse=" + __.JSONX.inspectStringify(apiResponse), err));
									}
									return resolve(_result);
								});
							});
							//.catch((err) => {
							//	return newEzTransaction.rollback();
							//});
						} catch (ex) {
							log.debug("CATCH THROW IN .runInTransaction()", ex);
							return newEzTransaction.__rollbackHelper_INTERNAL();
						}
					});
					////////////////////////
					//// v0.28 implementation
					//this.connection.runInTransaction((base_normalTransaction, base_done) => {
					//	let newEzTransaction = new EzTransaction(base_normalTransaction, this.connection);
					//	try {
					//		return fn(newEzTransaction, (result) => {
					//			_result = result;
					//			base_done();
					//		});
					//		//.catch((err) => {
					//		//	return newEzTransaction.rollback();
					//		//});
					//	} catch (ex) {
					//		log.debug("CATCH THROW IN .runInTransaction()", ex);
					//		return newEzTransaction.__rollbackHelper_INTERNAL();
					//	}
					//},
					//	(err, apiResponse) => {
					//		if (err != null) {
					//			return reject(new DatastoreException("Transaction.Commit() failed.  Probably RolledBack or conflicting change occurred asynchronously.  \tapiResponse=" + __.JSONX.inspectStringify(apiResponse), err));
					//		}
					//		return resolve(_result);
					//	});
				});
			}, retryOptions);
		}
		/**
		 * promise based transaction. 
		 * @param userFunction
		 * @param retryOptions
		 */
		public runInTransaction<TResult>(
			/** return a promise that resolves to commit the transaction.   return a rejected to rollback.
			IMPORTANT NOTE: be aware that inside transactions (using the transaction.write() functions), write operations resolve instantly as they are not actually applied until the done() callback method is called.
			 */
			userFunction: (transaction: EzTransaction) => Promise<TResult>,
			/** auto-retry if the transaction fails. default = { interval: 0, max_tries:10 }  FYI in datastore v1Beta2 each try takes aprox 1 second*/
			retryOptions: xlib.promise._BluebirdRetryInternals.IOptions = { interval: 0, max_tries: 10 }): Promise<TResult> {

			return xlib.promise.retry(() => {

				//log.info("runInTransaction(), top retry block: ENTER");

				return new Promise<TResult>((resolve, reject) => {
					let _result: TResult;
					let _explicitUserRejectionError: any;

					//////////////////////
					//v0.40 implementation
					let baseTransaction = this._connection.transaction();
					baseTransaction.run((err, base_normalTransaction, apiResponse) => {

						let newEzTransaction = new EzTransaction(base_normalTransaction, this._connection);


						Promise.try(() => {
							return userFunction(newEzTransaction);
						})
							.then<any>((doneResult) => {
								_result = doneResult;


								//need to call base_done() otherwise the outer-callback will never complete.
								base_normalTransaction.commit((err, apiResponse) => {
									//transaction done callback
									//log.info("runInTransaction(), runInTransaction complete callback", { err });
									//this section is the gcloud transaction callback
									//if (_explicitUserRejectionError != null) {
									//	//log.info("user wants to rollback, don't retry our transaction (return a stop-error)");
									//	return reject(new xlib.promise.retry.StopError(_explicitUserRejectionError));
									//}
									if (err != null) {
										return reject(new DatastoreException("Transaction.Commit() failed.  Probably RolledBack or conflicting change occurred asynchronously.  \tapiResponse=" + __.JSONX.inspectStringify(apiResponse), err));
									}
									return resolve(_result);
								});

							}
							, (errUserFcnWantsToRollBack) => {
								//log.info("runInTransaction(), userFcn wants to roll back");
								_explicitUserRejectionError = errUserFcnWantsToRollBack;
								return xlib.promise.retry(() => {
									//log.info("runInTransaction(), in rollback retry block");
									return newEzTransaction.__rollbackHelper_INTERNAL();
								}, { max_tries: 3 })
									.then(() => {
										//log.info("runInTransaction(), finished rollback successfully");
										//return Promise.resolve();
										return reject(new xlib.promise.retry.StopError(_explicitUserRejectionError));
									}, (errRollbackTotalFailure) => {
										//log.error("total failure rolling back", userFunction, errUserFcnWantsToRollBack, errRollbackTotalFailure);
										//return Promise.resolve();
										return reject(new xlib.promise.retry.StopError(_explicitUserRejectionError));
									});
							});
					});




					///////////////
					////v0.28 implementation
					//this.connection.runInTransaction((base_normalTransaction, base_done) => {
					//	//this seciton is running in gcloud transaction.  which is NOT A PROMISE!!!

					//	let newEzTransaction = new EzTransaction(base_normalTransaction, this.connection);

					//	Promise.try(() => {
					//		return userFunction(newEzTransaction);
					//	})
					//		.then<any>((doneResult) => {
					//			_result = doneResult;
					//			return Promise.resolve();
					//		}
					//		, (errUserFcnWantsToRollBack) => {
					//			//log.info("runInTransaction(), userFcn wants to roll back");
					//			_explicitUserRejectionError = errUserFcnWantsToRollBack;
					//			return xlib.promise.retry(() => {
					//				//log.info("runInTransaction(), in rollback retry block");
					//				return newEzTransaction.__rollbackHelper_INTERNAL();
					//			}, { max_tries: 3 })
					//				.then(() => {
					//					//log.info("runInTransaction(), finished rollback successfully");
					//					return Promise.resolve();
					//				}, (errRollbackTotalFailure) => {
					//					//log.error("total failure rolling back", userFunction, errUserFcnWantsToRollBack, errRollbackTotalFailure);
					//					return Promise.resolve();
					//				});
					//		}).finally(() => {
					//			//need to always call base_done() otherwise the outer-callback will never complete.
					//			base_done();
					//		});

					//},
					//	(err, apiResponse) => {
					//		//log.info("runInTransaction(), runInTransaction complete callback", { err });
					//		//this section is the gcloud transaction callback
					//		if (_explicitUserRejectionError != null) {
					//			//log.info("user wants to rollback, don't retry our transaction (return a stop-error)");
					//			return reject(new xlib.promise.retry.StopError(_explicitUserRejectionError));
					//		}
					//		if (err != null) {
					//			return reject(new DatastoreException("Transaction.Commit() failed.  Probably RolledBack or conflicting change occurred asynchronously.  \tapiResponse=" + __.JSONX.inspectStringify(apiResponse), err));
					//		}
					//		return resolve(_result);
					//	});
				});
			}, retryOptions);
		}
	}
	/**
	 * created by invoking EzDataset.runInTransaction
	 * be aware that inside transactions, write operations resolve instantly as they are not actually applied until the done() callback method is called.
	 */
	export class EzTransaction extends _EzConnectionBase<ITransaction> {

		/**
	 *  return this as a rejection of the transaction to prevent retries.
	 * @param messageOrInnerError
	 */
		public newStopError(messageOrInnerError: string | Error): Error {
			return new xlib.promise.retry.StopError(messageOrInnerError) as any;
		}

		/**
		 * if you use the promise based tranasctions (which you should!) you should never manually need to call this.
		simply wraps the rollback() method in a promise, resolving when the rollback succeeds, rejects when rollback fails.
		 */
		public __rollbackHelper_INTERNAL(): Promise<{ apiResponse: any }> {
			return new Promise<{ apiResponse: any }>((resolve, reject) => {
				this._connection.rollback((err, apiResponse) => {
					if (err != null) {
						return reject(new DatastoreException("Transaction.Rollback() failed.  \tapiResponse=" + __.JSONX.inspectStringify(apiResponse), err));
					}
					return resolve({ apiResponse });
				})
			});
		}

	}


	export class DatastoreException extends xlib.exception.Exception {
		//public static CreateFromGCloudError(friendlyMessage:string, err: any) {
		//    return new DatastoreException(``);
		//}
	};



	/**
	 *  scratch for unifying database and ui  schemas
	 */
	export module dataSchema {

		/** for all supported db types, see: https://cloud.google.com/datastore/docs/concepts/entities#properties_and_value_types		
		*/
		export type DbType = "string" | "double" | "integer" | "boolean" | "date" | "blob" | "none";


		export interface IPropertySchema<TValue> {

			//value?: TValue; //move runtime values to a seperate "entity" type
			default?: TValue;
			/** if input (and store) of this field is optional.  if so, then will store NULL on the database for this property if it is not set. */
			isOptional?: boolean;
			/** if this field is hidden from user input (set on the server side).  note that if both .isOptional and .isHidden are true, it means the property is required to be set on the server before writing to the db. */
			isHidden?: boolean;
			/** how this should be stored in the database.   use "none" to not store the field in the db */
			dbType: DbType;
			/** by default all properties are indexed (add +1x the entity size for each indexed field!  expensive!)  so you can disable this for properties that you know are not going to be sorted by, if a large number of entities of that kind need to be stored. */
			isDbIndexExcluded?: boolean;

			/** can set an optional input format, used when using the react-jsonschema-form react plugin.   used as it's "type" field. */
			inputType?: string;
		}


		export interface IStringProperty extends IPropertySchema<string> {
			inputType?: "textarea" | "password" | "color" | "text";
			inputFormat?: "email" | "uri" | "data-url" | "date" | "date-time";
			dbType: "string" | "none";
			/** if true, keeps empty strings, otherwise converts to null */
			allowEmpty?: boolean;
		}
		export interface IDateProperty extends IPropertySchema<Date> {
			inputType?: "text";
			inputFormat: "date" | "date-time";
			dbType: "date" | "none";
		}

		export interface INumberProperty extends IPropertySchema<number> {
			dbType: "double" | "integer" | "none";
			inputType?: "updown" | "range" | "text";
			minimum?: number;
			maximum?: number;
			multipleOf?: number;
		}

		export interface IDoubleProperty extends INumberProperty {
			dbType: "double" | "none";
		}
		export interface IIntegerProperty extends INumberProperty {
			dbType: "integer" | "none";
		}

		export interface ISchema { //<TData, TEntity extends IEntity<TData>> {

			properties: {
				[propertyName: string]: IPropertySchema<any>;
			}

			db: {
				kind: string;
				/** default false.   if true, will not raise errors on invalid schema from the database reads/writes */
				suppressInvalidSchemaErrors?: boolean;
				/** default false.   if true, will raise an error if the namespace is not specified */
				isNamespaceRequired?: boolean;
			}

			//entityTemplate: TEntity

		}




		export interface IEntity<TData> {

			kind: string;
			namespace?: string;
			id?: number;

			/** data conforming to the schema.  includes code-runtime-specific props, and also props that are stored in the database (using custom "mixin" logic).
			thus even if the dbEntity doesn't exist, this will NOT be undefined.  (check ```this.dbResult.exists``` to determine existance) */
			schemaData: TData;

			dbResult?: {
				dbEntity?: IDbEntity<TData>
				///** raw data returned from the datastore.   if undefined after a get, the entity does not exist.  note that props of dbType==="none" will not be present here.*/
				//data: TData;
				///** for advance usage or diagnostics:  the datastore specific "key" */
				//key: IKey,
				/** for advanced usage or diagnostics: the last associated api response from the datastore api.   */
				lastApiResponse?: any;
				/** shortcut that informs if the entity was found in the database.   if no, all dbType fields (set in the schema) will be set to undefined */
				exists: boolean;
			}
		}

		export interface ICustomerData {
			name: string;
			address: string;
			city: string;
			state: string;
			zip: string;
			notes?: string;
		}


		export interface ICustomerEntity extends IEntity<ICustomerData> {

		}

		export const CustomerSchema: ISchema = {
			properties: {
				name: {
					dbType: "string",
				} as IStringProperty,

				address: {
					dbType: "string",
				} as IStringProperty,
				city: {
					dbType: "string",
				} as IStringProperty,
				state: {
					dbType: "string",
				} as IStringProperty,
				zip: {
					dbType: "string",
				} as IStringProperty,
				notes: {
					dbType: "string",
					isOptional: true,
					isDbIndexExcluded: true,
				} as IStringProperty,
				createDate: {
					dbType: "date",
					inputFormat: "date-time",
					isOptional: true,
					isHidden: true,
				} as IDateProperty,
				/** the date+time of the last ui input */
				lastUpdateDate: {
					dbType: "date",
					inputFormat: "date-time",
					isOptional: true,
					isHidden: true,
				} as IDateProperty,
			},
			db: {
				kind: "Customer",
			},
		};




		/**
		 * handle ORM calls based on a given Schema (ISchema) and entity (IEntity of type TData).
		 * todo: describe errors+error handling better: https://cloud.google.com/datastore/docs/concepts/errors
		 */
		export class EzOrm {

			constructor(public _ezDatastore: EzDatastore) { }



			/**
			 *  updates the entity with values from the db.   schema validation is also performed.
			 * @param schemaEntity
			 * @param dbResponse
			 */
			private _processDbResponse(schema: ISchema, dbResponse: { entity: IDbEntity<any>, apiResponse: any }, entity: IEntity<any>) {




				log.errorAndThrowIfFalse(entity.id != null && entity.id !== dbResponse.entity.key.id, "id already exists, why does it change?");
				log.errorAndThrowIfFalse(schema.db.kind == null || schema.db.kind !== dbResponse.entity.key.kind, "why is kind different?");

				//update our fixed values from the db
				entity.id = dbResponse.entity.key.id;
				entity.kind = dbResponse.entity.key.kind;
				entity.dbResult = {
					dbEntity: dbResponse.entity,
					lastApiResponse: dbResponse.apiResponse,
					exists: dbResponse.entity.data != null,
				};
				if (entity.schemaData == null) {
					entity.schemaData = {};
				}

				const dbData = dbResponse.entity.data;

				//loop through all schemaProps and if the prop is a dbType, mix it into our entity data
				__.forEach(schema.properties, (prop, key) => {
					if (prop.dbType === "none") {
						//not in the db, so don't update our entity's data value for this prop
						return;
					}



					const dbValue = dbData[key];



					if (dbValue == null) {
						//set our returning value to null
						entity.schemaData[key] = null;
						//prop missing in db (undefined) or null
						if (prop.isOptional !== true && schema.db.suppressInvalidSchemaErrors !== true) {
							throw log.error("missing prop in dbEntity", { prop, key, dbData });
						}
					} else {
						//prop found in db, mixin the value
						entity.schemaData[key] = dbValue;

						if (schema.db.suppressInvalidSchemaErrors !== true) {
							//compare dbType to what the schema says it should be
							const dbType = xlib.reflection.getType(dbValue);
							switch (schema.properties[key].dbType) {
								case "string":
									log.errorAndThrowIfFalse(dbType === xlib.reflection.Type.string);
									break;
								case "double":
									log.errorAndThrowIfFalse(dbType === xlib.reflection.Type.number);
									break;
								case "integer":
									log.errorAndThrowIfFalse(dbType === xlib.reflection.Type.number);
									break;
								case "boolean":
									log.errorAndThrowIfFalse(dbType === xlib.reflection.Type.boolean);
									break;
								case "blob":
									log.errorAndThrowIfFalse(dbType === xlib.reflection.Type.object);
									break;
								case "date":
									log.errorAndThrowIfFalse(dbType === xlib.reflection.Type.Date);
									break;
								case "none":
									throw log.error("dbtype set to none, should not exist in db");
								default:
									throw log.error("unknown dbtype, need to add handling of this in the ._processDbResponse() worker fcn", { key, prop });

							}
						}

					}

				});


			}

			/**
			 *  translate our data into an instrumeted "metadata" format used by google cloud datastore for writes
			 * @param schema
			 * @param entity
			 */
			private _convertDataToInstrumentedEntityData(schema: ISchema, entity: IEntity<any>): IEntityInstrumentedData[] {

				//loop through schema props, extracting out dbTyped props into an instrumented array
				const toReturn: IEntityInstrumentedData[] = [];

				__.forEach(schema.properties, (prop, key) => {

					//construct our data to insert for this prop, including metadata
					const instrumentedData: IEntityInstrumentedData = {
						name: key,
						value: entity.schemaData[key],
						excludeFromIndexes: prop.isDbIndexExcluded,
					};

					if (entity.schemaData[key] == null) {

						instrumentedData.value = null;

						if (prop.isOptional === true) {
							//ok
						} else if (schema.db.suppressInvalidSchemaErrors !== true) {
							//not optional!
							throw log.error("prop is not optional", { prop, entity, schema });
						}
					} else {
						//transform certain data types, and ensure that the schema is of the right type too

						const valueType = xlib.reflection.getType(entity.schemaData[key]);

						let expectedType: xlib.reflection.Type;

						switch (prop.dbType) {
							case "none":
								//not to be saved to db, abort the rest of this foreach "loop"
								return;
							case "string":
								expectedType = xlib.reflection.Type.string;
								break;
							case "double":
								//coherse to double
								instrumentedData.value = this._ezDatastore.assistantDatastore.double(entity.schemaData[key]);
								expectedType = xlib.reflection.Type.number;
								break;
							case "integer":
								//coherse to int
								instrumentedData.value = this._ezDatastore.assistantDatastore.int(entity.schemaData[key]);
								expectedType = xlib.reflection.Type.number;
								break;
							case "boolean":
								expectedType = xlib.reflection.Type.boolean;
								break;
							case "blob":
								instrumentedData.value = _.cloneDeep(entity.schemaData[key]);
								expectedType = xlib.reflection.Type.object;
								break;
							case "date":
								expectedType = xlib.reflection.Type.Date;
								break;
							default:
								throw log.error("unknown dbtype, need to add handling of this in the ._convertDataToInstrumentedEntityData() worker fcn", { key, prop });
						}

						log.errorAndThrowIfFalse(valueType === expectedType || schema.db.suppressInvalidSchemaErrors === true, "prop type being written does not match expected schema dbType", { key, prop, entity, schema });

					}
					//add the instrumented prop to our return values
					toReturn.push(instrumentedData);

				});

				return toReturn;

			}

			private _verifyEntityMatchesSchema(schema: ISchema, entity: IEntity<any>) {
				if (entity.namespace == null && schema.db.isNamespaceRequired === true) {
					throw log.error("entity must have namespace set to read from db", { schema, entity });
				}
				if (entity.kind !== schema.db.kind) {
					throw log.error("entity and schema kinds do not match", { schema, entity });
				}
			}
			/**
			 *  if entity doesn't exist in the db, all db properties will have their values set to ```undefined``` and ```schemaEntity.db.exists===false```
			 * @param schemaEntity
			 * @param transaction
			 */
			public readGet<TEntity extends IEntity<any>>(schema: ISchema, entity: TEntity, transaction?: EzTransaction): Promise<IEzOrmResult<TEntity>> {

				var connection: _EzConnectionBase<any> = transaction == null ? this._ezDatastore as any : transaction as any;

				this._verifyEntityMatchesSchema(schema, entity);

				if (entity.id == null) {
					throw log.error("entity must have id set to read from db", { schema, entity });
				}


				return connection.getEz<any>(schema.db.kind, entity.id, entity.namespace)
					.then((dbResponse) => {
						this._processDbResponse(schema, dbResponse, entity);
						let result: IEzOrmResult<TEntity> = { schema, entity };
						return Promise.resolve(result);
					});
			}

			public readGetMustExist<TEntity extends IEntity<any>>(schema: ISchema, entity: TEntity, transaction?: EzTransaction): Promise<IEzOrmResult<TEntity>> {
				return this.readGet(schema, entity, transaction)
					.then((readResponse) => {
						if (readResponse.entity.dbResult == null) {
							return Promise.reject(new Error("db result should not be null"));
						}
						if (readResponse.entity.dbResult.exists === false) {
							return Promise.reject(new Error(`.readGetMustExist() failed.  entity does not exist.  [ ${entity.namespace}, ${entity.kind}, ${entity.id} ]`));
						}
						return Promise.resolve(readResponse);
					});
			}

			public writeInsert<TEntity extends IEntity<any>>(schema: ISchema, entity: TEntity, transaction?: EzTransaction): Promise<IEzOrmResult<TEntity>> {
				var connection: _EzConnectionBase<any> = transaction == null ? this._ezDatastore as any : transaction as any;

				this._verifyEntityMatchesSchema(schema, entity);

				const dataToWrite = this._convertDataToInstrumentedEntityData(schema, entity);

				log.errorAndThrowIfFalse(entity.dbResult == null, "already has an entity read from the db, even though we are INSERTING!!!, why?", { entity, schema });

				return connection.insertEz(entity.kind, entity.id, dataToWrite, entity.namespace)
					.then((writeResponse) => {
						this._processDbResponse(schema, writeResponse, entity);
						return Promise.resolve({ schema, entity });
					});

			}

			public writeUpdate<TEntity extends IEntity<any>>(schema: ISchema, entity: TEntity, transaction?: EzTransaction): Promise<IEzOrmResult<TEntity>> {
				var connection: _EzConnectionBase<any> = transaction == null ? this._ezDatastore as any : transaction as any;

				this._verifyEntityMatchesSchema(schema, entity);

				const dataToWrite = this._convertDataToInstrumentedEntityData(schema, entity);

				if (entity.id == null) {
					throw log.error("writeUpdating but no id is specified", { entity, schema });
				}

				return connection.updateEz(entity.kind, entity.id, dataToWrite, entity.namespace)
					.then((writeResponse) => {
						this._processDbResponse(schema, writeResponse, entity);
						return Promise.resolve({ schema, entity });
					});

			}

			public writeUpsert<TEntity extends IEntity<any>>(schema: ISchema, entity: TEntity, transaction?: EzTransaction): Promise<IEzOrmResult<TEntity>> {
				var connection: _EzConnectionBase<any> = transaction == null ? this._ezDatastore as any : transaction as any;

				this._verifyEntityMatchesSchema(schema, entity);

				const dataToWrite = this._convertDataToInstrumentedEntityData(schema, entity);

				if (entity.id == null) {
					throw log.error("writeUpsert but no id is specified", { entity, schema });
				}

				return connection.upsertEz(entity.kind, entity.id, dataToWrite, entity.namespace)
					.then((writeResponse) => {
						this._processDbResponse(schema, writeResponse, entity);
						return Promise.resolve({ schema, entity });
					});

			}
			public writeDelete<TEntity extends IEntity<any>>(schema: ISchema, entity: TEntity, transaction?: EzTransaction): Promise<IEzOrmResult<TEntity>> {
				var connection: _EzConnectionBase<any> = transaction == null ? this._ezDatastore as any : transaction as any;

				this._verifyEntityMatchesSchema(schema, entity);

				if (entity.id == null) {
					throw log.error("writeDelete but no id is specified", { entity, schema });
				}

				return connection.deleteEz(entity.kind, entity.id, entity.namespace)
					.then((deleteResponse) => {

						entity.dbResult = {
							dbEntity: undefined,
							exists: false,
							lastApiResponse: deleteResponse.apiResponse,
						};

						return Promise.resolve({ schema, entity });
					});
			}




		}

		export interface IEzOrmResult<TEntity> {
			schema: ISchema;
			entity: TEntity;
		}

		//	export class EzSchemaEntity<TSchema extends IObjectSchema>{


		//		constructor(
		//			public _ezDatastore: EzDatastore,
		//			public schemaTemplate: TSchema,
		//			namespace: string,
		//			id?: number
		//		) {

		//			let excludeFromIndexes: { [propertyName: string]: boolean } = {};

		//			xlib.lolo.forEach(schemaTemplate.properties, (prop, name) => {
		//				excludeFromIndexes[name] = prop.isDbIndexExcluded === true;
		//			});


		//			this._ezEntity = new EzEntity<number, any>(
		//				_ezDatastore,
		//				{
		//					kind: schemaTemplate.db.kind,
		//					namespace: namespace,
		//					excludeFromIndexes: excludeFromIndexes,
		//				},
		//				id as number);

		//		}

		//		/** get a copy of the current data. (overwritten when you do a write, or a read from the db) */
		//		public getData(): TSchema {
		//			log.todo("not implemented");
		//			throw new Error("not implemented");
		//		}



		//		/**
		//		 *  create a query for entities of this kind.  (not related to this key, just a shortcut to dataset.connection.createQuery)
		//		 */
		//		public queryCreate() {
		//			return this._ezEntity._query_create();
		//		}

		//		public readGet(transaction?: _gcd.EzTransaction): Promise<



		//			/** internal helper for doing actual orm mapping of our schema */
		//			private _ezEntity: _gcd.EzEntity<number, any>;


		//}
	}


}