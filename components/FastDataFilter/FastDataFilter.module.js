/**
 * Created by am.gerasimov on 15.04.2015.
 */
define('js!SBIS3.CONTROLS.FastDataFilter',
   [
   "Core/constants",
   "js!SBIS3.CORE.CompoundControl",
   "js!SBIS3.CONTROLS.ItemsControlMixin",
   "js!SBIS3.CONTROLS.FilterMixin",
   'Core/Deferred',
   "js!SBIS3.CONTROLS.DropdownList",
   "tmpl!SBIS3.CONTROLS.FastDataFilter",
   "tmpl!SBIS3.CONTROLS.FastDataFilter/ItemTpl",
   'css!SBIS3.CONTROLS.FastDataFilter'
],

   function(constants, CompoundControl, ItemsControlMixin, FilterMixin, cDeferred, DropdownList, dotTplFn, ItemTpl) {

      'use strict';
      /**
       * Контрол, отображающий набор выпадающих списков SBIS3.CONTROLS.DropdownList и работающий с фильтром в контексте
       * Подробнее конфигурирование контрола описано в разделе <a href="/doc/platform/developmentapl/interface-development/components/list/list-settings/filtering/list-filterfast/">Быстрые фильтры</a>.
       * @class SBIS3.CONTROLS.FastDataFilter
       * @extends SBIS3.CORE.CompoundControl
       *
       * @author Красильников Андрей Сергеевич
       *
       * @mixes SBIS3.CONTROLS.ItemsControlMixin
       * @mixes SBIS3.CONTROLS.FilterMixin
       *
       * @demo SBIS3.Demo.Filter.FastDataFilterMultiselect
       *
       * @cssModifier controls-FastDataFilter__resize Позволяет управлять шириной выпадающих списков, вписывая их по размеру в контейнер.
       *
       * @ignoreEvents onAfterLoad onChange onStateChange
       * @ignoreEvents onDragStop onDragIn onDragOut onDragStart
       *
       * @control
       * @public
       * @category Filtering
       */
      var FastDataFilter = CompoundControl.extend([FilterMixin, ItemsControlMixin],/** @lends SBIS3.CONTROLS.FastDataFilter.prototype */{
         _dotTplFn: dotTplFn,
         $protected: {
            _options: {
               _canServerRender: true,
               itemTpl: ItemTpl,
               displayProperty: '',
               /**
                * @cfg {String} Поле в контексте, где будет храниться внутренний фильтр компонента
                * @remark
                * !Важно: Если на одной форме, в одном контексте лежит несколько хлебных фильтров, то только в этом случае стоит менять стандартное имя
                */
               internalContextFilterName : 'sbis3-controls-fast-filter',
               /**
                * @cfg {Array.<Object.<String,String>>} Массив объектов. Набор исходных данных, по которому строятся выпадающие списки
                * @remark
                * !Важно: каждый item - это настройка для выпадающего списка
                * !Важно: данные для коллекции элементов можно задать либо в этой опции,
                * либо через источник данных методом {@link setDataSource}.
                * !Важно: name(имя фильтра) должен совпадать с internalValueField в FilterStructure, чтобы правильно заработала синхронизация
                * !Важно: На данный момент лучше описывать опции в Module (как это сделано в примере), а не в верстке xhtml, при описании в верстве нужно самостоятельно вызвать reload
                * @example
                * <pre>
                *    items: [{
                *       idProperty : 'key',    //Имя поля с ключом из списка значений values
                *       displayProperty: 'title',//Имя поля, в котором хранится текстовое отображение ключа из списка значений values
                *       name: 'first',        //Имя фильтра
                *       multiselect : false,  //Режим выпадающего списка
                *       className: 'controls-DropdownList__withoutCross', //Строка с классами css-модификаторов для выпадающего списка
                *       values:[                //Набор элементов выпадающего списка
                *       {
                *          key : 0,
                *          title : 'Заголовок'
                *       },
                *       {
                *          key : 1,
                *          title : 'Один'
                *       },
                *       {
                *          key : 2,
                *          title : 'Два'
                *       },
                *       {
                *           key : 3,
                *          title : 'Три'
                *       },
                *       {
                *           key : 4,
                *          title : 'Четыре'
                *       },
                *       {
                *           key : 5,
                *          title : 'Пять'
                *       }
                *    ]
                *  }]
                * </pre>
                * @see idProperty
                * @see displayProperty
                * @see setDataSource
                * @see getDataSet
                */
               items: []
            }
         },
         _drawItemsCallbackSync: function(){
            this._setSelectionToItemsInstances();
         },

         _drawItemsCallback: function(){
            var instances = this.getItemsInstances();
            for (var i in instances) {
               if (instances.hasOwnProperty(i)) {
                  this._subscribeItemToHandlers(instances[i])
               }
            }
            this._recalcDropdownWidth();
            this._setItemPositionForIE10();
         },
         //Очень рано обрадовался и удалил костыли под ie10, приходится возвращать :(
         _setItemPositionForIE10: function(){
            //Дичайший баг в ie - если установлено несколько выпадающий списков - 1 из них визуально пропадает
            //Не отдебагать, т.к. при любом взаимодействии с dom'ом идет перерисовка узлов и выпадающий список появляется
            //Добавил костыль: вызываю перерисовку узла, задавая min-width
            if (constants.browser.isIE10){
               setTimeout(function(){
                  this.getContainer().find('.controls-DropdownList').css('min-width', '10px');
               }.bind(this), 200);
            }
         },
         _getCurrentContext : function(){
            return this.getLinkedContext();
         },
         _subscribeItemToHandlers : function(item){
            var self = this;

            this.subscribeTo(item, 'onClickMore', function(){
               self._notify('onClickMore', item);
            });

            this.subscribeTo(item, 'onSelectedItemsChange', function(event, idArray){
               var idx = self._getFilterSctructureItemIndex(this.getContainer().data('id')),
                   text = [],
               //Если выбрали дефолтное значение, то нужно взять из resetValue
               //TODO может быть всегда отдавать массивом?
                   filterValue =  idArray.length === 1 && (idArray[0] === this.getDefaultId()) && self._filterStructure[idx] ? self._filterStructure[idx].resetValue :
                         (this._options.multiselect ?  idArray : idArray[0]);
               //TODO Непонятно как это сделать в обратную сторону (когда из контекста кришло значение его нужно поставить в dropdownList)
               //В контексте текуший DropdownList, у него задавали поле с фильтром
               //Если не нашли, значит искать мне это надо как-то по-другому....
               if (idx >= 0) {
                  this.getSelectedItems(true).addCallback(function(list) {
                     self._filterStructure[idx].value = filterValue;

                     list.each(function (rec) {
                        text.push(rec.get(this._options.displayProperty));
                     }.bind(this));

                     self._filterStructure[idx].caption = self._filterStructure[idx].value === undefined
                         ? self._filterStructure[idx].resetCaption
                         : text.join(', ');
                     self.applyFilter();
                     return list;
                  }.bind(this));
               }
               self._setItemPositionForIE10();
            });
         },
         _recalcDropdownWidth: function () {
            this._resetMaxWidth();
            var dropdownLists = $('.controls-DropdownList', this.getContainer());
            dropdownLists.sort(function (el1, el2) {
               return $(el1).width() - $(el2).width();
            });
            for (var i = 0, l = dropdownLists.length; i < l; i++) {
               $(dropdownLists[i]).addClass('ws-flex-shrink-' + (i + 1));
            }
         },

         _resetMaxWidth: function(){
            var dropdownContainer = $('.controls-DropdownList', this.getContainer());
            for (var i = 0; i < dropdownContainer.length; i++) {
               if (i in dropdownContainer) {
                  $(dropdownContainer[i]).removeClass(this._getFlexShrinkClasses());
               }
            }
         },

         _getFlexShrinkClasses: function () {
            var out = '';
            for (var i = 0; i < 13; i++) {
               out += 'ws-flex-shrink-' + i + ' ';
            }
            return out;
         },

         _onResizeHandler: function(){
            clearTimeout(this._resizeTimeout);
            var self = this;
            this._resizeTimeout = setTimeout(function () {
                  self._recalcDropdownWidth();
            }, 100);
         },

         _recalcInternalContext: function() {
            var
               changed = this._filterStructure.reduce(function(result, element) {
                  return result || element.resetValue !== element.value;
               }, false);

            this.getLinkedContext().setValueSelf({
               filterChanged: changed,
               filterStructure: this._filterStructure
            });
            this._setSelectionToItemsInstances();
         },
         _setSelectionToItemsInstances: function () {
            var instances = this.getItemsInstances();
            for (var i in instances) {
               if (instances.hasOwnProperty(i)) {
                  var fsObject = this._filterStructure[this._getFilterSctructureItemIndex(instances[i].getContainer().attr('data-id'))],
                     value = (fsObject.hasOwnProperty('value') && fsObject.value !== undefined) ? instances[i]._options.multiselect ? fsObject.value : [fsObject.value] : [instances[i].getDefaultId()];
                  if (instances[i].getItems()) {
                     this._setSelectedKeyByFilterStructure(instances[i], value);
                  }
                  else {
                     instances[i].once('onItemsReady', function (instance, val) {
                        this._setSelectedKeyByFilterStructure(instance, val);
                     }.bind(this, instances[i], value));
                  }
               }
            }
         },

         _setSelectedKeyByFilterStructure: function (instance, value) {
            this._prepareValue(instance, value).addCallback(function (value) {
               if (!this._isSimilarArrays(instance.getSelectedKeys(), value) && !instance.isDestroyed()) {
                  instance.setSelectedKeys(value);
               }
            }.bind(this));
         },

         _prepareValue: function(instance, newKeys){
            //В структуре resetValue может содержать ключ, которого нет в выпадающем списке
            //В этом случае мы должны выставить первую запись, которая содержится в наборе данных
            var def = new cDeferred();
            var items = instance.getItems();
            if (items && items.getRecordById(newKeys[0])){
               return def.callback(newKeys);
            }
            //Проверки на текущем наборе данных недостаточно, multiSelectable может пойти на БЛ за записью с указанным ключом.
            //todo Нужно рассмотреть возможность отказаться от этого поведения, выписал задачу в 230 https://inside.tensor.ru/opendoc.html?guid=a40189c0-f472-46cf-bd3c-44e641d3ebb9&des=
            if (instance.getDataSource() && newKeys[0] !== null){
               instance.getDataSource().read(newKeys[0]).addCallbacks(
                  function () {
                     def.callback(newKeys);
                  },
                  function() {
                     def.callback([instance.getDefaultId()]);
                  }
               );
               return def;
            }
            return def.callback([instance.getDefaultId()]);
         },
         //TODO это дублЬ! нужно вынести в хелпер!!!
         _isSimilarArrays : function(arr1, arr2){
            if (arr1.length === arr2.length) {
               for (var i = 0; i < arr1.length; i ++) {
                  if (arr1[i] != arr2[i]) {
                     return false;
                  }
               }
               return true;
            }
            return false;
         },

         setFilter: function() {
            //Избавляюсь от гонки миксинов, на ItemsControlM и FilterM есть методы setFilter. На компоненте должен вызываться метод с ICM
            ItemsControlMixin.setFilter.apply(this, arguments);
         }
      });
      return FastDataFilter;
   });
