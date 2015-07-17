/**
 * Created by ad.chistyakova on 08.04.2015.
 */
define('js!SBIS3.CONTROLS.PrintUnloadBase', [
   'js!SBIS3.CONTROLS.MenuLink',
   'js!SBIS3.CORE.DialogSelector'
], function(MenuLink, Dialog) {

   var PrintUnloadBase = MenuLink.extend({
      /**
       * @event onApplyOperation Перед обработкой операции
       * Событие происходит при непосредственном выборе выгрузки или печати. Данные уже выбраны, но можно поменять колонки для выборки
       * @param {$ws.proto.EventObject} Дескриптор события.
       * @param {String} type Имя операции. print или unload (Печать или выгрузка)
       * @return Результат обработчика события.
       * Если вернуть новый набор колонок, то напечатаны будут они
       * @example
       * Структура массива с описанием строк:
       * <pre>
       *    //Мы получим кнопку только после того, как она будет нарисована, раньше нам не надо
       * massOperation.subscribe('onDrawItems', function(){
       *     this.getItemInstance('print').subscribe('onApplyOperation', function(event, type, columns){
       *        var resultColumns = [];
       *        //Есть колонки, которые не должны попасть в печать и выгрузку;
       *        for (var i = 0 , len = columns.length; i < len; i++){
       *           if (columns[i].field !== 'Опубликовано') {
       *              resultColumns.push(columns[i]);
       *           }
       *        }
       *        event.setResult(resultColumns);
       *     });
       *  });
       * </pre>
       */

      $protected: {
         _options: {
            fileName : ''
         },
         _view : undefined
      },

      $constructor: function() {
         this._publish('onApplyOperation');
      },
      /**
       * Can be implemented
       */
      _clickHandler: function() {
         PrintUnloadBase.superclass._clickHandler.apply(this, arguments);
      },
      _prepareOperation: function(title){
         var selectedItems = this._getView().getSelectedKeys(),
               selectedItemsObj = {},
               ds;
         if (!selectedItems.length) {
            this._processMassOperations(title);
         } else {
            for (var i = 0, len = selectedItems.length; i < len; i++){
               selectedItemsObj[selectedItems[i]] = true;
            }
            ds = this._getView()._dataSet.filter(function(item){
               return selectedItemsObj[item.getKey()];
            });
            this._applyOperation(ds);
         }
      },
      _getView: function(){
         return this._options.linkedView;
      },
      _processMassOperations:function(title){
         var numOfRecords = this._getView()._dataSet.getCount(),
            num = 0,
            self = this,
            ds = this._getView()._dataSet;
         if (this._getView()._hasNextPage(this._getView()._dataSet.getMetaData().more)) {
            //Показать диалог выбора записей
            new Dialog ({
               opener : this,
               template: 'js!SBIS3.CONTROLS.MassAmountSelector',
               caption : title,
               resizable: false,
               handlers: {
                  onBeforeShow: function(){
                     //this.getLinkedContext().setValue('NumOfRecords', self._getView()._dataSet.getCount()); Хочется, чтобы было так
                     //TODO Но пришлось сделать так:
                     this.getChildControlByName('controls-MassAmountSelector').getContext().setValue('NumOfRecords', numOfRecords);
                  },
                  onChange: function(event, selectedNumRecords){
                     if(selectedNumRecords > numOfRecords){
                        $ws.helpers.question('Операция займет продолжительное время. Провести операцию?', {}, self).addCallback(function(answer){
                           if (answer) {
                              self._getView()._dataSource.query(self._getView()._filter, self._getView()._sorting, 0, selectedNumRecords).addCallback(function (dataSet) {
                                 self._applyOperation(dataSet);
                              });
                           }
                        });
                     } else {
                        if (selectedNumRecords < numOfRecords) {
                           num = 0;
                           //TODO здесь должен быть не filter, а что-то типа .range - получение первых N записей
                           //Выберем selectedNumRecords записей из dataSet
                           ds = self._getView()._dataSet.filter(function(){
                              return num++ < selectedNumRecords;
                           });
                        }
                        self._applyOperation(ds);
                     }
                  }
               }
            });
         }
         else {
            self._applyOperation(ds);
         }

      },
      /**
       * Must be implemented
       * @param columns
       * @private
       */
      _notifyOnApply : function(columns){

      },
      _applyOperation : function(dataSet){
         var columns = this._getView().getColumns(),
               cfg, result;
         result = this._notifyOnApply(columns);
         if (result instanceof Array) {
            columns = result;
         }
         cfg = {
            dataSet : dataSet || this._getView()._dataSet,
            columns: columns
         };
         if ( this._options.xsl ){
            cfg.xsl = this._options.xsl;
         }
         //Снимем выделение
         this._getView().removeItemsSelectionAll();
         this.applyOperation(dataSet, cfg);
      },
      /**
       * Must be implemented
       * @param dataSet
       */
      applyOperation : function(dataSet){

      }
   });

   return PrintUnloadBase;

});