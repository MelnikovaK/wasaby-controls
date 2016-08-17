/**
 * Created by ad.chistyakova on 08.04.2015.
 */
//TODO: Сейчас печать и выгрузка очень напоминают старые контролы, где нет общих точек и вообще не понятно что происходит.
//Невероятное ветвление кода, и вроде бы таки одинаковые вещи как выгрузка всех записей и выгрузка выбранных совершенно в разных ветках.
//Нужно сделать общую точку входа, и ветвление только непосредственно перед вызовом тех или иннных функций бл.
define('js!SBIS3.CONTROLS.PrintUnloadBase', [
   'js!SBIS3.CONTROLS.MenuLink',
   'js!SBIS3.CORE.DialogSelector',
   'js!WS.Data/Adapter/Sbis',
   'js!WS.Data/Collection/RecordSet'
], function(MenuLink, Dialog, SbisAdapter, RecordSet) {
   //TODO: ограничение на максимальное количество записей, получаемое на клиент для печати/выгрузки.
   //Необходимо т.к. на сервере сейчас невозможно произвести xsl преобразование. Выписана задача:
   //(https://inside.tensor.ru/opendoc.html?guid=f852d5cc-b75e-4957-9635-3401e1832e80&description=)
   //Когда задача будет сделана, нужно перейти полностью на серверные механизмы выгрузки и печати.
   var MAX_RECORDS_COUNT = 20000;
   /**
    * Базовый контрол для работы с ListView. Подготовливает данные для печати и выгрузки
    * @class SBIS3.CONTROLS.PrintUnloadBase
    * @extends SBIS3.CONTROLS.MenuLink
    * @author Крайнов Дмитрий Олегович
    * @control
    * @public
    */
   var PrintUnloadBase = MenuLink.extend(/** @lends SBIS3.CONTROLS.PrintUnloadBase.prototype */{
      /**
       * @event onApplyOperation Перед обработкой операции
       * Событие происходит при непосредственном выборе выгрузки или печати. Данные уже выбраны, но можно поменять колонки для выборки
       * @param {$ws.proto.EventObject} eventObject Дескриптор события.
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
         this._onOperationActivated();
         PrintUnloadBase.superclass._clickHandler.apply(this, arguments);
      },

      _onOperationActivated: function() {
      },

      _prepareOperation: function(title){
         var
             selectedRecordSet,
             selectedItems = this._getView().getSelectedItems();
         if (!selectedItems || selectedItems.getCount() === 0) {
            this._processMassOperations(title);
         } else {
            selectedRecordSet = new RecordSet({
               adapter: 'adapter.sbis'
            });
            selectedRecordSet.assign(selectedItems);
            this._applyOperation(selectedRecordSet);
         }
      },
      _getView: function(){
         return this._options.linkedView;
      },
      _processMassOperations:function(title){
         var numOfRecords = this._getView().getItems().getCount(),
            self = this,
            ds = this._getView().getItems();
         if (this._getView()._hasNextPage(this._getView().getItems().getMetaData().more)) {
            //Показать диалог выбора записей
            new Dialog ({
               opener : this,
               template: 'js!SBIS3.CONTROLS.MassAmountSelector',
               caption : title,
               handlers: {
                  onBeforeShow: function(){
                     //this.getLinkedContext().setValue('NumOfRecords', self._getView()._dataSet.getCount()); Хочется, чтобы было так
                     //TODO Но пришлось сделать так:
                     this.getChildControlByName('controls-MassAmountSelector').getContext().setValue('NumOfRecords', numOfRecords);
                  },
                  onChange: function(event, pageSize){
                     self.processSelectedPageSize(pageSize);
                  }
               }
            });
         }
         else {
            //self._applyOperation(ds);
            self._applyMassOperation(ds);
         }

      },
      /**
       * Must be implemented
       * @param columns
       * @private
       */
      _notifyOnApply : function(columns){

      },
      _applyMassOperation : function(ds){
         this._applyOperation(ds);
      },
      _applyOperation : function(dataSet){
         var columns = this._prepareOperationColumns(),
             cfg;
         cfg = {
            dataSet : dataSet || this._getView().getItems(),
            columns: columns
         };
         this.applyOperation(cfg);
      },
      _prepareOperationColumns: function(){
         var columns = this._getView().getColumns(),
             result;
         result = this._notifyOnApply(columns);
         if (result instanceof Array) {
            columns = result;
         }
         return columns;
      },
      /**
       * Обрабатываем выбранные пользователем записи. Здесь подготавливаем dataSet либо подготавливаем
       * фильтр для выгрузки данных полностью на сервере
       * @param pageSize - количество записей, есди передать undefined, то значит, что нужны вообще все записи
       */
      processSelectedPageSize: function(pageSize){
         var ds = this._getView().getItems(),
            numOfRecords = ds.getCount(),
            num = 0,
            self = this;
         if(pageSize > numOfRecords || !pageSize){
            this._loadFullData(pageSize || undefined).addCallback(function(dataSet){
               self._applyOperation(dataSet);
            }).addErrback(function(err){
              return err;
            });
         } else {
            if (pageSize < numOfRecords) {
               num = 0;
               //TODO здесь должен быть не filter, а что-то типа .range - получение первых N записей
               //Выберем pageSize записей из dataSet
               ds = self._getView().getItems().filter(function(){
                  return num++ < pageSize;
               });
            }
            self._applyOperation(ds);
         }
      },
      _loadFullData: function(pageSize){
         var deferred = new $ws.proto.Deferred(),
            self = this;
         $ws.helpers.question('Операция займет продолжительное время. Провести операцию?', {}, self).addCallback(function(answer){
            if (answer) {
               $ws.helpers.toggleIndicator(true);
               self._getView()._callQuery(self._getView().getFilter(), self._getView().getSorting(),0,  pageSize || MAX_RECORDS_COUNT).addCallback(function (dataSet) {
                  deferred.callback(dataSet)
               }).addBoth(function() {
                  $ws.helpers.toggleIndicator(false);
               });
            } else{
               deferred.errback();
            }
         });
         return deferred;
      },
      /**
       * @deprecated Переименован в processSelectedPageSize
       * @param pageSize
       */
      processSelectedOperation: function(pageSize){
         this.processSelectedPageSize(pageSize)
      },
      /**
       * Must be implemented
       * @param dataSet
       */
      applyOperation : function(){

      }
   });

   return PrintUnloadBase;

});