/**
 * Created by am.gerasimov on 16.06.2016.
 */
define('SBIS3.CONTROLS/Link/LinkFieldController', [
   'Core/Abstract',
   'Core/Deferred',
   'Core/ParallelDeferred',
   'Core/core-instance',
   'Core/helpers/Object/find'
], function(Abstract, Deferred, ParallelDeferred, instance, objectFind){

   'use strict';

   var ABSTRACT_FIELD_NAME = '*';

   var _private = {
      callSourceMethod: function(source, elem, readMetaData) {
         var isMemory = instance.instanceOfModule(source, 'WS.Data/Source/Memory'),
             method = isMemory ? 'read' : 'call',
             sourceBindings, callArgs;

         if(isMemory) {
            callArgs = [elem.value];
         } else {
            sourceBindings = source.getBinding();
            callArgs = [sourceBindings.read, {
               'ИдО': elem.value,
               'ИмяМетода': sourceBindings.format || null,
               'Связь': elem.field
            }];
            
            if(readMetaData) {
               wsCoreMerge(callArgs[1], readMetaData);
            }
         }

         return source[method].apply(source, callArgs);
      },

      prepareRecord: function(rec) {
        return rec.getRow ? rec.getRow() : rec;
      }
   };

   /**
    * Контроллер, который умеет обновлять поля связной записи при изменении идентификатора свзяи.
    * @class SBIS3.CONTROLS/Link/LinkFieldController
    * @extends SBIS3.CORE.Abstract
    * @author Герасимов А.М.
    * @public
    */

   return Abstract.extend({
      $protected: {
         _options: {
            /**
             * @cfg {WS.Data/Source/ISource} Источник данных
             * @example
             *   var dataSource = new SbisService({
             *       endpoint: 'СообщениеОтКлиента'
             *       binding: {
             *          read: 'Прочитать',
             *          format: 'Список'
             *          }
             *       idProperty: '@СообщениеОтКлиента'
             *    });
             * @see setDataSource
             * @see getDataSource
             */
            dataSource: null,
            /**
             * @typedef {Array} observableFields
             * @property {field} field Имя отслеживаемого поля.
             * @property {Object} map Мапинг полей вычитываемой записи к отслеживаемой.
             */
            /**
             * @cfg {observableFields[]} Набор полей, которые отслеживаются в переданной записи.
             * @remark
             * Чтобы происходила очистка связных полей при сбросе отслеживаемого поля(без загрузки связной записи), надо задать мапинг на поля отслеживамой записи.
             * @example
             * <pre>
             *    <options name="observableFields" type="array">
             *       <options>
             *          <option name="field">ДолжностьСотрудника.Сотрудник</option>
             *          <options name="map">
             *             <option name="Сотрудник.*">Сотрудник.*</option>
             *             <option name="ДолжностьСотрудника.*">ЧастноеЛицо.ДолжностьСотрудника.*</option>
             *          </options>
             *       </options>
             *    </options>
             * </pre>
             */
            observableFields: [],
            /**
             * @cfg {WS.Data/Entity/Record} Запись, в которой отслеживается изменение полей.
             * @remark
             * Чтобы установить запись, используют метод {@link setRecord}.
             * @see setRecord
             * @see dataSource
             */
            record: null,
            /**
             * @cfg {Object} Дополнительные мета-данные, которые будут переданы в метод прочитать
             */
            readMetaData: null
         },

         _recordChangeHandler: null
      },

      $constructor: function() {
         this._recordChangeHandler = this._processRecordFieldChange.bind(this);
         this._subscribeRecordEvent();
      },

      /**
       * Устанавливает запись в которой отслеживаются изменения полей.
       * @param {WS.Data/Entity/Model} record Запись источника данных.
       * @see record
       */
      setRecord: function(record) {
         this._unsubscribeRecordEvent();
         this._options.record = record;
         this._subscribeRecordEvent();
      },

      /**
       * Возвращает запись в которой отслеживаются изменения полей.
       * @returns {WS.Data/Entity/Model|null}
       * @see record
       */
      getRecord: function() {
         return this._options.record;
      },

      updateLinkFields: function(fieldsToUpdate) {
         var readDeferred = new ParallelDeferred(),
             updatedFields = {},
             self = this;

         /* Загрузим сразу все изменения, чтобы применить пачкой */
         fieldsToUpdate.forEach(function(elem) {
            if(elem.value !== null) {
               readDeferred.push(_private.callSourceMethod(self._options.dataSource, elem, self._options.readMetaData).addCallback(function (rec) {
                  var
                     loadedRecord = _private.prepareRecord(rec),
                     fieldsToChange = self._getFieldsToChange(elem.field, loadedRecord, elem.map);

                  /* Запомним изменения, чтобы применить их пачкой */
                  for (var key in fieldsToChange) {
                     if(fieldsToChange.hasOwnProperty(key)) {
                        updatedFields[fieldsToChange[key]] = loadedRecord.get(key);
                     }
                  }

                  return rec;
               }));
            } else {
               self._getFieldsToDelete(elem.field, elem.map).forEach(function(value) {
                  updatedFields[value] = null;
               });

               readDeferred.push((new Deferred()).callback());
            }
         });

         readDeferred.done().getResult().addCallback(function() {
            self.getRecord().set(updatedFields);
         });
      },

      /**
       * Возвращает поля для удаление в отслеживаемой записи по маппингу
       * @param field
       * @param map
       * @private
       */
      _getFieldsToDelete: function(field, map) {
         var recordFormat = this.getRecord().getFormat(),
             toDelete = [],
             formatName, correctValue;

         if (map) {
            for (var key in map) {
               if (map.hasOwnProperty(key)) {
                  if(map[key].indexOf(ABSTRACT_FIELD_NAME) !== -1) {
                     correctValue = map[key].replace(ABSTRACT_FIELD_NAME, '');
                     recordFormat.each(function(format) {
                        formatName = format.getName();

                        if(formatName.beginsWith(correctValue)) {
                           toDelete.push(formatName);
                        }
                     })
                  } else {
                     toDelete.push(map[key]);
                  }
               }
            }
         }

         return toDelete;
      },

      /**
       * Возвращает изменённые поля в отслеживаемой записи по маппингу
       * @param field
       * @param record
       * @param map
       * @private
       */
      _getFieldsToChange: function(field, record, map) {
         var recFormat = this.getRecord().getFormat(),
             loadedRecFormat = record.getFormat(),
             toChange = {},
             recFormatName, loadedRecFormatName, commonFieldPart, correctKey;

         if(map) {
            for (var key in map) {
               if(map.hasOwnProperty(key)) {
                  /* Если в поле маппинга присутствует разделитель '*',
                   то будем искать этому полю соответствия */
                  if (key.indexOf(ABSTRACT_FIELD_NAME) !== -1) {
                     correctKey = key.replace(ABSTRACT_FIELD_NAME, '');

                     loadedRecFormat.each(function (format) {
                        loadedRecFormatName = format.getName();

                        /* Если нашли нужное поле в формате записи,
                         то надо найти соответствующее поле в формате отслеживаемой записи */
                        if (loadedRecFormatName.beginsWith(correctKey)) {
                           /* Выделим общую часть в загруженной записи и в отслеживаемой */
                           commonFieldPart = loadedRecFormatName.replace(correctKey, '');

                           recFormat.each(function (recFormat) {
                              recFormatName = recFormat.getName();

                              if (recFormatName.replace(map[key].replace(ABSTRACT_FIELD_NAME, ''), '') === commonFieldPart) {
                                 toChange[loadedRecFormatName] = recFormatName;
                              }
                           });
                        }
                     });
                  } else {
                     toChange[key] = map[key];
                  }
               }
            }
         }

         return toChange;
      },

      /**
       * Обработчик на смену полей в записи,
       * если изменились отслеживаемые поля, то обновит запись
       * @param event
       * @param changes
       * @private
       */
      _processRecordFieldChange: function(event, changes) {
         var self = this;
         /* За один раз может измениться несколько полей, которые мы отслеживаем,
            надо сразу обновить все пачкой */
         var fieldsToUpdate = Object.keys(changes).reduce(function(result, field) {
            var obsField =  objectFind(self._options.observableFields, function(elem) {
               return elem.field === field;
            });

            if(obsField) {
               result.push({
                  field: field,
                  value: changes[field],
                  map: obsField.map
               });
            }

            return result;
         }, []);


         if(fieldsToUpdate.length) {
            this.updateLinkFields(fieldsToUpdate);
         }
      },

      /**
       * Подписывается на изменения записи
       * @private
       */
      _subscribeRecordEvent: function() {
         var record = this.getRecord();

         if(record) {
            this.subscribeTo(record, 'onPropertyChange', this._recordChangeHandler);
         }
      },

      /**
       * Отписывается от изменений записи
       * @private
       */
      _unsubscribeRecordEvent: function() {
         var record = this.getRecord();

         if(record) {
            this.unsubscribeFrom(record, 'onPropertyChange', this._recordChangeHandler);
         }
      }
   });
});