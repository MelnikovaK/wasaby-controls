/**
 * Created by as.suhoruchkin on 21.07.2015.
 */
define('js!SBIS3.CONTROLS.MoveHandlers', ['js!SBIS3.CORE.Dialog','js!SBIS3.CONTROLS.Data.MoveStrategy.Sbis', 'js!SBIS3.CONTROLS.Data.MoveStrategy.Base', 'i18n!SBIS3.CONTROLS.MoveHandlers'], function(Dialog, SbisMoveStrategy, BaseMoveStrategy) {
   var MoveHandlers = {
      $protected: {
        _moveStrategy: undefined
      },
      moveRecordsWithDialog: function(records) {
         var self = this;
         records = this._getRecordsForMove(records);
         if (records.length) {
            new Dialog({
               template: 'js!SBIS3.CONTROLS.MoveDialogTemplate',
               title: rk('Перенести') + ' ' + records.length + $ws.helpers.wordCaseByNumber(records.length, ' ' + rk('записей'), ' ' + rk('запись', 'множественное'), ' ' + rk('записи')) + ' ' + rk('в'),
               cssClassName: 'controls-moveDialog',
               componentOptions: {
                  linkedView: this,
                  records: records,
                  handlers: {
                     onPrepareFilterOnMove: function(event, rec) {
                        event.setResult(self._notify('onPrepareFilterOnMove', rec))
                     }
                  }
               }
            });
         }
      },
      _getRecordsForMove: function(records) {
         if (!Array.isArray(records) || !records.length) {
            var selItems = this.getSelectedItems(false),
                key = this.getSelectedKey();

            if(selItems && selItems.getCount()) {
               records = selItems.toArray();
            } else {
               records = key ? [key] : [];
            }
         }
         return records;
      },
      selectedMoveTo: function(moveTo) {
         var selectedItems = this.getSelectedItems(false);
         this._move(selectedItems ? selectedItems.toArray() : [], moveTo);
      },
      //TODO: Унифицировать параметр moveTo, чтобы в него всегда приходил record.
      _move: function(records, moveTo, insertAfter) {
         var
            recordTo,
            deferred,
            self = this,
            isNodeTo = true,
            isChangeOrder = insertAfter !== undefined;

         if (moveTo !== null) {
            if ($ws.helpers.instanceOfModule(moveTo, 'SBIS3.CONTROLS.Data.Model')) {
               recordTo = moveTo;
               moveTo = recordTo.getId();
            } else {
               recordTo = this._options._items.getRecordById(moveTo);
            }
            if (recordTo) {
               isNodeTo = recordTo.get(this._options.hierField + '@');
            }
         } else {
            recordTo = moveTo;
         }

         if (this._checkRecordsForMove(records, recordTo, isChangeOrder)) {
            for (var i = 0; i < records.length; i++) {
               records[i] = $ws.helpers.instanceOfModule(records[i], 'SBIS3.CONTROLS.Data.Model') ?
                  this.getItems().getRecordById(records[i].getId()) : //todo может прийти рекорд инстанса которого нет в рекордсете замеять все рекорды для этого плохо.
                  this._options._items.getRecordById(records[i]);
            }
            this._toggleIndicator(true);

            if (isNodeTo && !isChangeOrder) {
               deferred = this.getMoveStrategy().hierarhyMove(records, recordTo);
            } else {
               deferred = this.getMoveStrategy().move(records, recordTo, insertAfter);
            }
            deferred = deferred === true ? new $ws.proto.Deferred().callback(true) : deferred;
            if (deferred instanceof $ws.proto.Deferred) {//обновляем view если вернули true либо deferred
               deferred.addCallback(function() {
                  if (isChangeOrder) {
                     self._afterOrderChange(records, recordTo, !insertAfter);
                  } else {
                     //TODO: пока дерево не перевели на проекции, нужно пересчитывать дерево индексов, т.к. после set
                     //в поле иерархии он сам этого не сделает
                     self._options._items._reindexTree(self._options.hierField);
                     self.removeItemsSelectionAll();
                  }
               }).addBoth(function() {
                  self._toggleIndicator(false);
               });
            } else {
               self._toggleIndicator(false);
            }
         }
      },
      _checkRecordsForMove: function(records, recordTo, isChangeOrder) {
         var
            key,
            toMap = [];
         if (recordTo === undefined) {
            return false;
         }
         if (recordTo !== null && $ws.helpers.instanceOfMixin(this, 'SBIS3.CONTROLS.TreeMixin')) {
            toMap = this._getParentsMap(recordTo.getId());
            for (var i = 0; i < records.length; i++) {
               key = '' + (($ws.helpers.instanceOfModule(records[i], 'SBIS3.CONTROLS.Record')||$ws.helpers.instanceOfModule(records[i], 'SBIS3.CONTROLS.Data.Model')) ? records[i].getId() : records[i]);
               if ($.inArray(key, toMap) !== -1) {
                  return false;
               }
               if (recordTo !== null && !isChangeOrder && !recordTo.get(this._options.hierField + '@')) {
                  return false;
               }
            }
         }

         return true;
      },
      _getParentsMap: function(parentKey) {
         var
            dataSet = this.getItems(),
            hierField = this.getHierField(),
            /*
               TODO: проверяем, что не перемещаем папку саму в себя, либо в одного из своих детей.
               В текущей реализации мы можем всего-лишь из метаданных вытащить путь от корня до текущего открытого раздела.
               Это костыль, т.к. мы расчитываем на то, что БЛ при открытии узла всегда вернет нам путь до корня.
               Решить проблему можно следующими способами:
               1. во первых в каталоге номенклатуры перемещение сделано не по стандарту. при нажатии в операциях над записью кнопки "переместить" всегда должен открываться диалог выбора папки. сейчас же они без открытия диалога сразу что-то перемещают и от этого мы имеем проблемы. Если всегда перемещать через диалог перемещения, то у нас всегда будет полная иерархия, и мы сможем определять зависимость между двумя узлами, просто пройдясь вверх по иерархии.
               2. тем не менее это не отменяет сценария обычного Ctrl+C/Ctrl+V. В таком случае при операции Ctrl+C нам нужно запоминать в метаданные для перемещения текущую позицию иерархии от корня (если это возможно), чтобы в будущем при вставке произвести анализ на корректность операции
               3. это не исключает ситуации, когда БЛ не возвращает иерархию до корня, либо пользователь самостоятельно пытается что-то переместить с помощью интерфейса IDataSource.move. В таком случае мы считаем, что БЛ вне зависимости от возможности проверки на клиенте, всегда должна проверять входные значения при перемещении. В противном случае это приводит к зависанию запроса.
            */
            path = dataSet.getMetaData().path,
            toMap = path ? $.map(path.getChildItems(), function(elem) {
               return '' + elem;
            }) : [];
         var record = dataSet.getRecordByKey(parentKey);
         while (record) {
            parentKey = '' + record.getId();
            if ($.inArray(parentKey, toMap) === -1) {
               toMap.push(parentKey);
            }
            parentKey = dataSet.getParentKey(record, hierField);
            record = dataSet.getRecordByKey(parentKey);
         }
         return toMap;
      },
      /**
       * Возвращает стратегию перемещения
       * @see SBIS3.CONTROLS.Data.MoveStrategy.IMoveStrategy
       * @returns {SBIS3.CONTROLS.Data.MoveStrategy.IMoveStrategy}
       */
      getMoveStrategy: function () {
         return this._moveStrategy || (this._moveStrategy = this._makeMoveStrategy());
      },
      /**
       * Создает стратегию перемещения в зависимости от источника данных
       * @returns {SBIS3.CONTROLS.Data.MoveStrategy.IMoveStrategy}
       * @private
       */
      _makeMoveStrategy: function () {
         if($ws.helpers.instanceOfModule(this._dataSource,'SBIS3.CONTROLS.Data.Source.SbisService') ||
            $ws.helpers.instanceOfModule(this._dataSource,'SBIS3.CONTROLS.SbisServiceSource')
         ) {
            return new SbisMoveStrategy({
               dataSource: this._dataSource,
               hierField: this._options.hierField,
               listView: this
            });
         } else {
            return new BaseMoveStrategy({
               dataSource: this._dataSource,
               hierField: this._options.hierField
            });
         }
      },
      /**
       * Устанавливает стратегию перемещения
       * @see SBIS3.CONTROLS.Data.MoveStrategy.IMoveStrategy
       * @param {SBIS3.CONTROLS.Data.MoveStrategy.IMoveStrategy} strategy - стратегия перемещения
       */
      setMoveStrategy: function (strategy){
         if(!$ws.helpers.instanceOfMixin(strategy,'SBIS3.CONTROLS.Data.MoveStrategy.IMoveStrategy')){
            throw new Error('The strategy must implemented interfaces the SBIS3.CONTROLS.Data.MoveStrategy.IMoveStrategy.')
         }
         this._moveStrategy = strategy;
      },

      moveRecordDown: function(tr, id, record) {
         var nextItem = this.getNextItemById(id);
         if(nextItem) {
            this._moveRecord(record, nextItem.data('id'), id, false);
         }
      },

      moveRecordUp: function(tr, id, record) {
         var prevItem = this.getPrevItemById(id);
         if(prevItem) {
            this._moveRecord(record, prevItem.data('id'), id, true);
         }
      },
      _moveRecord: function(item, moveToId, current, up) {
         var self = this,
             moveToItem = this._options._items.getRecordById(moveToId);
         this.getMoveStrategy().move([item], moveToItem, !up).addCallback(function() {
            self._afterOrderChange([item], moveToItem, up);
         }).addErrback(function(e) {
            $ws.core.alert(e.message);
         });
      },
      _afterOrderChange: function(items, moveToItem, up) {
         this._options._itemsProjection.setEventRaising(false, true);
         var moveToIndex;
         $ws.helpers.forEach(items, function(item) {
            var projectionItem =  this._options._itemsProjection.getItemBySourceItem(item);
            if(up) { //Если перемещаем вверх то надо вставить запись с индексом к которой перемещаем. Потому элемент выше удален и индексы смещены на 1
               moveToIndex = this._options._items.getIndex(moveToItem);
               moveToIndex = moveToIndex > -1 ?  moveToIndex : 0;
            } else {
               //Если перемещаем вниз то нужно найти следующий элемент в проекции потом его индекс в рекордсете
               //и вставить запись после него, потомучто может быть перемещение через dragndrop а оно может вставить куда угодно.
               var nextProjectionItem = this._options._itemsProjection.getNext(
                  this._options._itemsProjection.getItemBySourceItem(moveToItem)
               );
               if(nextProjectionItem) {
                  moveToIndex = this._options._itemsProjection.getSourceIndexByIndex(
                     this._options._itemsProjection.getIndex(nextProjectionItem)
                  );
               } else { //если не найден то вставляем в конец
                  moveToIndex = this._options._items.getCount();
               }
            }
            this._options._items.remove(item);

            this._options._items.add(
               item,
               moveToIndex < this._options._items.getCount() ? moveToIndex : undefined
            );
            //todo нужно сделать цепочки операций на рекордсете тогда можно будет объединить remove и add
            //todo а пока создается новый элемент проекции и если он был открыт то восттановим ему состояние
            if ($ws.helpers.instanceOfModule(projectionItem, 'SBIS3.CONTROLS.Data.Projection.TreeItem') && projectionItem.isExpanded()) {
               this._options._itemsProjection.getItemBySourceItem(item).setExpanded(true);
            }
         }.bind(this));
         this._options._itemsProjection.setEventRaising(true, true);
      }
   };

   return MoveHandlers;
});