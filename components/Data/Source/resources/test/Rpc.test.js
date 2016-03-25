/* global define, beforeEach, afterEach, describe, context, it, assert, $ws */
define([
   'js!SBIS3.CONTROLS.Data.Source.Provider.IRpc',
   'js!SBIS3.CONTROLS.Data.Source.Rpc'
], function (IRpcProvider, RpcSource) {
   'use strict';

   describe('SBIS3.CONTROLS.Data.Source.Rpc', function () {
      var dataSource,
         ProviderMock = $ws.core.extend({}, [IRpcProvider], {
            call: function (method, args) {
               this._lastMethod = method;
               this._lastArgs = args;
               return $ws.proto.Deferred.success(true);
            }
         }),
         provider = new ProviderMock();

      beforeEach(function () {
         dataSource = new RpcSource({
            endpoint: '/users/',
            provider: provider,
            binding: {
               query: 'getUsers',
               create: 'createUser',
               read: 'readUser',
               update: 'updateUser',
               destroy: 'deleteUser',
               copy: 'copyUser',
               merge: 'mergeUsers'
            }
         });
      });

      afterEach(function () {
         dataSource = undefined;
      });

      describe('.getProvider()', function () {
         it('should return Provider', function (){
            assert.instanceOf(dataSource.getProvider(), ProviderMock);
         });
      });

      describe('.subscribe()', function () {
         context('onBeforeProviderCall', function (){
            it('should receive method name', function (done) {
               var handler = function(e, name) {
                     try {
                        assert.strictEqual(name, methodName);
                        done();
                     } catch (e) {
                        done(e);
                     }
                  },
                  methodName = 'Test';
               dataSource.subscribe('onBeforeProviderCall', handler);
               dataSource.call(methodName);
               dataSource.unsubscribe('onBeforeProviderCall', handler);
            });
            it('should receive method name and arguments', function (done) {
               var handler = function(e, name, args) {
                     try {
                        assert.strictEqual(name, methodName);
                        assert.deepEqual(args, methodArgs);
                        done();
                     } catch (e) {
                        done(e);
                     }
                  },
                  methodName = 'Test',
                  methodArgs = [{}, [], 'a', 1, 0, false, true, null];
               dataSource.subscribe('onBeforeProviderCall', handler);
               dataSource.call(methodName, methodArgs);
               dataSource.unsubscribe('onBeforeProviderCall', handler);
            });
            it('should change method arguments as an object', function () {
               var handler = function(e, name, args) {
                     args.a = 9;
                     delete args.b;
                     args.c = 3;
                  },
                  methodArgs = {a: 1, b: 2},
                  expectArgs = {a: 9, c: 3};
               dataSource.subscribe('onBeforeProviderCall', handler);
               dataSource.call('Test', methodArgs);
               dataSource.unsubscribe('onBeforeProviderCall', handler);
               assert.deepEqual(provider._lastArgs, expectArgs);
            });
            it('should change method arguments as an array', function () {
               var handler = function(e, name, args) {
                     args.push('new');
                  },
                  methodArgs = [1, 2],
                  expectArgs = [1, 2, 'new'];
               dataSource.subscribe('onBeforeProviderCall', handler);
               dataSource.call('Test', methodArgs);
               dataSource.unsubscribe('onBeforeProviderCall', handler);
               assert.deepEqual(provider._lastArgs, expectArgs);
            });
         });
      });

      describe('.getQueryMethodName()', function () {
         it('should return QueryMethodName', function (){
            assert.equal(dataSource.getQueryMethodName(), 'getUsers');
         });
      });

      describe('.setQueryMethodName', function () {
         it('should set QueryMethodName', function () {
            dataSource.setQueryMethodName('users');
            assert.equal(dataSource.getQueryMethodName(), 'users');
         });
      });

      describe('.getCreateMethodName()', function () {
         it('should return CreateMethodName', function (){
            assert.equal(dataSource.getCreateMethodName(), 'createUser');
         });
      });

      describe('.setCreateMethodName', function () {
         it('should set CreateMethodName', function () {
            dataSource.setCreateMethodName('make');
            assert.equal(dataSource.getCreateMethodName(), 'make');
         });
      });

      describe('.getReadMethodName()', function () {
         it('should return ReadMethodName', function (){
            assert.equal(dataSource.getReadMethodName(), 'readUser');
         });
      });

      describe('.setReadMethodName', function () {
         it('should set ReadMethodName', function () {
            dataSource.setReadMethodName('read');
            assert.equal(dataSource.getReadMethodName(), 'read');
         });
      });

      describe('.getUpdateMethodName()', function () {
         it('should return UpdateMethodName', function (){
            assert.equal(dataSource.getUpdateMethodName(), 'updateUser');
         });
      });

      describe('.setUpdateMethodName', function () {
         it('should set UpdateMethodName', function () {
            dataSource.setUpdateMethodName('update');
            assert.equal(dataSource.getUpdateMethodName(), 'update');
         });
      });

      describe('.getDestroyMethodName()', function () {
         it('should return DestroyMethodName', function (){
            assert.equal(dataSource.getDestroyMethodName(), 'deleteUser');
         });
      });

      describe('.setDestroyMethodName', function () {
         it('should set DestroyMethodName', function () {
            dataSource.setDestroyMethodName('delete');
            assert.equal(dataSource.getDestroyMethodName(), 'delete');
         });
      });

      describe('.getCopyMethodName()', function () {
         it('should return CopyMethodName', function (){
            assert.equal(dataSource.getCopyMethodName(), 'copyUser');
         });
      });

      describe('.setCopyMethodName', function () {
         it('should set CopyMethodName', function () {
            dataSource.setCopyMethodName('copy');
            assert.equal(dataSource.getCopyMethodName(), 'copy');
         });
      });

      describe('.getMergeMethodName()', function () {
         it('should return MergeMethodName', function (){
            assert.equal(dataSource.getMergeMethodName(), 'mergeUsers');
         });
      });

      describe('.setMergeMethodName', function () {
         it('should set MergeMethodName', function () {
            dataSource.setMergeMethodName('merge');
            assert.equal(dataSource.getMergeMethodName(), 'merge');
         });
      });

   });
});