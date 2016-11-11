"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
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
        function _EzConnectionBase(connection, 
            /** for use when the dataset is explicitly  needed (constructing keys, etc) */
            assistantDataset) {
            this.connection = connection;
            this.assistantDataset = assistantDataset;
            this.isTransaction = false;
            logGCloud.trace("_EzConnectionBase.ctor start");
            var typeName = xlib.reflection.getTypeName(connection);
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
        _EzConnectionBase.prototype.allocateIds = function (/** The key object to complete. */ incompleteKey, n) {
            var _this = this;
            logGCloud.trace("_EzConnectionBase.allocateIds", { arguments: arguments });
            return new Promise(function (resolve, reject) {
                _this.connection.allocateIds(incompleteKey, n, function (err, keys, apiResponse) {
                    if (err != null) {
                        return reject(err);
                    }
                    return resolve({ keys: keys, apiResponse: apiResponse });
                });
            });
        };
        _EzConnectionBase.prototype["delete"] = function (key) {
            var _this = this;
            logGCloud.trace("_EzConnectionBase.delete", { arguments: arguments });
            return new Promise(function (resolve, reject) {
                _this.connection["delete"](key, function (err, apiResponse) {
                    if (err != null) {
                        return reject(err);
                    }
                    return resolve({ apiResponse: apiResponse });
                });
            });
        };
        _EzConnectionBase.prototype.deleteEz = function (incompletePath, key) {
            var path = incompletePath.slice();
            path.push(key);
            var keyObj = this.assistantDataset.key(path);
            return this["delete"](keyObj);
        };
        _EzConnectionBase.prototype.get = function (keyOrKeys) {
            var _this = this;
            logGCloud.trace("_EzConnectionBase.get", { arguments: arguments });
            return new Promise(function (resolve, reject) {
                _this.connection.get(keyOrKeys, 
                //	{ consistency: "strong" },
                function (err, entityOrEntities, apiResponse) {
                    if (err != null) {
                        //err.code=503 err.message="Service Unavailable - Backend Error" //reason: missing projectId
                        return reject({ err: err, apiResponse: apiResponse });
                    }
                    return resolve({ entity: entityOrEntities, apiResponse: apiResponse });
                });
            });
        };
        _EzConnectionBase.prototype.getEz = function (incompletePath, key) {
            var path = incompletePath.slice();
            path.push(key);
            var keyObj = this.assistantDataset.key(path);
            var toReturn = this.get(keyObj);
            return toReturn;
        };
        _EzConnectionBase.prototype.insertEz = function (incompletePath, key, data) {
            var path = incompletePath.slice();
            path.push(key);
            var keyObj = this.assistantDataset.key(path);
            var entity = {
                key: keyObj,
                data: data
            };
            return this.insert(entity).then(function (apiResponse) {
                return { entity: entity, apiResponse: apiResponse };
            });
        };
        _EzConnectionBase.prototype.updateEz = function (incompletePath, key, data) {
            var path = incompletePath.slice();
            path.push(key);
            var keyObj = this.assistantDataset.key(path);
            var entity = {
                key: keyObj,
                data: data
            };
            return this.update(entity).then(function (apiResponse) {
                return { entity: entity, apiResponse: apiResponse };
            });
        };
        _EzConnectionBase.prototype.upsertEz = function (incompletePath, key, data) {
            var path = incompletePath.slice();
            path.push(key);
            var keyObj = this.assistantDataset.key(path);
            var entity = {
                key: keyObj,
                data: data
            };
            return this.upsert(entity).then(function (apiResponse) {
                return { entity: entity, apiResponse: apiResponse };
            });
        };
        _EzConnectionBase.prototype.runQuery = function (q) {
            var _this = this;
            logGCloud.trace("_EzConnectionBase.runQuery", { arguments: arguments });
            return new Promise(function (resolve, reject) {
                _this.connection.runQuery(q, function (err, entities, nextQuery, apiResponse) {
                    if (err != null) {
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
                    _this.connection.insert(entity, function (err, apiResponse) { throw new xlib.exception.Exception("api changed?  transaction's are supposed to not have callbacks." + __.JSONX.inspectStringify({ err: err, apiResponse: apiResponse })); });
                    return resolve();
                }
                else {
                    _this.connection.insert(entity, function (err, apiResponse) {
                        if (err != null) {
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
                    _this.connection.save(entity, function (err, apiResponse) { throw new xlib.exception.Exception("api changed?  transaction's are supposed to not have callbacks." + __.JSONX.inspectStringify({ err: err, apiResponse: apiResponse })); });
                    return resolve();
                }
                else {
                    _this.connection.save(entity, function (err, apiResponse) {
                        if (err != null) {
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
                    _this.connection.update(entity, function (err, apiResponse) { throw new xlib.exception.Exception("api changed?  transaction's are supposed to not have callbacks." + __.JSONX.inspectStringify({ err: err, apiResponse: apiResponse })); });
                    return resolve();
                }
                else {
                    _this.connection.update(entity, function (err, apiResponse) {
                        if (err != null) {
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
                    _this.connection.upsert(entity, function (err, apiResponse) { throw new xlib.exception.Exception("api changed?  transaction's are supposed to not have callbacks." + __.JSONX.inspectStringify({ err: err, apiResponse: apiResponse })); });
                    return resolve();
                }
                else {
                    _this.connection.upsert(entity, function (err, apiResponse) {
                        if (err != null) {
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
    /** an base class for helping to create an ORM*/
    var EzEntity = (function () {
        function EzEntity(_ezDataset, incompletePath, 
            /** can be undefined if using a numeric ID, in that case the ID will be auto-assigned on the server */
            idOrName, _excludeFromIndexes, 
            /** if passed, we will clone this and populate the .data value with it*/
            initialData) {
            this._ezDataset = _ezDataset;
            this.incompletePath = incompletePath;
            this.idOrName = idOrName;
            this._excludeFromIndexes = _excludeFromIndexes;
            log.assert(incompletePath.length % 2 === 1, "incomplete path should be an odd number of elements, otherwise it's not incomplete");
            if (initialData != null) {
                this.data = _.clone(initialData);
            }
        }
        /**
         *  helper to properly apply our index status to fields
         * @param instrumentedData
         */
        EzEntity.prototype._convertInstrumentedEntityDataToData = function (instrumentedData) {
            if (instrumentedData == null) {
                throw log.error("instrumentedData is null");
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
        EzEntity.prototype._convertDataToInstrumentedEntityData = function (data) {
            var _this = this;
            var toReturn = [];
            var keys = Object.keys(data);
            _.forEach(keys, function (key) {
                toReturn.push({
                    name: key,
                    value: data[key],
                    excludeFromIndexes: (_this._excludeFromIndexes != null && _this._excludeFromIndexes[key] === true) ? true : undefined
                });
            });
            return toReturn;
        };
        /**
         *  create a query for entities of this kind.  (not related to this key, just a shortcut to dataset.connection.createQuery)
         */
        EzEntity.prototype._query_create = function () {
            //let namespace = this._ezDataset.connection.namespace;
            var query = this._ezDataset.connection.createQuery(this.incompletePath[0]);
            //query.
            //var connection: _EzConnectionBase<any> = transaction == null ? this._ezDataset as any : transaction as any;
            return query;
        };
        /**
         * using the id/name supplied in the constructor, will retrieve the associated entity from the datastore, reading the results into this instance.
         * if the entity doesn't exist, the entity.data will be null.
         * @param transaction if you want this work to be done inside a transaction, pass it here
         */
        EzEntity.prototype._read_get = function (transaction) {
            var _this = this;
            var connection = transaction == null ? this._ezDataset : transaction;
            var resultPromise = connection.getEz(this.incompletePath, this.idOrName)
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
        EzEntity.prototype._read_get_mustExist = function (transaction) {
            var _this = this;
            return this._read_get(transaction)
                .then(function (readResponse) {
                if (readResponse.ezEntity.data == null) {
                    return Promise.reject(new Error("_read_get() failed:  entity for path \"" + _this.incompletePath.join() + " + " + _this.idOrName + "\" does not exist"));
                }
                else {
                    return Promise.resolve(readResponse);
                }
            });
        };
        EzEntity.prototype._write_insert = function (data, transaction) {
            var _this = this;
            var connection = transaction == null ? this._ezDataset : transaction;
            data = this._convertDataToInstrumentedEntityData(data); //HACK convert but keep type flow
            log.assert(this._rawEntity == null, "already has an entity, why?");
            return connection.insertEz(this.incompletePath, this.idOrName, data)
                .then(function (_a) {
                var entity = _a.entity, apiResponse = _a.apiResponse;
                //var oldData = _.clone(this.data);
                _this._processEntityFromServer(entity);
                var result = { ezEntity: _this, apiResponse: apiResponse };
                //log.debug("EzEntity.write_insert", result);
                return Promise.resolve(result);
            });
        };
        EzEntity.prototype._write_update = function (data, transaction) {
            var _this = this;
            var connection = transaction == null ? this._ezDataset : transaction;
            data = this._convertDataToInstrumentedEntityData(data); //HACK convert but keep type flow
            if (this.idOrName == null) {
                throw log.error("id is not set");
            }
            return connection.updateEz(this.incompletePath, this.idOrName, data)
                .then(function (_a) {
                var entity = _a.entity, apiResponse = _a.apiResponse;
                //var oldData = _.clone(this.data);
                _this._processEntityFromServer(entity);
                var result = { ezEntity: _this, apiResponse: apiResponse };
                //log.debug("EzEntity.write_update", result);
                return Promise.resolve(result);
            });
        };
        EzEntity.prototype._write_upsert = function (data, transaction) {
            var _this = this;
            var connection = transaction == null ? this._ezDataset : transaction;
            data = this._convertDataToInstrumentedEntityData(data); //HACK convert but keep type flow
            return connection.upsertEz(this.incompletePath, this.idOrName, data)
                .then(function (_a) {
                var entity = _a.entity, apiResponse = _a.apiResponse;
                //var oldData = _.clone(this.data);
                _this._processEntityFromServer(entity);
                var result = { ezEntity: _this, apiResponse: apiResponse };
                //log.debug("EzEntity.write_upsert", result);
                return Promise.resolve(result);
            });
        };
        EzEntity.prototype._write_delete = function (transaction) {
            var _this = this;
            var connection = transaction == null ? this._ezDataset : transaction;
            if (this.idOrName == null) {
                throw log.error("can not delete.  id is not set");
            }
            return connection.deleteEz(this.incompletePath, this.idOrName)
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
        EzEntity.prototype._processEntityFromServer = function (entity) {
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
        return EzEntity;
    }());
    datastore.EzEntity = EzEntity;
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
                    var baseTransaction = _this.connection.transaction();
                    baseTransaction.run(function (err, base_normalTransaction, apiResponse) {
                        var newEzTransaction = new EzTransaction(base_normalTransaction, _this.connection);
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
                    var baseTransaction = _this.connection.transaction();
                    baseTransaction.run(function (err, base_normalTransaction, apiResponse) {
                        var newEzTransaction = new EzTransaction(base_normalTransaction, _this.connection);
                        Promise["try"](function () {
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
            return _super.apply(this, arguments) || this;
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
                _this.connection.rollback(function (err, apiResponse) {
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
            return _super.apply(this, arguments) || this;
        }
        return DatastoreException;
    }(xlib.exception.Exception));
    datastore.DatastoreException = DatastoreException;
    ;
})(datastore = exports.datastore || (exports.datastore = {}));
