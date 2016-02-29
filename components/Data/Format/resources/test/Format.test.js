/* global define, beforeEach, afterEach, describe, context, it, assert, $ws */
define([
      'js!SBIS3.CONTROLS.Data.Format.Format',
      'js!SBIS3.CONTROLS.Data.Format.FieldsFactory'
   ], function (Format, FieldsFactory) {
      'use strict';

      describe('SBIS3.CONTROLS.Data.Format.Format', function() {
         var format;

         beforeEach(function() {
            format = new Format();
         });

         afterEach(function() {
            format = undefined;
         });

         describe('.$constructor()', function() {
            it('should throw an error if items option contains not a field format', function() {
               assert.throw(function () {
                  var format = new Format({
                     items: [null]
                  });
               });
            });
         });

         describe('.add()', function() {
            it('should throw an error if not a field format passed', function() {
               assert.throw(function () {
                  format.add(0);
               });
            });
         });

         describe('.remove()', function() {
            it('should throw an error if not a field format passed', function() {
               assert.throw(function () {
                  format.remove(1);
               });
            });
         });

         describe('.replace()', function() {
            it('should throw an error if not a field format passed', function() {
               assert.throw(function () {
                  format.replace(2, 0);
               });
            });
         });

         describe('.assign()', function() {
            it('should throw an error if not a field format passed', function() {
               assert.throw(function () {
                  format.assign([3]);
               });
            });
         });

         describe('.append()', function() {
            it('should throw an error if not a field format passed', function() {
               assert.throw(function () {
                  format.append([4]);
               });
            });
         });

         describe('.prepend()', function() {
            it('should throw an error if not a field format passed', function() {
               assert.throw(function () {
                  format.prepend([5]);
               });
            });
         });

         describe('.removeField()', function() {
            it('should remove field with given name', function() {
               var format = new Format({
                  items: [
                     FieldsFactory.create({type: 'integer', 'name': 'f1'}),
                     FieldsFactory.create({type: 'string', 'name': 'f2'})
                  ]
               });
               format.removeField('f2');
               assert.strictEqual(format.getCount(), 1);
               format.removeField('f1');
               assert.strictEqual(format.getCount(), 0);
            });
            it('should throw an error if field with given name is not exists', function() {
               assert.throw(function () {
                  format.removeField('f1');
               });
            });
         });

         describe('.getFieldndex()', function() {
            it('should return exists field index', function() {
               var format = new Format({
                  items: [
                     FieldsFactory.create({type: 'integer', 'name': 'f1'}),
                     FieldsFactory.create({type: 'string', 'name': 'f2'})
                  ]
               });
               assert.strictEqual(format.getFieldndex('f1'), 0);
               assert.strictEqual(format.getFieldndex('f2'), 1);
            });
            it('should -1 if field is not exists', function() {
               assert.strictEqual(format.getFieldndex('f1'), -1);
               assert.strictEqual(format.getFieldndex('f2'), -1);
            });
         });

         describe('.getFieldName()', function() {
            it('should return field name by index', function() {
               var format = new Format({
                  items: [
                     FieldsFactory.create({type: 'integer', 'name': 'f1'}),
                     FieldsFactory.create({type: 'string', 'name': 'f2'})
                  ]
               });
               assert.strictEqual(format.getFieldName(0), 'f1');
               assert.strictEqual(format.getFieldName(1), 'f2');
            });
            it('should throw an error if index is out of bounds', function() {
               assert.throw(function () {
                  format.getFieldName(0);
               });
            });
         });

         describe('.clone()', function() {
            it('should return the clone', function() {
               var format = new Format({
                  items: [
                     FieldsFactory.create({type: 'integer', 'name': 'f1'}),
                     FieldsFactory.create({type: 'string', 'name': 'f2'})
                  ]
               });
               var clone = format.clone();
               assert.notEqual(format, clone);
               assert.strictEqual(format.getCount(), clone.getCount());
               for (var i = 0, count = format.getCount(); i < count; i++) {
                  assert.notEqual(format.at(i), clone.at(i));
                  assert.isTrue(
                     format.at(i).isEqual(
                        clone.at(i)
                     )
                  );
               }
            });
         });
      });
   }
);
