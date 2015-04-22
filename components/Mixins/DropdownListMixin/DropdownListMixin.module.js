/**
 * Created by iv.cheremushkin on 21.04.2015.
 */
define('js!SBIS3.CONTROLS.DropdownListMixin', [],
    function () {
        /**
         * ������, ����������� ��������� �������� ������ ��� ���������� ��������� ���������
         * @mixin SBIS3.CONTROLS.MenuButtonMixin
         * @public
         */
        'use strict';

        var DropdownListMixin = /**@lends SBIS3.CONTROLS.MenuButtonMixin.prototype  */{
            $protected: {
                _options: {
                    /**
                     * @cfg {} ������ ����������� ������� ��������
                     */
                    itemTemplate: ''
                }
            },

            $constructor: function () {
                if (!this._options.displayField) {
                    //�� ��������� ������������ ���� - 'title'
                    this._options.displayField = 'title';
                }
            },

            _getItemTemplate: function (item) {
                var title = item.get(this._options.displayField);
                if (this._options.itemTemplate) {
                    return this._options.itemTemplate.call(this, {item: item, title: title})
                }
                else {
                    return '<div>' + title + '</div>';
                }
            },

            _getItemClass: function() {
                /*Method must be implemented*/
            },

            around: {
                _clearItems : function(parentClearItems) {
                    if (this._picker) {
                        parentClearItems.call(this, this._picker.getContainer());
                    }
                }
            },

            before: {
                _setPickerContent: function () {
                    var self = this;
                    //�������� ������
                    this.reload();
                    //TODO ��������� ��� �� ���������� � ��������
                    this._picker.getContainer().mousedown(function (e) {
                        e.stopPropagation();
                    });
                    this._picker.getContainer().bind('mouseup', function (e) {
                        var row = $(e.target).closest('.' + self._getItemClass());
                        if (row.length) {
                            self.setSelectedItems([row.data('id')]);
                            self.hidePicker();
                        }
                    });
                }
            }
        };

        return DropdownListMixin;
    });

