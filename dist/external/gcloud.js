"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var xlib = require("xlib");
var _ = xlib.lodash;
var __ = xlib.lolo;
var log = new xlib.logging.Logger(__filename);
var Promise = xlib.promise.bluebird;
/**
 *  definitions for v0.27.0
  docs here: https://googlecloudplatform.github.io/gcloud-node/#/docs/v0.27.0/datastore/dataset
 */
exports.gcloud = require("google-cloud");
var logGCloud = new xlib.logging.Logger("GCLOUD", xlib.environment.LogLevel.DEBUG);
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
    var _EzConnectionBase = (function () {
        function _EzConnectionBase(_connection, 
            /** for use when the dataset is explicitly  needed (constructing keys, etc) */
            assistantDatastore) {
            this._connection = _connection;
            this.assistantDatastore = assistantDatastore;
            this.isTransaction = false;
            logGCloud.trace("_EzConnectionBase.ctor start");
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
        _EzConnectionBase.prototype.createQuery = function (namespace, kind) {
            return this._connection.createQuery(namespace, kind);
        };
        _EzConnectionBase.prototype.allocateIds = function (/** The key object to complete. */ incompleteKey, n) {
            var _this = this;
            logGCloud.trace("_EzConnectionBase.allocateIds", { arguments: arguments });
            return new Promise(function (resolve, reject) {
                _this._connection.allocateIds(incompleteKey, n, function (err, keys, apiResponse) {
                    if (err != null) {
                        err.apiResponse = apiResponse;
                        return reject(err);
                    }
                    return resolve({ keys: keys, apiResponse: apiResponse });
                });
            });
        };
        _EzConnectionBase.prototype.delete = function (key) {
            var _this = this;
            logGCloud.trace("_EzConnectionBase.delete", { arguments: arguments });
            return new Promise(function (resolve, reject) {
                _this._connection.delete(key, function (err, apiResponse) {
                    if (err != null) {
                        err.apiResponse = apiResponse;
                        return reject(err);
                    }
                    return resolve({ apiResponse: apiResponse });
                });
            });
        };
        _EzConnectionBase.prototype.deleteEz = function (kind, idOrName, namespace) {
            var path = [kind];
            if (idOrName != null) {
                path.push(idOrName);
            }
            var keyObj = this.assistantDatastore.key({ path: path, namespace: namespace });
            return this.delete(keyObj);
        };
        _EzConnectionBase.prototype.get = function (keyOrKeys) {
            var _this = this;
            logGCloud.trace("_EzConnectionBase.get", { arguments: arguments });
            return new Promise(function (resolve, reject) {
                if (_.isArray(keyOrKeys) === true) {
                    //handle case an array of keys is passed
                    var keys_1 = keyOrKeys;
                    _this._connection.get(keys_1, function (err, datas, apiResponse) {
                        if (err != null) {
                            //err.code=503 err.message="Service Unavailable - Backend Error" //reason: missing projectId
                            err.apiResponse = apiResponse;
                            return reject(err);
                        }
                        var entities = [];
                        __.forEach(keys_1, function (key, index) {
                            var entity = {
                                key: key,
                                data: datas[index],
                            };
                            entities.push(entity);
                        });
                        var toReturn = { readResult: entities, apiResponse: apiResponse };
                        return resolve(toReturn);
                    });
                }
                else {
                    //handle case a single key is passed
                    var key_1 = keyOrKeys;
                    _this._connection.get(key_1, function (err, data, apiResponse) {
                        if (err != null) {
                            //err.code=503 err.message="Service Unavailable - Backend Error" //reason: missing projectId
                            err.apiResponse = apiResponse;
                            return reject(err);
                        }
                        var entity = {
                            key: key_1,
                            data: data,
                        };
                        var toReturn = { readResult: entity, apiResponse: apiResponse };
                        return resolve(toReturn);
                    });
                }
            });
        };
        _EzConnectionBase.prototype.getEz = function (kind, idOrName, namespace) {
            var path = [kind];
            if (idOrName != null) {
                path.push(idOrName);
            }
            var keyObj = this.assistantDatastore.key({ path: path, namespace: namespace });
            return this.get(keyObj)
                .then(function (readResult) {
                return Promise.resolve({ entity: readResult.readResult, apiResponse: readResult.apiResponse });
            });
        };
        _EzConnectionBase.prototype.insertEz = function (kind, idOrName, data, namespace) {
            var path = [kind];
            if (idOrName != null) {
                path.push(idOrName);
            }
            var keyObj = this.assistantDatastore.key({ path: path, namespace: namespace });
            var entity = {
                key: keyObj,
                data: data,
            };
            return this.insert(entity).then(function (apiResponse) {
                return { entity: entity, apiResponse: apiResponse };
            });
        };
        _EzConnectionBase.prototype.updateEz = function (kind, idOrName, data, namespace) {
            var path = [kind];
            if (idOrName != null) {
                path.push(idOrName);
            }
            var keyObj = this.assistantDatastore.key({ path: path, namespace: namespace });
            var entity = {
                key: keyObj,
                data: data,
            };
            return this.update(entity).then(function (apiResponse) {
                return { entity: entity, apiResponse: apiResponse };
            });
        };
        _EzConnectionBase.prototype.upsertEz = function (kind, idOrName, data, namespace) {
            var path = [kind];
            if (idOrName != null) {
                path.push(idOrName);
            }
            var keyObj = this.assistantDatastore.key({ path: path, namespace: namespace });
            var entity = {
                key: keyObj,
                data: data,
            };
            return this.upsert(entity).then(function (apiResponse) {
                return { entity: entity, apiResponse: apiResponse };
            });
        };
        _EzConnectionBase.prototype.runQuery = function (q) {
            var _this = this;
            logGCloud.trace("_EzConnectionBase.runQuery", { arguments: arguments });
            return new Promise(function (resolve, reject) {
                _this._connection.runQuery(q, function (err, entities, nextQuery, apiResponse) {
                    if (err != null) {
                        err.apiResponse = apiResponse;
                        return reject(err);
                    }
                    return resolve({ entities: entities, nextQuery: nextQuery, apiResponse: apiResponse });
                });
            });
        };
        _EzConnectionBase.prototype.insert = function (entity) {
            var _this = this;
            logGCloud.trace("_EzConnectionBase.insert", { arguments: arguments });
            return new Promise(function (resolve, reject) {
                if (_this.isTransaction === true) {
                    //transaction doesn't have callback... annoying!
                    _this._connection.insert(entity, function (err, apiResponse) { throw new xlib.exception.Exception("api changed?  transaction's are supposed to not have callbacks." + __.JSONX.inspectStringify({ err: err, apiResponse: apiResponse })); });
                    return resolve();
                }
                else {
                    _this._connection.insert(entity, function (err, apiResponse) {
                        if (err != null) {
                            err.apiResponse = apiResponse;
                            return reject(err);
                        }
                        return resolve({ apiResponse: apiResponse });
                    });
                }
            });
        };
        _EzConnectionBase.prototype.save = function (entity) {
            var _this = this;
            logGCloud.trace("_EzConnectionBase.save", { arguments: arguments });
            return new Promise(function (resolve, reject) {
                if (_this.isTransaction === true) {
                    //transaction doesn't have callback... annoying!
                    _this._connection.save(entity, function (err, apiResponse) { throw new xlib.exception.Exception("api changed?  transaction's are supposed to not have callbacks." + __.JSONX.inspectStringify({ err: err, apiResponse: apiResponse })); });
                    return resolve();
                }
                else {
                    _this._connection.save(entity, function (err, apiResponse) {
                        if (err != null) {
                            err.apiResponse = apiResponse;
                            return reject(err);
                        }
                        return resolve({ apiResponse: apiResponse });
                    });
                }
            });
        };
        _EzConnectionBase.prototype.update = function (entity) {
            var _this = this;
            logGCloud.trace("_EzConnectionBase.update", { arguments: arguments });
            return new Promise(function (resolve, reject) {
                if (_this.isTransaction === true) {
                    //transaction doesn't have callback... annoying!
                    _this._connection.update(entity, function (err, apiResponse) { throw new xlib.exception.Exception("api changed?  transaction's are supposed to not have callbacks." + __.JSONX.inspectStringify({ err: err, apiResponse: apiResponse })); });
                    return resolve();
                }
                else {
                    _this._connection.update(entity, function (err, apiResponse) {
                        if (err != null) {
                            err.apiResponse = apiResponse;
                            return reject(err);
                        }
                        return resolve({ apiResponse: apiResponse });
                    });
                }
            });
        };
        _EzConnectionBase.prototype.upsert = function (entity) {
            var _this = this;
            logGCloud.trace("_EzConnectionBase.upsert", { arguments: arguments });
            return new Promise(function (resolve, reject) {
                if (_this.isTransaction === true) {
                    //transaction doesn't have callback... annoying!
                    _this._connection.upsert(entity, function (err, apiResponse) { throw new xlib.exception.Exception("api changed?  transaction's are supposed to not have callbacks." + __.JSONX.inspectStringify({ err: err, apiResponse: apiResponse })); });
                    return resolve();
                }
                else {
                    _this._connection.upsert(entity, function (err, apiResponse) {
                        if (err != null) {
                            err.apiResponse = apiResponse;
                            return reject(err);
                        }
                        return resolve({ apiResponse: apiResponse });
                    });
                }
            });
        };
        return _EzConnectionBase;
    }());
    datastore._EzConnectionBase = _EzConnectionBase;
    /** DEPRECATED:  use EzOrm instead*/
    var __EzEntity_DEPRECATED = (function () {
        function __EzEntity_DEPRECATED(_ezDatastore, options, 
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
        __EzEntity_DEPRECATED.prototype._convertInstrumentedEntityDataToData = function (instrumentedData) {
            if (instrumentedData == null) {
                throw log.error("instrumentedData is null");
                //return null;
            }
            log.assert(_.isArray(instrumentedData));
            var toReturn = {};
            _.forEach(instrumentedData, function (item) {
                toReturn[item.name] = item.value;
            });
            return toReturn;
        };
        /**
         * helper to properly apply our index status to fields
         * @param data
         */
        __EzEntity_DEPRECATED.prototype._convertDataToInstrumentedEntityData = function (data) {
            var _this = this;
            var toReturn = [];
            var keys = Object.keys(data);
            _.forEach(keys, function (key) {
                toReturn.push({
                    name: key,
                    value: data[key],
                    excludeFromIndexes: (_this.options.excludeFromIndexes != null && _this.options.excludeFromIndexes[key] === true) ? true : undefined,
                });
            });
            return toReturn;
        };
        /**
         *  create a query for entities of this kind.  (not related to this key, just a shortcut to dataset.connection.createQuery)
         */
        __EzEntity_DEPRECATED.prototype._query_create = function () {
            //let namespace = this._ezDataset.connection.namespace;
            //let query = this._ezDataset.connection.createQuery( this.incompletePath[ 0 ] );
            var query = this._ezDatastore.createQuery(this.options.namespace, this.options.kind);
            //query.
            //var connection: _EzConnectionBase<any> = transaction == null ? this._ezDataset as any : transaction as any;
            return query;
        };
        /**
         * using the id/name supplied in the constructor, will retrieve the associated entity from the datastore, reading the results into this instance.
         * if the entity doesn't exist, the entity.data will be null.
         * @param transaction if you want this work to be done inside a transaction, pass it here
         */
        __EzEntity_DEPRECATED.prototype._read_get = function (transaction) {
            var _this = this;
            var connection = transaction == null ? this._ezDatastore : transaction;
            var resultPromise = connection.getEz(this.options.kind, this.idOrName, this.options.namespace)
                .then(function (_a) {
                var entity = _a.entity, apiResponse = _a.apiResponse;
                //log.debug("EzEntity.read_get", entity, this);
                _this._processEntityFromServer(entity);
                //if (entity == null) {
                //    return Promise.reject(new Error(`_read_get() failed:  entity for path "${this.incompletePath.join()} + ${this.idOrName}" does not exist`));
                //}
                var result = { ezEntity: _this, apiResponse: apiResponse };
                return Promise.resolve(result);
            });
            return resultPromise;
        };
        /**
         * same as ._read_get() but will return a rejected Promise if the entity does not exists.   (._read_get() returns null data on not exists)
         * @param transaction
         */
        __EzEntity_DEPRECATED.prototype._read_get_mustExist = function (transaction) {
            var _this = this;
            return this._read_get(transaction)
                .then(function (readResponse) {
                if (readResponse.ezEntity.data == null) {
                    return Promise.reject(new Error("_read_get() failed:  entity for path \"" + _this.options.kind + " + " + _this.idOrName + "\" in namespace \"" + _this.options.namespace + "\" does not exist"));
                }
                else {
                    return Promise.resolve(readResponse);
                }
            });
        };
        __EzEntity_DEPRECATED.prototype._write_insert = function (data, transaction) {
            var _this = this;
            var connection = transaction == null ? this._ezDatastore : transaction;
            data = this._convertDataToInstrumentedEntityData(data); //HACK convert but keep type flow
            log.assert(this._rawEntity == null, "already has an entity, why?");
            return connection.insertEz(this.options.kind, this.idOrName, data, this.options.namespace)
                .then(function (_a) {
                var entity = _a.entity, apiResponse = _a.apiResponse;
                //var oldData = _.clone(this.data);
                _this._processEntityFromServer(entity);
                var result = { ezEntity: _this, apiResponse: apiResponse };
                //log.debug("EzEntity.write_insert", result);
                return Promise.resolve(result);
            });
        };
        __EzEntity_DEPRECATED.prototype._write_update = function (data, transaction) {
            var _this = this;
            var connection = transaction == null ? this._ezDatastore : transaction;
            data = this._convertDataToInstrumentedEntityData(data); //HACK convert but keep type flow
            if (this.idOrName == null) {
                throw log.error("id is not set");
            }
            return connection.updateEz(this.options.kind, this.idOrName, data, this.options.namespace)
                .then(function (_a) {
                var entity = _a.entity, apiResponse = _a.apiResponse;
                //var oldData = _.clone(this.data);
                _this._processEntityFromServer(entity);
                var result = { ezEntity: _this, apiResponse: apiResponse };
                //log.debug("EzEntity.write_update", result);
                return Promise.resolve(result);
            });
        };
        __EzEntity_DEPRECATED.prototype._write_upsert = function (data, transaction) {
            var _this = this;
            var connection = transaction == null ? this._ezDatastore : transaction;
            data = this._convertDataToInstrumentedEntityData(data); //HACK convert but keep type flow
            return connection.upsertEz(this.options.kind, this.idOrName, data, this.options.namespace)
                .then(function (_a) {
                var entity = _a.entity, apiResponse = _a.apiResponse;
                //var oldData = _.clone(this.data);
                _this._processEntityFromServer(entity);
                var result = { ezEntity: _this, apiResponse: apiResponse };
                //log.debug("EzEntity.write_upsert", result);
                return Promise.resolve(result);
            });
        };
        __EzEntity_DEPRECATED.prototype._write_delete = function (transaction) {
            var _this = this;
            var connection = transaction == null ? this._ezDatastore : transaction;
            if (this.idOrName == null) {
                throw log.error("can not delete.  id is not set");
            }
            return connection.deleteEz(this.options.kind, this.idOrName, this.options.namespace)
                .then(function (_a) {
                var apiResponse = _a.apiResponse;
                //var oldData = _.clone(this.data);
                _this._processEntityFromServer(null);
                var result = { ezEntity: _this, apiResponse: apiResponse };
                //log.debug("EzEntity.write_delete", result);
                return Promise.resolve(result);
            });
        };
        //public write_upsert(d
        /**
         * updates this ezEntity with values from a server, overwriting existing values in this object, but doesn't contact the datastore.
         * @param entity
         */
        __EzEntity_DEPRECATED.prototype._processEntityFromServer = function (entity) {
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
        };
        return __EzEntity_DEPRECATED;
    }());
    datastore.__EzEntity_DEPRECATED = __EzEntity_DEPRECATED;
    var EzDatastore = (function (_super) {
        __extends(EzDatastore, _super);
        function EzDatastore(dataset) {
            return _super.call(this, dataset, dataset) || this;
        }
        /**
         * DEPRECATED: while functional, the workflow is wonky.   favor the promise based ".runInTransaction()" instead.
         * @param fn
         */
        EzDatastore.prototype._runInTransaction_DEPRECATED = function (
            /** be aware that inside transactions (using the transaction.write() functions), write operations resolve instantly as they are not actually applied until the done() callback method is called.*/
            fn, 
            /** auto-retry if the transaction fails. default = { interval: 0, max_tries:10 }  FYI in datastore v1Beta2 each try takes aprox 1 second*/
            retryOptions) {
            var _this = this;
            /** auto-retry if the transaction fails. default = { interval: 0, max_tries:10 }  FYI in datastore v1Beta2 each try takes aprox 1 second*/
            if (retryOptions === void 0) { retryOptions = { interval: 0, max_tries: 10 }; }
            return xlib.promise.retry(function () {
                return new Promise(function (resolve, reject) {
                    var _result;
                    ////////////////////////////////
                    // v0.40 implementation
                    var baseTransaction = _this._connection.transaction();
                    baseTransaction.run(function (err, base_normalTransaction, apiResponse) {
                        var newEzTransaction = new EzTransaction(base_normalTransaction, _this._connection);
                        try {
                            return fn(newEzTransaction, function (result) {
                                _result = result;
                                base_normalTransaction.commit(function (err, apiResponse) {
                                    if (err != null) {
                                        return reject(new DatastoreException("Transaction.Commit() failed.  Probably RolledBack or conflicting change occurred asynchronously.  \tapiResponse=" + __.JSONX.inspectStringify(apiResponse), err));
                                    }
                                    return resolve(_result);
                                });
                            });
                            //.catch((err) => {
                            //	return newEzTransaction.rollback();
                            //});
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
        };
        /**
         * promise based transaction.
         * @param userFunction
         * @param retryOptions
         */
        EzDatastore.prototype.runInTransaction = function (
            /** return a promise that resolves to commit the transaction.   return a rejected to rollback.
            IMPORTANT NOTE: be aware that inside transactions (using the transaction.write() functions), write operations resolve instantly as they are not actually applied until the done() callback method is called.
             */
            userFunction, 
            /** auto-retry if the transaction fails. default = { interval: 0, max_tries:10 }  FYI in datastore v1Beta2 each try takes aprox 1 second*/
            retryOptions) {
            var _this = this;
            /** auto-retry if the transaction fails. default = { interval: 0, max_tries:10 }  FYI in datastore v1Beta2 each try takes aprox 1 second*/
            if (retryOptions === void 0) { retryOptions = { interval: 0, max_tries: 10 }; }
            return xlib.promise.retry(function () {
                //log.info("runInTransaction(), top retry block: ENTER");
                return new Promise(function (resolve, reject) {
                    var _result;
                    var _explicitUserRejectionError;
                    //////////////////////
                    //v0.40 implementation
                    var baseTransaction = _this._connection.transaction();
                    baseTransaction.run(function (err, base_normalTransaction, apiResponse) {
                        var newEzTransaction = new EzTransaction(base_normalTransaction, _this._connection);
                        Promise.try(function () {
                            return userFunction(newEzTransaction);
                        })
                            .then(function (doneResult) {
                            _result = doneResult;
                            //need to call base_done() otherwise the outer-callback will never complete.
                            base_normalTransaction.commit(function (err, apiResponse) {
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
                        }, function (errUserFcnWantsToRollBack) {
                            //log.info("runInTransaction(), userFcn wants to roll back");
                            _explicitUserRejectionError = errUserFcnWantsToRollBack;
                            return xlib.promise.retry(function () {
                                //log.info("runInTransaction(), in rollback retry block");
                                return newEzTransaction.__rollbackHelper_INTERNAL();
                            }, { max_tries: 3 })
                                .then(function () {
                                //log.info("runInTransaction(), finished rollback successfully");
                                //return Promise.resolve();
                                return reject(new xlib.promise.retry.StopError(_explicitUserRejectionError));
                            }, function (errRollbackTotalFailure) {
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
        };
        return EzDatastore;
    }(_EzConnectionBase));
    datastore.EzDatastore = EzDatastore;
    /**
     * created by invoking EzDataset.runInTransaction
     * be aware that inside transactions, write operations resolve instantly as they are not actually applied until the done() callback method is called.
     */
    var EzTransaction = (function (_super) {
        __extends(EzTransaction, _super);
        function EzTransaction() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        /**
     *  return this as a rejection of the transaction to prevent retries.
     * @param messageOrInnerError
     */
        EzTransaction.prototype.newStopError = function (messageOrInnerError) {
            return new xlib.promise.retry.StopError(messageOrInnerError);
        };
        /**
         * if you use the promise based tranasctions (which you should!) you should never manually need to call this.
        simply wraps the rollback() method in a promise, resolving when the rollback succeeds, rejects when rollback fails.
         */
        EzTransaction.prototype.__rollbackHelper_INTERNAL = function () {
            var _this = this;
            return new Promise(function (resolve, reject) {
                _this._connection.rollback(function (err, apiResponse) {
                    if (err != null) {
                        return reject(new DatastoreException("Transaction.Rollback() failed.  \tapiResponse=" + __.JSONX.inspectStringify(apiResponse), err));
                    }
                    return resolve({ apiResponse: apiResponse });
                });
            });
        };
        return EzTransaction;
    }(_EzConnectionBase));
    datastore.EzTransaction = EzTransaction;
    var DatastoreException = (function (_super) {
        __extends(DatastoreException, _super);
        function DatastoreException() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return DatastoreException;
    }(xlib.exception.Exception));
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
        var EzOrm = (function () {
            function EzOrm(_ezDatastore) {
                this._ezDatastore = _ezDatastore;
            }
            /**
             *  helper to construct a new entity of the type requested
             * @param schema
             * @param namespace
             */
            EzOrm.prototype.ezConstructEntity = function (schema, namespace, id) {
                //convert a data object of the proper type
                var schemaData = {};
                __.forEach(schema.properties, function (prop, key) {
                    schemaData[key] = prop.default;
                });
                //construct the entity to return
                var toReturn = {
                    dbResult: undefined,
                    id: id,
                    kind: schema.db.kind,
                    namespace: namespace,
                    data: schemaData,
                };
                return toReturn;
            };
            EzOrm.prototype._processDbResponse_KeyHelper = function (schema, dbResponse, entity) {
                log.errorAndThrowIfFalse(entity != null && dbResponse.entity != null && dbResponse.entity.key != null, "required obj is missing.  (entity or dbResponse.entity.key)", { entity: entity, dbResponse: dbResponse });
                log.errorAndThrowIfFalse(entity.id == null || entity.id === dbResponse.entity.key.id, "id already exists, why does it change?", { entity: entity, dbResponse: dbResponse });
                log.errorAndThrowIfFalse(schema.db.kind === dbResponse.entity.key.kind, "why is kind different?", { schema: schema, dbResponse: dbResponse });
                //update our fixed values from the db
                entity.id = dbResponse.entity.key.id;
                entity.kind = dbResponse.entity.key.kind;
                entity.dbResult = {
                    dbEntity: dbResponse.entity,
                    lastApiResponse: dbResponse.apiResponse,
                    exists: dbResponse.entity.data != null,
                };
            };
            /**
             * updates the entity with only the key data from the db.  schema validation is also performed.
             * when writing the db values are not read back.  these are in IEntityInstrumentedData[] format as they are just echos of the input values
             * @param schema
             * @param dbResponse
             * @param entity
             */
            EzOrm.prototype._processDbResponse_Write = function (schema, dbResponse, entity) {
                this._processDbResponse_KeyHelper(schema, dbResponse, entity);
            };
            /**
             *  updates the entity with values from the db.   schema validation is also performed.
             * if entity does not exist, does not delete props
             * @param schemaEntity
             * @param dbResponse
             */
            EzOrm.prototype._processDbResponse_Read = function (schema, dbResponse, entity) {
                this._processDbResponse_KeyHelper(schema, dbResponse, entity);
                if (entity.data == null) {
                    entity.data = {};
                }
                var dbData = dbResponse.entity.data;
                if (dbData != null) {
                    //exists
                    //loop through all schemaProps and if the prop is a dbType, mix it into our entity data
                    __.forEach(schema.properties, function (prop, key) {
                        if (prop.dbType === "none") {
                            //not in the db, so don't update our entity's data value for this prop
                            return;
                        }
                        var dbValue = dbData[key];
                        if (prop.dbReadTransform != null) {
                            dbValue = prop.dbReadTransform(dbValue);
                        }
                        if (dbValue == null) {
                            //set our returning value to null
                            entity.data[key] = null;
                            //prop missing in db (undefined) or null
                            if (prop.isOptional !== true && schema.db.suppressInvalidSchemaErrors !== true) {
                                throw log.error("missing prop in dbEntity", { key: key, schema: schema, entity: entity, dbResponse: dbResponse, isSameRef: entity.data === dbResponse.entity.data });
                            }
                        }
                        else {
                            //prop found in db, mixin the value							
                            entity.data[key] = dbValue;
                            if (schema.db.suppressInvalidSchemaErrors !== true) {
                                //compare dbType to what the schema says it should be
                                var dbType = xlib.reflection.getType(dbValue);
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
                                        throw log.error("unknown dbtype, need to add handling of this in the ._processDbResponse() worker fcn", { key: key, prop: prop });
                                }
                            }
                        }
                    });
                }
                else {
                    //value doesn't exist in the database
                }
            };
            /**
             *  translate our data into an instrumeted "metadata" format used by google cloud datastore for writes
             * @param schema
             * @param entity
             */
            EzOrm.prototype._convertDataToInstrumentedEntityData = function (schema, entity) {
                var _this = this;
                //loop through schema props, extracting out dbTyped props into an instrumented array
                var toReturn = [];
                __.forEach(schema.properties, function (prop, key) {
                    //handle special prop parameters that can modify our entity prop value
                    {
                        var tempVal = entity.data[key];
                        if (typeof (tempVal) === "string") {
                            var strProp = prop;
                            if (strProp.toLowercaseTrim === true) {
                                tempVal = tempVal.toLowerCase().trim();
                            }
                            if (strProp.allowEmpty !== true && tempVal.length == 0) {
                                tempVal = null;
                            }
                        }
                        entity.data[key] = tempVal;
                    }
                    //construct our data to insert for this prop, including metadata
                    var instrumentedData = {
                        name: key,
                        value: entity.data[key],
                        excludeFromIndexes: prop.isDbIndexExcluded,
                    };
                    //if there is a writeTransform, use it
                    if (prop.dbWriteTransform != null) {
                        var transformResult = prop.dbWriteTransform(entity.data[key]);
                        instrumentedData.value = transformResult.dbValue;
                        entity.data[key] = transformResult.value;
                    }
                    if (instrumentedData.value == null) {
                        instrumentedData.value = null;
                        if (prop.isOptional === true) {
                            //ok
                        }
                        else if (schema.db.suppressInvalidSchemaErrors !== true) {
                            //not optional!
                            log.trace("prop is not optional", { key: key, prop: prop, entity: entity, schema: schema });
                            throw new xlib.exception.Exception("prop is not optional", { data: { key: key, prop: prop, entity: entity, schema: schema } });
                        }
                    }
                    else {
                        //transform certain data types, and ensure that the schema is of the right type too
                        var valueType = xlib.reflection.getType(instrumentedData.value);
                        var expectedType = void 0;
                        switch (prop.dbType) {
                            case "none":
                                //not to be saved to db, abort the rest of this foreach "loop"
                                return;
                            case "string":
                                expectedType = xlib.reflection.Type.string;
                                break;
                            case "double":
                                //coherse to double
                                instrumentedData.value = _this._ezDatastore.assistantDatastore.double(instrumentedData.value);
                                expectedType = xlib.reflection.Type.number;
                                break;
                            case "integer":
                                //coherse to int
                                instrumentedData.value = _this._ezDatastore.assistantDatastore.int(instrumentedData.value);
                                expectedType = xlib.reflection.Type.number;
                                break;
                            case "boolean":
                                expectedType = xlib.reflection.Type.boolean;
                                break;
                            case "blob":
                                //instrumentedData.value = _.cloneDeep(entity.data[key]); //don't copy by default, let the user specify a writeTransform if they need to do this
                                expectedType = xlib.reflection.Type.object;
                                break;
                            case "date":
                                expectedType = xlib.reflection.Type.Date;
                                break;
                            default:
                                throw log.error("unknown dbtype, need to add handling of this in the ._convertDataToInstrumentedEntityData() worker fcn", { key: key, prop: prop });
                        }
                        log.errorAndThrowIfFalse(valueType === expectedType || schema.db.suppressInvalidSchemaErrors === true, "prop type being written does not match expected schema dbType", { key: key, prop: prop, entity: entity, schema: schema });
                    }
                    //add the instrumented prop to our return values
                    toReturn.push(instrumentedData);
                });
                return toReturn;
            };
            EzOrm.prototype._verifyEntityMatchesSchema = function (schema, entity) {
                if (entity.namespace == null && schema.db.isNamespaceRequired === true) {
                    throw log.error("entity must have namespace set to read/write from db", { schema: schema, entity: entity });
                }
                if (entity.kind !== schema.db.kind) {
                    throw log.error("entity and schema kinds do not match", { schema: schema, entity: entity });
                }
            };
            /**
             *  if entity doesn't exist in the db, all db properties will not be set (so, keeping their previous values, which are mose likely ```undefined```) and also we set ```schemaEntity.db.exists===false```
             * @param schemaEntity
             * @param transaction
             */
            EzOrm.prototype.readGet = function (schema, entity, transaction) {
                var _this = this;
                return Promise.try(function () {
                    var connection = transaction == null ? _this._ezDatastore : transaction;
                    _this._verifyEntityMatchesSchema(schema, entity);
                    if (entity.id == null) {
                        throw log.error("entity must have id set to read from db", { schema: schema, entity: entity });
                    }
                    return connection.getEz(schema.db.kind, entity.id, entity.namespace)
                        .then(function (dbResponse) {
                        _this._processDbResponse_Read(schema, dbResponse, entity);
                        var result = { schema: schema, entity: entity };
                        return Promise.resolve(result);
                    });
                });
            };
            EzOrm.prototype.readGetMustExist = function (schema, entity, transaction) {
                return this.readGet(schema, entity, transaction)
                    .then(function (readResponse) {
                    if (readResponse.entity.dbResult == null) {
                        return Promise.reject(new Error("db result should not be null"));
                    }
                    if (readResponse.entity.dbResult.exists === false) {
                        return Promise.reject(new Error(".readGetMustExist() failed.  entity does not exist.  [ " + entity.namespace + ", " + entity.kind + ", " + entity.id + " ]"));
                    }
                    return Promise.resolve(readResponse);
                });
            };
            EzOrm.prototype.writeInsert = function (schema, entity, transaction) {
                var _this = this;
                return Promise.try(function () {
                    var connection = transaction == null ? _this._ezDatastore : transaction;
                    _this._verifyEntityMatchesSchema(schema, entity);
                    var dataToWrite = _this._convertDataToInstrumentedEntityData(schema, entity);
                    log.errorAndThrowIfFalse(entity.dbResult == null, "already has an entity read from the db, even though we are INSERTING!!!, why?", { entity: entity, schema: schema });
                    return connection.insertEz(entity.kind, entity.id, dataToWrite, entity.namespace)
                        .then(function (writeResponse) {
                        //delete the response dbEntity.data as it's just the input IEntityInstrumentedData[] array (don't confuse the caller dev)
                        writeResponse.entity.data = undefined;
                        _this._processDbResponse_Write(schema, writeResponse, entity);
                        return Promise.resolve({ schema: schema, entity: entity });
                    });
                });
            };
            EzOrm.prototype.writeUpdate = function (schema, entity, transaction) {
                var _this = this;
                return Promise.try(function () {
                    var connection = transaction == null ? _this._ezDatastore : transaction;
                    _this._verifyEntityMatchesSchema(schema, entity);
                    var dataToWrite = _this._convertDataToInstrumentedEntityData(schema, entity);
                    if (entity.id == null) {
                        throw log.error("writeUpdating but no id is specified", { entity: entity, schema: schema });
                    }
                    return connection.updateEz(entity.kind, entity.id, dataToWrite, entity.namespace)
                        .then(function (writeResponse) {
                        //delete the response dbEntity.data as it's just the input IEntityInstrumentedData[] array (don't confuse the caller dev)
                        writeResponse.entity.data = undefined;
                        _this._processDbResponse_Write(schema, writeResponse, entity);
                        return Promise.resolve({ schema: schema, entity: entity });
                    });
                });
            };
            EzOrm.prototype.writeUpsert = function (schema, entity, transaction) {
                var _this = this;
                return Promise.try(function () {
                    var connection = transaction == null ? _this._ezDatastore : transaction;
                    _this._verifyEntityMatchesSchema(schema, entity);
                    var dataToWrite = _this._convertDataToInstrumentedEntityData(schema, entity);
                    if (entity.id == null) {
                        throw log.error("writeUpsert but no id is specified", { entity: entity, schema: schema });
                    }
                    return connection.upsertEz(entity.kind, entity.id, dataToWrite, entity.namespace)
                        .then(function (writeResponse) {
                        //delete the response dbEntity.data as it's just the input IEntityInstrumentedData[] array (don't confuse the caller dev)
                        writeResponse.entity.data = undefined;
                        _this._processDbResponse_Write(schema, writeResponse, entity);
                        return Promise.resolve({ schema: schema, entity: entity });
                    });
                });
            };
            /**
             *  a successfull delete will set entity.dbResult.exists=false.  but will not delete the entity.id value.
             * @param schema
             * @param entity
             * @param transaction
             */
            EzOrm.prototype.writeDelete = function (schema, entity, transaction) {
                var _this = this;
                return Promise.try(function () {
                    var connection = transaction == null ? _this._ezDatastore : transaction;
                    _this._verifyEntityMatchesSchema(schema, entity);
                    if (entity.id == null) {
                        throw log.error("writeDelete but no id is specified", { entity: entity, schema: schema });
                    }
                    return connection.deleteEz(entity.kind, entity.id, entity.namespace)
                        .then(function (deleteResponse) {
                        //if (entity.id == null) {
                        //	throw log.error("why key.id deletion magic?", { entity, schema, deleteResponse });
                        //}
                        //entity.id = undefined;
                        entity.dbResult = {
                            dbEntity: undefined,
                            exists: false,
                            lastApiResponse: deleteResponse.apiResponse,
                        };
                        return Promise.resolve({ schema: schema, entity: entity });
                    });
                });
            };
            return EzOrm;
        }());
        dataSchema.EzOrm = EzOrm;
    })(dataSchema = datastore.dataSchema || (datastore.dataSchema = {}));
})(datastore = exports.datastore || (exports.datastore = {}));
//# sourceMappingURL=gcloud.js.map