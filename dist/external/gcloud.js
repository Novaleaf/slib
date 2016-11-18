"use strict";
const xlib = require("xlib");
var _ = xlib.lodash;
var __ = xlib.lolo;
var log = new xlib.logging.Logger(__filename);
var Promise = xlib.promise.bluebird;
/**
 *  definitions for v0.27.0
  docs here: https://googlecloudplatform.github.io/gcloud-node/#/docs/v0.27.0/datastore/dataset
 */
exports.gcloud = require("google-cloud");
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
var datastore;
(function (datastore) {
    class _EzConnectionBase {
        constructor(_connection, 
            /** for use when the dataset is explicitly  needed (constructing keys, etc) */
            assistantDatastore) {
            this._connection = _connection;
            this.assistantDatastore = assistantDatastore;
            this.isTransaction = false;
            logGCloud.trace(`_EzConnectionBase.ctor start`);
            var typeName = xlib.reflection.getTypeName(_connection);
            switch (typeName) {
                //case "Dataset": //v 0.28
                case "Datastore":
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
        createQuery(namespace, kind) {
            return this._connection.createQuery(namespace, kind);
        }
        allocateIds(/** The key object to complete. */ incompleteKey, n) {
            logGCloud.trace(`_EzConnectionBase.allocateIds`, { arguments });
            return new Promise((resolve, reject) => {
                this._connection.allocateIds(incompleteKey, n, (err, keys, apiResponse) => {
                    if (err != null) {
                        err.apiResponse = apiResponse;
                        return reject(err);
                    }
                    return resolve({ keys, apiResponse });
                });
            });
        }
        delete(key) {
            logGCloud.trace(`_EzConnectionBase.delete`, { arguments });
            return new Promise((resolve, reject) => {
                this._connection.delete(key, (err, apiResponse) => {
                    if (err != null) {
                        err.apiResponse = apiResponse;
                        return reject(err);
                    }
                    return resolve({ apiResponse });
                });
            });
        }
        deleteEz(kind, idOrName, namespace) {
            let path = [kind];
            if (idOrName != null) {
                path.push(idOrName);
            }
            let keyObj = this.assistantDatastore.key({ path, namespace });
            return this.delete(keyObj);
        }
        get(keyOrKeys) {
            logGCloud.trace(`_EzConnectionBase.get`, { arguments });
            return new Promise((resolve, reject) => {
                if (_.isArray(keyOrKeys) === true) {
                    //handle case an array of keys is passed
                    const keys = keyOrKeys;
                    this._connection.get(keys, (err, datas, apiResponse) => {
                        if (err != null) {
                            //err.code=503 err.message="Service Unavailable - Backend Error" //reason: missing projectId
                            err.apiResponse = apiResponse;
                            return reject(err);
                        }
                        let entities = [];
                        __.forEach(keys, (key, index) => {
                            let entity = {
                                key,
                                data: datas[index],
                            };
                            entities.push(entity);
                        });
                        let toReturn = { readResult: entities, apiResponse };
                        return resolve(toReturn);
                    });
                }
                else {
                    //handle case a single key is passed
                    const key = keyOrKeys;
                    this._connection.get(key, (err, data, apiResponse) => {
                        if (err != null) {
                            //err.code=503 err.message="Service Unavailable - Backend Error" //reason: missing projectId
                            err.apiResponse = apiResponse;
                            return reject(err);
                        }
                        let entity = {
                            key,
                            data,
                        };
                        let toReturn = { readResult: entity, apiResponse };
                        return resolve(toReturn);
                    });
                }
            });
        }
        getEz(kind, idOrName, namespace) {
            let path = [kind];
            if (idOrName != null) {
                path.push(idOrName);
            }
            let keyObj = this.assistantDatastore.key({ path, namespace });
            return this.get(keyObj)
                .then((readResult) => {
                return Promise.resolve({ entity: readResult.readResult, apiResponse: readResult.apiResponse });
            });
        }
        insertEz(kind, idOrName, data, namespace) {
            let path = [kind];
            if (idOrName != null) {
                path.push(idOrName);
            }
            let keyObj = this.assistantDatastore.key({ path, namespace });
            let entity = {
                key: keyObj,
                data: data,
            };
            return this.insert(entity).then((apiResponse) => {
                return { entity, apiResponse };
            });
        }
        updateEz(kind, idOrName, data, namespace) {
            let path = [kind];
            if (idOrName != null) {
                path.push(idOrName);
            }
            let keyObj = this.assistantDatastore.key({ path, namespace });
            let entity = {
                key: keyObj,
                data: data,
            };
            return this.update(entity).then((apiResponse) => {
                return { entity, apiResponse };
            });
        }
        upsertEz(kind, idOrName, data, namespace) {
            let path = [kind];
            if (idOrName != null) {
                path.push(idOrName);
            }
            let keyObj = this.assistantDatastore.key({ path, namespace });
            let entity = {
                key: keyObj,
                data: data,
            };
            return this.upsert(entity).then((apiResponse) => {
                return { entity, apiResponse };
            });
        }
        runQuery(q) {
            logGCloud.trace(`_EzConnectionBase.runQuery`, { arguments });
            return new Promise((resolve, reject) => {
                this._connection.runQuery(q, (err, entities, nextQuery, apiResponse) => {
                    if (err != null) {
                        err.apiResponse = apiResponse;
                        return reject(err);
                    }
                    return resolve({ entities, nextQuery, apiResponse });
                });
            });
        }
        insert(entity) {
            logGCloud.trace(`_EzConnectionBase.insert`, { arguments });
            return new Promise((resolve, reject) => {
                if (this.isTransaction === true) {
                    //transaction doesn't have callback... annoying!
                    this._connection.insert(entity, (err, apiResponse) => { throw new xlib.exception.Exception("api changed?  transaction's are supposed to not have callbacks." + __.JSONX.inspectStringify({ err, apiResponse })); });
                    return resolve();
                }
                else {
                    this._connection.insert(entity, (err, apiResponse) => {
                        if (err != null) {
                            err.apiResponse = apiResponse;
                            return reject(err);
                        }
                        return resolve({ apiResponse });
                    });
                }
            });
        }
        save(entity) {
            logGCloud.trace(`_EzConnectionBase.save`, { arguments });
            return new Promise((resolve, reject) => {
                if (this.isTransaction === true) {
                    //transaction doesn't have callback... annoying!
                    this._connection.save(entity, (err, apiResponse) => { throw new xlib.exception.Exception("api changed?  transaction's are supposed to not have callbacks." + __.JSONX.inspectStringify({ err, apiResponse })); });
                    return resolve();
                }
                else {
                    this._connection.save(entity, (err, apiResponse) => {
                        if (err != null) {
                            err.apiResponse = apiResponse;
                            return reject(err);
                        }
                        return resolve({ apiResponse });
                    });
                }
            });
        }
        update(entity) {
            logGCloud.trace(`_EzConnectionBase.update`, { arguments });
            return new Promise((resolve, reject) => {
                if (this.isTransaction === true) {
                    //transaction doesn't have callback... annoying!
                    this._connection.update(entity, (err, apiResponse) => { throw new xlib.exception.Exception("api changed?  transaction's are supposed to not have callbacks." + __.JSONX.inspectStringify({ err, apiResponse })); });
                    return resolve();
                }
                else {
                    this._connection.update(entity, (err, apiResponse) => {
                        if (err != null) {
                            err.apiResponse = apiResponse;
                            return reject(err);
                        }
                        return resolve({ apiResponse });
                    });
                }
            });
        }
        upsert(entity) {
            logGCloud.trace(`_EzConnectionBase.upsert`, { arguments });
            return new Promise((resolve, reject) => {
                if (this.isTransaction === true) {
                    //transaction doesn't have callback... annoying!
                    this._connection.upsert(entity, (err, apiResponse) => { throw new xlib.exception.Exception("api changed?  transaction's are supposed to not have callbacks." + __.JSONX.inspectStringify({ err, apiResponse })); });
                    return resolve();
                }
                else {
                    this._connection.upsert(entity, (err, apiResponse) => {
                        if (err != null) {
                            err.apiResponse = apiResponse;
                            return reject(err);
                        }
                        return resolve({ apiResponse });
                    });
                }
            });
        }
    }
    datastore._EzConnectionBase = _EzConnectionBase;
    /** an base class for helping to create an ORM*/
    class EzEntity {
        constructor(_ezDatastore, options, 
            /** can be undefined if using a numeric ID, in that case the ID will be auto-assigned on the server.  this is updated whenever we read from the datastore server */
            idOrName, 
            /** if passed, we will clone this and populate the .data value with it*/
            initialData) {
            this._ezDatastore = _ezDatastore;
            this.options = options;
            this.idOrName = idOrName;
            if (options.namespace === null) {
                options.namespace = undefined;
            }
            log.errorAndThrowIfFalse(options.kind != null && options.kind != "", "kind is null");
            //log.assert( incompletePath.length % 2 === 1, "incomplete path should be an odd number of elements, otherwise it's not incomplete" );
            if (initialData != null) {
                this.data = _.clone(initialData);
            }
        }
        /**
         *  helper to properly apply our index status to fields
         * @param instrumentedData
         */
        _convertInstrumentedEntityDataToData(instrumentedData) {
            if (instrumentedData == null) {
                throw log.error("instrumentedData is null");
            }
            log.assert(_.isArray(instrumentedData));
            let toReturn = {};
            _.forEach(instrumentedData, (item) => {
                toReturn[item.name] = item.value;
            });
            return toReturn;
        }
        /**
         * helper to properly apply our index status to fields
         * @param data
         */
        _convertDataToInstrumentedEntityData(data) {
            let toReturn = [];
            let keys = Object.keys(data);
            _.forEach(keys, (key) => {
                toReturn.push({
                    name: key,
                    value: data[key],
                    excludeFromIndexes: (this.options.excludeFromIndexes != null && this.options.excludeFromIndexes[key] === true) ? true : undefined,
                });
            });
            return toReturn;
        }
        /**
         *  create a query for entities of this kind.  (not related to this key, just a shortcut to dataset.connection.createQuery)
         */
        _query_create() {
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
        _read_get(transaction) {
            var connection = transaction == null ? this._ezDatastore : transaction;
            var resultPromise = connection.getEz(this.options.kind, this.idOrName, this.options.namespace)
                .then(({ entity, apiResponse }) => {
                //log.debug("EzEntity.read_get", entity, this);
                this._processEntityFromServer(entity);
                //if (entity == null) {
                //    return Promise.reject(new Error(`_read_get() failed:  entity for path "${this.incompletePath.join()} + ${this.idOrName}" does not exist`));
                //}
                let result = { ezEntity: this, apiResponse };
                return Promise.resolve(result);
            });
            return resultPromise;
        }
        /**
         * same as ._read_get() but will return a rejected Promise if the entity does not exists.   (._read_get() returns null data on not exists)
         * @param transaction
         */
        _read_get_mustExist(transaction) {
            return this._read_get(transaction)
                .then((readResponse) => {
                if (readResponse.ezEntity.data == null) {
                    return Promise.reject(new Error(`_read_get() failed:  entity for path "${this.options.kind} + ${this.idOrName}" in namespace "${this.options.namespace}" does not exist`));
                }
                else {
                    return Promise.resolve(readResponse);
                }
            });
        }
        _write_insert(data, transaction) {
            var connection = transaction == null ? this._ezDatastore : transaction;
            data = this._convertDataToInstrumentedEntityData(data); //HACK convert but keep type flow
            log.assert(this._rawEntity == null, "already has an entity, why?");
            return connection.insertEz(this.options.kind, this.idOrName, data, this.options.namespace)
                .then(({ entity, apiResponse }) => {
                //var oldData = _.clone(this.data);
                this._processEntityFromServer(entity);
                let result = { ezEntity: this, apiResponse };
                //log.debug("EzEntity.write_insert", result);
                return Promise.resolve(result);
            });
        }
        _write_update(data, transaction) {
            var connection = transaction == null ? this._ezDatastore : transaction;
            data = this._convertDataToInstrumentedEntityData(data); //HACK convert but keep type flow
            if (this.idOrName == null) {
                throw log.error("id is not set");
            }
            return connection.updateEz(this.options.kind, this.idOrName, data, this.options.namespace)
                .then(({ entity, apiResponse }) => {
                //var oldData = _.clone(this.data);
                this._processEntityFromServer(entity);
                let result = { ezEntity: this, apiResponse };
                //log.debug("EzEntity.write_update", result);
                return Promise.resolve(result);
            });
        }
        _write_upsert(data, transaction) {
            var connection = transaction == null ? this._ezDatastore : transaction;
            data = this._convertDataToInstrumentedEntityData(data); //HACK convert but keep type flow
            return connection.upsertEz(this.options.kind, this.idOrName, data, this.options.namespace)
                .then(({ entity, apiResponse }) => {
                //var oldData = _.clone(this.data);
                this._processEntityFromServer(entity);
                let result = { ezEntity: this, apiResponse };
                //log.debug("EzEntity.write_upsert", result);
                return Promise.resolve(result);
            });
        }
        _write_delete(transaction) {
            var connection = transaction == null ? this._ezDatastore : transaction;
            if (this.idOrName == null) {
                throw log.error("can not delete.  id is not set");
            }
            return connection.deleteEz(this.options.kind, this.idOrName, this.options.namespace)
                .then(({ apiResponse }) => {
                //var oldData = _.clone(this.data);
                this._processEntityFromServer(null);
                let result = { ezEntity: this, apiResponse };
                //log.debug("EzEntity.write_delete", result);
                return Promise.resolve(result);
            });
        }
        //public write_upsert(d
        /**
         * updates this ezEntity with values from a server, overwriting existing values in this object, but doesn't contact the datastore.
         * @param entity
         */
        _processEntityFromServer(entity) {
            if (entity == null || entity.data == null) {
                this.data = null;
            }
            else {
                //if we write, we write in instrumented mode, and so we need to convert this to a user-friendly format
                if (_.isArray(entity.data)) {
                    this.data = this._convertInstrumentedEntityDataToData(entity.data);
                }
                else {
                    this.data = entity.data;
                }
            }
            //update internal entity
            this._rawEntity = entity;
            if (this._rawEntity != null) {
                //update id
                if (this._rawEntity.key.id != null) {
                    //log.assert(this._rawEntity.key.id === this.idOrName as any, "id not equal?  why?");
                    this.idOrName = this._rawEntity.key.id;
                }
                else if (this._rawEntity.key.name != null) {
                    //log.assert(this._rawEntity.key.name === this.idOrName as any, "id not equal?  why?");
                    this.idOrName = this._rawEntity.key.name;
                }
            }
        }
    }
    datastore.EzEntity = EzEntity;
    class EzDatastore extends _EzConnectionBase {
        constructor(dataset) {
            super(dataset, dataset);
        }
        /**
         * DEPRECATED: while functional, the workflow is wonky.   favor the promise based ".runInTransaction()" instead.
         * @param fn
         */
        _runInTransaction_DEPRECATED(
            /** be aware that inside transactions (using the transaction.write() functions), write operations resolve instantly as they are not actually applied until the done() callback method is called.*/
            fn, 
            /** auto-retry if the transaction fails. default = { interval: 0, max_tries:10 }  FYI in datastore v1Beta2 each try takes aprox 1 second*/
            retryOptions = { interval: 0, max_tries: 10 }) {
            return xlib.promise.retry(() => {
                return new Promise((resolve, reject) => {
                    let _result;
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
                        }
                        catch (ex) {
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
        runInTransaction(
            /** return a promise that resolves to commit the transaction.   return a rejected to rollback.
            IMPORTANT NOTE: be aware that inside transactions (using the transaction.write() functions), write operations resolve instantly as they are not actually applied until the done() callback method is called.
             */
            userFunction, 
            /** auto-retry if the transaction fails. default = { interval: 0, max_tries:10 }  FYI in datastore v1Beta2 each try takes aprox 1 second*/
            retryOptions = { interval: 0, max_tries: 10 }) {
            return xlib.promise.retry(() => {
                //log.info("runInTransaction(), top retry block: ENTER");
                return new Promise((resolve, reject) => {
                    let _result;
                    let _explicitUserRejectionError;
                    //////////////////////
                    //v0.40 implementation
                    let baseTransaction = this._connection.transaction();
                    baseTransaction.run((err, base_normalTransaction, apiResponse) => {
                        let newEzTransaction = new EzTransaction(base_normalTransaction, this._connection);
                        Promise.try(() => {
                            return userFunction(newEzTransaction);
                        })
                            .then((doneResult) => {
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
                        }, (errUserFcnWantsToRollBack) => {
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
    datastore.EzDatastore = EzDatastore;
    /**
     * created by invoking EzDataset.runInTransaction
     * be aware that inside transactions, write operations resolve instantly as they are not actually applied until the done() callback method is called.
     */
    class EzTransaction extends _EzConnectionBase {
        /**
     *  return this as a rejection of the transaction to prevent retries.
     * @param messageOrInnerError
     */
        newStopError(messageOrInnerError) {
            return new xlib.promise.retry.StopError(messageOrInnerError);
        }
        /**
         * if you use the promise based tranasctions (which you should!) you should never manually need to call this.
        simply wraps the rollback() method in a promise, resolving when the rollback succeeds, rejects when rollback fails.
         */
        __rollbackHelper_INTERNAL() {
            return new Promise((resolve, reject) => {
                this._connection.rollback((err, apiResponse) => {
                    if (err != null) {
                        return reject(new DatastoreException("Transaction.Rollback() failed.  \tapiResponse=" + __.JSONX.inspectStringify(apiResponse), err));
                    }
                    return resolve({ apiResponse });
                });
            });
        }
    }
    datastore.EzTransaction = EzTransaction;
    class DatastoreException extends xlib.exception.Exception {
    }
    datastore.DatastoreException = DatastoreException;
    ;
    /**
     *  orm helper for use with the xlib.designPatterns.dataSchema pattern.
     */
    var dataSchema;
    (function (dataSchema) {
        /**
         * handle ORM calls based on a given Schema (ISchema) and entity (IEntity of type TData).
         * todo: describe errors+error handling better: https://cloud.google.com/datastore/docs/concepts/errors
         */
        class EzOrm {
            constructor(_ezDatastore) {
                this._ezDatastore = _ezDatastore;
            }
            /**
             *  helper to construct a new entity of the type requested
             * @param schema
             * @param namespace
             */
            ezConstructEntity(schema, namespace, id) {
                //convert a data object of the proper type
                let schemaData = {};
                __.forEach(schema.properties, (prop, key) => {
                    schemaData[key] = prop.default;
                });
                //construct the entity to return
                let toReturn = {
                    dbResult: undefined,
                    id: id,
                    kind: schema.db.kind,
                    namespace: namespace,
                    data: schemaData,
                };
                return toReturn;
            }
            _processDbResponse_KeyHelper(schema, dbResponse, entity) {
                log.errorAndThrowIfFalse(entity != null && dbResponse.entity != null && dbResponse.entity.key != null, "required obj is missing.  (entity or dbResponse.entity.key)", { entity, dbResponse });
                log.errorAndThrowIfFalse(entity.id == null || entity.id === dbResponse.entity.key.id, "id already exists, why does it change?", { entity, dbResponse });
                log.errorAndThrowIfFalse(schema.db.kind === dbResponse.entity.key.kind, "why is kind different?", { schema, dbResponse });
                //update our fixed values from the db
                entity.id = dbResponse.entity.key.id;
                entity.kind = dbResponse.entity.key.kind;
                entity.dbResult = {
                    dbEntity: dbResponse.entity,
                    lastApiResponse: dbResponse.apiResponse,
                    exists: dbResponse.entity.data != null,
                };
            }
            /**
             * updates the entity with only the key data from the db.  schema validation is also performed.
             * when writing the db values are not read back.  these are in IEntityInstrumentedData[] format as they are just echos of the input values
             * @param schema
             * @param dbResponse
             * @param entity
             */
            _processDbResponse_Write(schema, dbResponse, entity) {
                this._processDbResponse_KeyHelper(schema, dbResponse, entity);
            }
            /**
             *  updates the entity with values from the db.   schema validation is also performed.
             * if entity does not exist, does not delete props
             * @param schemaEntity
             * @param dbResponse
             */
            _processDbResponse_Read(schema, dbResponse, entity) {
                this._processDbResponse_KeyHelper(schema, dbResponse, entity);
                if (entity.data == null) {
                    entity.data = {};
                }
                const dbData = dbResponse.entity.data;
                if (dbData != null) {
                    //exists
                    //loop through all schemaProps and if the prop is a dbType, mix it into our entity data
                    __.forEach(schema.properties, (prop, key) => {
                        if (prop.dbType === "none") {
                            //not in the db, so don't update our entity's data value for this prop
                            return;
                        }
                        const dbValue = dbData[key];
                        if (dbValue == null) {
                            //set our returning value to null
                            entity.data[key] = null;
                            //prop missing in db (undefined) or null
                            if (prop.isOptional !== true && schema.db.suppressInvalidSchemaErrors !== true) {
                                throw log.error("missing prop in dbEntity", { key, schema, entity, dbResponse, isSameRef: entity.data === dbResponse.entity.data });
                            }
                        }
                        else {
                            //prop found in db, mixin the value
                            entity.data[key] = dbValue;
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
                else {
                }
            }
            /**
             *  translate our data into an instrumeted "metadata" format used by google cloud datastore for writes
             * @param schema
             * @param entity
             */
            _convertDataToInstrumentedEntityData(schema, entity) {
                //loop through schema props, extracting out dbTyped props into an instrumented array
                const toReturn = [];
                __.forEach(schema.properties, (prop, key) => {
                    //construct our data to insert for this prop, including metadata
                    const instrumentedData = {
                        name: key,
                        value: entity.data[key],
                        excludeFromIndexes: prop.isDbIndexExcluded,
                    };
                    if (entity.data[key] == null) {
                        instrumentedData.value = null;
                        if (prop.isOptional === true) {
                        }
                        else if (schema.db.suppressInvalidSchemaErrors !== true) {
                            //not optional!
                            throw log.error("prop is not optional", { prop, entity, schema });
                        }
                    }
                    else {
                        //transform certain data types, and ensure that the schema is of the right type too
                        const valueType = xlib.reflection.getType(entity.data[key]);
                        let expectedType;
                        switch (prop.dbType) {
                            case "none":
                                //not to be saved to db, abort the rest of this foreach "loop"
                                return;
                            case "string":
                                expectedType = xlib.reflection.Type.string;
                                break;
                            case "double":
                                //coherse to double
                                instrumentedData.value = this._ezDatastore.assistantDatastore.double(entity.data[key]);
                                expectedType = xlib.reflection.Type.number;
                                break;
                            case "integer":
                                //coherse to int
                                instrumentedData.value = this._ezDatastore.assistantDatastore.int(entity.data[key]);
                                expectedType = xlib.reflection.Type.number;
                                break;
                            case "boolean":
                                expectedType = xlib.reflection.Type.boolean;
                                break;
                            case "blob":
                                instrumentedData.value = _.cloneDeep(entity.data[key]);
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
            _verifyEntityMatchesSchema(schema, entity) {
                if (entity.namespace == null && schema.db.isNamespaceRequired === true) {
                    throw log.error("entity must have namespace set to read/write from db", { schema, entity });
                }
                if (entity.kind !== schema.db.kind) {
                    throw log.error("entity and schema kinds do not match", { schema, entity });
                }
            }
            /**
             *  if entity doesn't exist in the db, all db properties will not be set (so, keeping their previous values, which are mose likely ```undefined```) and also we set ```schemaEntity.db.exists===false```
             * @param schemaEntity
             * @param transaction
             */
            readGet(schema, entity, transaction) {
                var connection = transaction == null ? this._ezDatastore : transaction;
                this._verifyEntityMatchesSchema(schema, entity);
                if (entity.id == null) {
                    throw log.error("entity must have id set to read from db", { schema, entity });
                }
                return connection.getEz(schema.db.kind, entity.id, entity.namespace)
                    .then((dbResponse) => {
                    this._processDbResponse_Read(schema, dbResponse, entity);
                    let result = { schema, entity };
                    return Promise.resolve(result);
                });
            }
            readGetMustExist(schema, entity, transaction) {
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
            writeInsert(schema, entity, transaction) {
                var connection = transaction == null ? this._ezDatastore : transaction;
                this._verifyEntityMatchesSchema(schema, entity);
                const dataToWrite = this._convertDataToInstrumentedEntityData(schema, entity);
                log.errorAndThrowIfFalse(entity.dbResult == null, "already has an entity read from the db, even though we are INSERTING!!!, why?", { entity, schema });
                return connection.insertEz(entity.kind, entity.id, dataToWrite, entity.namespace)
                    .then((writeResponse) => {
                    //delete the response dbEntity.data as it's just the input IEntityInstrumentedData[] array (don't confuse the caller dev)
                    writeResponse.entity.data = undefined;
                    this._processDbResponse_Write(schema, writeResponse, entity);
                    return Promise.resolve({ schema, entity });
                });
            }
            writeUpdate(schema, entity, transaction) {
                var connection = transaction == null ? this._ezDatastore : transaction;
                this._verifyEntityMatchesSchema(schema, entity);
                const dataToWrite = this._convertDataToInstrumentedEntityData(schema, entity);
                if (entity.id == null) {
                    throw log.error("writeUpdating but no id is specified", { entity, schema });
                }
                return connection.updateEz(entity.kind, entity.id, dataToWrite, entity.namespace)
                    .then((writeResponse) => {
                    //delete the response dbEntity.data as it's just the input IEntityInstrumentedData[] array (don't confuse the caller dev)
                    writeResponse.entity.data = undefined;
                    this._processDbResponse_Write(schema, writeResponse, entity);
                    return Promise.resolve({ schema, entity });
                });
            }
            writeUpsert(schema, entity, transaction) {
                var connection = transaction == null ? this._ezDatastore : transaction;
                this._verifyEntityMatchesSchema(schema, entity);
                const dataToWrite = this._convertDataToInstrumentedEntityData(schema, entity);
                if (entity.id == null) {
                    throw log.error("writeUpsert but no id is specified", { entity, schema });
                }
                return connection.upsertEz(entity.kind, entity.id, dataToWrite, entity.namespace)
                    .then((writeResponse) => {
                    //delete the response dbEntity.data as it's just the input IEntityInstrumentedData[] array (don't confuse the caller dev)
                    writeResponse.entity.data = undefined;
                    this._processDbResponse_Write(schema, writeResponse, entity);
                    return Promise.resolve({ schema, entity });
                });
            }
            /**
             *  a successfull delete will set entity.dbResult.exists=false.  but will not delete the entity.id value.
             * @param schema
             * @param entity
             * @param transaction
             */
            writeDelete(schema, entity, transaction) {
                var connection = transaction == null ? this._ezDatastore : transaction;
                this._verifyEntityMatchesSchema(schema, entity);
                if (entity.id == null) {
                    throw log.error("writeDelete but no id is specified", { entity, schema });
                }
                return connection.deleteEz(entity.kind, entity.id, entity.namespace)
                    .then((deleteResponse) => {
                    //if (entity.id == null) {
                    //	throw log.error("why key.id deletion magic?", { entity, schema, deleteResponse });
                    //}
                    //entity.id = undefined;
                    entity.dbResult = {
                        dbEntity: undefined,
                        exists: false,
                        lastApiResponse: deleteResponse.apiResponse,
                    };
                    return Promise.resolve({ schema, entity });
                });
            }
        }
        dataSchema.EzOrm = EzOrm;
    })(dataSchema = datastore.dataSchema || (datastore.dataSchema = {}));
})(datastore = exports.datastore || (exports.datastore = {}));
//# sourceMappingURL=gcloud.js.map