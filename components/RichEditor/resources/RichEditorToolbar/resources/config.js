define('js!SBIS3.CONTROLS.RichEditorToolbar/resources/config',
   [
      'js!SBIS3.CONTROLS.RichTextArea/resources/smiles',
      'i18n!SBIS3.CONTROLS.RichEditor'
   ], function (smiles) {

   'use strict';

   var
      onButtonClick = function() {
         this.getParent()._execCommand(this._options.name);
      };

   return [
       {
         name: 'undo',
         componentType: 'SBIS3.CONTROLS.Button',
         tooltip: rk('Шаг назад'),
         icon: 'sprite:icon-16 icon-Undo2 icon-primary',
         handlers: {
            onActivated: onButtonClick
         },
         enabled: false
      },

      {
         name: 'redo',
         componentType: 'SBIS3.CONTROLS.Button',
         tooltip: rk('Шаг вперед'),
         icon: 'sprite:icon-16 icon-Redo2 icon-primary',
         handlers: {
            onActivated: onButtonClick
         },
         enabled: false
      },

      {
         name: 'style',
         componentType: 'SBIS3.CONTROLS.RichEditor.RichEditorDropdown',
         items: [
            { key: 'title', title: rk('Заголовок') },
            { key: 'subTitle', title: rk('Подзаголовок') },
            { key: 'mainText', title: rk('Основной текст') },
            { key: 'additionalText', title: rk('Дополнительный текст') },
            { key: 'selectedMainText', title: rk('Выделенный основной текст') }
         ],
         selectedKeys: ['mainText'],
         pickerClassName: 'fre-style',
         className: 'fre-style',
         handlers: {
            onSelectedItemsChange: function(e, key) {
               this.getParent()._setFontStyle(key[0]);
            }
         }
      },

      {
         name: 'bold',
         componentType: 'SBIS3.CONTROLS.ToggleButton',
         tooltip: rk('Полужирный'),
         icon: 'sprite:icon-16 icon-Bold icon-primary',
         handlers: {
            onActivated: onButtonClick
         }
      },

      {
         name: 'italic',
         componentType: 'SBIS3.CONTROLS.ToggleButton',
         tooltip: rk('Курсив'),
         icon: 'sprite:icon-16 icon-Italic icon-primary',
         handlers: {
            onActivated: onButtonClick
         }
      },

      {
         name: 'underline',
         componentType: 'SBIS3.CONTROLS.ToggleButton',
         tooltip: rk('Подчеркнутый'),
         icon: 'sprite:icon-16 icon-Underline icon-primary',
         handlers: {
            onActivated: onButtonClick
         }
      },

      {
         name: 'strikethrough',
         componentType: 'SBIS3.CONTROLS.ToggleButton',
         tooltip: rk('Зачеркнутый'),
         icon: 'sprite:icon-16 icon-Stroked icon-primary',
         handlers: {
            onActivated: onButtonClick
         }
      },

      {
         name: 'align',
         componentType: 'SBIS3.CONTROLS.RichEditor.RichEditorDropdown',
         tooltip: rk('Выравнивание текста'),
         items: [
            { key: 'alignleft', title: rk('По левому краю'), icon: 'icon-16 icon-AlignmentLeft icon-primary'},
            { key: 'aligncenter', title: rk('По центру'), icon: 'icon-16 icon-AlignmentCenter icon-primary'},
            { key: 'alignright', title: rk('По правому краю'), icon: 'icon-16 icon-AlignmentRight icon-primary'},
            { key: 'alignjustify', title: rk('По ширине'), icon: 'icon-16 icon-AlignmentWidth icon-primary'}
         ],
         selectedKeys: ['alignleft'],
         pickerClassName: 'fre-align',
         className: 'fre-align',
         handlers: {
            onSelectedItemsChange: function(event, key) {
               this.getParent()._setTextAlign(key[0]);
            }
         }
      },

      {
         name: 'color',
         componentType: 'SBIS3.CONTROLS.RichEditor.RichEditorMenuButton',
         tooltip: rk('Цвет текста'),
         withoutHeader: true,
         icon: 'sprite:icon-16 icon-TextColor icon-primary',
         className: 'fre-color',
         pickerClassName: 'fre-color',
         items: [
            { key: 'black', value: rk('Черный'), title: '<div  unselectable ="on" class="controls-RichEditorToolbar__color controls-RichEditorToolbar__colorBlack"></div>'},
            { key: 'red', value: rk('Красный'), title: '<div  unselectable ="on" class="controls-RichEditorToolbar__color controls-RichEditorToolbar__colorRed"></div>' },
            { key: 'green', value: rk('Зеленый'),title: '<div  unselectable ="on" class="controls-RichEditorToolbar__color controls-RichEditorToolbar__colorGreen"></div>' },
            { key: 'blue', value: rk('Синий'),  title: '<div  unselectable ="on" class="controls-RichEditorToolbar__color controls-RichEditorToolbar__colorBlue"></div>' },
            { key: 'purple', value: rk('Пурпурный'), title: '<div  unselectable ="on" class="controls-RichEditorToolbar__color controls-RichEditorToolbar__colorPurple"></div>' },
            { key: 'grey', value: rk('Серый'), title: '<div  unselectable ="on" class="controls-RichEditorToolbar__color controls-RichEditorToolbar__colorGrey"></div>' }
         ],
         handlers: {
            onMenuItemActivate: function(event, key) {
               this.getParent()._setFontColor(key);
            }
         }
      },

      {
         name: 'list',
         componentType: 'SBIS3.CONTROLS.RichEditor.RichEditorMenuButton',
         tooltip: rk('Вставить/Удалить список'),
         withoutHeader: true,
         pickerClassName: 'fre-list',
         icon   : 'sprite:icon-16 icon-ListMarked icon-primary',
         items: [
            { key: 'InsertUnorderedList', title: ' ', icon:'sprite:icon-16 icon-ListMarked icon-primary' },
            { key: 'InsertOrderedList', title: ' ',icon:'sprite:icon-16 icon-ListNumbered icon-primary' }
         ],
         handlers: {
            onMenuItemActivate: function(event, key) {
               this.getParent()._execCommand(key);
            }
         }
      },

      {
         name: 'link',
         componentType: 'SBIS3.CONTROLS.ToggleButton',
         tooltip: rk('Вставить/редактировать ссылку'),
         icon: 'sprite:icon-16 icon-Link icon-primary',
         handlers:{
            onActivated: function(){
               this.setChecked(true);
               this.getParent()._insertLink(function(){
                  this.setChecked(false);
               }.bind(this), this._container);
            }
         }
      },

      {
         name: 'unlink',
         componentType: 'SBIS3.CONTROLS.Button',
         tooltip: rk('Убрать ссылку'),
         icon: 'sprite:icon-16 icon-Unlink icon-primary',
         handlers: {
            onActivated: onButtonClick
         },
         enabled: false
      },

      {
         name: 'image',
         componentType: 'SBIS3.CONTROLS.Button',
         tooltip: rk('Вставить картинку'),
         icon: 'sprite:icon-16 icon-Picture icon-primary',
         handlers: {
            onActivated: function(event, originalEvent) {
               this.getParent()._selectFile(originalEvent);
            }
         }
      },

      {
         name: 'smile',
         componentType: 'SBIS3.CONTROLS.RichEditor.RichEditorMenuButton',
         icon: 'sprite:icon-16 icon-EmoiconSmile icon-primary',
         pickerClassName: 'fre-smiles',
         className: 'fre-smiles',
         items: smiles,
         handlers: {
            onMenuItemActivate: function(event, key) {
               this.getParent()._insertSmile(key);
            }
         },
         visible: false
      },

      {
         name: 'paste',
         componentType: 'SBIS3.CONTROLS.ToggleButton',
         tooltip: rk('Вставить с учётом стилей'),
         icon: 'sprite:icon-16 icon-PasteStyle icon-primary',
         handlers: {
            onActivated: function() {
               var self = this;
               this.setChecked(true);
               this.getParent()._pasteFromBufferWithStyles(function() {
                  self.setChecked(false);
               }, this._container);
            }
         },
         visible: !$ws._const.browser.isMobilePlatform && !$ws._const.browser.isMacOSDesktop
      },

      {
         name: 'source',
         componentType: 'SBIS3.CONTROLS.ToggleButton',
         tooltip: rk('html-разметка'),
         icon: 'sprite:icon-16 icon-Html icon-primary',
         handlers: {
            onActivated: function() {
               this.getParent()._toggleContentSource();
            }
         }
      }
   ];
});