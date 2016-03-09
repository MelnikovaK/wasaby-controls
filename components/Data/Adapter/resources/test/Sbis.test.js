/* global define, beforeEach, afterEach, describe, context, it, assert */
define([
   'js!SBIS3.CONTROLS.Data.Adapter.Sbis',
   'js!SBIS3.CONTROLS.Data.Model',
   'js!SBIS3.CONTROLS.Data.Collection.RecordSet',
   'js!SBIS3.CONTROLS.Data.Record',
   'js!SBIS3.CONTROLS.Data.Source.DataSet'
], function (SbisAdapter, Model, RecordSet, Record, DataSet) {
      'use strict';

      describe('SBIS3.CONTROLS.Data.Adapter.Sbis', function () {
         var data,
            adapter;

         beforeEach(function () {
            data = {
               d: [
                  [1, 'Иванов'],
                  [2, 'Петров'],
                  [3, 'Сидоров'],
                  [4, 'Пухов'],
                  [5, 'Молодцов'],
                  [6, 'Годолцов'],
                  [7, 'Арбузнов']
               ],
               s: [
                  {'n': 'Ид', 't': 'Число целое'},
                  {'n': 'Фамилия', 't': 'Строка'}
               ]
            };

            adapter = new SbisAdapter();
         });

         afterEach(function () {
            data = undefined;
            adapter = undefined;
         });

         describe('.forTable()', function () {
            it('should return table adapter', function () {
               var adapter = new SbisAdapter();
               assert.isTrue(
                  $ws.helpers.instanceOfModule(
                     adapter.forTable(),
                     'SBIS3.CONTROLS.Data.Adapter.SbisTable'
                  )
               );
            });
            it('should pass data to the table adapter', function () {
               var data = {d: [], s: []},
                  adapter = new SbisAdapter();
               assert.strictEqual(
                  adapter.forTable(data).getData(),
                  data
               );
            });
         });

         describe('.forRecord()', function () {
            it('should return record adapter', function () {
               var adapter = new SbisAdapter();
               assert.isTrue(
                  $ws.helpers.instanceOfModule(
                     adapter.forRecord(),
                     'SBIS3.CONTROLS.Data.Adapter.SbisRecord'
                  )
               );
            });
            it('should pass data to the record adapter', function () {
               var data = {d: [], s: []},
                  adapter = new SbisAdapter();
               assert.strictEqual(
                  adapter.forRecord(data).getData(),
                  data
               );
            });
         });

         describe('.getProperty()', function () {
            it('should return the property value', function () {
               assert.strictEqual(
                  123,
                  adapter.getProperty({
                     items: data,
                     total: 123
                  }, 'total')
               );
               assert.strictEqual(
                  456,
                  adapter.getProperty({
                     d: data.d,
                     s: data.s,
                     n: 456
                  }, 'n')
               );
               assert.strictEqual(
                  789,
                  adapter.getProperty({
                     employees: {
                        d: data.d,
                        s: data.s,
                        n: 789
                     }
                  }, 'employees.n')
               );
               assert.isUndefined(
                  adapter.getProperty(data, 'total')
               );
               assert.isUndefined(
                  adapter.getProperty(data)
               );
            });

            it('should return undefined on invalid data', function () {
               assert.isUndefined(
                  adapter.getProperty({})
               );
               assert.isUndefined(
                  adapter.getProperty('')
               );
               assert.isUndefined(
                  adapter.getProperty(0)
               );
               assert.isUndefined(
                  adapter.getProperty()
               );
            });
         });


         describe('.setProperty()', function () {
            it('should set the property value', function () {
               adapter.setProperty(data, 'n', 456);
               assert.strictEqual(
                  456,
                  data.n
               );
               assert.strictEqual(
                  1,
                  data.d[0][0]
               );
               assert.strictEqual(
                  5,
                  data.d[4][0]
               );
               assert.strictEqual(
                  'Годолцов',
                  data.d[5][1]
               );

               var moreData = {
                  employees: {
                     items: data,
                     total: 789
                  }
               };
               adapter.setProperty(moreData, 'employees.total', 987);
               assert.strictEqual(
                  987,
                  moreData.employees.total
               );
               assert.strictEqual(
                  1,
                  moreData.employees.items.d[0][0]
               );
               assert.strictEqual(
                  5,
                  moreData.employees.items.d[4][0]
               );
               assert.strictEqual(
                  'Годолцов',
                  moreData.employees.items.d[5][1]
               );

               adapter.setProperty(data, 'c.d.e.f', 'g');
               assert.strictEqual(
                  'g',
                  data.c.d.e.f
               );
               assert.strictEqual(
                  1,
                  moreData.employees.items.d[0][0]
               );
               assert.strictEqual(
                  5,
                  moreData.employees.items.d[4][0]
               );
               assert.strictEqual(
                  'Годолцов',
                  moreData.employees.items.d[5][1]
               );
            });
         });

         describe('.serialize()', function () {
            it('should create valid deep structure', function () {
               var adapter = new SbisAdapter(),
                  result = adapter.serialize({
                     'null': null,
                     'false': false,
                     'true': true,
                     '0': 0,
                     '10': 10,
                     'Строка': 'String',
                     'Date': new Date('2015-12-03'),
                     'Массив': [
                        false,
                        true,
                        0,
                        1,
                        'S',
                        new Date('2001-09-11'),
                        [],
                        {}
                     ],
                     'EmptyObject': {},
                     'Запись': {
                        'ВызовИзБраузера': true,
                        'Количество': 1,
                        'Вес': 2.5,
                        'Тип': 'Пустой',
                        'Дата': new Date('2015-10-10')
                     }
                  }),
                  expect = {
                     d: [
                        0,
                        10,
                        null,
                        false,
                        true,
                        'String',
                        '2015-12-03',
                        [false, true, 0, 1, 'S', '2001-09-11', [], {d: [], s: []}],
                        {
                           d: [],
                           s: []
                        },
                        {
                           d: [true, 1, 2.5, 'Пустой', '2015-10-10'],
                           s: [{
                              n: 'ВызовИзБраузера',
                              t: 'Логическое'
                           }, {
                              n: 'Количество',
                              t: 'Число целое'
                           }, {
                              n: 'Вес',
                              t: 'Число вещественное'
                           }, {
                              n: 'Тип',
                              t: 'Строка'
                           }, {
                              n: 'Дата',
                              t: 'Дата и время'
                           }]
                        }
                     ],
                     s: [{
                        n: '0',
                        t: 'Число целое'
                     }, {
                        n: '10',
                        t: 'Число целое'
                     }, {
                        n: 'null',
                        t: 'Строка'
                     }, {
                        n: 'false',
                        t: 'Логическое'
                     }, {
                        n: 'true',
                        t: 'Логическое'
                     }, {
                        n: 'Строка',
                        t: 'Строка'
                     }, {
                        n: 'Date',
                        t: 'Дата и время'
                     }, {
                        n: 'Массив',
                        t: {
                           n: 'Массив',
                           t: 'Логическое'
                        }
                     }, {
                        n: 'EmptyObject',
                        t: 'Запись'
                     }, {
                        n: 'Запись',
                        t: 'Запись'
                     }]
                  };
               assert.sameDeepMembers(result.s, expect.s, 'wrong s');
               assert.sameDeepMembers(result.d, expect.d, 'wrong d');
            });

            it('should serialize model', function () {
               var adapter = new SbisAdapter(),
                  model = new Model({
                     rawData: {
                        some: {deep: {object: 'here'}}
                     }
                  }),
                  result = adapter.serialize(model),
                  expect = model.getRawData();
               expect._type = 'record';
               assert.deepEqual(result, expect);
            });

            it('should serialize RecordSet', function () {
               var adapter = new SbisAdapter(),
                  ds = new RecordSet({
                     adapter: adapter,
                     rawData: {
                        d: [], s: []
                     }
                  }),
                  result = adapter.serialize(ds),
                  expect = ds.getRawData();
               expect._type = 'recordset';
               assert.deepEqual(result, expect);
            });

            it('should serialize models and RecordSets in deep structure', function () {
               var adapter = new SbisAdapter(),
                  model = new Model({
                     adapter: adapter,
                     rawData: {}
                  }),
                  ds = new RecordSet({
                     adapter: adapter,
                     rawData: {}
                  }),
                  result = adapter.serialize({
                     some: {
                        model: model
                     },
                     and: {
                        also: ds
                     }
                  }),
                  expect = {
                     d: [{
                        d: [
                           model.getRawData() || {}
                        ],
                        s: [{
                           n: 'model',
                           t: 'Запись'
                        }]
                     }, {
                        d: [
                           ds.getRawData() || {}
                        ],
                        s: [{
                           n: 'also',
                           t: 'Выборка'
                        }]
                     }],
                     s: [{
                        n: 'some',
                        t: 'Запись'
                     }, {
                        n: 'and',
                        t: 'Запись'
                     }]
                  };
               expect.d[0].d[0]._type = 'record';
               expect.d[1].d[0]._type = 'recordset';
               assert.deepEqual(result, expect);
            });
         });
      });

      describe('SBIS3.CONTROLS.Data.Adapter.Sbis::forTable()', function () {
         var data,
            adapterInstance;

         beforeEach(function () {
            data = {
               d: [
                  [1, 'Иванов'],
                  [2, 'Петров'],
                  [3, 'Сидоров'],
                  [4, 'Пухов'],
                  [5, 'Молодцов'],
                  [6, 'Годолцов'],
                  [7, 'Арбузнов']
               ],
               s: [
                  {'n': 'Ид', 't': 'Число целое'},
                  {'n': 'Фамилия', 't': 'Строка'}
               ]
            };

            adapterInstance = new SbisAdapter().forTable(data);
         });

         afterEach(function () {
            data = undefined;
            adapterInstance = undefined;
         });

         describe('.getEmpty()', function () {
            it('should return empty data', function () {
               assert.strictEqual(
                  0,
                  new SbisAdapter().forTable().getEmpty().d.length
               );
            });
         });

         describe('.getCount()', function () {
            it('should return records count', function () {
               assert.strictEqual(
                  7,
                  adapterInstance.getCount()
               );
               assert.strictEqual(
                  0,
                  new SbisAdapter().forTable([]).getCount()
               );
               assert.strictEqual(
                  0,
                  new SbisAdapter().forTable({}).getCount()
               );
               assert.strictEqual(
                  0,
                  new SbisAdapter().forTable('').getCount()
               );
               assert.strictEqual(
                  0,
                  new SbisAdapter().forTable(0).getCount()
               );
               assert.strictEqual(
                  0,
                  new SbisAdapter().forTable().getCount()
               );
            });
         });

         describe('.add()', function () {
            it('should append a record', function () {
               adapterInstance.add({d: [30, 'Огурцов']});
               assert.strictEqual(
                  8,
                  data.d.length
               );
               assert.strictEqual(
                  30,
                  data.d[data.d.length - 1][0]
               );
               assert.strictEqual(
                  'Огурцов',
                  data.d[data.d.length - 1][1]
               );
            });

            it('should prepend a record', function () {
               adapterInstance.add({d: [40, 'Перцов']}, 0);
               assert.strictEqual(
                  8,
                  data.d.length
               );
               assert.strictEqual(
                  40,
                  data.d[0][0]
               );
               assert.strictEqual(
                  'Перцов',
                  data.d[0][1]
               );
            });

            it('should insert a record', function () {
               adapterInstance.add({d: [50, 'Горохов']}, 2);
               assert.strictEqual(
                  8,
                  data.d.length
               );
               assert.strictEqual(
                  50,
                  data.d[2][0]
               );
               assert.strictEqual(
                  'Горохов',
                  data.d[2][1]
               );
            });

            it('should throw an error on invalid position', function () {
               assert.throw(function () {
                  adapterInstance.add({d: [30, 'aaa']}, 100);
               });
               assert.throw(function () {
                  adapterInstance.add({d: [30, 'aaa']}, -1);
               });
            });

            it('should get s from new record', function () {
               var adapter = new SbisAdapter().forTable({d: [], s: []}),
                  s = [{'n': 'Ид', 't': 'Число целое'}];
               adapter.add({d: [1], s:s});
               assert.deepEqual(adapter.getData().s, s);
            });
         });

         describe('.at()', function () {
            it('should return valid record', function () {
               assert.strictEqual(
                  1,
                  adapterInstance.at(0).d[0]
               );
               assert.strictEqual(
                  3,
                  adapterInstance.at(2).d[0]
               );
            });

            it('should return undefined on invalid position', function () {
               assert.isUndefined(
                  adapterInstance.at(-1)
               );
               assert.isUndefined(
                  adapterInstance.at(99)
               );
            });

            it('should return undefined on invalid data', function () {
               assert.isUndefined(
                  new SbisAdapter().forTable({}).at()
               );
               assert.isUndefined(
                  new SbisAdapter().forTable('').at()
               );
               assert.isUndefined(
                  new SbisAdapter().forTable(0).at()
               );
               assert.isUndefined(
                  new SbisAdapter().forTable().at()
               );
            });
         });

         describe('.remove()', function () {
            it('should remove the record', function () {
               adapterInstance.remove(0);
               assert.strictEqual(
                  2,
                  data.d[0][0]
               );

               adapterInstance.remove(2);
               assert.strictEqual(
                  5,
                  data.d[2][0]
               );

               adapterInstance.remove(5);
               assert.isUndefined(
                  data.d[5]
               );
            });

            it('should throw an error on invalid position', function () {
               assert.throw(function () {
                  adapterInstance.remove(-1);
               });
               assert.throw(function () {
                  adapterInstance.remove(99);
               });
            });
         });

         describe('.merge()', function () {
            it('should merge two records', function () {
               adapterInstance.merge(0, 1, 'Ид');
               assert.strictEqual(
                  'Петров',
                  data.d[0][1]
               );
            });
         });

         describe('.copy()', function () {
            it('should merge two records', function () {
               adapterInstance.copy(0);
               assert.strictEqual(
                  'Иванов',
                  data.d[1][1]
               );
            });
         });

         describe('.replace()', function () {
            it('should replace the record', function () {
               adapterInstance.replace({d: [11]}, 0);
               assert.strictEqual(
                  11,
                  data.d[0][0]
               );

               adapterInstance.replace({d: [12]}, 4);
               assert.strictEqual(
                  12,
                  data.d[4][0]
               );

            });

            it('should throw an error on invalid position', function () {
               assert.throw(function () {
                  adapterInstance.replace({d: [13]}, -1);
               });
               assert.throw(function () {
                  adapterInstance.replace({d: [14]}, 99);
               });
            });

            it('should replace s in raw data', function () {
               var s = [{'n': 'Ид', 't': 'Число целое'}],
                  adapter = new SbisAdapter().forTable({d: [1], s: []});
               adapter.replace({d: [11], s: s}, 0);
               assert.strictEqual(adapter.getData().s,  s);
            });
         });

         describe('.move()', function () {
            it('should move Иванов instead Сидоров', function () {
               adapterInstance.move(0, 2);
               assert.strictEqual(
                  'Петров',
                  data.d[0][1]
               );
               assert.strictEqual(
                  'Сидоров',
                  data.d[1][1]
               );
               assert.strictEqual(
                  'Иванов',
                  data.d[2][1]
               );
            });
            it('should move Сидоров instead Иванов', function () {
               adapterInstance.move(2, 0);
               assert.strictEqual(
                  'Сидоров',
                  data.d[0][1]
               );
               assert.strictEqual(
                  'Иванов',
                  data.d[1][1]
               );
               assert.strictEqual(
                  'Петров',
                  data.d[2][1]
               );
            });
            it('should move Петров to the end', function () {
               adapterInstance.move(1, 6);
               assert.strictEqual(
                  'Петров',
                  data.d[6][1]
               );
               assert.strictEqual(
                  'Арбузнов',
                  data.d[5][1]
               );
            });
            it('should not move Петров', function () {
               adapterInstance.move(1, 1);
               assert.strictEqual(
                  'Петров',
                  data.d[1][1]
               );
               assert.strictEqual(
                  'Годолцов',
                  data.d[5][1]
               );
            });
         });
      });

      describe('SBIS3.CONTROLS.Data.Adapter.Sbis::forRecord()', function () {
         var data,
            adapterInstance;

         beforeEach(function () {
            data = {
               d: [1, 'Иванов', 'Иван', 'Иванович'],
               s: [
                  {'n': 'Ид', 't': 'Число целое'},
                  {'n': 'Фамилия', 't': 'Строка'},
                  {'n': 'Имя', 't': 'Строка'},
                  {'n': 'Отчество', 't': 'Строка'}
               ]
            };

            adapterInstance = new SbisAdapter().forRecord(data);
         });

         afterEach(function () {
            data = undefined;
            adapterInstance = undefined;
         });

         describe('.get()', function () {
            it('should return the property value', function () {
               assert.strictEqual(
                  1,
                  adapterInstance.get('Ид')
               );
               assert.strictEqual(
                  'Иванов',
                  adapterInstance.get('Фамилия')
               );
               assert.isUndefined(
                  adapterInstance.get('Должность')
               );
               assert.isUndefined(
                  adapterInstance.get()
               );
               assert.isUndefined(
                  new SbisAdapter().forRecord({}).get('Должность')
               );
               assert.isUndefined(
                  new SbisAdapter().forRecord('').get()
               );
               assert.isUndefined(
                  new SbisAdapter().forRecord(0).get()
               );
               assert.isUndefined(
                  new SbisAdapter().forRecord().get()
               );
            });
         });

         describe('.set()', function () {
            it('should set the property value', function () {
               adapterInstance.set('Ид', 20);
               assert.strictEqual(
                  20,
                  data.d[0]
               );
            });

            it('should throw an error on undefined property', function () {
               assert.throw(function () {
                  adapterInstance.set('а', 5);
               });
               assert.throw(function () {
                  adapterInstance.set('б');
               });
            });

            it('should throw an error on invalid data', function () {
               assert.throw(function () {
                  new SbisAdapter().forRecord('').set();
               });
               assert.throw(function () {
                  new SbisAdapter().forRecord(0).set(0);
               });
               assert.throw(function () {
                  new SbisAdapter().forRecord().set();
               });
            });
         });

         describe('.getEmpty()', function () {
            it('should return empty raw data', function () {
               assert.deepEqual(
                  adapterInstance.getEmpty(),
                  {d:[], s: data.s}
               );
            });
         });

         describe('.getData()', function () {
            it('should return raw data', function () {
               assert.deepEqual(
                  adapterInstance.getData(),
                  data
               );
            });
         });

      });
   }
);
