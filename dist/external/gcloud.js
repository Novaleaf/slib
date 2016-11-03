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
var datastore;
(function (datastore) {
    class _EzConnectionBase {
        constructor(connection, 
            /** for use when the dataset is explicitly  needed (constructing keys, etc) */
            assistantDataset) {
            this.connection = connection;
            this.assistantDataset = assistantDataset;
            this.isTransaction = false;
            logGCloud.trace(`_EzConnectionBase.ctor start`);
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
        allocateIds(/** The key object to complete. */ incompleteKey, n) {
            logGCloud.trace(`_EzConnectionBase.allocateIds`, { arguments });
            return new Promise((resolve, reject) => {
                this.connection.allocateIds(incompleteKey, n, (err, keys, apiResponse) => {
                    if (err != null) {
                        return reject(err);
                    }
                    return resolve({ keys, apiResponse });
                });
            });
        }
        delete(key) {
            logGCloud.trace(`_EzConnectionBase.delete`, { arguments });
            return new Promise((resolve, reject) => {
                this.connection.delete(key, (err, apiResponse) => {
                    if (err != null) {
                        return reject(err);
                    }
                    return resolve({ apiResponse });
                });
            });
        }
        deleteEz(incompletePath, key) {
            let path = incompletePath.slice();
            path.push(key);
            let keyObj = this.assistantDataset.key(path);
            return this.delete(keyObj);
        }
        get(keyOrKeys) {
            logGCloud.trace(`_EzConnectionBase.get`, { arguments });
            return new Promise((resolve, reject) => {
                this.connection.get(keyOrKeys, 
                //	{ consistency: "strong" },
                    (err, entityOrEntities, apiResponse) => {
                    if (err != null) {
                        //err.code=503 err.message="Service Unavailable - Backend Error" //reason: missing projectId
                        return reject({ err, apiResponse });
                    }
                    return resolve({ entity: entityOrEntities, apiResponse });
                });
            });
        }
        getEz(incompletePath, key) {
            let path = incompletePath.slice();
            path.push(key);
            let keyObj = this.assistantDataset.key(path);
            var toReturn = this.get(keyObj);
            return toReturn;
        }
        insertEz(incompletePath, key, data) {
            let path = incompletePath.slice();
            path.push(key);
            let keyObj = this.assistantDataset.key(path);
            let entity = {
                key: keyObj,
                data: data,
            };
            return this.insert(entity).then((apiResponse) => {
                return { entity, apiResponse };
            });
        }
        updateEz(incompletePath, key, data) {
            let path = incompletePath.slice();
            path.push(key);
            let keyObj = this.assistantDataset.key(path);
            let entity = {
                key: keyObj,
                data: data,
            };
            return this.update(entity).then((apiResponse) => {
                return { entity, apiResponse };
            });
        }
        upsertEz(incompletePath, key, data) {
            let path = incompletePath.slice();
            path.push(key);
            let keyObj = this.assistantDataset.key(path);
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
                this.connection.runQuery(q, (err, entities, nextQuery, apiResponse) => {
                    if (err != null) {
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
                    this.connection.insert(entity, (err, apiResponse) => { throw new xlib.exception.Exception("api changed?  transaction's are supposed to not have callbacks." + __.JSONX.inspectStringify({ err, apiResponse })); });
                    return resolve();
                }
                else {
                    this.connection.insert(entity, (err, apiResponse) => {
                        if (err != null) {
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
                    this.connection.save(entity, (err, apiResponse) => { throw new xlib.exception.Exception("api changed?  transaction's are supposed to not have callbacks." + __.JSONX.inspectStringify({ err, apiResponse })); });
                    return resolve();
                }
                else {
                    this.connection.save(entity, (err, apiResponse) => {
                        if (err != null) {
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
                    this.connection.update(entity, (err, apiResponse) => { throw new xlib.exception.Exception("api changed?  transaction's are supposed to not have callbacks." + __.JSONX.inspectStringify({ err, apiResponse })); });
                    return resolve();
                }
                else {
                    this.connection.update(entity, (err, apiResponse) => {
                        if (err != null) {
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
                    this.connection.upsert(entity, (err, apiResponse) => { throw new xlib.exception.Exception("api changed?  transaction's are supposed to not have callbacks." + __.JSONX.inspectStringify({ err, apiResponse })); });
                    return resolve();
                }
                else {
                    this.connection.upsert(entity, (err, apiResponse) => {
                        if (err != null) {
                            return reject(err);
                        }
                        return resolve({ apiResponse });
                    });
                }
            });
        }
    }
    datastore._EzConnectionBase = _EzConnectionBase;
    class EzEntity {
        constructor(_ezDataset, incompletePath, idOrName, _excludeFromIndexes, /** if passed, we will clone this and populate the .data value with it*/ initialData) {
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
                    excludeFromIndexes: (this._excludeFromIndexes != null && this._excludeFromIndexes[key] === true) ? true : undefined,
                });
            });
            return toReturn;
        }
        /**
         *  create a query for entities of this kind.  (not related to this key, just a shortcut to dataset.connection.createQuery)
         */
        _query_create() {
            //let namespace = this._ezDataset.connection.namespace;
            let query = this._ezDataset.connection.createQuery(this.incompletePath[0]);
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
            var connection = transaction == null ? this._ezDataset : transaction;
            var resultPromise = connection.getEz(this.incompletePath, this.idOrName)
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
                    return Promise.reject(new Error(`_read_get() failed:  entity for path "${this.incompletePath.join()} + ${this.idOrName}" does not exist`));
                }
                else {
                    return Promise.resolve(readResponse);
                }
            });
        }
        _write_insert(data, transaction) {
            var connection = transaction == null ? this._ezDataset : transaction;
            data = this._convertDataToInstrumentedEntityData(data); //HACK convert but keep type flow
            log.assert(this._rawEntity == null, "already has an entity, why?");
            return connection.insertEz(this.incompletePath, this.idOrName, data)
                .then(({ entity, apiResponse }) => {
                //var oldData = _.clone(this.data);
                this._processEntityFromServer(entity);
                let result = { ezEntity: this, apiResponse };
                //log.debug("EzEntity.write_insert", result);
                return Promise.resolve(result);
            });
        }
        _write_update(data, transaction) {
            var connection = transaction == null ? this._ezDataset : transaction;
            data = this._convertDataToInstrumentedEntityData(data); //HACK convert but keep type flow
            return connection.updateEz(this.incompletePath, this.idOrName, data)
                .then(({ entity, apiResponse }) => {
                //var oldData = _.clone(this.data);
                this._processEntityFromServer(entity);
                let result = { ezEntity: this, apiResponse };
                //log.debug("EzEntity.write_update", result);
                return Promise.resolve(result);
            });
        }
        _write_upsert(data, transaction) {
            var connection = transaction == null ? this._ezDataset : transaction;
            data = this._convertDataToInstrumentedEntityData(data); //HACK convert but keep type flow
            return connection.upsertEz(this.incompletePath, this.idOrName, data)
                .then(({ entity, apiResponse }) => {
                //var oldData = _.clone(this.data);
                this._processEntityFromServer(entity);
                let result = { ezEntity: this, apiResponse };
                //log.debug("EzEntity.write_upsert", result);
                return Promise.resolve(result);
            });
        }
        _write_delete(transaction) {
            var connection = transaction == null ? this._ezDataset : transaction;
            return connection.deleteEz(this.incompletePath, this.idOrName)
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
    class EzDataset extends _EzConnectionBase {
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
                    let baseTransaction = this.connection.transaction();
                    baseTransaction.run((err, base_normalTransaction, apiResponse) => {
                        let newEzTransaction = new EzTransaction(base_normalTransaction, this.connection);
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
        runInTransaction_NEWPROMISE(
            /** return a promise that resolves to commit the transaction.   return a rejected to rollback.
            IMPORTANT NOTE: be aware that inside transactions (using the transaction.write() functions), write operations resolve instantly as they are not actually applied until the done() callback method is called.
             */
            userFunction, 
            /** auto-retry if the transaction fails. default = { interval: 0, max_tries:10 }  FYI in datastore v1Beta2 each try takes aprox 1 second*/
            retryOptions = { interval: 0, max_tries: 10 }) {
            return xlib.promise.retry(() => {
                //log.info("runInTransaction_NEWPROMISE(), top retry block: ENTER");
                return new Promise((resolve, reject) => {
                    let _result;
                    let _explicitUserRejectionError;
                    //////////////////////
                    //v0.40 implementation
                    let baseTransaction = this.connection.transaction();
                    baseTransaction.run((err, base_normalTransaction, apiResponse) => {
                        let newEzTransaction = new EzTransaction(base_normalTransaction, this.connection);
                        Promise.try(() => {
                            return userFunction(newEzTransaction);
                        })
                            .then((doneResult) => {
                            _result = doneResult;
                            //need to call base_done() otherwise the outer-callback will never complete.
                            base_normalTransaction.commit((err, apiResponse) => {
                                //transaction done callback
                                //log.info("runInTransaction_NEWPROMISE(), runInTransaction complete callback", { err });
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
                            //log.info("runInTransaction_NEWPROMISE(), userFcn wants to roll back");
                            _explicitUserRejectionError = errUserFcnWantsToRollBack;
                            return xlib.promise.retry(() => {
                                //log.info("runInTransaction_NEWPROMISE(), in rollback retry block");
                                return newEzTransaction.__rollbackHelper_INTERNAL();
                            }, { max_tries: 3 })
                                .then(() => {
                                //log.info("runInTransaction_NEWPROMISE(), finished rollback successfully");
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
                    //			//log.info("runInTransaction_NEWPROMISE(), userFcn wants to roll back");
                    //			_explicitUserRejectionError = errUserFcnWantsToRollBack;
                    //			return xlib.promise.retry(() => {
                    //				//log.info("runInTransaction_NEWPROMISE(), in rollback retry block");
                    //				return newEzTransaction.__rollbackHelper_INTERNAL();
                    //			}, { max_tries: 3 })
                    //				.then(() => {
                    //					//log.info("runInTransaction_NEWPROMISE(), finished rollback successfully");
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
                    //		//log.info("runInTransaction_NEWPROMISE(), runInTransaction complete callback", { err });
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
    datastore.EzDataset = EzDataset;
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
                this.connection.rollback((err, apiResponse) => {
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
})(datastore = exports.datastore || (exports.datastore = {}));
//# sourceMappingURL=gcloud.js.map