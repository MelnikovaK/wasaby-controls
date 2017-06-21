/**
 * Created by am.gerasimov on 15.02.2017.
 */
define('js!SBIS3.CONTROLS.ToSourceModel', [
   'js!WS.Data/Di',
   'Core/core-instance',
   'Core/core-functions',
   'js!WS.Data/Chain',
   'js!WS.Data/Utils'
], function(Di, cInstance, cFunc, Chain, Utils) {

   function getModel(model, config) {
      return typeof model === 'string' ? Di.resolve(model, config) : new model(config)
   }
   /**
    * Приводит записи к модели источника данных
    * @param {WS.Data/Collection/IList|Array} items массив записей
    * @param {WS.Data/Source/ISource} dataSource Источник
    * @param {String} idProperty поле элемента коллекции, которое является идентификатором записи.
    * @returns {WS.Data/Collection/IList|undefined|Array}
    */
   return function toSourceModel(items, dataSource, idProperty, saveParentRecordChanges) {
      var dataSourceModel, dataSourceModelInstance, parent, changedFields, newRec;

      if(items) {
         if(dataSource && cInstance.instanceOfMixin(dataSource, 'WS.Data/Source/ISource')) {
            dataSourceModel = dataSource.getModel();
            /* Создадим инстанс модели, который указан в dataSource,
             чтобы по нему проверять модели которые выбраны в поле связи */
            dataSourceModelInstance = getModel(dataSourceModel, {});

            /* FIXME гразный хак, чтобы изменение рекордсета не влекло за собой изменение родительского рекорда
             Удалить, как Леха Мальцев будет позволять описывать более гибко поля записи, и указывать в качестве типа прикладную модель.
             Задача:
             https://inside.tensor.ru/opendoc.html?guid=045b9c9e-f31f-455d-80ce-af18dccb54cf&description= */
            if(cInstance.instanceOfMixin(items, 'WS.Data/Entity/OneToManyMixin')) {
               parent = items._getMediator().getParent(items);

               if (parent && cInstance.instanceOfModule(parent, 'WS.Data/Entity/Model')) {
                  if(saveParentRecordChanges) {
                     changedFields = cFunc.clone(parent._changedFields);
                  } else {
                     Utils.logger.error('ToSourceModel: модель, указанная для источника контрола '+
                        'отличается от модели переданного рекордсета. Возможны изменения в родительской записи.')
                  }
               }
            }

            Chain(items).each(function(rec, index) {
               /* Создадим модель указанную в сорсе, и перенесём адаптер и формат из добавляемой записи,
                чтобы не было конфликтов при мерже полей этих записей */
               if(dataSourceModelInstance._moduleName !==  rec._moduleName) {
                  (newRec = getModel(dataSourceModel, { adapter: rec.getAdapter(), format: rec.getFormat() })).merge(rec);
                  if(cInstance.instanceOfMixin(items, 'WS.Data/Collection/IList')) {
                     items.replace(newRec, index);
                  } else {
                     items[index] = newRec;
                  }
               }
            });

            if(changedFields) {
               parent._changedFields = changedFields;
            }
         }

         /* Элементы, установленные из дилогов выбора / автодополнения могут иметь другой первичный ключ,
            отличный от поля с ключём, установленного в поле связи. Это связно с тем, что "связь" устанавливается по опеределённому полю,
            и не обязательному по первичному ключу у записей в списке. */
         Chain(items).each(function(rec) {
            if(cInstance.instanceOfModule(rec, 'WS.Data/Entity/Model') &&  rec.getIdProperty() !== idProperty && rec.get(idProperty) !== undefined) {
               rec.setIdProperty(idProperty);
            }
         });
      }

      return items;
   };
});