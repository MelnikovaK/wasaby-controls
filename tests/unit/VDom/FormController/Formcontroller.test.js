define([
   'Controls/FormController',
   'Types/entity'
], (FormController, entity) => {
   'use strict';

   describe('FormController', () => {
      it('initializingWay', () => {
         let FC = new FormController();

         let baseReadRecordBeforeMount = FormController._private.readRecordBeforeMount;
         let baseCreateRecordBeforeMount = FormController._private.createRecordBeforeMount;
         let cfg = {
            record: new entity.Record(),
         };

         let isReading = false;
         let isCreating = false;

         FormController._private.readRecordBeforeMount = () => {
            isReading = true;
            return true;
         };

         FormController._private.createRecordBeforeMount = () => {
            isCreating = true;
            return true;
         };

         let beforeMountResult = FC._beforeMount(cfg);
         assert.equal(isReading, false);
         assert.equal(isCreating, false);
         assert.notEqual(beforeMountResult, true);

         cfg.key = '123';
         beforeMountResult = FC._beforeMount(cfg);
         assert.equal(isReading, true);
         assert.equal(isCreating, false);
         assert.notEqual(beforeMountResult, true);

         cfg = {
            key: 123
         };
         isReading = false;
         beforeMountResult = FC._beforeMount(cfg);
         assert.equal(isReading, true);
         assert.equal(isCreating, false);
         assert.equal(beforeMountResult, true);

         isReading = false;
         isCreating = false;
         beforeMountResult = FC._beforeMount({});
         assert.equal(isReading, false);
         assert.equal(isCreating, true);
         assert.equal(beforeMountResult, true);

         FormController._private.readRecordBeforeMount = baseReadRecordBeforeMount;
         FormController._private.createRecordBeforeMount = baseCreateRecordBeforeMount;
         FC.destroy();
      });

      it('beforeUpdate', () => {
         let FC = new FormController();
         let setRecordCalled = false;
         let readCalled = false;
         let createCalled = false;

         FC._setRecord = () => {
            setRecordCalled = true;
         };
         FC.read = () => {
            readCalled = true;
         };
         FC.create = () => {
            createCalled = true;
         };

         FC._beforeUpdate({
            record: 'record'
         });
         assert.equal(setRecordCalled, true);
         assert.equal(readCalled, false);
         assert.equal(createCalled, false);

         setRecordCalled = false;
         FC._beforeUpdate({
            record: {
               isChanged: () => false
            },
            key: 'key'
         });

         assert.equal(setRecordCalled, true);
         assert.equal(readCalled, true);
         assert.equal(createCalled, false);
         assert.equal(FC._isNewRecord, false);

         setRecordCalled = false;
         readCalled = false;
         FC._beforeUpdate({
            isNewRecord: true
         });

         assert.equal(setRecordCalled, false);
         assert.equal(readCalled, false);
         assert.equal(createCalled, true);
      });

      it('delete new record', () => {
         let FC = new FormController();
         let isDestroyCalled = false;
         FC._options.dataSource = {
            destroy: () => {
               isDestroyCalled = true;
            }
         };
         FC._tryDeleteNewRecord();
         assert.equal(isDestroyCalled, false);

         FC._record = {
            getId: () => null
         };
         FC._isNewRecord = true;

         FC._tryDeleteNewRecord();
         assert.equal(isDestroyCalled, false);

         FC._record = {
            getId: () => 'key'
         };
         FC._tryDeleteNewRecord();
         assert.equal(isDestroyCalled, true);

         FC.destroy();
      });
   });
});
