/**
 * Created by iv.cheremushkin on 21.04.2015.
 */
define('js!SBIS3.CONTROLS.DropdownListMixin', ['js!SBIS3.CONTROLS.Utils.TemplateUtil'],
    function (TemplateUtil) {
        /**
         * @mixin SBIS3.CONTROLS.DropdownListMixin
         * @public
         * @author Крайнов Дмитрий Олегович
         */
        'use strict';

        var DropdownListMixin = /**@lends SBIS3.CONTROLS.DropdownListMixin.prototype  */{
            $protected: {
                _options: {
                   /**
                    * @cfg {Boolean} Обрабатывать двойной клик по элементу коллекции
                    */
                   allowDblClick: true,
                   /**
                    * @cfg {} Шаблон отображения каждого элемента коллекции
                    */
                    itemTemplate: ''
                }
            },

            $constructor: function () {
                if (!this._options.displayField) {
                     //По умолчанию отображаемое поле - 'title'
                    this._options.displayField = 'title';
                }
            },

            _getItemTemplate: function (item) {
                var title = item.get(this._options.displayField);
                if (this._options.itemTemplate) {
                    return TemplateUtil.prepareTemplate(this._options.itemTemplate).call(this, {
                       item: item,
                       title: title,
                       multiselect : this._options.multiselect,
                       included : this._buildIncluded()
                    })
                }
                else {
                    return '<div>' + title + '</div>';
                }
            },

            // Метод собирающий вложенные шаблоны
            // Он должен отрабатывать на уровне DSMixin,
            // но вызов функции-шаблона DropdownList происходит здесь,
            // поэтому чтобы не ломать логику работы и вследствии того, что DSMixin нужно выпилить
            // добавил метод сюда
            _buildIncluded: function() {
                var included;
                if (this._options.includedTemplates) {
                    var tpls = this._options.includedTemplates;
                    included = {};
                    for (var j in tpls) {
                        if (tpls.hasOwnProperty(j)) {
                            included[j] = TemplateUtil.prepareTemplate(tpls[j]);
                        }
                    }
                }
                return included;
            },

            _bindItemSelect: function () {
                this._picker.getContainer().bind('mouseup', this._clickItemHandler.bind(this));
                this._picker.getContainer().bind('dblclick', this._dblClickItem.bind(this));
            },
           _clickItemHandler : function (e) {
              var row = $(e.target).closest('.' + self._getItemClass());
              if (row.length && (e.button === ($ws._const.browser.isIE8 ? 1 : 0))) {
                 self.setSelectedKeys([row.data('id')]);
                 self.hidePicker();
              }
            },
           _dblClickItem : function(e){
              if (this._options.allowDblClick){
                 this._dblClickItemHandler(e);
              }
           },
           _dblClickItemHandler : function(e){
              e.stopImmediatePropagation();
              /*Method can be implemented*/
           },
           _getItemClass: function() {
                /*Method must be implemented*/
           }
        };

        return DropdownListMixin;
    });
